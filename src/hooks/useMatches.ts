import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchMatch, fetchMatches } from '../services/matches.service';

export const useMatches = (params?: { year?: number; take?: number; skip?: number }) =>
  useQuery({ queryKey: ['matches', params?.year, params?.take, params?.skip], queryFn: () => fetchMatches(params) });

export const useMatch = (id?: string) =>
  useQuery({
    queryKey: ['matches', id],
    queryFn: () => fetchMatch(id as string),
    enabled: !!id,
  });

export const useInfiniteMatches = (year?: number, pageSize = 10) =>
  useInfiniteQuery({
    queryKey: ['matches', 'infinite', year],
    queryFn: ({ pageParam = 0 }) => fetchMatches({ year, take: pageSize, skip: pageParam }),
    getNextPageParam: (lastPage, allPages) => (lastPage.length === pageSize ? allPages.flat().length : undefined),
    initialPageParam: 0,
  });
