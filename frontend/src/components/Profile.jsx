import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { ImagePlus, Lock, Camera, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { API_URL, getImageUrl, PROFILE_TYPE_LABELS } from '../config';

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); 
  
  const [isEditing, setIsEditing] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [editForm, setEditForm] = useState({
    alias_name: '',
    location: '',
    bio: '',
    profile_picture: null 
  });

  // Estado para la galería y notificaciones
  const fileInputRef = useRef(null);
  const [uploadingPrivate, setUploadingPrivate] = useState(false);
  const [myPhotos, setMyPhotos] = useState([]); // Unificado a myPhotos
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Función para mostrar notificaciones elegantes
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3500);
  };

  // Función para cargar la galería privada
  const fetchGallery = async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/profiles/gallery');
      setMyPhotos(res.data || []); 
    } catch (error) {
      console.error('Error al cargar la galería:', error);
    }
  };

  // Efecto para cargar fotos al abrir la pestaña de galería
  useEffect(() => {
    if (activeTab === 'gallery') {
      fetchGallery();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const res = await api.get('/api/profiles/me');
        setProfileData(res.data);
        setEditForm({
          alias_name: res.data.alias_name || '',
          location: res.data.location || '',
          bio: res.data.bio || '',
          profile_picture: null
        });
      } catch (error) { 
        console.error('Error al cargar:', error); 
      } finally { 
        setLoading(false); 
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateStatus('Guardando...');

    const formData = new FormData();
    formData.append('alias_name', editForm.alias_name);
    formData.append('location', editForm.location);
    formData.append('bio', editForm.bio);
    if (editForm.profile_picture) {
      formData.append('profile_picture', editForm.profile_picture);
    }

    try {
      // Con FormData, axios arma solo el header Content-Type con el
      // boundary correcto; no hace falta ponerlo a mano (y ponerlo mal
      // rompe el parseo multipart). La cookie de sesión viaja sola.
      const res = await api.put('/api/profiles/me', formData);
      
      setProfileData({ ...profileData, ...res.data.profile, alias_name: editForm.alias_name });
      setUpdateStatus('');
      setIsEditing(false);
      showToast('Perfil actualizado correctamente', 'success');
    } catch (error) {
      console.error('Error al actualizar:', error);
      setUpdateStatus('❌ Error al guardar los cambios.');
    }
  };

  const handlePrivatePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPrivate(true);
    const formData = new FormData();
    formData.append('private_photo', file);

    try {
      await api.post('/api/profiles/gallery', formData);
      
      showToast('Foto subida a tu galería privada', 'success');
      fetchGallery(); // Recargamos la galería para mostrar la nueva foto
    } catch (error) {
      console.error('Error al subir foto privada:', error);
      showToast('Hubo un error al subir la foto', 'error');
    } finally {
      setUploadingPrivate(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Función para eliminar
  const deletePhoto = async (id) => {
    try {
      await api.delete(`/api/profiles/gallery/${id}`);
      setMyPhotos(myPhotos.filter(p => p.id !== id));
      showToast('Foto eliminada exitosamente', 'success');
    } catch (e) { 
      showToast('Error al eliminar la foto', 'error'); 
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
      {/* Sistema de Notificaciones (Toast) */}
      {toast.visible && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-[#0E1320]/90 border-green-500/30 text-white' 
            : 'bg-[#0E1320]/90 border-red-500/50 text-white'
        }`}>
          {toast.type === 'success' 
            ? <CheckCircle size={20} className="text-green-400" /> 
            : <AlertCircle size={20} className="text-red-500" />
          }
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}

      <div className="fixed inset-0 bg-[#080B12]/80 backdrop-blur-sm z-0" />

      <div className="relative z-10 w-full max-w-3xl bg-[#0E1320]/90 backdrop-blur-md border border-white/10 shadow-2xl p-6 sm:p-10 rounded-3xl overflow-hidden mt-10 sm:mt-0">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-700/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-white mb-6">Mi Espacio Privado</h2>
            
            <div className="relative w-32 h-32 mx-auto mb-4 group">
              {profileData?.profile_picture_url ? (
                <img 
                  src={getImageUrl(profileData.profile_picture_url)} 
                  alt="Perfil" 
                  className="w-full h-full rounded-full object-cover border-4 border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                />
              ) : (
                <div className="w-full h-full bg-black/50 border-4 border-red-500/50 rounded-full flex items-center justify-center text-5xl text-gray-400 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                  👤
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-white">{profileData?.alias_name || 'Usuario'}</h3>
            <p className="text-red-400 font-bold text-sm">{profileData?.role === 'admin' ? '⭐ Administrador' : 'Miembro'}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {profileData?.subcategory_name && (
                <span className="bg-purple-900/40 text-purple-300 text-[10px] font-black px-3 py-1 rounded-full border border-purple-500/30 uppercase">
                  {profileData.category_name} · {profileData.subcategory_name}
                </span>
              )}
              {profileData?.profile_type && PROFILE_TYPE_LABELS[profileData.profile_type] && (
                <span className="bg-red-900/40 text-red-300 text-[10px] font-black px-3 py-1 rounded-full border border-red-500/30 uppercase">
                  {PROFILE_TYPE_LABELS[profileData.profile_type]}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-4 border-b border-white/10 mb-6 justify-center">
            <button onClick={() => setActiveTab('info')} className={`pb-3 px-4 flex items-center gap-2 font-bold transition-all ${activeTab === 'info' ? 'border-b-2 border-red-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              <Info size={18} /> Información
            </button>
            <button onClick={() => setActiveTab('gallery')} className={`pb-3 px-4 flex items-center gap-2 font-bold transition-all ${activeTab === 'gallery' ? 'border-b-2 border-red-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              <Lock size={18} /> Galería Privada
            </button>
          </div>

          {loading ? (
            <p className="text-center text-gray-400 animate-pulse font-bold py-10">Cargando...</p>
          ) : activeTab === 'info' ? (
            
            isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4 text-left bg-black/30 border border-white/10 p-6 rounded-2xl">
                
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
                  <div className="bg-red-500/20 p-3 rounded-full text-red-400"><Camera size={24}/></div>
                  <div className="flex-1">
                    <label className="block text-white font-bold text-sm mb-1">Foto de Perfil Pública</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setEditForm({...editForm, profile_picture: e.target.files[0]})}
                      className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-red-600/20 file:text-red-400 hover:file:bg-red-600/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Alias Público</label>
                    <input type="text" value={editForm.alias_name} onChange={(e) => setEditForm({...editForm, alias_name: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-red-500" placeholder="Ej. CyberNinja" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Ubicación</label>
                    <input type="text" value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-red-500" placeholder="Ej. Colombia" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Biografía</label>
                  <textarea value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 h-24 focus:outline-none focus:border-red-500 resize-none custom-scrollbar" placeholder="¿Qué buscas?" />
                </div>

                {updateStatus && <p className="text-red-400 text-sm font-bold text-center">{updateStatus}</p>}

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black px-4 py-3 rounded-xl transition-colors shadow-lg shadow-red-900/30">Guardar</button>
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-black px-4 py-3 rounded-xl transition-colors">Cancelar</button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 text-left bg-black/30 border border-white/10 p-6 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Ubicación</p>
                    <p className="text-lg text-white font-medium">{profileData?.location || 'Aún no especificada'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Descripcion, Cuentanos de ti</p>
                  <p className="text-gray-300 mt-2 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
                    {profileData?.bio || 'No has escrito nada sobre ti. Anímate a compartir qué estás buscando.'}
                  </p>
                </div>
                
                <div className="mt-8 flex justify-center border-t border-white/10 pt-6">
                  <button onClick={() => setIsEditing(true)} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black px-8 py-3 rounded-xl transition-colors">
                    Editar Perfil
                  </button>
                </div>
              </div>
            )
          ) : (
            
            // Vista de Galería Privada
            <div className="bg-black/30 border border-white/10 p-6 rounded-2xl">
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b border-white/10 pb-6">
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold text-white mb-1 flex items-center justify-center sm:justify-start gap-2">
                    <Lock size={18} className="text-red-400"/> Tu Galería Privada
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Exclusiva para tus conexiones aprobadas.
                  </p>
                </div>
                
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePrivatePhotoUpload} />
                <button 
                  onClick={() => fileInputRef.current.click()} 
                  disabled={uploadingPrivate}
                  className={`text-white font-black px-5 py-2.5 rounded-xl transition-colors shadow-lg flex items-center gap-2 ${uploadingPrivate ? 'bg-red-900 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-red-900/30'}`}
                >
                  <ImagePlus size={18} /> 
                  {uploadingPrivate ? 'Subiendo...' : 'Subir Foto'}
                </button>
              </div>

              {/* Grid de Imágenes Privadas con Opción de Eliminar */}
              {myPhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                  {myPhotos.map(photo => (
                    <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/50">
                      <img 
                        src={getImageUrl(photo.photo_url)} 
                        alt="Privada"
                        className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-110" 
                      />
                      {/* Botón de eliminar (X) */}
                      <button 
                        onClick={() => deletePhoto(photo.id)}
                        className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-lg"
                        title="Eliminar foto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center text-gray-500 mb-4">
                    <Camera size={28} />
                  </div>
                  <p className="text-gray-400 font-medium">Aún no tienes fotos en tu galería privada.</p>
                  <p className="text-gray-500 text-sm mt-1">Sube tu primera foto para empezar.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}