# Git 推送到 GitHub 的步驟

## 📝 執行以下命令

在專案目錄 `C:\Users\User\Desktop\0820projectearn2` 中執行：

```bash
# 1. 初始化 Git 倉庫
git init

# 2. 添加遠程倉庫
git remote add origin https://github.com/Hidicence/Project_Earn2.git

# 3. 添加所有文件到暫存區
git add .

# 4. 提交代碼
git commit -m "Initial commit: 專案收支管理系統 v1.0"

# 5. 設定主分支名稱（如果需要）
git branch -M main

# 6. 推送到 GitHub
git push -u origin main
```

## 🔧 如果遇到問題

### 問題1: 需要登入GitHub
```bash
# 配置Git用戶信息
git config --global user.name "你的GitHub用戶名"
git config --global user.email "你的GitHub郵箱"
```

### 問題2: 遠程倉庫已存在文件
```bash
# 強制推送（會覆蓋遠程文件）
git push -f origin main

# 或者先拉取再合併
git pull origin main --allow-unrelated-histories
git push origin main
```

### 問題3: 權限問題
確保你有該倉庫的推送權限，或使用個人訪問令牌(PAT)代替密碼。

## 📋 推送後的步驟

1. **檢查GitHub倉庫** - 確認所有文件都已上傳
2. **設定Google OAuth** - 更新 `index.html` 中的客戶端ID
3. **部署到Vercel** - 在Vercel中連接GitHub倉庫
4. **測試系統** - 驗證所有功能正常運行

## 🎯 重要提醒

在推送前，請確保：
- [ ] 已移除任何敏感信息（API keys等）
- [ ] `index.html` 中的 `YOUR_GOOGLE_CLIENT_ID` 尚未替換（在部署時再替換）
- [ ] 所有文件路徑正確
- [ ] README.md 中的信息準確

推送完成後，你就可以在 https://github.com/Hidicence/Project_Earn2 看到完整的專案代碼！