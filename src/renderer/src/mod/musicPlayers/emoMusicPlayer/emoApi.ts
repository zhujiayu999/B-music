export const enum SoundQualityType {
    standard = 'standard',
    exhigh = 'exhigh',
    lossless = 'lossless',
    hires = 'hires',
    jyeffect = 'jyeffect',
    jymaster = 'jymaster',
    sky = 'sky',
}

const electron = window.electron;


export async function search(params: {
    keywords: string
    limit?: string | number
}) {
    return electron.ipcRenderer.invoke("NeteaseCloudMusic_search", params);
}


export async function song_url_v1(params: { id: string | number; level: SoundQualityType }) {
    return electron.ipcRenderer.invoke("NeteaseCloudMusic_song_url_v1", params);
}

export async function lyric(params: { id: string | number }) {
    return electron.ipcRenderer.invoke("NeteaseCloudMusic_lyric", params);
}

export async function cloudsearch(params: {
    keywords: string
    limit?: string | number
    offset?: string | number
}) {
    return electron.ipcRenderer.invoke("NeteaseCloudMusic_cloudSearch", params);
}

export async function personalized(params?: any) {
    return electron.ipcRenderer.invoke("NeteaseCloudMusic_personalized", params);
}

export async function recommend_songs(params?: any) {
    return electron.ipcRenderer.invoke("NeteaseCloudMusic_recommend_songs", params);
}

export async function top_playlist(params?: any) {
    return electron.ipcRenderer.invoke("NeteaseCloudMusic_top_playlist", params);
}

export async function playlist_detail(params?: any) {
    return electron.ipcRenderer.invoke("NeteaseCloudMusic_playlist_detail", params);
}

export async function user_playlist(params?: any) {
    return electron.ipcRenderer.invoke("NeteaseCloudMusic_user_playlist", params);
}

export async function user_likelist(params?: any) {
    return electron.ipcRenderer.invoke("NeteaseCloudMusic_user_likelist", params);
}

export async function user_account(params?: any) {
    return electron.ipcRenderer.invoke("NeteaseCloudMusic_user_account", params);
}

export async function song_detail(params?: any) {
    return electron.ipcRenderer.invoke("NeteaseCloudMusic_song_detail", params);
}
