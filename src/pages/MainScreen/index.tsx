import './style.css'
import Chatroom from "@/components/Chatroom";
import TodoList from "@/components/TodoList";
import Timer from "@/components/Timer";
import { useEffect, useRef, useState } from "react";
import { Cat } from "./Cat";
import Portrait, { PortraitRef } from '@/components/Portrait';
import FreeWindow from '@/components/FreeWindow/index';
import Window from '@/components/Window';
import Checkbox from '@/components/Checkbox/index';
import { Color } from '@/constants';
import Dialogue from '@/components/Dialogue';
import ColorPicker from '../../components/ColorPicker/index';

function MainScreen() {
  const [ isTodoListOpen, setIsTodoListOpen ] = useState(true);
  const [ isCatOpen, setIsCatOpen ] = useState(true);
  const [ isDialogueOpen, setIsDialogueOpen ] = useState(false);
  const [ isDialogueForceHide, setIsDialogueForceHide ] = useState(true);
  const [ isDialogueShow, setIsDialogueShow ] = useState(false);
  const [ dialogueLanguage, setDialogueLanguage ] = useState('zh-TW');
  const [ greenScreenColor, setGreenScreenColor ] = useState<string>(Color.BlackLight);
  const portraitRef = useRef<PortraitRef>(null);
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

  const handleControlCat = (msg: string) => {
    const direction = {
      leftUp: ['leftup', '↖', '左上', '上左'],
      leftDown: ['leftdown', '↙', '左下', '下左'],
      rightUp: ['rightup', '↗', '右上', '上右'],
      rightDown: ['rightdown', '↘', '右下', '下右'],
      left: ['left', '左', '←'],
      right: ['right', '右', '→'],
      up: ['up', 'top', '上', '↑'],
      down: ['down', 'bottom', '下', '↓'],
    }
    if (catRef.current) {
      for (const key in direction) {
        if (direction[key as keyof typeof direction].some((word: string) => msg.includes(word))) {
          (catRef.current as any)[key](20 + Math.floor(Math.random() * 10));
        }
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
  
  return (
    <>
      <div className="main-screen">
        <div className="top">
          <Timer />
        </div>
        <div className="center" style={{ backgroundColor: greenScreenColor }}>
          <div className="main">
          </div>
          <div className="side">
            <Window>
              <Chatroom onInput={handleControlCat} />
            </Window>
          </div>

        </div>
        <div className="bottom">
          <div style={{ display: 'flex', gap: '12px', padding: '12px 24px', color: Color.WhiteLight }}>
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
                checked={isDialogueOpen}
                label="DIALOGUE"
                onChange={(checked) => setIsDialogueOpen(checked)}
              />
              { isDialogueOpen &&
                <Checkbox
                  theme="light"
                  checked={isDialogueForceHide}
                  label="HIDE"
                  onChange={(checked) => setIsDialogueForceHide(checked)}
                />
              }
              { isDialogueOpen &&
                <Checkbox
                  theme="light"
                  checked={dialogueLanguage === 'zh-TW'}
                  label={dialogueLanguage}
                  onChange={(checked) => setDialogueLanguage(checked ? 'zh-TW' : 'en')}
                />
              }
              
            </div>
            <div>
              <Checkbox
                theme="light"
                checked={isCatOpen}
                label="CURRY CAT"
                onChange={(checked) => setIsCatOpen(checked)}
              />
              { isCatOpen &&
                <div>
                  {/* <button className="xs" onClick={() => catRef.current?.leftUp(50)}>
                    <span style={{ transform: 'rotate(-45deg)' }}>▴</span>
                  </button>
                  <button className="xs" onClick={() => catRef.current?.up(50)}>
                    <span style={{ transform: 'rotate(0deg)' }}>▴</span>
                  </button>
                  <button className="xs" onClick={() => catRef.current?.rightUp(50)}>
                    <span style={{ transform: 'rotate(45deg)' }}>▴</span>
                  </button> */}
                </div>
              }
            </div>
            <div>
              <ColorPicker defaultColor={greenScreenColor} onChange={(color) => setGreenScreenColor(color)} />
            </div>
          </div>
        </div>
        { isTodoListOpen &&
          <FreeWindow id="todolist" position={{ x: 400, y: 400 }}>
            <TodoList />
          </FreeWindow>
        }
        <FreeWindow id="portrait" position={{ x: 400, y: 400 }}>
          <Portrait ref={portraitRef} />
        </FreeWindow>

        { isDialogueOpen &&
          <FreeWindow
            id="dialogue"
            style={{ display: (isDialogueForceHide || !isDialogueShow) ? 'none' : 'block' }}
            position={{ x: 400, y: 400 }}
          >
            <Dialogue
              style={{ padding: '12px', fontSize: '30px' }}
              onInput={(content) => {
                if (!isDialogueShow) setIsDialogueShow(true);
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
                setIsDialogueShow(false);
              }}
            />
          </FreeWindow>
        }
      </div>
    </>
  );
}

export default MainScreen;
