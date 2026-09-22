import { useCallback, useEffect, useState } from "react";
import { use1AMWallet } from "./use1AMWallet";
import {
  RUNTIME_MODE,
  type PoolSummary,
  createPool as createPoolCall,
  claimPayout as claimPayoutCall,
  listPools,
  explorerTxUrl,
  type CreatePoolInput,
  type ClaimPayoutInput,
} from "../utils/contract";

export type { WalletStatus } from "./use1AMWallet";

export function useMidnight() {
  const wallet = use1AMWallet();
  const [pools, setPools] = useState<PoolSummary[]>(() => listPools());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTxId, setLastTxId] = useState<string | null>(null);
  const [lastExplorerUrl, setLastExplorerUrl] = useState<string | null>(null);

  const refreshPools = useCallback(() => {
    setPools(listPools());
  }, []);

  const createPool = useCallback(
    async (input: CreatePoolInput) => {
      if (wallet.status !== "connected") throw new Error("Connect your 1AM wallet first");
      setBusy(true);
      setError(null);
      setLastTxId(null);
      setLastExplorerUrl(null);
      try {
        const summary = await createPoolCall(
          input,
          wallet.address ?? wallet.coinPublicKey ?? "unknown",
          wallet.walletApi?.provider
        );
        if (summary.txId) {
          setLastTxId(summary.txId);
          setLastExplorerUrl(summary.explorerUrl ?? explorerTxUrl(summary.txId));
        }
        refreshPools();
        return summary;
      } catch (err) {
        const message = err instanceof Error ? err.message : "createPool failed";
        setError(message);
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [wallet, refreshPools]
  );

  const claimPayout = useCallback(
    async (input: ClaimPayoutInput) => {
      if (wallet.status !== "connected") throw new Error("Connect your 1AM wallet first");
      setBusy(true);
      setError(null);
      setLastTxId(null);
      setLastExplorerUrl(null);
      try {
        const summary = await claimPayoutCall(
          input,
          wallet.address ?? wallet.coinPublicKey ?? "unknown",
          wallet.walletApi?.provider
        );
        if (summary.txId) {
          setLastTxId(summary.txId);
          setLastExplorerUrl(summary.explorerUrl ?? explorerTxUrl(summary.txId));
        }
        refreshPools();
        return summary;
      } catch (err) {
        const message = err instanceof Error ? err.message : "claimPayout failed";
        setError(message);
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [wallet, refreshPools]
  );

  useEffect(() => {
    refreshPools();
  }, [refreshPools]);

  return {
    mode: RUNTIME_MODE,
    status: wallet.status,
    address: wallet.address,
    coinPublicKey: wallet.coinPublicKey,
    error: wallet.error ?? error,
    busy,
    pools,
    showPopup: wallet.showPopup,
    is1AMInstalled: wallet.is1AMInstalled,
    lastTxId,
    lastExplorerUrl,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    createPool,
    claimPayout,
  };
}
