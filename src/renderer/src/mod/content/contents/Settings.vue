<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { lyricsStorage, toggleDesktopLyrics, updateLyricsStyle, updateLyricsLock, updateLyricsTopmost, initLyricsSync } from '@renderer/storage/lyricsStorage';

const electron = window.electron;

// Local writable refs for lyrics settings (lyricsStorage is readonly)
const localFontSize = ref(parseInt(localStorage.getItem('bmusic-lyrics-font-size') || '28'));
const localColor = ref(localStorage.getItem('bmusic-lyrics-color') || '#FFD700');

function onLyricsStyleChange() {
    updateLyricsStyle(localFontSize.value, localColor.value);
}

// ============ TAB SYSTEM ============
type TabKey = 'general' | 'system' | 'playback' | 'shortcuts' | 'lyrics' | 'about';
const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'general',   label: '常规',     icon: '⚙️' },
    { key: 'system',    label: '系统',     icon: '🖥️' },
    { key: 'playback',  label: '播放',     icon: '▶️' },
    { key: 'shortcuts', label: '快捷键',   icon: '⌨️' },
    { key: 'lyrics',    label: '桌面歌词', icon: '🎤' },
    { key: 'about',     label: '关于',     icon: 'ℹ️' },
];
const activeTab = ref<TabKey>('general');

// ============ THEME (General Tab) ============
type BrightMode = 'light' | 'dark' | 'noir';
type AccentKey = 'orange' | 'red' | 'pink' | 'blue' | 'green' | 'purple';
const brightModes: { key: BrightMode; label: string; icon: string }[] = [
    { key: 'light', label: '浅色', icon: '☀️' },
    { key: 'dark',  label: '深色', icon: '🌙' },
    { key: 'noir',  label: '暗黑', icon: '⚫' },
];
const accents: { key: AccentKey; label: string; color: string }[] = [
    { key: 'orange', label: '活力橙', color: '#EE7755' },
    { key: 'red',    label: '经典红', color: '#e33535' },
    { key: 'pink',   label: '樱花粉', color: '#fb7299' },
    { key: 'blue',   label: '海空蓝', color: '#4d9df6' },
    { key: 'green',  label: '薄荷绿', color: '#4caf50' },
    { key: 'purple', label: '幻夜紫', color: '#9c6fda' },
];
const currentBright = ref<BrightMode>((localStorage.getItem('bmusic-bright') as BrightMode) || 'light');
const currentAccent = ref<AccentKey>((localStorage.getItem('bmusic-accent') as AccentKey) || 'orange');

function applyTheme() {
    document.documentElement.setAttribute('data-theme', `${currentBright.value}-${currentAccent.value}`);
    localStorage.setItem('bmusic-bright', currentBright.value);
    localStorage.setItem('bmusic-accent', currentAccent.value);
}
function selectBright(key: BrightMode) { currentBright.value = key; applyTheme(); }
function selectAccent(key: AccentKey) { currentAccent.value = key; applyTheme(); }

// ============ SYSTEM TAB (real IPC) ============
const closeAction = ref('minimize');
const autoStartup = ref(false);
const hardwareAcceleration = ref(true);
const cacheSize = ref('计算中…');
const dataPath = ref('');

async function loadSystemSettings() {
    closeAction.value = await electron.ipcRenderer.invoke('settings__getCloseAction');
    autoStartup.value = await electron.ipcRenderer.invoke('settings__getAutoStartup');
    dataPath.value = await electron.ipcRenderer.invoke('settings__getDataPath');
    const bytes = await electron.ipcRenderer.invoke('settings__getCacheSize');
    cacheSize.value = formatBytes(bytes);
}

function setCloseAction(action: string) {
    closeAction.value = action;
    electron.ipcRenderer.invoke('settings__setCloseAction', action);
}

function setAutoStartup(enabled: boolean) {
    autoStartup.value = enabled;
    electron.ipcRenderer.invoke('settings__setAutoStartup', enabled);
}

