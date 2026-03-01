// Bmusic 播放器 bilibili 音乐播放器控制脚本 https://github.com/jianjianai/bmusic
// 此文件单独使用 Apache 2.0 协议。
// 如果需要可以复制此文件到你的项目中进行修改，但请注明出处。建议保留此注释!


/**
 * 设置音量
 * @param volume 音量 0~1
 */
export function setVolume(volume: number) {
  const lineLength = document.querySelector('.bpx-player-control-entity') as HTMLElement;
  const lineLengthShwo = lineLength.style.display != 'none';

  if (!lineLengthShwo) {
    // 屏幕太小会隐藏进度条导致无法设置进度，强行显示进度条
    lineLength.style.display = 'block';
  }

  const volumeBar = document.querySelector('.bpx-player-ctrl-volume-box') as HTMLElement;
  const volumeLine = document.querySelector('.bpx-player-ctrl-volume-box .bui-area') as HTMLElement;

  volumeBar.style.display = 'block';

  const xAdd = volumeLine.getBoundingClientRect().bottom;
  const height = volumeLine.getBoundingClientRect().height;
  const pr = height * Math.max(0, Math.min(1, volume));
  const y = xAdd - pr;

  volumeLine.dispatchEvent(new MouseEvent('mousedown', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: 0,
    clientY: y
  }));

  volumeLine.dispatchEvent(new MouseEvent('mouseup', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: 0,
    clientY: y
  }));

  volumeBar.style.display = "";

  if (!lineLengthShwo) {
    // 如果强行显示了进度条，那么隐藏进度条
    lineLength.style.display = 'none';
  }
}

/***
 * 当音量发生改变时
 */
export function regOnVolumeChange(func: (volume: number) => void) {
  const volumeNum = document.querySelector('.bpx-player-ctrl-volume-box .bpx-player-ctrl-volume-number') as HTMLElement;
  new MutationObserver(() => {
    func(parseFloat(volumeNum.innerText) / 100);
  }).observe(volumeNum, { childList: true, subtree: false, attributes: false });
}


/***
 * 控制播放器进度
 * @param progress 当前播放到的时间，单位毫秒
 */
export function setPlaybackProgress(progress: number) {
  const line = document.querySelector('.bpx-player-progress-wrap') as HTMLElement;
  const lineLength = document.querySelector('.bpx-player-control-entity') as HTMLElement;
  const lineLengthShwo = lineLength.style.display != 'none';

  if (!lineLengthShwo) {
    // 屏幕太小会隐藏进度条导致无法设置进度，强行显示进度条
    lineLength.style.display = 'block';
  }

  const xAdd = line.getBoundingClientRect().left;
  const width = line.getBoundingClientRect().width;
  const pr = width * Math.max(0, Math.min(1, progress / getMusicLength()));
  const x = pr + xAdd;

  line.dispatchEvent(new MouseEvent('mousedown', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: 0
  }));

  window.dispatchEvent(new MouseEvent('mouseup', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: 0
  }));

  if (!lineLengthShwo) {
    // 如果强行显示了进度条，那么隐藏进度条
    lineLength.style.display = 'none';
  }
}

/**将 mm:ss 转换为毫秒 */
function timeToMillisecond(time: string): number {
  const t = time.split(':');
  return (parseInt(t[0]) * 60 + parseInt(t[1])) * 1000;
}

/***
 * 注册状态缓冲改变时
 */
export function regBpxStateBuff(func: (buff: boolean) => void) {
  const playBtn = document.querySelector('.bpx-player-container')!;
  func(playBtn.classList.contains('bpx-state-buff'));
  new MutationObserver(() => {
    func(playBtn.classList.contains('bpx-state-buff'));
  }).observe(playBtn, { childList: false, subtree: false, attributes: true });
}

/****
 * 当播放进度发生改变时
 */
export function regOnPlaybackProgressChange(func: (progress: number) => void) {
  const current = document.querySelector('.bpx-player-ctrl-time-current') as HTMLElement;
  func(timeToMillisecond(current.innerText));
  new MutationObserver(() => {
    func(timeToMillisecond(current.innerText));
  }).observe(current, { childList: true, subtree: false, attributes: false });
}

/**
 * 当暂停或播放时
 * */
