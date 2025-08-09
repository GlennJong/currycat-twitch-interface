import './style.css'
import Chatroom from "@/components/Chatroom";
import TodoList from "@/components/TodoList";
import Timer from "@/components/Timer";
import { useEffect, useRef, useState } from "react";
import { Ball } from "./RollingBall";
import Portrait from '../../components/Portrait';
import FreeWindow from '../../components/FreeWindow/index';
import Window from '@/components/Window';
import Checkbox from '../../components/Checkbox/index';
import { Color } from '@/constants';

function MainScreen() {
  const [ isTodoListOpen, setIsTodoListOpen ] = useState(true);
  const ballRef = useRef<Ball>(null);

  // useEffect(() => {
  //   if (!ballRef.current) {
  //     ballRef.current = new Ball(200, 200);
  //   }
  //   return () => {
  //     ballRef.current?.destroy();
  //     ballRef.current = null;
  //   }
  // }, []);
  
  return (
    <>
      <div className="main-screen">
        {/* <button onClick={() => ballRef.current?.left(100)}>left</button>
        <button onClick={() => ballRef.current?.right(100)}>right</button>
        <button onClick={() => ballRef.current?.leftUp(100)}>leftUp</button> */}
        <div className="top">
          <Timer />
        </div>
        <div className="center">
          <div className="main">
            {/* main */}
            {/* <button className="button">test</button> */}
          </div>
          <div className="side">
            <Window>
              <Chatroom />
            </Window>
          </div>

        </div>
        <div className="bottom">
          <div style={{ color: Color.Light }}>
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
                checked={isTodoListOpen}
                label="DIALOGUE"
                onChange={(checked) => setIsTodoListOpen(checked)}
              />
            </div>
            <div>
              <Checkbox
                theme="light"
                checked={isTodoListOpen}
                label="CURRY CAT"
                onChange={(checked) => setIsTodoListOpen(checked)}
              />
            </div>
          </div>
          {/* <FreeWindow id="test" position={{ x: 400, y: 400 }}>
            <Portrait />
          </FreeWindow> */}
        </div>
        { isTodoListOpen &&
          <FreeWindow id="todolist" position={{ x: 400, y: 400 }}>
            <TodoList />
          </FreeWindow>
        }
        <FreeWindow id="portrait" position={{ x: 400, y: 400 }}>
          <Portrait />
        </FreeWindow>
      </div>
    </>
  );
}

export default MainScreen;
