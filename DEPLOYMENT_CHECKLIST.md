# MotionStory 部署檢查清單

完整的生產環境部署前檢查清單，確保所有配置正確無誤。

## Pre-Deployment Checklist

### 📋 1. Infrastructure Setup

#### MongoDB Atlas
- [ ] Free M0 cluster 建立完成 (Singapore region)
- [ ] Network Access 設定為 0.0.0.0/0 (允許所有 IP)
- [ ] Database user 建立完成 (強密碼)
- [ ] Connection string 已取得並測試
- [ ] Database name 設定為 `motionstory`

#### Cloudflare R2
- [ ] R2 bucket 建立完成 (`motionstory-bucket`)
- [ ] CORS 規則配置完成
- [ ] API Token 建立完成 (Read & Write 權限)
- [ ] Account ID 已取得
- [ ] Access Key 和 Secret Key 已儲存
- [ ] (可選) Custom domain 設定完成

#### Firebase Authentication
- [ ] Firebase 專案建立完成
- [ ] Email/Password 登入方式已啟用
- [ ] (可選) Google 登入已設定
- [ ] (可選) Apple 登入已設定 (iOS 必要)
- [ ] iOS app 已註冊 (`com.motionstory.app`)
- [ ] Android app 已註冊 (`com.motionstory.app`)
- [ ] Service Account JSON 已下載
- [ ] `GoogleService-Info.plist` 已放置於 `app/ios/`
- [ ] `google-services.json` 已放置於 `app/android/app/`

---

### 🔧 2. Code & Configuration

#### Backend API
- [ ] `api/Dockerfile` 存在且正確
- [ ] `api/requirements.txt` 包含所有依賴
- [ ] `api/src/main.py` health endpoint 正常
- [ ] `api/src/core/config.py` 環境變數正確載入
- [ ] `.env.example` 已更新為最新版本
- [ ] Production secrets 不在 git 版本控制中

#### Mobile App
- [ ] `app/eas.json` 配置完成
- [ ] `app/app.json` 版本號正確
- [ ] Firebase 配置檔案已放置
- [ ] API URL 指向正確環境
- [ ] Bundle ID / Package Name 正確

#### Scripts & Tools
- [ ] `scripts/init_indexes.py` 可執行
- [ ] `docker-compose.yml` 本地測試通過
- [ ] `.github/workflows/deploy.yml` 配置正確

---

### 🔐 3. Security

#### Environment Variables
- [ ] `JWT_SECRET_KEY` 已使用 `openssl rand -hex 32` 生成
- [ ] `FIREBASE_PRIVATE_KEY` 格式正確 (保留 `\n`)
- [ ] MongoDB URI 包含強密碼
- [ ] R2 Secret Key 已安全儲存
- [ ] 所有 secrets 已加入 `.gitignore`

#### Access Control
- [ ] Firebase 規則已設定 (限制未授權存取)
- [ ] R2 bucket 權限正確 (public read, authenticated write)
- [ ] MongoDB database user 權限最小化

#### Best Practices
- [ ] 沒有 hardcoded secrets 在程式碼中
- [ ] 沒有 API keys 在 git history 中
- [ ] `.env` 檔案不在版本控制中
- [ ] Production logs 不包含敏感資訊

---

### 🚀 4. Render.com Deployment

#### Service Setup
- [ ] Web Service 建立完成
- [ ] Service name: `motionstory-api`
- [ ] Region: **Singapore** (asia-southeast1)
- [ ] Branch: `main`
- [ ] Root Directory: `api`
- [ ] Environment: **Docker**
- [ ] Instance Type: **Free** (或 Starter if needed)

