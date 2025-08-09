import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { VoiceInputUtility } from './voice-inputer';

const Dialogue = forwardRef(function Dialogue({ style, onInput, onSilence }: { style?: React.CSSProperties, onInput: (content: string) => void, onSilence: () => void }, ref) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dialogElemRef = useRef<HTMLDivElement>(null);
  const voiceInputRef = useRef<ReturnType<typeof VoiceInputUtility> | null>(null);

  useEffect(() => {
    handleStartDialogue();
    return () => {
      handleDestroyDialogue();
    }
  }, []);

  const handleStartDialogue = () => {
    if (voiceInputRef.current) return;
    voiceInputRef.current = VoiceInputUtility({
      onStart: () => {
        console.log('VoiceInputer: Recognition started.');
      },
      onError: (event) => {
        console.error('VoiceInputer: Recognition error:', event.error);
      },
      onSilence: () => {
        onSilence();
      },
      onSentenceEnd: (sentence) => {
        console.log('VoiceInputer: Sentence end:', sentence);
      },
      onInput: (transcript) => {
        console.log('VoiceInputer: Recognition result:', transcript);
        if (transcript.length === 0) return;
        onInput(transcript);
        dialogElemRef.current!.textContent = transcript;
      },
      interruption: 1000
    });
    voiceInputRef.current.start();
  };

  const handleDestroyDialogue = () => {
    if (voiceInputRef.current) {
      voiceInputRef.current.destroy();
      voiceInputRef.current = null;
    }
  };

  const handleSwitchLanguage = (lang = 'zh-TW') => {
    if (voiceInputRef.current) {
      voiceInputRef.current.switch(lang);
    }
  };

  useImperativeHandle(ref, () => ({
    create: handleStartDialogue,
    destroy: handleDestroyDialogue,
    switchLanguage: handleSwitchLanguage,
  }));

  return (
    <div>
      <div ref={wrapperRef}>
        <div style={style} ref={dialogElemRef}></div>
      </div>
    </div>
  );
});

export default Dialogue;
