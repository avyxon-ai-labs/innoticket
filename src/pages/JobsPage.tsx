import { JobFilters }       from '../modules/jobs/components/JobFilters';
import { JobTable }         from '../modules/jobs/components/JobTable';
import { JobProgressPanel } from '../modules/jobs/components/JobProgressPanel';
import { useJobStore }      from '../modules/jobs/store';

export function JobsPage() {
  const { liveTracking } = useJobStore();

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--ink)] leading-tight">
              Jobs
            </h1>
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
      </div>

      {/* Filters + Live toggle */}
      <JobFilters />

      {/* Table (bulk action bar is rendered inside the table itself) */}
      <div className="flex-1 min-h-0">
        <JobTable />
      </div>

      {/* Live polling modal */}
      <JobProgressPanel />
    </div>
  );
}
