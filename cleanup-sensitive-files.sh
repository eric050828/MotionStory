#!/bin/bash
# 清理 GitHub 歷史中的敏感文件

echo "🚨 清理 GitHub 上的敏感文件歷史..."

# 安裝 BFG Repo-Cleaner (如果尚未安裝)
if ! command -v bfg &> /dev/null; then
    echo "📦 安裝 BFG Repo-Cleaner..."
    brew install bfg
fi

# 創建備份
echo "💾 創建備份..."
cd ..
cp -r MotionStory MotionStory-backup-$(date +%Y%m%d-%H%M%S)
cd MotionStory

# 使用 BFG 刪除敏感文件
echo "🗑️  從歷史中刪除敏感文件..."
bfg --delete-files google-services.json
bfg --delete-files GoogleService-Info.plist
bfg --delete-files ".env copy.example"

# 清理和重寫歷史
echo "🔄 重寫 Git 歷史..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ 清理完成！"
echo ""
echo "⚠️  下一步："
echo "1. 檢查歷史: git log --all --oneline -- '*/google-services.json'"
echo "2. 強制推送: git push origin --force --all"
echo "3. 更換所有洩露的憑證（見下方清單）"