#### Environment Variables (Render Dashboard)
- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `DB_NAME` - `motionstory`
- [ ] `FIREBASE_PROJECT_ID` - Firebase project ID
- [ ] `FIREBASE_CLIENT_EMAIL` - Service account email
- [ ] `FIREBASE_PRIVATE_KEY` - Service account private key
- [ ] `R2_ACCOUNT_ID` - Cloudflare account ID
- [ ] `R2_ACCESS_KEY` - R2 access key
- [ ] `R2_SECRET_KEY` - R2 secret key
- [ ] `R2_BUCKET_NAME` - `motionstory-bucket`
- [ ] `JWT_SECRET_KEY` - Auto-generated or custom
- [ ] `JWT_ALGORITHM` - `HS256`
- [ ] `JWT_EXPIRATION_DAYS` - `7`
- [ ] `ENVIRONMENT` - `production`
- [ ] `DEBUG` - `False`

#### Deployment Settings
- [ ] Auto-Deploy 已啟用 (推送至 main 觸發部署)
- [ ] Health Check Path: `/health`
- [ ] Docker Build 成功
- [ ] Deployment logs 無錯誤

---

### 🗄️ 5. Database Initialization

#### MongoDB Indexes
- [ ] `scripts/init_indexes.py` 已執行
- [ ] 18 個 indexes 建立完成:
  - [ ] users: 2 indexes
  - [ ] workouts: 4 indexes
  - [ ] achievements: 2 indexes
  - [ ] dashboards: 2 indexes
  - [ ] milestones: 2 indexes
  - [ ] annual_reviews: 2 indexes
  - [ ] share_cards: 2 indexes
- [ ] Index verification 通過

#### Schema Validation
- [ ] Collections 已建立
- [ ] Validation rules 已設定 (optional)
- [ ] 測試資料插入成功

---

### ✅ 6. Verification & Testing

#### API Endpoints
- [ ] Health check 正常: `GET /health`
- [ ] API docs 可訪問: `GET /docs`
- [ ] User registration 正常: `POST /api/v1/auth/register`
- [ ] User login 正常: `POST /api/v1/auth/login`
- [ ] JWT authentication 正常
- [ ] CORS 設定正確

#### Database Operations
- [ ] 可成功建立 user
- [ ] 可成功建立 workout
- [ ] Indexes 正確使用 (查看 query plans)
- [ ] Soft delete 機制正常

#### File Storage
- [ ] 可上傳檔案至 R2
- [ ] 可讀取 R2 檔案 (public URL)
- [ ] Image URLs 正確生成

#### Mobile App Connection
- [ ] App 可連接 API
- [ ] Firebase Auth 正常
- [ ] API 請求成功
- [ ] 資料同步正常

---

### 🔍 7. Monitoring & Logging

#### Render.com
- [ ] Metrics 正常顯示 (CPU, Memory, Requests)
- [ ] Logs 無異常錯誤
- [ ] Health check 通過
- [ ] Response time 正常 (<500ms)

#### MongoDB Atlas
- [ ] Connections 正常
- [ ] Operations/sec 正常
- [ ] Disk usage < 512MB
- [ ] Query performance 正常

#### Error Tracking (Optional)
- [ ] Sentry 已設定 (如果使用)
- [ ] Error alerts 已設定

---

### 📱 8. Mobile App Build

#### EAS Build Setup
- [ ] EAS CLI 已安裝
- [ ] Expo 帳號已登入
- [ ] `eas.json` 配置正確
- [ ] Firebase 配置檔案已放置

#### Development Build
- [ ] iOS development build 成功
- [ ] Android development build 成功
- [ ] 可在實體裝置安裝測試

#### Production Build (Ready for Store)
- [ ] iOS production build 成功
- [ ] Android production build 成功
- [ ] Bundle ID / Package Name 正確
- [ ] Version 和 Build Number 正確
- [ ] Icons 和 Splash Screen 已設定

---

### 🔄 9. CI/CD Pipeline

#### GitHub Actions
- [ ] `.github/workflows/deploy.yml` 存在
- [ ] GitHub Secrets 已設定:
  - [ ] `RENDER_API_KEY`
  - [ ] `RENDER_SERVICE_ID`
  - [ ] `MONGODB_URI`
  - [ ] `DB_NAME`
