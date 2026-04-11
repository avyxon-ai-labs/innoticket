import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService }                        from '../../../../services/project.service';
import type { ProjectFilters, ProjectPayload }   from '../../../../services/project.service';

// ── Query keys ─────────────────────────────────────────────────────────────────

export const projectKeys = {
  all:    ['projects']                                   as const,
  list:   (f?: ProjectFilters) =>
            ['projects', 'list', f ?? {}]               as const,
  detail: (id: number) =>
            ['projects', 'detail', id]                  as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

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
