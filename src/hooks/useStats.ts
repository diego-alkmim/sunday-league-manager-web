import { useQuery } from '@tanstack/react-query';
import { fetchTopScorers, fetchTopAssists, fetchCards } from '../services/stats.service';

export const useTopScorers = (year?: number) =>
  useQuery({ queryKey: ['stats', 'scorers', year], queryFn: () => fetchTopScorers(year) });

export const useTopAssists = (year?: number) =>
  useQuery({ queryKey: ['stats', 'assists', year], queryFn: () => fetchTopAssists(year) });

export const useCards = (year?: number) =>
  useQuery({ queryKey: ['stats', 'cards', year], queryFn: () => fetchCards(year) });
