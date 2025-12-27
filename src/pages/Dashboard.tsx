import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useMatches } from '../hooks/useMatches';
import { useTopScorers, useTopAssists, useCards } from '../hooks/useStats';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/auth.store';
import { formatMatchDate } from '../utils/date';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [yearInput, setYearInput] = useState<string>(String(currentYear));
  const [yearFilter, setYearFilter] = useState<number>(currentYear);
  const teamName = useAuthStore((s) => s.user?.teamName ?? 'Meu Time');

  const { data: matches } = useMatches({ year: yearFilter, take: 1000 });
  const { data: scorers } = useTopScorers(yearFilter);
  const { data: assists } = useTopAssists(yearFilter);
  const { data: cards } = useCards(yearFilter);

  const filteredMatches = useMemo(
    () => matches?.filter((m) => new Date(m.date).getFullYear() === yearFilter) ?? [],
    [matches, yearFilter],
  );

  const upcoming = useMemo(() => {
    if (!filteredMatches.length) return null;
    const now = new Date().getTime();
    return [...filteredMatches]
      .filter((m) => new Date(m.date).getTime() >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [filteredMatches]);

  const lastResult = useMemo(() => {
    if (!filteredMatches.length) return null;
    const now = new Date().getTime();
    return [...filteredMatches]
      .filter((m) => m.scoreFor != null && m.scoreAgainst != null && new Date(m.date).getTime() <= now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [filteredMatches]);

  const summary = useMemo(() => {
    const totalMatches = filteredMatches.length;
    const finalized = filteredMatches.filter((m) => m.status === 'finalized');
    const matchesFinalized = finalized.length;
    const wins = finalized.filter((m) => (m.scoreFor ?? 0) > (m.scoreAgainst ?? 0)).length;
    const draws = finalized.filter((m) => (m.scoreFor ?? 0) === (m.scoreAgainst ?? 0)).length;
    const losses = finalized.filter((m) => (m.scoreFor ?? 0) < (m.scoreAgainst ?? 0)).length;
    return { matches: totalMatches, wins, draws, losses, matchesFinalized };
  }, [filteredMatches]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.10),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.18),transparent_40%)]" />
        <div className="relative space-y-4 text-white">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-sm text-slate-200">Resumo rapido do time, proximos jogos e destaques.</p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-end">
              <div className="w-32">
                <Input
                  label="Ano"
                  type="number"
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                  className="bg-white/90 text-slate-900"
                  labelClassName="text-white/80"
                />
              </div>
              <button
                onClick={() => setYearFilter(Number(yearInput) || currentYear)}
                className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-white/25"
              >
                Filtrar
              </button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              to="/matches"
              className="group block rounded-2xl bg-white/10 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              <div className="text-xs text-slate-200 transition group-hover:text-white">PROXIMO JOGO</div>
              {upcoming ? (
                <div className="mt-2 text-center">
                  <div className="space-y-0 rounded-lg bg-white/10 px-3 py-1 shadow-inner">
                    <div className="text-sm font-semibold">{teamName.toUpperCase()} x {upcoming.opponentName.toUpperCase()}</div>
                    <div className="text-sm text-slate-200">{formatMatchDate(upcoming.date)}</div>
                    {upcoming.competition?.name && <div className="text-xs text-blue-100">{upcoming.competition.name}</div>}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-200">Sem jogos futuros.</div>
              )}
            </Link>
            <Link
              to="/matches"
              className="group block rounded-2xl bg-white/10 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              <div className="text-xs text-slate-200 transition group-hover:text-white">ULTIMO RESULTADO</div>
              {lastResult ? (
                <div className="mt-2 space-y-1 text-center">
                  <div className="inline-flex w-full flex-col items-center justify-center rounded-lg bg-white/10 px-3 py-3 shadow-inner">
                    <div className="text-sm font-semibold">{teamName.toUpperCase()} x {lastResult.opponentName.toUpperCase()}</div>
                    <div className="inline-flex items-center justify-center rounded-md px-3 text-sm font-bold">
                      {lastResult.scoreFor} x {lastResult.scoreAgainst}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-200">Sem jogos finalizados.</div>
              )}
            </Link>
            <div className="group rounded-2xl bg-white/10 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15">
              <div className="text-xs text-slate-200 transition group-hover:text-white">RESUMO</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <Stat label="Jogos" value={summary.matchesFinalized} />
                <Stat label="Vit/Emp/Der" value={`${summary.wins}/${summary.draws}/${summary.losses}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ChartCard
          title="ARTILHEIROS"
          gradient="from-blue-500 via-indigo-500 to-slate-900"
          subtitle="Gols marcados"
        >
          <PieCard
            rows={scorers}
            valueKey="goals"
            labelKey="playerName"
            emptyLabel="Sem dados de gols."
            colors={["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa"]}
          />
        </ChartCard>
        <ChartCard
          title="ASSISTENCIAS"
          gradient="from-cyan-400 via-blue-500 to-indigo-700"
          subtitle="Passes para gol"
        >
          <PieCard
            rows={assists}
            valueKey="assists"
            labelKey="playerName"
            emptyLabel="Sem dados de assistencias."
            colors={["#22d3ee", "#818cf8", "#fb7185", "#c084fc", "#facc15"]}
          />
        </ChartCard>
        <ChartCard
          title="EXPULSOES"
          gradient="from-rose-500 via-red-500 to-orange-500"
          subtitle="Cartoes vermelhos"
        >
          <PieCard
            rows={aggregateReds(cards)}
            valueKey="count"
            labelKey="playerName"
            emptyLabel="Sem expulsoes."
            colors={["#f87171", "#ef4444", "#dc2626", "#b91c1c", "#7f1d1d"]}
          />
        </ChartCard>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white/10 px-3 py-2 text-white/90 shadow-inner">
      <div className="text-[11px] uppercase tracking-wide text-slate-200">{label}</div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

type PieRow = { [key: string]: any };

function ChartCard({
  title,
  subtitle,
  gradient,
  children,
}: {
  title: string;
  subtitle?: string;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 shadow-lg`}>
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
      <div className="relative space-y-2 text-white">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-white/80">{subtitle}</div>}
        </div>
        <div className="rounded-xl bg-white/80 p-3 text-slate-900 shadow-inner">{children}</div>
      </div>
    </div>
  );
}

