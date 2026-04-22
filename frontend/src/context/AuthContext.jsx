import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  AUTH_EXPIRED_EVENT,
  authApi,
  clearSession,
  getAccessToken,
  storeAccessToken,
} from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const bootstrapSession = async () => {
      try {
        if (!getAccessToken()) {
          const refreshed = await authApi.refresh();
          storeAccessToken(refreshed.data.data.accessToken);
        }

        const me = await authApi.getMe();
        if (active) setUser(me.data.data.user);
      } catch {
        clearSession();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrapSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearSession();
      setUser(null);
      setLoading(false);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    const { user, accessToken } = res.data.data;
    storeAccessToken(accessToken);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    const { user, accessToken } = res.data.data;
    storeAccessToken(accessToken);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    clearSession();
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => setUser((u) => ({ ...u, ...updated })), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
