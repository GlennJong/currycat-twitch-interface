import 'react';
import { useState, useEffect } from 'react';
import './style.css';

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
    console.log({inputValue})
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
    <div className="colorpicker">
      <label onClick={handleLabelClick}>
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
        />
        <div className="value">
          {color}
        </div>
        {isInputVisible && (
          <input
            type="text"
            defaultValue={color}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
          />
        )}
      </label>
    </div>
  );
};

export default ColorPicker;