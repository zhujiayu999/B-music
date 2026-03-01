# BMusic 🎵

[English](./README_en.md) | [简体中文](./README.md)

A multi-platform background music player based on Electron + Vue 3 + Vite. Supports **Bilibili** and **Netease Cloud Music**.

---

## 🌟 New Features (Enhanced)

In the latest version, we (Author: **z7y**) have introduced a series of major feature enhancements:

### 🛠️ Core Enhancements
- **Play Next**: Queue songs instantly via the right-click menu, flexibly controlling your playback order.
- **Global Shortcuts**: Support for both foreground and background global shortcuts (Play/Pause, Prev/Next, Volume +/- , Lyrics Toggle).
- **System Media Controls (SMTC)**: Perfectly integrated with the Windows Media Center, supporting keyboard media keys and system volume bar controls.
- **Search History**: Automatically saves the last 10 search records with quick selection and a "clear all" button.
- **Window State Memory**: Automatically records and restores the window position and size from your last session.

### 🎨 Experience Optimizations
- **Interactive Progress Bar**: The bar expands dynamically on hover/drag (0.2rem → 0.35rem) with real-time time tooltip bubbles.
- **Smart Cookie Sync**: Automatically synchronizes login status during account switching or initialization, eliminating the need for repeated logins.
- **Extreme Cleanup**: Removed all redundant debug code for a lighter and faster experience.

---

## 📸 Interface Preview

### Player Panel
- **Bilibili Mode**: Iconic small TV icon in the bottom left.
  ![image](https://github.com/user-attachments/assets/927a0c4f-69cf-4414-bb60-868bf1974650)
- **Netease Mode**: Elegant record animation in the bottom left.
  ![image](https://github.com/user-attachments/assets/6bca86b1-f610-47fa-8b91-18512f3de09f)

### Full-Screen Interaction
- Click the bottom left to enter full-screen mode. Bilibili supports original video playback:
  ![image](https://github.com/user-attachments/assets/9263c154-cc3c-4ef9-8b1f-83e64c307d43)

### Recommendations & Search
- Multi-platform search support to find all your favorite music in one place:
  ![image](https://github.com/user-attachments/assets/c838cb70-25ef-4461-8c60-aadb159df756)

---

## 📝 Background
As Bilibili hosts many talented music creators, many high-quality covers or original works are hard to find on mainstream music platforms. **z7y** developed this software on a whim to provide music lovers with the most convenient cross-platform listening experience.

> **Note**: This software is for educational and exchange purposes only. Please do not use it for illegal purposes.

---

## 👨‍💻 Author
**z7y**

---

## 🚀 Quick Start

1. **Install Dependencies**: `npm install`
2. **Dev Mode**: `npm run dev`
3. **Build**: `npm run build:win`
