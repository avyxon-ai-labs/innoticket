import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { userService }                           from '../../../services/user.service';
import type { UserFilters, UserPayload }         from '../../../services/user.service';

// ── Query keys ─────────────────────────────────────────────────────────────────

export const userKeys = {
  all:    ['users']                              as const,
  list:   (f?: UserFilters) =>
            ['users', 'list', f ?? {}]           as const,
  detail: (id: number) =>
            ['users', 'detail', id]              as const,
  me:     ['users', 'me']                        as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey:        userKeys.list(filters),
    queryFn:         async () => {
      const res = await userService.getAll(filters);
      return res.data.data;
    },
    placeholderData: keepPreviousData, // keeps previous page visible while next page loads
  });
}

export function useUserById(id: number | null) {
  return useQuery({
    queryKey: userKeys.detail(id!),
    queryFn:  async () => {
      const res = await userService.getById(id!);
      return res.data.data;
    },
    enabled: id != null,
  });
}

export function useMe() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn:  async () => {
      const res = await userService.getMe();
      return res.data.data;
    },
    staleTime: 1000 * 60 * 10, // 10 min
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserPayload) => userService.create(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserPayload }) =>
      userService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}
