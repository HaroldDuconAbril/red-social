// src/components/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage({ user }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
      
      {/* CAPA OSCURA (OVERLAY) - Cubre la pantalla completa perfectamente */}
      <div className="absolute inset-0 bg-[#080B12]/80 backdrop-blur-sm z-0" />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-5">
        
        {/* BLOQUE NEGRO PRINCIPAL */}
        <section className="relative overflow-hidden rounded-3xl bg-[#0E1320]/90 backdrop-blur-md border border-white/10 shadow-2xl p-6 sm:p-8 md:p-10">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-700/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-red-600/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-gray-200 px-4 py-2 rounded-full text-xs sm:text-sm font-bold mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              Plataforma privada con validación manual
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight max-w-3xl">
              Perfiles privados,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-400">
                conexiones verificadas.
              </span>
            </h1>

            <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mt-5 leading-relaxed">
              Para proteger la comunidad, cada cuenta nueva debe ser revisada y
              aprobada por un moderador antes de acceder a los perfiles y
              solicitudes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                <p className="text-red-400 font-black text-2xl">01</p>
                <p className="text-white font-bold mt-1">Crea tu cuenta</p>
                <p className="text-gray-500 text-xs mt-1">
                  Envía tus datos para revisión.
                </p>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                <p className="text-red-400 font-black text-2xl">02</p>
                <p className="text-white font-bold mt-1">Validación</p>
                <p className="text-gray-500 text-xs mt-1">
                  Un moderador revisa la solicitud.
                </p>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                <p className="text-red-400 font-black text-2xl">03</p>
                <p className="text-white font-bold mt-1">Acceso privado</p>
                <p className="text-gray-500 text-xs mt-1">
                  Ingresa solo si la cuenta es aprobada.
                </p>
              </div>
            </div>

            {/* ZONA DE BOTONES */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              {!user ? (
                <>
                  <Link
                    to="/registro"
                    className="bg-red-600 hover:bg-red-700 text-white font-black px-6 py-3 rounded-xl transition-colors text-center shadow-lg shadow-red-900/30"
                  >
                    Crear cuenta
                  </Link>

                  <Link
                    to="/login"
                    className="bg-white hover:bg-gray-200 text-gray-950 font-black px-6 py-3 rounded-xl transition-colors text-center"
                  >
                    Ingresar
                  </Link>
                  
                  <Link
                    to="/muro"
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black px-6 py-3 rounded-xl transition-colors text-center backdrop-blur-md"
                  >
                    Ver Anuncios
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/explorar"
                    className="bg-red-600 hover:bg-red-700 text-white font-black px-6 py-3 rounded-xl transition-colors text-center shadow-lg shadow-red-900/30"
                  >
                    Ir a explorar
                  </Link>
                  
                  <Link
                    to="/muro"
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black px-6 py-3 rounded-xl transition-colors text-center backdrop-blur-md"
                  >
                    Ver Anuncios
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* BLOQUE ROJO LATERAL */}
        <aside className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-700/90 via-red-600/90 to-[#2B0508]/90 backdrop-blur-md border border-red-400/20 shadow-2xl p-6 sm:p-8 flex flex-col justify-between min-h-[360px]">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-full h-40 bg-black/20" />

          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-black/30 border border-white/20 flex items-center justify-center text-white text-2xl font-black mb-6">
              ✓
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Acceso solo para cuentas aprobadas
            </h2>

            <p className="text-red-100 text-sm sm:text-base mt-4 leading-relaxed">
              Los perfiles no son visibles para cualquier usuario. Primero se
              crea una solicitud, luego el administrador valida la cuenta y solo
              después se habilita el acceso.
            </p>
          </div>

          <div className="relative z-10 mt-8 grid grid-cols-2 gap-3">
            <div className="bg-black/25 border border-white/15 rounded-2xl p-4">
              <p className="text-white text-2xl font-black">Privado</p>
              <p className="text-red-100 text-xs mt-1">
                Acceso restringido.
              </p>
            </div>

            <div className="bg-black/25 border border-white/15 rounded-2xl p-4">
              <p className="text-white text-2xl font-black">Seguro</p>
              <p className="text-red-100 text-xs mt-1">
                Validación manual.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}