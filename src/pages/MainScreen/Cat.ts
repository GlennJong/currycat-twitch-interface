const CAT_SIZE = 54;
const ITEM_SIZE = 39;
const MOVING_DURATION = 600;
const RUNNING_INTERVAL = 100;
const TOUCHING_INTERVAL = 300;
const IDLE_WAITING_TIME = 10000;

const cat: Record<string, [number, number][]> = {
  stop_left: [[0, 0]],
  idle_left: [[0, 1]],
  running_left: [[0, 2], [1, 2]],
  touching_left: [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3]],
  stop_right: [[0, 4]],
  idle_right: [[0, 5]],
  running_right: [[0, 6], [1, 6]],
  touching_right: [[0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
}

const item: Record<string, [number, number][]> = {
  normal_left: [[0, 0]],
  touching_left: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1]],
  normal_right: [[0, 2]],
  touching_right: [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3]],
}

class Cat {
  private x: number;
  private y: number;
  private cat: HTMLDivElement; // 原 this.el
  private idleTimeout: number = 0;
  private item: HTMLDivElement; // 原 this.randomElement
  private state: 'stop' | 'idle' | 'running' | 'touching' = 'stop';
  private idleTimer: number = 0;
  private animationInterval: number | null = null;
  private lastHorizontalDirection: 'left' | 'right' = 'left';

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

    // 修改 this.el 為 this.cat
    this.cat = document.createElement('div');
    this.cat.style.position = 'absolute';
    this.cat.style.zIndex = '999';
    this.cat.style.width = '50px';
    this.cat.style.height = '50px';
    this.cat.style.textAlign = 'center';
    this.cat.style.lineHeight = '50px';
    this.cat.style.fontSize = '12px';
    this.cat.style.transition = `left linear ${MOVING_DURATION}ms, top linear ${MOVING_DURATION}ms`;
    this.cat.style.left = this.x + 'px';
    this.cat.style.top = this.y + 'px';
    this.cat.style.backgroundImage = `url('../assets/cat.svg')`;
    this.cat.style.backgroundSize = `${CAT_SIZE * 6}px ${CAT_SIZE * 8}px`;
    // 設定預設狀態
    document.body.appendChild(this.cat);

    // 修改 this.randomElement 為 this.item
    this.item = document.createElement('div');
    this.item.style.position = 'absolute';
    this.item.style.zIndex = '1000';
    this.item.style.width = `${ITEM_SIZE}px`;
    this.item.style.height = `${ITEM_SIZE}px`;
    this.item.style.backgroundImage = `url('../assets/cup.svg')`;
    this.moveItem();
    document.body.appendChild(this.item);

