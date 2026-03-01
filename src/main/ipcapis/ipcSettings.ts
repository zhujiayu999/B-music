import { ipcMain, app, BrowserWindow, globalShortcut, session, shell } from 'electron';

// ============ SYSTEM SETTINGS ============

// Get/Set close action
ipcMain.handle('settings__getCloseAction', () => {
    return global.__bmusicSettings?.closeAction || 'minimize';
});

ipcMain.handle('settings__setCloseAction', (_event, action: string) => {
    if (!global.__bmusicSettings) global.__bmusicSettings = {};
    global.__bmusicSettings.closeAction = action;
});

// Auto startup
ipcMain.handle('settings__getAutoStartup', () => {
    return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('settings__setAutoStartup', (_event, enabled: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enabled });
});

// Hardware acceleration (requires restart)
ipcMain.handle('settings__setHardwareAcceleration', (_event, enabled: boolean) => {
    if (!global.__bmusicSettings) global.__bmusicSettings = {};
    global.__bmusicSettings.hardwareAcceleration = enabled;
    // This requires app restart to take effect
    return 'restart_required';
});

// Cache management
ipcMain.handle('settings__getCacheSize', async () => {
    try {
        const size = await session.defaultSession.getCacheSize();
        return size; // bytes
    } catch {
        return 0;
    }
});

ipcMain.handle('settings__clearCache', async () => {
    try {
        await session.defaultSession.clearCache();
        await session.defaultSession.clearStorageData({
            storages: ['cachestorage'],
        });
        return true;
    } catch {
        return false;
    }
});

// Download / Data directory
ipcMain.handle('settings__getDataPath', () => {
    return app.getPath('userData');
});

ipcMain.handle('settings__openDataPath', () => {
    shell.openPath(app.getPath('userData'));
});

// ============ APP INFO ============
ipcMain.handle('settings__getAppVersion', () => {
    return app.getVersion() || '1.0.0';
});

ipcMain.handle('settings__getElectronVersion', () => {
    return process.versions.electron;
});

// ============ GLOBAL SHORTCUTS ============

// Store currently registered shortcuts
const registeredShortcuts: Map<string, string> = new Map();

ipcMain.handle('settings__registerShortcuts', (_event, shortcuts: { id: string; keys: string }[]) => {
    // Unregister all existing
    globalShortcut.unregisterAll();
    registeredShortcuts.clear();

    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return false;

    for (const sc of shortcuts) {
        try {
            // Convert display keys to Electron accelerator format
            const accelerator = sc.keys.replace(/\s/g, '');
            const success = globalShortcut.register(accelerator, () => {
                mainWindow.webContents.send('settings__shortcutTriggered', sc.id);
            });
            if (success) {
                registeredShortcuts.set(sc.id, accelerator);
            }
        } catch (e) {
            console.warn(`Failed to register shortcut ${sc.keys}:`, e);
        }
    }
    return true;
});

ipcMain.handle('settings__unregisterAllShortcuts', () => {
    globalShortcut.unregisterAll();
    registeredShortcuts.clear();
});

// ============ WINDOW CONTROL ============

// Minimize to tray or quit — called from renderer's close handler
ipcMain.handle('settings__windowClose', () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    const closeAction = global.__bmusicSettings?.closeAction || 'minimize';
    if (closeAction === 'minimize') {
        mainWindow.hide();
    } else {
        app.quit();
    }
});

// Show window (from tray click)
ipcMain.handle('settings__windowShow', () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
    }
});

// Restart app
ipcMain.handle('settings__restartApp', () => {
    app.relaunch();
    app.exit(0);
});

// ============ DECLARE GLOBAL ============
declare global {
    // eslint-disable-next-line no-var
    var __bmusicSettings: {
        closeAction?: string;
        hardwareAcceleration?: boolean;
    } | undefined;
    // eslint-disable-next-line no-var
    var __bmusicForceQuit: boolean | undefined;
}
