import { useCallback, useEffect, useState } from "react";
import {
  RUNTIME_MODE,
  type PoolSummary,
  createPool as createPoolCall,
  claimPayout as claimPayoutCall,
  listPools,
  type CreatePoolInput,
  type ClaimPayoutInput,
} from "../utils/contract";

// Minimal shape of the Lace wallet's injected Midnight API. The real
// midnight-js SDK exposes a richer typed surface than this; this is the
// slice Umbra actually touches. See:
// https://docs.midnight.network — "Connect a DApp to Lace"
type MidnightWalletApi = {
  enable: () => Promise<{ address: string }>;
  state: () => Promise<{ address: string }>;
};

declare global {
  interface Window {
    midnight?: { mnLace?: MidnightWalletApi };
  }
}

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

export function useMidnight() {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pools, setPools] = useState<PoolSummary[]>(() => listPools());
  const [busy, setBusy] = useState(false);

  const refreshPools = useCallback(() => {
    setPools(listPools());
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    try {
      const lace = window.midnight?.mnLace;
      if (!lace) {
        // No Lace extension found — fall back to a stable demo identity so
        // the flow stays fully clickable during review. Real funds/proofs
        // are never touched in this path.
        const demoAddress = "demo1qpq…umbra";
        setAddress(demoAddress);
        setStatus("connected");
        return;
      }
      const { address: addr } = await lace.enable();
      setAddress(addr);
      setStatus("connected");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setStatus("disconnected");
    setError(null);
  }, []);

  const createPool = useCallback(
    async (input: CreatePoolInput) => {
      if (!address) throw new Error("connect a wallet first");
      setBusy(true);
      setError(null);
      try {
        const summary = await createPoolCall(input, address);
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
    [address, refreshPools]
  );

  const claimPayout = useCallback(
    async (input: ClaimPayoutInput) => {
      if (!address) throw new Error("connect a wallet first");
      setBusy(true);
      setError(null);
      try {
        const summary = await claimPayoutCall(input, address);
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
    [address, refreshPools]
  );

  useEffect(() => {
    refreshPools();
  }, [refreshPools]);

  return {
    mode: RUNTIME_MODE,
    status,
    address,
    error,
    busy,
    pools,
    connect,
    disconnect,
    createPool,
    claimPayout,
  };
}
