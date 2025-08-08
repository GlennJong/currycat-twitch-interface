import React, { useState, useRef, useEffect } from 'react';
import './style.css';

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const Timer: React.FC = () => {
  const [inputTime, setInputTime] = useState('12:00');
  const [duration, setDuration] = useState(60); // 總秒數
  const [remaining, setRemaining] = useState<number | null>(null); // null 表示尚未開始
  const [dragging, setDragging] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // 倒數計時
  useEffect(() => {
    if (remaining === null || remaining <= 0) return;
    timerRef.current = setInterval(() => {
      setRemaining(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remaining]);

  // 當倒數結束
  useEffect(() => {
    if (remaining === 0 && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [remaining]);

  // 開始倒數，計算距離指定時間的秒數
  const startTimer = () => {
    const now = new Date();
    const [h, m] = inputTime.split(':').map(Number);
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    let diff = Math.floor((target.getTime() - now.getTime()) / 1000);
    // 若目標時間已過，則倒數到明天的該時間
    if (diff < 0) {
      target.setDate(target.getDate() + 1);
      diff = Math.floor((target.getTime() - now.getTime()) / 1000);
    }
    setDuration(diff);
    setRemaining(diff);
  };

  // 拖曳 bar
  const onBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragging(true);
    const bar = barRef.current;
    if (!bar || remaining === null) return;
    const rect = bar.getBoundingClientRect();
    const startX = e.clientX;
    const startWidth = (remaining / duration) * rect.width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
  const percent = clamp((startWidth + dx) / rect.width, 0, 1);
      let newSeconds = Math.round(percent * duration);
      newSeconds = clamp(newSeconds, 1, duration);
      setRemaining(newSeconds);
    };
    const onMouseUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // 拖曳 bar 改變總時間
  const onBarContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (remaining === null) return;
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
  const percent = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    let newSeconds = Math.round(percent * duration);
    newSeconds = clamp(newSeconds, 1, duration);
    setRemaining(newSeconds);
  };

  // 取消倒數
  const cancelTimer = () => {
    setRemaining(null);
    // 不重設 inputTime，保留原本輸入
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 20 }}>
      <h2>倒數計時器</h2>
      {remaining === null ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="time"
            value={inputTime}
            onChange={e => setInputTime(e.target.value)}
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={startTimer} style={{ padding: '8px 16px' }}>確定</button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 16 }}>
            {(() => {
              const sec = Math.max(remaining, 0);
              const h = Math.floor(sec / 3600).toString().padStart(2, '0');
              const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
              const s = (sec % 60).toString().padStart(2, '0');
              return `${h}:${m}:${s}`;
            })()}
          </div>
          <div
            ref={barRef}
            onMouseDown={onBarMouseDown}
            style={{
              width: '100%',
              height: 32,
              background: '#eee',
              borderRadius: 8,
              position: 'relative',
              cursor: dragging ? 'grabbing' : 'pointer',
              userSelect: 'none',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: `${(remaining / duration) * 100}%`,
                height: '100%',
                background: '#4caf50',
                borderRadius: 8,
                transition: dragging ? 'none' : 'width 0.2s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: `${(remaining / duration) * 100}%`,
                top: 0,
                height: '100%',
                width: 4,
                background: '#333',
                borderRadius: 2,
                transform: 'translateX(-2px)',
                cursor: 'ew-resize',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
              }}
              onMouseDown={onBarContainerMouseDown}
            />
          </div>
          <button onClick={cancelTimer} style={{ padding: '8px 16px' }}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Timer;
