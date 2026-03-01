<script setup lang="ts">
import { ref } from 'vue';
import { cloudsearch } from './emoApi'
import { Music } from '@renderer/mod/playing/playing';
import { paresEmoMusicDataToString } from './emoMusic';
import MusicList from '@renderer/components/MusicList.vue';

const props = defineProps<{
    keyword: string
}>();

const limit = 40;
const offset = ref(0);
const searchResult = ref<Music[]>([]);
const loading = ref(false);
const hasMore = ref(true);

function loadData() {
    if (loading.value) return;
    loading.value = true;
    cloudsearch({ keywords: props.keyword, limit: limit, offset: offset.value }).then((res) => {
        let musicList: Music[] = [];
        let songs = res.body.result?.songs || [];
        for (let i = 0; i < songs.length; i++) {
            musicList.push({
                iconUrl: songs[i].al?.picUrl || '',
                musicName: songs[i].name,
                musicAuthor: songs[i].ar?.[0]?.name || '未知歌手',
                playerName: "EmoMusic",
                playerData: paresEmoMusicDataToString({id:songs[i].id,album:songs[i].al?.name || ''}),
            });
        }
        searchResult.value.push(...musicList);
        hasMore.value = songs.length === limit;
        loading.value = false;
    }).catch((err) => {
        console.error(err);
        loading.value = false;
    });
}

// 初始加载
loadData();

function loadMore() {
    if (loading.value || !hasMore.value) return;
    offset.value += limit;
    loadData();
}
</script>
<template>
    <div class="emo-search">
        <MusicList :list="searchResult"></MusicList>
        <div class="load-more-container" v-if="searchResult.length > 0">
            <button v-if="hasMore" :disabled="loading" class="load-more-btn" @click="loadMore">
                {{ loading ? '加载中...' : '加载更多' }}
            </button>
            <div v-else class="loading-more-text">没有更多结果了</div>
        </div>
    </div>
</template>
<style scoped>
.emo-search {
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

.load-more-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.load-more-btn:hover:not(:disabled) {
    background: var(--color-primary2);
}

.loading-more-text {
    color: var(--color-primary-text2);
    font-size: 0.9rem;
}
</style>