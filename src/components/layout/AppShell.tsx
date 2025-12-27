import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bars4Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/auth.store';

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

type UserBadgeProps = { hideIfGuest?: boolean };

const UserBadge = ({ hideIfGuest = false }: UserBadgeProps) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [show, setShow] = useState(false);
  if (!user && hideIfGuest) return null;
  return (
    <div className="relative">
      <button
        onClick={() => setShow((v) => !v)}
        className="flex items-center justify-center rounded-full border border-white/20 bg-white/10 p-2 text-white shadow-sm hover:bg-white/20"
        aria-label="Menu do usuario"
      >
        <UserIcon />
      </button>
      {show && (
        <div className="absolute right-0 mt-2 min-w-[180px] rounded-xl border border-white/20 bg-white/90 p-3 text-slate-900 shadow-lg">
          <div className="mb-2 text-xs font-semibold text-slate-600">Usuario</div>
          <div className="text-sm font-medium text-slate-800">{user?.email ?? 'Guest'}</div>
          <div className="text-xs text-slate-500">Time: {user?.teamName ?? '-'}</div>
          {user && (
            <button
              onClick={() => {
                logout();
                setShow(false);
              }}
              className="mt-2 w-full rounded-lg bg-gradient-to-r from-red-500 to-rose-500 px-3 py-1 text-xs font-semibold text-white hover:brightness-110"
            >
              Sair
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setShowLogo(window.innerWidth >= 390);
      if (window.innerWidth >= 768) setOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderNavLinks = (onClick?: () => void) => (
    <>
      <Link to="/dashboard" onClick={onClick} className="hover:text-white">
        DASHBOARD
      </Link>
      <Link to="/matches" onClick={onClick} className="hover:text-white">
        JOGOS
      </Link>
      <Link to="/players" onClick={onClick} className="hover:text-white">
        JOGADORES
      </Link>
      <Link to="/competitions" onClick={onClick} className="hover:text-white">
        COMPETICOES
      </Link>
      <Link to="/stats" onClick={onClick} className="hover:text-white">
        ESTATISTICAS
      </Link>
    </>
  );

  const MenuButton = () => (
    <button
      className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 md:hidden"
      onClick={() => setOpen(true)}
      aria-label="Abrir menu"
    >
      <Bars4Icon className="h-5 w-5" />
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-800/40 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          {!user ? (
            <div className="flex w-full justify-center">
              {showLogo && (
                <Link to="/dashboard" className="flex items-center gap-3">
                  <img src="/slm_logo_full.png" alt="Sunday League Manager" className="h-10 sm:h-12 md:h-16 max-w-full object-contain" />
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {showLogo ? (
                  <Link to="/dashboard" className="flex min-w-[140px] items-center gap-3">
                    <img src="/slm_logo_full.png" alt="Sunday League Manager" className="h-10 sm:h-12 md:h-16 max-w-full object-contain" />
                  </Link>
                ) : (
                  <MenuButton />
                )}
              </div>

              <div className="flex items-center gap-3 md:hidden">
                {showLogo && <MenuButton />}
                <UserBadge hideIfGuest />
              </div>

              <nav className="hidden items-center gap-4 text-sm font-medium md:flex">
                {renderNavLinks()}
                <UserBadge hideIfGuest />
              </nav>
            </>
          )}
        </div>
      </header>

      {user && open && (
        <>
          <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-40 w-80 max-w-[80%] bg-gradient-to-b from-slate-900 to-indigo-900 text-white shadow-xl md:hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-sm font-semibold">MENU</span>
              <button
                className="rounded-lg border border-white/20 px-3 py-1 text-sm font-semibold hover:bg-white/10"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-3 px-4 py-4 text-sm font-semibold">
              {renderNavLinks(() => setOpen(false))}
            </div>
          </div>
        </>
      )}

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
};
