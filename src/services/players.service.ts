import { api } from './apiClient';

export type Player = {
  id: string;
  name: string;
  nickname?: string;
  position: string;
  foot?: string;
  number?: number;
  teamId: string;
};

export const fetchPlayers = async (): Promise<Player[]> => {
  const res = await api.get('/players');
  return res.data;
};

export const createPlayer = async (payload: Omit<Player, 'id' | 'teamId'>) => {
  const res = await api.post('/players', payload);
  return res.data;
};

export const updatePlayer = async (id: string, payload: Partial<Omit<Player, 'id' | 'teamId'>>) => {
  const res = await api.patch(`/players/${id}`, payload);
  return res.data;
};

export const deletePlayer = async (id: string) => {
  const res = await api.delete(`/players/${id}`);
  return res.data;
};
