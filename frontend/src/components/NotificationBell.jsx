// src/components/NotificationBell.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Bell, Check, X, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function NotificationBell() {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Obtener las solicitudes pendientes cuando el componente carga
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/friendships/pending', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setRequests(res.data.requests);
      } catch (error) {
        console.error('Error al cargar notificaciones:', error);
      }
    };

    if (user?.token) {
      fetchRequests();
    }
  }, [user]);

  // Cerrar el menú desplegable si el usuario hace clic afuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manejar el Aceptar / Rechazar
  const handleRespond = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/friendships/${id}/respond`, 
        { status },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      // Si la petición es exitosa, quitamos esa solicitud de la lista visualmente
      setRequests(prev => prev.filter(req => req.friendship_id !== id));
      
      toast.success(status === 'aceptada' ? '¡Conexión aceptada!' : 'Solicitud rechazada.');
    } catch (error) {
      console.error('Error al responder:', error);
      toast.error('Hubo un error al procesar la solicitud');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de la Campana */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors focus:outline-none"
      >
        <Bell size={24} />
        {/* Globito rojo con el número de solicitudes */}
        {requests.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 border-2 border-[#080B12] rounded-full animate-bounce">
            {requests.length}
          </span>
        )}
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 bg-[#0E1320]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-black/20">
            <h3 className="text-white font-bold text-lg">Solicitudes de Conexión</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {requests.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No tienes nuevas solicitudes en este momento.
              </div>
            ) : (
              requests.map(req => (
                <div key={req.friendship_id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center gap-3">
                  
                  {/* Foto de Perfil Redonda */}
                  <div className="w-12 h-12 bg-black/50 border border-white/10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
                    {req.profile_picture_url ? (
                      <img src={`http://localhost:5000${req.profile_picture_url}`} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-gray-400" />
                    )}
                  </div>
                  
                  {/* Nombre y texto */}
                  <div className="flex-1">
                    <p className="text-white text-sm font-bold truncate">{req.username}</p>
                    <p className="text-xs text-gray-400">Quiere conectar contigo</p>
                  </div>
                  
                  {/* Botones de Acción */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleRespond(req.friendship_id, 'aceptada')}
                      className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white flex items-center justify-center transition-colors border border-green-500/30 shadow-lg shadow-green-900/20"
                      title="Aceptar"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={() => handleRespond(req.friendship_id, 'rechazada')}
                      className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors border border-red-500/30 shadow-lg shadow-red-900/20"
                      title="Rechazar"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}