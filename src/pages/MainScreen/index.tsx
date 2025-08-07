import VoiceInputer from "@/components/VoiceInputer";
import './style.css'
import Chatroom from "@/components/Chatroom";

function MainScreen() {
  return (
    <div className="main-screen">
      <div className="top">
        time counter
      </div>
      <div className="center">
        <div className="side">
          todo list
          {/* <Chatroom /> */}
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
