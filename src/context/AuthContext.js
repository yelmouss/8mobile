import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getMe } from '../api/client';

const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  setToken: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync('authToken');
        if (stored) {
          setTokenState(stored);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Persist token changes
  const setToken = useCallback(async (t) => {
    setTokenState(t);
    if (t) await SecureStore.setItemAsync('authToken', t);
    else await SecureStore.deleteItemAsync('authToken');
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    try {
      const data = await getMe();
      setUser(data.user);
      return data.user;
    } catch (e) {
      if (e.status === 401) {
        await setToken(null);
        setUser(null);
      }
      return null;
    }
  }, [token, setToken]);

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setUser(null);
    }
  }, [token, refreshUser]);

  const value = useMemo(() => ({
    user,
    token,
    isLoading,
    setToken,
    logout: async () => {
      await setToken(null);
      setUser(null);
    },
    refreshUser,
  }), [user, token, isLoading, setToken, refreshUser]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
