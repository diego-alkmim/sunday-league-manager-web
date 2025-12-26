import { Card } from '../components/ui/Card';
import { useTopScorers, useTopAssists, useCards } from '../hooks/useStats';

export default function Stats() {
  const { data: scorers, isLoading: loadingScorers } = useTopScorers();
  const { data: assists, isLoading: loadingAssists } = useTopAssists();
  const { data: cards, isLoading: loadingCards } = useCards();

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Estatísticas</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Artilheiros">
          {loadingScorers ? <div>Carregando...</div> : <List rows={scorers} valueKey="goals" />}
        </Card>
        <Card title="Assistências">
          {loadingAssists ? <div>Carregando...</div> : <List rows={assists} valueKey="assists" />}
        </Card>
        <Card title="Cartões">
          {loadingCards && <div>Carregando...</div>}
          {!loadingCards &&
            (cards?.length ? (
              cards.map((c, idx) => (
                <div key={idx} className="text-sm flex justify-between">
                  <span>{c.playerName ?? 'Jogador'}</span>
                  <span>
                    {c.type}: {c.count}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">Sem dados.</div>
            ))}
        </Card>
      </div>
    </div>
  );
}

const List = ({ rows, valueKey }: { rows?: any[]; valueKey: string }) => {
  if (!rows || rows.length === 0) return <div className="text-sm text-slate-500">Sem dados.</div>;
  return (
    <div className="space-y-1">
      {rows.map((r) => (
        <div key={r.playerId} className="text-sm flex justify-between">
          <span>{r.playerName ?? 'Jogador'}</span>
          <span className="font-semibold">{r[valueKey]}</span>
        </div>
      ))}
    </div>
  );
};
