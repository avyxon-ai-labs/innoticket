import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService }                            from '../../../services/job.service';
import type { JobSearchPayload }                 from '../../../services/job.service';

// ── Query keys ────────────────────────────────────────────────────────────────

export const jobKeys = {
  all:    ['jobs']                           as const,
  search: (p: JobSearchPayload) =>
            ['jobs', 'search', p]           as const,
  detail: (id: number) =>
            ['jobs', 'detail', id]          as const,
};

// ── Audit log (POST /search) ──────────────────────────────────────────────────

export function useJobSearch(payload: JobSearchPayload, liveTracking = false) {
  return useQuery({
    queryKey:        jobKeys.search(payload),
    queryFn:         async () => {
      const res = await jobService.search(payload);
      return res.data.data;
    },
    refetchInterval: liveTracking ? 5_000 : false,
  });
}

// ── Individual job — auto-polls every 2 s until terminal ─────────────────────

export function useJobPolling(id: number | null) {
  return useQuery({
    queryKey: jobKeys.detail(id!),
    queryFn:  async () => {
      const res = await jobService.getById(id!);
      return res.data.data;
    },
    enabled: id != null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return 2_000;
      return status === 'COMPLETED' || status === 'FAILED'
        ? false
        : 2_000;
    },
  });
}

// ── Bulk delete ───────────────────────────────────────────────────────────────

export function useDeleteJobBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => jobService.deleteBatch(ids),
    onSuccess:  () => qc.invalidateQueries({ queryKey: jobKeys.all }),
  });
}
