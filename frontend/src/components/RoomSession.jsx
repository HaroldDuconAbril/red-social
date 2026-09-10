import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { ArrowLeft, MessageSquare, Send, CheckCircle2, Home } from 'lucide-react';
import { API_URL } from '../config';
import { toast } from 'react-hot-toast';

export default function RoomSession() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar cuándo mostrar la tarjeta de agradecimiento
  const [callEnded, setCallEnded] = useState(false);

  // Estados para el chat persistente
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    const fetchRoomAndMessages = async () => {
      try {
        const res = await api.get('/api/rooms/my-rooms');
        const currentRoom = res.data.rooms.find(r => r.id === parseInt(roomId));
        
        if (!currentRoom) {
  toast.error('No tienes acceso a esta sala o no existe.');
  navigate('/vip-rooms');
  return;
}
        setRoomData(currentRoom);

        if (currentRoom.room_type === 'chat') {
          const msgRes = await api.get(`/api/rooms/${roomId}/messages`);
          setChatMessages(msgRes.data || []);
        }
      } catch (error) {
        console.error('Error al cargar la sala o los mensajes', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRoomAndMessages();
    }
  }, [roomId, user, navigate]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const res = await api.post(`/api/rooms/${roomId}/messages`, { message });

      setChatMessages(prev => [...prev, res.data]);
      setMessage('');
    } catch (error) {
  console.error('Error al enviar el mensaje:', error);
  toast.error('No se pudo enviar el mensaje.');
}
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white font-bold bg-[#080B12]">Entrando a la sala...</div>;
  if (!roomData) return null;

  return (
    <div className="fixed inset-0 bg-[#080B12] z-50 flex flex-col">
      {/* BARRA SUPERIOR */}
      <div className="h-16 bg-[#0E1320] border-b border-white/10 flex items-center justify-between px-6 shadow-md z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/vip-rooms')} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">{roomData.name}</h1>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 
              {callEnded ? 'Finalizado' : 'Conectado'}
            </span>
          </div>
        </div>
      </div>

      {/* ÁREA DE TRABAJO (VIDEO, AGRADECIMIENTO O CHAT) */}
      <div className="flex-1 relative flex items-center justify-center">
        {callEnded ? (
          /* =========================================
             PANTALLA DE AGRADECIMIENTO AL COLGAR
             ========================================= */
          <div className="bg-[#0E1320]/90 border border-white/10 max-w-md w-full mx-4 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md animate-fadeIn">
            <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">¡Gracias por participar!</h2>
            <p className="text-gray-400 text-sm mb-8">
              La sesión de videoconferencia en <span className="text-white font-bold">{roomData.name}</span> ha finalizado con éxito. Esperamos que hayas tenido una gran experiencia.
            </p>
            <button 
              onClick={() => navigate('/vip-rooms')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl transition shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
            >
              <Home size={18} /> Volver a Salas VIP
            </button>
          </div>
        ) : roomData.room_type === 'video' ? (
          /* =========================================
             INTERFAZ DE VIDEOLLAMADA (JITSI MEET)
             ========================================= */
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={`ConectaLocal_VIP_${roomData.id}_${roomData.name.replace(/\s+/g, '')}`}
            configOverwrite={{
              startWithAudioMuted: true,
              startWithVideoMuted: false,
              prejoinPageEnabled: false
            }}
            interfaceConfigOverwrite={{
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
              SHOW_CHROME_EXTENSION_BANNER: false
            }}
            userInfo={{
              displayName: user.alias_name || user.username
            }}
            getIFrameRef={(iframeRef) => {
              iframeRef.style.height = '100%';
              iframeRef.style.width = '100%';
            }}
            onReadyToClose={() => setCallEnded(true)} // <-- Cambiado: Muestra la tarjeta de agradecimiento en vez de salir bruscamente
          />
        ) : (
          /* =========================================
             INTERFAZ DE CHAT DE TEXTO PURO
             ========================================= */
          <div className="flex flex-col h-full w-full max-w-4xl mx-auto border-x border-white/10 bg-[#0E1320]/50 absolute inset-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              <div className="text-center my-4">
                <span className="bg-white/5 text-gray-500 text-xs px-3 py-1 rounded-full">Historial de la Sala</span>
              </div>
              {chatMessages.map((msg) => {
                const isMe = msg.user_id === user.id;
                const timeFormatted = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-gray-500 mb-1 px-1">{msg.sender_name}</span>
                    <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${isMe ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-gray-600 mt-1">{timeFormatted}</span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-[#0E1320] border-t border-white/10 flex gap-3">
              <button type="button" className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl transition">
                <MessageSquare size={20} />
              </button>
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje para la sala..." 
                className="flex-1 bg-black/50 border border-white/10 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
              />
              <button type="submit" className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center justify-center">
                <Send size={20} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}