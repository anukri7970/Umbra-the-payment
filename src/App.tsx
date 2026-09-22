import Layout from "./components/Layout";
import PayrollSplit from "./components/PayrollSplit";
import { useMidnight } from "./hooks/useMidnight";

export default function App() {
  const {
    mode,
    status,
    address,
    error,
    busy,
    pools,
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
        </div>
      </section>

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
