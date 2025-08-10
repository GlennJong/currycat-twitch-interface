import React, { useState, useEffect } from 'react';
import './style.css';
import { Clock, CounterBack, CounterFront } from '../Icons/counter';
import { Color } from '@/constants';

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const Timer: React.FC = () => {
  // 計算當前時間 + 1 小時，並格式化為 hh:mm，考慮時區偏移 (+8)
  const getDefaultInputTime = () => {
    const now = new Date();
    now.setUTCHours(now.getUTCHours() + 8 + 1); // UTC 時間加 8 小時再加 1 小時
    return now.toISOString().slice(11, 16); // 提取 hh:mm 格式
  };

  const [inputTime, setInputTime] = useState(getDefaultInputTime()); // 預設值改為當前時間 + 1 小時
  const [duration, setDuration] = useState(60); // 總秒數
  const [remaining, setRemaining] = useState<number | null>(null); // null 表示尚未開始
  const [dragging, setDragging] = useState(false);

  // 倒數計時
  useEffect(() => {
    if (remaining === null || remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [remaining]);

  // 當倒數結束
  useEffect(() => {
    if (remaining === 0) {
      setRemaining(null);
    }
  }, [remaining]);

  // 開始倒數，計算距離指定時間的秒數，考慮時區偏移 (+8)
  const startTimer = () => {
    const now = new Date();
    const [h, m] = inputTime.split(':').map(Number);
    const target = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      h - 8, // 減去 8 小時的時區偏移
      m,
      0,
      0
    ));
    let diff = Math.floor((target.getTime() - now.getTime()) / 1000);
    // 若目標時間已過，則倒數到明天的該時間
    if (diff < 0) {
      target.setUTCDate(target.getUTCDate() + 1);
      diff = Math.floor((target.getTime() - now.getTime()) / 1000);
    }
    setDuration(diff);
    setRemaining(diff);
  };

  // 拖曳 bar
  const onBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragging(true);
    const bar = e.currentTarget; // 使用事件目標作為 bar
    if (remaining === null) return;
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

  const onBarContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (remaining === null) return;
    const bar = e.currentTarget; // 使用事件目標作為 bar
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

  // 修改 remaining 的顯示格式為 hh:mm:ss
  const formatRemainingTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ maxWidth: 400, padding: '12px 24px', height: '48px', display: 'flex', flexDirection: 'column' }}>
        {remaining === null ? (
          <div style={{ display: 'flex', gap: 8, }}>
            <input
              className="dark"
              type="time"
              value={inputTime}
              onChange={e => setInputTime(e.target.value)}
            />
            <button className="dark" onClick={startTimer}>確定</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Clock style={{ width: '42px', color: Color.WhiteLight }} onClick={cancelTimer} />
            <div className="counter" style={{ height: '48px' }}>
              <CounterBack style={{ color: Color.WhiteWhiteDark }} />
              <div className="bar">
                <div
                  onMouseDown={onBarMouseDown}
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    cursor: dragging ? 'grabbing' : 'pointer',
                    userSelect: 'none',
                  }}
                >
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
                <div className="length" style={{ width: `${(remaining / duration) * 100}%` }}></div>
              </div>
              <CounterFront style={{ color: Color.WhiteLight }} />
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '8px 24px', color: Color.WhiteLight, fontSize: 32 }}>
        {remaining !== null ? formatRemainingTime(Math.max(remaining, 0)) : ''}
      </div>
    </div>
  );
};

export default Timer;
