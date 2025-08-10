import 'react';
import { useState, useEffect } from 'react';

const ColorPicker = ({ defaultColor, onChange }: { defaultColor?: string, onChange?: (color: string) => void}) => {
  const [color, setColor] = useState(defaultColor || "#ffffff");

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    onChange && onChange(color);
  }, [color, onChange]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', }}>
      <label style={{ position: 'relative', cursor: 'pointer'}}>
        <input
          style={{ opacity: 0, visibility: 'hidden', position: 'absolute' }}
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
        />
        <div style={{ mixBlendMode: 'difference', fontSize: '12px' }}>
          {color}
        </div>
      </label>
    </div>
  );
};

export default ColorPicker;