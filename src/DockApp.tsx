import { useEffect, useState, useRef } from 'react';
import useTwitchOauth from '@/components/Chatroom/hooks/useTwitchOauth';
import './global.css';
import './DockApp.css';
import { BackgroundMode, BG_KEY, deleteBackgroundFromDb, readBackgroundFromDb, writeBackgroundToDb } from '@/utils/backgroundStorage';

const BANNER_KEY = 'currycat.dockMessage';
const TIMER_KEY = 'timer-state';
const TODO_KEY = 'todos';
const TODO_OPEN_KEY = 'todo-open';
const CAT_OPEN_KEY = 'cat-open';
const STORAGE_MASK_KEY = 'currycat.background.mask';
const SYNC_CHAT_KEY = 'currycat.syncChat';

function postBanner(value: string) {
  try {
    if (typeof (window as any).BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('currycat-dock');
      bc.postMessage({ type: 'dockMessage', payload: value });
      bc.close();
    }
    localStorage.setItem(BANNER_KEY, value);
  } catch (e) {
    console.error('postBanner error', e);
    try { localStorage.setItem(BANNER_KEY, value); } catch (e) { console.error(e) }
  }
}

function postTimer(state: { inputTime?: string; duration?: number; remaining: number | null; savedAt?: number }) {
  try {
    const payload = {
      inputTime: state.inputTime || '',
      duration: state.duration ?? (state.remaining !== null ? state.remaining : 60),
      remaining: state.remaining,
      savedAt: state.savedAt ?? Date.now(),
    };
    // Broadcast
    if (typeof (window as any).BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('currycat-dock');
      bc.postMessage({ type: 'timer-state', payload });
      bc.close();
    }
    // Persist to localStorage for other windows
    localStorage.setItem(TIMER_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('postTimer error', e);
    try { localStorage.setItem(TIMER_KEY, JSON.stringify(state)); } catch (e) { console.error(e) }
  }
}

export default function DockApp() {
  const [ banner, setBanner ] = useState<string>(() => localStorage.getItem(BANNER_KEY) || '');
  const [ bannerInput, setBannerInput ] = useState<string>(() => localStorage.getItem(BANNER_KEY) || '');
  const [minutes, setMinutes] = useState<number>(1);
  const [todos, setTodos] = useState<{id:number; text:string; completed:boolean}[]>(() => {
    try { const s = localStorage.getItem(TODO_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [, setMask] = useState<any>(() => {
    try { const v = localStorage.getItem(STORAGE_MASK_KEY); return v ? JSON.parse(v) : null; } catch { return null }
  });
  const [draftMask, setDraftMask] = useState<any>(() => {
    try { const v = localStorage.getItem(STORAGE_MASK_KEY); return v ? JSON.parse(v) : null; } catch { return null }
  });
  const [todoOpen, setTodoOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(TODO_OPEN_KEY) === '1'; } catch { return false; }
  });
  const [todoInput, setTodoInput] = useState<string>('');
  const [catOpen, setCatOpen] = useState<boolean>(() => {
    try { const v = localStorage.getItem(CAT_OPEN_KEY); return v === null ? true : v === '1'; } catch { return true; }
  });
  const [backgroundImageInput, setBackgroundImageInput] = useState<string>('');
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('repeat');
  // const [backgroundError, setBackgroundError] = useState<string>('');
  // const [backgroundStatus, setBackgroundStatus] = useState<string>('');

  const instanceIdRef = useRef<string>(Math.random().toString(36).slice(2));
  const { startOauthConnect, setManualTwitchState, twitchState } = useTwitchOauth();
  const [syncChat, setSyncChat] = useState<boolean>(() => {
    try { return localStorage.getItem(SYNC_CHAT_KEY) === '1'; } catch { return false }
  });
  const [manualAccessToken, setManualAccessToken] = useState<string>('');
  const [manualUserId, setManualUserId] = useState<string>('');
  const [manualUserName, setManualUserName] = useState<string>('');

  useEffect(() => {
    const loadBackground = async () => {
      try {
        const saved = await readBackgroundFromDb();
        if (!saved) return;
        setBackgroundImageInput(saved.sourceUrl);
        setBackgroundMode(saved.mode);
      } catch (e) {
        console.error('loadBackground error', e);
      }
    };

    loadBackground();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'currycat.background.updated') {
        loadBackground();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === BANNER_KEY) setBanner(e.newValue || '');
      if (e.key === TIMER_KEY && e.newValue) {
        try {
          const s = JSON.parse(e.newValue);
          if (s && typeof s.remaining === 'number') {
            const newMinutes = Math.max(1, Math.round(s.remaining / 60));
            setMinutes(prev => (prev === newMinutes ? prev : newMinutes));
          }
        } catch (e) { console.error(e) }
      }
      if (e.key === TODO_KEY) {
        try { setTodos(e.newValue ? JSON.parse(e.newValue) : []); } catch (e) { console.error(e) }
      }
      if (e.key === TODO_OPEN_KEY) {
        setTodoOpen(e.newValue === '1');
      }
      if (e.key === CAT_OPEN_KEY) {
        setCatOpen(e.newValue === '1');
      }
      if (e.key === STORAGE_MASK_KEY) {
        try { const m = e.newValue ? JSON.parse(e.newValue) : null; setMask(m); setDraftMask(m ? { ...m } : null); } catch (e) { console.error(e) }
      }
      if (e.key === SYNC_CHAT_KEY) {
        try { setSyncChat(e.newValue === '1'); } catch (e) { console.error(e) }
      }
    };

    let bc: BroadcastChannel | null = null;
    if (typeof (window as any).BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('currycat-dock');
      bc.onmessage = (ev) => {
        if (!ev.data) return;
        if (ev.data.source && ev.data.source === instanceIdRef.current) return;
        if (ev.data.type === 'dockMessage') {
          setBanner(ev.data.payload || '');
          try { localStorage.setItem(BANNER_KEY, ev.data.payload || ''); } catch (e) { console.error(e) }
        }
        if (ev.data.type === 'timer-state') {
          try {
            const s = ev.data.payload;
            if (s && typeof s.remaining === 'number') {
              const newMinutes = Math.max(1, Math.round(s.remaining / 60));
              setMinutes(prev => (prev === newMinutes ? prev : newMinutes));
            }
            localStorage.setItem(TIMER_KEY, JSON.stringify(s));
          } catch (e) { console.error(e) }
        }
        if (ev.data.type === 'todo-list') {
          try { setTodos(ev.data.payload || []); localStorage.setItem(TODO_KEY, JSON.stringify(ev.data.payload || [])); } catch (e) { console.error(e) }
        }
        if (ev.data.type === 'todo-open') {
          try { setTodoOpen(!!ev.data.payload); localStorage.setItem(TODO_OPEN_KEY, ev.data.payload ? '1' : '0'); } catch (e) { console.error(e) }
        }
        if (ev.data.type === 'cat-open') {
          try { setCatOpen(!!ev.data.payload); localStorage.setItem(CAT_OPEN_KEY, ev.data.payload ? '1' : '0'); } catch (e) { console.error(e) }
        }
        if (ev.data.type === 'mask-changed' || ev.data.type === 'set-mask') {
          try {
            const m = ev.data.payload;
            setMask(m);
            setDraftMask(m ? { ...m } : null);
            localStorage.setItem(STORAGE_MASK_KEY, JSON.stringify(m));
          } catch (e) { console.error(e) }
        }
        if (ev.data.type === 'sync-chat') {
          try { const v = !!ev.data.payload; setSyncChat(v); try { localStorage.setItem(SYNC_CHAT_KEY, v ? '1' : '0'); } catch (e) { console.error(e) } } catch (e) { console.error(e) }
        }
      };
    }

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      if (bc) bc.close();
    };
  }, []);

  const saveTodos = (next: {id:number; text:string; completed:boolean}[]) => {
    try {
      setTodos(next);
      if (typeof (window as any).BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('currycat-dock');
        bc.postMessage({ type: 'todo-list', payload: next, source: instanceIdRef.current });
        bc.close();
      }
      localStorage.setItem(TODO_KEY, JSON.stringify(next));
    } catch (e) { console.error(e) }
  };

  const addTodo = () => {
    const text = (todoInput || '').trim();
    if (!text) return;
    const next = [...todos, { id: Date.now(), text, completed: false }];
    setTodoInput('');
    saveTodos(next);
  };

  const toggleTodo = (id: number) => {
    const next = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTodos(next);
  };

  const deleteTodo = (id: number) => {
    const next = todos.filter(t => t.id !== id);
    saveTodos(next);
  };

  const setTodoOpenState = (open: boolean) => {
    try {
      setTodoOpen(open);
      if (typeof (window as any).BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('currycat-dock');
        bc.postMessage({ type: 'todo-open', payload: open, source: instanceIdRef.current });
        bc.close();
      }
      localStorage.setItem(TODO_OPEN_KEY, open ? '1' : '0');
    } catch (e) { console.error(e) }
  };

  const setCatOpenState = (open: boolean) => {
    try {
      setCatOpen(open);
      if (typeof (window as any).BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('currycat-dock');
        bc.postMessage({ type: 'cat-open', payload: open, source: instanceIdRef.current });
        bc.close();
      }
      localStorage.setItem(CAT_OPEN_KEY, open ? '1' : '0');
    } catch (e) { console.error(e) }
  };

  const notifyBackgroundUpdate = () => {
    try {
      if (typeof (window as any).BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('currycat-dock');
        bc.postMessage({ type: 'background-updated', source: instanceIdRef.current });
        bc.close();
      }
      localStorage.setItem('currycat.background.updated', String(Date.now()));
    } catch (e) {
      console.error('notifyBackgroundUpdate error', e);
    }
  };

  const saveBackgroundByUrl = async (sourceUrl: string) => {
    try {
      const res = await fetch(sourceUrl);
      if (!res.ok) throw new Error('Failed to fetch image');
      const blob = await res.blob();
      await writeBackgroundToDb({ id: BG_KEY, blob, sourceUrl, mode: backgroundMode });
      setBackgroundImageInput(sourceUrl);
      notifyBackgroundUpdate();
    } catch (error) {
      console.error(error)
    }
  };

  const saveBackgroundByFile = async (file: File) => {
    try {
      const sourceUrl = `file://${file.name}`;
      await writeBackgroundToDb({ id: BG_KEY, blob: file, sourceUrl, mode: backgroundMode });
      setBackgroundImageInput(file.name);
      notifyBackgroundUpdate();
    } catch (error) {
      console.error(error)
      throw error;
    }
  };

  const clearBackground = async () => {
    try {
      await deleteBackgroundFromDb();
      setBackgroundImageInput('');
      notifyBackgroundUpdate();
    } catch (error) {
      console.error(error)
      throw error;
    }
  };

  const applyBackgroundMode = async (mode: BackgroundMode) => {
    setBackgroundMode(mode);
    try {
      const saved = await readBackgroundFromDb();
      if (!saved) {
        return;
      }
      await writeBackgroundToDb({
        id: BG_KEY,
        blob: saved.blob,
        sourceUrl: saved.sourceUrl,
        mode,
      });
      notifyBackgroundUpdate();
    } catch (error) {
      console.error(error)
    }
  };

  const toggleBanner = () => {
    const next = banner ? '' : (bannerInput.trim() || 'Hello from Dock');
    setBanner(next);
    if (!banner) setBannerInput(next);
    postBanner(next);
  };

  const startTimer = () => {
    const secs = Math.max(1, Math.round(minutes)) * 60;
    postTimer({ remaining: secs, duration: secs, savedAt: Date.now() });
  };

  const stopTimer = () => {
    postTimer({ remaining: null, duration: 0, savedAt: Date.now() });
  };

  const setTimerMinutes = (v: number) => {
    const safe = Math.max(1, Math.round(v || 1));
    setMinutes(safe);
    // Stop any running timer and reset to `safe` minutes (paused)
    const secs = safe * 60;
    postTimer({ remaining: null, duration: secs, savedAt: Date.now(), inputTime: '' });
  };

  const broadcastMask = (m: any) => {
    try {
      setMask(m);
      setDraftMask(m ? { ...m } : null);
      if (typeof (window as any).BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('currycat-dock');
        bc.postMessage({ type: 'set-mask', payload: m, source: instanceIdRef.current });
        bc.close();
      }
      localStorage.setItem(STORAGE_MASK_KEY, JSON.stringify(m));
    } catch (e) {
      console.error('broadcastMask error', e);
      try { localStorage.setItem(STORAGE_MASK_KEY, JSON.stringify(m)); setMask(m); setDraftMask(m ? { ...m } : null); } catch (e2) { console.error(e2) }
    }
  };

  const toggleSyncChat = (enable?: boolean) => {
    const next = typeof enable === 'boolean' ? enable : !syncChat;
    try {
      setSyncChat(next);
      if (typeof (window as any).BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('currycat-dock');
        bc.postMessage({ type: 'sync-chat', payload: next, source: instanceIdRef.current });
        bc.close();
      }
      localStorage.setItem(SYNC_CHAT_KEY, next ? '1' : '0');
    } catch (e) {
      console.error('toggleSyncChat error', e);
    }
  };

  return (
    <div className="dock-app">
      <h2 className="dock-title">CurryCat — OBS Dock</h2>
      <p className="dock-desc">Use this dock to control the on-stream banner and timer.</p>

      <div className="dock-controls">
        <input
          type="text"
          className="dock-input"
          value={bannerInput}
          onChange={(e) => setBannerInput(e.target.value)}
          placeholder="Banner text"
        />
        <button onClick={toggleBanner} className="small">
          {banner ? 'Clear Banner' : 'Show Banner'}
        </button>
        <div className="dock-banner-preview">{banner || '<empty>'}</div>
      </div>


      <div className="dock-section">
        <div className="dock-row">
          <button className="small" onClick={() => startOauthConnect()}>Connect Twitch (OAuth)</button>
          <div style={{ marginLeft: 12 }}>
            {twitchState ? <span style={{ fontWeight: 700 }}>User: {twitchState.display_name} ({twitchState.id})</span> : <span className="dock-note">Not connected</span>}
          </div>
        </div>
        <div className="dock-row" style={{ marginTop: 8 }}>
          <button className="small" onClick={() => toggleSyncChat(true)}>Sync Chat Message</button>
        </div>
        <div style={{ marginTop: 8 }}>
          <div className="dock-row">
            <label className="dock-label">Access Token</label>
            <input type="text" value={manualAccessToken} onChange={(e) => setManualAccessToken(e.target.value)} className="dock-input" />
          </div>
          <div className="dock-row">
            <label className="dock-label">User ID</label>
            <input type="text" value={manualUserId} onChange={(e) => setManualUserId(e.target.value)} className="dock-input" />
          </div>
          <div className="dock-row">
            <label className="dock-label">User Name</label>
            <input type="text" value={manualUserName} onChange={(e) => setManualUserName(e.target.value)} className="dock-input" />
          </div>
          <div className="dock-row" style={{ marginTop: 8 }}>
            <button
              className="small"
              onClick={() => {
                if (!setManualTwitchState) return;
                if (manualAccessToken && manualUserId && manualUserName) {
                  setManualTwitchState({
                    access_token: manualAccessToken,
                    id: manualUserId,
                    display_name: manualUserName,
                    login: manualUserName.toLowerCase(),
                    scope: 'chat:read',
                    token_type: 'bearer',
                    broadcaster_type: '',
                    created_at: new Date().toISOString(),
                    description: '',
                    offline_image_url: '',
                    profile_image_url: '',
                    type: '',
                    view_count: 0
                  });
                  setManualAccessToken('');
                  setManualUserId('');
                  setManualUserName('');
                }
              }}
              disabled={!manualAccessToken || !manualUserId || !manualUserName}
            >
              Save Twitch State
            </button>
          </div>
        </div>
      </div>

      <div className="dock-section">
        <div className="dock-row">
          <label className="dock-label">Minutes</label>
          <input
            type="number"
            min={1}
            value={minutes}
            onChange={(e) => setTimerMinutes(Number(e.target.value || 1))}
            className="dock-number"
          />
          <button className="small" onClick={startTimer}>Start</button>
      
          <button className="small" onClick={stopTimer}>Stop</button>
        </div>
        <div className="dock-note">Start sets a countdown of the given minutes.</div>
      </div>

      <div className="dock-section" style={{ marginTop: 12 }}>
        <div>Mask</div>
        <div className="dock-row">
          <label className="dock-label">Background URL</label>
          <input
            type="text"
            className="dock-input"
            value={backgroundImageInput}
            onChange={(e) => setBackgroundImageInput(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="dock-row" style={{ alignItems: 'center', gap: 8 }}>
          <label className="dock-label">Mode</label>
          <select
            className="dock-input"
            value={backgroundMode}
            onChange={async (e) => {
              await applyBackgroundMode(e.target.value as BackgroundMode);
            }}
          >
            <option value="normal">normal</option>
            <option value="repeat">repeat</option>
            <option value="cover">cover</option>
            <option value="contain">contain</option>
          </select>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await saveBackgroundByFile(file);
            }}
            className="dock-input"
            style={{ flex: 1 }}
          />
        </div>
        <div className="dock-row">
          <button className="small" onClick={async () => { if (backgroundImageInput.trim()) await saveBackgroundByUrl(backgroundImageInput.trim()); }}>Save Background</button>
          <button className="small" onClick={clearBackground}>Clear Background</button>
        </div>
        <div className="dock-row">
          <label className="dock-label">x</label>
          <input
            type="number"
            value={draftMask ? Math.round(draftMask.x) : ''}
            onChange={(e) => setDraftMask({ ...(draftMask || { x: 80, y: 120, width: 560, height: 540 }), x: Number(e.target.value) })}
            onBlur={() => draftMask && broadcastMask(draftMask)}
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            onKeyDown={(e) => { if (e.key === 'Enter') draftMask && broadcastMask(draftMask); }}
            className="dock-number"
          />
          <label className="dock-label">y</label>
          <input
            type="number"
            value={draftMask ? Math.round(draftMask.y) : ''}
            onChange={(e) => setDraftMask({ ...(draftMask || { x: 80, y: 120, width: 560, height: 540 }), y: Number(e.target.value) })}
            onBlur={() => draftMask && broadcastMask(draftMask)}
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            onKeyDown={(e) => { if (e.key === 'Enter') draftMask && broadcastMask(draftMask); }}
            className="dock-number"
          />
        </div>

        <div className="dock-row">
          <label className="dock-label">w</label>
          <input
            type="number"
            value={draftMask ? Math.round(draftMask.width) : ''}
            onChange={(e) => setDraftMask({ ...(draftMask || { x: 80, y: 120, width: 560, height: 540 }), width: Number(e.target.value) })}
            onBlur={() => draftMask && broadcastMask(draftMask)}
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            onKeyDown={(e) => { if (e.key === 'Enter') draftMask && broadcastMask(draftMask); }}
            className="dock-number"
          />
          <label className="dock-label">h</label>
          <input
            type="number"
            value={draftMask ? Math.round(draftMask.height) : ''}
            onChange={(e) => setDraftMask({ ...(draftMask || { x: 80, y: 120, width: 560, height: 540 }), height: Number(e.target.value) })}
            onBlur={() => draftMask && broadcastMask(draftMask)}
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            onKeyDown={(e) => { if (e.key === 'Enter') draftMask && broadcastMask(draftMask); }}
            className="dock-number"
          />
        </div>

        <div className="dock-row">
          <button className="small" onClick={() => broadcastMask({ x: 80, y: 120, width: 560, height: 540 })}>Create/Reset Mask</button>
        </div>
      </div>

      <div className="dock-section" style={{ marginTop: 12 }}>
        
        <div className="dock-row">
          <input type="checkbox" id="cat" checked={catOpen} onChange={(e) => setCatOpenState(e.currentTarget.checked)} />
          <label htmlFor="cat" className="dock-note">{catOpen ? 'Cat: enabled' : 'Cat: disabled'}</label>
        </div>
      
        <div className="dock-row">
          <input type="checkbox" id="todolist" checked={todoOpen} onChange={(e) => setTodoOpenState(e.currentTarget.checked)} />
          <label htmlFor="todolist" className="dock-note">{todoOpen ? 'TodoList: enabled' : 'TodoList: disabled'}</label>
        </div>

        <div className="dock-row">
          <input
            type="text"
            value={todoInput}
            onChange={(e) => setTodoInput(e.target.value)}
            placeholder="Add todo"
            className="dock-input"
          />
          <button className="small" onClick={addTodo}>Add</button>
        </div>

        <div className="dock-todos">
          {todos.map(t => (
            <div key={t.id} className={`dock-todo-item${t.completed ? ' completed' : ''}`}>
              <input type="checkbox" checked={t.completed} onChange={() =>  toggleTodo(t.id)} />
              <div className="todo-text">{t.text}</div>
              <button className="xs" onClick={() => deleteTodo(t.id)}>x</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
