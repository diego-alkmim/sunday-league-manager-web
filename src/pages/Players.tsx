import { useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { usePlayers } from "../hooks/usePlayers";
import { useCreatePlayer, useUpdatePlayer } from "../hooks/usePlayersMutations";
import { useDeletePlayer } from "../hooks/useDeletePlayer";
import { useAuthStore } from "../store/auth.store";

export default function Players() {
  const { data, isLoading, error } = usePlayers();
  const createPlayer = useCreatePlayer();
  const deletePlayer = useDeletePlayer();
  const updatePlayer = useUpdatePlayer();
  const role = useAuthStore((s) => s.user?.role ?? "member");
  const canManage = role === "owner";

  const positions = useMemo(
    () => [
      "Goleiro",
      "Zagueiro",
      "Lateral Direito",
      "Lateral Esquerdo",
      "Volante",
      "Meia",
      "Meia Esquerda",
      "Meia Direita",
      "Centroavante",
      "Ponta Direita",
      "Ponta Esquerda",
    ],
    [],
  );
  const feet = ["Direita", "Esquerda", "Ambas"];
  const numbers = Array.from({ length: 99 }, (_, i) => i + 1);

  const [form, setForm] = useState({
    name: "",
    nickname: "",
    position: "",
    foot: "",
    number: "",
    photoUrl: "",
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    nickname: "",
    position: "",
    foot: "",
    number: "",
    photoUrl: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    createPlayer.mutate({
      name: form.name,
      nickname: form.nickname || undefined,
      position: form.position,
      foot: form.foot || undefined,
      number: form.number ? Number(form.number) : undefined,
      photoUrl: form.photoUrl || undefined,
    });
    setForm({
      name: "",
      nickname: "",
      position: "",
      foot: "",
      number: "",
      photoUrl: "",
    });
  };

  const renderAvatar = (p: any) => {
    if (p.photoUrl) {
      return (
        <img
          src={p.photoUrl}
          alt={p.name}
          className="h-14 w-14 rounded-full object-cover ring-2 ring-slate-200"
        />
      );
    }
    const initials = p.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold text-white ring-2 ring-slate-200">
        {initials}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.10),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.18),transparent_40%)]" />
        <div className="relative flex flex-col gap-2 text-white">
          <h1 className="text-3xl font-semibold tracking-tight">Jogadores</h1>
          <p className="text-sm text-slate-200">
            Cadastre, edite e gerencie seu elenco.
          </p>
          <div className="mt-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <form
              className="grid grid-cols-1 items-end gap-3 md:grid-cols-12"
              onSubmit={handleSubmit}
            >
              <Input
                label="Nome"
                labelClassName="text-white/80"
                wrapperClassName="col-span-full md:col-span-12"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="bg-white/90 text-slate-900"
                disabled={!canManage}
              />
              <Input
                label="Apelido"
                labelClassName="text-white/80"
                wrapperClassName="md:col-span-6"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                className="bg-white/90 text-slate-900"
                disabled={!canManage}
              />
              <Select
                label="Posição"
                labelClassName="text-white/80"
                wrapperClassName="md:col-span-6"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                required
                className="bg-white/90 text-slate-900"
                disabled={!canManage}
              >
                <option value=""></option>
                {positions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </Select>
              <Select
                label="Perna"
                labelClassName="text-white/80"
                wrapperClassName="md:col-span-6"
                value={form.foot}
                onChange={(e) => setForm({ ...form, foot: e.target.value })}
                className="bg-white/90 text-slate-900"
                disabled={!canManage}
              >
                <option value=""></option>
                {feet.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
              <Select
                label="Número"
                labelClassName="text-white/80"
                wrapperClassName="md:col-span-6"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="bg-white/90 text-slate-900"
                disabled={!canManage}
              >
                <option value=""></option>
                {numbers.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
              {/* <Input
                label="Foto (URL)"
                labelClassName="text-white/80"
                wrapperClassName="md:col-span-6"
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                className="bg-white/90 text-slate-900"
                placeholder="https://..."
                disabled={!canManage}
              /> */}
              <div className="col-span-full md:col-span-12 flex justify-end w-full">
                <button
                  type="submit"
                  className="w-full max-w-full rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition text-center"
                  disabled={createPlayer.isPending || !canManage}
                >
                  Adicionar
                </button>
              </div>
            </form>
            {isLoading && (
              <div className="mt-3 text-white/80">Carregando...</div>
            )}
            {error && (
              <div className="mt-3 text-sm text-red-200">
                Erro ao carregar jogadores
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl grid gap-3 md:grid-cols-2">
        {data?.map((p) =>
          editing === p.id ? (
            <Card key={p.id} className="shadow-lg border border-slate-200">
              <form
                className="grid gap-2 md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  updatePlayer.mutate({
                    id: p.id,
                    name: editForm.name,
                    nickname: editForm.nickname || undefined,
                    position: editForm.position,
                    foot: editForm.foot || undefined,
                    number: editForm.number
                      ? Number(editForm.number)
                      : undefined,
                    // photoUrl: editForm.photoUrl || undefined,
                  });
                  setEditing(null);
                }}
              >
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  label="Nome"
                />
                <Input
                  value={editForm.nickname}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nickname: e.target.value })
                  }
                  label="Apelido"
                />
                <Select
                  value={editForm.position}
                  onChange={(e) =>
                    setEditForm({ ...editForm, position: e.target.value })
                  }
                  label="Posicao"
                >
                  <option value=""></option>
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </Select>
                <Select
                  value={editForm.foot}
                  onChange={(e) =>
                    setEditForm({ ...editForm, foot: e.target.value })
                  }
                  label="Perna"
                >
                  <option value=""></option>
                  {feet.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
                <Select
                  value={editForm.number}
                  onChange={(e) =>
                    setEditForm({ ...editForm, number: e.target.value })
                  }
                  label="Numero"
                >
                  <option value=""></option>
                  {numbers.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
                {/* <Input value={editForm.photoUrl} onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })} label="Foto (URL)" /> */}
                <div className="flex gap-2 md:col-span-2">
                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    className="text-xs"
                    onClick={() => setEditing(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </Card>
          ) : (
            <div
              key={p.id}
              className={`rounded-xl border border-slate-200 bg-white/90 px-5 py-4 shadow-md hover:border-indigo-200 hover:shadow-lg transition ${
                canManage
                  ? "flex items-center justify-between"
                  : "flex flex-col items-center text-center gap-3"
              }`}
            >
              <div
                className={`flex items-center gap-3 w-full ${canManage ? "" : "justify-center"}`}
              >
                {renderAvatar(p)}
                <div
                  className={canManage ? "space-y-1" : "space-y-1 text-center"}
                >
                  <div className="text-lg font-bold text-slate-900">
                    {p.name}
                  </div>
                  <div className="text-xs text-slate-600">
                    {p.position} {p.number ? `#${p.number}` : ""}
                  </div>
                  {p.nickname && (
                    <div className="text-xs text-indigo-700">{p.nickname}</div>
                  )}
                </div>
              </div>
              {canManage && (
                <div className="flex flex-col items-end gap-2 text-xs font-semibold">
                  <button
                    onClick={() => {
                      setEditing(p.id);
                      setEditForm({
                        name: p.name,
                        nickname: p.nickname || "",
                        position: p.position,
                        foot: p.foot || "",
                        number: p.number ? String(p.number) : "",
                        photoUrl: p.photoUrl || "",
                      });
                    }}
                    className="w-20 rounded-lg bg-gradient-to-r px-3 py-1 text-white bg-emerald-500 hover:bg-emerald-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deletePlayer.mutate(p.id)}
                    className="w-20 rounded-lg bg-gradient-to-r from-red-50 to-rose-100 px-3 py-1 text-red-600 hover:from-red-100 hover:to-rose-200"
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>
          ),
        )}
        {data && data.length === 0 && (
          <div className="md:col-span-2 rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center text-sm text-slate-500">
            Nenhum jogador cadastrado.
          </div>
        )}
      </div>
    </div>
  );
}
