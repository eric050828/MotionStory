# MotionStory Android Development Build 建置指南

## 問題說明
- 點擊 "Development Build" → 錯誤：找不到相容的 Development Build
- 選擇 "Expo Go" → 無法運行（因為專案使用 Firebase 等 native dependencies）

## 解決方法：建置專屬的 Development Build APK

### 步驟 1：安裝 EAS CLI
```bash
npm install -g eas-cli
```

### 步驟 2：登入 Expo 帳號
```bash
eas login
```
輸入你的 Expo 帳號和密碼（如果沒有帳號，在 https://expo.dev 註冊）

### 步驟 3：切換到 app 目錄
```bash
cd app
```

### 步驟 4：建置 Development Build APK
```bash
eas build --platform android --profile development
```

⏱️ **建置時間**：約 15-20 分鐘（在雲端建置）

### 步驟 5：下載並安裝 APK
1. 建置完成後，終端機會顯示下載連結
2. 在手機瀏覽器開啟該連結
3. 下載 APK 並安裝到手機
4. **解除安裝通用的 Expo Go app**（不再需要）

### 步驟 6：重新啟動開發伺服器
```bash
cd app
expo start -c
```

### 步驟 7：在手機上執行
1. 開啟剛剛安裝的 **MotionStory Development Build** app
2. 它會自動連接到開發伺服器
3. 現在可以正常開發和測試了

## 重要說明

### Development Build vs Expo Go
- **Expo Go**：通用 app，只能運行簡單專案
- **Development Build**：專門為 MotionStory 建置的 app，包含所有 Firebase 等 native code

### 為什麼需要這樣做？
你的專案使用了這些需要 native code 的套件：
- `@react-native-firebase/app`
- `@react-native-firebase/auth`
- `@react-native-google-signin/google-signin`

這些無法在通用的 Expo Go 中運行。

## 之後的開發流程

每次開發時：
1. 在電腦執行 `expo start -c`
2. 在手機開啟 MotionStory Development Build app
3. 自動連接並載入最新代碼
4. **不需要每次都重新建置 APK**（除非修改了 native dependencies）

## 如果建置失敗

請複製錯誤訊息並回報，常見問題：
- 需要先登入 Expo 帳號
- 網路連線問題
- Android keystore 設定問題（EAS 會自動處理）
