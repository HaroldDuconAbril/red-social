// src/components/Explore.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, Check, ShieldAlert, X, Image as ImageIcon, MapPin, User, Lock } from 'lucide-react';
import { API_URL } from '../config';

export default function Explore() {
  const { user } = useContext(AuthContext);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState({});

  // Estados para el Modal de Detalle de Usuario
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await axios.get(API_URL + '/api/profiles/all', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        let explorePool = [];

        if (user.role === 'admin') {
          explorePool = res.data.filter(p => p.user_id !== user.id);
        } else {
          explorePool = res.data.filter(p => p.user_id !== user.id && p.role !== 'admin');
        }

        setProfiles(explorePool);
      } catch (error) {
        console.error('Error al cargar perfiles:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchProfiles();
    }
  }, [user]);

  const handleSendRequest = async (targetUserId, e) => {
    e.stopPropagation(); // Evita que se abra el modal al hacer clic en el botón
    setRequestStatus(prev => ({ ...prev, [targetUserId]: 'loading' }));
    
    try {
      await axios.post(API_URL + '/api/friendships/request', 
        { receiver_id: targetUserId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setRequestStatus(prev => ({ ...prev, [targetUserId]: 'sent' }));
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      setRequestStatus(prev => ({ ...prev, [targetUserId]: 'error' }));
    }
  };

  const handleOpenProfileModal = async (userId) => {
    setUserDetailLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/profiles/user/${userId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setSelectedUser(res.data); // { profile: {...}, photos: [...], isFriend: true/false }
    } catch (error) {
      console.error('Error al cargar detalle del perfil:', error);
      alert('No se pudo cargar la información del usuario.');
    } finally {
      setUserDetailLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen px-4 pb-12 pt-8 sm:pt-12">
      <div className="fixed inset-0 bg-[#080B12]/80 backdrop-blur-sm z-0" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-2 bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            <ShieldAlert size={16} /> Zona Exclusiva
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
            Explorar Comunidad
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {user?.role === 'admin' 
              ? 'Vista de administración: Visualizando a todos los miembros registrados.' 
              : 'Haz clic en cualquier tarjeta para ver el perfil completo y su galería de fotos.'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-400 text-xl animate-pulse font-bold">Buscando perfiles compatibles...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-[#0E1320]/80 backdrop-blur-md border border-white/10 rounded-3xl p-10 text-center max-w-2xl mx-auto shadow-2xl">
            <p className="text-gray-300 text-lg font-bold">Aún no hay otros perfiles disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {profiles.map((profile) => (
              <div 
                key={profile.id || profile.user_id} 
                onClick={() => handleOpenProfileModal(profile.user_id)}
                className="bg-[#0E1320]/90 backdrop-blur-md border border-white/10 shadow-2xl rounded-3xl p-6 text-center transition-all hover:-translate-y-2 hover:border-white/30 cursor-pointer overflow-hidden relative flex flex-col"
              >
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-600/10 rounded-full blur-2xl z-0" />

                <div className="relative z-10 flex-1 flex flex-col">
                  <div className="w-20 h-20 mx-auto bg-black/50 border border-white/10 rounded-full flex items-center justify-center text-3xl text-gray-400 mb-4 shadow-inner overflow-hidden">
                    {profile.profile_picture_url ? (
                      <img 
                        src={`${API_URL}${profile.profile_picture_url}`} 
                        alt="Foto de perfil" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>👤</span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white truncate">
                    {profile.username || profile.alias_name || 'Usuario Anónimo'}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1 truncate flex items-center justify-center gap-1">
                    <MapPin size={14} /> {profile.location || 'Sin ubicación'}
                  </p>

                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {profile.category_name && (
                      <span className="bg-purple-900/40 text-purple-300 text-[10px] font-black px-3 py-1 rounded-full border border-purple-500/30 uppercase">
                        {profile.category_name}
                      </span>
                    )}
                    {profile.subcategory_name && (
                      <span className="bg-red-900/40 text-red-300 text-[10px] font-black px-3 py-1 rounded-full border border-red-500/30 uppercase">
                        {profile.subcategory_name}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-4 line-clamp-2 min-h-[2rem]">
                    {profile.bio || 'Sin biografía...'}
                  </p>

                  <div className="mt-auto pt-6">
                    {requestStatus[profile.user_id] === 'sent' ? (
                      <button disabled className="w-full flex items-center justify-center gap-2 bg-green-900/40 text-green-400 border border-green-500/30 font-bold px-4 py-2 rounded-xl text-sm">
                        <Check size={16} /> Enviada
                      </button>
                    ) : requestStatus[profile.user_id] === 'loading' ? (
                      <button disabled className="w-full bg-white/5 text-gray-400 border border-white/10 font-bold px-4 py-2 rounded-xl text-sm animate-pulse">
                        Enviando...
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => handleSendRequest(profile.user_id, e)}
                        className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-4 py-2 rounded-xl text-sm transition-colors"
                      >
                        <UserPlus size={16} /> Conectar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL DE DETALLE DE PERFIL Y FOTOS */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0E1320] border border-white/15 w-full max-w-2xl rounded-3xl p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              
              <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row items-center gap-6 mb-8 border-b border-white/10 pb-6">
                <div className="w-24 h-24 bg-black/50 border border-white/10 rounded-full overflow-hidden flex-shrink-0">
                  {selectedUser.profile.profile_picture_url ? (
                    <img src={`${API_URL}${selectedUser.profile.profile_picture_url}`} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                  )}
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-black text-white">{selectedUser.profile.alias_name}</h2>
                  <p className="text-gray-400 text-sm mt-1 flex items-center justify-center md:justify-start gap-1">
                    <MapPin size={14} /> {selectedUser.profile.location || 'Sin ubicación'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                    <span className="bg-purple-900/40 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30">
                      {selectedUser.profile.category_name}
                    </span>
                    <span className="bg-red-900/40 text-red-300 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30">
                      {selectedUser.profile.subcategory_name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Biografía</h4>
                <p className="text-gray-300 bg-black/40 border border-white/5 p-4 rounded-2xl text-sm leading-relaxed">
                  {selectedUser.profile.bio || 'Este usuario no ha escrito una biografía todavía.'}
                </p>
              </div>

              {/* SECCIÓN DE GALERÍA (Protegida) */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ImageIcon size={16} /> Galería de Fotos {selectedUser.isFriend && `(${selectedUser.photos.length})`}
                </h4>
                
                {!selectedUser.isFriend ? (
                  // VISTA BLOQUEADA (No son amigos)
                  <div className="bg-black/40 border border-red-500/20 p-8 rounded-3xl text-center flex flex-col items-center justify-center gap-4 shadow-inner">
                    <div className="p-4 bg-red-500/10 rounded-full text-red-500">
                      <Lock size={40} />
                    </div>
                    <div>
                      <p className="text-gray-300 font-black text-lg">Galería Privada</p>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto mt-2">
                        Envía una solicitud para conectar. Cuando el usuario acepte, podrás acceder a su contenido exclusivo.
                      </p>
                    </div>
                  </div>
                ) : selectedUser.photos.length === 0 ? (
                  // VISTA PERMITIDA PERO SIN FOTOS
                  <p className="text-gray-500 text-sm italic bg-black/20 p-4 rounded-2xl text-center border border-white/5">
                    Este usuario no tiene fotos en su galería todavía.
                  </p>
                ) : (
                  // VISTA PERMITIDA CON FOTOS (Son amigos)
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedUser.photos.map(photo => (
                      <div key={photo.id} className="aspect-square bg-black/50 border border-white/10 rounded-2xl overflow-hidden shadow-md">
                        <img src={`${API_URL}${photo.photo_url}?token=${encodeURIComponent(localStorage.getItem('token') || '')}`} alt="Galería" className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}