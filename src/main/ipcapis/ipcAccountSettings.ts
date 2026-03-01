import { ipcMain, session, net } from 'electron';
import { user_account } from 'NeteaseCloudMusicApi';
import { getAccounts, getActiveAccount, createAccount, switchAccount, deleteAccount } from '../db/sqlite';

// Check if Bilibili cookie exists
ipcMain.handle('check-bilibili-login', async () => {
    const cookies = await session.defaultSession.cookies.get({ url: 'https://bilibili.com' });
    return cookies.some(cookie => cookie.name === 'bili_jct' || cookie.name === 'SESSDATA');
});

// Fetch Bilibili User Profile
ipcMain.handle('get-bilibili-profile', async () => {
    try {
        // net.fetch automatically uses the defaultSession's cookies
        const response = await net.fetch('https://api.bilibili.com/x/web-interface/nav', {
            method: 'GET'
        });
        const data = await response.json() as any;
        if (data.code === 0 && data.data && data.data.isLogin) {
            return {
                username: data.data.uname,
                avatar: data.data.face
            };
        }
        return null;
    } catch (e) {
        console.error('Failed to fetch Bilibili profile:', e);
        return null;
    }
});

// Clear Bilibili cookies
ipcMain.handle('logout-bilibili', async () => {
    const cookies = await session.defaultSession.cookies.get({ url: 'https://bilibili.com' });
    for (const cookie of cookies) {
        let url = 'https://' + (cookie.domain || '') + cookie.path;
        if (cookie.domain && cookie.domain.startsWith('.')) {
            url = 'https://' + cookie.domain.substring(1) + cookie.path;
        }
        await session.defaultSession.cookies.remove(url, cookie.name);
    }
    return true;
});


// Check if Netease cookie exists
ipcMain.handle('check-netease-login', async () => {
    const cookies = await session.defaultSession.cookies.get({ url: 'https://music.163.com' });
    return cookies.some(cookie => cookie.name === 'MUSIC_U');
});

// Fetch Netease User Profile
ipcMain.handle('get-netease-profile', async () => {
    try {
        const cookies = await session.defaultSession.cookies.get({ url: 'https://music.163.com' });
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        const response: any = await user_account({ cookie: cookieString });
        if (response.status === 200 && response.body && response.body.profile) {
            return {
                username: response.body.profile.nickname,
                avatar: response.body.profile.avatarUrl
            };
        }
        return null;
    } catch (e) {
        console.error('Failed to fetch Netease profile:', e);
        return null;
    }
});

// Clear Netease cookies
ipcMain.handle('logout-netease', async () => {
    const cookies = await session.defaultSession.cookies.get({ url: 'https://music.163.com' });
    for (const cookie of cookies) {
        let url = 'https://' + (cookie.domain || '') + cookie.path;
        if (cookie.domain && cookie.domain.startsWith('.')) {
            url = 'https://' + cookie.domain.substring(1) + cookie.path;
        }
        await session.defaultSession.cookies.remove(url, cookie.name);
    }
    return true;
});

// BMusic Account System (SQLite)
ipcMain.handle('get-bmusic-accounts', () => {
    return getAccounts();
});

ipcMain.handle('get-active-bmusic-account', () => {
    return getActiveAccount();
});

ipcMain.handle('create-bmusic-account', (_event, name: string, avatar?: string) => {
    return createAccount(name, avatar);
});

ipcMain.handle('delete-bmusic-account', (_event, id: number) => {
    deleteAccount(id);
    return true;
});

ipcMain.handle('switch-bmusic-account', async (_event, id: number) => {
    const activeAcc = switchAccount(id);
    if (!activeAcc) return null;

    // Clear all existing cookies first
    const existingCookies = await session.defaultSession.cookies.get({});
    for (const cookie of existingCookies) {
        let url = 'https://' + (cookie.domain || '') + cookie.path;
        if (cookie.domain && cookie.domain.startsWith('.')) {
            url = 'https://' + cookie.domain.substring(1) + cookie.path;
        }
        await session.defaultSession.cookies.remove(url, cookie.name);
    }

    // Set new cookies from the switched account
    try {
        const storedCookies = JSON.parse(activeAcc.cookies_json || '[]');
        for (const cookie of storedCookies) {
            let url = 'https://' + (cookie.domain || '') + cookie.path;
            if (cookie.domain && cookie.domain.startsWith('.')) {
                url = 'https://' + cookie.domain.substring(1) + cookie.path;
            }
            // we construct the cookie details object required by set()
            await session.defaultSession.cookies.set({
                url,
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                path: cookie.path,
                secure: cookie.secure,
                httpOnly: cookie.httpOnly,
                expirationDate: cookie.expirationDate,
            });
        }
    } catch (e) {
        console.error('Failed to parse and set cookies for new account:', e);
    }

    return activeAcc;
});
