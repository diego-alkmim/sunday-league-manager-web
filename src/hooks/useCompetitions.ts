import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCompetition, fetchCompetitions, updateCompetition } from '../services/competitions.service';

export const useCompetitions = () => useQuery({ queryKey: ['competitions'], queryFn: fetchCompetitions });

export const useCreateCompetition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCompetition,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competitions'] }),
  });
};

export const useUpdateCompetition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name?: string; type?: string }) => updateCompetition(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competitions'] }),
  });
};
