// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import { Toaster } from 'react-hot-toast'; // Importación agregada
import RegisterRequest from './components/RegisterRequest';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import PublicWall from './components/PublicWall';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import Explore from './components/Explore';
import Chat from './components/Chat';
import AdminPanel from './components/AdminPanel';
import SetPassword from './components/auth/SetPassword';
import VipRooms from './components/VipRooms';
import RoomSession from './components/RoomSession';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080B12] text-white">
        <p className="text-gray-400 font-bold animate-pulse">Cargando sesión...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080B12] text-white">
        <p className="text-gray-400 font-bold animate-pulse">Verificando acceso...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080B12] text-white">
        <p className="text-gray-400 font-bold animate-pulse">Validando permisos...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/perfil" replace />;

  return children;
};

const GuestRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080B12] text-white">
        <p className="text-gray-400 font-bold animate-pulse">Cargando...</p>
      </div>
    );
  }

  return user ? <Navigate to="/perfil" replace /> : children;
};

const AppRoutes = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen app-background relative">
      <Navbar />
      
      {/* AQUÍ ESTÁ LA SOLUCIÓN:
        Solo usamos pt-32 para empujar el contenido hacia abajo.
        Quitamos las restricciones de ancho para que el fondo oscuro 
        de tus componentes vuelva a ocupar toda la pantalla.
      */}
      <div className={user ? "pt-32" : ""}>
        <Routes>
          <Route path="/" element={<LandingPage user={user} />} />
          <Route path="/muro" element={<PublicWall />} />
          <Route path="/registro-final" element={<SetPassword />} />
          <Route
            path="/registro"
            element={
              <GuestRoute>
                <RegisterRequest />
              </GuestRoute>
            }
          />
          <Route
            path="/vip-rooms"
            element={
              <ProtectedRoute>
                <VipRooms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/room/:roomId"
            element={
              <PrivateRoute>
                <RoomSession />
              </PrivateRoute>
            }
          />

          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/explorar"
            element={
              <ProtectedRoute>
                <Explore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Toaster agregado para las notificaciones globales */}
        <Toaster position="top-right" toastOptions={{ style: { background: '#0E1320', color: '#fff', border: '1px solid #333' } }} />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;