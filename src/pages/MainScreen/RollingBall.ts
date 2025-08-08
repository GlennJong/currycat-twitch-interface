// Interactive Ball
// 這個類別代表一個可以互動的球，能夠在八個方向上移動，並根據狀態改變外觀

class Ball {
  private x: number;
  private y: number;
  private el: HTMLDivElement;
  private idleTimeout: number = 0;

  constructor(x?: number, y?: number) {
    // 若未提供 x, y，則預設在視窗正中央
    if (x === undefined) {
      x = window.innerWidth / 2;
    }
    if (y === undefined) {
      y = window.innerHeight / 2;
    }
    this.x = x;
    this.y = y;

    // 建立球的 DOM 元素
    this.el = document.createElement('div');
    this.el.style.position = 'absolute';
    this.el.style.width = '50px';
    this.el.style.height = '50px';
    this.el.style.borderRadius = '50%';
    this.el.style.textAlign = 'center';
    this.el.style.lineHeight = '50px';
    this.el.style.fontSize = '12px';
    this.el.style.transition = 'left 0.2s, top 0.2s';
    this.el.style.left = this.x + 'px';
    this.el.style.top = this.y + 'px';
    // 設定預設狀態
    this.setAppearance('idle', 'center');
    document.body.appendChild(this.el);
  }

  private setAppearance(state: 'idle' | 'moving', direction: string): void {
    // 根據狀態設定不同顏色
    if (state === 'moving') {
      this.el.style.backgroundColor = '#4CAF50'; // 移動時為綠色
    } else {
      this.el.style.backgroundColor = '#2196F3'; // 靜止時為藍色
    }
    // 更新顯示內容，方便觀察狀態與方向
    this.el.innerText = `${state} (${direction})`;
  }

  private move(dx: number, dy: number, direction: string): void {
    clearTimeout(this.idleTimeout);
    this.x += dx;
    this.y += dy;
    this.el.style.left = this.x + 'px';
    this.el.style.top = this.y + 'px';
    this.setAppearance('moving', direction);
    // 200ms 後回復靜止狀態
    this.idleTimeout = window.setTimeout(() => {
      this.setAppearance('idle', direction);
    }, 200);
  }

  // 8 個方向的移動方法
  left(distance: number): void {
    this.move(-distance, 0, 'left');
  }
  right(distance: number): void {
    this.move(distance, 0, 'right');
  }
  up(distance: number): void {
    this.move(0, -distance, 'up');
  }
  down(distance: number): void {
    this.move(0, distance, 'down');
  }
  leftUp(distance: number): void {
    this.move(-distance, -distance, 'left-up');
  }
  rightUp(distance: number): void {
    this.move(distance, -distance, 'right-up');
  }
  leftDown(distance: number): void {
    this.move(-distance, distance, 'left-down');
  }
  rightDown(distance: number): void {
    this.move(distance, distance, 'right-down');
  }

  // 於 class Ball 中新增 destroy 方法，用於移除球的 DOM 元素
  destroy(): void {
    clearTimeout(this.idleTimeout);
    this.el.remove();
  }
}

// 使用範例
// 可在外部根據需求自行產生新的 Ball 物件，並設定起始位置
export { Ball };

// 以下為測試範例，可以在瀏覽器中開啟開發者工具後輸入以下指令進行測試：
// const ball = new Ball(200, 200);
// ball.left(10);
// ball.rightUp(15);
