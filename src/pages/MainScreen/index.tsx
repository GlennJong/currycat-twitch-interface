import './style.css'
import Chatroom from "@/components/Chatroom";
// import TodoList from "@/components/TodoList";
import Timer from "@/components/Timer";
import { useEffect, useRef, useState } from "react";
import { Cat } from "./Cat";
// import Portrait, { PortraitRef } from '@/components/Portrait';
// import { FreePixelWindow } from '@glennjong/pixel-window';
import Checkbox from '@/components/Checkbox/index';
import FlexibleBackground from '@/components/FlexibleBackground';
// import { Color } from '@/constants';
// import Dialogue from '@/components/Dialogue';

function MainScreen() {
  // const [ isTodoListOpen, setIsTodoListOpen ] = useState(true);
  // const [ isPortraitOpen, setIsPortraitOpen ] = useState(true);
  // const [ isPortraitVoiceDetectOpen, setIsPortraitVoiceDetectOpen ] = useState(false);
  const [ isCatOpen, setIsCatOpen ] = useState(true);
  const [ isBackgroundControlDIsplay, setIsBackgroundControlDIsplay ] = useState(false);
  const [ backgroundImageUrl, setBackgroundImageUrl ] = useState('');
  const [ backgroundImageInput, setBackgroundImageInput ] = useState('');
  // const [ isVoiceDialogueOpen, setIsVoiceDialogueOpen ] = useState(false);
  // const [ isVoiceDialogueForceHide, setIsVoiceDialogueForceHide ] = useState(true);
  // const [ isVoiceDialogueShow, setIsVoiceDialogueShow ] = useState(false);
  // const [ dialogueLanguage, setDialogueLanguage ] = useState('zh-TW');
  
  // const portraitRef = useRef<PortraitRef>(null);
  const catRef = useRef<Cat>(null);

  useEffect(() => {
    handleStartCat();
    return () => {
      handleDestroyCat();
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
  
  useEffect(() => {
    if (isCatOpen) {
      handleStartCat();
    } else {
      handleDestroyCat();
    }
  }, [isCatOpen])

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
          background={
            backgroundImageUrl
              ? `url("${backgroundImageUrl}") center repeat`
              : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          }
          defaultMaskWidth={560}
          defaultMaskHeight={540}
          defaultMaskPosition={{ top: 120, left: 80 }}
        />
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
        }}>

          <Timer />
        </div>
        {/* <div className="top">
        </div> */}
        <div className="center">
          <div className="main">
          </div>
          <div className="side">
            <Chatroom onInput={handleMoveCat} />
          </div>

        </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 24px', height: '24px' }}>
              <Checkbox
                theme="light"
                checked={isCatOpen}
                label="CURRY CAT"
                onChange={(checked) => setIsCatOpen(checked)}
              />
              <Checkbox
                theme="light"
                checked={isBackgroundControlDIsplay}
                label="BACKGROUND"
                onChange={(checked) => setIsBackgroundControlDIsplay(checked)}
              />
              { isBackgroundControlDIsplay &&
                <div style={{ position: 'relative', display: 'flex', gap: 12 }}>
                  <input
                    className="dark"
                    type="text"
                    placeholder="Background image URL"
                    value={backgroundImageInput}
                    onChange={(e) => setBackgroundImageInput(e.target.value)}
                    style={{ width: 320 }}
                  />
                  <button
                    className="dark"
                    onClick={() => setBackgroundImageUrl(backgroundImageInput.trim())}
                  >
                    套用
                  </button>
                  <button
                    className="dark"
                    onClick={() => {
                      setBackgroundImageInput('');
                      setBackgroundImageUrl('');
                    }}
                  >
                    清除
                  </button>
                </div>
              }
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
