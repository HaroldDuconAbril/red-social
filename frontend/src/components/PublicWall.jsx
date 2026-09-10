// src/components/PublicWall.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Send, Image as ImageIcon, Calendar, MapPin, Type } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL, getImageUrl } from '../config';

export default function PublicWall() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // Obtenemos el usuario actual y su rol
  const [posts, setPosts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para el nuevo comentario anónimo
  const [newComment, setNewComment] = useState('');

  // Estados para el formulario de Admin (Nuevo Evento/Clasificado)
  const [adminForm, setAdminForm] = useState({
    title: '',
    description: '',
    location: '',
    event_date: '',
    image: null
  });

  const fetchPublicData = async () => {
    try {
      const [wallRes, activitiesRes] = await Promise.all([
        api.get('/api/public/wall'),
        api.get('/api/public/activities')
      ]);
      setPosts(wallRes.data.posts || []);
      setActivities(activitiesRes.data.activities || []);
    } catch (error) {
      console.error('Error cargando el muro público:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicData();
  }, []);

  // Función para enviar un comentario anónimo
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post('/api/public/wall', { content: newComment });
      toast.success('Comentario anónimo publicado');
      setNewComment('');
      fetchPublicData(); // Recargamos para ver el nuevo comentario
    } catch (error) {
      console.error('Error al publicar:', error);
      toast.error('Hubo un error al publicar tu comentario.');
    }
  };

  // Función para crear un Evento/Clasificado (Solo Admin)
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    try {
      // Usamos FormData porque vamos a enviar una imagen (archivo)
      const formData = new FormData();
      formData.append('title', adminForm.title);
      formData.append('description', adminForm.description);
      formData.append('location', adminForm.location);
      formData.append('event_date', adminForm.event_date);
      if (adminForm.image) {
        formData.append('activity_image', adminForm.image);
      }

      await api.post('/api/public/activities', formData);

      toast.success('Anuncio publicado con éxito');
      setAdminForm({ title: '', description: '', location: '', event_date: '', image: null });
      fetchPublicData(); // Recargamos para ver el anuncio
    } catch (error) {
      console.error('Error al crear anuncio:', error);
      toast.error('Error al crear el anuncio.');
    }
  };

  return (
    <div className="relative min-h-screen p-4 sm:p-8 overflow-x-hidden">
      <div className="fixed inset-0 bg-[#080B12]/80 backdrop-blur-sm z-0" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-400">
            Anuncios y Eventos
          </h1>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition backdrop-blur-md border border-white/10"
          >
            Volver
          </button>
        </div>

        {/* PANEL DE ADMINISTRADOR (Solo visible si el rol es 'admin') */}
        {user?.role === 'admin' && (
          <div className="mb-8 bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-md border border-purple-500/30 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              🛡️ Panel de Administrador: Nuevo Anuncio
            </h2>
            <form onSubmit={handleAdminSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 py-2">
                  <Type size={18} className="text-gray-400 mr-2" />
                  <input type="text" placeholder="Título del anuncio" required className="bg-transparent text-white w-full focus:outline-none" 
                    value={adminForm.title} onChange={(e) => setAdminForm({...adminForm, title: e.target.value})} />
                </div>
                <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 py-2">
                  <MapPin size={18} className="text-gray-400 mr-2" />
                  <input type="text" placeholder="Ubicación / Lugar" className="bg-transparent text-white w-full focus:outline-none" 
                    value={adminForm.location} onChange={(e) => setAdminForm({...adminForm, location: e.target.value})} />
                </div>
                <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 py-2">
                  <Calendar size={18} className="text-gray-400 mr-2" />
                  <input type="date" required className="bg-transparent text-gray-300 w-full focus:outline-none" 
                    value={adminForm.event_date} onChange={(e) => setAdminForm({...adminForm, event_date: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4 flex flex-col">
                <textarea placeholder="Descripción del evento o clasificado..." required className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white w-full h-24 focus:outline-none resize-none"
                  value={adminForm.description} onChange={(e) => setAdminForm({...adminForm, description: e.target.value})} />
                
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-2 rounded-xl cursor-pointer transition">
                    <ImageIcon size={18} /> {adminForm.image ? 'Imagen Seleccionada' : 'Subir Imagen'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setAdminForm({...adminForm, image: e.target.files[0]})} />
                  </label>
                  <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-xl transition shadow-lg shadow-purple-900/30">
                    Publicar
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-400 text-xl animate-pulse font-bold">Cargando la información...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* COLUMNA 1: Actividades y Clasificados */}
            <section className="bg-[#0E1320]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col h-[700px]">
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                📅 Clasificados y Eventos
              </h2>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                {activities.length === 0 ? (
                  <p className="text-gray-400 text-center mt-10">No hay anuncios publicados en este momento.</p>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition">
                      {act.image_url && (
<img src={getImageUrl(act.image_url)} alt={act.title} className="w-full h-48 object-cover" />                      )}
                      <div className="p-5">
                        <h3 className="text-xl font-black text-red-400">{act.title}</h3>
                        <p className="text-gray-300 mt-2 text-sm whitespace-pre-wrap">{act.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-gray-400">
                          {act.location && <span className="bg-black/40 px-3 py-1.5 rounded-lg flex items-center gap-1"><MapPin size={12}/> {act.location}</span>}
                          {act.event_date && <span className="bg-black/40 px-3 py-1.5 rounded-lg flex items-center gap-1"><Calendar size={12}/> {new Date(act.event_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* COLUMNA 2: Muro Anónimo */}
            <section className="bg-gradient-to-br from-red-900/20 to-[#2B0508]/40 backdrop-blur-md border border-red-500/20 rounded-3xl p-6 shadow-2xl flex flex-col h-[700px]">
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-red-500/20 pb-4">
                💬 Muro Anónimo
              </h2>
              
              {/* Formulario de Comentarios para Usuarios */}
              {user && (
                <form onSubmit={handleCommentSubmit} className="mb-6 flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Escribe tu comentario anónimo aquí..." 
                    className="flex-1 bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    maxLength={250}
                  />
                  <button type="submit" className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl transition shadow-lg shadow-red-900/30 flex items-center justify-center">
                    <Send size={20} />
                  </button>
                </form>
              )}

              {/* Lista de Comentarios */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {posts.length === 0 ? (
                  <p className="text-gray-400 text-center mt-10">Sé el primero en romper el hielo.</p>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="bg-black/40 border border-white/5 rounded-2xl p-4 hover:bg-white/5 transition">
                      <p className="text-red-400 font-bold text-sm mb-1">@{post.alias_name || 'Anónimo'}</p>
                      <p className="text-gray-200">{post.content}</p>
                      <p className="text-gray-500 text-xs mt-2 text-right">{new Date(post.created_at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}