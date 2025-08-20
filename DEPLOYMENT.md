# 部署指南

## 🚀 Vercel 部署步驟

### 1. 準備工作

#### 創建 Google OAuth 應用
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新項目或選擇現有項目
3. 啟用 Google+ API 或 Google Identity API
4. 前往「憑證」→「創建憑證」→「OAuth 2.0 客戶端 ID」
5. 選擇「網路應用程式」
6. 在「已授權的 JavaScript 來源」中添加：
   - `https://your-domain.vercel.app`
   - `http://localhost:8000`（本地開發）
7. 在「已授權的重新導向 URI」中添加：
   - `https://your-domain.vercel.app`
   - `http://localhost:8000`
8. 複製客戶端 ID

#### 更新客戶端 ID
在 `index.html` 中找到：
```html
data-client_id="YOUR_GOOGLE_CLIENT_ID"
```
替換為您的實際客戶端 ID。

### 2. 部署到 Vercel

#### 方法一：GitHub 連接（推薦）
1. 將代碼推送到 GitHub 倉庫
2. 前往 [Vercel](https://vercel.com/)
3. 點擊「Import Project」
4. 選擇您的 GitHub 倉庫
5. 項目會自動部署

#### 方法二：Vercel CLI
```bash
# 安裝 Vercel CLI
npm install -g vercel

# 在項目目錄中
vercel

# 生產部署
vercel --prod
```

#### 方法三：拖放部署
1. 打包整個項目文件夾
2. 前往 Vercel 儀表板
3. 拖放文件夾到部署區域

### 3. 配置環境

部署後，您需要：

1. **更新 Google OAuth 設定**
   - 將實際的 Vercel 域名添加到 Google OAuth 配置
   - 例如：`https://your-app-name.vercel.app`

2. **測試登入功能**
   - 訪問您的 Vercel 域名
   - 測試 Google 登入是否正常工作

3. **設定自定義域名（可選）**
   - 在 Vercel 儀表板中添加自定義域名
   - 更新 Google OAuth 設定中的域名

## 🔧 本地開發

### 啟動本地服務器
```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js serve
npx serve . -p 8000

# 使用 PHP
php -S localhost:8000

# 使用 Live Server (VS Code 擴充)
# 右鍵 index.html → Open with Live Server
```

### 本地測試 Google 登入
1. 確保在 Google OAuth 設定中添加了 `http://localhost:8000`
2. 在本地服務器中訪問項目
3. 測試登入功能

## 📋 部署檢查清單

- [ ] Google OAuth 客戶端 ID 已更新
- [ ] Google OAuth 已添加正確的授權域名
- [ ] 所有文件都已上傳到 Vercel
- [ ] 網站可以正常訪問
- [ ] Google 登入功能正常
- [ ] 所有頁面功能正常運行
- [ ] 響應式設計在移動設備上正常
- [ ] 圖表正常顯示

## 🐛 常見問題解決

### Google 登入失敗
- 檢查客戶端 ID 是否正確
- 確認域名已添加到 Google OAuth 設定
- 檢查瀏覽器控制台錯誤信息

### 頁面無法載入
- 檢查 `vercel.json` 配置
- 確認所有靜態文件路徑正確
- 檢查瀏覽器開發者工具的網路標籤

### 圖表不顯示
- 檢查 Chart.js CDN 是否可訪問
- 確認 JavaScript 文件載入順序
- 檢查瀏覽器控制台錯誤

### 數據丟失
- localStorage 數據會在清除瀏覽器數據時丟失
- 建議用戶定期備份數據
- 可以實現雲端同步功能

## 🔄 更新部署

### 通過 GitHub（自動）
推送代碼到 GitHub 後，Vercel 會自動重新部署。

### 通過 Vercel CLI
```bash
# 重新部署
vercel --prod
```

### 通過 Vercel 儀表板
1. 前往項目設定
2. 點擊「Redeploy」
3. 選擇要部署的提交

## 📊 監控和分析

### Vercel Analytics
Vercel 提供內建的分析功能，可以監控：
- 頁面訪問量
- 載入時間
- 用戶地理分布

### 自定義分析
可以整合 Google Analytics：
```html
<!-- 在 index.html 的 <head> 中添加 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔐 安全性建議

1. **HTTPS Only**: Vercel 自動提供 HTTPS
2. **Content Security Policy**: 已在 `vercel.json` 中配置基本安全標頭
3. **定期更新**: 定期更新依賴的 CDN 資源
4. **數據隱私**: 提醒用戶數據存儲在本地瀏覽器

## 💡 優化建議

1. **性能優化**
   - 啟用 Gzip 壓縮（Vercel 自動）
   - 使用 CDN 加速靜態資源
   - 優化圖片大小

2. **SEO 優化**
   - 添加適當的 meta 標籤
   - 設定 sitemap.xml
   - 使用語義化 HTML

3. **可訪問性**
   - 添加 ARIA 標籤
   - 確保鍵盤導航
   - 支援螢幕閱讀器

## 📞 支援

如果遇到部署問題，可以參考：
- [Vercel 官方文檔](https://vercel.com/docs)
- [Google Identity 文檔](https://developers.google.com/identity)
- [GitHub Issues](https://github.com/your-repo/issues)

---

部署成功後，您就擁有了一個功能完整的專案收支管理系統！🎉