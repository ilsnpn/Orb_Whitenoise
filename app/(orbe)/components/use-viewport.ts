'use client';

import { useEffect, useState } from 'react';

/** Taille de la fenêtre (valeurs par défaut côté serveur, mises à jour au montage). */
export function useViewport() {
  const [vp, setVp] = useState({ w: 390, h: 800 });
  useEffect(() => {
    const measure = () => setVp({ w: innerWidth, h: innerHeight });
    measure();
    addEventListener('resize', measure);
    return () => removeEventListener('resize', measure);
  }, []);
  return vp;
}
