/** 处理播放列表 */
import { computed, readonly, Ref, ref, watch } from "vue";
import { compareMusic, Music, musicPlayer } from "../playing/playing";

const electron = window.electron;

export const playListOpen = ref(false);
export const historyOpen = ref(false);

watch(playListOpen, (val) => {
    if (val) historyOpen.value = false;
});
watch(historyOpen, (val) => {
    if (val) playListOpen.value = false;
});


// 播放模式 RepeatOne: 单曲循环 RepeatAll: 列表循环 SequentialPlay: 顺序播放 ShufflePlay: 随机播放
export type PlayMode = "RepeatOne" | "RepeatAll" | "SequentialPlay" | "ShufflePlay";
const playMode = ref<PlayMode>("RepeatAll");

// 当前播放音乐
const currentIndex = ref(-1);

// 播放列表
const list: Ref<Music[]> = ref([]);

const currentMusic = computed(() => list.value[currentIndex.value]);

//如果播放器的当前音乐不是播放列表里的当前音乐，这设置当前index为-1
watch(() => musicPlayer.currentMusic, () => {
    if (!compareMusic(musicPlayer.currentMusic, currentMusic.value)) {
        currentIndex.value = -1;
    }
});

//如果当前列表音乐变化则更新musicPlayer
let isFirstLoad = true;
watch([currentIndex, list], () => {
    if (localStorage.getItem('bmusic-remember-progress') !== 'false') {
        localStorage.setItem('bmusic-saved-playlist', JSON.stringify(list.value));
        localStorage.setItem('bmusic-saved-index', String(currentIndex.value));
    }

    if (currentMusic.value) {
        musicPlayer.setCurrentMusic(currentMusic.value);
        if (isFirstLoad) {
            isFirstLoad = false;
            // Force disable auto-play as requested by the user, overwriting any previous cached true value
            localStorage.setItem('bmusic-auto-play', 'false');

            // First load: respect autoPlay setting (which is now guaranteed false)
            if (localStorage.getItem('bmusic-auto-play') !== 'true') {
                setTimeout(() => {
                    musicPlayer.requestPause();
                }, 100);
            }
        }
    }
});

// Load saved playing list and index on startup if setting is enabled
if (localStorage.getItem('bmusic-remember-progress') !== 'false') {
    try {
        const savedListStr = localStorage.getItem('bmusic-saved-playlist');
        if (savedListStr) {
            const savedList = JSON.parse(savedListStr);
            if (Array.isArray(savedList) && savedList.length > 0) {
                list.value = savedList;
            }
        }
        const savedIndex = localStorage.getItem('bmusic-saved-index');
        if (savedIndex) {
            currentIndex.value = parseInt(savedIndex, 10);
        }
    } catch { }
}



// 如果音乐播放完毕则播放下一首
watch(() => musicPlayer.ended, (ended) => {
    // 如果是单曲循环则继续播放当前音乐
    if (ended && playMode.value === "RepeatOne") {
        musicPlayer.requestPlay();
        return;
    }
    if (ended && currentIndex.value >= 0) {
        if (playMode.value === "RepeatAll") {
            currentIndex.value = (currentIndex.value + 1) % list.value.length;
            musicPlayer.requestPlay();
        } else if (playMode.value === "SequentialPlay") {
            if (currentIndex.value < list.value.length - 1) {
                currentIndex.value++;
                musicPlayer.requestPlay();
            }
        } else if (playMode.value === "ShufflePlay") {
            currentIndex.value = Math.floor(Math.random() * list.value.length);
            musicPlayer.requestPlay();
        }
    }
});

