import { useQuery }          from '@tanstack/react-query';
import { dashboardService }  from '../../../services/dashboard.service';
import { serviceEscalationService } from '../../../services/service-escalation.service';
import type { DashboardSummaryParams,
              DashboardAggregationParams } from '../../../services/dashboard.service';
import {
  useActiveProjectCodes,
  useCenterCodesByProjects,
} from '../../configurations/center-grid/hooks';

// ── Summary ───────────────────────────────────────────────────────────────────

export function useDashboardSummary(params: DashboardSummaryParams) {
  const key = JSON.stringify(params);
  return useQuery({
    queryKey: ['dashboard', 'summary', key],
    queryFn:  async () => {
      const res = await dashboardService.getSummary(params);
      const raw = res.data as unknown as Record<string, unknown>;
      return (raw.data ?? raw) as import('../../../services/dashboard.service').DashboardSummary;
    },
    enabled:             !!params.projectCode,
    staleTime:           0,
    refetchOnWindowFocus: false,
  });
}

// ── Aggregation ───────────────────────────────────────────────────────────────

export function useDashboardAggregation(params: DashboardAggregationParams) {
  const key = JSON.stringify(params);
  return useQuery({
    queryKey: ['dashboard', 'aggregation', key],
    queryFn:  async () => {
      const res = await dashboardService.getAggregation(params);
      const raw = res.data as unknown as Record<string, unknown>;
      const data = (raw.data ?? raw) as import('../../../services/dashboard.service').DashboardAggregationGroup[];
      return Array.isArray(data) ? data : [];
    },
    enabled:             !!params.projectCode,
    staleTime:           0,
    refetchOnWindowFocus: false,
  });
}

// ── Service + Escalation groups ───────────────────────────────────────────────

export interface ServiceEscalationGroup {
  serviceName:     string;
  escalationTypes: string[];
}

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
      for (const [svc, types] of map)
        groups.push({ serviceName: svc, escalationTypes: [...types].sort() });
      return groups.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Re-export lookup hooks
export { useActiveProjectCodes, useCenterCodesByProjects };
