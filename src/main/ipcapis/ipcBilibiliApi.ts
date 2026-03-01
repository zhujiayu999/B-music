import { ipcMain, net, session } from "electron";
import { join } from "path";

// ipcBilibiliApi bilibili 音乐播放器的API
ipcMain.handle('ipcBilibiliApi__getPreloadJsFilePath_BilibiliMusicPlayer', () => join(__dirname, "../preload/BilibiliMusicPlayer.js"));
ipcMain.handle('ipcBilibiliApi__getPreloadJsFilePath_BilibiliMusicSearch', () => join(__dirname, "../preload/BilibiliMusicSearch.js"));

// 获取当前B站登录用户信息
ipcMain.handle('ipcBilibiliApi__getUserInfo', async () => {
    try {
        const cookies = await session.defaultSession.cookies.get({ domain: '.bilibili.com' });
        const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        const resp = await net.fetch('https://api.bilibili.com/x/web-interface/nav', {
            headers: { 'Cookie': cookieStr, 'Referer': 'https://www.bilibili.com/', 'User-Agent': 'Mozilla/5.0' }
        });
        return await resp.json();
    } catch (e) {
        return { code: -1, message: String(e) };
    }
});

// 获取B站收藏夹列表
ipcMain.handle('ipcBilibiliApi__getFavoriteList', async (_event, uid: number) => {
    try {
        const cookies = await session.defaultSession.cookies.get({ domain: '.bilibili.com' });
        const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        const resp = await net.fetch(`https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${uid}&jsonp=jsonp`, {
            headers: { 'Cookie': cookieStr, 'Referer': 'https://www.bilibili.com/', 'User-Agent': 'Mozilla/5.0' }
        });
        return await resp.json();
    } catch (e) {
        return { code: -1, message: String(e) };
    }
});

// 获取收藏夹详情（视频列表）
ipcMain.handle('ipcBilibiliApi__getFavoriteDetail', async (_event, mediaId: number, pn: number) => {
    try {
        const cookies = await session.defaultSession.cookies.get({ domain: '.bilibili.com' });
        const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        const resp = await net.fetch(
            `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${mediaId}&pn=${pn}&ps=20&order=mtime&type=0&tid=0&platform=web`,
            { headers: { 'Cookie': cookieStr, 'Referer': 'https://www.bilibili.com/', 'User-Agent': 'Mozilla/5.0' } }
        );
        return await resp.json();
    } catch (e) {
        return { code: -1, message: String(e) };
    }
});
