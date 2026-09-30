import type { Finding } from './types';

interface Props {
  finding: Finding;
  onInspect: (finding: Finding) => void;
}

export default function ReviewFindingButton({ finding, onInspect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onInspect(finding)}
      className="mt-3 w-full rounded border border-blue-500/50 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
      aria-label={`Inspect evidence and review finding ${finding.finding_id}`}
    >
      Inspect evidence &amp; review
    </button>
  );
}
