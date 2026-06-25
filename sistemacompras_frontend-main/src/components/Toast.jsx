import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timeout);
  }, [message, onClose]);

  if (!message) return null;

  const bgColor = type === 'error' ? 'bg-red-600' : 'bg-green-600';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-4 right-4 px-4 py-3 rounded shadow-lg text-white ${bgColor} z-50`}
    >
      <div className="flex items-center space-x-3">
        <span className="flex-1">{message}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar notificación"
          className="font-bold focus:outline-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
