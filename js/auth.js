// Google 認證相關功能

let currentUser = null;
let isLocalMode = false;

// 初始化認證狀態
function initAuth() {
    const savedUser = localStorage.getItem('currentUser');
    const localMode = localStorage.getItem('localMode') === 'true';
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showSignedInState();
    } else if (localMode) {
        isLocalMode = true;
        currentUser = { id: 'local_user', name: '本地用戶', email: 'local@localhost' };
        showSignedInState();
    } else {
        showNotSignedInState();
    }
}

// Google 登入回調函數
async function handleCredentialResponse(response) {
    try {
        // 解析 JWT token
        const responsePayload = decodeJwtResponse(response.credential);
        
        // 設定用戶資訊
        currentUser = {
            id: responsePayload.sub,
            name: responsePayload.name,
            email: responsePayload.email,
            picture: responsePayload.picture,
            loginTime: new Date().toISOString()
        };
        
        // 嘗試獲取 Google Sheets API 權限（非阻塞）
        requestSheetsPermission().catch(error => {
            console.warn('Google Sheets API 權限獲取失敗:', error);
            // 不阻塞主要登入流程
        });
        
        // 保存用戶資訊到 localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 顯示已登入狀態
        showSignedInState();
        
        console.log('用戶登入成功:', currentUser);
    } catch (error) {
        console.error('登入失敗:', error);
        alert('登入失敗，請重試');
    }
}

// 解析 JWT Token
function decodeJwtResponse(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
}

// 顯示未登入狀態
function showNotSignedInState() {
    document.getElementById('notSignedIn').style.display = 'block';
    document.getElementById('signedIn').style.display = 'none';
    
    // 綁定本地模式按鈕
    const useLocalBtn = document.getElementById('useLocalOnlyBtn');
    if (useLocalBtn && !useLocalBtn.hasAttribute('data-listener')) {
        useLocalBtn.addEventListener('click', function() {
            startLocalMode();
        });
        useLocalBtn.setAttribute('data-listener', 'true');
    }
}

// 顯示已登入狀態
function showSignedInState() {
    if (!currentUser) return;
    
    document.getElementById('notSignedIn').style.display = 'none';
    document.getElementById('signedIn').style.display = 'block';
    
    // 設定用戶資訊顯示
    if (currentUser.name) {
        document.getElementById('userName').textContent = currentUser.name;
    }
    if (currentUser.email) {
        document.getElementById('userEmail').textContent = currentUser.email;
    }
    if (currentUser.picture) {
        document.getElementById('userPhoto').src = currentUser.picture;
    }
    
    // 綁定登出按鈕
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn && !signOutBtn.hasAttribute('data-listener')) {
        signOutBtn.addEventListener('click', function() {
            logout();
        });
        signOutBtn.setAttribute('data-listener', 'true');
    }
    
    // 初始化應用數據
    if (typeof initializeAppAfterLogin === 'function') {
        initializeAppAfterLogin().catch(error => {
            console.error('初始化應用失敗:', error);
        });
    }
}

// 開始本地模式
function startLocalMode() {
    isLocalMode = true;
    currentUser = { id: 'local_user', name: '本地用戶', email: 'local@localhost' };
    localStorage.setItem('localMode', 'true');
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showSignedInState();
    if (typeof initializeLocalMode === 'function') {
        initializeLocalMode().catch(error => {
            console.error('初始化本地模式失敗:', error);
        });
    } else if (typeof initializeAppAfterLogin === 'function') {
        initializeAppAfterLogin().catch(error => {
            console.error('初始化應用失敗:', error);
        });
    }
    console.log('已切換到本地模式');
}

// 登出功能
function logout() {
    if (confirm('確定要登出嗎？')) {
        // 清除用戶資訊
        currentUser = null;
        isLocalMode = false;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('localMode');
        
        // Google 登出
        if (window.google && window.google.accounts) {
            google.accounts.id.disableAutoSelect();
        }
        
        // 顯示未登入狀態
        showNotSignedInState();
        
        console.log('用戶已登出');
    }
}

// 獲取當前用戶ID（用於數據隔離）
function getCurrentUserId() {
    return currentUser ? currentUser.id : null;
}

// 檢查是否已登入
function isLoggedIn() {
    return currentUser !== null;
}

// 請求 Google Sheets API 權限
async function requestSheetsPermission() {
    try {
        if (!window.gapi) {
            console.warn('Google API 尚未載入，延遲請求權限');
            // 等待 Google API 載入
            await waitForGoogleAPI();
        }
        
        // 載入 OAuth 模塊
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('載入 OAuth 模塊超時')), 10000);
            gapi.load('auth2', () => {
                clearTimeout(timeout);
                resolve();
            });
        });
        
        // 初始化 OAuth
        const authInstance = await gapi.auth2.init({
            client_id: '343933262520-n68g14qkgo400741vvjtk2o1dbohfnq4.apps.googleusercontent.com'
        });
        
        // 靜默嘗試獲取權限（避免彈窗）
        const user = await authInstance.signIn({
            scope: 'https://www.googleapis.com/auth/spreadsheets',
            prompt: 'none'  // 靜默授權
        }).catch(() => null);
        
        if (user) {
            // 獲取 access token
            const authResponse = user.getAuthResponse();
            if (authResponse && authResponse.access_token) {
                currentUser.accessToken = authResponse.access_token;
                console.log('Google Sheets API 權限獲取成功');
                return true;
            }
        }
        
        console.log('Google Sheets API 權限獲取跳過（需要用戶手動授權）');
        return false;
        
    } catch (error) {
        console.error('獲取 Google Sheets 權限失敗:', error);
        return false;
    }
}

// 等待 Google API 載入
function waitForGoogleAPI(maxWait = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function check() {
            if (window.gapi) {
                resolve();
            } else if (Date.now() - startTime > maxWait) {
                reject(new Error('Google API 載入超時'));
            } else {
                setTimeout(check, 100);
            }
        }
        
        check();
    });
}

// 檢查是否有 Sheets API 權限
function hasSheetsPermission() {
    return currentUser && currentUser.accessToken;
}

// 將函數導出到全域，供 Google OAuth 調用
window.handleCredentialResponse = handleCredentialResponse;

// 頁面載入時初始化認證
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
});