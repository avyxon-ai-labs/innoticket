import api from '../lib/api';
import type { ApiEnvelope } from './service-escalation.service';

export interface DashboardSummary {
  open:        number;
  inProgress:  number;
  resolved:    number;
  closed:      number;
  withdrawn:   number;
  rejected:    number;
  escalatedL1: number;
  escalatedL2: number;
  total:       number;
}

export interface DashboardSummaryParams {
  projectCode:      string;
  services?:        string; // CSV
  escalationTypes?: string; // CSV
  centreCodes?:     string; // CSV
}

export type AggregationDimension = 'state' | 'city' | 'centreCode';

export interface DashboardAggregationGroup {
  groupBy:     string;
  open:        number;
  inProgress:  number;
  resolved:    number;
  closed:      number;
  withdrawn:   number;
  rejected:    number;
  escalatedL1: number;
  escalatedL2: number;
  total:       number;
}

export interface DashboardAggregationParams {
  projectCode:      string;
  dimension?:       AggregationDimension;
  services?:        string; // CSV
  escalationTypes?: string; // CSV
  centreCodes?:     string; // CSV
}

export const dashboardService = {
  getSummary: (params: DashboardSummaryParams) =>
    api.get<ApiEnvelope<DashboardSummary>>('/dashboard/summary', { params }),

  getAggregation: (params: DashboardAggregationParams) =>
    api.get<ApiEnvelope<DashboardAggregationGroup[]>>('/dashboard/aggregation', { params }),
};
