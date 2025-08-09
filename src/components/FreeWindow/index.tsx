import React, { ReactNode, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './style.css';
import { frame } from '../../utils/frame';

const FreeWindow = ({
  id,
  children,
  position: initialPosition = { x: 100, y: 100 },
  style,
  minWidth = 150,
  minHeight = 100,
}: {
  id: string;
  children: ReactNode;
  position?: { x: number; y: number };
  style?: React.CSSProperties;
  minWidth?: number;
  minHeight?: number;
}) => {
  const [position, setPosition] = useState(() => {
    const savedPosition = localStorage.getItem(`${id}-position`);
    return savedPosition ? JSON.parse(savedPosition) : initialPosition;
  });

  const [size, setSize] = useState(() => {
    const savedSize = localStorage.getItem(`${id}-size`);
    return savedSize ? JSON.parse(savedSize) : { width: 300, height: 200 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, mouseX: 0, mouseY: 0 });

  useEffect(() => {
    localStorage.setItem(`${id}-position`, JSON.stringify(position));
  }, [id, position]);

  useEffect(() => {
    localStorage.setItem(`${id}-size`, JSON.stringify(size));
  }, [id, size]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.mouseX;
      const deltaY = e.clientY - resizeStart.mouseY;

      setSize({
        width: Math.max(resizeStart.width + deltaX, minWidth),
        height: Math.max(resizeStart.height + deltaY, minHeight),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      width: size.width,
      height: size.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
  };

  return ReactDOM.createPortal(
    <div
      className="free-window"
      style={{
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height,
        borderImage: `url(${frame})`,
        borderImageSlice: '49% 49% fill',
        borderImageWidth: '32px',
        ...style
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="header" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}></div>
      <div className="content">{children}</div>
      <div
        className="resize-handle bottom-right"
        onMouseDown={handleResizeStart}
      ></div>
    </div>,
    document.body
  );
};

export default FreeWindow;