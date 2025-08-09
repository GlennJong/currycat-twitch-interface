import React, { ReactNode, useState } from 'react';
import ReactDOM from 'react-dom';
import './style.css';

const FreeWindow = ({
  children,
  position: initialPosition = { x: 100, y: 100 },
  minWidth = 150,
  minHeight = 100,
}: {
  children: ReactNode;
  position?: { x: number; y: number };
  minWidth?: number;
  minHeight?: number;
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState({ width: 300, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, mouseX: 0, mouseY: 0 });

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
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="header" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
        Drag Me
      </div>
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