function setHardwareAcceleration(enabled: boolean) {
    hardwareAcceleration.value = enabled;
    electron.ipcRenderer.invoke('settings__setHardwareAcceleration', enabled);
    needsRestart.value = true;
}

const needsRestart = ref(false);
function restartApp() {
    electron.ipcRenderer.invoke('settings__restartApp');
}

async function clearCache() {
    const ok = await electron.ipcRenderer.invoke('settings__clearCache');
    if (ok) {
        const bytes = await electron.ipcRenderer.invoke('settings__getCacheSize');
        cacheSize.value = formatBytes(bytes);
    }
}

function openDataFolder() {
    electron.ipcRenderer.invoke('settings__openDataPath');
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ============ CUSTOM LOADING ANIMATION ============
const customLoadingPath = ref(localStorage.getItem('bmusic-custom-loading') || '');

function selectCustomLoading() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/mp4,video/webm';
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            // we use the local path of the file to render the image
            const path = file.path;
            localStorage.setItem('bmusic-custom-loading', path);
            customLoadingPath.value = path;
        }
    };
    input.click();
}

function restoreDefaultLoading() {
    localStorage.removeItem('bmusic-custom-loading');
    customLoadingPath.value = '';
}

// ============ PLAYBACK TAB ============
const audioQuality = ref(localStorage.getItem('bmusic-audio-quality') || 'standard');
const autoPlay = ref(localStorage.getItem('bmusic-auto-play') === 'true');
const fadeEffect = ref(localStorage.getItem('bmusic-fade') === 'true');
const playMode = ref(localStorage.getItem('bmusic-play-mode') || 'list-loop');
const doubleClickAction = ref(localStorage.getItem('bmusic-double-click') || 'replace-list');
const rememberProgress = ref(localStorage.getItem('bmusic-remember-progress') !== 'false');

function savePlaySetting(key: string, val: string) { localStorage.setItem(key, val); }

// ============ SHORTCUTS TAB ============
interface AppShortcut { label: string; keys: string; id: string; }
const defaultShortcuts: AppShortcut[] = [
    { label: '播放/暂停', keys: 'Ctrl+P', id: 'play-pause' },
    { label: '上一首',   keys: 'Ctrl+Left', id: 'prev' },
    { label: '下一首',   keys: 'Ctrl+Right', id: 'next' },
    { label: '音量增加', keys: 'Ctrl+Up', id: 'vol-up' },
    { label: '音量减少', keys: 'Ctrl+Down', id: 'vol-down' },
    { label: '迷你模式', keys: 'Ctrl+M', id: 'mini' },
    { label: '打开/关闭歌词', keys: 'Ctrl+D', id: 'lyrics-toggle' },
    { label: '喜欢歌曲', keys: 'Ctrl+L', id: 'like' },
];

const shortcuts = ref<AppShortcut[]>([]);
try {
    const saved = localStorage.getItem('bmusic-shortcuts');
    if (saved) {
        shortcuts.value = JSON.parse(saved);
        // Merge missing defaults
        for (const def of defaultShortcuts) {
            if (!shortcuts.value.find(s => s.id === def.id)) {
                shortcuts.value.push(def);
            }
        }
    } else {
        shortcuts.value = [...defaultShortcuts];
    }
} catch {
    shortcuts.value = [...defaultShortcuts];
}

const recordingId = ref<string | null>(null);

function startRecording(id: string) {
    recordingId.value = id;
}

function stopRecording() {
    recordingId.value = null;
}

const unrecordableKeys = ['Control', 'Alt', 'Shift', 'Meta', 'Dead', 'CapsLock', 'Tab', 'Enter', 'Escape'];

