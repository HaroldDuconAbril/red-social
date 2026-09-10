// src/api.js
// Instancia central de axios para toda la app.
//
// La sesión vive en una cookie httpOnly que pone el backend (invisible para
// JS, así que un XSS no puede robarla leyendo localStorage como antes).
// `withCredentials: true` es lo que hace que el navegador la mande (y la
// reciba) en cada petición, aunque el frontend y el backend estén en
// dominios distintos (Vercel/Render).
import axios from 'axios';
import { API_URL } from './config';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Token anti-CSRF: viaja como claim dentro del JWT (protegido por la firma) y
// el backend lo entrega UNA vez, en el body de la respuesta de
// login/verify-2fa/me. Como frontend y backend son dominios distintos, nunca
// lo guardamos como cookie propia (el JS de un dominio no puede leer cookies
// de otro dominio), así que se queda solo en memoria mientras dura la sesión
// de la pestaña. Se pierde al recargar la página, pero AuthContext lo vuelve
// a pedir automáticamente vía GET /api/auth/me.
let csrfToken = null;
export const setCsrfToken = (value) => { csrfToken = value; };
export const clearCsrfToken = () => { csrfToken = null; };

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

export default api;