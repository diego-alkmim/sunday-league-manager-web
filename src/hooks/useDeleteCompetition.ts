import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCompetition } from '../services/competitions.service';

export const useDeleteCompetition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCompetition,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competitions'] }),
  });
};