export function regOnPlaybackStateChange(func: (playing: boolean) => void) {
  const playBtn = document.querySelector('.bpx-player-container')!;
  func(!playBtn.classList.contains('bpx-state-paused'));
  new MutationObserver(() => {
    func(!playBtn.classList.contains('bpx-state-paused'));
  }).observe(playBtn, { childList: false, subtree: false, attributes: true });
}

/**
 * 获取音乐播放暂停状态
 */
export function getPlaybackState(): boolean {
  const playBtn = document.querySelector('.bpx-player-container')!;
  return !playBtn.classList.contains('bpx-state-paused');
}

/**
 * 当音乐长度发生改变时
 * */
export function regOnPlaybackLengthChange(func: (length: number) => void) {
  const total = document.querySelector('.bpx-player-ctrl-time-duration') as HTMLElement;
  func(timeToMillisecond(total.innerText));
  new MutationObserver(() => {
    func(timeToMillisecond(total.innerText));
  }).observe(total, { childList: true, subtree: false, attributes: false });
}

/**
 * 获取音乐长度
 * */
export function getMusicLength(): number {
  const total = document.querySelector('.bpx-player-ctrl-time-duration') as HTMLElement;
  return timeToMillisecond(total.innerText);
}

/**
 * 点击播放暂停按钮
 */
export function clickPlay() {
  const playBtn = document.querySelector('.bpx-player-ctrl-btn.bpx-player-ctrl-play')!;
  playBtn.dispatchEvent(new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  }));
}

/**
 * 暂停
 * */
export function pause() {
  if (!getPlaybackState()) {
    return;
  }
  clickPlay();
}

/**
 * 播放
 * */
export function play() {
  if (getPlaybackState()) {
    return;
  }
  clickPlay();
}


/**
 * 点击网页全屏按钮
 * */
export function clickFullScreen() {
  const fullScreenBtn = document.querySelector('.bpx-player-ctrl-btn.bpx-player-ctrl-web')!;
  fullScreenBtn.dispatchEvent(new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  }));
}

/**
 * 是否网页全屏
 * */
export function isFullScreen(): boolean {
  const fullScreenBtn = document.querySelector('.bpx-player-ctrl-btn.bpx-player-ctrl-web')!;
  return fullScreenBtn.classList.contains('bpx-state-entered');
}

/**
 * 网页全屏
 * */
export function fullScreen() {
  if (isFullScreen()) {
    return;
  }
  clickFullScreen();
}

/**
 * 取消网页全屏
 * */
export function cancelFullScreen() {
  if (!isFullScreen()) {
    return;
  }
  clickFullScreen();
}


/**
 * 验证码出现时关闭验证码
 * */
// export function autoCloseCaptcha() {
//   new MutationObserver((c) => {
//     console.log("find captcha");
//     for (let mutationRecord of c) {
//       if (
//         (mutationRecord.previousSibling as HTMLElement)?.classList?.contains("geetest_panel") &&
//         (mutationRecord.previousSibling as HTMLElement)?.classList?.contains("geetest_wind")
//       ) {
//         let div = document.createElement('div');
//         div.appendChild((mutationRecord.previousSibling as HTMLElement));
//       }
//     }
//   }).observe(document.body, { childList: true, subtree: false, attributes: false });
// }

/**
 * 点赞
 */
export function clickLike() {
  const likeButtoin = document.querySelector(".video-like.video-toolbar-left-item");
  if (likeButtoin!.classList.contains("on")) {
    return;
  }
  likeButtoin!.dispatchEvent(new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  }));
}

/**
 * 取消点赞
 */
export function cancelLike() {
  const likeButtoin = document.querySelector(".video-like.video-toolbar-left-item");
  if (!likeButtoin!.classList.contains("on")) {
    return;
  }
  likeButtoin!.dispatchEvent(new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  }));
}

/**
 * 当点赞状态发生变化时
 */
export function regOnLikeChange(func: (like: boolean) => void) {
  const likeButtoin = document.querySelector(".video-like.video-toolbar-left-item");
  func(likeButtoin!.classList.contains("on"));
  new MutationObserver(() => {
    func(likeButtoin!.classList.contains("on"));
  }).observe(likeButtoin!, { childList: false, subtree: false, attributes: true });
}

