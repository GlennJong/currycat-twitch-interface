import { useEffect, useState } from 'react';
import './style.css';

const STORAGE_KEY = 'currycat.dockMessage';

export default function DockBanner() {
  const [message, setMessage] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    if (typeof (window as any).BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('currycat-dock');
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.type === 'dockMessage') {
          const v = ev.data.payload || '';
          try { localStorage.setItem(STORAGE_KEY, v); } catch {}
          setMessage(v || null);
        }
        // ignore mask messages in banner
      };
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setMessage(e.newValue || null);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      if (bc) bc.close();
    };
  }, []);

  if (!message) return null;

  return (
    <div className="dock-banner">
      {message}
    </div>
  );
}
