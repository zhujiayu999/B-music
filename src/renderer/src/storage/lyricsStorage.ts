import { ref, readonly } from 'vue';

const electron = window.electron;

// Default to false on startup so desktop lyrics don't pop up or show active state unexpectedly
const showDesktopLyrics = ref(false);
localStorage.setItem('bmusic-desktop-lyrics', 'false');

const lyricsFontSize = ref(parseInt(localStorage.getItem('bmusic-lyrics-font-size') || '28'));
const lyricsColor = ref(localStorage.getItem('bmusic-lyrics-color') || '#FFD700');
const lyricsLock = ref(localStorage.getItem('bmusic-lyrics-lock') === 'true');
const lyricsTopmost = ref(localStorage.getItem('bmusic-lyrics-topmost') !== 'false');

function saveToggle() {
    localStorage.setItem('bmusic-desktop-lyrics', String(showDesktopLyrics.value));
    if (showDesktopLyrics.value) {
        electron.ipcRenderer.invoke('desktop-lyrics-show');
        electron.ipcRenderer.invoke('desktop-lyrics-set-topmost', lyricsTopmost.value);
        electron.ipcRenderer.invoke('desktop-lyrics-set-lock', lyricsLock.value);
    } else {
        electron.ipcRenderer.invoke('desktop-lyrics-hide');
    }
}

export const lyricsStorage = readonly({
    showDesktopLyrics,
    lyricsFontSize,
    lyricsColor,
    lyricsLock,
    lyricsTopmost
});

export function toggleDesktopLyrics() {
    showDesktopLyrics.value = !showDesktopLyrics.value;
    saveToggle();
}

export function setDesktopLyrics(show: boolean) {
    showDesktopLyrics.value = show;
    saveToggle();
}

export function updateLyricsStyle(fontSize: number, color: string) {
    lyricsFontSize.value = fontSize;
    lyricsColor.value = color;
    localStorage.setItem('bmusic-lyrics-font-size', String(fontSize));
    localStorage.setItem('bmusic-lyrics-color', color);
    electron.ipcRenderer.invoke('desktop-lyrics-update-style', {
        fontSize,
        color
    });
}

export function updateLyricsLock(lock: boolean) {
    lyricsLock.value = lock;
    localStorage.setItem('bmusic-lyrics-lock', String(lock));
    electron.ipcRenderer.invoke('desktop-lyrics-set-lock', lock);
}

export function updateLyricsTopmost(topmost: boolean) {
    lyricsTopmost.value = topmost;
    localStorage.setItem('bmusic-lyrics-topmost', String(topmost));
    electron.ipcRenderer.invoke('desktop-lyrics-set-topmost', topmost);
}

// Make sure lyrics sync correctly on init
export async function initLyricsSync() {
    const isOpen = await electron.ipcRenderer.invoke('desktop-lyrics-is-open');
    if (showDesktopLyrics.value && !isOpen) {
        // Option 1: auto open on startup if setting is true
        // electron.ipcRenderer.invoke('desktop-lyrics-show');
    }
    electron.ipcRenderer.on('desktop-lyrics-set-lock', (_event, locked: boolean) => {
        lyricsLock.value = locked;
        localStorage.setItem('bmusic-lyrics-lock', String(locked));
    });
}
