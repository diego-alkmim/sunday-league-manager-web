import { create } from 'zustand';

type AuthState = {
  token?: string;
  user?: { id: string; email: string; teamId?: string; teamName?: string; role?: string };
  login: (token: string, user: AuthState['user']) => void;
  logout: () => void;
};

const persisted = (() => {
  try {
    const raw = localStorage.getItem('slm.auth');
    return raw ? (JSON.parse(raw) as { token?: string; user?: any }) : {};
  } catch {
    return {};
  }
})();

export const useAuthStore = create<AuthState>((set) => ({
  token: persisted.token,
  user: persisted.user,
  login: (token, user) => {
    set({ token, user });
    localStorage.setItem('slm.auth', JSON.stringify({ token, user }));
  },
  logout: () => {
    localStorage.removeItem('slm.auth');
    set({ token: undefined, user: undefined });
  },
}));
