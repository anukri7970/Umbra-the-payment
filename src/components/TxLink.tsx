import { explorerTxUrl, truncateHash } from "../utils/contract";

type Props = {
  txId: string | null;
  explorerUrl?: string | null;
  label?: string;
};

/**
 * Renders a verifiable on-chain transaction link.
 * Opens the 1AM Explorer in a new tab.
 */
export default function TxLink({ txId, explorerUrl, label = "View on Explorer" }: Props) {
  if (!txId) return null;

  const url = explorerUrl ?? explorerTxUrl(txId);
  const display = truncateHash(txId);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(txId).catch(() => {});
  };

  return (
    <div
      id={`tx-link-${txId.slice(0, 8)}`}
      className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-900/10 px-4 py-2.5 text-sm"
    >
      {/* Green success dot */}
      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />

      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs text-parchment/50 uppercase tracking-wide">
          On-chain · Preprod
        </span>
        <div className="flex items-center gap-2">
          {/* Explorer link */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
            title={`Tx: ${txId}`}
          >
            {label}: {display}
          </a>

          {/* Copy button */}
          <button
            onClick={copyToClipboard}
            title="Copy full transaction ID"
            className="shrink-0 rounded p-0.5 text-parchment/30 hover:text-parchment/80 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* External link icon */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto shrink-0 text-parchment/30 hover:text-emerald-400 transition-colors"
        title="Open in 1AM Explorer"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  );
}
