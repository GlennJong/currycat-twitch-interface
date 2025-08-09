import { useRef, forwardRef, useImperativeHandle } from "react";

const Portrait = forwardRef(function Portrait({ style }: { style?: React.CSSProperties }, ref) {
  const photoRef = useRef<HTMLImageElement>(null);

  const handleSwitchPhoto = (type: string, id: string) => {
    if (photoRef.current) {
      photoRef.current.src = `./assets/portrait_${type}_${id}.svg`;
    }
  };

  const handleResetPhoto = () => {
    if (photoRef.current) {
      photoRef.current.src = `./assets/portrait_a_0.svg`;
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
      src="./assets/portrait_a_1.svg"
      alt=""
    />
  );
});

export default Portrait;
