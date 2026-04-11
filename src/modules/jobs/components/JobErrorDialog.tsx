import { XCircle }          from 'lucide-react';
import { Modal }             from '../../../components/ui/Modal';
import { Button }            from '../../../components/ui/Button';
import { parseErrorDetails } from '../../../services/job.service';
import type { JobResponse }  from '../../../services/job.service';

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  job:     JobResponse | null;
  onClose: () => void;
}

export function JobErrorDialog({ job, onClose }: Props) {
  if (!job) return null;

  const structured = parseErrorDetails(job.errorDetails);

  return (
    <Modal
      open={!!job}
      onClose={onClose}
      size="xl"
      title="Error Details"
      description={job.message || `Job #${job.id} — ${job.jobType}`}
      footer={
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
        </div>
      }
    >
      {/* Summary banner */}
      {job.message && (
        <div className="flex items-center gap-2 rounded-[10px] bg-[#FEF2F2]
                        border border-[#FECACA] px-3 py-2.5 mb-4">
          <XCircle size={15} className="text-[#DC2626] shrink-0" />
          <p className="text-sm text-[#B91C1C] font-medium">{job.message}</p>
        </div>
      )}

      {/* Structured error table */}
      {structured ? (
        <div className="rounded-[12px] border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead className="sticky top-0 bg-[var(--ghost)] z-10">
                <tr>
                  {['Row', 'Column', 'Error', 'Invalid Value'].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-[0.65rem] font-semibold uppercase
                                 tracking-[0.05em] text-[var(--ink-light)] border-b border-[var(--border)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {structured.map((err, i) => (
                  <tr
                    key={i}
                    className="border-t border-[var(--border)] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                        {err.rowNumber}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-[var(--ink-mid)]">{err.column || '—'}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-[#B91C1C]">{err.errorMessage}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-xs text-[var(--ink-light)]">
                        {err.invalidValue ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 bg-[var(--ghost)] border-t border-[var(--border)]">
            <p className="text-[0.65rem] text-[var(--ink-light)]">
              {structured.length} error{structured.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
      ) : (
        /* Fallback: raw string */
        job.errorDetails && (
          <pre className="text-xs text-[#B91C1C] font-mono bg-[#FEF2F2] rounded-[10px]
                          border border-[#FECACA] p-3 whitespace-pre-wrap leading-relaxed
                          max-h-[360px] overflow-y-auto">
            {job.errorDetails}
          </pre>
        )
      )}
    </Modal>
  );
}
