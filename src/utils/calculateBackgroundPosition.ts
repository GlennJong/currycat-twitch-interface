/**
 * 計算背景位置的工具函數
 * @param size 背景圖片的大小 (寬度和高度)
 * @param position 背景圖片的座標 (x, y)
 * @returns 對應的 background-position 值
 */
function calculateBackgroundPosition(size: { width: number; height: number }, position: { x: number; y: number }): string {
  const { width, height } = size;
  const { x, y } = position;

  // 計算背景位置
  const backgroundX = -x * width;
  const backgroundY = -y * height;

  return `${backgroundX}px ${backgroundY}px`;
}

export { calculateBackgroundPosition };

// 使用範例
// const size = { width: 100, height: 100 };
// const position = { x: 2, y: 3 };
// console.log(calculateBackgroundPosition(size, position)); // 輸出: "-200px -300px"
