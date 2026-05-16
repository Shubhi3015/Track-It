import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearTokens, getRefreshToken, setTokens } from '../utils/api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  useEffect(() => {
    api('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      async login(email, password) {
        const data = await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        setTokens(data);
        setUser(data.user);
        notify('Welcome back');
      },
      async register(name, email, password) {
        const data = await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password })
        });
        setTokens(data);
        setUser(data.user);
        notify('Account created');
      },
      async logout() {
        try {
          await api('/api/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken: getRefreshToken() })
          });
        } catch {
          // Clearing local state is still correct if the server session already expired.
        }
        clearTokens();
        setUser(null);
      }
    }),
    [loading, notify, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
