import { api } from './apiClient';

export type StatRow = { id?: string; playerId?: string; count: number };

export const fetchTopScorers = async (year?: number): Promise<any[]> => {
  const res = await api.get('/stats/top-scorers', { params: { year } });
  return res.data;
};

export const fetchTopAssists = async (year?: number): Promise<any[]> => {
  const res = await api.get('/stats/top-assists', { params: { year } });
  return res.data;
};

export const fetchCards = async (year?: number): Promise<any[]> => {
  const res = await api.get('/stats/cards', { params: { year } });
  return res.data;
};
