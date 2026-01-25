import { useParams } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { useMatch } from "../hooks/useMatches";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addMatchEvent,
  setAttendance,
  setLineup,
  updateMatch,
} from "../services/matches.service";
import { useEffect, useState } from "react";
import { usePlayers } from "../hooks/usePlayers";

export default function MatchDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useMatch(id);
  const { data: players } = usePlayers();
  const qc = useQueryClient();

  const [eventType, setEventType] = useState<
    "goal" | "assist" | "yellow" | "red"
  >("goal");
  const [minute, setMinute] = useState<number | undefined>(undefined);
  const [scorerId, setScorerId] = useState<string | undefined>();
  const [assistId, setAssistId] = useState<string | undefined>();
  const [cardPlayerId, setCardPlayerId] = useState<string | undefined>();
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [starters, setStarters] = useState<Set<string>>(new Set());
  const [scoreFor, setScoreFor] = useState<number | undefined>();
  const [scoreAgainst, setScoreAgainst] = useState<number | undefined>();

  useEffect(() => {
    if (data?.attendance) {
      const presentIds = data.attendance
        .filter((a: any) => a.status === "present")
        .map((a: any) => a.playerId);
      setPresent(new Set(presentIds));
    }
    if (data?.lineups) {
      const starterIds = data.lineups
        .filter((l: any) => l.role === "starter")
        .map((l: any) => l.playerId);
      setStarters(new Set(starterIds));
    }
    if (data?.scoreFor != null) setScoreFor(data.scoreFor as any);
    if (data?.scoreAgainst != null) setScoreAgainst(data.scoreAgainst as any);
  }, [data?.attendance, data?.lineups]);

  const eventMutation = useMutation({
    mutationFn: (payload: any) => addMatchEvent(id as string, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches", id] }),
  });

  const lineupMutation = useMutation({
    mutationFn: (entries: any[]) => setLineup(id as string, entries),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches", id] }),
  });

  const attendanceMutation = useMutation({
    mutationFn: (attendances: any[]) =>
      setAttendance(id as string, attendances),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches", id] }),
  });

  const scoreMutation = useMutation({
    mutationFn: () => updateMatch(id as string, { scoreFor, scoreAgainst }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches", id] }),
  });

  const addSimpleEvent = () => {
    eventMutation.mutate({
      type: eventType,
      minute: minute ? Number(minute) : undefined,
      scorerId: scorerId || undefined,
      assistId: assistId || undefined,
      playerId: cardPlayerId || undefined,
    });
  };

  const saveLineupExample = () => {
    if (!players) return;
    const entries = players.map((p) => ({
      playerId: p.id,
      role: starters.has(p.id) ? "starter" : "sub",
    }));
    lineupMutation.mutate(entries);
  };

  const saveAttendanceExample = () => {
    if (!players) return;
    const attendances = players.map((p) => ({
      playerId: p.id,
      status: present.has(p.id) ? "present" : "absent",
    }));
    attendanceMutation.mutate(attendances);
  };

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Jogo #{id}</h1>
      {isLoading && <div>Carregando...</div>}
      {error && (
        <div className="text-sm text-red-600">Erro ao carregar jogo</div>
      )}
      {data && (
        <>
          <Card title="Resumo">
            <div className="text-sm">
              Oponente: <strong>{data.opponentName}</strong>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span>Placar:</span>
              <input
                type="number"
                className="w-16 rounded border border-slate-300 px-2 py-1"
                value={scoreFor ?? ""}
                onChange={(e) =>
                  setScoreFor(
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
                placeholder="Nós"
              />
              <span>x</span>
              <input
                type="number"
                className="w-16 rounded border border-slate-300 px-2 py-1"
                value={scoreAgainst ?? ""}
                onChange={(e) =>
                  setScoreAgainst(
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
                placeholder="Eles"
              />
              <button
                onClick={() => scoreMutation.mutate()}
                className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Salvar placar
              </button>
            </div>
          </Card>
          <Card title="Eventos">
            <div className="flex items-center gap-2 pb-2">
              <select
                className="rounded border border-slate-300 px-2 py-1 text-sm"
                value={eventType}
                onChange={(e) => setEventType(e.target.value as any)}
              >
                <option value="goal">Gol</option>
                <option value="assist">Assistência</option>
                <option value="yellow">Amarelo</option>
                <option value="red">Vermelho</option>
              </select>
              {(eventType === "goal" || eventType === "assist") && (
                <select
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                  value={scorerId ?? ""}
                  onChange={(e) => setScorerId(e.target.value || undefined)}
                >
                  <option value="">Autor do gol</option>
                  {players?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              {eventType === "assist" && (
                <select
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                  value={assistId ?? ""}
                  onChange={(e) => setAssistId(e.target.value || undefined)}
                >
                  <option value="">Assistência</option>
                  {players?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              {(eventType === "yellow" || eventType === "red") && (
                <select
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                  value={cardPlayerId ?? ""}
                  onChange={(e) => setCardPlayerId(e.target.value || undefined)}
                >
                  <option value="">Jogador</option>
                  {players?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="number"
                className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                placeholder="Min"
                value={minute ?? ""}
                onChange={(e) =>
                  setMinute(e.target.value ? Number(e.target.value) : undefined)
                }
              />
              <button
                onClick={addSimpleEvent}
                className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Adicionar
              </button>
            </div>
            {data.events?.length === 0 && (
              <div className="text-sm text-slate-500">Sem eventos.</div>
            )}
            <ul className="space-y-1">
              {data.events?.map((ev) => (
                <li key={ev.id} className="text-sm">
                  {ev.minute ? `${ev.minute}' ` : ""} {ev.type}
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Escalação">
            <div className="text-sm text-slate-600 mb-2">
              Marque titulares; demais viram reservas.
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {players?.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={starters.has(p.id)}
                    onChange={(e) => {
                      const next = new Set(starters);
                      e.target.checked ? next.add(p.id) : next.delete(p.id);
                      setStarters(next);
                    }}
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
            <button
              onClick={saveLineupExample}
              className="rounded bg-slate-800 px-3 py-1 text-sm font-semibold text-white hover:bg-slate-900"
            >
              Salvar escalação
            </button>
          </Card>
          <Card title="Presenças">
            <div className="text-sm text-slate-600 mb-2">Marque presentes.</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {players?.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={present.has(p.id)}
                    onChange={(e) => {
                      const next = new Set(present);
                      e.target.checked ? next.add(p.id) : next.delete(p.id);
                      setPresent(next);
                    }}
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
            <button
              onClick={saveAttendanceExample}
              className="rounded bg-slate-800 px-3 py-1 text-sm font-semibold text-white hover:bg-slate-900"
            >
              Salvar presenças
            </button>
          </Card>
        </>
      )}
    </div>
  );
}
