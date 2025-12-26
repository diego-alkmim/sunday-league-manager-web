import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMatch, updateMatch } from '../services/matches.service';

export const useCreateMatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createMatch,
    onSuccess: (created) => {
      // Atualiza todas as listas em cache (por ano, etc.) e invalida para consistência
      const lists = qc.getQueriesData<any>({ queryKey: ['matches'] });
      lists.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          qc.setQueryData(key, [created, ...data]);
        }
      });
      qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });
};

export const useUpdateMatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; [key: string]: any }) => updateMatch(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });
};
