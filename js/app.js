// 主應用入口文件

// 全域變量
window.currentMonth = new Date().toISOString().slice(0, 7);
window.currentTab = 'projects';
window.currentProjectId = null;

// 應用初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('專案收支管理系統載入中...');
    
    // 檢查瀏覽器支援
    checkBrowserSupport();
    
    // 初始化認證系統
    // initAuth() 會在 auth.js 中自動調用
});

// 檢查瀏覽器支援
function checkBrowserSupport() {
    if (!window.localStorage) {
        alert('您的瀏覽器不支援 localStorage，請升級瀏覽器或使用現代瀏覽器');
        return false;
    }
    
    if (!window.fetch) {
        console.warn('瀏覽器不支援 fetch API，部分功能可能受影響');
    }
    
    return true;
}

// Google 登入初始化完成後調用
window.handleCredentialResponse = handleCredentialResponse;

// 當用戶成功登入後初始化應用 - 移除，由tableUI.js處理

// 全域錯誤處理
window.addEventListener('error', function(e) {
    console.error('應用錯誤:', e.error);
    
    // 可以在這裡添加錯誤報告邏輯
    if (e.error && e.error.message) {
        showToast('發生錯誤: ' + e.error.message, 'error');
    }
});

// 全域未捕獲的 Promise 拒絕處理
window.addEventListener('unhandledrejection', function(e) {
    console.error('未處理的 Promise 拒絕:', e.reason);
    e.preventDefault();
});

// 應用版本資訊
const APP_INFO = {
    name: '專案收支管理系統',
    version: '1.0.0',
    author: 'Claude AI',
    description: '基於 HTML5 的專案財務管理工具'
};

// 在控制台顯示應用資訊
console.log(`
%c${APP_INFO.name} v${APP_INFO.version}%c
${APP_INFO.description}
`, 
'color: #0066cc; font-size: 16px; font-weight: bold;',
'color: #666; font-size: 12px;'
);

// 導出全域函數（給 HTML 調用） - 移到各自的文件中

// 開發模式工具函數
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.devTools = {
        clearAllData: function() {
            if (confirm('確定要清除所有數據嗎？此操作不可恢復！')) {
                const userId = getCurrentUserId();
                if (userId) {
                    ['expenseCategories', 'projects', 'projectExpenses', 'companyExpenses'].forEach(type => {
                        localStorage.removeItem(`${userId}_${type}`);
                    });
                    location.reload();
                }
            }
        },
        exportData: function() {
            const data = exportData();
            if (data) {
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `財務數據_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
            }
        },
        importData: function(jsonString) {
            if (importData(jsonString)) {
                location.reload();
            } else {
                alert('導入失敗');
            }
        },
        showStats: function() {
            const userId = getCurrentUserId();
            if (!userId) return;
            
            const stats = {
                用戶ID: userId,
                專案數量: getProjects().length,
                支出項目數量: getExpenseCategories().length,
                專案支出記錄: getProjectExpenses().length,
                公司支出記錄: getCompanyExpenses().length,
                本月統計: calculateMonthlyStats(currentMonth)
            };
            
            console.table(stats);
        }
    };
    
    console.log('開發模式工具已載入，可使用 devTools 物件');
}