import type { WalletStatus } from "../hooks/useMidnight";

type Props = {
  status: WalletStatus;
  address: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
};

export default function WalletConnect({
  status,
  address,
  onConnect,
  onDisconnect,
}: Props) {
  if (status === "connected" && address) {
    return (
      <button
        onClick={onDisconnect}
        className="group flex items-center gap-2 rounded-full border border-brass-500/30 bg-ink-800 px-4 py-2 text-sm text-parchment/90 transition hover:border-umbral-rose/50 hover:text-umbral-rose"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-umbral-green" />
        <span className="font-mono text-xs">{address}</span>
        <span className="text-parchment/40 group-hover:text-umbral-rose">
          disconnect
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onConnect}
      disabled={status === "connecting"}
      className="rounded-full bg-brass-500 px-5 py-2 text-sm font-medium text-ink-950 transition hover:bg-brass-400 disabled:cursor-wait disabled:opacity-70"
    >
      {status === "connecting" ? "Connecting…" : "Connect wallet"}
    </button>
  );
}
