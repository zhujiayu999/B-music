import { readonly, ref, watch } from "vue";
import { compareMusic, type Music } from "../mod/playing/playing";

// 播放历史列表 (最近100首)
const MAX_HISTORY_LENGTH = 100;
const historyListState = ref<Music[]>([]);

// 从本地存储加载历史记录
try {
    const saved = localStorage.getItem('bmusic-play-history');
    if (saved) {
        historyListState.value = JSON.parse(saved);
    }
} catch (e) {
    console.error("Failed to load play history from localStorage", e);
}

// 监听变化，自动保存到本地存储
watch(historyListState, (newList) => {
    localStorage.setItem('bmusic-play-history', JSON.stringify(newList));
}, { deep: true });

export const historyStorage = readonly({
    list: historyListState,
    /**
     * 添加一首歌曲到历史记录的开头
     * 如果歌曲已存在，则将其移动到开头
     */
    addRecord(music: Music) {
        // 深拷贝以避免引用问题
        const newRecord = { ...music };

        // 查找是否已经存在相同的歌曲
        const existingIndex = historyListState.value.findIndex(m => compareMusic(m, newRecord));

        if (existingIndex !== -1) {
            // 如果存在，先移除
            historyListState.value.splice(existingIndex, 1);
        }

        // 添加到列表开头
        historyListState.value.unshift(newRecord);

        // 如果超过最大长度，移除最旧的记录
        if (historyListState.value.length > MAX_HISTORY_LENGTH) {
            historyListState.value.pop();
        }
    },
    /**
     * 清空历史记录
     */
    clearHistory() {
        historyListState.value = [];
    }
});
