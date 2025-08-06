import VoiceInputer from "@/components/VoiceInputer";
import './style.css'

function MainScreen() {
  return (
    <div className="main-screen">
      <div className="top">top</div>
      <div className="center">center</div>
      <div className="bottom">
        <VoiceInputer />
      </div>
    </div>
  );
}

export default MainScreen;
