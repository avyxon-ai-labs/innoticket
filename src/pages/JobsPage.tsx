import { JobFilters }       from '../modules/jobs/components/JobFilters';
import { JobTable }         from '../modules/jobs/components/JobTable';
import { JobProgressPanel } from '../modules/jobs/components/JobProgressPanel';
import { useJobStore }      from '../modules/jobs/store';

export function JobsPage() {
  const { liveTracking } = useJobStore();

  return (
    <div className="flex flex-col gap-4">

      {/* ── 1. Title card ───────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-[var(--ink)] leading-tight">Jobs</h1>
          {liveTracking && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
                             text-[0.65rem] font-semibold bg-[#EFF6FF] text-[#1D4ED8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-[var(--ink-light)]">
          Audit log of all bulk operations with live progress tracking.
        </p>
      </div>

      {/* ── 2. Filters card ─────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] px-5 py-3">
        <JobFilters />
      </div>

      {/* ── 3. Table card ───────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] overflow-hidden flex flex-col">
        <JobTable flat />
      </div>

      {/* Live polling modal */}
      <JobProgressPanel />
    </div>
  );
}
