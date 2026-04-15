import { useQuery, useMutation, useQueryClient,
         keepPreviousData }                           from '@tanstack/react-query';
import { centerGridService }                          from '../../../../services/center-grid.service';
import { serviceEscalationService }                   from '../../../../services/service-escalation.service';
import { projectService }                             from '../../../../services/project.service';
import type { CenterGridPayload,
              CenterCodeItem }                        from '../../../../services/center-grid.service';
import type { CenterGridFiltersState,
              CenterGridPagination }                  from '../store';

// ── Query keys ─────────────────────────────────────────────────────────────────

export const cgKeys = {
  all:      ['center-grids']                                         as const,
  list:     (f: object) => ['center-grids', 'list', f]              as const,
  detail:   (id: number) => ['center-grids', 'detail', id]          as const,
  services: (projectCode: string) =>
              ['center-grids', 'services', projectCode]             as const,
};

// ── List ───────────────────────────────────────────────────────────────────────

/**
 * Fetch a server-side filtered + paginated list of centre grids.
 * Query is disabled when no project codes are selected.
 */
export function useCenterGridList(
  filters:    CenterGridFiltersState,
  pagination: CenterGridPagination,
) {
  const projectCodes = Array.isArray(filters.projectCodes) ? filters.projectCodes : [];
  const centerCodes  = Array.isArray(filters.centerCodes)  ? filters.centerCodes  : [];
  const serviceNames = Array.isArray(filters.serviceNames) ? filters.serviceNames : [];

  return useQuery({
    queryKey: cgKeys.list({ ...filters, ...pagination }),
    queryFn:  async () => {
      // Guard: should not fire when no project selected, but double-check here
      if (projectCodes.length === 0) return null;
      const res = await centerGridService.getAll({
        page:         pagination.page,
        size:         pagination.size,
        ...(filters.search       && { search:       filters.search }),
        ...(projectCodes.length  && { projectCodes: projectCodes.join(',') }),
        ...(centerCodes.length   && { centerCodes:  centerCodes.join(',') }),
        ...(serviceNames.length  && { serviceNames: serviceNames.join(',') }),
      });
      return res.data.data;
    },
    enabled:          projectCodes.length > 0,
    placeholderData:  keepPreviousData,
  });
}

// ── Detail ─────────────────────────────────────────────────────────────────────

/**
 * Fetch a single centre grid by database ID.
 * GET /center-grids/{id}
 */
export function useCenterGridDetail(id: number | null) {
  return useQuery({
    queryKey: cgKeys.detail(id ?? 0),
    queryFn:  async () => {
      const res = await centerGridService.getById(id!);
      return res.data.data;
    },
    enabled: id != null && id > 0,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

/** Create a new centre grid. POST /center-grids */
export function useCreateCenterGrid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CenterGridPayload) => centerGridService.create(payload),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: cgKeys.all });
    },
  });
}

/** Update an existing centre grid. PUT /center-grids/{id} */
export function useUpdateCenterGrid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CenterGridPayload }) =>
      centerGridService.update(id, payload),
    onSuccess:  (_data, variables) => {
      qc.invalidateQueries({ queryKey: cgKeys.all });
      qc.invalidateQueries({ queryKey: cgKeys.detail(variables.id) });
    },
  });
}

/** Delete a centre grid by database ID. DELETE /center-grids/{id} */
export function useDeleteCenterGrid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => centerGridService.delete(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: cgKeys.all });
    },
  });
}

// ── Dropdown data ──────────────────────────────────────────────────────────────

/**
 * Services enabled for a specific project.
 * Used by CenterGridForm to populate the service-mapping dropdown.
 * Only fetches when modalOpen (or when projectCode changes while form is open).
 */
export function useProjectServices(projectCode: string | undefined, enabled = false) {
  return useQuery({
    queryKey: cgKeys.services(projectCode ?? ''),
    queryFn:  async () => {
      const res = await centerGridService.getProjectServices(projectCode!);
      // Deduplicate service names (a project can have the same service with multiple escalation types)
      const seen = new Set<string>();
      const names: string[] = [];
      for (const s of res.data.data ?? []) {
        if (!seen.has(s.serviceName)) { seen.add(s.serviceName); names.push(s.serviceName); }
      }
      return names.sort();
    },
    enabled:   !!projectCode && enabled,
    staleTime: 0,
    gcTime:    5 * 60_000,
  });
}

/**
 * Unique service names for one or more project codes.
 * Makes one request per project code in parallel, then deduplicates + sorts.
 * Used by the CentreGrid filter bar so services match the selected project(s).
 */
export function useServiceNamesByProjects(projectCodes: string[]) {
  const codes = Array.isArray(projectCodes) ? projectCodes : [];
  return useQuery({
    queryKey: ['center-grids', 'service-names-by-projects', codes],
    queryFn:  async () => {
      const results = await Promise.all(
        codes.map((pc) => centerGridService.getProjectServices(pc)),
      );
      const seen  = new Set<string>();
      const names: string[] = [];
      for (const res of results) {
        for (const s of res.data.data ?? []) {
          if (!seen.has(s.serviceName)) { seen.add(s.serviceName); names.push(s.serviceName); }
        }
      }
      return names.sort();
    },
    enabled:   codes.length > 0,
    staleTime: 0,
    gcTime:    5 * 60_000,
  });
}

/**
 * All unique active service names across all escalation configs.
 * Used by filter dropdowns where no project context is available.
 */
export function useActiveServiceNames() {
  return useQuery({
    queryKey: ['service-escalations', 'active-names'],
    queryFn:  async () => {
      const res = await serviceEscalationService.getAll({ active: true });
      const seen = new Set<string>();
      const names: string[] = [];
      for (const s of res.data.data ?? []) {
        if (!seen.has(s.serviceName)) { seen.add(s.serviceName); names.push(s.serviceName); }
      }
      return names.sort();
    },
    staleTime: 5 * 60_000,
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
 */
function truncateLabel(s: string, max = 30): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

export function useCenterCodesByProjects(projectCodes: string[] | undefined) {
  const codes = Array.isArray(projectCodes) ? projectCodes : [];
  return useQuery({
    queryKey: ['center-grids', 'codes', codes],
    queryFn:  async () => {
      const results = await Promise.all(
        codes.map((pc) => centerGridService.getCodes(pc)),
      );
      const seen = new Map<string, CenterCodeItem>();
      results
        .flatMap((r) => r.data.data ?? [])
        .forEach((item) => {
          if (!seen.has(item.centerCode)) seen.set(item.centerCode, item);
        });
      return [...seen.values()]
        .sort((a, b) => a.centerCode.localeCompare(b.centerCode))
        .map((item) => ({
          value: item.centerCode,
          label: `${item.centerCode} · ${truncateLabel(item.centerName)}`,
        }));
    },
    enabled:   codes.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}
