import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { MusicPlayListOnLoc } from '../storage/playListStorage';

export const usePlaylistStore = defineStore('playlist', () => {
    // 用于 PlayListContentsNoLoc 的临时播放列表数据
    const tempPlaylist = ref<MusicPlayListOnLoc | null>(null);

    function setTempPlaylist(list: MusicPlayListOnLoc) {
        tempPlaylist.value = list;
    }

    return {
        tempPlaylist,
        setTempPlaylist
    };
});