// Setup desktop lyrics IPC listeners
if (electron && electron.ipcRenderer) {
    electron.ipcRenderer.on('desktop-lyrics-action', (_event, action: string) => {
        if (action === 'prev') {
            playList.prev();
        } else if (action === 'next') {
            playList.next();
        } else if (action === 'play-pause') {
            if (musicPlayer.playing) musicPlayer.requestPause();
            else musicPlayer.requestPlay();
        } else if (action === 'close-click') {
            // Also update the UI state if needed, handled by storage sync normally
        }
    });

    // Notify desktop lyrics window about play/pause state
    watch(() => musicPlayer.playing, (playing) => {
        electron.ipcRenderer.invoke('desktop-lyrics-playing-state-sync', playing);
    });
}

export const playList = readonly({
    open: playListOpen,
    list: list,
    currentIndex: currentIndex,
    currentMusic: currentMusic,
    playMode: playMode,
    /** 设置当前播放音乐 */
    setCurrentIndex(index: number) {
        currentIndex.value = index;
    },
    /** 设置播放列表 */
    setList(musicList: Music[]) {
        currentIndex.value = -1;
        list.value = musicList;
    },
    /** 设置播放模式 */
    setPlayMode(mode: PlayMode) {
        playMode.value = mode;
    },
    /** 从播放列表移除一首歌 */
    remove(index: number) {
        if (index < 0 || index >= list.value.length) return;

        // 如果删除的是当前正在播放的歌曲
        if (currentIndex.value === index) {
            if (list.value.length === 1) {
                musicPlayer.requestPause();
                list.value.splice(index, 1);
                currentIndex.value = -1;
                return;
            } else {
                const wasPlaying = musicPlayer.playing;
                musicPlayer.requestPause();
                list.value.splice(index, 1);
                // 如果删除的是最后一首，下一首就是开头
                if (index === list.value.length) {
                    currentIndex.value = 0;
                }
                if (wasPlaying) {
                    musicPlayer.requestPlay();
                } else {
                    // 只需重置音乐
                    musicPlayer.setCurrentMusic(list.value[currentIndex.value]);
                }
                return;
            }
        }

        // 删除当前播放之前的歌曲，需把 currentIndex 前移保持对齐
        if (index < currentIndex.value) {
            list.value.splice(index, 1);
            currentIndex.value--;
            return;
        }

        // 删除当前播放之后的歌曲
        list.value.splice(index, 1);
    },
    /**  下一曲,如果到最后一首则从第一首开始 */
    next() {
        if (currentIndex.value < list.value.length - 1) {
            currentIndex.value++;
            musicPlayer.requestPlay();
        } else {
            currentIndex.value = 0;
            musicPlayer.requestPlay();
        }
    },
    /** 上一曲,如果到最前则中最后一首开始 */
    prev() {
        if (currentIndex.value > 0) {
            currentIndex.value--;
            musicPlayer.requestPlay();
        } else {
            currentIndex.value = list.value.length - 1;
            musicPlayer.requestPlay();
        }
    },
    /** 将单曲添加到播放列表并播放 */
    addAndPlay(music: Music) {
        const index = list.value.findIndex(m => compareMusic(m, music));
        if (index >= 0) {
            currentIndex.value = index;
        } else {
            list.value.push(music);
            currentIndex.value = list.value.length - 1;
        }
        musicPlayer.requestPlay();
    },
    /** 下一首播放：将歌曲插入到当前播放之后 */
    addNext(music: Music) {
        // 如果已在列表中，先移除
        const existIdx = list.value.findIndex(m => compareMusic(m, music));
        if (existIdx >= 0) {
            // 已经是下一首了，不需要操作
            if (existIdx === currentIndex.value + 1) return;
            list.value.splice(existIdx, 1);
            if (existIdx < currentIndex.value) {
                currentIndex.value--;
            }
        }
        // 插入到当前播放的下一个位置
        if (currentIndex.value >= 0 && currentIndex.value < list.value.length) {
            list.value.splice(currentIndex.value + 1, 0, music);
        } else {
            // 没有正在播放，直接添加并播放
            list.value.push(music);
            currentIndex.value = list.value.length - 1;
            musicPlayer.requestPlay();
        }
    }
});