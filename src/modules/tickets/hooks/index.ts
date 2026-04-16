import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ticketService }                         from '../../../services/ticket.service';
import { serviceEscalationService }              from '../../../services/service-escalation.service';
import { centerGridService }                     from '../../../services/center-grid.service';
import { dashboardService }                      from '../../../services/dashboard.service';
import type { DashboardSummaryParams }           from '../../../services/dashboard.service';
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
    queryKey:        ticketKeys.list(params),
    queryFn:         async () => {
      const res = await ticketService.getAll(params);
      return res.data.data;
    },
    placeholderData: keepPreviousData,
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

export function useDashboardSummary(params: DashboardSummaryParams) {
  // Stable serialised key so object identity changes don't prevent cache hits
  const key = JSON.stringify(params);
  return useQuery({
    queryKey: ['dashboard', 'summary', key],
    queryFn:  async () => {
      const res = await dashboardService.getSummary(params);
      // Handle both envelope { data: {...} } and flat { open, ... } responses
      const raw = res.data as unknown as Record<string, unknown>;
      return (raw.data ?? raw) as import('../../../services/dashboard.service').DashboardSummary;
    },
    enabled:   !!params.projectCode,
    staleTime: 0,           // always re-fetch when filters change
    refetchOnWindowFocus: false,
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

export interface ServiceEscalationGroup {
  serviceName:    string;
  escalationTypes: string[];
}

/**
 * Fetches GET /api/service-escalations?active=true once and groups into
 * [{ serviceName, escalationTypes[] }] sorted alphabetically.
 */
export function useServiceEscalationGroups() {
  return useQuery({
    queryKey: ['service-escalations', 'grouped'],
    queryFn:  async () => {
      const res = await serviceEscalationService.getAll({ active: true });
      const map = new Map<string, Set<string>>();
      for (const item of res.data.data) {
        if (!map.has(item.serviceName)) map.set(item.serviceName, new Set());
        map.get(item.serviceName)!.add(item.escalationType);
      }
      const groups: ServiceEscalationGroup[] = [];
      for (const [serviceName, types] of map) {
        groups.push({ serviceName, escalationTypes: [...types].sort() });
      }
      return groups.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetches services enabled for a specific project via
 * GET /api/projects/services?projectCode={projectCode}
 * and groups them into [{ serviceName, escalationTypes[] }].
 * Disabled when projectCode is empty.
 * staleTime: 0 so a fresh fetch occurs each time the project changes.
 */
export function useProjectServiceGroups(projectCode: string | undefined) {
  return useQuery({
    queryKey: ['projects', 'services', 'grouped', projectCode ?? ''],
    queryFn:  async () => {
      const res = await centerGridService.getProjectServices(projectCode!);
      const map = new Map<string, Set<string>>();
      for (const item of res.data.data ?? []) {
        if (!map.has(item.serviceName)) map.set(item.serviceName, new Set());
        map.get(item.serviceName)!.add(item.escalationType);
      }
      const groups: ServiceEscalationGroup[] = [];
      for (const [serviceName, types] of map) {
        groups.push({ serviceName, escalationTypes: [...types].sort() });
      }
      return groups.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
    },
    enabled:   !!projectCode,
    staleTime: 0,
    gcTime:    5 * 60_000,
  });
}

/**
 * @deprecated Use useServiceEscalationGroups instead.
 * Escalation types available for a given service name (single-service fetch).
 */
export function useEscalationTypesByService(serviceName: string | null) {
  const { data: groups = [] } = useServiceEscalationGroups();
  return {
    data:      groups.find((g) => g.serviceName === serviceName)?.escalationTypes ?? [],
    isLoading: false,
  };
}

// Re-export lookup hooks so ticket components only import from one place
export { useActiveProjectCodes, useActiveServiceNames, useCenterCodesByProjects, useCenterDetailsByProject } from '../../configurations/center-grid/hooks';
