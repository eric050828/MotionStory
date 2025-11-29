# Tamagui 整合除錯指南

本文檔記錄了一系列在整合 Tamagui 到既有 React Native 專案時可能遇到的問題及其解決方案。

## 初始目標

將 Tamagui UI 函式庫應用到 `LoginScreen.tsx` 以改善介面。

---

## 問題一：元件匯入錯誤 (Build-time Error)

- **現象**: 專案建置失敗，出現類似 `Module '"tamagui"' has no exported member 'Button'` 的錯誤。
- **分析**:
    1. 檢查 `package.json`，發現專案除了 `tamagui` 主套件外，還安裝了大量獨立的 `@tamagui/*` 元件套件（如 `@tamagui/button`, `@tamagui/stacks`）。
    2. 這表示專案設定期望從各個獨立的套件中分別匯入元件，而非從 `tamagui` 主套件中統一匯入。
- **解決方案**:
    - 修改使用到 Tamagui 元件的檔案（如 `LoginScreen.tsx`），將 `import { Button, YStack, ... } from 'tamagui'` 的單一匯入方式，改為從各自的套件匯入：
      ```javascript
      import { Button } from '@tamagui/button';
      import { YStack, XStack } from '@tamagui/stacks';
      // ...etc
      ```

---

## 問題二：模組格式衝突 (Build-time Error)

- **現象**: 專案建置失敗，出現 `The current file is a CommonJS module... but the referenced file is an ECMAScript module...` 錯誤。
- **分析**:
    1. 這個錯誤表示專案的打包工具 Metro 在處理模組格式時遇到了衝突 (CJS vs. ESM)。
    2. 檢查 `metro.config.js` 和 `babel.config.js`，發現 `metro.config.js` 的設定可能過於老舊或簡化。
- **解決方案**:
    - 更新 `metro.config.js` 為 Expo 官方推薦的現代設定，確保 `withTamagui` 插件能基於一個正確的基礎設定來運作。
      ```javascript
      // metro.config.js
      const { getDefaultConfig } = require('expo/metro-config');
      const { withTamagui } = require('@tamagui/metro-plugin');

      const config = getDefaultConfig(__dirname, {
        isCSSEnabled: true,
      });

      module.exports = withTamagui(config, {
        components: ['tamagui'],
        config: './tamagui.config.ts',
        outputCSS: './tamagui-web.css',
      });
      ```

---

## 問題三：設定檔格式錯誤 (Build-time Error)

- **現象**: 專案建置失敗，出現 `tamagui.config.ts: You appear to be using a native ECMAScript module configuration file...` 錯誤。
- **分析**:
    1. 這個錯誤表示 `tamagui.config.ts` 使用了 ES Module 語法 (`export`)，但建置流程中的某个環節（如 Babel/Metro 插件）需要用 CommonJS 的方式（`require()`）同步讀取它。
- **解決方案**:
    - 將 `tamagui.config.ts` 的匯出方式從 ES Module 改為 CommonJS。
      ```typescript
      // Before
      export const config = createTamagui({...});

      // After
      const config = createTamagui({...});
      export type AppConfig = typeof config; // 類型匯出可以保留
      module.exports = config; // 主要匯出改為 CJS
      ```

---

## 問題四：找不到設定 (Runtime Error) / 白畫面

- **現象**:
    1. 應用程式可以成功建置，但在執行時立刻崩潰，顯示 `Uncaught Error: Can't find Tamagui configuration`。
    2. 或者，應用程式只顯示白畫面，沒有任何錯誤訊息。
- **分析**:
    1. 此問題表示 `TamaguiProvider` 沒有被正確設定在應用的根部，或者傳遞給它的 `config` 物件不正確。
    2. 透過 `codebase_investigator` 工具深度分析，發現專案的**真實入口點是 `App.tsx`**，它使用的是傳統的 React Navigation。
    3. 而我們之前一直關注的 `app/_layout.tsx` 檔案（Expo Router 的慣例）在目前設定下**完全沒有被使用**，是一個無效的入口點。
    4. 因此，`TamaguiProvider` 被放置在了無效的檔案中，導致整個應用程式都無法獲取 Tamagui 設定。
- **解決方案**:
    - 將 `TamaguiProvider` 及其相關邏輯（字體載入等）從 `app/_layout.tsx` **移動到**專案的真正根檔案 `App.tsx` 中。
      ```tsx
      // App.tsx
      import React, { useEffect } from 'react';
      import { NavigationContainer } from '@react-navigation/native';
      import { useFonts } from 'expo-font';
      import { TamaguiProvider } from 'tamagui';
      import config from './tamagui.config'; // 匯入本地設定
      import RootNavigator from './src/navigation/RootNavigator';

      export default function App() {
        const [loaded] = useFonts({...});

        if (!loaded) {
          return null;
        }

        return (
          // 在應用的最外層用 TamaguiProvider 包裹
          <TamaguiProvider config={config} defaultTheme="light">
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </TamaguiProvider>
        );
      }
      ```

## 最終結論
在整合 Tamagui 這類需要深度介入建置流程的函式庫時，必須先釐清專案的**真實架構**和**入口點**。設定檔（`metro.config.js`, `babel.config.js`）和 Provider 的位置都至關重要。當遇到難解的問題時，回頭確認最基本的檔案結構和執行流程，往往是找到問題根源的關鍵。
