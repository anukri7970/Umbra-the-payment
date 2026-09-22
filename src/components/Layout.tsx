import type { ReactNode } from "react";
import type { WalletStatus } from "../hooks/use1AMWallet";
import WalletConnect from "./WalletConnect";

type Props = {
  children: ReactNode;
  mode: "local" | "network";
  status: WalletStatus;
  address: string | null;
  is1AMInstalled: boolean;
  showPopup: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

function EclipseMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="10" fill="#C9A227" />
      <circle cx="18" cy="12" r="10" fill="#10131F" />
    </svg>
  );
}

export default function Layout({
  children,
  mode,
  status,
  address,
  is1AMInstalled,
  showPopup,
  onConnect,
  onDisconnect,
}: Props) {
  return (
    <div className="min-h-screen bg-ink-900">
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <EclipseMark />
            <div>
              <p className="font-display text-lg leading-none text-parchment">
                Umbra
              </p>
              <p className="text-xs leading-none text-parchment/45">
                confidential payroll
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-parchment/50 sm:inline-block">
              {mode === "local" ? "local demo ledger" : "preprod"}
            </span>
            <WalletConnect
              status={status}
              address={address}
              is1AMInstalled={is1AMInstalled}
              showPopup={showPopup}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-14">{children}</main>

      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 text-xs text-parchment/40 sm:flex-row sm:items-center sm:justify-between">
          <p>Built on Midnight (Compact) for the Builder Challenge.</p>
          <div className="flex gap-4">
            <a
              className="hover:text-brass-400"
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              className="hover:text-brass-400"
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
            >
              X / Twitter
            </a>
            <a
              className="hover:text-brass-400"
              href="https://docs.midnight.network"
              target="_blank"
              rel="noreferrer"
            >
              Midnight docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