    this.setState('stop');
  }

  private setState(newState: 'stop' | 'idle' | 'running' | 'touching'): void {
    this.state = newState;
    console.log(`State changed to: ${this.state}`);

    if (this.state === 'stop') {
      clearTimeout(this.idleTimer);
      this.idleTimer = window.setTimeout(() => {
        if (this.state === 'stop') {
          this.setState('idle');
        }
      }, IDLE_WAITING_TIME); // 20 秒後進入 idle 狀態
    } else if (this.state === 'idle') {
      // 設定 idle 狀態的背景幀
      const idleFrame = cat[`idle_${this.lastHorizontalDirection}`][0];
      this.cat.style.backgroundPosition = `-${idleFrame[0] * CAT_SIZE}px -${idleFrame[1] * CAT_SIZE}px`;
    }
  }

  private async handleCollision(): Promise<void> {
    this.setState('touching');

    // 計算 item 的相對方向
    const catRect = this.cat.getBoundingClientRect();
    const itemRect = this.item.getBoundingClientRect();
    const horizontalDirection = itemRect.left < catRect.left ? 'left' : 'right';

    // 更新 cat 的方向
    this.lastHorizontalDirection = horizontalDirection;

    // 播放 cat 的 touching 動畫
    const frames = cat[`touching_${this.lastHorizontalDirection}`];
    this.startRunningAnimation(frames, TOUCHING_INTERVAL);

    // 播放 item 的 touching 動畫
    await this.handleItemTouching();

    // 停止 cat 的動畫
    this.stopRunningAnimation();

    // 移動 item
    this.moveItem();

    this.setState('stop');
  }

  private startRunningAnimation(frames: [number, number][], interval: number): void {
    let frameIndex = 0;

    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }

    this.animationInterval = window.setInterval(() => {
      const [frameX, frameY] = frames[frameIndex];
      this.cat.style.backgroundPosition = `-${frameX * CAT_SIZE}px -${frameY * CAT_SIZE}px`;
      frameIndex = (frameIndex + 1) % frames.length;
    }, interval);
  }

  private stopRunningAnimation(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  private async move(dx: number, dy: number, direction: string): Promise<void> {
    clearTimeout(this.idleTimeout);
    this.setState('running');

    // 確定方向
    let horizontalDirection: 'left' | 'right';
    if (direction.includes('left')) {
      horizontalDirection = 'left';
    } else if (direction.includes('right')) {
      horizontalDirection = 'right';
    } else {
      horizontalDirection = this.lastHorizontalDirection;
    }

    // 記住最後的水平方向
    this.lastHorizontalDirection = horizontalDirection;

    // 選擇動畫幀
    const frames = cat[`running_${horizontalDirection}`];
    const stopFrame = cat[`stop_${horizontalDirection}`][0];
    this.startRunningAnimation(frames, RUNNING_INTERVAL);

    this.x += dx;
    this.y += dy;
    this.cat.style.left = this.x + 'px';
    this.cat.style.top = this.y + 'px';

    // 碰撞檢測
    const catRect = this.cat.getBoundingClientRect();
    const itemRect = this.item.getBoundingClientRect();

    if (
      catRect.left < itemRect.right &&
      catRect.right > itemRect.left &&
      catRect.top < itemRect.bottom &&
      catRect.bottom > itemRect.top
    ) {
      await this.handleCollision();
    }

    // 200ms 後回復靜止狀態
    await new Promise((resolve) => {
      this.idleTimeout = window.setTimeout(() => {
        this.setState('stop');
        this.stopRunningAnimation();

        // 恢復靜止狀態的背景幀
        this.cat.style.backgroundPosition = `-${stopFrame[0] * CAT_SIZE}px -${stopFrame[1] * CAT_SIZE}px`;

        resolve(null);
      }, MOVING_DURATION);
    });
  }

  private moveItem(): void {
    const randomX = Math.random() * (window.innerWidth - 30);
    const randomY = Math.random() * (window.innerHeight - 30);
    this.item.style.left = `${randomX}px`;
    this.item.style.top = `${randomY}px`;

    // 隨機選擇 normal_left 或 normal_right
    const direction = Math.random() < 0.5 ? 'left' : 'right';
    const normalFrame = item[`normal_${direction}`][0];
    this.item.style.backgroundPosition = `-${normalFrame[0] * ITEM_SIZE}px -${normalFrame[1] * ITEM_SIZE}px`;
    this.item.style.backgroundSize = `${ITEM_SIZE * 5}px ${ITEM_SIZE * 4}px`;
  }

  private async handleItemTouching(): Promise<void> {
    // 選擇動畫幀
    const frames = item[`touching_${this.lastHorizontalDirection}`];
    let frameIndex = 0;

    // 啟動動畫
    const animationInterval = window.setInterval(() => {
      const [frameX, frameY] = frames[frameIndex];
      this.item.style.backgroundPosition = `-${frameX * ITEM_SIZE}px -${frameY * ITEM_SIZE}px`;
      frameIndex = (frameIndex + 1) % frames.length;
    }, TOUCHING_INTERVAL);

    // 播放動畫並等待完成
    await new Promise((resolve) => setTimeout(resolve, frames.length * TOUCHING_INTERVAL));

    // 停止動畫
    clearInterval(animationInterval);
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

  destroy(): void {
    clearTimeout(this.idleTimeout);
    clearTimeout(this.idleTimer);
    this.cat.remove();
    this.item.remove();
  }
}

export { Cat };
