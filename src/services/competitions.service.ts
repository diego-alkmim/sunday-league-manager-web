import { api } from './apiClient';

export type Competition = { id: string; name: string; type: string };

export const fetchCompetitions = async (): Promise<Competition[]> => {
  const res = await api.get('/competitions');
  return res.data;
};

export const createCompetition = async (payload: { name: string; type: string }) => {
  const res = await api.post('/competitions', payload);
  return res.data;
};

export const updateCompetition = async (id: string, payload: { name?: string; type?: string }) => {
  const res = await api.patch(`/competitions/${id}`, payload);
  return res.data;
};

export const deleteCompetition = async (id: string) => {
  const res = await api.delete(`/competitions/${id}`);
  return res.data;
};
