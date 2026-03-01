import { ipcMain, session } from 'electron';
import { login_cellphone, search, song_url_v1, lyric, cloudsearch, personalized, recommend_songs, top_playlist, playlist_detail, user_account, likelist, user_playlist, song_detail } from 'NeteaseCloudMusicApi';

/**
 * Helper to get Netease cookies from Electron session and merge into api args
 */
async function withCookies(arg: any = {}) {
    try {
        const cookies = await session.defaultSession.cookies.get({ url: 'https://music.163.com' });
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        if (cookieString) {
            // If arg is null or undefined, make it an object
            const safeArg = arg || {};
            return { ...safeArg, cookie: cookieString };
        }
    } catch (e) {
        console.error('Failed to get NetEase cookies:', e);
    }
    return arg;
}

ipcMain.handle("NeteaseCloudMusic_login", async (_event, arg: { phone: string, password: string }) => {
    return await login_cellphone(arg);
})

ipcMain.handle("NeteaseCloudMusic_search", async (_event, arg: any) => {
    return await search(await withCookies(arg));
})

ipcMain.handle("NeteaseCloudMusic_song_url_v1", async (_event, arg: any) => {
    return await song_url_v1(await withCookies(arg));
})

ipcMain.handle("NeteaseCloudMusic_lyric", async (_event, arg: any) => {
    return await lyric(await withCookies(arg));
})

ipcMain.handle("NeteaseCloudMusic_cloudSearch", async (_event, arg: any) => {
    return await cloudsearch(await withCookies(arg));
})

ipcMain.handle("NeteaseCloudMusic_personalized", async (_event, arg: any) => {
    return await personalized(await withCookies(arg));
})

ipcMain.handle("NeteaseCloudMusic_recommend_songs", async (_event, arg: any) => {
    return await recommend_songs(await withCookies(arg));
})

ipcMain.handle("NeteaseCloudMusic_top_playlist", async (_event, arg: any) => {
    return await top_playlist(await withCookies(arg));
})

ipcMain.handle("NeteaseCloudMusic_playlist_detail", async (_event, arg: any) => {
    return await playlist_detail(await withCookies(arg));
})

ipcMain.handle("NeteaseCloudMusic_user_account", async (_event, arg: any) => {
    return await user_account(await withCookies(arg));
})

ipcMain.handle("NeteaseCloudMusic_user_likelist", async (_event, arg: any) => {
    return await likelist(await withCookies(arg));
})

ipcMain.handle("NeteaseCloudMusic_user_playlist", async (_event, arg: any) => {
    return await user_playlist(await withCookies(arg));
})

ipcMain.handle("NeteaseCloudMusic_song_detail", async (_event, arg: any) => {
    return await song_detail(await withCookies(arg));
})
