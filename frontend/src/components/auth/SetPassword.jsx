import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Lock, Eye, EyeOff, Users } from 'lucide-react';
import { API_URL } from '../../config';

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [profileType, setProfileType] = useState('chico_solo');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !token) {
      toast.error('Este enlace no es válido. Revisa el correo de aprobación e intenta de nuevo.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(API_URL + '/api/auth/set-password', { email, password, profileType, token });
      toast.success('¡Cuenta activada! Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al configurar la contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  if (!email || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080B12] p-4">
        <div className="w-full max-w-md bg-[#0E1320]/80 border border-red-500/30 backdrop-xl p-8 rounded-3xl shadow-2xl text-center">
          <h2 className="text-2xl font-black text-white mb-2">Enlace inválido</h2>
          <p className="text-gray-400 text-sm">
            Este enlace de activación no es válido o está incompleto. Usa el enlace exacto que recibiste por correo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080B12] p-4">
      <div className="w-full max-w-md bg-[#0E1320]/80 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-black text-white">Configurar Acceso</h2>
          <p className="text-gray-400 mt-2 text-sm">Crea tu contraseña para activar tu cuenta de <span className="text-red-500 font-bold">Erotika</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="relative">
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">¿Cómo te identificas?</label>
            <div className="relative">
              <select
                value={profileType}
                onChange={(e) => setProfileType(e.target.value)}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-4 appearance-none focus:border-red-500 outline-none transition cursor-pointer"
              >
                <option value="chico_solo">Chico Solo</option>
                <option value="chica_sola">Chica Sola</option>
                <option value="pareja">Pareja</option>
              </select>
              <Users className="absolute right-4 top-4 text-gray-500 pointer-events-none" size={20} />
            </div>
          </div>

          <div className="relative">
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nueva Contraseña</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-4 focus:border-red-500 outline-none transition"
              placeholder="••••••••"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-10 text-gray-500 hover:text-white"
            >
              {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
            </button>
          </div>

          <button
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition shadow-lg shadow-red-900/20"
          >
            {submitting ? 'Activando...' : 'Activar Cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
