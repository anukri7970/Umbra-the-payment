/* eslint-disable @typescript-eslint/no-explicit-any */
// ---------------------------------------------------------------------------
// contract.ts — Umbra on-chain contract integration
//
// Uses the @midnight-ntwrk/dapp-connector-api to connect to the 1AM wallet
// and the Midnight.js SDK to call the deployed Umbra Payroll contract on Preprod.
//
// Proof server: https://api-preprod.1am.xyz  (the 1AM ProofStation — required
//   for 1AM wallet compatibility; the default Midnight proof server produces
//   ZK proofs incompatible with 1AM wallet, causing Error 182)
//
// Explorer TX URL: https://explorer.1am.xyz/tx/${txId}?network=preprod
// ---------------------------------------------------------------------------

// @ts-ignore (module generated during build time by compact compiler)
import { contract as CompiledUmbraPayrollContract } from "../../preprod-deployment/contracts/src/managed/bboard/contract/index.js";

export type PoolSummary = {
  poolId: number;
  commitment: string;
  recipientCount: number;
  claimedCount: number;
  settled: boolean;
  payerTag: string;
  txId?: string;
  explorerUrl?: string;
};

export type CreatePoolInput = {
  totalAmount: number;
  shares: number[];
};

export type ClaimPayoutInput = {
  poolId: number;
  shareAmount: number;
  recipientIndex: number;
};

// ─── Network config ──────────────────────────────────────────────────────────
const PREPROD_INDEXER_HTTP  = "https://indexer.preprod.midnight.network/api/v4/graphql";
const PREPROD_INDEXER_WS    = "wss://indexer.preprod.midnight.network/api/v4/graphql/ws";
// CRITICAL: Use 1AM ProofStation — avoids Error 182 with default proof server
const ONEAM_PROOF_SERVER    = "https://api-preprod.1am.xyz";
const CONTRACT_ADDRESS      = import.meta.env.VITE_CONTRACT_ADDRESS ?? "";

export const RUNTIME_MODE: "local" | "network" = CONTRACT_ADDRESS ? "network" : "local";

