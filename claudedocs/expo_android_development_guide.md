# Expo Android 開發完整指南

> **研究日期**: 2025-11-09
> **Expo SDK 版本**: 51.x
> **信心等級**: ⭐⭐⭐⭐⭐ (90% - 基於官方文檔與社群驗證)

---

## 📋 目錄

1. [核心概念](#核心概念)
2. [Continuous Native Generation (CNG)](#continuous-native-generation-cng)
3. [Android Gradle 配置](#android-gradle-配置)
4. [常見建置錯誤與解決方案](#常見建置錯誤與解決方案)
5. [最佳實踐](#最佳實踐)
6. [參考資源](#參考資源)

---

## 核心概念

### Expo SDK 51 概述

**發布時間**: 2024年5月
**技術棧**:
- React Native 0.74
- React 18.2.0
- Gradle 8.8+
- Android Gradle Plugin (AGP) 8.x

**重大改進**:
- New Architecture 支援（Bridgeless 模式）
- 幾乎所有 Expo 模組都支援 New Architecture
- 改進的 Prebuild 工作流程

---

## Continuous Native Generation (CNG)

### 什麼是 CNG?

CNG 將原生專案（`android/` 和 `ios/`）視為**短期產物**而非長期維護的原始碼。

**核心理念**:
```
app.json ≈ package.json
android/ 與 ios/ ≈ node_modules/
```

### CNG 工作流程

```bash
# 1. 生成原生專案
npx expo prebuild

# 2. 清理並重新生成
npx expo prebuild --clean

# 3. 針對特定平台
npx expo prebuild --platform android --clean
```

### 五大核心組件

1. **App Config** (`app.json` 或 `app.config.js`)
   - 聲明專案規格
   - 替代手動配置原生專案

2. **Prebuild 命令參數**
   - `--clean`: 清理並重新生成
   - `--platform`: 指定平台
   - `--template`: 自訂模板

3. **Expo SDK 版本**
   - 決定使用的模板版本
   - 影響可用功能

4. **Autolinking**
   - 自動連結原生模組
   - 無需手動修改 Gradle 或 Podfile

5. **Native Subscribers**
   - 最小化入口檔案副作用

### Git 最佳實踐

**✅ 應該 commit**:
```gitignore
# app.json
# package.json
# app.config.js
```

**❌ 不應該 commit** (加入 `.gitignore`):
```gitignore
/android/
/ios/
.expo/
```

**為什麼?**
- `android/` 和 `ios/` 是**生成的產物**
- Prebuild 會根據 `app.json` 重新生成
- 避免版本衝突和合併問題

---

## Android Gradle 配置

### 檔案結構

```
android/
├── build.gradle              # 專案級 Gradle 配置
├── settings.gradle           # 專案設定和插件管理
├── gradle.properties         # Gradle 屬性
├── gradle/
│   └── wrapper/
│       └── gradle-wrapper.properties
└── app/
    └── build.gradle         # 應用級 Gradle 配置
```

### settings.gradle 配置

**關鍵配置**:

```groovy
pluginManagement {
  // React Native Gradle 插件
  includeBuild(new File(["node", "--print",
    "require.resolve('@react-native/gradle-plugin/package.json')"
  ].execute(null, rootDir).text.trim()).getParentFile())

  // Expo 模組 Gradle 插件 (SDK 51+)
  def autolinkingPath = ["node", "--print",
    "require.resolve('expo-modules-autolinking/package.json', { paths: [require.resolve('expo/package.json')] })"
  ]
  // 插件路徑通過 autolinking 自動管理
}

// 應用 Expo 自動連結
apply from: new File(["node", "--print",
  "require.resolve('expo/package.json')"
].execute(null, rootDir).text.trim(), "../scripts/autolinking.gradle")
useExpoModules()
```

### build.gradle (專案級)

```groovy
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 23
        compileSdkVersion = 34
        targetSdkVersion = 34
        kotlinVersion = "1.9.23"
        ndkVersion = "26.1.10909125"
    }

    repositories {
        google()
        mavenCentral()
    }

    dependencies {
        classpath('com.android.tools.build:gradle')
        classpath('com.facebook.react:react-native-gradle-plugin')
        classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')
    }
}
```

### build.gradle (應用級)

**Metro 模組解析配置**:

```groovy
def projectRoot = rootDir.getAbsoluteFile().getParentFile().getAbsolutePath()

react {
    // 使用 Expo CLI 進行打包
    entryFile = file(["node", "-e",
      "require('expo/scripts/resolveAppEntry')",
      projectRoot, "android", "absolute"
    ].execute(null, rootDir).text.trim())

    // 使用 Expo CLI 作為打包工具
    cliFile = new File(["node", "--print",
      "require.resolve('@expo/cli', { paths: [require.resolve('expo/package.json')] })"
    ].execute(null, rootDir).text.trim())

    bundleCommand = "export:embed"
}
```

### gradle.properties 關鍵屬性

```properties
# Android 配置
android.useAndroidX=true
android.enableJetifier=true
android.compileSdkVersion=34
android.targetSdkVersion=34
android.buildToolsVersion=34.0.0

# React Native
newArchEnabled=false
hermesEnabled=true

# Expo 特定
expo.gif.enabled=true
expo.webp.enabled=true
expo.webp.animated=false
EX_DEV_CLIENT_NETWORK_INSPECTOR=true
expo.useLegacyPackaging=false

# 效能優化
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.daemon=true
org.gradle.parallel=true
```

### expo-build-properties 插件

在 `app.json` 中配置:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 34,
            "targetSdkVersion": 34,
            "buildToolsVersion": "34.0.0",
            "minSdkVersion": 23
          },
          "ios": {
            "deploymentTarget": "15.1"
          }
        }
      ]
    ]
  }
}
```

---

## 常見建置錯誤與解決方案

### 錯誤 1: expo-module-gradle-plugin 找不到

**錯誤訊息**:
```
Plugin [id: 'expo-module-gradle-plugin'] was not found in any of the following sources
```

**根本原因**:
- `settings.gradle` 中缺少 Expo 模組插件路徑配置
- Expo SDK 51/52 的 autolinking 機制變更

**解決方案 A**: 重新執行 Prebuild (推薦)

```bash
# 1. 刪除 android 資料夾
rm -rf android/

