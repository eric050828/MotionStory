# MotionStory 快速部署指南

10 分鐘快速部署 MotionStory 到生產環境。

## 前置需求

- GitHub 帳號
- MongoDB Atlas 帳號 (免費)
- Cloudflare 帳號 (免費)
- Firebase 帳號 (免費)
- Render.com 帳號 (免費)

---

## 1. MongoDB Atlas (2 分鐘)

```bash
# 1. 建立 Free M0 Cluster (Singapore region)
# 2. Network Access: 允許 0.0.0.0/0
# 3. 建立 database user
# 4. 取得連線字串

MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/"
```

📝 [詳細步驟](./DEPLOYMENT.md#mongodb-atlas-設定)

---

## 2. Cloudflare R2 (2 分鐘)

```bash
# 1. 建立 R2 bucket: motionstory-bucket
# 2. 建立 API Token (Read & Write)
# 3. 複製 credentials

R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY="your-access-key"
R2_SECRET_KEY="your-secret-key"
```

📝 [詳細步驟](./DEPLOYMENT.md#cloudflare-r2-設定)

---

## 3. Firebase Auth (2 分鐘)

```bash
# 1. 建立 Firebase 專案
# 2. 啟用 Authentication (Email/Password)
# 3. 下載 Service Account JSON
# 4. 複製 credentials

FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-..."
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

📝 [詳細步驟](./DEPLOYMENT.md#firebase-authentication-設定)

---

## 4. Render.com 部署 (3 分鐘)

### 4.1 建立 Web Service

1. 登入 [Render Dashboard](https://dashboard.render.com/)
2. 點選 "New +" → "Web Service"
3. 連結 GitHub repository
4. 設定:
   - **Name**: `motionstory-api`
   - **Region**: Singapore
   - **Branch**: `main`
   - **Root Directory**: `api`
   - **Environment**: Docker
   - **Plan**: Free

### 4.2 設定環境變數

在 Render Dashboard → Environment 新增:

```bash
MONGODB_URI=<from step 1>
DB_NAME=motionstory
FIREBASE_PROJECT_ID=<from step 3>
FIREBASE_CLIENT_EMAIL=<from step 3>
FIREBASE_PRIVATE_KEY=<from step 3>
R2_ACCOUNT_ID=<from step 2>
R2_ACCESS_KEY=<from step 2>
R2_SECRET_KEY=<from step 2>
R2_BUCKET_NAME=motionstory-bucket
JWT_SECRET_KEY=<auto-generate>
ENVIRONMENT=production
DEBUG=False
```

### 4.3 部署

點選 "Create Web Service"，等待部署完成 (~5 分鐘)

---

## 5. 初始化 MongoDB Indexes (1 分鐘)

```bash
# 設定環境變數
export MONGODB_URI="<your-mongodb-uri>"
export DB_NAME="motionstory"

# 執行初始化腳本
cd /path/to/MotionStory
python scripts/init_indexes.py

# 預期輸出:
# ✓ Created 18 indexes across 7 collections
# ✓ All indexes verified successfully
```

---

## 6. 驗證部署

```bash
# 1. 檢查 API health
curl https://motionstory-api.onrender.com/health

# 預期回應:
# {"status":"healthy","version":"1.0.0"}

# 2. 測試 API endpoint
curl https://motionstory-api.onrender.com/api/v1/docs

# 應該看到 Swagger UI
```

---

## 7. 設定 CI/CD (可選, 1 分鐘)

### 7.1 設定 GitHub Secrets

在 GitHub Repository → Settings → Secrets:

```
RENDER_API_KEY=<Render Dashboard → Account Settings → API Keys>
RENDER_SERVICE_ID=<Service ID from Render Dashboard>
MONGODB_URI=<your-mongodb-uri>
DB_NAME=motionstory
```

### 7.2 觸發自動部署

```bash
# Push to main branch
git push origin main

# GitHub Actions 會自動部署
```

---

## 8. Mobile App 設定 (可選)

### 8.1 更新 API URL

```typescript
// app/src/config/api.ts
export const API_BASE_URL = 'https://motionstory-api.onrender.com';
```

### 8.2 EAS Build

```bash
cd app

# Development build
eas build --profile development --platform ios

# Production build
eas build --profile production --platform ios
eas build --profile production --platform android
```

---

## 完成檢查清單

- [ ] MongoDB Atlas cluster 建立完成
- [ ] Cloudflare R2 bucket 建立完成
- [ ] Firebase 專案設定完成
- [ ] Render.com 部署成功
- [ ] MongoDB indexes 初始化完成
- [ ] API health check 通過
- [ ] (可選) GitHub Actions 設定完成
- [ ] (可選) Mobile app 連接成功

---

## 常見問題

### Q: Render 部署失敗怎麼辦?

**A**: 檢查 Render Logs:
```bash
# 在 Render Dashboard 查看 Logs
# 常見問題:
# 1. Dockerfile 語法錯誤
# 2. 環境變數未設定
# 3. MongoDB 連線失敗
```

### Q: MongoDB 連線失敗?

**A**: 檢查 Network Access:
```bash
# 1. MongoDB Atlas → Network Access
# 2. 確認允許 0.0.0.0/0
# 3. 檢查 MONGODB_URI 格式正確
```

### Q: Render Free Tier 會休眠嗎?

**A**: 是的，解決方案:
```bash
# 1. 升級至 Starter plan ($7/月)
# 2. 使用 UptimeRobot 定期 ping API
# 3. 接受首次請求較慢 (10-30 秒)
```

---

## 下一步

🎉 **恭喜! 部署完成!**

接下來:
1. 📱 測試 Mobile App 連接
2. 📊 設定監控 (Render Metrics)
3. 🔐 審查安全設定
4. 📝 準備 App Store 上架資料

---

**詳細文件**: [DEPLOYMENT.md](./DEPLOYMENT.md)
**故障排除**: [DEPLOYMENT.md#故障排除](./DEPLOYMENT.md#故障排除)
