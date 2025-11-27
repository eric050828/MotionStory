# 前端綜合開發文檔：UI/UX 現代化與功能增強

**分支**: `fix/web-google-signin-crash`

## 1. 總覽

本文件詳細記錄了在 `fix/web-google-signin-crash` 分支上進行的一系列重大的前端開發工作。此分支最初的目標是解決 Web 端 Google 登入的閃退問題，但後續擴展為一個全面的 UI/UX 現代化專案。

核心工作包括：
- **UI 框架遷移與重構**: 引入 Tamagui UI 框架，並逐步重構了包括登入、設定、儀表板和時間軸在內的多個核心頁面。
- **主題管理**: 實現了應用程式的淺色/深色主題切換功能，並由狀態管理工具統一控制。
- **響應式佈局**: 對儀表板和時間軸等關鍵頁面進行了響應式設計，提升了在不同螢幕尺寸下的用戶體驗。
- **功能增強與體驗優化**: 大幅改進了時間軸的視覺呈現、儀表板的客製化能力以及個人設定的隱私選項。
- **初始 Bug 修復**: 解決了導致此分支創建的 Web 端 Google 登入閃退問題。

## 2. 開發時間線與提交歷史

以下是按時間倒序排列的完整提交紀錄，詳細說明了每個階段的變更。

### 提交 1：實現響應式佈局與多項 UI 改進

- **Commit**: `ef61ad763741fe64067ae965edbb1f50a165f17e`
- **摘要**: 這是此分支中一個集大成的提交，引入了多項 UI/UX 改進。
  - **響應式設計**: 為 `DashboardStudioScreen` 和 `TimelineScreen` 引入了響應式佈局，使其在不同設備上都能良好顯示。
  - **隱私設定增強**: 在 `SettingsScreen` 中，為位置分享和詳細統計資料添加了切換開關，提升了用戶對隱私的控制力。
  - **時間軸徹底改造**: `TimelineScreen` 的 UI 被完全重做，引入了中心線、時間點、更清晰的事件卡片、下拉刷新以及空狀態和錯誤狀態的處理，極大提升了視覺效果和互動性。
  - **類型擴展**: 為 `TimelineEvent` 類型增加了 `location` 屬性。
- **變更的檔案**:
  - `app/src/components/Card/TimelineEventCard.tsx`
  - `app/src/screens/dashboard/DashboardStudioScreen.tsx`
  - `app/src/screens/profile/SettingsScreen.tsx`
  - `app/src/screens/timeline/TimelineScreen.tsx`
  - `app/src/types/timeline.ts`

### 提交 2：實現主題管理功能

- **Commit**: `13b3846b771c54a82a283980d89b066eacf37cfb`
- **摘要**: 此提交引入了應用的主題管理（淺色/深色模式）。
  - **狀態管理**: 創建了 `useThemeStore` (Zustand)，用於在全局範圍內管理和持久化用戶的主題偏好。
  - **UI 集成**: 在 `SettingsScreen` 中添加了 UI 控制項，允許用戶切換主題。`App.tsx` 和其他相關頁面被更新以響應主題變化。
- **變更的檔案**:
  - `app/App.tsx`
  - `app/src/screens/dashboard/DashboardStudioScreen.tsx`
  - `app/src/screens/profile/SettingsScreen.tsx`
  - `app/src/store/useThemeStore.ts`

### 提交 3：重構設定頁面佈局與 UI

- **Commit**: `59a3e883619087cce16883f946375c82770d4b8b`
- **摘要**: 專注於改進 `SettingsScreen` 的使用者介面。
  - **佈局重構**: 對設定頁面的佈局進行了大幅調整，使其結構更清晰、更易於導航。
  - **隱私設定 UI 優化**: 隱私設定相關的 UI 元素（如切換開關）得到了改進，使其更直觀。
- **變更的檔案**:
  - `app/src/screens/profile/SettingsScreen.tsx`
  - `app/src/types/navigation.ts`

### 提交 4：增強時間軸與運動列表頁面

