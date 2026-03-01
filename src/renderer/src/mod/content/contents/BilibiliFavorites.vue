<script setup lang="ts">
import { ref, onMounted } from 'vue';
import OverWatchLoading from '@renderer/components/OverWatchLoading.vue';
import MusicList from '@renderer/components/MusicList.vue';
import { ipcBilibiliApi } from '@renderer/ipcApi/ipcBilibiliApi';
import { paresBilibiliMusicDataToString } from '@renderer/mod/musicPlayers/bilibiliMusicPlayer/bilibiliMusic';
import type { Music } from '@renderer/mod/playing/playing';

// ------- Types -------
interface FavFolder { id: number; title: string; media_count: number; cover: string }

// ------- State -------
const loading = ref(true);
const error = ref('');
const folders = ref<FavFolder[]>([]);
const selectedFolder = ref<FavFolder | null>(null);
const musicList = ref<Music[]>([]);
const page = ref(1);
const hasMore = ref(false);
const uid = ref<number>(0);

// ------- Init -------
onMounted(async () => {
    const timeout = setTimeout(() => {
        if (loading.value) {
            loading.value = false;
            error.value = '请求超时，请重试';
            console.error('Timeout loading Bilibili favorites');
        }
    }, 5000);

    try {
        const infoRes = await ipcBilibiliApi.getBilibiliUserInfo();
        if (infoRes.code !== 0) {
            error.value = '请先在B站登录账号（在播放器里访问bilibili.com完成登录）';
            loading.value = false;
            return;
        }
        uid.value = infoRes.data.mid;
        const res = await ipcBilibiliApi.getFavoriteList(uid.value);
        if (res.code === 0 && res.data?.list) {
            folders.value = res.data.list;
            if (folders.value.length > 0) {
                await selectFolder(folders.value[0]);
                return;
            }
        } else {
            error.value = '获取收藏夹失败，请确认已登录B站';
        }
    } catch (e) {
        error.value = `请求出错：${String(e)}`;
    } finally {
        clearTimeout(timeout);
        loading.value = false;
    }
});

async function selectFolder(folder: FavFolder) {
    selectedFolder.value = folder;
    page.value = 1;
    musicList.value = [];
    loading.value = true;
    await loadPage();
}

async function loadPage() {
    try {
        const res = await ipcBilibiliApi.getFavoriteDetail(selectedFolder.value!.id, page.value);
        if (res.code === 0 && res.data) {
            const items = res.data.medias ?? [];
            const mapped: Music[] = items.map((v: any) => {
                let coverUrl = v.cover || '';
                if (coverUrl.startsWith('//')) {
                    coverUrl = 'https:' + coverUrl;
                }
                return {
                    iconUrl: coverUrl,
                    musicName: v.title,
                    musicAuthor: v.upper?.name,
                    playerName: 'Bilibili',
                    playerData: paresBilibiliMusicDataToString({ bvId: v.bvid }),
                };
            });
            musicList.value.push(...mapped);
            hasMore.value = res.data.has_more;
        }
    } catch (e) {
        error.value = String(e);
    }
    loading.value = false;
}

async function loadMore() {
    if (!hasMore.value) return;
    page.value++;
    loading.value = true;
    await loadPage();
}
</script>

<template>
    <div class="bf-root">
        <OverWatchLoading :visible="loading && musicList.length === 0" />

        <div v-if="error" class="bf-error">{{ error }}</div>

        <template v-else-if="!loading || musicList.length > 0">
            <!-- Folder tabs -->
            <div class="bf-header">
                <h2 class="bf-title">B站收藏夹</h2>
                <div class="bf-tabs">
                    <button
                        v-for="f in folders"
                        :key="f.id"
                        class="bf-tab"
                        :class="{ active: selectedFolder?.id === f.id }"
                        @click="selectFolder(f)"
                    >
                        {{ f.title }}
                        <span class="bf-count">{{ f.media_count }}</span>
                    </button>
                </div>
            </div>

            <!-- Music list -->
            <div class="bf-list-wrap">
                <MusicList v-if="musicList.length" :list="musicList" />
                <div v-else-if="!loading" class="bf-empty">收藏夹为空</div>
            </div>

            <!-- Load more -->
            <div v-if="hasMore" class="bf-load-more">
                <button class="bf-more-btn" :disabled="loading" @click="loadMore">
                    {{ loading ? '加载中…' : '加载更多' }}
                </button>
            </div>
        </template>
    </div>
</template>

<style scoped>
.bf-root {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--color-primary-bg);
}
.bf-error {
    margin: 4rem auto;
    max-width: 24rem;
    text-align: center;
    color: var(--color-primary-text2);
    font-size: 0.9rem;
    line-height: 1.6;
}
.bf-header {
    flex-shrink: 0;
    padding: 1.2rem 1.5rem 0;
    border-bottom: 1px solid var(--color-primary-boder);
}
.bf-title {
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0 0 0.75rem;
    color: var(--color-primary-text);
}
.bf-tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding-bottom: 0.75rem;
}
.bf-tab {
    border: 1px solid var(--color-primary-boder);
    background: var(--color-primary-bg2);
    color: var(--color-primary-text2);
    border-radius: 2rem;
    padding: 0.25rem 0.75rem;
    font-size: 0.82rem;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 0.3rem;
}
.bf-tab.active {
    background: var(--color-primary);
    color: var(--color-primary-with);
    border-color: var(--color-primary);
}
.bf-tab:hover:not(.active) {
    border-color: var(--color-primary);
    color: var(--color-primary);
}
.bf-count {
    font-size: 0.72rem;
    opacity: 0.7;
}
.bf-list-wrap {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
}
.bf-empty {
    text-align: center;
    margin-top: 3rem;
    color: var(--color-primary-text2);
}
.bf-load-more {
    text-align: center;
    padding: 0.75rem;
    border-top: 1px solid var(--color-primary-boder);
}
.bf-more-btn {
    background: var(--color-primary);
    color: var(--color-primary-with);
    border: none;
    border-radius: 2rem;
    padding: 0.4rem 1.5rem;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.15s;
}
.bf-more-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.bf-more-btn:hover:not(:disabled) { background: var(--color-primary2); }
</style>
