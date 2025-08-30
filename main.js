const { app, BrowserWindow, powerSaveBlocker, session } = require('electron');
const path = require('path');
const http = require('http');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let powerSaveBlockerId = null;
let oauthServer = null;

// 創建 OAuth 重定向伺服器（僅在生產環境）
function createOAuthServer() {
  if (isDev || oauthServer) return;
  
  oauthServer = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:8000`);
    
    // 處理 OAuth 重定向
    if (url.pathname === '/') {
      console.log('OAuth redirect received:', req.url);
      
      // 設定 CORS 標頭
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
      // 回傳一個簡單的 HTML 頁面，將 hash 參數傳遞給主應用
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>OAuth Redirect</title>
        </head>
        <body>
          <script>
            // 將 hash 參數發送給主應用
            if (window.location.hash) {
              const message = {
                type: 'oauth_redirect',
                data: window.location.hash
              };
              console.log('OAuth redirect detected:', window.location.hash);
              setTimeout(() => window.close(), 2000);
            } else {
              document.body.innerHTML = '<p>OAuth redirect received. You can close this window.</p>';
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </body>
        </html>
      `;
      
      res.end(html);
      
      // 將 OAuth 結果發送到主視窗
      if (mainWindow && req.url.includes('#')) {
        const hashPart = req.url.split('#')[1] || '';
        if (hashPart) {
          const appUrl = `file://${path.join(__dirname, 'dist/index.html')}#${hashPart}`;
          console.log('Loading OAuth result in main window:', appUrl);
          setTimeout(() => {
            mainWindow.loadURL(appUrl);
            mainWindow.focus();
          }, 500);
        }
      }
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
  
  oauthServer.listen(8000, '127.0.0.1', () => {
    console.log('OAuth server listening on http://localhost:8000');
  });
  
  oauthServer.on('error', (err) => {
    console.error('OAuth server error:', err);
    // 如果端口被佔用，嘗試其他端口
    if (err.code === 'EADDRINUSE') {
      console.log('Port 8000 is in use, OAuth redirect may not work properly');
    }
  });
}

// 防止系統休眠和節能限制
app.whenReady().then(() => {
  // 阻止系統進入省電模式
  powerSaveBlockerId = powerSaveBlocker.start('prevent-app-suspension');
  console.log('Power save blocker started:', powerSaveBlocker.isStarted(powerSaveBlockerId));
  
  // 在生產環境中啟動 OAuth 伺服器
  createOAuthServer();
  
  // 設定媒體權限處理
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    console.log('Permission requested:', permission, details);
    // 自動允許麥克風、攝影機和媒體權限
    const allowedPermissions = ['microphone', 'camera', 'media', 'audioCapture', 'videoCapture', 'geolocation', 'notifications'];
    if (allowedPermissions.includes(permission)) {
      console.log(`Granting permission for: ${permission}`);
      callback(true);
    } else {
      console.log(`Denying permission for: ${permission}`);
      callback(false);
    }
  });
  
  // 設定媒體設備權限檢查
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    console.log('Permission check:', permission, requestingOrigin, details);
    const allowedPermissions = ['microphone', 'camera', 'media', 'audioCapture', 'videoCapture', 'geolocation', 'notifications'];
    const granted = allowedPermissions.includes(permission);
    console.log(`Permission check result for ${permission}: ${granted}`);
    return granted;
  });
  
  // 設定媒體設備處理器
  session.defaultSession.setDevicePermissionHandler((details) => {
    console.log('Device permission requested:', details);
    if (details.deviceType === 'microphone' || details.deviceType === 'camera') {
      console.log(`Granting device permission for: ${details.deviceType}`);
      return true;
    }
    return true; // 允許所有設備訪問
  });
});

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      backgroundThrottling: false, // 防止背景節流
      webSecurity: isDev ? false : true, // 開發環境允許跨域，生產環境保持安全
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      // 明確啟用媒體功能
      enableBlinkFeatures: 'MediaDevices,GetUserMedia',
      // 添加媒體相關權限
      permissions: ['microphone', 'camera', 'media', 'audioCapture', 'videoCapture'],
    },
    show: false, // 先不顯示，等載入完成再顯示
  });

  // 防止視窗在背景時被限制
  mainWindow.webContents.setBackgroundThrottling(false);

  // 處理媒體權限請求
  mainWindow.webContents.on('media-started-playing', () => {
    console.log('Media started playing');
  });

  mainWindow.webContents.on('media-paused', () => {
    console.log('Media paused');
  });

  // 處理權限請求事件
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback, details) => {
    console.log('WebContents permission request:', permission, details);
    const allowedPermissions = ['microphone', 'camera', 'media', 'audioCapture', 'videoCapture'];
    callback(allowedPermissions.includes(permission));
  });

  // 處理應用程式啟動時的媒體權限初始化
  mainWindow.webContents.once('dom-ready', () => {
    console.log('DOM is ready, injecting permission initialization script');
    
    // 注入一段 JavaScript 來初始化媒體設備權限
    mainWindow.webContents.executeJavaScript(`
      (async () => {
        console.log('Electron: Checking media devices availability...');
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // 檢查設備列表
            const devices = await navigator.mediaDevices.enumerateDevices();
            console.log('Electron: Available devices:', devices.length);
            
            const audioDevices = devices.filter(device => device.kind === 'audioinput');
            console.log('Electron: Audio input devices:', audioDevices.length);
            
            if (audioDevices.length > 0) {
              console.log('Electron: Audio devices found, media access should work');
            } else {
              console.warn('Electron: No audio input devices found');
            }
          } else {
            console.error('Electron: getUserMedia not supported');
          }
        } catch (error) {
          console.error('Electron: Error checking media devices:', error);
        }
      })();
    `).catch(err => {
      console.error('Error executing initialization script:', err);
    });
  });

  // 視窗載入完成後顯示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    // 開發模式載入 Vite dev server
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:8000';
    mainWindow.loadURL(devServerUrl);
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
  // 關閉 OAuth 伺服器
  if (oauthServer) {
    oauthServer.close();
    oauthServer = null;
  }
  
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
  // 關閉 OAuth 伺服器
  if (oauthServer) {
    oauthServer.close();
    oauthServer = null;
  }
  
  if (powerSaveBlockerId !== null) {
    powerSaveBlocker.stop(powerSaveBlockerId);
  }
});
