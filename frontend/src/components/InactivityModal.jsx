// src/components/InactivityModal.jsx
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AlertTriangle } from 'lucide-react';

const INACTIVITY_LIMIT = 3 * 60 * 1000; // 3 minutos sin actividad
const WARNING_COUNTDOWN = 30; // segundos para responder

export default function InactivityModal() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_COUNTDOWN);

  const inactivityTimer = useRef(null);
  const countdownInterval = useRef(null);

  const handleLogout = useCallback(() => {
    clearInterval(countdownInterval.current);
    clearTimeout(inactivityTimer.current);
    setShowWarning(false);
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const startCountdown = useCallback(() => {
    setShowWarning(true);
    setCountdown(WARNING_COUNTDOWN);
    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleLogout]);

  const resetTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(startCountdown, INACTIVITY_LIMIT);
  }, [startCountdown]);

  const handleStayLoggedIn = () => {
    clearInterval(countdownInterval.current);
    setShowWarning(false);
    resetTimer();
  };

  useEffect(() => {
    if (!user) return;

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const onActivity = () => {
      if (!showWarning) {
        resetTimer();
      }
    };

    activityEvents.forEach((event) => window.addEventListener(event, onActivity));
    resetTimer();

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, onActivity));
      clearTimeout(inactivityTimer.current);
      clearInterval(countdownInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user || !showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0E1320] border border-red-500/30 w-full max-w-md rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-700/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">¿Sigues ahí?</h2>
          <p className="text-gray-400 text-sm mb-6">
            Por tu seguridad, tu sesión se cerrará automáticamente por inactividad.
          </p>
          <div className="text-5xl font-black text-red-500 mb-6">{countdown}</div>
          <button
            onClick={handleStayLoggedIn}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl transition-colors shadow-lg shadow-red-900/30"
          >
            Sí, continuar sesión
          </button>
        </div>
      </div>
    </div>
  );
}