- [ ] Workflow 可正常執行
- [ ] 測試通過 (lint, test, docker-build)
- [ ] 自動部署正常

---

### 📚 10. Documentation

#### Code Documentation
- [ ] API endpoints 有 docstrings
- [ ] Pydantic models 有描述
- [ ] 複雜邏輯有註解

#### Project Documentation
- [ ] `README.md` 已更新
- [ ] `DEPLOYMENT.md` 完整
- [ ] `DEPLOYMENT_QUICK_START.md` 可用
- [ ] `LOCAL_DEVELOPMENT.md` 測試通過
- [ ] `.env.example` 包含所有變數

---

## Post-Deployment Checklist

### 🎯 Immediate (部署後 1 小時內)

- [ ] 執行完整 API 測試套件
- [ ] 檢查所有 health checks
- [ ] 驗證資料庫連線穩定
- [ ] 測試使用者註冊流程
- [ ] 測試 mobile app 連線
- [ ] 檢查 error logs (無異常)
- [ ] 驗證 R2 file upload
- [ ] 測試 JWT authentication

### 📊 Short-term (部署後 24 小時內)

- [ ] 監控 API response time
- [ ] 檢查 MongoDB query performance
- [ ] 驗證 indexes 正確使用
- [ ] 測試高負載情況 (如果可能)
- [ ] 檢查 Render free tier sleep 行為
- [ ] 驗證 CORS 設定
- [ ] 測試所有 API endpoints
- [ ] 收集初期使用者反饋

### 🔧 Medium-term (部署後 1 週內)

- [ ] 設定 uptime monitoring (UptimeRobot, etc.)
- [ ] 設定 error alerting (Sentry, etc.)
- [ ] 審查 production logs
- [ ] 最佳化 slow queries
- [ ] 建立 backup 策略
- [ ] 文件化常見問題
- [ ] 設定 analytics (optional)
- [ ] 準備 rollback 計畫

### 🎓 Long-term (部署後 1 個月內)

- [ ] 評估是否升級 Render plan (如果頻繁 sleep)
- [ ] 評估 MongoDB 使用量 (是否接近 512MB)
- [ ] 評估 R2 流量 (是否接近 10GB/月)
- [ ] 審查安全設定
- [ ] 更新 dependencies
- [ ] 收集使用者反饋並改進
- [ ] 準備 App Store 上架資料
- [ ] 建立 marketing materials

---

## Emergency Contacts & Resources

### Documentation
- Render.com Docs: https://render.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Cloudflare R2 Docs: https://developers.cloudflare.com/r2/
- Firebase Docs: https://firebase.google.com/docs
- Expo Docs: https://docs.expo.dev/

### Support
- Render Support: https://render.com/docs/support
- MongoDB Support: https://support.mongodb.com/
- Cloudflare Support: https://support.cloudflare.com/

### Rollback Plan
```bash
# 1. Revert to previous commit
git revert HEAD
git push origin main

# 2. Manual rollback in Render
# Dashboard → Service → Manual Deploy → Select previous commit

# 3. Restore database (if needed)
# Use MongoDB Atlas Point-in-Time Restore (Paid feature)
# Or restore from manual backup
```

---

## Sign-off

### Deployment Team

| Role | Name | Sign-off | Date |
|------|------|----------|------|
| Backend Lead | __________ | ☐ | __/__/__ |
| DevOps | __________ | ☐ | __/__/__ |
| QA | __________ | ☐ | __/__/__ |
| Product Owner | __________ | ☐ | __/__/__ |

### Final Approval

- [ ] All checklist items completed
- [ ] All tests passing
- [ ] Documentation up-to-date
- [ ] Rollback plan ready
- [ ] Monitoring configured

**Approved by**: __________________
**Date**: ____ / ____ / ________
**Deployment URL**: https://motionstory-api.onrender.com

---

**版本**: 1.0
**最後更新**: 2025-10-07
