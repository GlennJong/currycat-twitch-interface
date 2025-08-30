import { useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import { VoiceDetectUtility } from "./voice";
// import VoiceInputer from "./ws-voice-inputer";

export type PortraitRef = {
  switch: (type?: string) => void;
  reset: () => void;
  enableVoice: () => void;
  disableVoice: () => void;
};

const Portrait = forwardRef(function Portrait(
  { style }: { style?: React.CSSProperties },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<string>("normal");
  const idRef = useRef<string>("0");
  const voiceInputer = useRef<ReturnType<typeof VoiceDetectUtility> | null>(null);


  useEffect(() => {
    voiceInputer.current = VoiceDetectUtility({
      // onStart: () => {
      //   console.log('VoiceInputer: Recognition started.');
      // },
      // onError: (event: any) => {
      //   console.error('VoiceInputer: Recognition error:', event);
      // },
      onSilence: () => {
        console.log('slience')
        handleResetPhoto();
      },
      onVoice: () => {
        console.log('voice')
        handleSwitchPhoto();
      },
      threshold: 0.01
    })
  }, [])
  
  const handleSwitchPhoto = (type?: string) => {
    if (containerRef.current) {
      if (type) typeRef.current = type;
      idRef.current = idRef.current === "0" ? "1" : "0";
      const x = idRef.current === "0" ? 0 : -160; // 假設每個角色的高度為 160px
      const y = typeRef.current === "normal" ? 0 : -160; // 假設每個角色的寬度為 160px
      containerRef.current.style.backgroundPosition = `${x}px ${y}px`;
    }
  };

  const handleResetPhoto = () => {
    if (containerRef.current) {
      containerRef.current.style.backgroundPosition = "0px 0px";
      typeRef.current = "normal";
      idRef.current = "0";
    }
  };

  useImperativeHandle(ref, () => ({
    switch: handleSwitchPhoto,
    reset: handleResetPhoto,
    enableVoice: voiceInputer.current?.start,
    disableVoice: voiceInputer.current?.stop
  }));

  return (
    <div
      ref={containerRef}
      style={{
        display: "block",
        width: "160px", // 假設每個角色的寬度為 160px
        height: "160px", // 假設每個角色的高度為 160px
        backgroundImage: "url('./assets/portrait.svg')",
        backgroundPosition: "0px 0px",
        backgroundSize: "320px 320px", // 假設大圖的尺寸為 320px x 320px
        ...style,
      }}
    />
  );
});

export default Portrait;