# 2. 清理並重新生成
npx expo prebuild --clean --platform android

# 3. 驗證 settings.gradle
cat android/settings.gradle | grep "useExpoModules"
```

**解決方案 B**: 手動修復 settings.gradle

確保包含:
```groovy
apply from: new File(["node", "--print",
  "require.resolve('expo/package.json')"
].execute(null, rootDir).text.trim(), "../scripts/autolinking.gradle")
useExpoModules()
```

### 錯誤 2: SoftwareComponent 'release' 屬性錯誤

**錯誤訊息**:
```
Could not get unknown property 'release' for SoftwareComponent container
```

**根本原因**:
- `expo-modules-core` 與 AGP 8.x 版本不兼容
- Expo SDK 版本過舊

**解決方案**:

```bash
# 1. 更新到最新的 Expo SDK 51 版本
npx expo install expo@latest

# 2. 更新所有 Expo 套件
npx expo install --fix

# 3. 清理並重建
npx expo prebuild --clean --platform android
```

### 錯誤 3: expo-localization 依賴衝突 (SDK 52)

**錯誤訊息**:
```
Plugin [id: 'expo-module-gradle-plugin'] was not found
(與 expo-localization 16.1.0+ 相關)
```

**根本原因**:
- `expo-localization` 16.1.0+ 為支援 Xcode 26 而引入的變更破壞了 Android 建置

**解決方案**:

```json
// package.json
{
  "dependencies": {
    "expo-localization": "16.0.1"
  },
  "resolutions": {
    "expo-localization": "16.0.1"
  }
}
```

```bash
# 清理並重新安裝
rm -rf node_modules package-lock.json
npm install
npx expo prebuild --clean
```

### 錯誤 4: Gradle 版本不兼容

**症狀**:
- 建置失敗但無明確錯誤訊息
- Gradle daemon 問題

**解決方案**:

```bash
# 1. 檢查 Gradle 版本
cd android && ./gradlew --version

# 2. 更新 Gradle Wrapper
./gradlew wrapper --gradle-version=8.8 --distribution-type=all

# 3. 清理 Gradle 緩存
./gradlew clean
./gradlew cleanBuildCache

# 4. 重新建置
cd .. && npx expo run:android
```

### 通用除錯步驟

**步驟 1**: 驗證環境
```bash
npx expo-doctor
npx expo install --check
```

**步驟 2**: 清理所有緩存
```bash
# NPM/Yarn 緩存
npm cache clean --force
# 或
yarn cache clean

# Metro bundler 緩存
npx expo start --clear

# Gradle 緩存
cd android && ./gradlew clean
```

**步驟 3**: 完整重置
```bash
# 1. 刪除所有生成的檔案
rm -rf node_modules android ios .expo

# 2. 重新安裝
npm install

# 3. 重新生成原生專案
npx expo prebuild --clean

# 4. 啟動
npx expo run:android
```

---

## 最佳實踐

### 1. 使用 Config Plugins 而非手動編輯

**❌ 錯誤做法**:
```bash
# 手動編輯 android/app/build.gradle
vim android/app/build.gradle
```

**✅ 正確做法**:
```javascript
// app.config.js
export default {
  expo: {
    plugins: [
      [
        'my-custom-plugin',
        {
          // 配置選項
        }
      ]
    ]
  }
}
```

### 2. Prebuild 工作流程

```bash
# 開發流程
npx expo prebuild          # 首次生成
npm run android            # 執行

# 變更配置後
npx expo prebuild --clean  # 重新生成
npm run android            # 執行

