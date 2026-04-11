import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { centerGridService }                     from '../../../../services/center-grid.service';
import { serviceEscalationService }              from '../../../../services/service-escalation.service';
import { projectService }                        from '../../../../services/project.service';
import type { CenterGridFilters, CenterGridPayload } from '../../../../services/center-grid.service';

// ── Query keys ─────────────────────────────────────────────────────────────────

export const cgKeys = {
  all:    ['center-grids']                              as const,
  list:   (f?: CenterGridFilters) =>
            ['center-grids', 'list', f ?? {}]           as const,
  detail: (id: number) =>
            ['center-grids', 'detail', id]              as const,
};

// ── List / Detail ─────────────────────────────────────────────────────────────

export function useCenterGrids(filters?: CenterGridFilters) {
  return useQuery({
    queryKey: cgKeys.list(filters),
    queryFn:  async () => {
      const res = await centerGridService.getAll(filters);
      return res.data.data;
    },
  });
}

export function useCenterGridById(id: number | null) {
  return useQuery({
    queryKey: cgKeys.detail(id!),
    queryFn:  async () => {
      const res = await centerGridService.getById(id!);
      return res.data.data;
    },
    enabled: id != null,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateCenterGrid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CenterGridPayload) => centerGridService.create(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: cgKeys.all }),
  });
}

export function useUpdateCenterGrid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CenterGridPayload }) =>
      centerGridService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: cgKeys.all }),
  });
}

export function useDeleteCenterGrid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => centerGridService.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: cgKeys.all }),
  });
}

// ── Dropdown data ─────────────────────────────────────────────────────────────

/** Active service names for service mapping dropdown */
export function useActiveServiceNames() {
  return useQuery({
    queryKey: ['service-escalations', 'active-names'],
    queryFn:  async () => {
      const res = await serviceEscalationService.getAll({ active: true });
      return res.data.data.map((s) => s.serviceName);
    },
    staleTime: 1000 * 60 * 5,
  });
}

/** Active project codes for project dropdown */
export function useActiveProjectCodes() {
  return useQuery({
    queryKey: ['projects', 'active-codes'],
    queryFn:  async () => {
      const res = await projectService.getAll({ status: 'ACTIVE', size: 500 });
      return res.data.data.content.map((p) => p.projectCode);
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Center codes for selected project codes.
 * Makes one request per project code in parallel, then deduplicates.
 * Disabled when projectCodes is empty.
 */
export function useCenterCodesByProjects(projectCodes: string[] | undefined) {
  const codes = Array.isArray(projectCodes) ? projectCodes : [];
  return useQuery({
    queryKey: ['center-grids', 'codes', codes],
    queryFn:  async () => {
      const results = await Promise.all(
        codes.map((pc) => centerGridService.getCodes(pc)),
      );
      const all = results.flatMap((r) => r.data.data ?? []);
      return [...new Set(all)].sort();
    },
    enabled:   codes.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}
