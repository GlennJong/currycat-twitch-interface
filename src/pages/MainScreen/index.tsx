import './style.css'
import Chatroom from "@/components/Chatroom";
import TodoList from "@/components/TodoList";
import Timer from "@/components/Timer";
import { useEffect, useRef } from "react";
import { Ball } from "./RollingBall";
import Portrait from '../../components/Portrait';
import FreeWindow from '../../components/FreeWindow/index';

function MainScreen() {
  const ballRef = useRef<Ball>(null);

  useEffect(() => {
    if (!ballRef.current) {
      ballRef.current = new Ball(200, 200);
    }
    return () => {
      ballRef.current?.destroy();
      ballRef.current = null;
    }
  }, []);
  
  return (
    <div className="main-screen">
      <button onClick={() => ballRef.current?.left(100)}>left</button>
      <button onClick={() => ballRef.current?.right(100)}>right</button>
      <button onClick={() => ballRef.current?.leftUp(100)}>leftUp</button>
      <div className="top">
        <Timer />
      </div>
      <div className="center">
        <div className="side">
          <TodoList />
        </div>
        <div className="main">main</div>
        <div className="side">
          <Chatroom />
        </div>

      </div>
      <div className="bottom">
        <FreeWindow>
          <Portrait />
        </FreeWindow>
      </div>
    </div>
  );
}

export default MainScreen;
