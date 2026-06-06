# 华为 Nova 4e 安装指南

本应用支持两种在手机上安装的方式，均适用于华为 Nova 4e（Android）。

---

## 方式一：添加到桌面（推荐，最简单）

无需安装 APK，用浏览器打开网站后添加到主屏幕，图标和独立 App 一样使用。

1. 用手机连接 **Wi‑Fi 或移动数据**（需能访问服务器）
2. 打开 **Chrome** 或 **华为浏览器**
3. 地址栏输入：`http://39.105.176.96:3005`
4. 添加到桌面：
   - **Chrome**：右上角 `⋮` → **添加到主屏幕** / **安装应用**
   - **华为浏览器**：菜单 → **添加至** → **桌面**
5. 桌面会出现 **「卡片盒」** 图标，点开即可全屏使用

> 数据保存在本机，并通过服务器与其他设备同步。请先在 **设置 → 同步到服务器** 确认同步正常。

---

## 方式二：安装 APK（独立安装包）

适合希望像普通 App 一样安装、不依赖浏览器书签的用户。

### 在电脑上打包 APK（需 Android Studio）

1. 安装 [Android Studio](https://developer.android.com/studio)（含 Android SDK）
2. 在项目目录执行：

```bash
npm install
npm run build:app
npx cap sync android
npx cap open android
```

3. 在 Android Studio 中：**Build → Build Bundle(s) / APK(s) → Build APK(s)**
4. 生成的 APK 路径一般为：  
   `android/app/build/outputs/apk/debug/app-debug.apk`

### 传到 Nova 4e 并安装

1. 将 `app-debug.apk` 传到手机（微信、数据线、网盘均可）
2. 打开 APK，若提示 **禁止安装未知来源**：
   - **设置 → 安全 → 更多安全设置 → 安装外部来源应用**
   - 允许对应来源（如文件管理器）
3. 安装完成后打开 **卢曼卡片盒**

APK 版会连接服务器 `http://39.105.176.96:3005` 做同步；离线时仍可读写本机卡片。

---

## 常见问题

| 问题 | 处理 |
|------|------|
| 打不开网站 | 检查网络；确认服务器 3005 端口可访问 |
| 同步失败 | 设置页点「同步到服务器」；需联网 |
| 添加到桌面没有图标 | 换 Chrome 试；或清除浏览器缓存后重试 |
| APK 安装被拦截 | 在系统设置里允许「未知来源」安装 |

---

## 修改服务器地址（APK 版）

编辑项目根目录 `.env.app` 中的 `VITE_SYNC_API_BASE`，然后重新执行 `npm run build:app` 与 `npx cap sync android` 再打包。