async function recordShortcut(e: KeyboardEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();

    // If pressed Escape, clear the shortcut
    if (e.key === 'Escape') {
        const sc = shortcuts.value.find(s => s.id === id);
        if (sc) sc.keys = '';
        recordingId.value = null;
        await saveAndRegisterShortcuts();
        return;
    }

    if (unrecordableKeys.includes(e.key)) return;

    let keys: string[] = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Cmd');

    let mainKey = e.key;
    if (mainKey === ' ') mainKey = 'Space';
    else if (mainKey === 'ArrowUp') mainKey = 'Up';
    else if (mainKey === 'ArrowDown') mainKey = 'Down';
    else if (mainKey === 'ArrowLeft') mainKey = 'Left';
    else if (mainKey === 'ArrowRight') mainKey = 'Right';
    else if (mainKey.length === 1) mainKey = mainKey.toUpperCase();

    keys.push(mainKey);
    const finalKeys = keys.join('+');

    const sc = shortcuts.value.find(s => s.id === id);
    if (sc) {
        sc.keys = finalKeys;
        recordingId.value = null;
        await saveAndRegisterShortcuts();
    }
}

async function saveAndRegisterShortcuts() {
    localStorage.setItem('bmusic-shortcuts', JSON.stringify(shortcuts.value));
    await registerShortcuts();
}

async function registerShortcuts() {
    await electron.ipcRenderer.invoke('settings__registerShortcuts',
        shortcuts.value.map(s => ({ id: s.id, keys: s.keys }))
    );
}

// ============ LYRICS TAB (Real IPC from storage) ============
// Moved to lyricsStorage.ts

// ============ ABOUT TAB ============
const appVersion = ref('...');
const electronVersion = ref('');
const checkingUpdate = ref(false);
const updateResult = ref('');

async function loadAboutInfo() {
    appVersion.value = await electron.ipcRenderer.invoke('settings__getAppVersion');
    electronVersion.value = await electron.ipcRenderer.invoke('settings__getElectronVersion');
}

function checkForUpdate() {
    checkingUpdate.value = true;
    updateResult.value = '';
    // In production, this would use electron-updater
    setTimeout(() => {
        checkingUpdate.value = false;
        updateResult.value = '当前已是最新版本 🎉';
    }, 1500);
}

const scrollContainer = ref<HTMLElement | null>(null);
let isScrollingProgrammatically = false;

function scrollToSection(key: TabKey) {
    activeTab.value = key;
    const el = document.getElementById(`section-${key}`);
    const container = scrollContainer.value;
    if (el && container) {
        isScrollingProgrammatically = true;
        // Scroll exactly to top of section considering padding
        container.scrollTo({
            top: el.offsetTop - 20,
            behavior: 'smooth'
        });
        // Release scroll lock after animation
        setTimeout(() => { isScrollingProgrammatically = false; }, 600);
    }
}

function onScroll() {
    if (isScrollingProgrammatically || !scrollContainer.value) return;
    const scrollTop = scrollContainer.value.scrollTop;
    
    // Reverse iterating to find the active section
    for (let i = tabs.length - 1; i >= 0; i--) {
        const el = document.getElementById(`section-${tabs[i].key}`);
        if (el && scrollTop >= el.offsetTop - 100) {
            if (activeTab.value !== tabs[i].key) {
                activeTab.value = tabs[i].key;
            }
            break;
        }
    }
}

// ============ INIT ============
onMounted(async () => {
    applyTheme();
    await loadSystemSettings();
    await loadAboutInfo();
    await registerShortcuts();
    initLyricsSync();
});
</script>

