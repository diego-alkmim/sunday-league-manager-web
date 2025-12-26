import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPlayer, updatePlayer } from '../services/players.service';

export const useCreatePlayer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPlayer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
  });
};

export const useUpdatePlayer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name?: string; nickname?: string; position?: string; foot?: string; number?: number }) =>
      updatePlayer(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
  });
};
