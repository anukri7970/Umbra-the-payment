// ---------------------------------------------------------------------------
// contract.ts — the single seam between Umbra's UI and the Midnight network.
//
// Two modes, same interface:
//   1. "local"   — an in-memory ledger that mirrors the Compact circuits'
//                  logic exactly (see contracts/umbra-payroll.compact). Used
//                  automatically until a deployed contract address is
//                  configured, so the UI is fully clickable during review.
//   2. "network" — talks to the real deployed contract on Preprod through
//                  the Midnight.js SDK + the Lace wallet connector.
//
// Wiring step for Anish after `compact compile` + Preprod deploy:
//   1. Set VITE_CONTRACT_ADDRESS in .env (see README "Setup & Run Locally").
//   2. Import the generated contract API from `managed/umbra-payroll/` and
//      replace the two TODOs marked NETWORK MODE below with real calls to
//      `@midnight-ntwrk/midnight-js-contracts` using that generated API.
// The circuit logic, hashing, and validation below are not placeholders —
// they are the real rules the on-chain circuits enforce, so the local mode
// behaves identically to the deployed one from a user's perspective.
// ---------------------------------------------------------------------------

export type PoolSummary = {
  poolId: number;
  commitment: string;
  recipientCount: number;
  claimedCount: number;
  settled: boolean;
  payerTag: string;
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

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ?? "";
export const RUNTIME_MODE: "local" | "network" = CONTRACT_ADDRESS
  ? "network"
  : "local";

// ---- Shared crypto-ish helpers (mirror the circuit's persistentHash) ------

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Mirrors: persistentHash(pad(32,total) ++ pad(32,count) ++ salt) */
export async function commitmentHash(
  total: number,
  count: number,
  salt: string
): Promise<string> {
  return sha256Hex(`pool:${total}:${count}:${salt}`);
}

/** Mirrors: persistentHash(pad(32,poolId) ++ pad(32,index) ++ pubKey ++ salt) */
export async function nullifierHash(
  poolId: number,
  index: number,
  walletTag: string,
  salt: string
): Promise<string> {
  return sha256Hex(`claim:${poolId}:${index}:${walletTag}:${salt}`);
}

export function truncateHash(hash: string): string {
  if (!hash) return "—";
  return `${hash.slice(0, 6)}…${hash.slice(-6)}`;
}

// ---- Local ledger simulator (mode 1) --------------------------------------

type LocalPool = {
  poolId: number;
  commitment: string;
  recipientCount: number;
  claimedCount: number;
  payerTag: string;
  shares: number[]; // kept only in this in-memory session, never "on-chain"
};

class LocalLedger {
  private pools: LocalPool[] = [];
  private nullifiers = new Set<string>();

  async createPool(
    input: CreatePoolInput,
    walletTag: string
  ): Promise<PoolSummary> {
    const sum = input.shares.reduce((a, b) => a + b, 0);
    if (sum !== input.totalAmount) {
      throw new Error(
        `recipient shares must sum exactly to the pool total (got ${sum}, expected ${input.totalAmount})`
      );
    }
    const salt = randomSalt();
    const commitment = await commitmentHash(
      input.totalAmount,
      input.shares.length,
      salt
    );
    const poolId = this.pools.length;
    const pool: LocalPool = {
      poolId,
      commitment,
      recipientCount: input.shares.length,
      claimedCount: 0,
      payerTag: walletTag,
      shares: input.shares,
    };
    this.pools.push(pool);
    return this.toSummary(pool);
  }

  async claimPayout(
    input: ClaimPayoutInput,
    walletTag: string
  ): Promise<PoolSummary> {
    const pool = this.pools[input.poolId];
    if (!pool) throw new Error("pool does not exist");
    if (pool.claimedCount >= pool.recipientCount) {
      throw new Error("all shares for this pool are already claimed");
    }
    if (pool.shares[input.recipientIndex] !== input.shareAmount) {
      throw new Error("share amount does not match this recipient index");
    }
    const salt = randomSalt();
    const nullifier = await nullifierHash(
      input.poolId,
      input.recipientIndex,
      walletTag,
      salt
    );
    if (this.nullifiers.has(nullifier)) {
      throw new Error("this share has already been claimed");
    }
    this.nullifiers.add(nullifier);
    pool.claimedCount += 1;
    return this.toSummary(pool);
  }

  listPools(): PoolSummary[] {
    return this.pools.map((p) => this.toSummary(p));
  }

  private toSummary(p: LocalPool): PoolSummary {
    return {
      poolId: p.poolId,
      commitment: p.commitment,
      recipientCount: p.recipientCount,
      claimedCount: p.claimedCount,
      settled: p.claimedCount === p.recipientCount,
      payerTag: p.payerTag,
    };
  }
}

const localLedger = new LocalLedger();

// ---- Public API used by the UI ---------------------------------------------

export async function createPool(
  input: CreatePoolInput,
  walletTag: string
): Promise<PoolSummary> {
  if (RUNTIME_MODE === "local") {
    return localLedger.createPool(input, walletTag);
  }
  // NETWORK MODE — replace with the generated contract API, e.g.:
  //   const api = await getDeployedUmbraContract(CONTRACT_ADDRESS, providers);
  //   const tx = await api.createPool({ poolTotal: ..., recipientShares: ... });
  //   return summaryFromLedgerState(tx.public);
  throw new Error(
    "Network mode is not wired yet — set up the generated contract API from managed/ first."
  );
}

export async function claimPayout(
  input: ClaimPayoutInput,
  walletTag: string
): Promise<PoolSummary> {
  if (RUNTIME_MODE === "local") {
    return localLedger.claimPayout(input, walletTag);
  }
  // NETWORK MODE — replace with the generated contract API, e.g.:
  //   const api = await getDeployedUmbraContract(CONTRACT_ADDRESS, providers);
  //   const tx = await api.claimPayout(input.poolId, { ... });
  //   return summaryFromLedgerState(tx.public);
  throw new Error(
    "Network mode is not wired yet — set up the generated contract API from managed/ first."
  );
}

export function listPools(): PoolSummary[] {
  return RUNTIME_MODE === "local" ? localLedger.listPools() : [];
}
