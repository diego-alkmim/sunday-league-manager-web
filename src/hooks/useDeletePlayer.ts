import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePlayer } from '../services/players.service';

export const useDeletePlayer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlayer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
  });
};