- **Commit**: `1a34c4c0727ebe2308a0ad5a62d32a066f9710e3`
- **摘要**: 此提交對時間軸和運動相關頁面進行了多項 UI/UX 增強。
  - **時間軸改進**: `TimelineScreen` 採用了新的垂直時間軸佈局，事件卡片沿中心線對齊。
  - **運動表單/列表重構**: `WorkoutFormScreen` 和 `WorkoutListScreen` 的程式碼和 UI 被大量重構，以提供更流暢的用戶體驗。
- **變更的檔案**:
  - `app/src/navigation/MainNavigator.tsx`
  - `app/src/screens/WorkoutFormScreen.tsx`
  - `app/src/screens/workouts/WorkoutListScreen.tsx`
  - `app/src/types/navigation.ts`
  - `app/src/types/workout.ts`

### 提交 5：改造儀表板工作室 UI 並修復圖片快取

- **Commit**: `5d8770c3a90d7f34ec10348137b03e02bfafd611`
- **摘要**: 對 `DashboardStudioScreen` 進行了重大的 UI/UX 改造。
  - **UI 改造**: 舊的儀表板佈局被一個更現代、基於網格的系統所取代，允許用戶拖放和調整小工具的大小。
  - **圖片快取修復**: 修復了之前存在的圖片快取問題，確保用戶頭像等圖片能被正確加載和更新。
- **變更的檔案**:
  - `app/package-lock.json`, `app/package.json`
  - `app/src/screens/dashboard/DashboardStudioScreen.tsx`
  - `app/src/utils/imageCache.tsx` (檔案被重命名)

### 提交 6：重構個人資料導航與主題更新

- **Commit**: `53b494003656241bdbafa232851d35c1aa3511cd`
- **摘要**: 調整了導航結構並更新了應用主題。
  - **導航重構**: 將個人資料（Profile）及其相關子頁面從主導航移至一個專用的堆疊導航中，簡化了主 Tab 欄。
  - **主題與登入頁面更新**: `tamagui.config.ts` 中的主題顏色被更新，`LoginScreen` 也進行了相應的調整。
- **變更的檔案**:
  - `app/App.tsx`
  - `app/package-lock.json`, `app/package.json`
  - `app/src/screens/LoginScreen.tsx`
  - `app/tamagui.config.ts`

### 提交 7：使用 Tamagui 重構登入頁面並解決配置問題

- **Commit**: `edd79758936e543dd2cef3c6e3d1b74284eb5d1c`
- **摘要**: 這是引入 Tamagui 框架的關鍵一步。
  - **UI 框架引入**: `LoginScreen` 的 UI 完全使用 Tamagui 組件進行了重寫，帶來了現代化的外觀。
  - **配置與除錯**: 解決了在集成 Tamagui 過程中遇到的多個配置挑戰，例如 `metro.config.js` 的模組解析問題，並添加了 `TAMAGUI_DEBUG_GUIDE.md` 來記錄解決方案。
- **變更的檔案**:
  - `app/App.tsx`, `app/app.json`, `app/app/_layout.tsx`
  - `app/babel.config.js`, `app/tamagui.config.ts`, `app/tsconfig.json`
  - `app/package-lock.json`, `app/package.json`
  - `app/src/screens/LoginScreen.tsx`
  - `app/TAMAGUI_DEBUG_GUIDE.md` (新文件)

### 提交 8：修復 Web 端 Google 登入閃退問題

- **Commit**: `cc3203415ff2f34213b52e540b79f83c7881c071`
- **摘要**: 此提交解決了此分支最初要修復的問題。
  - **問題**: 在 Web 環境中，調用 Google 登入的原生模組會導致應用崩潰。
  - **修復方案**: 通過條件判斷，在 Web 平台上使用 `@react-oauth/google` 函式庫作為替代方案，而在原生平台（iOS/Android）上則繼續使用原生模組。這確保了跨平台的兼容性。
- **變更的檔案**:
  - `app/src/screens/LoginScreen.tsx`

---