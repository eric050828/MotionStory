#!/bin/bash
# 清理 GitHub 歷史中的敏感文件（使用 git-filter-repo）

set -e  # 發生錯誤時停止

echo "🚨 開始清理 GitHub 敏感文件歷史..."
echo ""

# 確認當前目錄
cd /Users/eric_lee/Projects/MotionStory

# 1. 創建備份
BACKUP_DIR="../MotionStory-backup-$(date +%Y%m%d-%H%M%S)"
echo "💾 創建備份至: $BACKUP_DIR"
cp -r . "$BACKUP_DIR"
echo "✅ 備份完成"
echo ""

# 2. 確保在乾淨狀態
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  工作目錄有未提交的變更，先提交..."
    git add -A
    git commit -m "chore: prepare for history cleanup"
fi

# 3. 使用 git-filter-repo 移除敏感文件
echo "🗑️  從歷史中移除敏感文件..."

# 定義要移除的文件
FILES_TO_REMOVE=(
    "app/android/app/google-services.json"
    "app/ios/GoogleService-Info.plist"
    "api/.env copy.example"
)

# 逐個移除
for file in "${FILES_TO_REMOVE[@]}"; do
    echo "   移除: $file"
    /Users/eric_lee/Library/Python/3.13/bin/git-filter-repo --path "$file" --invert-paths --force
done

echo "✅ 歷史清理完成"
echo ""

# 4. 清理和優化
echo "🔄 優化 Git repository..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive
echo "✅ 優化完成"
echo ""

# 5. 顯示結果
echo "📊 清理結果："
echo "----------------------------------------"
for file in "${FILES_TO_REMOVE[@]}"; do
    if git log --all --oneline -- "$file" 2>/dev/null | head -1 > /dev/null; then
        echo "❌ $file 仍在歷史中"
    else
        echo "✅ $file 已從歷史移除"
    fi
done
echo "----------------------------------------"
echo ""

# 6. 下一步指示
echo "⚠️  重要提醒："
echo "1. 檢查本地變更是否正確"
echo "2. 準備強制推送到 GitHub："
echo ""
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "3. 立即更換所有洩露的憑證！"
echo ""
echo "📁 備份位置: $BACKUP_DIR"
