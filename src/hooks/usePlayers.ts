import { useQuery } from '@tanstack/react-query';
import { fetchPlayers } from '../services/players.service';

export const usePlayers = () => useQuery({ queryKey: ['players'], queryFn: fetchPlayers });
