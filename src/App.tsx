import Layout from "./components/Layout";
import PayrollSplit from "./components/PayrollSplit";
import TxLink from "./components/TxLink";
import { useMidnight } from "./hooks/useMidnight";

export default function App() {
  const {
    mode,
    status,
    address,
    error,
    busy,
    pools,
    showPopup,
    is1AMInstalled,
    lastTxId,
    lastExplorerUrl,
    connect,
    disconnect,
    createPool,
    claimPayout,
  } = useMidnight();

  return (
    <Layout
      mode={mode}
      status={status}
      address={address}
      is1AMInstalled={is1AMInstalled}
      showPopup={showPopup}
      onConnect={connect}
      onDisconnect={disconnect}
    >
      <section className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-brass-400/80">
            Confidential payroll on Midnight
          </p>
          <h1 className="mt-3 max-w-xl font-display text-4xl leading-tight text-parchment sm:text-5xl">
            Paid in full.
            <br />
            Seen in part.
          </h1>
          <p className="mt-5 max-w-md text-parchment/60">
            Umbra lets a team split a payroll pool and prove every share adds
            up correctly — without putting a single salary, split, or bonus
            on a public ledger.
          </p>

          {/* 1AM wallet install prompt */}
          {status === "disconnected" && !is1AMInstalled && (
            <a
              href="https://1am.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-brass-500/30 px-4 py-2 text-sm text-brass-400 hover:border-brass-400 hover:text-brass-300 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Get the 1AM Wallet extension →
            </a>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-ink-800/50 p-6 font-mono text-sm">
          <p className="text-xs text-parchment/40">pool #04 · preview</p>
          <div className="mt-4 space-y-2 text-parchment/70">
            <div className="flex justify-between">
              <span>total committed</span>
              <span className="redacted">•••••••</span>
            </div>
            <div className="flex justify-between">
              <span>engineering split</span>
              <span className="redacted">••••</span>
            </div>
            <div className="flex justify-between">
              <span>design split</span>
              <span className="redacted">••••</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 text-parchment/90">
              <span>shares sum to total</span>
              <span className="text-umbral-green">proved ✓</span>
            </div>
          </div>

          {/* Network mode badge */}
          {mode === "network" && (
            <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <a
                href={`https://preprod.midnight.network/contract/${import.meta.env.VITE_CONTRACT_ADDRESS ?? ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400/70 hover:text-emerald-400 transition-colors"
              >
                Live on Midnight Preprod ↗
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Last transaction Explorer link */}
      {lastTxId && (
        <div className="mt-8">
          <TxLink
            txId={lastTxId}
            explorerUrl={lastExplorerUrl}
            label="Transaction confirmed"
          />
        </div>
      )}

      <div className="mt-20">
        <PayrollSplit
          connected={status === "connected"}
          busy={busy}
          error={error}
          pools={pools}
          onCreatePool={createPool}
          onClaimPayout={claimPayout}
        />
      </div>
    </Layout>
  );
}
