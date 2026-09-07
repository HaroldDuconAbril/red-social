// src/components/Chat.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Send, Search, User, Lock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function Chat() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NUEVOS ESTADOS PARA MENSAJES
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // 1. Cargar la lista de contactos (friendships)
  useEffect(() => {
    const fetchContacts = async () => {
      const token = user?.token || localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get('http://localhost:5000/api/friendships/contacts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setContactos(response.data.contacts || []);
      } catch (error) {
        console.error('Error al cargar contactos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [user]);

  // 2. NUEVO: Cargar el historial de mensajes cuando seleccionas un chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChat) return;
      
      const token = user?.token || localStorage.getItem('token');
      try {
        // Llama a la ruta getChatHistory que acabas de mostrarme
        const response = await axios.get(`http://localhost:5000/api/messages/${activeChat.user_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChatHistory(response.data.messages || []);
        scrollToBottom();
      } catch (error) {
        console.error('Error al cargar mensajes:', error);
      }
    };

    fetchMessages();
  }, [activeChat, user]);

  // Función para que el chat baje automáticamente al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 3. NUEVO: Enviar el mensaje a tu backend
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChat) return;

    const token = user?.token || localStorage.getItem('token');
    const tempMessage = message;
    setMessage(''); // Limpiamos el input rápido para mejor UX

    try {
      // Llama a tu controlador sendMessage
      const response = await axios.post('http://localhost:5000/api/messages', {
        receiver_id: activeChat.user_id,
        content: tempMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Agregamos el mensaje recién enviado a la pantalla inmediatamente
      setChatHistory(prev => [...prev, response.data.data]);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080B12]">
        <p className="text-red-500 font-bold animate-pulse text-xl">Cargando chats...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-4 sm:pt-8 px-4 pb-8 flex justify-center">
      <div className="fixed inset-0 bg-[#080B12]/80 backdrop-blur-sm z-0" />

      <div className="relative z-10 w-full max-w-6xl bg-[#0E1320]/90 backdrop-blur-md border border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row h-[calc(100vh-140px)]">
        
        {contactos.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center z-20">
            <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
              <Lock className="text-red-500" size={48} />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">Chat Privado</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-8 text-lg">
              Tus mensajes se habilitarán cuando envíes solicitudes y sean aceptadas.
            </p>
            <button 
              onClick={() => navigate('/explorar')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-red-900/30 flex items-center gap-2"
            >
              <Users size={20} /> Ir a Explorar Perfiles
            </button>
          </div>
        ) : (
          <>
            {/* PANEL IZQUIERDO (Lista de Contactos) */}
            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/10 flex flex-col bg-black/20">
              {/* Buscador de contactos omitido por brevedad, es igual al tuyo */}
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-black text-white mb-4">Mensajes</h2>
                <div className="relative">
                  <input type="text" placeholder="Buscar chat..." className="w-full bg-black/50 border border-white/10 text-white rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-red-500 text-sm" />
                  <Search size={16} className="absolute left-3 top-2.5 text-gray-500" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {contactos.map(contacto => (
                  <div 
                    key={contacto.user_id}
                    onClick={() => setActiveChat(contacto)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                      activeChat?.user_id === contacto.user_id ? 'bg-red-600/20 border border-red-500/30' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="relative">
                      {contacto.profile_picture_url ? (
                        <img src={`http://localhost:5000${contacto.profile_picture_url}`} alt="avatar" className="w-12 h-12 rounded-full object-cover border border-white/10"/>
                      ) : (
                        <div className="w-12 h-12 bg-black/50 border border-white/10 rounded-full flex items-center justify-center text-gray-400">
                          <User size={20} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm">{contacto.alias_name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PANEL DERECHO (Historial de Mensajes) */}
            <div className="flex-1 flex flex-col relative bg-gradient-to-br from-[#0E1320] to-[#1a0a0c]">
              {!activeChat ? (
                <div className="flex-1 flex flex-col items-center justify-center z-10 text-center p-6">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                    <Send className="text-gray-500 ml-1" size={24} />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Tus Conexiones</h3>
                  <p className="text-gray-500">Selecciona un chat de la lista izquierda para iniciar.</p>
                </div>
              ) : (
                <>
                  {/* Cabecera del Chat Activo */}
                  <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-black/20 z-10">
                    <div className="w-10 h-10 bg-black/50 border border-white/10 rounded-full flex items-center justify-center text-gray-400 overflow-hidden">
                      {activeChat.profile_picture_url ? <img src={`http://localhost:5000${activeChat.profile_picture_url}`} alt="avatar" className="w-full h-full object-cover"/> : <User size={18} />}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{activeChat.alias_name}</h3>
                    </div>
                  </div>

                  {/* Renderizado dinámico de los mensajes */}
                  <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 z-10">
                    {chatHistory.length === 0 ? (
                      <p className="text-center text-gray-500 mt-4">No hay mensajes todavía. ¡Escribe el primero!</p>
                    ) : (
                      chatHistory.map(msg => {
                        // Comparamos si el mensaje lo enviaste tú o tu amigo
                        // Asumiendo que msg.sender_id existe y sabemos cuál es nuestro ID. 
                        // Una forma fácil en frontend es checar si el receiver_id es igual al del chat actual.
                        const isMine = msg.receiver_id === activeChat.user_id;

                        return (
                          <div 
                            key={msg.id} 
                            className={`px-4 py-3 rounded-2xl max-w-[85%] sm:max-w-[70%] text-sm ${
                              isMine 
                                ? 'self-end bg-red-600 text-white rounded-tr-none shadow-lg shadow-red-900/20' 
                                : 'self-start bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                            }`}
                          >
                            {msg.content}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Formulario de envío */}
                  <div className="p-4 border-t border-white/10 bg-black/30 z-10">
                    <form className="flex gap-2" onSubmit={handleSendMessage}>
                      <input 
                        type="text" 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escribe un mensaje..." 
                        className="flex-1 bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
                      />
                      <button type="submit" className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl transition-colors shadow-lg shadow-red-900/30 flex items-center justify-center">
                        <Send size={20} />
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}