import { useEffect, useRef } from 'react';
import { VoiceInputUtility } from './voice-inputer';

function VoiceInputer({ style }: { style?: React.CSSProperties }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dialogElemRef = useRef<HTMLDivElement>(null);
  const voiceInputRef = useRef<ReturnType<typeof VoiceInputUtility>>(null);
  
  useEffect(() => {
    voiceInputRef.current = VoiceInputUtility({
      onStart: () => {
        wrapperRef.current!.style.opacity = '1';
        console.log('VoiceInputer: Recognition started.');
      },
      onError: (event) => {
        console.error('VoiceInputer: Recognition error:', event.error);
      },
      onSilence: () => {
        wrapperRef.current!.style.opacity = '0';
      },
      onInput: (transcript) => {
        console.log('VoiceInputer: Recognition result:', transcript);
        dialogElemRef.current!.textContent = transcript;
      },
      interruption: 600
    });
  }, []);
  
  return (
    <div>
      <button onClick={() => voiceInputRef.current?.start()}>Start</button>
      <button onClick={() => voiceInputRef.current?.stop()}>Stop</button>
      <div ref={wrapperRef}>
        <div style={style} ref={dialogElemRef}></div>
      </div>
    </div>
  );
}

export default VoiceInputer;
