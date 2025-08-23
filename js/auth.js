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
        
        // 延遲獲取 Google Sheets API 權限，避免阻塞登入
        setTimeout(() => {
            requestSheetsPermission().catch(error => {
                console.warn('Google Sheets API 權限獲取失敗:', error);
                // 不阻塞主要登入流程
            });
        }, 2000);
        
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

// 請求 Google Sheets API 權限 (使用新的 Google Identity Services)
async function requestSheetsPermission() {
    try {
        // 檢查是否有 Google Identity Services
        if (!window.google || !window.google.accounts) {
            console.warn('Google Identity Services 尚未載入');
            return false;
        }
        
        // 使用 Google Identity Services 的 OAuth 流程
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: '343933262520-n68g14qkgo400741vvjtk2o1dbohfnq4.apps.googleusercontent.com',
            scope: 'https://www.googleapis.com/auth/spreadsheets',
            callback: (response) => {
                if (response.access_token) {
                    currentUser.accessToken = response.access_token;
                    console.log('Google Sheets API 權限獲取成功');
                    
                    // 顯示成功訊息
                    if (typeof showToast === 'function') {
                        showToast('Google Sheets 權限獲取成功！現在可以使用試算表功能', 'success');
                    }
                } else {
                    console.warn('Google Sheets API 權限獲取失敗');
                }
            },
        });
        
        // 嘗試靜默獲取權限
        client.requestAccessToken({prompt: 'none'});
        
        return true;
        
    } catch (error) {
        console.error('獲取 Google Sheets 權限失敗:', error);
        return false;
    }
}

// 手動請求 Google Sheets 權限（供用戶主動點擊）
async function requestSheetsPermissionManually() {
    try {
        if (!window.google || !window.google.accounts) {
            throw new Error('Google Identity Services 未載入');
        }
        
        return new Promise((resolve) => {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: '343933262520-n68g14qkgo400741vvjtk2o1dbohfnq4.apps.googleusercontent.com',
                scope: 'https://www.googleapis.com/auth/spreadsheets',
                callback: (response) => {
                    if (response.access_token) {
                        currentUser.accessToken = response.access_token;
                        console.log('Google Sheets API 權限獲取成功');
                        
                        if (typeof showToast === 'function') {
                            showToast('Google Sheets 權限獲取成功！', 'success');
                        }
                        resolve(true);
                    } else {
                        console.warn('用戶拒絕了權限請求');
                        if (typeof showToast === 'function') {
                            showToast('需要 Google Sheets 權限才能使用試算表功能', 'warning');
                        }
                        resolve(false);
                    }
                },
            });
            
            // 顯示權限請求彈窗
            client.requestAccessToken({prompt: 'consent'});
        });
        
    } catch (error) {
        console.error('手動獲取 Google Sheets 權限失敗:', error);
        if (typeof showToast === 'function') {
            showToast('無法請求 Google Sheets 權限', 'error');
        }
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