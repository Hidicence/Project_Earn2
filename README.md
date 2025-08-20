# 專案收支管理系統

一個基於純HTML的專案財務管理系統，整合Google登入功能，可直接部署到Vercel。

## 🌟 功能特色

### 📊 專案管理
- **月度專案管理** - 按月份管理不同專案
- **收支追蹤** - 詳細記錄專案收入和各項支出
- **盈餘計算** - 自動計算專案盈餘和營利比
- **支出分類** - 可自定義支出項目類型

### 💰 公司營運支出
- **固定支出管理** - 管理公司月度固定支出
- **分類統計** - 按類別統計支出分布
- **預設項目** - 提供常用支出項目（稅金、薪資、房租等）

### 📈 統計分析
- **專案比較圖** - 視覺化比較各專案收支狀況
- **支出分布圖** - 圓餅圖顯示支出項目分布
- **營利分析** - 計算調整後營利比（扣除公司營運成本）

### 🔐 安全登入
- **Google OAuth** - 使用Google帳號安全登入
- **數據隔離** - 每位用戶的數據完全隔離
- **本地存儲** - 資料存儲在瀏覽器本地，保護隱私

## 🚀 快速開始

### 線上使用
直接訪問：[專案收支管理系統](https://your-vercel-app.vercel.app)

### 本地運行
```bash
# 克隆項目
git clone <repository-url>
cd project-finance-system

# 直接用瀏覽器打開 index.html
# 或使用簡單的HTTP服務器
python -m http.server 8000
# 或
npx serve .
```

### Vercel 部署
1. Fork 這個項目到你的 GitHub
2. 在 Vercel 中連接你的 GitHub 倉庫
3. 設定 Google OAuth Client ID（見下方配置）
4. 部署完成！

## ⚙️ 配置 Google 登入

### 1. 創建 Google OAuth 應用
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新項目或選擇現有項目
3. 啟用 Google+ API
4. 創建 OAuth 2.0 客戶端 ID

### 2. 配置重定向 URI
將以下網址添加到授權的重定向 URI：
- `https://your-domain.vercel.app`
- `http://localhost:8000`（本地開發用）

### 3. 更新客戶端 ID
在 `index.html` 中找到以下行：
```html
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID"
```
將 `YOUR_GOOGLE_CLIENT_ID` 替換為您的實際客戶端 ID。

## 📁 項目結構

```
project-finance-system/
├── index.html              # 主頁面
├── css/
│   └── styles.css          # 自定義樣式
├── js/
│   ├── auth.js            # Google 認證邏輯
│   ├── data.js            # 數據管理（localStorage）
│   ├── ui.js              # UI 控制邏輯
│   ├── charts.js          # 圖表功能
│   └── app.js             # 主應用入口
├── vercel.json            # Vercel 部署配置
└── README.md              # 說明文檔
```

## 💡 使用說明

### 1. 登入系統
- 點擊「使用 Google 登入」
- 授權後即可使用系統

### 2. 專案管理
- 選擇月份查看該月專案
- 點擊「新增專案」創建新專案
- 輸入專案名稱和預期收入
- 點擊「查看支出」管理專案支出

### 3. 添加支出
- 選擇支出項目類型
- 輸入支出金額和說明
- 系統自動計算盈餘和營利比

### 4. 公司支出
- 切換到「公司營運支出」標籤
- 添加月度固定支出
- 支出會影響調整後營利比計算

### 5. 查看統計
- 切換到「統計圖表」標籤
- 查看專案收支比較
- 分析支出結構分布

### 6. 管理支出項目
- 切換到「支出項目管理」標籤
- 添加自定義支出項目
- 刪除不需要的項目

## 🔧 技術架構

- **前端技術**：Pure HTML5 + Bootstrap 5 + Chart.js
- **認證系統**：Google OAuth 2.0
- **數據存儲**：Browser localStorage
- **圖表庫**：Chart.js
- **部署平台**：Vercel

## 🎯 核心算法

### 基礎營利比計算
```
基礎營利比 = (專案收入 - 專案支出) / 專案收入 × 100%
```

### 調整後營利比計算
```
調整後營利比 = (總收入 - 專案支出 - 公司營運支出) / 總收入 × 100%
```

## 📱 響應式設計

系統完全響應式設計，支持：
- 🖥️ 桌面電腦
- 💻 筆記型電腦  
- 📱 平板電腦
- 📱 手機

## 🔒 隱私與安全

- ✅ 所有數據存儲在用戶本地瀏覽器
- ✅ Google OAuth 安全認證
- ✅ 用戶數據完全隔離
- ✅ 不收集任何個人資料
- ✅ 可離線使用（登入後）

## 🆘 常見問題

### Q: 如何備份我的數據？
A: 在開發者控制台中運行 `devTools.exportData()` 可導出 JSON 格式數據

### Q: 可以導入其他系統的數據嗎？
A: 可以通過 `devTools.importData(jsonString)` 導入符合格式的 JSON 數據

### Q: 忘記密碼怎麼辦？
A: 系統使用 Google 登入，請使用 Google 帳戶恢復功能

### Q: 數據會丟失嗎？
A: 數據存儲在瀏覽器本地，清除瀏覽器數據會丟失。建議定期備份

### Q: 可以多人協作嗎？
A: 目前每個 Google 帳戶的數據是獨立的，不支持多人協作

## 🔄 更新計劃

- [ ] 數據導出/導入功能
- [ ] 多幣種支持
- [ ] 專案範本功能
- [ ] 預算預警功能
- [ ] 更多圖表類型
- [ ] PWA 離線支持

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

1. Fork 專案
2. 創建功能分支
3. 提交變更
4. 發起 Pull Request

## 📄 授權協議

MIT License - 可自由使用、修改和分發

## 🙏 致謝

- [Bootstrap](https://getbootstrap.com/) - UI 框架
- [Chart.js](https://www.chartjs.org/) - 圖表庫
- [Google Identity](https://developers.google.com/identity) - 認證服務
- [Vercel](https://vercel.com/) - 部署平台

---

**專案收支管理系統** - 讓財務管理變得簡單高效！