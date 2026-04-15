import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ticketService }              from '../../../services/ticket.service';
import { TAB_STATUSES }               from '../../../services/ticket.service';
import { useMyWorkStore }             from '../store';

// Re-export lookup hooks so My Work components only import from one place
export {
  useActiveProjectCodes,
  useCenterCodesByProjects,
  useProjectServiceGroups,
} from '../../../modules/tickets/hooks';

// ── Query keys ────────────────────────────────────────────────────────────────

/**
 * Keys sit under ['tickets', 'my-work', …] so that
 * qc.invalidateQueries({ queryKey: ['tickets'] }) — fired by status mutations —
 * also refreshes My Work queries automatically.
 */
export const myWorkKeys = {
  all:  ['tickets', 'my-work']                          as const,
  list: (params: object) =>
          ['tickets', 'my-work', 'list', params]        as const,
};

// ── Main paginated query ──────────────────────────────────────────────────────

/**
 * Fetches GET /api/tickets scoped to the current user.
 * - workTab === 'ASSIGNED'  → adds assignedTo=username
 * - workTab === 'RAISED'    → adds raisedBy=username
 *
 * All filters & pagination come from useMyWorkStore.
 * `username` is the logged-in user's username (email).
 */
export function useMyWorkTickets(username: string) {
  const { workTab, activeTab, filters, pagination } = useMyWorkStore();

  const projectCode = typeof filters.projectCode === 'string' ? filters.projectCode : '';
  const centerCodes = Array.isArray(filters.centerCodes) ? filters.centerCodes : [];
  const services    = Array.isArray(filters.services)    ? filters.services    : [];

  const queryParams = {
    page:     pagination.page,
    size:     pagination.size,
    statuses: TAB_STATUSES[activeTab].join(','),
    // Scope by work tab
    ...(workTab === 'ASSIGNED' && { assignedTo: username }),
    ...(workTab === 'RAISED'   && { raisedBy:   username }),
    ...(workTab === 'MY_TEAM'  && { myTeam:     true     }),
    // Optional filters
    ...(projectCode        && { projectCodes: projectCode }),
    ...(filters.search     && { search:       filters.search }),
    ...(centerCodes.length && { centerCodes:  centerCodes.join(',') }),
    ...(services.length    && { services:     services.join(',') }),
  };

  return useQuery({
    queryKey:        myWorkKeys.list(queryParams),
    queryFn:         async () => {
      const res = await ticketService.getAll(queryParams);
      return res.data.data;
    },
    enabled:         !!username,
    placeholderData: keepPreviousData,
    staleTime:       0,
  });
}
