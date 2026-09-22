import type { WalletStatus } from "../hooks/use1AMWallet";

type Props = {
  status: WalletStatus;
  address: string | null;
  is1AMInstalled: boolean;
  showPopup: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

export default function WalletConnect({
  status,
  address,
  is1AMInstalled,
  showPopup,
  onConnect,
  onDisconnect,
}: Props) {
  // ── Connected state ───────────────────────────────────────────────────────
  if (status === "connected" && address) {
    const truncated = address.length > 16
      ? `${address.slice(0, 8)}…${address.slice(-6)}`
      : address;

    return (
      <button
        id="wallet-disconnect-btn"
        onClick={onDisconnect}
        className="group flex items-center gap-2 rounded-full border border-brass-500/30 bg-ink-800 px-4 py-2 text-sm text-parchment/90 transition hover:border-umbral-rose/50 hover:text-umbral-rose"
        title={address}
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
        <span className="font-mono text-xs">{truncated}</span>
        <span className="text-parchment/40 text-xs group-hover:text-umbral-rose">
          disconnect
        </span>
      </button>
    );
  }

  // ── Connecting / popup shown ──────────────────────────────────────────────
  if (status === "connecting" || showPopup) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-brass-500/40 bg-ink-800 px-5 py-2">
        {/* Spinner */}
        <svg
          className="h-4 w-4 animate-spin text-brass-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm text-parchment/70">
          Waiting for 1AM wallet…
        </span>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <button
        id="wallet-connect-btn-retry"
        onClick={onConnect}
        className="flex items-center gap-2 rounded-full border border-red-500/50 bg-red-950/40 px-5 py-2 text-sm text-red-400 transition hover:border-red-400 hover:text-red-300"
      >
        <span className="h-2 w-2 rounded-full bg-red-500" />
        Retry connect
      </button>
    );
  }

  // ── Disconnected / default ────────────────────────────────────────────────
  return (
    <button
      id="wallet-connect-btn"
      onClick={onConnect}
      className="flex items-center gap-2 rounded-full bg-brass-500 px-5 py-2 text-sm font-semibold text-ink-950 shadow-lg transition hover:bg-brass-400 hover:shadow-brass-400/20 active:scale-95"
    >
      {/* 1AM wallet icon placeholder */}
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      {is1AMInstalled ? "Connect 1AM Wallet" : "Install 1AM Wallet"}
    </button>
  );
}
