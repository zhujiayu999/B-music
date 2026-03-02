# BMusic 🎵

[English](./README_en.md) | [简体中文](./README.md)

一个基于 Electron + Vue 3 + Vite 的多平台背景音乐播放器。支持 **Bilibili** 和 **网易云音乐**。

---

## 🌟 新功能特性 (Enhanced)

在最新的版本中，我们（作者: **z7y**）引入了一系列重磅功能增强：

### 🛠️ 核心增强
- **下一首播放**: 右键菜单一键插队，灵活控制播放顺序。
- **全局快捷键**: 支持主界面及后台全局快捷键（播放/暂停、上下曲、音量调节、歌词切换）。
- **系统媒体控制 (SMTC)**: 完美集成 Windows 媒体中心，支持键盘媒体键及系统音量栏控制。
- **搜索历史**: 自动保存最近 10 条搜索记录，支持快速选择与一键清空。
- **窗口状态记忆**: 自动记录并恢复上次关闭时的窗口位置与大小。

### 🎨 体验优化
- **交互式进度条**: 悬停/拖拽时进度条动态增粗，支持实时时间气泡提示。
- **Cookie 智能同步**: 账户切换与初始化时自动同步登录状态，告别重复登录。
- **极致清理**: 移除了所有冗余的调试代码，运行更轻快。

---

## 📸 界面预览

### 播放器面板
- **B站模式**: 左下角显示标志性小电视。
  ![image](https://github.com/user-attachments/assets/927a0c4f-69cf-4414-bb60-868bf1974650)
- **网易云模式**: 左下角优雅唱片动效。
  ![image](https://github.com/user-attachments/assets/6bca86b1-f610-47fa-8b91-18512f3de09f)

### 全屏互动
- 点击左下角切入全屏，B站支持原片视频播放：
  ![image](https://github.com/user-attachments/assets/9263c154-cc3c-4ef9-8b1f-83e64c307d43)

### 推荐与搜素
- 全平台搜索支持，多源音乐一网打尽：
  ![image](https://github.com/user-attachments/assets/c838cb70-25ef-4461-8c60-aadb159df756)

---

## 📝 开发初衷
因为 B 站有许多优秀的音乐区 UP 主，很多精良的翻唱或原创作品在主流音乐软件上难以寻获。**z7y** 因此心血来潮开发了这款软件，旨在为广大音乐爱好者提供最便捷的跨平台收听体验。

> **注意**: 本软件仅供学习交流使用，请勿用于非法用途。

---

## 👨‍💻 作者
**z7y**

---

## 🚀 快速开始

1. **安装依赖**: `npm install`
2. **开发模式**: `npm run dev`
3. **打包构建**: `npm run build:win`

---

## Latest Updates (2026-03-02)

- Player lifecycle hardening:
  - Added centralized cleanup management for player components.
  - Fixed event/timer cleanup paths to prevent residual listeners during rapid track/page switching.
  - Added unregister support for `musicPlayerLink` request handlers and cleanup on unmount.
- UI interaction leak fixes:
  - Added unmount-safe cleanup for global `mousemove`/`mouseup` listeners in list/nav/slider drag logic.
  - Added cleanup for `WebviewLogin` navigation listeners and lyrics timeupdate listeners.
- Performance improvements:
  - Optimized lyric index lookup to binary search for high-frequency updates.
  - Parallelized account status/profile loading and playlist icon loading.
  - Added incremental rendering for long music lists (chunked append with observer), plus memoized row rendering and `content-visibility`.
- Validation:
  - Passed `npm run typecheck`.
  - Passed `npm run build`.
