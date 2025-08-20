# Google OAuth 設定指南

## 🚨 錯誤 401: invalid_client 解決方案

### 步驟1：確認Vercel域名
前往你的Vercel儀表板，找到確切的域名，例如：
- `https://project-earn2.vercel.app`
- `https://project-earn2-xxx.vercel.app`

### 步驟2：Google Cloud Console設定

1. **前往 [Google Cloud Console](https://console.cloud.google.com/)**

2. **選擇專案** 
   - 確保選擇了包含OAuth客戶端的專案

3. **進入憑證設定**
   - 左側菜單：API和服務 → 憑證
   - 找到你的OAuth 2.0客戶端ID

4. **編輯OAuth客戶端**
   - 點擊客戶端ID旁的編輯圖示

5. **設定授權來源**
   在「已授權的JavaScript來源」添加：
   ```
   https://你的vercel域名.vercel.app
   http://localhost:8000
   ```

6. **設定重新導向URI**
   在「已授權的重新導向URI」添加：
   ```
   https://你的vercel域名.vercel.app
   http://localhost:8000
   ```

### 步驟3：等待生效
Google OAuth設定更改需要5-10分鐘才能生效。

### 步驟4：測試
1. 清除瀏覽器快取
2. 訪問你的Vercel網站
3. 嘗試Google登入

## 🔍 檢查清單

- [ ] Google Cloud Console中的專案正確
- [ ] OAuth客戶端ID與HTML中的一致
- [ ] 已授權的JavaScript來源包含Vercel域名
- [ ] 已授權的重新導向URI包含Vercel域名
- [ ] 等待5-10分鐘讓設定生效
- [ ] 清除瀏覽器快取

## 🆘 如果仍有問題

### 選項1：創建新的OAuth客戶端
1. 在Google Cloud Console中創建新的OAuth 2.0客戶端ID
2. 應用程式類型：網路應用程式
3. 設定正確的授權來源和重新導向URI
4. 複製新的客戶端ID

### 選項2：更新HTML中的客戶端ID
如果創建了新的客戶端，需要更新 `index.html` 第33行：
```html
data-client_id="你的新客戶端ID"
```

### 選項3：檢查API啟用狀態
確保在Google Cloud Console中啟用了：
- Google+ API 或
- Google Identity API

## 📝 當前客戶端ID
```
343933262520-kc08t2crdet0f0l2q7d7gno08bkmepjl.apps.googleusercontent.com
```

## 🔗 有用連結
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Identity 文檔](https://developers.google.com/identity/gsi/web/guides/overview)
- [OAuth 2.0 疑難排解](https://developers.google.com/identity/oauth2/web/guides/troubleshooting)