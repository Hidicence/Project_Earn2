// Google 認證相關功能

let currentUser = null;

// 初始化認證狀態
function initAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    } else {
        showLoginPage();
    }
}

// Google 登入回調函數
function handleCredentialResponse(response) {
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
        
        // 保存用戶資訊到 localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 顯示主應用
        showMainApp();
        
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

// 顯示登入頁面
function showLoginPage() {
    document.getElementById('loginPage').classList.remove('d-none');
    document.getElementById('mainApp').classList.add('d-none');
}

// 顯示主應用
function showMainApp() {
    if (!currentUser) return;
    
    document.getElementById('loginPage').classList.add('d-none');
    document.getElementById('mainApp').classList.remove('d-none');
    
    // 設定用戶資訊顯示
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userAvatar').src = currentUser.picture;
    
    // 初始化應用數據
    if (typeof initializeAppAfterLogin === 'function') {
        initializeAppAfterLogin();
    }
}

// 登出功能
function logout() {
    if (confirm('確定要登出嗎？')) {
        // 清除用戶資訊
        currentUser = null;
        localStorage.removeItem('currentUser');
        
        // Google 登出
        if (window.google && window.google.accounts) {
            google.accounts.id.disableAutoSelect();
        }
        
        // 顯示登入頁面
        showLoginPage();
        
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

// 頁面載入時初始化認證
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
});