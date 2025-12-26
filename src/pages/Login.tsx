import { useState } from 'react';
import { api } from '../services/apiClient';
import { useAuthStore } from '../store/auth.store';
import { useNavigate, Link } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.accessToken, {
        id: res.data.user.id,
        email: res.data.user.email,
        teamId: res.data.team?.id,
        teamName: res.data.team?.name,
        role: res.data.role,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.20),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.18),transparent_35%)]" />
        <div className="relative space-y-6 text-white">
          <div className="flex flex-col items-center gap-2">
            <img src="/slm_logo_full.png" alt="Sunday League Manager" className="h-12 object-contain" />
            <h1 className="text-2xl font-semibold">Bem-vindo(a)</h1>
            <p className="text-sm text-white/70 text-center">Acesse e gerencie seu time naquele futebol de domingo.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80">E-mail</label>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-cyan-300">
                <EnvelopeIcon className="h-5 w-5 text-white/70" />
                <input
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="Digite seu e-mail"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80">Senha</label>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-cyan-300">
                <LockClosedIcon className="h-5 w-5 text-white/70" />
                <input
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  placeholder="Senha"
                />
              </div>
            </div>

            {error && <div className="text-sm text-rose-300">{error}</div>}

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition"
              >
                Entrar
              </button>
            </div>
          </form>

          <div className="text-center text-xs text-white/70">
            <span className="text-white/60">Ainda não tem conta?</span>{' '}
            <Link to="/login" className="font-semibold text-cyan-200 hover:text-cyan-100">
              Cadastre-se aqui
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
