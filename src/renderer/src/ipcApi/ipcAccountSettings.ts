const electron = window.electron;

export interface BMusicAccount {
    id: number;
    name: string;
    avatar: string;
    cookies_json: string;
    is_active: number;
}

export async function checkBilibiliLogin(): Promise<boolean> {
    return await electron.ipcRenderer.invoke('check-bilibili-login');
}

export async function getBilibiliProfile(): Promise<{ username: string, avatar: string } | null> {
    return await electron.ipcRenderer.invoke('get-bilibili-profile');
}

export async function logoutBilibili(): Promise<boolean> {
    return await electron.ipcRenderer.invoke('logout-bilibili');
}

export async function checkNeteaseLogin(): Promise<boolean> {
    return await electron.ipcRenderer.invoke('check-netease-login');
}

export async function getNeteaseProfile(): Promise<{ username: string, avatar: string } | null> {
    return await electron.ipcRenderer.invoke('get-netease-profile');
}

export async function logoutNetease(): Promise<boolean> {
    return await electron.ipcRenderer.invoke('logout-netease');
}

// BMusic Account System APIs
export async function getBMusicAccounts(): Promise<BMusicAccount[]> {
    return await electron.ipcRenderer.invoke('get-bmusic-accounts');
}

export async function getActiveBMusicAccount(): Promise<BMusicAccount | undefined> {
    return await electron.ipcRenderer.invoke('get-active-bmusic-account');
}

export async function createBMusicAccount(name: string, avatar?: string): Promise<BMusicAccount> {
    return await electron.ipcRenderer.invoke('create-bmusic-account', name, avatar);
}

export async function deleteBMusicAccount(id: number): Promise<boolean> {
    return await electron.ipcRenderer.invoke('delete-bmusic-account', id);
}

export async function switchBMusicAccount(id: number): Promise<BMusicAccount | null> {
    return await electron.ipcRenderer.invoke('switch-bmusic-account', id);
}
