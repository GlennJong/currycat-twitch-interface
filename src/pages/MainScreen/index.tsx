import './style.css'
import Chatroom from "@/components/Chatroom";
import TodoList from "@/components/TodoList";
import Timer from "@/components/Timer";
import { useEffect, useRef, useState } from "react";
import { Cat } from "./Cat";
// import Portrait, { PortraitRef } from '@/components/Portrait';
// import { FreePixelWindow } from '@glennjong/pixel-window';
import FlexibleBackground from '@/components/FlexibleBackground';
import { FreePixelWindow } from '@glennjong/pixel-window';
import { Color } from '@/constants';
import { BackgroundMode, readBackgroundFromDb } from '@/utils/backgroundStorage';
// import { Color } from '@/constants';
// import Dialogue from '@/components/Dialogue';

function MainScreen() {
  const BANNER_KEY = 'currycat.dockMessage';
  // const [ isPortraitOpen, setIsPortraitOpen ] = useState(true);
  // const [ isPortraitVoiceDetectOpen, setIsPortraitVoiceDetectOpen ] = useState(false);
  const [ banner, setBanner ] = useState<string>(() => {
    try { return localStorage.getItem(BANNER_KEY) || ''; } catch { return ''; }
  });
  const [ isCatOpen, setIsCatOpen ] = useState<boolean>(() => {
    try { const v = localStorage.getItem('cat-open'); return v === null ? true : v === '1'; } catch { return true; }
  });
  const [ backgroundMode, setBackgroundMode ] = useState<BackgroundMode>('repeat');
  const [ backgroundImageBlob, setBackgroundImageBlob ] = useState<Blob | null>(null);
  const [ backgroundImageUrl, setBackgroundImageUrl ] = useState('');

  const backgroundObjectUrlRef = useRef<string | null>(null);
  const STORAGE_MASK_KEY = 'currycat.background.mask';
  const [mask, setMask] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE_MASK_KEY);
      if (!v) return null;
      return JSON.parse(v);
    } catch { return null }
  });
  const [ isTodoListOpen, setIsTodoListOpen ] = useState<boolean>(() => {
    try { return localStorage.getItem('todo-open') === '1'; } catch { return false; }
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ _storedTodoOpen, setStoredTodoOpen ] = useState<string | null>(() => {
    try { return localStorage.getItem('todo-open'); } catch { return null; }
  });
  // const [ isVoiceDialogueOpen, setIsVoiceDialogueOpen ] = useState(false);
  // const [ isVoiceDialogueForceHide, setIsVoiceDialogueForceHide ] = useState(true);
  // const [ isVoiceDialogueShow, setIsVoiceDialogueShow ] = useState(false);
  // const [ dialogueLanguage, setDialogueLanguage ] = useState('zh-TW');
  
  // const portraitRef = useRef<PortraitRef>(null);
  const catRef = useRef<Cat>(null);
  const postChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    handleStartCat();
    return () => {
      handleDestroyCat();
      if (postChannelRef.current) {
        postChannelRef.current.close();
        postChannelRef.current = null;
      }
    }
  }, []);

  const handleStartCat = () => {
    if (!catRef.current) {
      catRef.current = new Cat(window.innerWidth/2, window.innerHeight/2);
    }
  }
  const handleDestroyCat = () => {
    if (catRef.current) {
      catRef.current?.destroy();
      catRef.current = null;
    }
  }

  const handleMoveCat = () => {
    if (catRef.current) {
      if (Math.random() < 0.8) {
        catRef.current.moveToward(120);
      } else {
        catRef.current.moveRandom();
      }
    }
  }

  const postDockMessage = (type: string, payload: unknown) => {
    try {
      if (typeof (window as any).BroadcastChannel === 'undefined') return;
      if (!postChannelRef.current) {
        postChannelRef.current = new BroadcastChannel('currycat-dock');
      }
      postChannelRef.current.postMessage({ type, payload });
    } catch (e) {
      console.error('postDockMessage error', e);
    }
  };

  const releaseCurrentBackgroundObjectUrl = () => {
    if (backgroundObjectUrlRef.current) {
      URL.revokeObjectURL(backgroundObjectUrlRef.current);
      backgroundObjectUrlRef.current = null;
    }
  };

  useEffect(() => {
    releaseCurrentBackgroundObjectUrl();
    if (!backgroundImageBlob) {
      setBackgroundImageUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(backgroundImageBlob);
    backgroundObjectUrlRef.current = objectUrl;
    setBackgroundImageUrl(objectUrl);
    return () => {
      releaseCurrentBackgroundObjectUrl();
    };
  }, [backgroundImageBlob]);

  useEffect(() => {
    if (isCatOpen) {
      handleStartCat();
    } else {
      handleDestroyCat();
    }
  }, [isCatOpen]);

  const backgroundStyle = backgroundImageUrl
    ? (backgroundMode === 'cover' || backgroundMode === 'contain')
      ? `url("${backgroundImageUrl}") center / ${backgroundMode}`
      : backgroundMode === 'repeat'
        ? `url("${backgroundImageUrl}") center center repeat`
        : `url("${backgroundImageUrl}") left top no-repeat`
    : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';

  // Listen for dock messages to update mask
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    const loadBackground = async () => {
      try {
        const saved = await readBackgroundFromDb();
        if (saved === null) {
          setBackgroundImageUrl('');
        }
        else {
          setBackgroundImageBlob(saved.blob);
          setBackgroundMode(saved.mode || 'repeat');
        }
      } catch {
        // Ignore restore errors.
      }
    };

    loadBackground();

    if (typeof (window as any).BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('currycat-dock');
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.type === 'background-updated') {
          loadBackground();
        }
        if (ev.data && ev.data.type === 'set-mask') {
          const m = ev.data.payload;
          try { localStorage.setItem(STORAGE_MASK_KEY, JSON.stringify(m)); } catch (e) { console.error(e) }
          setMask(m);
        }
      };
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_MASK_KEY) {
        try { setMask(e.newValue ? JSON.parse(e.newValue) : null); } catch (e) { console.error(e) }
      }
      if (e.key === 'currycat.background.updated') {
        loadBackground();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      if (bc) bc.close();
    };
  }, []);


  // Listen for dock open/close commands for TodoList
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === BANNER_KEY) {
        setBanner(e.newValue || '');
      }
      if (e.key === 'todo-open') {
        setIsTodoListOpen(e.newValue === '1');
        setStoredTodoOpen(e.newValue);
      }
      if (e.key === 'cat-open') {
        setIsCatOpen(e.newValue === '1');
      }
    };

    let bc: BroadcastChannel | null = null;
    if (typeof (window as any).BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('currycat-dock');
      bc.onmessage = (ev) => {
          if (ev.data && ev.data.type === 'dockMessage') {
            setBanner(ev.data.payload || '');
          }
          if (ev.data && ev.data.type === 'todo-open') {
            setIsTodoListOpen(!!ev.data.payload);
            setStoredTodoOpen(ev.data.payload ? '1' : '0');
          }
          if (ev.data && ev.data.type === 'cat-open') {
            setIsCatOpen(!!ev.data.payload);
          }
      };
    }

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      if (bc) bc.close();
    };
  }, []);

  // useEffect(() => {
  //   if (!portraitRef.current || !isPortraitOpen) return;
  //   if (isPortraitVoiceDetectOpen) {
  //     portraitRef.current?.enableVoice?.();
  //   }
  //   else {
  //     portraitRef.current?.disableVoice?.();
  //   }
  // }, [isPortraitVoiceDetectOpen, isPortraitOpen])
  
  return (
    <>
      <div className="main-screen">
        <FlexibleBackground
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 0,
          }}
          background={backgroundStyle}
          defaultMaskWidth={560}
          defaultMaskHeight={540}
          defaultMaskPosition={{ top: 120, left: 80 }}
          mask={mask || undefined}
          onMaskChange={(m) => {
            try { localStorage.setItem(STORAGE_MASK_KEY, JSON.stringify(m)); } catch (e) { console.error(e) }
            setMask(m);
            postDockMessage('mask-changed', m);
          }}
        />
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 2,
        }}>

          <Timer />
        </div>
        {banner && (
          <FreePixelWindow
            name="banner"
            pixel={32}
            stroke={Color.BlackDark}
            frame={Color.WhiteLight}
            background={Color.WhiteLight}
            zIndex={1000}
          >
            <p style={{
              display: 'flex',
              marginTop: '0',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '48px',
              textAlign: 'center',
              fontFamily: 'BoutiqueBitmap'
            }}>
              {banner}
            </p>
          </FreePixelWindow>
        )}
        {/* Floating TodoList (overlay) */}
        {isTodoListOpen && (
          <FreePixelWindow
            position={{ x: 10, y: 80 }}
            name="todolist"
            pixel={32}
            stroke={Color.BlackDark}
            frame={Color.WhiteLight}
            background={Color.WhiteLight}
            zIndex={999}
          >
            <div style={{ width: '240px' }}>
              <TodoList showInput={false} showRemove={false} />
            </div>
          </FreePixelWindow>
        )}
        <div className="center">
          <div className="main">
          </div>
          <div className="side">
            <Chatroom onInput={handleMoveCat} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 24px', height: '24px' }}>
          <span style={{ color: Color.WhiteLight }}>Background controlled by DockApp</span>
        </div>

        {/* <div className="bottom">
          <div style={{ display: 'flex', gap: '12px', padding: '12px 24px', color: Color.WhiteLight }}>
            <div>
              <Checkbox
                theme="light"
                checked={isPortraitOpen}
                label="PORTAIT"
                onChange={(checked) => {
                  if (!checked) {
                    portraitRef.current?.disableVoice();
                    setIsPortraitVoiceDetectOpen(false);
                  }
                  setIsPortraitOpen(checked);
                }}
              />
              { isPortraitOpen &&
                <div>
                  <Checkbox
                    theme="light"
                    checked={isPortraitVoiceDetectOpen}
                    label="VOICE"
                    onChange={(checked) => setIsPortraitVoiceDetectOpen(checked)}
                  />
                </div>
              }
            </div>
            <div>
              <Checkbox
                theme="light"
                checked={isTodoListOpen}
                label="TODO LIST"
                onChange={(checked) => setIsTodoListOpen(checked)}
              />
            </div>
            <div>
              <Checkbox
                theme="light"
                checked={isCatOpen}
                label="CURRY CAT"
                onChange={(checked) => setIsCatOpen(checked)}
              />
            </div>

            <div>
              <Checkbox
                theme="light"
                checked={isVoiceDialogueOpen}
                label="DIALOGUE"
                onChange={(checked) => setIsVoiceDialogueOpen(checked)}
              />
              { isVoiceDialogueOpen &&
                <Checkbox
                  theme="light"
                  checked={isVoiceDialogueForceHide}
                  label="HIDE"
                  onChange={(checked) => setIsVoiceDialogueForceHide(checked)}
                />
              }
              { isVoiceDialogueOpen &&
                <Checkbox
                  theme="light"
                  checked={dialogueLanguage === 'zh-TW'}
                  label={dialogueLanguage}
                  onChange={(checked) => setDialogueLanguage(checked ? 'zh-TW' : 'en')}
                />
              }
            </div>
          </div>
        </div> */}
        {/* { isTodoListOpen &&
          <FreePixelWindow
            name="todolist"
            position={{ x: 400, y: 400 }}
            pixel={32}
            stroke={Color.BlackDark}
            frame={Color.WhiteLight}
            background={Color.WhiteLight}
          >
            <TodoList />
          </FreePixelWindow>
        } */}
        {/* { isPortraitOpen &&
          <FreePixelWindow
            name="portrait"
            position={{ x: 400, y: 400 }}
            pixel={32}
            stroke={Color.BlackDark}
            frame={Color.WhiteLight}
            background={Color.WhiteLight}
            style={{
              margin: '-10px',
            }}
          >
            <Portrait ref={portraitRef} />
          </FreePixelWindow>
        } */}

        {/* { isVoiceDialogueOpen &&
          <FreePixelWindow
            name="dialogue"
            style={{ display: (isVoiceDialogueForceHide || !isVoiceDialogueShow) ? 'none' : 'block' }}
            position={{ x: 400, y: 400 }}
            pixel={32}
            stroke={Color.BlackDark}
            frame={Color.WhiteLight}
            background={Color.WhiteLight}
          >
            <Dialogue
              style={{ padding: '12px', fontSize: '30px' }}
              onInput={(content) => {
                if (!isVoiceDialogueShow) setIsVoiceDialogueShow(true);
                const list = ['崩潰', '煩', '好累'];
                if (list.some((word) => content.includes(word))) {
                  portraitRef.current?.switch('b');
                }
                else {
                  portraitRef.current?.switch();
                }
              }}
              onSilence={() => {
                portraitRef.current?.reset();
                setIsVoiceDialogueShow(false);
              }}
            />
          </FreePixelWindow>
        } */}
      </div>
    </>
  );
}

export default MainScreen;
