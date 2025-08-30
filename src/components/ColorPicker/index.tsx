import 'react';
import { useState, useEffect } from 'react';

const ColorPicker = ({ defaultColor, onChange }: { defaultColor?: string, onChange?: (color: string) => void}) => {
  const [color, setColor] = useState(defaultColor || "#ffffff");
  const [isInputVisible, setIsInputVisible] = useState(false);

  useEffect(() => {
    if (defaultColor === color) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    onChange && onChange(color);
  }, [color, defaultColor, onChange]);

  const handleLabelClick = () => {
    setIsInputVisible(true);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const hexRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
    if (hexRegex.test(inputValue)) {
      setColor(inputValue);
    }
    setIsInputVisible(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const inputValue = (e.target as HTMLInputElement).value;
      const hexRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
      if (hexRegex.test(inputValue)) {
        setColor(inputValue);
      }
      setIsInputVisible(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', }}>
      <label style={{ position: 'relative', cursor: 'pointer'}} onClick={handleLabelClick}>
        <input
          style={{ opacity: 0, visibility: 'hidden', position: 'absolute' }}
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
        />
        <div style={{ mixBlendMode: 'difference', fontSize: '12px' }}>
          {color}
        </div>
        {isInputVisible && (
          <input
            type="text"
            defaultValue={color}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            style={{ position: 'absolute', top: '20px', left: 0, zIndex: 0, width: '100px', fontSize: '12px' }}
          />
        )}
      </label>
    </div>
  );
};

export default ColorPicker;