export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
};

export const PROFILE_TYPE_LABELS = {
  chico_solo: 'Chico Solo',
  chica_sola: 'Chica Sola',
  pareja: 'Pareja'
};