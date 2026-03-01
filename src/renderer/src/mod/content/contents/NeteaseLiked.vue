<script setup lang="ts">
import { ref, onMounted } from 'vue';
import OverWatchLoading from '@renderer/components/OverWatchLoading.vue';
import MusicList from '@renderer/components/MusicList.vue';
import {
    user_account, user_likelist, song_detail
} from '@renderer/mod/musicPlayers/emoMusicPlayer/emoApi';
import { paresEmoMusicDataToString } from '@renderer/mod/musicPlayers/emoMusicPlayer/emoMusic';
import type { Music } from '@renderer/mod/playing/playing';

const loading = ref(true);
const error = ref('');
const musicList = ref<Music[]>([]);

onMounted(async () => {
    const timeout = setTimeout(() => {
        if (loading.value) {
            loading.value = false;
            error.value = '加载喜欢的音乐超时';
            console.error('Timeout loading NeteaseLiked');
        }
    }, 5000);

    try {
        // 1. Get current netease user
        const accRes = await user_account();
        if (accRes.body.code !== 200) {
            error.value = '请先在设置里绑定网易云账号';
            loading.value = false;
            return;
        }
        const uid: number = accRes.body.account?.id;
        if (!uid) {
            error.value = '未获取到网易云用户 ID，请重新登录';
            loading.value = false;
            return;
        }

        // 2. Get liked song id list
        const likeRes = await user_likelist({ uid });
        if (likeRes.body.code !== 200) {
            error.value = '获取喜欢的歌曲失败，请确认已登录网易云';
            loading.value = false;
            return;
        }
        const ids: number[] = likeRes.body.ids ?? [];
        if (ids.length === 0) {
            loading.value = false;
            return;
        }

        // 3. Batch fetch song details (max 1000 per request)
        const detailRes = await song_detail({ ids: ids.slice(0, 500).join(',') });
        if (detailRes.body.code !== 200) {
            error.value = '获取歌曲详情失败';
            loading.value = false;
            return;
        }

        musicList.value = (detailRes.body.songs ?? []).map((song: any) => ({
            iconUrl: song.al?.picUrl,
            musicName: song.name,
            musicAuthor: song.ar?.map((a: any) => a.name).join('/'),
            playerName: 'EmoMusic',
            playerData: paresEmoMusicDataToString({ id: song.id, album: song.al?.name }),
        }));
    } catch (e) {
        error.value = `请求出错：${String(e)}`;
    } finally {
        clearTimeout(timeout);
        loading.value = false;
    }
});
</script>

<template>
    <div class="nl-root">
        <OverWatchLoading :visible="loading" />
        <template v-if="!loading">
            <div class="nl-header">
                <div class="nl-icon">❤️</div>
                <h2 class="nl-title">我喜欢的音乐</h2>
                <span class="nl-count">{{ musicList.length }} 首</span>
            </div>
            <div v-if="error" class="nl-error">{{ error }}</div>
            <div v-else-if="musicList.length === 0" class="nl-empty">还没有喜欢的歌曲</div>
            <div class="nl-list-wrap" v-else>
                <MusicList :list="musicList" />
            </div>
        </template>
    </div>
</template>

<style scoped>
.nl-root {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--color-primary-bg);
}
.nl-header {
    flex-shrink: 0;
    padding: 1.2rem 1.5rem 1rem;
    border-bottom: 1px solid var(--color-primary-boder);
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
.nl-icon { font-size: 1.6rem; }
.nl-title {
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0;
    color: var(--color-primary-text);
}
.nl-count {
    font-size: 0.82rem;
    color: var(--color-primary-text2);
    background: var(--color-primary-bg2);
    border: 1px solid var(--color-primary-boder);
    border-radius: 2rem;
    padding: 0.15rem 0.6rem;
}
.nl-error, .nl-empty {
    margin: 4rem auto;
    max-width: 24rem;
    text-align: center;
    color: var(--color-primary-text2);
    font-size: 0.9rem;
    line-height: 1.6;
}
.nl-list-wrap {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
}
</style>