<template>
    <div class="settings-root">
        <!-- TOP NAV - Anchor Links -->
        <div class="settings-header">
            <h2 class="page-title">设置</h2>
            <nav class="settings-nav">
                <button v-for="tab in tabs" :key="tab.key"
                    class="nav-anchor" :class="{ active: activeTab === tab.key }"
                    @click="scrollToSection(tab.key)">
                    {{ tab.label }}
                </button>
            </nav>
        </div>

        <!-- SCROLLING CONTENT -->
        <div class="settings-content" ref="scrollContainer" @scroll="onScroll">

            <!-- =============== 常规 =============== -->
            <div id="section-general" class="settings-section">
                <h3 class="section-title">常规</h3>
                <div class="section-body">
                    <div class="setting-item align-top">
                        <span class="item-label">明暗模式</span>
                        <div class="bright-grid">
                            <button v-for="mode in brightModes" :key="mode.key"
                                class="bright-btn" :class="{ active: currentBright === mode.key, [mode.key]: true }"
                                @click="selectBright(mode.key)">
                                <div class="bright-preview" :class="mode.key">
                                    <div class="preview-sidebar"></div>
                                    <div class="preview-content">
                                        <div class="preview-bar"></div>
                                        <div class="preview-line"></div>
                                        <div class="preview-line short"></div>
                                    </div>
                                </div>
                                <div class="bright-label">{{ mode.label }}</div>
                                <div v-if="currentBright === mode.key" class="check-badge">✓</div>
                            </button>
                        </div>
                    </div>
                    
                    <div class="setting-item align-top">
                        <span class="item-label">主题色</span>
                        <div class="accent-grid">
                            <button v-for="acc in accents" :key="acc.key"
                                class="accent-btn" :class="{ active: currentAccent === acc.key }"
                                @click="selectAccent(acc.key)">
                                <div class="accent-swatch" :style="{ background: acc.color }">
                                    <span v-if="currentAccent === acc.key" class="accent-check">✓</span>
                                </div>
                                <span class="accent-label">{{ acc.label }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section-divider"></div>

            <!-- =============== 系统 =============== -->
            <div id="section-system" class="settings-section">
                <h3 class="section-title">系统</h3>
                <div class="section-body">
                    <div class="setting-item">
                        <span class="item-label">关闭主面板时</span>
                        <div class="radio-group">
                            <label class="radio-item text-item">
                                <input type="radio" v-model="closeAction" value="minimize" @change="setCloseAction('minimize')">
                                <span class="radio-dot"></span>最小化托盘
                            </label>
                            <label class="radio-item text-item">
                                <input type="radio" v-model="closeAction" value="exit" @change="setCloseAction('exit')">
                                <span class="radio-dot"></span>退出 BMusic
                            </label>
                        </div>
                    </div>

                    <div class="setting-item">
                        <span class="item-label">启动与加速</span>
                        <div class="checkbox-group">
                            <label class="checkbox-item text-item">
                                <input type="checkbox" v-model="autoStartup" @change="setAutoStartup(autoStartup)"> 开机自动运行
                            </label>
                            <label class="checkbox-item text-item">
                                <input type="checkbox" v-model="hardwareAcceleration" @change="setHardwareAcceleration(hardwareAcceleration)"> 开启GPU加速(重启生效)
                            </label>
                        </div>
                    </div>

                    <div v-if="needsRestart" class="setting-item">
                        <span class="item-label"></span>
                        <button class="action-btn restart-btn" @click="restartApp">重启以应用GPU加速</button>
                    </div>

                    <div class="setting-item">
                        <span class="item-label">缓存占用</span>
                        <div class="item-content-inline">
                            <span class="text-secondary">{{ cacheSize }}</span>
                            <button class="action-btn text-btn" @click="clearCache">清除缓存</button>
                        </div>
                    </div>

                    <div class="setting-item">
                        <span class="item-label">数据目录</span>
                        <div class="item-content-inline">
                            <button class="action-btn text-btn" @click="openDataFolder">打开目录</button>
                        </div>
                    </div>

                    <div class="setting-item">
                        <span class="item-label">加载动画设置</span>
                        <div class="item-content-inline" style="gap: 1rem; align-items: center;">
                            <button class="action-btn text-btn" @click="selectCustomLoading">导入加载动画</button>
                            <button v-if="customLoadingPath" class="action-btn text-btn" style="color: var(--color-primary-text2);" @click="restoreDefaultLoading">还原默认</button>
                            <span v-if="customLoadingPath" class="text-secondary" style="font-size: 0.8rem; opacity: 0.7; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                已应用: {{ customLoadingPath.split('\\').pop() || customLoadingPath.split('/').pop() }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section-divider"></div>

            <!-- =============== 播放 =============== -->
            <div id="section-playback" class="settings-section">
                <h3 class="section-title">播放</h3>
                <div class="section-body">
                    <div class="setting-item">
                        <span class="item-label">播放音质</span>
                        <div class="radio-group">
                            <label class="radio-item text-item">
                                <input type="radio" v-model="audioQuality" value="standard" @change="savePlaySetting('bmusic-audio-quality', audioQuality)">
                                <span class="radio-dot"></span>标准音质
                            </label>
                            <label class="radio-item text-item">
                                <input type="radio" v-model="audioQuality" value="exhigh" @change="savePlaySetting('bmusic-audio-quality', audioQuality)">
                                <span class="radio-dot"></span>极高音质
                            </label>
                            <label class="radio-item text-item">
                                <input type="radio" v-model="audioQuality" value="lossless" @change="savePlaySetting('bmusic-audio-quality', audioQuality)">
                                <span class="radio-dot"></span>无损音质
                            </label>
                            <label class="radio-item text-item">
                                <input type="radio" v-model="audioQuality" value="hires" @change="savePlaySetting('bmusic-audio-quality', audioQuality)">
                                <span class="radio-dot"></span>Hi-Res
                            </label>
                        </div>
                    </div>
                    <div class="setting-item">
                        <span class="item-label">播放模式</span>
                        <div class="radio-group">
                            <label class="radio-item text-item">
                                <input type="radio" v-model="playMode" value="list-loop" @change="savePlaySetting('bmusic-play-mode', playMode)">
                                <span class="radio-dot"></span>列表循环
                            </label>
                            <label class="radio-item text-item">
                                <input type="radio" v-model="playMode" value="single-loop" @change="savePlaySetting('bmusic-play-mode', playMode)">
                                <span class="radio-dot"></span>单曲循环
                            </label>
                            <label class="radio-item text-item">
                                <input type="radio" v-model="playMode" value="random" @change="savePlaySetting('bmusic-play-mode', playMode)">
                                <span class="radio-dot"></span>随机播放
                            </label>
                            <label class="radio-item text-item">
                                <input type="radio" v-model="playMode" value="sequential" @change="savePlaySetting('bmusic-play-mode', playMode)">
                                <span class="radio-dot"></span>顺序播放
                            </label>
                        </div>
                    </div>
                    <div class="setting-item align-top">
                        <span class="item-label">播放列表</span>
                        <div class="item-content-col" style="gap: 1rem;">
                            <label class="radio-item text-item">
                                <input type="radio" v-model="doubleClickAction" value="replace-list" @change="savePlaySetting('bmusic-double-click', doubleClickAction)">
                                <span class="radio-dot"></span>双击播放单曲时，用当前单曲所在的歌曲列表替换播放列表
                            </label>
                            <label class="radio-item text-item">
                                <input type="radio" v-model="doubleClickAction" value="add-single" @change="savePlaySetting('bmusic-double-click', doubleClickAction)">
                                <span class="radio-dot"></span>双击播放单曲时，仅把当前单曲添加到播放列表
                            </label>
                        </div>
                    </div>
                    
                    <div class="setting-item align-top">
                        <span class="item-label">播放与特效</span>
                        <div class="item-content-col" style="gap: 1.2rem; margin-top: 0.2rem;">
                            <label class="checkbox-item text-item">
                                <input type="checkbox" v-model="rememberProgress" @change="savePlaySetting('bmusic-remember-progress', String(rememberProgress))"> 程序启动时记住上一次播放进度
                            </label>
                            <label class="checkbox-item text-item">
                                <input type="checkbox" v-model="fadeEffect" @change="savePlaySetting('bmusic-fade', String(fadeEffect))"> 开启音乐淡入淡出
                            </label>
                            <label class="checkbox-item text-item">
                                <input type="checkbox" v-model="autoPlay" @change="savePlaySetting('bmusic-auto-play', String(autoPlay))"> 自动播放
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section-divider"></div>

            <!-- =============== 快捷键 =============== -->
            <div id="section-shortcuts" class="settings-section" @click="stopRecording">
                <h3 class="section-title">快捷键</h3>
                <div class="section-body">
                    <div class="setting-item align-top">
                        <span class="item-label">键盘与快捷键</span>
                        <div class="shortcuts-grid">
                            <div class="shortcuts-header text-secondary">
                                <div class="sh-name">功能说明</div>
                                <div class="sh-keys">快捷键</div>
                            </div>
                            <div class="shortcut-list-item" v-for="sc in shortcuts" :key="sc.id">
                                <div class="sh-name">{{ sc.label }}</div>
                                <div class="sh-keys">
                                    <div class="shortcut-recorder-box"
                                        :class="{ recording: recordingId === sc.id }"
                                        @click.stop="startRecording(sc.id)"
                                        tabindex="0"
                                        @keydown="recordShortcut($event, sc.id)">
                                        <template v-if="recordingId === sc.id">
                                            <span class="recording-hint">请按键...(Esc取消)</span>
                                        </template>
                                        <template v-else-if="sc.keys">
                                            {{ sc.keys }}
                                        </template>
                                        <template v-else>
                                            <span class="text-secondary">无</span>
                                        </template>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section-divider"></div>

            <!-- =============== 桌面歌词 =============== -->
            <div id="section-lyrics" class="settings-section">
                <h3 class="section-title">桌面与歌词</h3>
                <div class="section-body">
                    <div class="setting-item">
                        <span class="item-label">桌面歌词</span>
                        <div class="checkbox-group">
                            <label class="checkbox-item text-item">
                                <input type="checkbox" v-model="lyricsStorage.showDesktopLyrics" @change="toggleDesktopLyrics"> 启用桌面歌词
                            </label>
                            <label class="checkbox-item text-item">
                                <input type="checkbox" v-model="lyricsStorage.lyricsLock" @change="updateLyricsLock(lyricsStorage.lyricsLock)"> 锁定歌词(鼠标穿透)
                            </label>
                            <label class="checkbox-item text-item">
                                <input type="checkbox" v-model="lyricsStorage.lyricsTopmost" @change="updateLyricsTopmost(lyricsStorage.lyricsTopmost)"> 歌词窗口总在最前
                            </label>
                        </div>
                    </div>

                    <div class="setting-item">
                        <span class="item-label">字号与颜色</span>
                        <div class="item-content-inline">
                            <input type="range" class="range-slider" min="16" max="48" v-model.number="localFontSize" @input="onLyricsStyleChange">
                            <span class="text-secondary text-sm" style="min-width: 40px">{{ localFontSize }}px</span>
                            <div style="width: 1rem"></div>
                            <input type="color" class="color-input" v-model="localColor" @input="onLyricsStyleChange">
                        </div>
                    </div>
                </div>
            </div>

            <div class="section-divider"></div>

            <!-- =============== 关于 =============== -->
            <div id="section-about" class="settings-section last-section">
                <h3 class="section-title">关于BMusic</h3>
                <div class="section-body">
                    <div class="setting-item align-top">
                        <span class="item-label">当前版本</span>
                        <div class="item-content-col">
                            <div class="text-item">版本 {{ appVersion }} 
                                <button class="action-btn text-btn ml-3" :disabled="checkingUpdate" @click="checkForUpdate">
                                    {{ checkingUpdate ? '检查中…' : '检查更新' }}
                                </button>
                            </div>
                            <div v-if="updateResult" class="text-secondary text-sm mt-1">{{ updateResult }}</div>
                        </div>
                    </div>
                    <div class="setting-item">
                        <span class="item-label">Electron引擎</span>
                        <div class="text-item">{{ electronVersion }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ============ ROOT LAYOUT ============ */
.settings-root { display: flex; flex-direction: column; height: 100%; background: var(--color-primary-bg); color: var(--color-primary-text); overflow: hidden; }

/* ============ TOP HEADER TABS ============ */
.settings-header {
    background: var(--color-primary-bg2);
    border-bottom: 1px solid var(--color-primary-boder);
    padding: 1.5rem 2rem 0;
    z-index: 10;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05); /* very subtle drop shadow for depth */
}
.page-title {
    font-size: 1.5rem; font-weight: 700; margin: 0 0 1rem 0; color: var(--color-primary-text);
}
.settings-nav {
    display: flex; gap: 1.5rem;
}
.nav-anchor {
    background: none; border: none; padding: 0 0.25rem 0.6rem;
    color: var(--color-primary-text2); font-size: 0.95rem; cursor: pointer;
    border-bottom: 3px solid transparent; transition: all 0.2s;
}
.nav-anchor:hover { color: var(--color-primary-text); }
.nav-anchor.active {
    color: var(--color-primary); font-weight: 600;
    border-bottom-color: var(--color-primary);
}

/* ============ CONTENT PANEL ============ */
.settings-content {
    flex: 1; overflow-y: auto; padding: 2rem 3rem 4rem; scrollbar-width: thin;
    scroll-behavior: smooth;
}

/* ============ SECTION ============ */
.settings-section { margin-bottom: 0; padding-top: 1rem; display: flex; }
.last-section { min-height: 400px; /* Pad bottom so last section can scroll up */ }
.section-divider { height: 1px; background: var(--color-primary-boder); margin: 2rem 0; opacity: 0.6; }

/* Left-aligned Title Layout */
.section-title {
    font-size: 0.95rem; font-weight: bold; width: 120px; flex-shrink: 0; color: var(--color-primary-text2);
    margin: 0; padding-top: 0.3rem;
}
.section-body { flex: 1; display: flex; flex-direction: column; gap: 1.5rem; }

/* Item Layout */
.setting-item { display: flex; gap: 1rem; align-items: center; }
.setting-item.align-top { align-items: flex-start; }
.item-label {
    width: 60px; flex-shrink: 0; font-size: 0.85rem; color: var(--color-primary-text2);
    text-align: left; padding-top: 0.15rem; /* align with first line of content */
}

/* Common Text/Actions */
.text-item { font-size: 0.88rem; color: var(--color-primary-text); }
.text-sm { font-size: 0.78rem; }
.text-secondary { color: var(--color-primary-text2); }
.item-content-inline { display: flex; align-items: center; gap: 1rem; }
.item-content-col { display: flex; flex-direction: column; gap: 0.4rem; }
.ml-3 { margin-left: 1rem; }
.mt-1 { margin-top: 0.3rem; }

/* ============ SELECTION STYLES ============ */
/* Checkbox */
.checkbox-group { display: flex; gap: 1.5rem; flex-wrap: wrap; }
.checkbox-item { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; user-select: none; }
.checkbox-item input[type="checkbox"] {
    appearance: none; -webkit-appearance: none; width: 16px; height: 16px;
    border: 1px solid var(--color-primary-text2); border-radius: 3px; cursor: pointer;
    background: transparent; transition: all 0.2s; position: relative;
    display: flex; align-items: center; justify-content: center;
}
.checkbox-item input[type="checkbox"]:checked {
    background: var(--color-primary); border-color: var(--color-primary);
}
.checkbox-item input[type="checkbox"]:checked::after {
    content: "✓"; color: #fff; font-size: 12px; font-weight: bold; position: absolute;
}

/* Radio */
.radio-group { display: flex; gap: 1.5rem; }
.radio-item { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; user-select: none; }
.radio-item input { display: none; }
.radio-dot {
    width: 16px; height: 16px; border-radius: 50%; border: 1px solid var(--color-primary-text2);
    display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.radio-dot::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: transparent; transition: background 0.15s; }
.radio-item input:checked ~ .radio-dot { border-color: var(--color-primary); }
.radio-item input:checked ~ .radio-dot::after { background: var(--color-primary); }

/* Buttons */
.action-btn {
    background: none; border: none; font-size: 0.85rem; cursor: pointer;
    color: var(--color-primary-text); transition: color 0.15s; padding: 0;
}
.text-btn { color: #66b1ff; transition: color 0.2s; }
.text-btn:hover { color: #8cc5ff; }

/* ============ BRIGHT MODE GRID (Refined) ============ */
.bright-grid { display: flex; gap: 1rem; margin-top: -0.2rem; }
.bright-btn {
    position: relative; width: 100px; background: none; border: 1px solid var(--color-primary-boder); border-radius: 0.4rem;
    padding: 0; cursor: pointer; transition: all 0.2s; overflow: hidden;
}
.bright-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px var(--color-primary-shadow); }
.bright-btn.active { border-color: var(--color-primary); }
.bright-preview { display: flex; height: 50px; overflow: hidden; }
/* preview internals (same as before) */
.bright-preview.light { background: #fff; }
.bright-preview.dark  { background: #1e1e2e; }
.bright-preview.noir  { background: #0d0d0d; }
.preview-sidebar { width: 28%; height: 100%; opacity: 0.5; }
.light .preview-sidebar { background: #f2f2f2; }
.dark .preview-sidebar  { background: #2a2a3e; }
.noir .preview-sidebar  { background: #181818; }
.preview-content { flex: 1; padding: 5px; display: flex; flex-direction: column; gap: 3px; }
.preview-bar { height: 7px; border-radius: 3px; background: var(--color-primary); opacity: 0.8; }
.preview-line { height: 4px; border-radius: 2px; opacity: 0.25; }
.light .preview-line { background: #1a1a1a; }
.dark .preview-line  { background: #e8e8f0; }
.noir .preview-line  { background: #f0f0f0; }
.preview-line.short { width: 55%; }

.bright-label {
    padding: 0.4rem; font-size: 0.8rem;
    color: var(--color-primary-text); text-align: center; background: var(--color-primary-bg2);
}
.check-badge {
    position: absolute; bottom: 4px; right: 4px; background: var(--color-primary); color: var(--color-primary-with);
    width: 14px; height: 14px; border-radius: 50%; font-size: 0.55rem;
    display: flex; align-items: center; justify-content: center; font-weight: bold;
}

/* ============ ACCENT GRID (Refined) ============ */
.accent-grid { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-top: -0.2rem; }
.accent-btn {
    background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; padding: 0.2rem;
    border-radius: 1rem; transition: background 0.15s;
}
.accent-swatch {
    width: 1.2rem; height: 1.2rem; border-radius: 50%; display: flex; align-items: center;
    justify-content: center;
}
.accent-check { color: #fff; font-size: 0.7rem; font-weight: bold; }
.accent-label { font-size: 0.8rem; color: var(--color-primary-text); }

/* ============ RANGE & COLOR SLIDER ============ */
.range-slider { width: 150px; accent-color: var(--color-primary); cursor: pointer; }
.color-input {
    width: 1.5rem; height: 1.5rem; border: none; padding: 0;
    border-radius: 2px; cursor: pointer; background: none;
}
.color-input::-webkit-color-swatch-wrapper { padding: 0; }
.color-input::-webkit-color-swatch { border: 1px solid var(--color-primary-boder); border-radius: 2px; }

/* ============ SHORTCUTS DARK RECORDER ============ */
.shortcuts-grid { width: 100%; max-width: 450px; }
.shortcuts-header { display: flex; font-size: 0.8rem; margin-bottom: 0.5rem; padding: 0 0.5rem; }
.shortcut-list-item { display: flex; align-items: center; padding: 0.5rem; font-size: 0.88rem; color: var(--color-primary-text); }
.shortcut-list-item:nth-child(even) { background: var(--color-primary-bg2); border-radius: 4px; }
.sh-name { width: 140px; }
.sh-keys { flex: 1; }

.shortcut-recorder-box {
    background: #111; /* Always dark like Netease */
    border: 1px solid #333;
    color: #dedede;
    border-radius: 16px;
    padding: 0.3rem 1rem;
    font-size: 0.85rem;
    font-family: inherit;
    cursor: text;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 140px;
    height: 30px;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
    letter-spacing: 0.5px;
}
.shortcut-recorder-box:hover { border-color: #555; }
.shortcut-recorder-box.recording { border-color: var(--color-primary); box-shadow: 0 0 0 1px var(--color-primary); background: #000; }
.recording-hint { font-size: 0.75rem; color: #888; font-style: italic; letter-spacing: 0; }
</style>
