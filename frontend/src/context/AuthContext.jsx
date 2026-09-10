// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import api, { setCsrfToken, clearCsrfToken } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ya no leemos el token de localStorage: la cookie httpOnly de sesión viaja
  // sola con la petición. Para saber si ya hay sesión activa (por ejemplo al
  // recargar la página) le preguntamos al backend quién es el usuario actual,
  // y de paso recuperamos el token CSRF (se perdió de la memoria al recargar).
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const res = await api.get('/api/auth/me');
        if (!cancelled) {
          setUser(res.data.user);
          setCsrfToken(res.data.csrfToken);
        }
      } catch (error) {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  // Se llama después de un login (o verify-2fa) exitoso. El backend ya dejó
  // la cookie de sesión puesta y nos manda el csrfToken en el body; aquí lo
  // guardamos en memoria para que api.js lo reenvíe en cada petición que
  // escribe datos.
  const login = (data) => {
    const userData = data.user || data;
    if (!userData) {
      console.error('No se recibió información de usuario en login:', data);
      return;
    }
    setUser(userData);
    setCsrfToken(data.csrfToken);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setUser(null);
      clearCsrfToken();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
