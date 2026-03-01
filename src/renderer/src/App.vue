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
import { onMounted } from 'vue';

onMounted(() => {
    const bright = localStorage.getItem('bmusic-bright') || 'light';
    const accent = localStorage.getItem('bmusic-accent') || 'orange';
    document.documentElement.setAttribute('data-theme', `${bright}-${accent}`);
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
