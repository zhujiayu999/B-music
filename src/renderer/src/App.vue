<script setup lang="ts">
import Nav from './mod/nav/Nav.vue';
import Content from './mod/content/Content.vue';
import { musicPlayer, musicPlayerSize } from './mod/playing/playing';
import PlayingList from './mod/playingList/PlayingList.vue';
import HistoryList from './mod/playingList/HistoryList.vue';
import Notification from './mod/notification/Notification.vue';
import Playing from './mod/playing/Playing.vue';
import TopBar from './mod/topBar/TopBar.vue';
import PopUp from './mod/popUp/PopUp.vue';
import { onMounted, watch } from 'vue';
import { playList } from './mod/playingList/playingList';
import { toggleDesktopLyrics } from './storage/lyricsStorage';

const electron = window.electron;

// ============ SYSTEM MEDIA CONTROLS (SMTC) ============
// Update MediaSession metadata when current music changes
watch(() => musicPlayer.currentMusic, (music) => {
    if (!('mediaSession' in navigator) || !music) return;
    navigator.mediaSession.metadata = new MediaMetadata({
        title: music.musicName || 'BMusic',
        artist: music.musicAuthor || '',
        artwork: music.iconUrl ? [{ src: music.iconUrl, sizes: '512x512', type: 'image/jpeg' }] : []
    });
}, { immediate: true });

// Sync playback state
watch(() => musicPlayer.playing, (playing) => {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    }
});

// Register action handlers
if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => musicPlayer.requestPlay());
    navigator.mediaSession.setActionHandler('pause', () => musicPlayer.requestPause());
    navigator.mediaSession.setActionHandler('previoustrack', () => playList.prev());
    navigator.mediaSession.setActionHandler('nexttrack', () => playList.next());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime != null) {
            musicPlayer.requestCurrentTime(details.seekTime * 1000);
        }
    });
}

onMounted(() => {
    // Apply saved theme
    const bright = localStorage.getItem('bmusic-bright') || 'light';
    const accent = localStorage.getItem('bmusic-accent') || 'orange';
    document.documentElement.setAttribute('data-theme', `${bright}-${accent}`);

    // Auto-register saved shortcuts on app startup
    if (electron?.ipcRenderer) {
        try {
            const saved = localStorage.getItem('bmusic-shortcuts');
            if (saved) {
                const shortcuts = JSON.parse(saved) as { id: string; keys: string }[];
                const mapped = shortcuts.filter(s => s.keys).map(s => ({ id: s.id, keys: s.keys }));
                if (mapped.length > 0) {
                    electron.ipcRenderer.invoke('settings__registerShortcuts', mapped);
                }
            }
        } catch (e) {
            console.warn('[Shortcuts] Failed to auto-register:', e);
        }

        // Listen for shortcut triggers from main process
        electron.ipcRenderer.on('settings__shortcutTriggered', (_event: any, id: string) => {
            switch (id) {
                case 'play-pause':
                    if (musicPlayer.playing) musicPlayer.requestPause();
                    else musicPlayer.requestPlay();
                    break;
                case 'prev':
                    playList.prev();
                    break;
                case 'next':
                    playList.next();
                    break;
                case 'vol-up':
                    musicPlayer.requestVolume(Math.min(1, musicPlayer.volume + 0.1));
                    break;
                case 'vol-down':
                    musicPlayer.requestVolume(Math.max(0, musicPlayer.volume - 0.1));
                    break;
                case 'lyrics-toggle':
                    toggleDesktopLyrics();
                    break;
            }
        });
    }
});

</script>

<template>
  <div class="main">
    <!-- 音乐页面 -->
    <div class="main-box">
      <Nav class="nav"></Nav>
      <Content class="content"></Content>
      <TopBar v-if="musicPlayerSize == 'buttom'" />
    </div>
    <!-- 下方播放器主体 -->
    <Playing v-if="musicPlayer.currentMusic" class="main-music-player" />
    <!-- 右侧播放列表 -->
    <PlayingList />
    <!-- 右侧播放历史 -->
    <HistoryList />

    <!-- 弹出组件 -->
    <PopUp />

    <!-- 消息弹出框 -->
    <Notification />

  </div>
</template>

<style scoped>
.content {
  flex: 1;
  width: 0;
}

.nav,
.content {
  display: flex;
  flex-direction: column;
}

.main {
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--color-window-bg);
}

.main-box {
  display: flex;
  flex-direction: row;
  height: 100vh;
  align-items: stretch;
}

.main:has(.main-music-player) .main-box {
  height: calc(100vh - var(--button-player-height));
}
</style>
