'use client';

import { useEffect } from 'react';
import { s } from '@/lib/css';

export function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      style={s('position: fixed; inset: 0; background: rgba(5,8,11,0.76); display: flex; align-items: center; justify-content: center; padding: 32px; z-index: 50;')}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}
