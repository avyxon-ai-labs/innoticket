import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService }                        from '../../../../services/project.service';
import { serviceEscalationService }              from '../../../../services/service-escalation.service';
import type { ProjectFilters, ProjectPayload }   from '../../../../services/project.service';

// ── Query keys ─────────────────────────────────────────────────────────────────

export const projectKeys = {
  all:    ['projects']                          as const,
  list:   (f?: ProjectFilters) =>
            ['projects', 'list', f ?? {}]       as const,
  detail: (id: number) =>
            ['projects', 'detail', id]          as const,
};

// ── Project hooks ──────────────────────────────────────────────────────────────

export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn:  async () => {
      const res = await projectService.getAll(filters);
      return res.data.data;
    },
  });
}

export function useProjectById(id: number | null) {
  return useQuery({
    queryKey: projectKeys.detail(id!),
    queryFn:  async () => {
      const res = await projectService.getById(id!);
      return res.data.data;
    },
    enabled: id != null,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectPayload) => projectService.create(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProjectPayload }) =>
      projectService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectService.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

// ── Service escalation grouping (for project form) ────────────────────────────

/** One service name with all its active escalation types + default SLA values. */
export interface EscalationGroup {
  serviceName: string;
  escalations: {
    escalationType:   string;
    slaLevel1Minutes: number;
    slaLevel2Minutes: number;
  }[];
}

/**
 * Fetches active service escalation configs and groups them by service name.
 * Used by ProjectForm to show the service-snapshot selection UI.
 *
 * Pass `enabled: modalOpen` so the query fires (and re-fires) exactly when
 * the Add / Edit modal is open, always returning the latest active configs.
 */
export function useGroupedActiveEscalations(enabled = false) {
  return useQuery({
    queryKey: ['service-escalations', 'active-grouped'],
    queryFn:  async () => {
      const res = await serviceEscalationService.getAll({ active: true });
      const items = res.data.data ?? [];
      const map = new Map<string, EscalationGroup>();
      for (const item of items) {
        if (!map.has(item.serviceName)) {
          map.set(item.serviceName, { serviceName: item.serviceName, escalations: [] });
        }
        map.get(item.serviceName)!.escalations.push({
          escalationType:   item.escalationType,
          slaLevel1Minutes: item.slaLevel1Minutes ?? 0,
          slaLevel2Minutes: item.slaLevel2Minutes ?? 0,
        });
      }
      return Array.from(map.values()).sort((a, b) =>
        a.serviceName.localeCompare(b.serviceName),
      );
    },
    enabled,
    staleTime: 0,           // always re-fetch when modal opens
    gcTime:    5 * 60_000,  // keep result in cache for 5 min between opens
  });
}
