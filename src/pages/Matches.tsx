import { useEffect, useMemo, useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { useMatch, useInfiniteMatches } from "../hooks/useMatches";
import { useCompetitions } from "../hooks/useCompetitions";
import { useCreateMatch } from "../hooks/useMatchesMutations";
import { useDeleteMatch } from "../hooks/useDeleteMatch";
import { usePlayers } from "../hooks/usePlayers";
import {
  addMatchEvent,
  setLineup,
  updateMatch,
} from "../services/matches.service";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { formatMatchDate } from "../utils/date";

export default function Matches() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteMatches(undefined, 10);
  const matches = useMemo(() => data?.pages.flat() ?? [], [data]);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { data: competitions } = useCompetitions();
  const { data: players } = usePlayers();
  const createMatch = useCreateMatch();
  const deleteMatch = useDeleteMatch();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const teamName = useAuthStore((s) => s.user?.teamName ?? "Meu Time");
  const role = useAuthStore((s) => s.user?.role ?? "member");

  const [form, setForm] = useState({
    opponentName: "",
    date: "",
    location: "",
    competitionId: "",
    type: "friendly",
  });
  const [finalizingId, setFinalizingId] = useState<string | null>(null);
  const [scoreFor, setScoreFor] = useState<number | undefined>();
  const [scoreAgainst, setScoreAgainst] = useState<number | undefined>();
  const [eventType, setEventType] = useState<
    "goal" | "assist" | "yellow" | "red"
  >("goal");
  const [minute, setMinute] = useState<number | undefined>();
  const [scorerId, setScorerId] = useState<string | undefined>();
  const [assistId, setAssistId] = useState<string | undefined>();
  const [cardPlayerId, setCardPlayerId] = useState<string | undefined>();
  const [modalError, setModalError] = useState<string | null>(null);
  const [selectedStarters, setSelectedStarters] = useState<Set<string>>(
    new Set(),
  );
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());
  const [localEvents, setLocalEvents] = useState<any[]>([]);
  const [viewMatchId, setViewMatchId] = useState<string | null>(null);

  const matchDetail = useMatch(finalizingId || undefined);
  const viewMatchDetail = useMatch(viewMatchId || undefined);

  useEffect(() => {
    if (matchDetail.data) {
      setScoreFor(matchDetail.data.scoreFor ?? undefined);
      setScoreAgainst(matchDetail.data.scoreAgainst ?? undefined);
      const starters = new Set<string>();
      const subs = new Set<string>();
      matchDetail.data.lineups?.forEach((l: any) => {
        if (l.role === "starter") starters.add(l.playerId);
        if (l.role === "sub") subs.add(l.playerId);
      });
      setSelectedStarters(starters);
      setSelectedSubs(subs);
      setLocalEvents(matchDetail.data.events ?? []);
    }
    // sempre que abrir/fechar o modal, limpar mensagens de erro e inputs rápidos
    setModalError(null);
    setMinute(undefined);
    setScorerId(undefined);
    setAssistId(undefined);
    setCardPlayerId(undefined);
  }, [matchDetail.data]);

  const playerOptions = useMemo(() => players ?? [], [players]);
  const formatPlayer = (p: any) =>
    p?.nickname ? `${p.name} (${p.nickname})` : (p?.name ?? "Jogador");
  const selectedPlayers = useMemo(
    () =>
      playerOptions.filter(
        (p) => selectedStarters.has(p.id) || selectedSubs.has(p.id),
      ),
    [playerOptions, selectedStarters, selectedSubs],
  );
  const availablePlayers = useMemo(
    () =>
      playerOptions.filter(
        (p) => !selectedStarters.has(p.id) && !selectedSubs.has(p.id),
      ),
    [playerOptions, selectedStarters, selectedSubs],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMatch.mutate({
      opponentName: form.opponentName,
      date: form.date,
      location: form.location || undefined,
      competitionId: form.competitionId || undefined,
      type: form.type,
    });
    setForm({
      opponentName: "",
      date: "",
      location: "",
      competitionId: "",
      type: "friendly",
    });
  };

  const saveScore = useMutation({
    mutationFn: (payload?: any) =>
      updateMatch(finalizingId as string, {
        scoreFor,
        scoreAgainst,
        ...(payload || {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["matches", finalizingId] });
    },
  });

  const handleFinalize = async () => {
    const goals = localEvents.filter(
      (ev: any) => ev.type === "goal" || ev.type === "assist",
    ).length;
    if (scoreFor === undefined || scoreAgainst === undefined) {
      setModalError("Informe o placar antes de finalizar.");
      return;
    }
    if (goals !== scoreFor) {
      setModalError(
        "Total de gols nos eventos deve bater com o placar do time.",
      );
      return;
    }
    const entries = [...selectedStarters, ...selectedSubs].map((id) => ({
      playerId: id,
      role: selectedStarters.has(id) ? "starter" : "sub",
    })) as {
      playerId: string;
      role: "starter" | "sub";
      inMinute?: number;
      outMinute?: number;
    }[];
    // Envia apenas eventos novos (marcados como locais)
    const newEvents = localEvents.filter((ev: any) => ev.isLocal);
    for (const ev of newEvents) {
      await addMatchEvent(finalizingId as string, {
        type: ev.type,
        minute: ev.minute,
        scorerId: ev.scorerId,
        assistId: ev.assistId,
        playerId: ev.playerId,
      });
    }
    await setLineup(finalizingId as string, entries);
    const updatedMatch = await saveScore.mutateAsync({
      status: "finalized",
      scoreFor,
      scoreAgainst,
    } as any);

    // Atualiza caches sem disparar múltiplos refetches
    const lists = qc.getQueriesData<any>({ queryKey: ["matches"] });
    lists.forEach(([key, data]) => {
      if (data?.pages) {
        const newPages = data.pages.map((page: any[]) =>
          page.map((m) =>
            m.id === finalizingId
              ? {
                  ...m,
                  ...updatedMatch,
                  scoreFor,
                  scoreAgainst,
                  status: "finalized",
                }
              : m,
          ),
        );
        qc.setQueryData(key, { ...data, pages: newPages });
      } else if (Array.isArray(data)) {
        qc.setQueryData(
          key,
          data.map((m) =>
            m.id === finalizingId
              ? {
                  ...m,
                  ...updatedMatch,
                  scoreFor,
                  scoreAgainst,
                  status: "finalized",
                }
              : m,
          ),
        );
      }
    });
    qc.setQueryData(["matches", finalizingId], (old: any) =>
      old
        ? {
            ...old,
            ...updatedMatch,
            scoreFor,
            scoreAgainst,
            status: "finalized",
            events: localEvents,
          }
        : old,
    );

    setFinalizingId(null);
    setLocalEvents([]);
    setSelectedStarters(new Set());
    setSelectedSubs(new Set());
    setScoreFor(undefined);
    setScoreAgainst(undefined);
  };

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="space-y-6">
      {role === "owner" && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-8 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.10),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.18),transparent_40%)]" />
          <div className="relative flex flex-col gap-2 text-white">
            <h1 className="text-3xl font-semibold tracking-tight">Jogos</h1>
            <p className="text-sm text-slate-200">
              Planeje, finalize e revise seus confrontos.
            </p>
            <div className="mt-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
              <form
                className="grid items-end gap-3 md:grid-cols-2"
                onSubmit={handleSubmit}
              >
                <Input
                  label="Adversário"
                  labelClassName="text-white/80"
                  wrapperClassName="md:col-span-2"
                  value={form.opponentName}
                  onChange={(e) =>
                    setForm({ ...form, opponentName: e.target.value })
                  }
                  required
                  className="bg-white/90 text-slate-900"
                />
                <Input
                  label="Data"
                  type="datetime-local"
                  labelClassName="text-white/80"
                  wrapperClassName="md:col-span-1"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="bg-white/90 text-slate-900"
                />
                <Input
                  label="Local"
                  labelClassName="text-white/80"
                  wrapperClassName="md:col-span-1"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  className="bg-white/90 text-slate-900"
                />
                <Select
                  label="Competição"
                  labelClassName="text-white/80"
                  wrapperClassName="md:col-span-1"
                  value={form.competitionId}
                  onChange={(e) => {
                    const compId = e.target.value;
                    if (compId === "create-competition") {
                      navigate("/competitions");
                      return;
                    }
                    const selected = competitions?.find((c) => c.id === compId);
                    setForm({
                      ...form,
                      competitionId: compId,
                      type: compId
                        ? (selected?.type ?? "friendly")
                        : "friendly",
                    });
                  }}
                  className="bg-white/90 text-slate-900"
                >
                  <option value=""></option>
                  <option value="create-competition" className="text-slate-500">
                    Cadastre uma competição
                  </option>
                  {competitions?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Tipo"
                  labelClassName="text-white/80"
                  wrapperClassName="md:col-span-1"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="bg-white/90 text-slate-900"
                  disabled={!!form.competitionId}
                >
                  <option value="friendly">Amistoso</option>
                  <option value="league">Pontos corridos</option>
                  <option value="cup">Pontos Corridos/Mata-mata</option>
                  <option value="knockout">Mata-mata</option>
                </Select>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="w-full max-w-full rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition text-center"
                  >
                    Criar
                  </button>
                </div>
              </form>
              {!competitions?.length && (
                <div className="mt-2 text-xs text-slate-200/90">
                  Nenhuma competição cadastrada. Vá em "COMPETIÇÕES" para criar
                  e depois selecione aqui.
                </div>
              )}
              {isLoading && (
                <div className="mt-3 text-white/80">Carregando...</div>
              )}
              {error && (
                <div className="mt-3 text-sm text-red-200">
                  Erro ao carregar jogos
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl grid gap-4 md:grid-cols-2">
        {matches &&
          matches.map((m) => {
            const isOwner = role === "owner";
            return (
              <div
                key={m.id}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-md transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
                role="button"
                tabIndex={0}
                onClick={() => setViewMatchId(m.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setViewMatchId(m.id);
                  }
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 opacity-60" />
                <div
                  className={
                    isOwner
                      ? "relative flex items-start justify-between gap-3"
                      : "relative flex flex-col items-center gap-2 text-center"
                  }
                >
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-slate-900">
                      {teamName.toUpperCase()} x {m.opponentName.toUpperCase()}
                    </div>
                    <div className="text-xs text-slate-600">
                      {formatMatchDate(m.date)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {m.location && (
                        <div className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                          {m.location.toUpperCase()}
                        </div>
                      )}
                      {m.competition?.name && (
                        <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                          {m.competition.name.toUpperCase()}
                        </div>
                      )}
                    </div>
                    {m.scoreFor != null && m.scoreAgainst != null && (
                      <div className="text-sm font-semibold text-slate-800">
                        {m.scoreFor} x {m.scoreAgainst}
                      </div>
                    )}
                  </div>
                  {isOwner && (
                    <div className="flex flex-col items-center justify-center gap-2 text-xs font-semibold">
                      <button
                        disabled={role !== "owner"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFinalizingId(m.id);
                        }}
                        className={`w-24 rounded-lg px-3 py-1 ${
                          role !== "owner"
                            ? "cursor-not-allowed bg-slate-200 text-slate-500"
                            : "bg-emerald-500 text-white hover:bg-emerald-600"
                        }`}
                      >
                        {m.status === "finalized" ? "Editar" : "Finalizar"}
                      </button>
                      <button
                        disabled={role !== "owner"}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMatch.mutate(m.id);
                        }}
                        className={`w-24 rounded-lg px-3 py-1 ${
                          role !== "owner"
                            ? "cursor-not-allowed bg-slate-200 text-slate-500"
                            : "bg-gradient-to-r from-red-50 to-rose-100 text-red-600 hover:from-red-100 hover:to-rose-200"
                        }`}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        {matches && matches.length === 0 && (
          <div className="md:col-span-2 rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center text-sm text-slate-500">
            Nenhum jogo cadastrado.
          </div>
        )}
        <div ref={loadMoreRef} />
        {isFetchingNextPage && (
          <div className="text-center text-sm text-slate-500">
            Carregando...
          </div>
        )}
      </div>

      <Modal
        title="Finalizar jogo"
        isOpen={!!finalizingId}
        onClose={() => setFinalizingId(null)}
      >
        {matchDetail.isLoading && <div>Carregando...</div>}
        {matchDetail.data && (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4 shadow-sm">
            <div className="text-sm">
              Oponente: <strong>{matchDetail.data.opponentName}</strong>
            </div>
            {modalError && (
              <div className="text-sm text-red-600">{modalError}</div>
            )}

            <div className="flex items-center gap-2 text-sm">
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
            </div>

            <div className="space-y-3">
              <div className="font-semibold text-sm">Jogadores</div>

              <div className="rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm">
                <div className="mb-2 text-xs font-semibold text-slate-700">
                  Disponíveis
                </div>
                <div className="space-y-2">
                  {availablePlayers.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs w-full"
                    >
                      <span className="font-semibold text-slate-800">
                        {formatPlayer(p)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          className="rounded-full bg-orange-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-orange-600"
                          onClick={() => {
                            const next = new Set(selectedStarters);
                            next.add(p.id);
                            setSelectedStarters(next);
                            setSelectedSubs(
                              new Set(
                                [...selectedSubs].filter((id) => id !== p.id),
                              ),
                            );
                          }}
                        >
                          Titular
                        </button>
                        <button
                          className="rounded-full bg-indigo-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-600"
                          onClick={() => {
                            const next = new Set(selectedSubs);
                            next.add(p.id);
                            setSelectedSubs(next);
                            setSelectedStarters(
                              new Set(
                                [...selectedStarters].filter(
                                  (id) => id !== p.id,
                                ),
                              ),
                            );
                          }}
                        >
                          Reserva
                        </button>
                      </div>
                    </div>
                  ))}
                  {availablePlayers.length === 0 && (
                    <div className="text-xs text-slate-500">
                      Nenhum disponível.
                    </div>
                  )}
                </div>
              </div>

              <div
                className="rounded-2xl border border-emerald-200 p-4 shadow-sm"
                style={{
                  background:
                    "linear-gradient(180deg, #ecfdf3 0%, #d1fae5 100%)",
                }}
              >
                <div className="mb-3 text-xs font-semibold text-emerald-900">
                  Titulares
                </div>
                <div className="flex flex-wrap gap-2">
                  {[...selectedStarters].map((id) => {
                    const p = playerOptions.find((pl) => pl.id === id);
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs shadow-sm"
                      >
                        <span className="font-semibold text-slate-800">
                          {formatPlayer(p)}
                        </span>
                        <button
                          className="text-[11px] font-semibold text-red-600 hover:text-red-700"
                          onClick={() =>
                            setSelectedStarters(
                              new Set(
                                [...selectedStarters].filter((x) => x !== id),
                              ),
                            )
                          }
                        >
                          Remover
                        </button>
                      </div>
                    );
                  })}
                  {[...selectedStarters].length === 0 && (
                    <span className="text-xs text-emerald-700">
                      Adicione titulares acima.
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 shadow-sm">
                <div className="mb-2 text-xs font-semibold text-blue-800">
                  Reservas
                </div>
                <div className="flex flex-wrap gap-2">
                  {[...selectedSubs].map((id) => {
                    const p = playerOptions.find((pl) => pl.id === id);
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs"
                      >
                        <span className="font-semibold text-slate-800">
                          {formatPlayer(p)}
                        </span>
                        <button
                          className="text-[11px] font-semibold text-red-600 hover:text-red-700"
                          onClick={() =>
                            setSelectedSubs(
                              new Set(
                                [...selectedSubs].filter((x) => x !== id),
                              ),
                            )
                          }
                        >
                          Remover
                        </button>
                      </div>
                    );
                  })}
                  {[...selectedSubs].length === 0 && (
                    <div className="text-xs text-blue-700">
                      Selecione reservas acima.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm">
              <div className="font-semibold text-sm text-slate-700">
                Eventos
              </div>
              <div className="flex flex-wrap items-center gap-2 pb-2">
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
                    {selectedPlayers.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {formatPlayer(p)}
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
                    {selectedPlayers.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {formatPlayer(p)}
                      </option>
                    ))}
                  </select>
                )}
                {(eventType === "yellow" || eventType === "red") && (
                  <select
                    className="rounded border border-slate-300 px-2 py-1 text-sm"
                    value={cardPlayerId ?? ""}
                    onChange={(e) =>
                      setCardPlayerId(e.target.value || undefined)
                    }
                  >
                    <option value="">Jogador</option>
                    {selectedPlayers.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {formatPlayer(p)}
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
                    setMinute(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
                <button
                  onClick={() => {
                    if (eventType === "goal" && !scorerId) {
                      setModalError("Selecione o autor do gol.");
                      return;
                    }
                    if (eventType === "assist" && !scorerId) {
                      setModalError(
                        "Selecione o autor do gol para registrar assistência.",
                      );
                      return;
                    }
                    if (
                      (eventType === "yellow" || eventType === "red") &&
                      !cardPlayerId
                    ) {
                      setModalError("Selecione o jogador do cartão.");
                      return;
                    }
                    setModalError(null);
                    const newEv = {
                      id: `local-${Date.now()}-${Math.random()}`,
                      type: eventType,
                      minute,
                      scorerId,
                      assistId,
                      playerId: cardPlayerId,
                      scorer: selectedPlayers.find(
                        (p: any) => p.id === scorerId,
                      ),
                      assist: selectedPlayers.find(
                        (p: any) => p.id === assistId,
                      ),
                      player: selectedPlayers.find(
                        (p: any) => p.id === cardPlayerId,
                      ),
                      isLocal: true,
                    };
                    setLocalEvents((prev) => [...prev, newEv]);
                    setMinute(undefined);
                    setScorerId(undefined);
                    setAssistId(undefined);
                    setCardPlayerId(undefined);
                  }}
                  className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Adicionar
                </button>
              </div>
              <ul className="space-y-2">
                {localEvents.map((ev: any) => (
                  <li
                    key={ev.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  >
                    {ev.minute ? `${ev.minute}' ` : ""}{" "}
                    {ev.type === "assist"
                      ? `assist: ${ev.assist?.name ?? "Assistente"} - gol: ${ev.scorer?.name ?? "Autor do gol"}`
                      : `${ev.type} - ${ev.scorer?.name || ev.player?.name || ev.assist?.name || "Jogador"}`}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleFinalize}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Salvar e finalizar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Detalhes do jogo"
        isOpen={!!viewMatchId}
        onClose={() => setViewMatchId(null)}
      >
        {viewMatchDetail.isLoading && <div>Carregando...</div>}
        {viewMatchDetail.data && (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Oponente
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {viewMatchDetail.data.opponentName}
                </div>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Placar
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {viewMatchDetail.data.scoreFor != null &&
                  viewMatchDetail.data.scoreAgainst != null
                    ? `${viewMatchDetail.data.scoreFor} x ${viewMatchDetail.data.scoreAgainst}`
                    : "Não finalizado"}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="mb-2 text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                Titulares
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {(viewMatchDetail.data.lineups || [])
                  .filter((l: any) => l.role === "starter")
                  .map((l: any) => (
                    <span
                      key={l.id}
                      className="rounded-full bg-white px-3 py-1 shadow-sm"
                    >
                      {formatPlayer(l.player)}
                    </span>
                  ))}
                {!(viewMatchDetail.data.lineups || []).some(
                  (l: any) => l.role === "starter",
                ) && (
                  <span className="text-xs text-emerald-700">
                    Sem titulares cadastrados.
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-800">
                Reservas
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {(viewMatchDetail.data.lineups || [])
                  .filter((l: any) => l.role === "sub")
                  .map((l: any) => (
                    <span
                      key={l.id}
                      className="rounded-full bg-white px-3 py-1 shadow-sm"
                    >
                      {formatPlayer(l.player)}
                    </span>
                  ))}
                {!(viewMatchDetail.data.lineups || []).some(
                  (l: any) => l.role === "sub",
                ) && (
                  <span className="text-xs text-blue-700">
                    Sem reservas cadastrados.
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Eventos
              </div>
              <ul className="space-y-1 text-sm">
                {(viewMatchDetail.data.events || []).map((ev: any) => (
                  <li key={ev.id} className="rounded-lg bg-slate-50 px-3 py-1">
                    {ev.minute ? `${ev.minute}' ` : ""}
                    {ev.type === "assist"
                      ? `assist: ${formatPlayer(ev.assist)} - gol: ${formatPlayer(ev.scorer)}`
                      : ev.type === "goal"
                        ? `gol: ${formatPlayer(ev.scorer)}`
                        : `${ev.type} - ${formatPlayer(ev.player)}`}
                  </li>
                ))}
                {!(viewMatchDetail.data.events || []).length && (
                  <li className="text-xs text-slate-500">Sem eventos.</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
