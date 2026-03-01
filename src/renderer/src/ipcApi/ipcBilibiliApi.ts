export const electron = window.electron;


export const ipcBilibiliApi = {
    /** 获取Bilibili音乐播放器的Preload js文件路径 */
    getPreloadJsFilePath_BilibiliMusicPlayer(): Promise<string> {
        return electron.ipcRenderer.invoke('ipcBilibiliApi__getPreloadJsFilePath_BilibiliMusicPlayer');
    },
    /** 获取Bilibili音乐搜索的Preload js文件路径 */
    getPreloadJsFilePath_BilibiliMusicSearch(): Promise<string> {
        return electron.ipcRenderer.invoke('ipcBilibiliApi__getPreloadJsFilePath_BilibiliMusicSearch');
    },
    /** 获取B站收藏夹列表 */
    getFavoriteList(uid: number): Promise<any> {
        return electron.ipcRenderer.invoke('ipcBilibiliApi__getFavoriteList', uid);
    },
    /** 获取收藏夹内容 */
    getFavoriteDetail(mediaId: number, pn: number): Promise<any> {
        return electron.ipcRenderer.invoke('ipcBilibiliApi__getFavoriteDetail', mediaId, pn);
    },
    /** 获取当前登录B站用户信息(mid) */
    getBilibiliUserInfo(): Promise<any> {
        return electron.ipcRenderer.invoke('ipcBilibiliApi__getUserInfo');
    },
};
