import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceEscalationService }              from '../../../../services/service-escalation.service';
import type {
  ServiceEscalationFilters,
  ServiceEscalationPayload,
} from '../../../../services/service-escalation.service';

// ── Query keys ────────────────────────────────────────────────────────────────

export const seKeys = {
  all:    ['service-escalations']                        as const,
  list:   (f?: ServiceEscalationFilters) =>
            ['service-escalations', 'list', f ?? {}]    as const,
  detail: (id: number) =>
            ['service-escalations', 'detail', id]       as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useServiceEscalations(filters?: ServiceEscalationFilters) {
  return useQuery({
    queryKey: seKeys.list(filters),
    queryFn:  async () => {
      const res = await serviceEscalationService.getAll(filters);
      return res.data.data;
    },
  });
}

export function useServiceEscalationById(id: number | null) {
  return useQuery({
    queryKey: seKeys.detail(id!),
    queryFn:  async () => {
      const res = await serviceEscalationService.getById(id!);
      return res.data.data;
    },
    enabled: id != null,
  });
}

export function useCreateServiceEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServiceEscalationPayload) =>
      serviceEscalationService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: seKeys.all }),
  });
}

export function useUpdateServiceEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ServiceEscalationPayload }) =>
      serviceEscalationService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: seKeys.all }),
  });
}

export function useDeleteServiceEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => serviceEscalationService.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: seKeys.all }),
  });
}