function PieCard({
  rows,
  valueKey,
  labelKey,
  emptyLabel,
  colors,
}: {
  rows?: PieRow[];
  valueKey: string;
  labelKey: string;
  emptyLabel: string;
  colors: string[];
}) {
  if (!rows || rows.length === 0) return <div className="text-sm text-slate-500">{emptyLabel}</div>;

  const top = rows.slice(0, 5);
  const data = {
    labels: top.map((r) => r[labelKey] ?? 'Jogador'),
    datasets: [
      {
        label: valueKey,
        data: top.map((r) => r[valueKey]),
        backgroundColor: colors.slice(0, top.length),
        borderColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-3">
      <Pie
        data={data}
        options={{
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#0f172a',
                font: { weight: 600 },
              },
            },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}` } },
          },
        }}
      />
      <div className="space-y-1 text-sm text-slate-800">
        {top.map((r, idx) => (
          <div key={`${r[labelKey]}-${idx}`} className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1">
            <span className="font-medium">{r[labelKey] ?? 'Jogador'}</span>
            <span className="font-semibold">{r[valueKey]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function aggregateReds(cards?: any[]) {
  if (!cards) return [];
  const map = new Map<string, number>();
  cards.forEach((c) => {
    if (c.type !== 'red') return;
    const name = c.playerName ?? 'Jogador';
    map.set(name, (map.get(name) ?? 0) + c.count);
  });
  return Array.from(map.entries()).map(([playerName, count]) => ({ playerName, count }));
}





