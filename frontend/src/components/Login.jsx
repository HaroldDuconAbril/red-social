import { useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/auth/login', { email, password });
      
      // 1. Manejo de 2FA: Si el backend requiere código, redirigimos a la página de verificación
      if (res.data.requires2FA) {
        navigate('/verify-2fa', { state: { userId: res.data.userId } });
        return;
      }

      // 2. Login normal: guardamos el usuario (que incluye el 'role')
      login(res.data);

      // 3. Redirección Inteligente: Si es admin, al panel; si no, al perfil.
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/perfil');
      }
      
    } catch (error) {
  console.error(error);
  toast.error('Credenciales inválidas o error de conexión.');
}
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#080B12]/80 backdrop-blur-sm z-0" />
      
      <div className="relative z-10 w-full max-w-md bg-[#0E1320]/90 backdrop-blur-md border border-white/10 shadow-2xl p-8 sm:p-10 rounded-3xl overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-700/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-40 h-60 bg-red-600/20 rounded-full blur-3xl" />
          
        <div className="relative z-10">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition-colors"
          >
            ← Volver
          </button>

          <h2 className="text-3xl font-black text-white text-center mb-8">Ingresar</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Correo Electrónico</label>
              <input 
                type="email" 
                placeholder="tu@correo.com" 
                className="w-full bg-black/30 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-red-500 transition-colors" 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Contraseña</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-black/30 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-red-500 transition-colors" 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black px-6 py-3 rounded-xl transition-colors shadow-lg shadow-red-900/30 mt-2"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6 flex flex-col gap-3">
            <p className="text-gray-400 text-sm">
              ¿No tienes cuenta? <Link to="/registro" className="text-red-400 hover:text-red-300 font-bold transition-colors">Solicitar acceso</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;