// Explorer helpers
export function explorerTxUrl(txId: string): string {
  const clean = txId.replace(/^0x/, "");
  return `https://explorer.1am.xyz/tx/${clean}?network=preprod`;
}
export function explorerContractUrl(): string {
  return `https://preprod.midnight.network/contract/${CONTRACT_ADDRESS}`;
}
export function truncateHash(hash: string): string {
  if (!hash) return "—";
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

// ─── Crypto helpers (mirror Compact circuit hashes) ──────────────────────────
async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function commitmentHash(total: number, count: number, salt: string): Promise<string> {
  return sha256Hex(`pool:${total}:${count}:${salt}`);
}
export async function nullifierHash(poolId: number, index: number, walletTag: string, salt: string): Promise<string> {
  return sha256Hex(`claim:${poolId}:${index}:${walletTag}:${salt}`);
}

// ─── Local ledger simulator (mode 1 — no contract address set) ───────────────
type LocalPool = {
  poolId: number;
  commitment: string;
  recipientCount: number;
  claimedCount: number;
  payerTag: string;
  shares: number[];
};

class LocalLedger {
  private pools: LocalPool[] = [];
  private nullifiers = new Set<string>();

  async createPool(input: CreatePoolInput, walletTag: string): Promise<PoolSummary> {
    const sum = input.shares.reduce((a, b) => a + b, 0);
    if (sum !== input.totalAmount)
      throw new Error(`recipient shares must sum to pool total (got ${sum}, expected ${input.totalAmount})`);
    const salt = randomSalt();
    const commitment = await commitmentHash(input.totalAmount, input.shares.length, salt);
    const poolId = this.pools.length;
    const pool: LocalPool = { poolId, commitment, recipientCount: input.shares.length, claimedCount: 0, payerTag: walletTag, shares: input.shares };
    this.pools.push(pool);
    return this.toSummary(pool);
  }

  async claimPayout(input: ClaimPayoutInput, walletTag: string): Promise<PoolSummary> {
    const pool = this.pools[input.poolId];
    if (!pool) throw new Error("pool does not exist");
    if (pool.claimedCount >= pool.recipientCount) throw new Error("all shares for this pool are already claimed");
    if (pool.shares[input.recipientIndex] !== input.shareAmount) throw new Error("share amount does not match recipient index");
    const salt = randomSalt();
    const nullifier = await nullifierHash(input.poolId, input.recipientIndex, walletTag, salt);
    if (this.nullifiers.has(nullifier)) throw new Error("this share has already been claimed");
    this.nullifiers.add(nullifier);
    pool.claimedCount += 1;
    return this.toSummary(pool);
  }

  listPools(): PoolSummary[] { return this.pools.map((p) => this.toSummary(p)); }

  private toSummary(p: LocalPool): PoolSummary {
    return { poolId: p.poolId, commitment: p.commitment, recipientCount: p.recipientCount, claimedCount: p.claimedCount, settled: p.claimedCount === p.recipientCount, payerTag: p.payerTag };
  }
}

const localLedger = new LocalLedger();

// ─── Network mode — real on-chain calls via 1AM wallet ───────────────────────
let _providersCache: any = null;

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

async function getMidnightProviders(walletProvider: any) {
  if (_providersCache) return _providersCache;

  const [
    { indexerPublicDataProvider },
    { httpClientProofProvider },
    { levelPrivateStateProvider },
    { FetchZkConfigProvider },
    { setNetworkId },
  ] = await Promise.all([
    import("@midnight-ntwrk/midnight-js-indexer-public-data-provider"),
    import("@midnight-ntwrk/midnight-js-http-client-proof-provider"),
    import("@midnight-ntwrk/midnight-js-level-private-state-provider"),
    import("@midnight-ntwrk/midnight-js-fetch-zk-config-provider"),
    import("@midnight-ntwrk/midnight-js-network-id"),
  ]);

  setNetworkId("preprod");

  const zkConfigPath = `${window.location.origin}/managed/bboard`;
  const zkConfigProvider = new FetchZkConfigProvider(zkConfigPath, fetch.bind(window));

  // Use 1AM ProofStation — REQUIRED for 1AM wallet compatibility
  const proofProvider = httpClientProofProvider(ONEAM_PROOF_SERVER, zkConfigProvider as any);

  const publicDataProvider = indexerPublicDataProvider(PREPROD_INDEXER_HTTP, PREPROD_INDEXER_WS);

  const privateStateProvider = levelPrivateStateProvider({
    privateStateStoreName: "umbra-private-state",
    signingKeyStoreName: "umbra-private-state-signing-keys",
    privateStoragePasswordProvider: () => "TempPassword123!Secure",
    accountId: walletProvider?.coinPublicKey ?? "umbra-user",
  });

  _providersCache = {
    publicDataProvider,
    proofProvider,
    zkConfigProvider,
    privateStateProvider,
    walletProvider,
    midnightProvider: walletProvider,
  };

  return _providersCache;
}

async function getDeployedContract(walletProvider: any) {
  const [
    { findDeployedContract },
  ] = await Promise.all([
    import("@midnight-ntwrk/midnight-js-contracts"),
  ]);

  const providers = await getMidnightProviders(walletProvider);

  return findDeployedContract(providers, {
    contractAddress: CONTRACT_ADDRESS,
    compiledContract: CompiledUmbraPayrollContract,
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────
export async function createPool(
  input: CreatePoolInput,
  walletTag: string,
  walletProvider?: any
): Promise<PoolSummary> {
  if (RUNTIME_MODE === "local") {
    return localLedger.createPool(input, walletTag);
  }

  // Network mode — real on-chain transaction
  const contract = (await getDeployedContract(walletProvider)) as any;
  const salt = randomSalt();
  const saltBytes = hexToBytes(salt.padEnd(64, "0").slice(0, 64));

  const sharesAsU64 = new Array(32).fill(0n).map((_, i) =>
    i < input.shares.length ? BigInt(input.shares[i]) : 0n
  );

  // Call createPool circuit with private witnesses
  const result = await contract.callTx.createPool({
    privateState: {
      poolTotal: BigInt(input.totalAmount),
      recipientShares: sharesAsU64,
      recipientCount: input.shares.length,
      commitSalt: saltBytes,
      callerSecretKey: new Uint8Array(32),
      claimShareAmount: 0n,
      claimRecipientIndex: 0,
      claimSalt: new Uint8Array(32),
    },
  });

  const txId = (result.txHash || result.txId) as string;
  const poolId = Number(result.public?.poolCount ?? 0) - 1;
  const commitment = await commitmentHash(input.totalAmount, input.shares.length, salt);

  return {
    poolId,
    commitment,
    recipientCount: input.shares.length,
    claimedCount: 0,
    settled: false,
    payerTag: walletTag,
    txId,
    explorerUrl: explorerTxUrl(txId),
  };
}

export async function claimPayout(
  input: ClaimPayoutInput,
  walletTag: string,
  walletProvider?: any
): Promise<PoolSummary> {
  if (RUNTIME_MODE === "local") {
    return localLedger.claimPayout(input, walletTag);
  }

  const contract = (await getDeployedContract(walletProvider)) as any;
  const salt = randomSalt();
  const saltBytes = hexToBytes(salt.padEnd(64, "0").slice(0, 64));

  const result = await contract.callTx.claimPayout(BigInt(input.poolId), {
    privateState: {
      poolTotal: 0n,
      recipientShares: new Array(32).fill(0n),
      recipientCount: 0,
      commitSalt: new Uint8Array(32),
      callerSecretKey: new Uint8Array(32),
      claimShareAmount: BigInt(input.shareAmount),
      claimRecipientIndex: input.recipientIndex,
      claimSalt: saltBytes,
    },
  });

  const txId = (result.txHash || result.txId) as string;
  const claimedCount = Number(result.public?.poolClaimedCount?.get(BigInt(input.poolId)) ?? 0);
  const recipientCount = Number(result.public?.poolRecipientCount?.get(BigInt(input.poolId)) ?? 0);

  return {
    poolId: input.poolId,
    commitment: "",
    recipientCount,
    claimedCount,
    settled: claimedCount >= recipientCount,
    payerTag: walletTag,
    txId,
    explorerUrl: explorerTxUrl(txId),
  };
}

export function listPools(): PoolSummary[] {
  return RUNTIME_MODE === "local" ? localLedger.listPools() : [];
}
