// src/components/AdminPanel.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CheckCircle, XCircle, FileImage, ShieldAlert, Users, ListTodo, Trash2, UserPlus, ShieldPlus, Mail, Layers, MonitorPlay, PlusCircle, Edit3 } from 'lucide-react';
import { API_URL } from '../config';

export default function AdminPanel() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para categorías y subcategorías
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [assignments, setAssignments] = useState({});

  // Estados para formularios de creación de categorías/subcategorías
  const [newCatName, setNewCatName] = useState('');
  const [newSubCat, setNewSubCat] = useState({ category_id: '', name: '' });

  // Estados para creación de salas y acciones especiales
  const [newRoom, setNewRoom] = useState({ name: '', type: 'chat' });
  const [selectedUsersForRoom, setSelectedUsersForRoom] = useState([]);
  const [bypassEmail, setBypassEmail] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const getToken = () => user?.token || localStorage.getItem('token');

  const loadData = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [reqRes, userRes, catRes, subcatRes, roomsRes] = await Promise.all([
        axios.get(API_URL + '/api/admin/verification/pending', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_URL + '/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_URL + '/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_URL + '/api/admin/subcategories', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_URL + '/api/admin/rooms', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRequests(reqRes.data || []);
      setUsers(userRes.data || []);
      setCategories(catRes.data || []);
      setSubcategories(subcatRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos del panel:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleAssignmentChange = (reqId, field, value) => {
    setAssignments(prev => ({
      ...prev,
      [reqId]: {
        ...prev[reqId],
        [field]: value,
        ...(field === 'category_id' ? { subcategory_id: '' } : {})
      }
    }));
  };

  const handleAction = async (requestId, action) => {
    const token = getToken();
    const backendStatus = action === 'approve' ? 'aprobado' : 'rechazado';
    const subcategoryId = assignments[requestId]?.subcategory_id;

    if (action === 'approve' && !subcategoryId) {
      alert('⚠️ Debes asignar una Categoría y Subcategoría antes de aprobar al usuario.');
      return;
    }

    try {
      await axios.put(`${API_URL}/api/admin/verification/${requestId}/review`, 
        { status: backendStatus, subcategory_id: subcategoryId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(prev => prev.filter(req => req.id !== requestId));
      setAssignments(prev => {
        const newAssigns = { ...prev };
        delete newAssigns[requestId];
        return newAssigns;
      });
    } catch (error) {
      console.error(`Error al procesar la solicitud (${action}):`, error);
      alert('Hubo un error al procesar esta solicitud.');
    }
  };

  const deleteUser = async (id) => {
    const token = getToken();
    if (!window.confirm('¿Eliminar usuario permanentemente?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Hubo un error al eliminar el usuario.');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      await axios.post(API_URL + '/api/admin/categories', { name: newCatName }, { headers: { Authorization: `Bearer ${token}` } });
      alert('¡Categoría creada con éxito!');
      setNewCatName('');
      loadData();
    } catch (error) {
      console.error('Error al crear categoría:', error);
      alert(error.response?.data?.error || 'Error al crear la categoría.');
    }
  };

  const handleEditCategory = async (catId, currentName) => {
    const newName = prompt('Editar nombre de la categoría:', currentName);
    if (!newName || !newName.trim() || newName === currentName) return;
    const token = getToken();
    try {
      await axios.put(`${API_URL}/api/admin/categories/${catId}`, { name: newName }, { headers: { Authorization: `Bearer ${token}` } });
      alert('¡Categoría actualizada con éxito!');
      loadData();
    } catch (error) {
      console.error('Error al editar categoría:', error);
      alert('Error al actualizar la categoría.');
    }
  };

  const handleCreateSubcategory = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      await axios.post(API_URL + '/api/admin/subcategories', newSubCat, { headers: { Authorization: `Bearer ${token}` } });
      alert('¡Subcategoría creada con éxito!');
      setNewSubCat({ category_id: '', name: '' });
      loadData();
    } catch (error) {
      console.error('Error al crear subcategoría:', error);
      alert(error.response?.data?.error || 'Error al crear la subcategoría.');
    }
  };

  const handleEditSubcategory = async (subId, currentName) => {
    const newName = prompt('Editar nombre del grupo:', currentName);
    if (!newName || !newName.trim() || newName === currentName) return;
    const token = getToken();
    try {
      await axios.put(`${API_URL}/api/admin/subcategories/${subId}`, { name: newName }, { headers: { Authorization: `Bearer ${token}` } });
      alert('¡Grupo actualizado con éxito!');
      loadData();
    } catch (error) {
      console.error('Error al editar subcategoría:', error);
      alert('Error al actualizar el grupo.');
    }
  };

  const handleForceApprove = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      await axios.post(API_URL + '/api/admin/force-approve', { email: bypassEmail }, { headers: { Authorization: `Bearer ${token}` } });
      alert('¡Aprobación forzada con éxito! Correo enviado.');
      setBypassEmail('');
    } catch (error) {
      console.error('Error al forzar aprobación:', error);
      alert(error.response?.data?.error || 'Error al procesar la solicitud.');
    }
  };

  const handlePromoteAdmin = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      await axios.post(API_URL + '/api/admin/promote-by-email', { email: adminEmail }, { headers: { Authorization: `Bearer ${token}` } });
      alert('¡Permisos de administrador concedidos!');
      setAdminEmail('');
      loadData();
    } catch (error) {
      console.error('Error al dar permisos de admin:', error);
      alert(error.response?.data?.error || 'Usuario no encontrado.');
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsersForRoom(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      await axios.post(API_URL + '/api/admin/rooms', {
        name: newRoom.name,
        room_type: newRoom.type,
        participants: selectedUsersForRoom
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      alert('Sala creada y usuarios asignados con éxito.');
      setNewRoom({ name: '', type: 'chat' });
      setSelectedUsersForRoom([]);
      loadData();
    } catch (error) {
      console.error('Error al crear sala:', error);
      alert('Error al crear la sala.');
    }
  };

  const handleDissolveRoom = async (roomId) => {
    if (!window.confirm('¿Seguro que deseas disolver esta sala?')) return;
    const token = getToken();
    try {
      await axios.put(`${API_URL}/api/admin/rooms/${roomId}/dissolve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setRooms(prev => prev.filter(r => r.id !== roomId));
    } catch (error) {
      console.error('Error al disolver sala:', error);
      alert('Error al disolver la sala.');
    }
  };

  return (
    <div className="relative min-h-screen px-4 pb-12 pt-8 sm:pt-12">
      <div className="fixed inset-0 bg-[#080B12]/90 backdrop-blur-md z-0" />
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8 border-b border-red-500/20 pb-6">
          <div className="w-14 h-14 bg-red-900/30 border border-red-500/50 rounded-2xl flex items-center justify-center text-red-400">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">Panel de Control</h1>
            <p className="text-gray-400">Validación manual, gestión de usuarios, salas y categorías</p>
          </div>
        </div>

        {/* PESTAÑAS DE NAVEGACIÓN DEL PANEL */}
        <div className="flex gap-6 border-b border-white/10 mb-8 overflow-x-auto custom-scrollbar">
          {[
            { id: 'requests', label: 'Solicitudes Pendientes', icon: ListTodo },
            { id: 'users', label: 'Gestión de Usuarios', icon: Users },
            { id: 'rooms', label: 'Salas Grupales', icon: MonitorPlay },
            { id: 'categories', label: 'Categorías y Grupos', icon: Layers },
            { id: 'actions', label: 'Acciones Especiales', icon: ShieldPlus }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 flex items-center gap-2 font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'border-b-2 border-red-500 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                <Icon size={20} />{tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl animate-pulse font-bold">Cargando base de datos...</p>
          </div>
        ) : activeTab === 'categories' ? (
          /* SECCIÓN DE GESTIÓN DE CATEGORÍAS Y SUBCATEGORÍAS CON OPCIÓN DE EDITAR */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Formulario 1: Crear Categoría */}
            <div className="bg-[#0E1320]/80 rounded-3xl border border-white/10 p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><PlusCircle size={24} /></div>
                <h2 className="text-xl font-black text-white">Nueva Categoría Principal</h2>
              </div>
              <p className="text-gray-400 text-sm mb-6">Ejemplo: "Rango de Edad", "Ubicación", "Interés principal".</p>
              
              <form onSubmit={handleCreateCategory} className="flex flex-col gap-4">
                <input 
                  type="text" required value={newCatName} onChange={(e) => setNewCatName(e.target.value)} 
                  placeholder="Nombre de la categoría..." 
                  className="w-full bg-black/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-purple-500"
                />
                <button type="submit" className="w-full bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/30 hover:border-transparent font-black py-3 rounded-xl transition-all">
                  Crear Categoría
                </button>
              </form>
            </div>

            {/* Formulario 2: Crear Subcategoría / Grupo */}
            <div className="bg-[#0E1320]/80 rounded-3xl border border-white/10 p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Layers size={24} /></div>
                <h2 className="text-xl font-black text-white">Nuevo Grupo o Subcategoría</h2>
              </div>
              <p className="text-gray-400 text-sm mb-6">Ejemplo: "18 a 25 años", "35 a 40 años", "Bogotá".</p>
              
              <form onSubmit={handleCreateSubcategory} className="flex flex-col gap-4">
                <select 
                  required value={newSubCat.category_id} onChange={(e) => setNewSubCat({...newSubCat, category_id: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecciona categoría padre...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <input 
                  type="text" required value={newSubCat.name} onChange={(e) => setNewSubCat({...newSubCat, name: e.target.value})} 
                  placeholder="Nombre del grupo (ej: 35 a 40 años)..." 
                  className="w-full bg-black/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500"
                />
                <button type="submit" className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 hover:border-transparent font-black py-3 rounded-xl transition-all">
                  Crear Grupo
                </button>
              </form>
            </div>

            {/* Lista visual con botones para editar categorías y grupos */}
            <div className="md:col-span-2 bg-[#0E1320]/80 rounded-3xl border border-white/10 p-8 shadow-2xl">
              <h3 className="text-xl font-black text-white mb-4">Estructura Actual de Grupos (Con opción de editar)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                        <h4 className="font-bold text-purple-400 text-lg">{cat.name}</h4>
                        <button 
                          onClick={() => handleEditCategory(cat.id, cat.name)}
                          className="text-gray-400 hover:text-white p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition"
                          title="Editar Categoría"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                      <ul className="space-y-2">
                        {subcategories
                          .filter(sub => sub.category_id == cat.id)
                          .map(sub => (
                            <li key={sub.id} className="text-sm bg-white/5 px-3 py-1.5 rounded-xl text-gray-300 flex justify-between items-center">
                              <span>{sub.name}</span>
                              <button 
                                onClick={() => handleEditSubcategory(sub.id, sub.name)}
                                className="text-gray-500 hover:text-purple-300 p-1 rounded transition"
                                title="Editar Grupo"
                              >
                                <Edit3 size={12} />
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'rooms' ? (
          /* SECCIÓN DE SALAS GRUPALES */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-[#0E1320]/80 rounded-3xl border border-white/10 p-6 shadow-2xl h-fit">
              <h2 className="text-xl font-black text-white mb-4">Crear Nueva Sala</h2>
              <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
                <input 
                  type="text" required placeholder="Nombre de la sala..." 
                  value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                />
                <select 
                  value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                >
                  <option value="chat">Sala de Chat</option>
                  <option value="video">Sala de Videollamada</option>
                </select>

                <div className="mt-2">
                  <p className="text-sm font-bold text-gray-400 mb-2">Seleccionar Usuarios ({selectedUsersForRoom.length})</p>
                  <div className="h-48 overflow-y-auto custom-scrollbar bg-black/30 border border-white/5 rounded-xl p-2 space-y-1">
                    {users.filter(u => u.role !== 'admin').map(u => (
                      <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedUsersForRoom.includes(u.id)}
                          onChange={() => toggleUserSelection(u.id)}
                          className="accent-purple-500 w-4 h-4"
                        />
                        <span className="text-gray-300 text-sm">{u.username} ({u.email})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/30 hover:border-transparent font-black py-3 rounded-xl transition-all mt-2">
                  Crear y Asignar
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-[#0E1320]/80 rounded-3xl border border-white/10 p-6 shadow-2xl">
              <h2 className="text-xl font-black text-white mb-6">Salas Activas</h2>
              {rooms.length === 0 ? (
                <p className="text-gray-400">No hay salas grupales activas en este momento.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rooms.map(room => (
                    <div key={room.id} className="bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">{room.name}</h3>
                          <span className={`text-xs font-black px-2 py-1 rounded-full uppercase tracking-wide inline-block mt-2 ${room.room_type === 'video' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                            {room.room_type}
                          </span>
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-white/5">
                        <button onClick={() => handleDissolveRoom(room.id)} className="w-full flex items-center justify-center gap-2 bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 hover:border-transparent font-bold py-2 rounded-xl transition-all text-sm">
                          <Trash2 size={16} /> Disolver Sala
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'users' ? (
          /* GESTIÓN DE USUARIOS */
          <div className="bg-[#0E1320]/80 rounded-3xl border border-white/10 p-6 shadow-2xl overflow-x-auto custom-scrollbar">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <Users className="text-red-400" />Usuarios registrados
            </h2>
            {users.length === 0 ? (
              <p className="text-gray-400">No hay usuarios registrados.</p>
            ) : (
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="pb-4">ID</th>
                    <th className="pb-4">Usuario</th>
                    <th className="pb-4">Email</th>
                    <th className="pb-4">Rol</th>
                    <th className="pb-4">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-white/5 text-gray-300">
                      <td className="py-4 text-xs font-mono">{u.id}</td>
                      <td className="py-4 font-bold text-white">{u.username}</td>
                      <td className="py-4">{u.email}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-black ${u.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4">
                        <button onClick={() => deleteUser(u.id)} className="inline-flex items-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-black px-4 py-2 rounded-xl transition-all text-sm">
                          <Trash2 size={16} />Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : activeTab === 'actions' ? (
          /* ACCIONES ESPECIALES */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0E1320]/80 rounded-3xl border border-white/10 p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><UserPlus size={24} /></div>
                <h2 className="text-xl font-black text-white">Crear / Autorizar Usuario</h2>
              </div>
              <p className="text-gray-400 text-sm mb-6">Autoriza directamente un correo, saltando la validación o levantando el bloqueo.</p>
              <form onSubmit={handleForceApprove} className="flex flex-col gap-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input type="email" required value={bypassEmail} onChange={(e) => setBypassEmail(e.target.value)} placeholder="correo@ejemplo.com" className="w-full bg-black/50 border border-white/10 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500/50" />
                </div>
                <button type="submit" className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 font-black py-3 rounded-xl transition-all">Enviar Enlace de Registro</button>
              </form>
            </div>

            <div className="bg-[#0E1320]/80 rounded-3xl border border-white/10 p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><ShieldAlert size={24} /></div>
                <h2 className="text-xl font-black text-white">Nombrar Administrador</h2>
              </div>
              <p className="text-gray-400 text-sm mb-6">El usuario ya debe estar registrado en el sistema antes de otorgarle este rol.</p>
              <form onSubmit={handlePromoteAdmin} className="flex flex-col gap-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="correo@ejemplo.com" className="w-full bg-black/50 border border-white/10 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-purple-500/50" />
                </div>
                <button type="submit" className="w-full bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/30 font-black py-3 rounded-xl transition-all">Otorgar Rol Admin</button>
              </form>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-[#0E1320]/80 border border-white/5 rounded-3xl p-10 text-center shadow-2xl">
            <p className="text-gray-300 text-lg font-bold">No hay solicitudes pendientes.</p>
          </div>
        ) : (
          /* SOLICITUDES PENDIENTES CON ASIGNACIÓN DE CATEGORÍA */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map(req => (
              <div key={req.id} className="bg-gradient-to-b from-[#0E1320] to-black/80 border border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
                <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Solicitud #{req.id}</p>
                  <h3 className="text-lg font-bold text-white truncate">{req.email}</h3>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Descripción del usuario</p>
                    <p className="text-sm text-gray-300 bg-black/50 p-3 rounded-xl border border-white/5 h-24 overflow-y-auto custom-scrollbar">
                      {req.user_description || 'Sin descripción.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <a href={`${API_URL}${req.full_body_photo_url}?token=${encodeURIComponent(getToken() || '')}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-colors">
                      <FileImage size={24} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-400 text-center">Cuerpo Entero</span>
                    </a>
                    <a href={`${API_URL}${req.sign_photo_url}?token=${encodeURIComponent(getToken() || '')}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-colors">
                      <FileImage size={24} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-400 text-center">Seña Manual</span>
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-black/40 border-t border-white/5 flex flex-col gap-3">
                  <p className="text-xs font-bold text-purple-400 uppercase flex items-center gap-1">
                    <Layers size={14} /> Asignar Grupo (Requerido)
                  </p>
                  <select 
                    className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                    value={assignments[req.id]?.category_id || ''}
                    onChange={(e) => handleAssignmentChange(req.id, 'category_id', e.target.value)}
                  >
                    <option value="">1. Selecciona Categoría...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>

                  <select 
                    className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    value={assignments[req.id]?.subcategory_id || ''}
                    onChange={(e) => handleAssignmentChange(req.id, 'subcategory_id', e.target.value)}
                    disabled={!assignments[req.id]?.category_id}
                  >
                    <option value="">2. Selecciona Subcategoría...</option>
                    {subcategories
                      .filter(s => s.category_id == assignments[req.id]?.category_id)
                      .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="p-3 grid grid-cols-2 gap-2 bg-black/60">
                  <button onClick={() => handleAction(req.id, 'reject')} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-red-900/40 text-gray-400 hover:text-red-400 border border-transparent font-black py-3 rounded-xl transition-all text-sm">
                    <XCircle size={18} />Rechazar
                  </button>
                  <button 
                    onClick={() => handleAction(req.id, 'approve')} 
                    className="flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border font-black py-3 rounded-xl transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={!assignments[req.id]?.subcategory_id}
                  >
                    <CheckCircle size={18} />Aprobar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}