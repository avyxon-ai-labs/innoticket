import api from '../lib/api';

export interface TicketFilters {
  page?:     number;
  pageSize?: number;
  status?:   string;
  priority?: string;
  search?:   string;
  sortKey?:  string;
  sortDir?:  'asc' | 'desc';
}

/**
 * Ticket service — all ticket API calls go through here.
 * Never call api/axios directly from components or stores.
 */
export const ticketService = {
  getAll: (filters?: TicketFilters) =>
    api.get('/tickets', { params: filters }),

  getById: (id: string) =>
    api.get(`/tickets/${id}`),

  create: (data: unknown) =>
    api.post('/tickets', data),

  update: (id: string, data: unknown) =>
    api.patch(`/tickets/${id}`, data),

  delete: (id: string) =>
    api.delete(`/tickets/${id}`),
};
