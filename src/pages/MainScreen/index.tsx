import VoiceInputer from "@/components/VoiceInputer";
import './style.css'
import Chatroom from "@/components/Chatroom";
import TodoList from "@/components/TodoList";
import Timer from "@/components/Timer";

function MainScreen() {
  return (
    <div className="main-screen">
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
        <VoiceInputer />
      </div>
    </div>
  );
}

export default MainScreen;
