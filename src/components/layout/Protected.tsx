import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { AppShell } from './AppShell';

export const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <AppShell>{children}</AppShell>;
};
