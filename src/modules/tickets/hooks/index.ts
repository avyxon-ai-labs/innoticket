import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService }                         from '../../../services/ticket.service';
import { serviceEscalationService }              from '../../../services/service-escalation.service';
import type {
  TicketQueryParams,
  TicketCreatePayload,
  TicketStatusPayload,
} from '../../../services/ticket.service';
// Reuse project/service/center lookup hooks (same backend APIs, shared cache)
import {
  useActiveProjectCodes,
  useActiveServiceNames,
  useCenterCodesByProjects,
} from '../../configurations/center-grid/hooks';

// ── Query keys ────────────────────────────────────────────────────────────────

export const ticketKeys = {
  all:        ['tickets']                             as const,
  list:       (p: TicketQueryParams) =>
                ['tickets', 'list', p]               as const,
  detail:     (id: string) =>
                ['tickets', 'detail', id]            as const,
  events:     (id: string) =>
                ['tickets', 'events', id]            as const,
  myAssigned: ['tickets', 'my-assigned']             as const,
  myRaised:   ['tickets', 'my-raised']               as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

export function useTickets(params: TicketQueryParams) {
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn:  async () => {
      const res = await ticketService.getAll(params);
      return res.data.data;
    },
  });
}

export function useTicketById(id: string | null) {
  return useQuery({
    queryKey: ticketKeys.detail(id!),
    queryFn:  async () => {
      const res = await ticketService.getById(id!);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useTicketEvents(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ticketKeys.events(id!),
    queryFn:  async () => {
      const res = await ticketService.getEvents(id!);
      return res.data.data;
    },
    enabled: !!id && enabled,
    staleTime: 1000 * 30,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useRaiseTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TicketCreatePayload) => ticketService.create(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ticketKeys.all }),
  });
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TicketStatusPayload }) =>
      ticketService.updateStatus(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ticketKeys.all });
      qc.invalidateQueries({ queryKey: ticketKeys.detail(id) });
    },
  });
}

export function useUpdateTicketDescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, description }: { id: string; description: string }) =>
      ticketService.updateDescription(id, description),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ticketKeys.detail(id) });
    },
  });
}

export function useUploadAttachment() {
  return useMutation({
    mutationFn: (file: File) => ticketService.uploadFile(file),
  });
}

/**
 * Escalation types available for a given service name.
 * Calls GET /api/service-escalations?serviceName=X&active=true
 * and deduplicates the escalationType values.
 */
export function useEscalationTypesByService(serviceName: string | null) {
  return useQuery({
    queryKey: ['service-escalations', 'escalation-types', serviceName],
    queryFn:  async () => {
      const res   = await serviceEscalationService.getAll({ serviceName: serviceName!, active: true });
      const types = res.data.data.map((s) => s.escalationType);
      return [...new Set(types)].sort();
    },
    enabled:   !!serviceName,
    staleTime: 1000 * 60 * 5,
  });
}

// Re-export lookup hooks so ticket components only import from one place
export { useActiveProjectCodes, useActiveServiceNames, useCenterCodesByProjects };
