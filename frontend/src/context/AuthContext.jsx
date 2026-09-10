// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

 
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const res = await api.get('/api/auth/me');
        if (!cancelled) setUser(res.data.user);
      } catch (error) {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  
  const login = (data) => {
    const userData = data.user || data;
    if (!userData) {
      console.error('No se recibió información de usuario en login:', data);
      return;
    }
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
