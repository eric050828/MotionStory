# MotionStory Deployment Guide

完整的生產環境部署指南，涵蓋 Backend API (Render.com)、MongoDB Atlas、Cloudflare R2、以及 Mobile App (EAS Build)。

## 目錄

1. [系統架構](#系統架構)
2. [前置準備](#前置準備)
3. [MongoDB Atlas 設定](#mongodb-atlas-設定)
4. [Cloudflare R2 設定](#cloudflare-r2-設定)
5. [Firebase Authentication 設定](#firebase-authentication-設定)
6. [Render.com 部署](#rendercom-部署)
7. [環境變數配置](#環境變數配置)
8. [MongoDB Indexes 初始化](#mongodb-indexes-初始化)
9. [Mobile App (EAS Build)](#mobile-app-eas-build)
10. [CI/CD 自動化](#cicd-自動化)
11. [監控與維護](#監控與維護)
12. [故障排除](#故障排除)

---

## 系統架構

```
┌─────────────────┐
│  Mobile App     │
│  (Expo/React    │
│   Native)       │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐      ┌──────────────┐
│  FastAPI        │      │  Firebase    │
│  Backend        │◄────►│  Auth        │
│  (Render.com)   │      └──────────────┘
└────────┬────────┘
         │
    ┌────┴────┬──────────┐
    │         │          │
    ↓         ↓          ↓
┌────────┐ ┌────────┐ ┌────────┐
│MongoDB │ │Cloudflare│ │GitHub  │
│Atlas   │ │   R2    │ │Actions │
│(Free)  │ │(Storage)│ │  (CI)  │
└────────┘ └────────┘ └────────┘
```

**技術棧**:
- **Backend**: FastAPI + Python 3.11
- **Database**: MongoDB Atlas (Free M0 tier, 512MB)
- **Storage**: Cloudflare R2 (Free tier, 10GB/month)
- **Auth**: Firebase Authentication
- **Hosting**: Render.com (Free tier, 512MB RAM)
- **Mobile**: React Native + Expo
- **CI/CD**: GitHub Actions

---

## 前置準備

### 必要帳號

1. **MongoDB Atlas** (免費): https://www.mongodb.com/cloud/atlas/register
2. **Cloudflare** (免費): https://dash.cloudflare.com/sign-up
3. **Firebase** (免費): https://console.firebase.google.com/
4. **Render.com** (免費): https://dashboard.render.com/register
5. **Expo** (免費): https://expo.dev/signup

### 開發工具

```bash
# 安裝 Node.js (v18+) 和 Python (3.11+)
node -v  # v18.0.0+
python -v  # 3.11.0+

# 安裝 Expo CLI
npm install -g eas-cli

# 安裝 MongoDB CLI (optional)
brew install mongodb-atlas-cli  # macOS
```

---

## MongoDB Atlas 設定

### Step 1: 建立 Cluster

1. 登入 [MongoDB Atlas](https://cloud.mongodb.com/)
2. 點選 "Create" → "Deploy a database cluster"
3. 選擇 **M0 Free tier**
4. Region: 選擇 **Singapore** (ap-southeast-1) - 靠近目標使用者
5. Cluster Name: `motionstory-cluster`
6. 點選 "Create Cluster"

### Step 2: 設定網路存取

1. 進入 "Network Access" (左側選單)
2. 點選 "Add IP Address"
3. 選擇 **"Allow access from anywhere"** (0.0.0.0/0)
   - 注意: 生產環境建議限制 Render.com 的 IP 範圍
4. 點選 "Confirm"

### Step 3: 建立資料庫使用者

1. 進入 "Database Access" (左側選單)
2. 點選 "Add New Database User"
3. 設定:
   - Authentication Method: **Password**
   - Username: `motionstory_admin`
   - Password: 自動生成 (儲存此密碼)
   - Database User Privileges: **Read and write to any database**
4. 點選 "Add User"

### Step 4: 取得連線字串

1. 進入 "Database" (左側選單)
2. 點選 Cluster 的 "Connect" 按鈕
3. 選擇 "Connect your application"
4. Driver: **Python**, Version: **3.12 or later**
5. 複製連線字串:
   ```
   mongodb+srv://motionstory_admin:<password>@motionstory-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. 將 `<password>` 替換為實際密碼
7. 儲存此字串至 `.env` 檔案的 `MONGODB_URI`

---

## Cloudflare R2 設定

### Step 1: 建立 R2 Bucket

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左側選單選擇 **R2**
3. 點選 "Create bucket"
4. Bucket name: `motionstory-bucket`
5. Location: **Automatic** (Cloudflare 自動選擇最佳位置)
6. 點選 "Create bucket"

### Step 2: 設定 CORS 規則

1. 進入 `motionstory-bucket` 設定
2. 點選 "Settings" → "CORS policy"
3. 新增 CORS 規則:
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
4. 儲存設定

### Step 3: 建立 API Token

1. 點選 "Manage R2 API Tokens"
2. 點選 "Create API token"
3. 設定:
   - Token name: `motionstory-api-token`
   - Permissions: **Object Read & Write**
   - Bucket: `motionstory-bucket`
   - TTL: **Forever** (生產環境建議定期輪換)
4. 點選 "Create API Token"
5. 複製並儲存:
   - Access Key ID → `R2_ACCESS_KEY`
   - Secret Access Key → `R2_SECRET_KEY`
   - Account ID → `R2_ACCOUNT_ID`

### Step 4: 設定公開存取 (可選)

1. 進入 bucket 設定
2. 點選 "Settings" → "Public access"
3. 開啟 "Allow public access"
4. 設定 custom domain (可選):
   - Domain: `cdn.motionstory.com`
   - 依照 Cloudflare 指示設定 DNS CNAME

---

## Firebase Authentication 設定

### Step 1: 建立 Firebase 專案

1. 進入 [Firebase Console](https://console.firebase.google.com/)
2. 點選 "Add project"
3. Project name: `MotionStory`
4. 停用 Google Analytics (可選)
5. 點選 "Create project"

### Step 2: 啟用 Authentication

1. 左側選單選擇 **Authentication**
2. 點選 "Get started"
3. 啟用登入方式:
   - **Email/Password**: 開啟
   - **Google**: 開啟 (可選)
   - **Apple**: 開啟 (可選, iOS 必要)

### Step 3: 新增 Mobile App

1. 進入 "Project settings" (齒輪圖示)
2. 點選 "Add app"
3. 選擇 **iOS** 和 **Android**
4. 依照步驟註冊 App:
   - iOS Bundle ID: `com.motionstory.app`
   - Android Package Name: `com.motionstory.app`
5. 下載配置檔:
   - iOS: `GoogleService-Info.plist`
   - Android: `google-services.json`
6. 放置於專案對應位置:
   ```
   app/ios/GoogleService-Info.plist
   app/android/app/google-services.json
   ```

### Step 4: 取得 Service Account 金鑰

1. 進入 "Project settings" → "Service accounts"
2. 點選 "Generate new private key"
3. 下載 JSON 檔案 (`firebase-adminsdk-xxxxx.json`)
4. 從 JSON 檔案提取:
   ```json
   {
     "project_id": "your-project-id",
     "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   }
   ```
5. 設定環境變數:
   - `FIREBASE_PROJECT_ID` → `project_id`
   - `FIREBASE_CLIENT_EMAIL` → `client_email`
   - `FIREBASE_PRIVATE_KEY` → `private_key`

---

## Render.com 部署

### Step 1: 建立 Web Service

1. 登入 [Render Dashboard](https://dashboard.render.com/)
2. 點選 "New +" → "Web Service"
3. 連結 GitHub repository: `your-username/MotionStory`
4. 設定:
   - Name: `motionstory-api`
   - Region: **Singapore** (asia-southeast1)
   - Branch: `main`
   - Root Directory: `api`
   - Environment: **Docker**
   - Instance Type: **Free** (512MB RAM, 0.1 CPU)

### Step 2: 設定環境變數

在 Render Dashboard → Environment 頁面新增:

```bash
MONGODB_URI=mongodb+srv://...
DB_NAME=motionstory
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY=your-access-key
R2_SECRET_KEY=your-secret-key
R2_BUCKET_NAME=motionstory-bucket
JWT_SECRET_KEY=<auto-generate>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7
ENVIRONMENT=production
DEBUG=False
```

### Step 3: 部署

1. 點選 "Create Web Service"
2. Render 會自動:
   - 從 GitHub 拉取程式碼
   - 使用 `api/Dockerfile` 建立 Docker image
   - 部署至 Singapore region
   - 設定 HTTPS (自動 SSL 憑證)

3. 部署完成後，URL 為:
   ```
   https://motionstory-api.onrender.com
   ```

### Step 4: 驗證部署

```bash
# 檢查健康狀態
curl https://motionstory-api.onrender.com/health

# 預期回應:
# {"status": "healthy", "version": "1.0.0"}
```

### Step 5: 設定自動部署

1. 進入 Service 設定 → "Settings"
2. 開啟 "Auto-Deploy": **Yes**
3. 每次 push 到 `main` branch 會自動觸發部署

---

## 環境變數配置

### Local Development (.env)

```bash
# 複製範本
cp .env.example .env

# 編輯 .env 填入實際值
nano .env
```

### Production (Render.com)

在 Render Dashboard 設定所有環境變數 (見上方 Step 2)

### 環境變數驗證

```python
# api/src/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URI: str
    DB_NAME: str
    FIREBASE_PROJECT_ID: str
    FIREBASE_CLIENT_EMAIL: str
    FIREBASE_PRIVATE_KEY: str
    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY: str
    R2_SECRET_KEY: str
    R2_BUCKET_NAME: str
    JWT_SECRET_KEY: str
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## MongoDB Indexes 初始化

### 自動執行 (CI/CD)

GitHub Actions 會在部署完成後自動執行 `scripts/init_indexes.py`

### 手動執行

```bash
# 本地執行 (需先設定 .env)
cd /path/to/MotionStory
python scripts/init_indexes.py

# 預期輸出:
# ============================================================
# MongoDB Index Initialization
# ============================================================
# Database: motionstory
# ...
# [users] Created 2 new indexes
# [workouts] Created 4 new indexes
# [achievements] Created 2 new indexes
# ...
# ✓ All indexes verified successfully
```

### 驗證索引

```bash
# 使用 MongoDB Atlas UI
1. 登入 MongoDB Atlas
2. 進入 Cluster → Collections
3. 選擇 database: motionstory
4. 檢查每個 collection 的 Indexes 頁籤

# 使用 MongoDB Shell
mongosh "mongodb+srv://cluster.mongodb.net/" --username motionstory_admin

use motionstory
db.users.getIndexes()
db.workouts.getIndexes()
```

---

## Mobile App (EAS Build)

### Step 1: 安裝 EAS CLI

```bash
npm install -g eas-cli

# 登入 Expo 帳號
eas login
```

### Step 2: 設定 EAS Build

```bash
cd app

# 初始化 EAS (如果尚未設定)
eas build:configure

# 檢查 eas.json 配置
cat eas.json
```

### Step 3: 建立 Development Build

```bash
# iOS Simulator
eas build --profile development --platform ios

# Android Emulator
eas build --profile development --platform android
```

### Step 4: 建立 Preview Build (測試)

```bash
# iOS (TestFlight)
eas build --profile preview --platform ios

# Android (APK)
eas build --profile preview --platform android
```

### Step 5: 建立 Production Build

```bash
# iOS (App Store)
eas build --profile production --platform ios

# Android (Google Play)
eas build --profile production --platform android
```

### Step 6: 提交至 App Store

```bash
# iOS
eas submit --platform ios --latest

# Android
eas submit --platform android --latest
```

### 環境變數設定

`eas.json` 已配置不同環境的 `API_URL`:
- **Development**: `http://localhost:8000`
- **Preview**: `https://motionstory-api.onrender.com`
- **Production**: `https://motionstory-api.onrender.com`

---

## CI/CD 自動化

### GitHub Actions Workflow

`.github/workflows/deploy.yml` 配置:

1. **Lint**: 程式碼品質檢查 (Black, isort, Flake8)
2. **Test**: 單元測試 + 覆蓋率報告
3. **Docker Build**: 驗證 Docker image 建立
4. **Deploy**: 部署至 Render.com
5. **Verify**: 驗證部署成功

### 設定 Secrets

在 GitHub Repository → Settings → Secrets and variables → Actions:

```
RENDER_API_KEY=<Render API Key>
RENDER_SERVICE_ID=<Service ID>
MONGODB_URI=<MongoDB connection string>
DB_NAME=motionstory
```

### 觸發部署

```bash
# Push to main branch
git push origin main

# GitHub Actions 會自動:
# 1. 執行所有測試
# 2. 建立 Docker image
# 3. 部署至 Render
# 4. 初始化 MongoDB indexes
# 5. 驗證部署成功
```

---

## 監控與維護

### Render.com 監控

1. 進入 Render Dashboard → Service → Metrics
2. 查看:
   - CPU 使用率
   - Memory 使用率
   - Request count
   - Response time
   - Error rate

### MongoDB Atlas 監控

1. 進入 Atlas Dashboard → Cluster → Metrics
2. 查看:
   - Connections
   - Operations/second
   - Disk usage
   - Network traffic

### 日誌查看

```bash
# Render.com Logs
https://dashboard.render.com/web/<service-id>/logs

# 即時查看
# 在 Render Dashboard 點選 "Logs" 頁籤
```

### 定期維護任務

**每週**:
- 檢查 Render free tier sleep 狀態 (15 分鐘無活動會休眠)
- 檢查 MongoDB 儲存空間使用率 (512MB 限制)

**每月**:
- 檢查 Cloudflare R2 流量 (10GB/月免費額度)
- 審查 error logs 和異常

**每季**:
- 更新 dependencies (`pip list --outdated`)
- 輪換 API keys 和 secrets

---

## 故障排除

### 問題 1: Render 部署失敗

**症狀**: Build 失敗，顯示 Docker 錯誤

**解決方法**:
```bash
# 本地測試 Docker build
cd api
docker build -t test .

# 檢查 Dockerfile 語法
# 檢查 requirements.txt 相依性
```

### 問題 2: MongoDB 連線失敗

**症狀**: `pymongo.errors.ServerSelectionTimeoutError`

**解決方法**:
1. 檢查 MongoDB Atlas Network Access 設定 (允許 0.0.0.0/0)
2. 檢查 `MONGODB_URI` 環境變數格式
3. 檢查 database user 權限

### 問題 3: Firebase Auth 失敗

**症狀**: `firebase_admin.exceptions.InvalidArgumentError`

**解決方法**:
1. 檢查 `FIREBASE_PRIVATE_KEY` 是否保留 `\n` 換行符
2. 檢查 service account 權限
3. 驗證 `FIREBASE_PROJECT_ID` 正確

### 問題 4: Render Free Tier Sleep

**症狀**: API 第一次請求很慢 (15 秒+)

**解決方法**:
- Render free tier 會在 15 分鐘無活動後休眠
- 第一次請求會喚醒服務 (需 10-30 秒)
- 解決方案:
  1. 升級至 Starter plan ($7/月)
  2. 設定 cron job 定期 ping API
  3. 使用 UptimeRobot 監控服務

### 問題 5: EAS Build 失敗

**症狀**: Build timeout 或 dependency 錯誤

**解決方法**:
```bash
# 清理快取
eas build --clear-cache

# 檢查 app.json 配置
# 檢查 package.json dependencies

# 本地測試
expo prebuild
npx react-native run-ios
```

---

## 總結

完成所有步驟後，您的 MotionStory 應用已完整部署:

✅ **Backend API**: https://motionstory-api.onrender.com
✅ **Database**: MongoDB Atlas (Singapore)
✅ **Storage**: Cloudflare R2
✅ **Auth**: Firebase Authentication
✅ **Mobile App**: Expo EAS Build (iOS/Android)
✅ **CI/CD**: GitHub Actions 自動部署

### 下一步

1. 設定自訂 domain (可選)
2. 配置 monitoring 和 alerting
3. 實作 backup 策略
4. 準備 App Store 上架資料

---

**版本**: 1.0
**最後更新**: 2025-10-07
**維護者**: MotionStory Team
