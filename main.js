const { app, BrowserWindow, powerSaveBlocker } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let powerSaveBlockerId = null;

// 防止系統休眠和節能限制
app.whenReady().then(() => {
  // 阻止系統進入省電模式
  powerSaveBlockerId = powerSaveBlocker.start('prevent-app-suspension');
  console.log('Power save blocker started:', powerSaveBlocker.isStarted(powerSaveBlockerId));
});

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false, // 防止背景節流
    },
    show: false, // 先不顯示，等載入完成再顯示
  });

  // 防止視窗在背景時被限制
  mainWindow.webContents.setBackgroundThrottling(false);

  // 視窗載入完成後顯示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    // 開發模式載入 Vite dev server
    mainWindow.loadURL('http://localhost:8000');
    mainWindow.webContents.openDevTools();
  } else {
    // 生產模式載入打包後的檔案
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // 視窗失去焦點時保持運行
  mainWindow.on('blur', () => {
    console.log('Window lost focus but keeping active');
  });

  // 視窗最小化時保持運行
  mainWindow.on('minimize', () => {
    console.log('Window minimized but keeping active');
  });
});

app.on('window-all-closed', () => {
  // 釋放電源管理阻止器
  if (powerSaveBlockerId !== null) {
    powerSaveBlocker.stop(powerSaveBlockerId);
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    // 重新創建視窗的邏輯應該和 ready 事件中的相同
    // 這裡可以呼叫創建視窗的函數
  }
});

// macOS 特定：防止應用程式在 Dock 隱藏時被暫停
app.on('before-quit', () => {
  if (powerSaveBlockerId !== null) {
    powerSaveBlocker.stop(powerSaveBlockerId);
  }
});
