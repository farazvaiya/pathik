import { useState, useEffect, useCallback } from 'react';

let _addToast = null;

export function toast(message, type = 'info') {
  if (_addToast) _addToast({ message, type, id: Date.now() });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _addToast = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3500);
    };
    return () => { _addToast = null; };
  }, []);

  if (!toasts.length) return null;

  const colors = { success: 'bg-emerald-600', error: 'bg-red-500', info: 'bg-slate-700', warning: 'bg-amber-500' };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center">
      {toasts.map((t) => (
        <div key={t.id} className={`${colors[t.type] || colors.info} text-white text-sm font-medium px-5 py-2.5 rounded-2xl shadow-xl`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
