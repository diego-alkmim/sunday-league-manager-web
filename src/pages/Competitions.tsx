import { useState } from 'react';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useCompetitions, useCreateCompetition, useUpdateCompetition } from '../hooks/useCompetitions';
import { useDeleteCompetition } from '../hooks/useDeleteCompetition';

export default function Competitions() {
  const { data, isLoading, error } = useCompetitions();
  const createCompetition = useCreateCompetition();
  const updateCompetition = useUpdateCompetition();
  const deleteCompetition = useDeleteCompetition();

  const [form, setForm] = useState({ name: '', type: 'league' });
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', type: 'league' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCompetition.mutate({ name: form.name, type: form.type });
    setForm({ name: '', type: 'league' });
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.10),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.18),transparent_40%)]" />
        <div className="relative flex flex-col gap-2 text-white">
          <h1 className="text-3xl font-semibold tracking-tight">Competições</h1>
          <p className="text-sm text-slate-200">Organize ligas, copas e amistosos com um toque futurista.</p>
          <div className="mt-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <form className="grid items-end gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
              <Input
                label="Nome"
                labelClassName="text-white/80"
                wrapperClassName="md:col-span-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="bg-white/90 text-slate-900"
              />
              <Select
                label="Tipo"
                labelClassName="text-white/80"
                wrapperClassName="md:col-span-1"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="bg-white/90 text-slate-900"
              >
                <option value="friendly">Amistoso</option>
                <option value="league">Pontos corridos</option>
                <option value="cup">Pontos Corridos/Mata-mata</option>
                <option value="knockout">Mata-mata</option>
              </Select>
              <div className="flex items-end justify-end md:col-span-2">
                <button
                  type="submit"
                  className="w-full max-w-full rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition text-center"
                >
                  Adicionar
                </button>
              </div>
            </form>
            {isLoading && <div className="mt-3 text-white/80">Carregando...</div>}
            {error && <div className="mt-3 text-sm text-red-200">Erro ao carregar</div>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl grid gap-4 md:grid-cols-2">
        {data?.map((c) =>
          editing === c.id ? (
            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg">
              <form
                className="grid gap-2 md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  updateCompetition.mutate({ id: c.id, name: editForm.name, type: editForm.type });
                  setEditing(null);
                }}
              >
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                <Select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                  <option value="league">Pontos corridos</option>
                  <option value="knockout">Mata-mata</option>
                  <option value="friendly">Amistoso</option>
                </Select>
                <div className="flex gap-2 md:col-span-2">
                  <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Salvar
                  </button>
                  <button type="button" className="text-xs" onClick={() => setEditing(null)}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div
              key={c.id}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-md transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 opacity-60" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xl font-bold text-slate-900">{c.name}</div>
                  <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                    {labelForType(c.type)}
                  </div>
                </div>
                <div className="flex gap-2 text-xs font-semibold">
                  <button
                    onClick={() => {
                      setEditing(c.id);
                      setEditForm({ name: c.name, type: c.type });
                    }}
                    className="rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-1 text-blue-600 hover:from-blue-100 hover:to-blue-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteCompetition.mutate(c.id)}
                    className="rounded-lg bg-gradient-to-r from-red-50 to-rose-100 px-3 py-1 text-red-600 hover:from-red-100 hover:to-rose-200"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ),
        )}
        {data && data.length === 0 && (
          <div className="md:col-span-2 rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center text-sm text-slate-500">
            Nenhuma competição cadastrada.
          </div>
        )}
      </div>
    </div>
  );
}

function labelForType(type: string) {
  switch (type) {
    case 'league':
      return 'Pontos corridos';
    case 'knockout':
      return 'Mata-mata';
    case 'friendly':
      return 'Amistoso';
    default:
      return type;
  }
}
