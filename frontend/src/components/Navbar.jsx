// src/components/Navbar.jsx
<header className="sticky top-0 z-50 w-full bg-[#080B12] border-b border-white/10 shadow-lg">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <h1 className="font-black text-white text-xl">EROTIKA</h1>
    <div className="flex items-center gap-6">
       {/* ... tus links ... */}
    </div>
  </div>
</header>


import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Users, MessageCircle, LogOut, Radio } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { MonitorPlay } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Si el usuario no está logueado, no mostramos la barra
  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Función para saber si el botón está activo y pintarlo de rojo
  const isActive = (path) => location.pathname === path;

  return (
    // Agregamos 'pt-8' para darle más espacio desde arriba
    <div className="fixed top-0 left-0 w-full z-50 flex justify-center pt-8 px-4 pointer-events-none">
      {/* Contenedor principal de la barra (Cambiado a rounded-2xl y gap-4) */}
      <nav className="bg-[#0E1320]/80 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-2 sm:gap-4 pointer-events-auto transition-all">
        
        {/* Enlace de Admin (SOLO SI ES ADMIN) */}
        {user?.role === 'admin' && (
          <Link 
            to="/admin" 
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-colors ${isActive('/admin') ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'text-red-400 hover:text-white hover:bg-white/5'}`}
          >
            <span className="hidden sm:inline">Panel Admin</span>
          </Link>
        )}

        <Link 
          to="/perfil" 
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-colors ${isActive('/perfil') ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <User size={18} /> <span className="hidden sm:inline">Mi Perfil</span>
        </Link>

<Link to="/vip-rooms" className="flex items-center gap-2 hover:text-white transition">
  <MonitorPlay size={20} className="text-red-500" />
  <span className="font-bold">Salas VIP</span>
</Link>

        <Link 
          to="/explorar" 
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-colors ${isActive('/explorar') ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Users size={18} /> <span className="hidden sm:inline">Explorar</span>
        </Link>

        <Link 
          to="/chat" 
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-colors ${isActive('/chat') ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <MessageCircle size={18} /> <span className="hidden sm:inline">Mensajes</span>
        </Link>

        <Link 
          to="/muro" 
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-colors ${isActive('/muro') ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Radio size={18} /> <span className="hidden sm:inline">Clasificados</span>
        </Link>

       <NotificationBell />
        
       
        <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block"></div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut size={18} /> <span className="hidden sm:inline">Salir</span>
        </button>

      </nav>
    </div>
  );
}