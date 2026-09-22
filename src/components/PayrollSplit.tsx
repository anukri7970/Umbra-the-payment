import { useMemo, useState } from "react";
import type { PoolSummary, CreatePoolInput, ClaimPayoutInput } from "../utils/contract";
import { truncateHash } from "../utils/contract";

type Props = {
  connected: boolean;
  busy: boolean;
  error: string | null;
  pools: PoolSummary[];
  onCreatePool: (input: CreatePoolInput) => Promise<PoolSummary>;
  onClaimPayout: (input: ClaimPayoutInput) => Promise<PoolSummary>;
};

type Row = { id: number; amount: string };

let rowKey = 0;
function newRow(amount = ""): Row {
  rowKey += 1;
  return { id: rowKey, amount };
}

export default function PayrollSplit({
  connected,
  busy,
  error,
  pools,
  onCreatePool,
  onClaimPayout,
}: Props) {
  // ---- Create-pool form state ---------------------------------------------
  const [total, setTotal] = useState("10000");
  const [rows, setRows] = useState<Row[]>([
    newRow("6000"),
    newRow("2500"),
    newRow("1500"),
  ]);
  const [createNotice, setCreateNotice] = useState<string | null>(null);

  const shareSum = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
    [rows]
  );
  const totalNum = Number(total) || 0;
  const sumMatches = shareSum === totalNum && totalNum > 0;

  const addRow = () => setRows((r) => [...r, newRow()]);
  const removeRow = (id: number) =>
    setRows((r) => (r.length > 1 ? r.filter((row) => row.id !== id) : r));
  const updateRow = (id: number, amount: string) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, amount } : row)));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateNotice(null);
    if (!sumMatches) return;
    const summary = await onCreatePool({
      totalAmount: totalNum,
      shares: rows.map((r) => Number(r.amount) || 0),
    });
    setCreateNotice(
      `Pool #${summary.poolId} sealed — ${rows.length} recipients, total kept private.`
    );
  }

  // ---- Claim form state -----------------------------------------------------
  const [claimPoolId, setClaimPoolId] = useState("");
  const [claimIndex, setClaimIndex] = useState("0");
  const [claimAmount, setClaimAmount] = useState("");
  const [claimNotice, setClaimNotice] = useState<string | null>(null);

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setClaimNotice(null);
    const summary = await onClaimPayout({
      poolId: Number(claimPoolId),
      recipientIndex: Number(claimIndex),
      shareAmount: Number(claimAmount) || 0,
    });
    setClaimNotice(
      `Share proved and claimed from pool #${summary.poolId}. Amount stays between you and the circuit.`
    );
  }

  return (
    <div className="space-y-16">
      {/* ---- The two sides of the ledger --------------------------------- */}
      <div className="grid gap-10 lg:grid-cols-[1fr_auto_1fr]">
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-white/10 bg-ink-800/60 p-6"
        >
          <p className="text-xs uppercase tracking-wide text-parchment/45">
            Payer
          </p>
          <h2 className="mt-1 font-display text-2xl text-parchment">
            Seal a payout pool
          </h2>
          <p className="mt-2 text-sm text-parchment/55">
            Set a total and how it splits. The circuit proves the split sums
            to the total — only a commitment hash ever reaches the ledger.
          </p>

          <label className="mt-6 block text-sm text-parchment/70">
            Pool total
            <input
              type="number"
              min={0}
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-ink-900 px-3 py-2 font-mono text-parchment focus:border-brass-500"
            />
          </label>

          <div className="mt-4 space-y-2">
            {rows.map((row, i) => (
              <div key={row.id} className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-xs text-parchment/45">
                  recipient {i + 1}
                </span>
                <input
                  type="number"
                  min={0}
                  value={row.amount}
                  onChange={(e) => updateRow(row.id, e.target.value)}
                  placeholder="amount"
                  className="w-full rounded-md border border-white/10 bg-ink-900 px-3 py-1.5 font-mono text-sm text-parchment focus:border-brass-500"
                />
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="text-parchment/30 hover:text-umbral-rose"
                  aria-label="Remove recipient"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-3 text-sm text-brass-400 hover:text-brass-300"
          >
            + add recipient
          </button>

          <div className="mt-4 flex items-center justify-between text-xs">
            <span
              className={sumMatches ? "text-umbral-green" : "text-umbral-rose"}
            >
              shares sum to {shareSum} / {totalNum || 0}
            </span>
          </div>

          <button
            type="submit"
            disabled={!connected || !sumMatches || busy}
            className="mt-5 w-full rounded-md bg-brass-500 py-2.5 text-sm font-medium text-ink-950 transition hover:bg-brass-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Proving…" : "Seal pool"}
          </button>

          {!connected && (
            <p className="mt-3 text-xs text-parchment/40">
              Connect a wallet to seal a pool.
            </p>
          )}
          {createNotice && (
            <p className="mt-3 text-xs text-umbral-green">{createNotice}</p>
          )}
        </form>

        <div className="ledger-divider mx-auto hidden w-px lg:block" />

        <form
          onSubmit={handleClaim}
          className="rounded-lg border border-white/10 bg-ink-800/60 p-6"
        >
          <p className="text-xs uppercase tracking-wide text-parchment/45">
            Recipient
          </p>
          <h2 className="mt-1 font-display text-2xl text-parchment">
            Claim your share
          </h2>
          <p className="mt-2 text-sm text-parchment/55">
            Prove you belong to the pool and have not claimed before. Only a
            one-time nullifier is published — never your identity or amount.
          </p>

          <label className="mt-6 block text-sm text-parchment/70">
            Pool ID
            <input
              type="number"
              min={0}
              value={claimPoolId}
              onChange={(e) => setClaimPoolId(e.target.value)}
              placeholder="e.g. 0"
              className="mt-1 w-full rounded-md border border-white/10 bg-ink-900 px-3 py-2 font-mono text-parchment focus:border-brass-500"
            />
          </label>

          <label className="mt-4 block text-sm text-parchment/70">
            Your recipient index
            <input
              type="number"
              min={0}
              value={claimIndex}
              onChange={(e) => setClaimIndex(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-ink-900 px-3 py-2 font-mono text-parchment focus:border-brass-500"
            />
          </label>

          <label className="mt-4 block text-sm text-parchment/70">
            Your share amount (private witness)
            <input
              type="number"
              min={0}
              value={claimAmount}
              onChange={(e) => setClaimAmount(e.target.value)}
              placeholder="known only to you"
              className="mt-1 w-full rounded-md border border-white/10 bg-ink-900 px-3 py-2 font-mono text-parchment focus:border-brass-500"
            />
          </label>

          <button
            type="submit"
            disabled={!connected || !claimPoolId || busy}
            className="mt-5 w-full rounded-md border border-brass-500 py-2.5 text-sm font-medium text-brass-400 transition hover:bg-brass-500 hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Proving…" : "Prove & claim"}
          </button>

          {!connected && (
            <p className="mt-3 text-xs text-parchment/40">
              Connect a wallet to claim a share.
            </p>
          )}
          {claimNotice && (
            <p className="mt-3 text-xs text-umbral-green">{claimNotice}</p>
          )}
        </form>
      </div>

      {error && (
        <div className="rounded-md border border-umbral-rose/40 bg-umbral-rose/10 px-4 py-3 text-sm text-umbral-rose">
          {error}
        </div>
      )}

      {/* ---- Public ledger view -------------------------------------------- */}
      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-parchment">
            Public ledger
          </h2>
          <p className="text-xs text-parchment/40">
            what everyone can see — nothing more
          </p>
        </div>

        {pools.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 px-6 py-10 text-center text-sm text-parchment/40">
            No pools sealed yet. Seal one on the left to see the ledger fill
            in — amounts will stay redacted here even to you.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-800/80 text-xs uppercase tracking-wide text-parchment/45">
                <tr>
                  <th className="px-4 py-3 font-normal">Pool</th>
                  <th className="px-4 py-3 font-normal">Commitment</th>
                  <th className="px-4 py-3 font-normal">Recipients</th>
                  <th className="px-4 py-3 font-normal">Claimed</th>
                  <th className="px-4 py-3 font-normal">Total amount</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pools.map((pool) => (
                  <tr key={pool.poolId} className="bg-ink-900/40">
                    <td className="px-4 py-3 font-mono text-parchment/80">
                      #{pool.poolId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-parchment/50">
                      {truncateHash(pool.commitment)}
                    </td>
                    <td className="px-4 py-3 text-parchment/70">
                      {pool.recipientCount}
                    </td>
                    <td className="px-4 py-3 text-parchment/70">
                      {pool.claimedCount} / {pool.recipientCount}
                    </td>
                    <td className="px-4 py-3">
                      <span className="redacted">••••</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          pool.settled
                            ? "rounded-full bg-umbral-green/15 px-2 py-0.5 text-xs text-umbral-green"
                            : "rounded-full bg-brass-500/15 px-2 py-0.5 text-xs text-brass-400"
                        }
                      >
                        {pool.settled ? "settled" : "open"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