/** 投币状态发生变化时 */
export function regOnCoinChange(func: (coin: boolean) => void) {
  const coinButtoin = document.querySelector(".video-coin.video-toolbar-left-item");
  func(coinButtoin!.classList.contains("on"));
  new MutationObserver(() => {
    func(coinButtoin!.classList.contains("on"));
  }).observe(coinButtoin!, { childList: false, subtree: false, attributes: true });
}

/** 投币 */
export async function clickCoin(coinCount: number = 1) {
  const coinButtoin = document.querySelector(".video-coin.video-toolbar-left-item");
  if (coinButtoin!.classList.contains("on")) {
    return;
  }
  coinButtoin!.dispatchEvent(new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  }));
  // Default to confirm button if options aren't found or for 1 coin
  for (let i = 0; i < 10; i++) {
    // b站投币弹窗出现后，如果有选两个硬币的需求
    if (coinCount === 2) {
      const twoCoinsBtn = document.querySelectorAll(".coin-operate .msg-item")[1] as HTMLElement;
      if (twoCoinsBtn) {
        twoCoinsBtn.dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true }));
      }
    }

    const coinButtoin2 = document.querySelector(".coin-bottom .bi-btn");
    if (!coinButtoin2) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      continue;
    }
    coinButtoin2.dispatchEvent(new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    }));
  }
}

/**
   * 通过 Bilibili API 获取字幕数据
   * 完全绕过 UI 操作，直接调用 API 获取字幕 JSON
   */
async function fetchSubtitleData(): Promise<Array<{ from: number; to: number; content: string }> | null> {
  try {
    // 从页面获取 bvid 和 cid
    const state = (window as any).__INITIAL_STATE__;
    const bvid = state?.bvid || state?.videoData?.bvid;
    const cid = state?.cid || state?.videoData?.cid;

    if (!bvid || !cid) {
      console.log("[BMusic] 未找到 bvid 或 cid");
      return null;
    }

    // 调用 Bilibili 字幕 API（使用用户的 cookie）
    const response = await fetch(
      `https://api.bilibili.com/x/player/v2?bvid=${bvid}&cid=${cid}`,
      { credentials: 'include' }
    );
    const data = await response.json();
    const subtitles = data?.data?.subtitle?.subtitles;

    if (!subtitles || subtitles.length === 0) {
      console.log("[BMusic] 该视频没有字幕数据");
      return null;
    }

    // 下载字幕 JSON 文件（优先选中文）
    let subtitleInfo = subtitles.find((s: any) => s.lan?.includes('zh') || s.lan_doc?.includes('中文'));
    if (!subtitleInfo) subtitleInfo = subtitles[0];

    let subtitleUrl = subtitleInfo.subtitle_url;
    if (subtitleUrl.startsWith('//')) subtitleUrl = 'https:' + subtitleUrl;

    console.log("[BMusic] 正在下载字幕:", subtitleUrl);
    const subResponse = await fetch(subtitleUrl);
    const subData = await subResponse.json();

    if (subData?.body && Array.isArray(subData.body)) {
      console.log(`[BMusic] 成功获取 ${subData.body.length} 条字幕`);
      return subData.body;
    }

    return null;
  } catch (e) {
    console.error("[BMusic] 获取字幕失败:", e);
    return null;
  }
}

/**
 * 自动开启字幕 —— API方案不需要操作UI，但保留作为接口兼容
 */
export function autoEnableSubtitle() {
  // API方案不需要操作UI来开启字幕
  console.log("[BMusic] 使用API方案获取字幕，无需操作UI");
}

/**
 * 监听字幕变化（通过API获取字幕数据 + 轮询视频播放进度匹配）
 */
