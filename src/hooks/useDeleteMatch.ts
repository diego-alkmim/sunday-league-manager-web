import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMatch } from '../services/matches.service';

export const useDeleteMatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMatch,
    onSuccess: (_, id) => {
      // Remove de todas as listas em cache (matches, matches with year, etc.)
      const lists = qc.getQueriesData<any>({ queryKey: ['matches'] });
      lists.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          qc.setQueryData(
            key,
            data.filter((m) => m.id !== id),
          );
        }
      });
      // Remove cache de detalhe e refetch para consistência
      qc.removeQueries({ queryKey: ['matches', id], exact: true });
      qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });
};
