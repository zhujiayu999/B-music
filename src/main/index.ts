import { app, shell, BrowserWindow, type BrowserWindowConstructorOptions, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is, platform, type Platform } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import './ipcAPI'
import { session } from 'electron'
import { initDB, updateActiveAccountCookies } from './db/sqlite'

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // Try to prevent app hanging lock by quitting right away
  console.log("BMusic is already running in the background. Bringing existing instance to front.");
  app.quit()
} else {
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    // There could be multiple windows, here we just focus the main one
    const windows = BrowserWindow.getAllWindows();
    if (windows.length) {
      const mainWindow = windows[0];
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function getSystemConfig(platform: Platform): BrowserWindowConstructorOptions {
  if (platform.isWindows) {
    return {
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#ffffff00',
        height: 48
      },
    };
  }
  if (platform.isMacOS) {
    return {};
  }
  if (platform.isLinux) {
    return {};
  }
  return {};
}

// Disable cache to prevent 0x5 'Unable to move the cache' lock conflict on hot restarts
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1060,
    height: 680,
    minHeight: 680,
    minWidth: 1060,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    ...getSystemConfig(platform),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true,
      contextIsolation: false,
      webSecurity: false,
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // ---- Close-to-tray behavior ----
  mainWindow.on('close', (e) => {
    const closeAction = global.__bmusicSettings?.closeAction || 'minimize';
    if (closeAction === 'minimize' && !global.__bmusicForceQuit) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // ---- System Tray ----
  const trayIcon = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 });
  const tray = new Tray(trayIcon);
  tray.setToolTip('BMusic');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { type: 'separator' },
    { label: '退出', click: () => { global.__bmusicForceQuit = true; app.quit(); } },
  ]));
  tray.on('double-click', () => { mainWindow.show(); mainWindow.focus(); });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initDB();

  // Track Cookie Changes and update SQLite Database
  let cookieSaveTimeout: NodeJS.Timeout | null = null;
  session.defaultSession.cookies.on('changed', () => {
    if (cookieSaveTimeout) clearTimeout(cookieSaveTimeout);
    cookieSaveTimeout = setTimeout(async () => {
      try {
        const cookies = await session.defaultSession.cookies.get({});
        const cookieJson = JSON.stringify(cookies);
        updateActiveAccountCookies(cookieJson);
      } catch (e) {
        console.error('Failed to sync cookies to DB:', e);
      }
    }, 1000); // 1-second debounce
  });

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.