export function regOnSubtitleChange(func: (text: string) => void) {
  let currentSubtitle = "";
  let subtitleData: Array<{ from: number; to: number; content: string }> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const updateText = (newText: string) => {
    const trimmed = newText.trim();
    if (trimmed !== currentSubtitle) {
      currentSubtitle = trimmed;
      func(trimmed);
    }
  };

  // 轮询视频播放进度，匹配字幕
  const startPolling = () => {
    if (pollTimer) return;
    pollTimer = setInterval(() => {
      if (!subtitleData) return;
      const video = document.querySelector('video');
      if (!video) return;

      const time = video.currentTime;
      const match = subtitleData.find(s => time >= s.from && time <= s.to);
      updateText(match ? match.content : "");
    }, 200);
  };

  // 获取字幕数据 —— 通过注入脚本到主页面上下文
  const loadSubtitles = async () => {
    // 等待页面加载完成
    await new Promise(resolve => setTimeout(resolve, 3000));

    updateText("[诊断] 正在注入字幕获取脚本...");

    // 注入脚本到主页面上下文（绕过 contextIsolation）
    // 该脚本在页面的 JavaScript 上下文中执行，可以访问 __INITIAL_STATE__ 和调用同源 API
    const script = document.createElement('script');
    script.textContent = `
(async function() {
  try {
    var state = window.__INITIAL_STATE__;
    var bvid = state && (state.bvid || (state.videoData && state.videoData.bvid));
    var cid = state && (state.cid || (state.videoData && state.videoData.cid));

    var el = document.createElement('div');
    el.id = '__bmusic_subtitle_data__';
    el.style.display = 'none';

    if (!bvid || !cid) {
      el.dataset.error = 'no_bvid_cid';
      el.dataset.bvid = bvid || '';
      el.dataset.cid = cid || '';
      document.body.appendChild(el);
      return;
    }

    var resp = await fetch('https://api.bilibili.com/x/player/v2?bvid=' + bvid + '&cid=' + cid, { credentials: 'include' });
    var data = await resp.json();
    var subtitles = data && data.data && data.data.subtitle && data.data.subtitle.subtitles;

    if (!subtitles || subtitles.length === 0) {
      el.dataset.error = 'no_subtitles';
      el.dataset.apiResponse = JSON.stringify(data && data.data && data.data.subtitle).substring(0, 200);
      document.body.appendChild(el);
      return;
    }

    var subInfo = subtitles.find(function(s) { return s.lan && s.lan.indexOf('zh') >= 0; }) || subtitles[0];
    var subUrl = subInfo.subtitle_url;
    if (subUrl.indexOf('//') === 0) subUrl = 'https:' + subUrl;

    var subResp = await fetch(subUrl);
    var subData = await subResp.json();

    if (subData && subData.body && Array.isArray(subData.body)) {
      el.dataset.success = 'true';
      el.dataset.count = String(subData.body.length);
      el.textContent = JSON.stringify(subData.body);
    } else {
      el.dataset.error = 'bad_format';
    }
    document.body.appendChild(el);
  } catch(e) {
    var el = document.getElementById('__bmusic_subtitle_data__') || document.createElement('div');
    el.id = '__bmusic_subtitle_data__';
    el.style.display = 'none';
    el.dataset.error = 'exception';
    el.dataset.message = String(e);
    document.body.appendChild(el);
  }
})();
`;
    document.head.appendChild(script);
    document.head.removeChild(script);

    // 轮询等待注入脚本完成（数据写入隐藏 DOM 元素）
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      checkCount++;
      const dataEl = document.getElementById('__bmusic_subtitle_data__');

      if (!dataEl) {
        if (checkCount > 20) { // 10秒超时
          clearInterval(checkInterval);
          updateText("[诊断] 注入脚本超时");
        }
        return;
      }

      clearInterval(checkInterval);

      if (dataEl.dataset.error) {
        updateText(`[诊断] ${dataEl.dataset.error}: ${dataEl.dataset.message || dataEl.dataset.apiResponse || ''} bvid=${dataEl.dataset.bvid || ''}`);

        // 回退到 DOM 观察
        const subtitleObserver = new MutationObserver(() => {
          const subtitleEl = document.querySelector('.bili-subtitle-x-subtitle-panel-text') as HTMLElement;
          const newText = subtitleEl ? (subtitleEl.innerText || subtitleEl.textContent || "").trim() : "";
          if (newText) updateText(newText);
        });
        const videoArea = document.querySelector('.bpx-player-video-area');
        if (videoArea) {
          subtitleObserver.observe(videoArea, { childList: true, characterData: true, subtree: true });
        }
        return;
      }

      if (dataEl.dataset.success === 'true' && dataEl.textContent) {
        try {
          subtitleData = JSON.parse(dataEl.textContent);
          updateText(`[诊断] 成功! ${dataEl.dataset.count}条字幕，开始同步`);
          startPolling();
        } catch (e) {
          updateText(`[诊断] JSON解析失败: ${e}`);
        }
      }
    }, 500);
  };

  loadSubtitles();
}
