<script setup lang="ts">
import MusicList from '@renderer/components/MusicList.vue';
import { ipcBilibiliApi } from "@renderer/ipcApi/ipcBilibiliApi";
import { type Music } from '@renderer/mod/playing/playing';
import OverWatchLoading from '@renderer/components/OverWatchLoading.vue';
import { type WebviewTag } from 'electron';
import { computed, ref, watch } from 'vue';
import { paresBilibiliMusicDataToString } from './bilibiliMusic';

const props = defineProps<{
    keyword: string
}>();

const page = ref(1);
const bilibilisearchUrl = computed(() => `https://search.bilibili.com/video?keyword=${encodeURI(props.keyword)}&page=${page.value}`);
const result = ref<{ bv: string, imgUrl?: string, name?: string, author?: string }[]>([]);
const musicList = computed<Music[]>(()=>result.value.map((item) => ({
    iconUrl: item.imgUrl,
    musicName: item.name,
    musicAuthor: item.author,
    playerName: "Bilibili",
    playerData: paresBilibiliMusicDataToString({bvId: item.bv}),
})));

const searchWebview = ref<WebviewTag | null>();
const webviewLoaded = ref(false);
const isFirstLoad = ref(true);

function onMessage(msg: string, ...args: any[]) {
    if (msg == "searchResult") {
        result.value.push(...args[0]);
        webviewLoaded.value = true;
        isFirstLoad.value = false;
    }
}

watch(searchWebview, () => {
    searchWebview.value?.addEventListener("dom-ready", () => {
        searchWebview.value?.addEventListener("ipc-message", (event) => {
            onMessage(event.channel, ...event.args);
        });
    });
});

//获取preload文件路径
const bilibiliMusicPlayer__filePath = ref<string>();
ipcBilibiliApi.getPreloadJsFilePath_BilibiliMusicSearch().then((res: string) => {
    bilibiliMusicPlayer__filePath.value = res;
});

function loadMore() {
    if (!webviewLoaded.value) return;
    webviewLoaded.value = false;
    page.value++;
}

</script>
<template>
    <div class="bilibili-search">
        <!-- 首次加载时的全屏遮罩 -->
        <OverWatchLoading v-if="isFirstLoad" :visible="true" />

        <!-- 展示的列表 -->
        <div class="ilibili-search-result" v-show="!isFirstLoad">
            <MusicList :list="musicList"></MusicList>
            <div class="load-more-container">
                <button v-if="webviewLoaded" class="load-more-btn" @click="loadMore">加载更多</button>
                <div v-else class="loading-more-text">加载中...</div>
            </div>
        </div>

        <!-- 用于获取信息的webview，隐藏在后台 -->
        <div class="ilibili-search-webview-box">
            <webview class="ilibili-search-webview" ref="searchWebview" :src="bilibilisearchUrl" allowpopups
                nodeintegration v-if="bilibiliMusicPlayer__filePath" :preload="bilibiliMusicPlayer__filePath"
            ></webview>
        </div>
    </div>
</template>
<style scoped>
.ilibili-search-webview {
    width: 100%;
    height: 100%;
}

.ilibili-search-webview-box {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: -10;
    opacity: 0;
    pointer-events: none;
}

.bilibili-search {
    position: relative;
    min-height: 100%;
    padding-bottom: 2rem;
}

.load-more-container {
    text-align: center;
    padding: 1.5rem 0;
    margin-top: 1rem;
}

.load-more-btn {
    background: var(--color-primary);
    color: var(--color-primary-with);
    border: none;
    border-radius: 2rem;
    padding: 0.5rem 2rem;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.15s;
}

.load-more-btn:hover {
    background: var(--color-primary2);
}

.loading-more-text {
    color: var(--color-primary-text2);
    font-size: 0.9rem;
}
</style>