
import { useCallback, useEffect, useRef, useState } from "react";

// ─── 1AM Wallet types ────────────────────────────────────────────────────────
// 1AM Wallet injects into window.midnight['1am'] (or 'oneam' / '1AM' variants).
// Matches the exact shape discovered in anshusingh97/Signet useLaceWallet.ts.

export interface InjectedConnectionResult {
  coinPublicKey?: string;
  address?: string;
  state?: { address?: string };
  getPublicKeys?: () => Promise<{ coinPublicKey?: string }>;
  [key: string]: unknown;
}

export interface InjectedWalletProvider {
  name?: string;
  icon?: string;
  apiVersion?: string;
  enable?: () => Promise<InjectedConnectionResult>;
  connect?: (networkId?: string) => Promise<InjectedConnectionResult>;
  isEnabled?: () => Promise<boolean>;
  isConnected?: () => Promise<boolean>;
  getProvingProvider?: () => unknown;
  [key: string]: unknown;
}

declare global {
  interface Window {
    midnight?: Record<string, InjectedWalletProvider>;
  }
}

export type WalletStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface WalletApi {
  coinPublicKey: string;
  address: string;
  provider: InjectedWalletProvider | InjectedConnectionResult;
}

// ─── localStorage persistence keys ───────────────────────────────────────────
const LS_CONNECTED = "umbra_wallet_connected";
const LS_ADDRESS   = "umbra_wallet_address";
const LS_PUBKEY    = "umbra_wallet_coinPublicKey";

// ─── Discover 1AM wallet from window.midnight ────────────────────────────────
function discover1AMProvider(): InjectedWalletProvider | null {
  if (typeof window === "undefined") return null;
  const m = window.midnight;
  if (!m) return null;

  // Try known keys first
  const direct = m["1am"] || m["oneam"] || m["1AM"];
  if (direct) return direct;

  // Fallback 1: scan all keys for name containing "1am"
  for (const key of Object.keys(m)) {
    const entry = m[key];
    if (
      key.toLowerCase().includes("1am") ||
      (entry?.name && String(entry.name).toLowerCase().includes("1am"))
    ) {
      return entry;
    }
  }

  // Fallback 2: grab the first available Midnight wallet (e.g. Nightly, Lace, mnl)
  const anyKey = Object.keys(m)[0];
  if (anyKey && m[anyKey]) {
    return m[anyKey];
  }

  return null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function use1AMWallet() {
  const [status, setStatus] = useState<WalletStatus>(() => {
    // Restore persisted session on mount
    try {
      return localStorage.getItem(LS_CONNECTED) === "true"
        ? "connected"
        : "disconnected";
    } catch {
      return "disconnected";
    }
  });

  const [address, setAddress] = useState<string | null>(() => {
    try { return localStorage.getItem(LS_ADDRESS); } catch { return null; }
  });

  const [coinPublicKey, setCoinPublicKey] = useState<string | null>(() => {
    try { return localStorage.getItem(LS_PUBKEY); } catch { return null; }
  });

  const [error, setError] = useState<string | null>(null);
  const [walletApi, setWalletApi] = useState<WalletApi | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const providerRef = useRef<InjectedWalletProvider | null>(null);

  // ── persist helpers ──────────────────────────────────────────────────────
  const persistSession = useCallback((addr: string, pubKey: string) => {
    try {
      localStorage.setItem(LS_CONNECTED, "true");
      localStorage.setItem(LS_ADDRESS, addr);
      localStorage.setItem(LS_PUBKEY, pubKey);
    } catch (e) {
      // ignore
    }
  }, []);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(LS_CONNECTED);
      localStorage.removeItem(LS_ADDRESS);
      localStorage.removeItem(LS_PUBKEY);
    } catch (e) {
      // ignore
    }
  }, []);

  // ── connect ──────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    setShowPopup(true);

    try {
      const provider = discover1AMProvider();

      if (!provider) {
        setShowPopup(false);
        setError(
          "1AM Wallet not found. Please install the 1AM browser extension and refresh."
        );
        setStatus("error");
        return;
      }

      providerRef.current = provider;

      // Call enable() / connect() — triggers the 1AM wallet popup
      let result: InjectedConnectionResult;
      if (typeof provider.enable === "function") {
        result = await provider.enable();
      } else if (typeof provider.connect === "function") {
        result = await provider.connect("preprod");
      } else {
        throw new Error("1AM wallet has no enable() or connect() method");
      }

      // Extract address + coinPublicKey from result
      let addr =
        result.address ||
        result.state?.address ||
        "";

      let pubKey = result.coinPublicKey || "";

      if (!pubKey && typeof result.getPublicKeys === "function") {
        const keys = await result.getPublicKeys();
        pubKey = keys.coinPublicKey || "";
      }

      if (!addr && pubKey) {
        addr = `${pubKey.slice(0, 8)}…${pubKey.slice(-6)}`;
      }

      if (!addr) {
        const keys = Object.keys(result || {}).join(", ");
        throw new Error(`Could not retrieve wallet address from 1AM wallet. Returned keys: [${keys}]`);
      }

      setAddress(addr);
      setCoinPublicKey(pubKey);
      setWalletApi({ coinPublicKey: pubKey, address: addr, provider: result });
      setStatus("connected");
      persistSession(addr, pubKey);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to connect 1AM wallet";
      window.alert("Connection Error: " + msg);
      setError(msg);
      setStatus("error");
      clearSession();
    } finally {
      setShowPopup(false);
    }
  }, [persistSession, clearSession]);

  // ── disconnect ───────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setAddress(null);
    setCoinPublicKey(null);
    setWalletApi(null);
    setStatus("disconnected");
    setError(null);
    clearSession();
    providerRef.current = null;
  }, [clearSession]);

  // ── auto-reconnect on refresh if session is persisted ────────────────────
  useEffect(() => {
    const persisted = localStorage.getItem(LS_CONNECTED) === "true";
    if (!persisted) return;

    // Poll briefly for wallet injection (extension may take a moment to inject)
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
      attempts++;
      const provider = discover1AMProvider();
      if (provider) {
        clearInterval(interval);
        // Silent re-enable to restore session without popup
        const tryReconnect = async () => {
          try {
            let result: InjectedConnectionResult = {};
            if (typeof provider.isEnabled === "function") {
              const enabled = await provider.isEnabled();
              if (!enabled) {
                // Session expired — clear and require manual reconnect
                clearSession();
                setStatus("disconnected");
                return;
              }
            }
            if (typeof provider.enable === "function") {
              result = await provider.enable();
            }
            const addr = result.address || result.state?.address || localStorage.getItem(LS_ADDRESS) || "";
            const pubKey = result.coinPublicKey || localStorage.getItem(LS_PUBKEY) || "";
            setAddress(addr);
            setCoinPublicKey(pubKey);
            setWalletApi({ coinPublicKey: pubKey, address: addr, provider: result });
            setStatus("connected");
          } catch {
            // Silently fail — user will see disconnected state and can reconnect manually
            clearSession();
            setStatus("disconnected");
          }
        };
        tryReconnect();
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        // Extension not found after polling — clear persisted state
        clearSession();
        setStatus("disconnected");
      }
    }, 300);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    status,
    address,
    coinPublicKey,
    error,
    walletApi,
    showPopup,
    connect,
    disconnect,
    is1AMInstalled: typeof window !== "undefined" ? !!discover1AMProvider() : false,
  };
}
