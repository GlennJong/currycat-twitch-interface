import { useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import { VoiceDetectUtility } from "./voice";
// import VoiceInputer from "./ws-voice-inputer";

// 尺寸配置常數
const PORTRAIT_SIZE = 120; // 單個角色顯示尺寸
const SPRITE_SHEET_SIZE = PORTRAIT_SIZE * 2; // sprite sheet 總尺寸 (2x2 grid)

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
      onSilence: () => {
        console.log('silence detected')
        handleResetPhoto();
      },
      onVoice: () => {
        console.log('voice detected')
        handleSwitchPhoto();
      },
      threshold: 0.05
    })

    // 清理函數
    return () => {
      voiceInputer.current?.destroy()
    }
  }, [])
  
  const handleSwitchPhoto = (type?: string) => {
    if (containerRef.current) {
      if (type) typeRef.current = type;
      idRef.current = idRef.current === "0" ? "1" : "0";
      const x = idRef.current === "0" ? 0 : -PORTRAIT_SIZE;
      const y = typeRef.current === "normal" ? 0 : -PORTRAIT_SIZE;
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
        width: `${PORTRAIT_SIZE}px`,
        height: `${PORTRAIT_SIZE}px`,
        backgroundImage: "url('./assets/portrait.svg')",
        backgroundPosition: "0px 0px",
        backgroundSize: `${SPRITE_SHEET_SIZE}px ${SPRITE_SHEET_SIZE}px`,
        ...style,
      }}
    />
  );
});

export default Portrait;
