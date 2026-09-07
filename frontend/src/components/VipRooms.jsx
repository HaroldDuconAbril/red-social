// src/components/VipRooms.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { MonitorPlay, MessageSquare, Video, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // <-- ¡Añadido!

export default function VipRooms() {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // <-- ¡Añadido!

  useEffect(() => {
    const fetchMyRooms = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/rooms/my-rooms', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setRooms(res.data.rooms || []);
      } catch (error) {
        console.error('Error al cargar salas VIP:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) fetchMyRooms();
  }, [user]);

  return (
    <div className="relative min-h-screen px-4 pb-12 pt-8 sm:pt-12">
      <div className="fixed inset-0 bg-[#080B12]/80 backdrop-blur-sm z-0" />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 flex items-center justify-center gap-3">
            <MonitorPlay className="text-red-500" /> Salas VIP y Grupales
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Accede a las salas de chat y videollamadas exclusivas a las que el administrador te ha otorgado acceso.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 font-bold animate-pulse">Cargando salas asignadas...</div>
        ) : rooms.length === 0 ? (
          <div className="bg-[#0E1320]/80 border border-white/10 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-2xl">
            <Lock className="text-red-500 mx-auto mb-4" size={48} />
            <h3 className="text-white font-bold text-xl mb-2">Sin salas asignadas</h3>
            <p className="text-gray-400 text-sm">El administrador aún no te ha agregado a ninguna sala grupal o de videollamada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(room => (
              <div key={room.id} className="bg-[#0E1320]/90 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {room.room_type === 'video' ? <Video className="text-blue-400" size={20} /> : <MessageSquare className="text-green-400" size={20} />}
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">{room.room_type}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{room.name}</h3>
                </div>
                <button 
                  onClick={() => navigate(`/room/${room.id}`)}
                  className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
                >
                  Entrar a la Sala
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}