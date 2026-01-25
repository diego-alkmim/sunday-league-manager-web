import { api } from "./apiClient";

export type Match = {
  id: string;
  opponentName: string;
  date: string;
  competition?: { id: string; name: string };
  scoreFor?: number;
  scoreAgainst?: number;
  competitionId?: string | null;
  type?: string;
  location?: string | null;
  status?: string;
  lineups?: any[];
  attendance?: any[];
};

export type MatchEvent = {
  id: string;
  type: "goal" | "assist" | "yellow" | "red";
  minute?: number;
  scorerId?: string;
  assistId?: string;
  playerId?: string;
  scorer?: { id: string; name: string };
  assist?: { id: string; name: string };
  player?: { id: string; name: string };
};

export const fetchMatches = async (params?: {
  year?: number;
  take?: number;
  skip?: number;
}): Promise<Match[]> => {
  const res = await api.get("/matches", { params });
  return res.data;
};

export const fetchMatch = async (
  id: string,
): Promise<Match & { events: MatchEvent[] }> => {
  if (!id) throw new Error("match id required");
  const res = await api.get(`/matches/${id}`);
  return res.data;
};

export const createMatch = async (payload: {
  opponentName: string;
  date: string;
  competitionId?: string;
  location?: string;
  scoreFor?: number | null;
  scoreAgainst?: number | null;
  type: string;
}) => {
  const res = await api.post("/matches", payload);
  return res.data;
};

export const updateMatch = async (
  id: string,
  payload: Partial<Omit<Match, "id">>,
) => {
  const res = await api.patch(`/matches/${id}`, payload);
  return res.data;
};

export const deleteMatch = async (id: string) => {
  const res = await api.delete(`/matches/${id}`);
  return res.data;
};

export const addMatchEvent = async (
  matchId: string,
  payload: Partial<MatchEvent> & { type: MatchEvent["type"] },
) => {
  const res = await api.post(`/matches/${matchId}/events`, payload);
  return res.data;
};

export const setLineup = async (
  matchId: string,
  entries: {
    playerId: string;
    role: "starter" | "sub";
    inMinute?: number;
    outMinute?: number;
  }[],
) => {
  const res = await api.post(`/matches/${matchId}/lineup`, { entries });
  return res.data;
};

export const setAttendance = async (
  matchId: string,
  attendances: {
    playerId: string;
    status: "present" | "absent";
    note?: string;
  }[],
) => {
  const res = await api.post(`/matches/${matchId}/attendance`, { attendances });
  return res.data;
};
