// src/components/StarRating.jsx
import React, { useState } from 'react';
import { Star } from 'lucide-react';

// Muestra estrellas de solo lectura, con soporte para medias estrellas (ej. 3.5)
export function StarDisplay({ rating = 0, size = 16 }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const fillPercent = Math.max(0, Math.min(1, rounded - (n - 1))) * 100;
        return (
          <div key={n} className="relative" style={{ width: size, height: size }}>
            <Star size={size} className="absolute text-gray-600" />
            <div className="absolute overflow-hidden" style={{ width: `${fillPercent}%` }}>
              <Star size={size} className="text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Estrellas interactivas (para calificar)
export function StarInput({ value, onChange, size = 24 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={size}
            className={(hovered || value) >= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
          />
        </button>
      ))}
    </div>
  );
}