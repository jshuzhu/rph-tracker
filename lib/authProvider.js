'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionSimple, logoutSimple } from '../app/actions/auth';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const sessionUser = await getSessionSimple();
        if (sessionUser) {
          setUser({ id: sessionUser.id, email: sessionUser.email });
          setProfile(sessionUser);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      } finally {
        setLoading(false);
      }
    };
    getInitialSession();
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await logoutSimple();
      setUser(null);
      setProfile(null);
      window.location.href = '/login';
    } catch (err) {
      console.error('Error during logout:', err);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
