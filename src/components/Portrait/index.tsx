import { useRef, forwardRef, useImperativeHandle } from "react";

export type PortraitRef = {
  switch: (type?: string) => void;
  reset: () => void;
}

const Portrait = forwardRef(function Portrait({ style }: { style?: React.CSSProperties }, ref) {
  const photoRef = useRef<HTMLImageElement>(null);
  const typeRef = useRef<string>('a');
  const idRef = useRef<string>('0');

  const handleSwitchPhoto = (type?: string) => {
    if (photoRef.current) {
      if (type) typeRef.current = type;
      idRef.current = idRef.current === '0' ? '1' : '0';
      photoRef.current.src = `./assets/portrait_${typeRef.current}_${idRef.current}.svg`;
    }
  };

  const handleResetPhoto = () => {
    if (photoRef.current) {
      photoRef.current.src = `./assets/portrait_a_0.svg`;
      typeRef.current = 'a';
      idRef.current = '0';
    }
  };

  useImperativeHandle(ref, () => ({
    switch: handleSwitchPhoto,
    reset: handleResetPhoto,
  }));

  return (
    <img
      ref={photoRef}
      style={{ display: 'block', width: '100%', height: '100%', ...style }}
      src="./assets/portrait_a_0.svg"
      alt=""
    />
  );
});

export default Portrait;