# 生產建置
eas build --platform android
```

### 3. 依賴管理

**使用 `expo install` 而非 `npm install`**:

```bash
# ❌ 不推薦
npm install expo-camera

# ✅ 推薦
npx expo install expo-camera
```

**為什麼?**
- `expo install` 確保版本兼容性
- 自動安裝 peer dependencies
- 避免版本衝突

### 4. 版本檢查與更新

```bash
# 檢查過時的套件
npx expo install --check

# 修復版本問題
npx expo install --fix

# 診斷專案
npx expo-doctor
```

### 5. EAS Build 整合

**app.json 配置**:

```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.yourapp",
      "versionCode": 1
    },
    "plugins": [
      "expo-router",
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 34,
            "targetSdkVersion": 34
          }
        }
      ]
    ]
  }
}
```

**eas.json 配置**:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug",
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "gradleCommand": ":app:bundleRelease"
      }
    }
  }
}
```

### 6. 效能優化

**gradle.properties 優化**:

```properties
# 增加 JVM 記憶體
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m

# 啟用並行建置
org.gradle.parallel=true

# 啟用 Gradle daemon
org.gradle.daemon=true

# 按需配置
org.gradle.configureondemand=true

# 啟用建置緩存
org.gradle.caching=true
```

### 7. 安全性最佳實踐

**不要 commit 敏感資訊**:

```gitignore
# .gitignore
/android/
/ios/
.expo/
*.keystore
*.jks
google-services.json  # 除非使用環境特定版本
```

**使用環境變數**:

```javascript
// app.config.js
export default {
  expo: {
    android: {
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON
    }
  }
}
```

---

## 參考資源

### 官方文檔

| 資源 | URL | 描述 |
|------|-----|------|
| Expo 官方文檔 | https://docs.expo.dev/ | 完整文檔 |
| Prebuild 指南 | https://docs.expo.dev/workflow/prebuild/ | CNG 核心概念 |
| Config Plugins | https://docs.expo.dev/config-plugins/ | 插件開發指南 |
| EAS Build | https://docs.expo.dev/build/introduction/ | 雲端建置服務 |
| Build Properties | https://docs.expo.dev/versions/latest/sdk/build-properties/ | 建置屬性配置 |

### 問題追蹤

| 問題類型 | GitHub Issue | 狀態 |
|----------|--------------|------|
| expo-module-gradle-plugin 錯誤 | #38350 | 已知問題 (SDK 52) |
| expo-localization 衝突 | #38350 | 需降級至 16.0.1 |
| Gradle 8 兼容性 | #23023 | 已修復 (SDK 51+) |

### 社群資源

- **Expo Discord**: https://chat.expo.dev/
- **React Native Directory**: https://reactnative.directory/
- **Stack Overflow**: Tag `expo` + `android`

---

## 故障排除檢查清單

### 建置失敗時的檢查順序

- [ ] **步驟 1**: 執行 `npx expo-doctor` 檢查環境
- [ ] **步驟 2**: 執行 `npx expo install --check` 檢查依賴版本
- [ ] **步驟 3**: 刪除 `android/` 資料夾
- [ ] **步驟 4**: 執行 `npx expo prebuild --clean --platform android`
- [ ] **步驟 5**: 檢查 `settings.gradle` 是否包含 `useExpoModules()`
- [ ] **步驟 6**: 驗證 Gradle 版本 (應為 8.8+)
- [ ] **步驟 7**: 清理緩存: `rm -rf node_modules && npm install`
- [ ] **步驟 8**: 嘗試使用 `eas build` 而非本機建置

### 環境驗證

```bash
# 檢查 Node.js 版本 (推薦 18.x 或 20.x)
node --version

# 檢查 Java 版本 (需要 JDK 17)
java -version

# 檢查 Android SDK
echo $ANDROID_HOME
adb version

# 檢查 Expo CLI
npx expo --version

# 完整診斷
npx expo-doctor
```

---

## 總結

### 核心要點

1. **CNG 是關鍵**: 將 `android/` 視為生成產物,不要手動編輯
2. **使用 Prebuild**: `npx expo prebuild --clean` 解決大多數配置問題
3. **Config Plugins**: 所有自訂配置都應通過插件實現
4. **版本管理**: 使用 `expo install` 確保兼容性
5. **Git 策略**: 永遠 gitignore `android/` 和 `ios/`

### 快速參考命令

```bash
# 初始設置
npx create-expo-app my-app
cd my-app

# 生成原生專案
npx expo prebuild

# 執行 Android
npx expo run:android

# 變更配置後重新生成
npx expo prebuild --clean --platform android

# 診斷問題
npx expo-doctor
npx expo install --check

# 雲端建置
eas build --platform android
```

---

**文檔版本**: v1.0
**最後更新**: 2025-11-09
**維護者**: Claude (Anthropic)
**信心評分**: 90% (基於官方文檔與已驗證的社群解決方案)
