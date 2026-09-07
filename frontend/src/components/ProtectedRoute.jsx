// src/components/AdminRoute.jsx
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const AdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  
  // Si no está logueado, al login. Si no es admin, al inicio.
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  
  return children;
};