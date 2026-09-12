// src/components/Explore.jsx
import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, Check, ShieldAlert, X, Image as ImageIcon, MapPin, User, Lock, Star } from 'lucide-react';
import { API_URL, getImageUrl, PROFILE_TYPE_LABELS } from '../config';
import { toast } from 'react-hot-toast';
import { StarDisplay, StarInput } from './StarRating';

export default function Explore() {
  const { user } = useContext(AuthContext);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  // Estados de calificaciones (reviews)
  const [reviews, setReviews] = useState({ average: 0, count: 0, reviews: [] });
  const [myReview, setMyReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await api.get('/api/profiles/all');

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

    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const handleSendRequest = async (targetUserId, e) => {
    e.stopPropagation();
    setRequestStatus(prev => ({ ...prev, [targetUserId]: 'loading' }));

    try {
      await api.post('/api/friendships/request', { receiver_id: targetUserId });

      setRequestStatus(prev => ({ ...prev, [targetUserId]: 'sent' }));
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      setRequestStatus(prev => ({ ...prev, [targetUserId]: 'error' }));
    }
  };

  const handleOpenProfileModal = async (userId) => {
    setUserDetailLoading(true);
    try {
      const [profileRes, reviewsRes, myReviewRes] = await Promise.all([
        api.get(`/api/profiles/user/${userId}`),
        api.get(`/api/reviews/${userId}`),
        api.get(`/api/reviews/${userId}/mine`)
      ]);
      setSelectedUser(profileRes.data);
      setReviews(reviewsRes.data);
      setMyReview(myReviewRes.data);
      setReviewForm({
        rating: myReviewRes.data?.rating || 0,
        comment: myReviewRes.data?.comment || ''
      });
    } catch (error) {
      console.error('Error al cargar detalle del perfil:', error);
      toast.error('No se pudo cargar la información del usuario.');
    } finally {
      setUserDetailLoading(false);
    }
  };

  const handleSubmitReview = async (userId) => {
    if (!reviewForm.rating) {
      toast.error('Selecciona una calificación de 1 a 5 estrellas.');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post(`/api/reviews/${userId}`, reviewForm);
      toast.success('¡Calificación guardada!');
      const reviewsRes = await api.get(`/api/reviews/${userId}`);
      setReviews(reviewsRes.data);
      setMyReview({ rating: reviewForm.rating, comment: reviewForm.comment });
    } catch (error) {
      console.error('Error al guardar calificación:', error);
      toast.error(error.response?.data?.error || 'No se pudo guardar la calificación.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setReviews({ average: 0, count: 0, reviews: [] });
    setMyReview(null);
    setReviewForm({ rating: 0, comment: '' });
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
                        src={getImageUrl(profile.profile_picture_url)}
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
                    {(() => {
                      const cat = profile.category_name?.trim();
                      const sub = profile.subcategory_name?.trim();
                      const isSame = cat && sub && cat.toLowerCase() === sub.toLowerCase();

                      if (isSame) {
                        return (
                          <span className="bg-purple-900/40 text-purple-300 text-[10px] font-black px-3 py-1 rounded-full border border-purple-500/30 uppercase">
                            {cat}
                          </span>
                        );
                      }

                      return (
                        <>
                          {cat && (
                            <span className="bg-purple-900/40 text-purple-300 text-[10px] font-black px-3 py-1 rounded-full border border-purple-500/30 uppercase">
                              {cat}
                            </span>
                          )}
                          {sub && (
                            <span className="bg-red-900/40 text-red-300 text-[10px] font-black px-3 py-1 rounded-full border border-red-500/30 uppercase">
                              {sub}
                            </span>
                          )}
                        </>
                      );
                    })()}
                    {profile.profile_type && PROFILE_TYPE_LABELS[profile.profile_type] && (
                      <span className="bg-blue-900/40 text-blue-300 text-[10px] font-black px-3 py-1 rounded-full border border-blue-500/30 uppercase">
                        {PROFILE_TYPE_LABELS[profile.profile_type]}
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

      </div>

      {/* El modal se renderiza FUERA del contenedor "relative z-10" de arriba
          a propósito: ese div crea su propio stacking context (por tener
          z-index), así que aunque el modal use z-50, quedaba encerrado
          dentro de ese contexto con techo z-10 y el Navbar (z-50, pero en
          el stacking context raíz) terminaba tapando su parte superior.
          Sacándolo de ahí y subiendo su z-index, ahora sí queda siempre
          por encima de todo, incluido el Navbar. */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0E1320] border border-white/15 w-full max-w-2xl rounded-3xl p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">

              <button
                onClick={closeModal}
                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row items-center gap-6 mb-8 border-b border-white/10 pb-6">
                <div className="w-24 h-24 bg-black/50 border border-white/10 rounded-full overflow-hidden flex-shrink-0">
                  {selectedUser.profile.profile_picture_url ? (
                    <img src={getImageUrl(selectedUser.profile.profile_picture_url)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                  )}
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-black text-white">{selectedUser.profile.alias_name}</h2>
                  <p className="text-gray-400 text-sm mt-1 flex items-center justify-center md:justify-start gap-1">
                    <MapPin size={14} /> {selectedUser.profile.location || 'Sin ubicación'}
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                    <StarDisplay rating={reviews.average} size={16} />
                    <span className="text-gray-400 text-xs">
                      {reviews.average.toFixed(1)} ({reviews.count} {reviews.count === 1 ? 'reseña' : 'reseñas'})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                    {(() => {
                      const cat = selectedUser.profile.category_name?.trim();
                      const sub = selectedUser.profile.subcategory_name?.trim();
                      const isSame = cat && sub && cat.toLowerCase() === sub.toLowerCase();

                      if (isSame) {
                        return (
                          <span className="bg-purple-900/40 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30">
                            {cat}
                          </span>
                        );
                      }

                      return (
                        <>
                          {cat && (
                            <span className="bg-purple-900/40 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30">
                              {cat}
                            </span>
                          )}
                          {sub && (
                            <span className="bg-red-900/40 text-red-300 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30">
                              {sub}
                            </span>
                          )}
                        </>
                      );
                    })()}
                    {PROFILE_TYPE_LABELS[selectedUser.profile.profile_type] && (
                      <span className="bg-blue-900/40 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30">
                        {PROFILE_TYPE_LABELS[selectedUser.profile.profile_type]}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Biografía</h4>
                <p className="text-gray-300 bg-black/40 border border-white/5 p-4 rounded-2xl text-sm leading-relaxed">
                  {selectedUser.profile.bio || 'Este usuario no ha escrito una biografía todavía.'}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ImageIcon size={16} /> Galería de Fotos {selectedUser.isFriend && `(${selectedUser.photos.length})`}
                </h4>

                {!selectedUser.isFriend ? (
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
                  <p className="text-gray-500 text-sm italic bg-black/20 p-4 rounded-2xl text-center border border-white/5">
                    Este usuario no tiene fotos en su galería todavía.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedUser.photos.map(photo => (
                      <div key={photo.id} className="aspect-square bg-black/50 border border-white/10 rounded-2xl overflow-hidden shadow-md">
                        <img src={getImageUrl(photo.photo_url)} alt="Galería" className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECCIÓN DE CALIFICACIONES */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Star size={16} /> Calificaciones
                </h4>

                {/* Formulario para calificar (propio, anónimo) */}
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-4">
                  <p className="text-gray-300 text-sm font-bold mb-2">
                    {myReview ? 'Tu calificación' : 'Deja tu calificación'}
                  </p>
                  <StarInput
                    value={reviewForm.rating}
                    onChange={(n) => setReviewForm(prev => ({ ...prev, rating: n }))}
                  />
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Escribe un comentario (opcional)..."
                    maxLength={500}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 mt-3 text-white text-sm focus:outline-none focus:border-red-500 resize-none h-20"
                  />
                  <button
                    onClick={() => handleSubmitReview(selectedUser.profile.user_id)}
                    disabled={submittingReview}
                    className="mt-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
                  >
                    {submittingReview ? 'Guardando...' : myReview ? 'Actualizar calificación' : 'Enviar calificación'}
                  </button>
                </div>

                {/* Lista de comentarios anónimos */}
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                  {reviews.reviews.length === 0 ? (
                    <p className="text-gray-500 text-sm italic text-center py-4">Aún no hay calificaciones.</p>
                  ) : (
                    reviews.reviews.map((r, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <StarDisplay rating={r.rating} size={14} />
                          <span className="text-gray-600 text-[10px]">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        {r.comment && <p className="text-gray-300 text-sm">{r.comment}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

    </div>
  );
}
