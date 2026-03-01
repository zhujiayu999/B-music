import { ipcMain, BrowserWindow, screen } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';

let lyricsWindow: BrowserWindow | null = null;

function createLyricsWindow(): BrowserWindow {
    const display = screen.getPrimaryDisplay();
    const { width } = display.workAreaSize;

    const win = new BrowserWindow({
        width: 800,
        height: 120,
        minWidth: 400,
        minHeight: 120,
        x: Math.floor((width - 800) / 2),
        y: display.workAreaSize.height - 150,
        transparent: true,
        frame: false,
        resizable: true,
        skipTaskbar: true,
        alwaysOnTop: true,
        hasShadow: false,
        focusable: true,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
        },
    });

    // Load the desktop lyrics HTML
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        // In dev, load from file directly since it's a static HTML
        win.loadFile(join(__dirname, '../../src/main/desktopLyrics.html'));
    } else {
        win.loadFile(join(__dirname, '../main/desktopLyrics.html'));
    }

    win.setIgnoreMouseEvents(false);
    win.on('closed', () => { lyricsWindow = null; });

    return win;
}

// Show desktop lyrics
ipcMain.handle('desktop-lyrics-show', () => {
    if (!lyricsWindow || lyricsWindow.isDestroyed()) {
        lyricsWindow = createLyricsWindow();
    } else {
        lyricsWindow.show();
    }

    // Apply saved style
    const fontSize = global.__lyricsSettings?.fontSize || 28;
    const color = global.__lyricsSettings?.color || '#FFD700';
    lyricsWindow.webContents.once('did-finish-load', () => {
        lyricsWindow?.webContents.send('desktop-lyrics-style', { fontSize, color });
    });
    // If already loaded, also send immediately
    if (!lyricsWindow.webContents.isLoading()) {
        lyricsWindow.webContents.send('desktop-lyrics-style', { fontSize, color });
    }
    return true;
});

// Hide desktop lyrics
ipcMain.handle('desktop-lyrics-hide', () => {
    if (lyricsWindow && !lyricsWindow.isDestroyed()) {
        lyricsWindow.close();
        lyricsWindow = null;
    }
    return true;
});

// Update lyrics text
ipcMain.handle('desktop-lyrics-update-text', (_event, text: string) => {
    if (lyricsWindow && !lyricsWindow.isDestroyed()) {
        lyricsWindow.webContents.send('desktop-lyrics-update', text);
    }
});

// Update lyrics style (fontSize, color)
ipcMain.handle('desktop-lyrics-update-style', (_event, opts: { fontSize?: number; color?: string }) => {
    if (!global.__lyricsSettings) global.__lyricsSettings = {};
    if (opts.fontSize) global.__lyricsSettings.fontSize = opts.fontSize;
    if (opts.color) global.__lyricsSettings.color = opts.color;

    if (lyricsWindow && !lyricsWindow.isDestroyed()) {
        lyricsWindow.webContents.send('desktop-lyrics-style', opts);
    }
});

// Set lock state
ipcMain.handle('desktop-lyrics-set-lock', (_event, locked: boolean) => {
    if (lyricsWindow && !lyricsWindow.isDestroyed()) {
        lyricsWindow.setIgnoreMouseEvents(locked, { forward: true });
        lyricsWindow.webContents.send('desktop-lyrics-set-lock', locked);
    }
});

// Set always-on-top
ipcMain.handle('desktop-lyrics-set-topmost', (_event, topmost: boolean) => {
    if (lyricsWindow && !lyricsWindow.isDestroyed()) {
        lyricsWindow.setAlwaysOnTop(topmost);
    }
});

// Listen for lock toggle from the lyrics window itself
ipcMain.on('desktop-lyrics-lock', (_event, locked: boolean) => {
    if (lyricsWindow && !lyricsWindow.isDestroyed()) {
        lyricsWindow.setIgnoreMouseEvents(locked, { forward: true });
    }
});

// Check if lyrics window is open
ipcMain.handle('desktop-lyrics-is-open', () => {
    return lyricsWindow !== null && !lyricsWindow.isDestroyed();
});

// Relay actions from lyrics window to the main app renderer
ipcMain.on('desktop-lyrics-action', (_event, action: string) => {
    BrowserWindow.getAllWindows().forEach(win => {
        if (win !== lyricsWindow && !win.isDestroyed()) {
            win.webContents.send('desktop-lyrics-action', action);
        }
    });
});

// Relay playing state from main app renderer to lyrics window
ipcMain.handle('desktop-lyrics-playing-state-sync', (_event, isPlaying: boolean) => {
    if (lyricsWindow && !lyricsWindow.isDestroyed()) {
        lyricsWindow.webContents.send('desktop-lyrics-playing', isPlaying);
    }
});

// Get current window bounds for custom resize handles
ipcMain.handle('desktop-lyrics-get-bounds', () => {
    if (lyricsWindow && !lyricsWindow.isDestroyed()) {
        return lyricsWindow.getBounds();
    }
    return { x: 0, y: 0, width: 800, height: 120 };
});

// Set window bounds for custom resize handles
ipcMain.handle('desktop-lyrics-set-bounds', (_event, bounds: { x: number; y: number; width: number; height: number }) => {
    if (lyricsWindow && !lyricsWindow.isDestroyed()) {
        lyricsWindow.setBounds(bounds);
    }
});

// Global lyrics settings storage
declare global {
    // eslint-disable-next-line no-var
    var __lyricsSettings: {
        fontSize?: number;
        color?: string;
    } | undefined;
}
