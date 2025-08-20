// 表格UI邏輯 - 適配昨天的設計

let currentMonth = new Date().toISOString().slice(0, 7);
let expenseTypes = ['器材租賃費用', '交通費', '餐費', '雜費', '人事費', '後製費'];
let projects = [];
let monthlyExpenses = {};
// currentUser 和 isLocalMode 在 auth.js 中已聲明

// 初始化應用
function initializeAppAfterLogin() {
    console.log('用戶已登入，初始化應用...');
    
    // 設定用戶信息
    if (window.currentUser) {
        document.getElementById('userName').textContent = window.currentUser.name || '本地用戶';
        document.getElementById('userEmail').textContent = window.currentUser.email || '';
        if (window.currentUser.picture) {
            document.getElementById('userPhoto').src = window.currentUser.picture;
        }
        
        // 顯示已登入狀態
        document.getElementById('notSignedIn').style.display = 'none';
        document.getElementById('signedIn').style.display = 'flex';
    }
    
    // 初始化月份標籤
    initializeMonthTabs();
    
    // 載入數據
    loadExpenseTypes();
    loadProjects();
    loadMonthlyExpenses();
    
    // 設定事件監聽器（確保DOM完全載入）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupEventListeners);
    } else {
        setupEventListeners();
    }
    
    // 渲染界面
    renderProjectsTable();
    updateStatistics();
    
    console.log('應用初始化完成');
}

// 開始本地模式（從按鈕調用）
function startLocalMode() {
    console.log('切換到本地模式...');
    
    // 設定本地模式標記
    window.isLocalMode = true;
    localStorage.setItem('localMode', 'true');
    
    // 設定本地用戶
    window.currentUser = { id: 'local_user', name: '本地用戶', email: 'local@localhost' };
    localStorage.setItem('currentUser', JSON.stringify(window.currentUser));
    
    // 初始化本地模式UI
    initializeLocalMode();
}

// 本地模式初始化
function initializeLocalMode() {
    console.log('使用本地模式初始化...');
    
    // 設定本地用戶信息
    document.getElementById('userName').textContent = '本地用戶';
    document.getElementById('userEmail').textContent = '離線模式';
    document.getElementById('userPhoto').src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="%236366f1"/><text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">本</text></svg>';
    
    // 顯示已登入狀態
    document.getElementById('notSignedIn').style.display = 'none';
    document.getElementById('signedIn').style.display = 'flex';
    
    initializeMonthTabs();
    loadExpenseTypes();
    loadProjects();
    loadMonthlyExpenses();
    setupEventListeners();
    renderProjectsTable();
    updateStatistics();
    
    console.log('本地模式初始化完成');
}

// 初始化月份標籤
function initializeMonthTabs() {
    const container = document.getElementById('monthTabsContainer');
    container.innerHTML = '';
    
    // 生成最近12個月的標籤
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthValue = date.toISOString().slice(0, 7);
        const monthText = date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
        
        const tab = document.createElement('div');
        tab.className = 'month-tab';
        if (monthValue === currentMonth) {
            tab.classList.add('active');
        }
        tab.innerHTML = `
            <span>${monthText}</span>
            <button class="delete-month" onclick="deleteMonth('${monthValue}')" title="刪除月份">
                <i class="fas fa-times"></i>
            </button>
        `;
        tab.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-month')) {
                selectMonth(monthValue);
            }
        });
        
        container.appendChild(tab);
    }
}

// 選擇月份
function selectMonth(month) {
    currentMonth = month;
    
    // 更新標籤狀態
    document.querySelectorAll('.month-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // 重新載入數據
    loadProjects();
    loadMonthlyExpenses();
    renderProjectsTable();
    updateStatistics();
}

// 設定事件監聽器
function setupEventListeners() {
    console.log('設置事件監聽器...');
    
    // 月度支出輸入框
    document.querySelectorAll('.monthly-input').forEach(input => {
        input.addEventListener('input', function() {
            updateMonthlyExpenses();
            updateStatistics();
        });
    });
    
    // 本地模式按鈕
    const useLocalBtn = document.getElementById('useLocalOnlyBtn');
    if (useLocalBtn) {
        console.log('綁定本地模式按鈕');
        useLocalBtn.addEventListener('click', function() {
            console.log('本地模式按鈕被點擊');
            startLocalMode();
        });
    } else {
        console.log('未找到本地模式按鈕');
    }
    
    // 登出按鈕
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        console.log('綁定登出按鈕');
        signOutBtn.addEventListener('click', function() {
            console.log('登出按鈕被點擊');
            logout();
        });
    }
    
    // 新增專案按鈕
    const addProjectBtn = document.getElementById('addProjectBtn');
    if (addProjectBtn) {
        console.log('綁定新增專案按鈕');
        addProjectBtn.addEventListener('click', function() {
            console.log('新增專案按鈕被點擊');
            showAddProjectModal();
        });
    } else {
        console.log('未找到新增專案按鈕');
    }
    
    // 新增支出類型按鈕
    const addExpenseTypeBtn = document.getElementById('addExpenseTypeBtn');
    if (addExpenseTypeBtn) {
        console.log('綁定新增支出類型按鈕');
        addExpenseTypeBtn.addEventListener('click', function() {
            console.log('新增支出類型按鈕被點擊');
            addExpenseType();
        });
    } else {
        console.log('未找到新增支出類型按鈕');
    }
    
    // 匯出按鈕
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        console.log('綁定匯出按鈕');
        exportBtn.addEventListener('click', function() {
            console.log('匯出按鈕被點擊');
            exportData();
        });
    } else {
        console.log('未找到匯出按鈕');
    }
    
    // Modal關閉按鈕
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // 專案表單提交
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitNewProject();
        });
    }
}

// 載入支出類型
function loadExpenseTypes() {
    const saved = localStorage.getItem('expenseTypes');
    if (saved) {
        expenseTypes = JSON.parse(saved);
        updateTableHeaders();
    }
}

// 更新表格標題
function updateTableHeaders() {
    expenseTypes.forEach((type, index) => {
        const header = document.getElementById(`expenseCol${index + 1}`);
        if (header) {
            header.textContent = type;
        }
    });
}

// 載入專案數據
function loadProjects() {
    const storedProjects = localStorage.getItem(`projects_${currentMonth}`);
    projects = storedProjects ? JSON.parse(storedProjects) : [];
}

// 載入月度支出數據
function loadMonthlyExpenses() {
    const storedExpenses = localStorage.getItem(`monthlyExpenses_${currentMonth}`);
    const expenses = storedExpenses ? JSON.parse(storedExpenses) : {};
    
    // 預設支出項目
    const defaultExpenses = {
        tax: 0, charity: 0, equipment: 0, miscellaneous: 0, salary: 0,
        loan: 0, rent: 0, bni: 0, consulting: 0, insurance: 0
    };
    
    monthlyExpenses = { ...defaultExpenses, ...expenses };
    
    // 更新輸入框值
    Object.keys(monthlyExpenses).forEach(key => {
        const input = document.getElementById(key);
        if (input) {
            input.value = monthlyExpenses[key];
        }
    });
}

// 渲染專案表格
function renderProjectsTable() {
    const tbody = document.getElementById('projectsTableBody');
    tbody.innerHTML = '';
    
    if (projects.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="13" style="text-align: center; padding: 2rem; color: #6b7280;">
                <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                本月尚無專案，點擊「新增專案」開始記錄
            </td>
        `;
        tbody.appendChild(row);
        return;
    }
    
    projects.forEach((project, index) => {
        const row = createProjectRow(project, index);
        tbody.appendChild(row);
    });
}

// 創建專案行
function createProjectRow(project, index) {
    const row = document.createElement('tr');
    
    // 計算總支出
    const totalExpenses = expenseTypes.reduce((sum, type) => {
        return sum + (project.expenses[type] || 0);
    }, 0);
    
    // 計算盈虧和營利比
    const profit = project.totalIncome - totalExpenses;
    const profitRatio = project.totalIncome > 0 ? (profit / project.totalIncome * 100) : 0;
    
    // 計算公司盈虧（扣除公司支出分攤）
    const totalCompanyExpenses = Object.values(monthlyExpenses).reduce((sum, val) => sum + val, 0);
    const projectShare = projects.length > 0 ? totalCompanyExpenses / projects.length : 0;
    const companyProfit = profit - projectShare;
    
    // 設定樣式類別
    const profitClass = profit >= 0 ? 'positive' : 'negative';
    const ratioClass = profitRatio >= 0 ? 'positive' : 'negative';
    const companyProfitClass = companyProfit >= 0 ? 'positive' : 'negative';
    
    row.innerHTML = `
        <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <strong>${project.name}</strong>
                <button class="btn delete" onclick="editProjectName(${index})" title="編輯名稱" style="padding: 0.25rem;">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </td>
        ${expenseTypes.map((type, i) => `
            <td class="expense-col">
                <div class="expense-cell-content">
                    <input type="number" 
                           class="table-input" 
                           value="${project.expenses[type] || 0}"
                           onchange="updateProjectExpense(${index}, '${type}', this.value)"
                           min="0" step="0.01">
                    <span class="note-indicator ${project.notes && project.notes[type] ? '' : 'empty'}" 
                          onclick="editExpenseNote(${index}, '${type}')" 
                          title="${project.notes && project.notes[type] ? project.notes[type] : '點擊添加備註'}">
                        <i class="fas fa-sticky-note"></i>
                    </span>
                </div>
            </td>
        `).join('')}
        <td class="total-col">$${totalExpenses.toLocaleString()}</td>
        <td class="income-col">
            <input type="number" 
                   class="table-input" 
                   value="${project.totalIncome}"
                   onchange="updateProjectIncome(${index}, this.value)"
                   min="0" step="0.01">
        </td>
        <td class="profit-col ${profitClass}">$${profit.toLocaleString()}</td>
        <td class="profit-ratio-col ${ratioClass}">${profitRatio.toFixed(1)}%</td>
        <td class="company-profit-col ${companyProfitClass}">$${companyProfit.toLocaleString()}</td>
        <td class="payment-col">
            <input type="number" 
                   class="table-input" 
                   value="${project.payment || 0}"
                   onchange="updateProjectPayment(${index}, this.value)"
                   min="0" step="0.01">
        </td>
        <td>
            <button class="btn delete" onclick="deleteProject(${index})" title="刪除專案">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

// 顯示新增專案Modal
function showAddProjectModal() {
    document.getElementById('addProjectModal').style.display = 'block';
}

// 提交新專案
function submitNewProject() {
    const formData = new FormData(document.getElementById('projectForm'));
    
    const newProject = {
        name: formData.get('projectName').trim(),
        totalIncome: parseFloat(formData.get('projectIncome')) || 0,
        payment: parseFloat(formData.get('projectPayment')) || 0,
        expenses: {},
        notes: {}
    };
    
    // 初始化支出為0
    expenseTypes.forEach(type => {
        newProject.expenses[type] = 0;
    });
    
    if (!newProject.name) {
        alert('請輸入專案名稱');
        return;
    }
    
    projects.push(newProject);
    saveProjects();
    renderProjectsTable();
    updateStatistics();
    
    // 關閉Modal並重置表單
    document.getElementById('addProjectModal').style.display = 'none';
    document.getElementById('projectForm').reset();
    
    showToast('專案新增成功！');
}

// 更新專案支出
function updateProjectExpense(projectIndex, expenseType, value) {
    const numValue = parseFloat(value) || 0;
    if (!projects[projectIndex].expenses) {
        projects[projectIndex].expenses = {};
    }
    projects[projectIndex].expenses[expenseType] = numValue;
    saveProjects();
    renderProjectsTable();
    updateStatistics();
}

// 更新專案收入
function updateProjectIncome(projectIndex, value) {
    const numValue = parseFloat(value) || 0;
    projects[projectIndex].totalIncome = numValue;
    saveProjects();
    renderProjectsTable();
    updateStatistics();
}

// 更新專案收款
function updateProjectPayment(projectIndex, value) {
    const numValue = parseFloat(value) || 0;
    projects[projectIndex].payment = numValue;
    saveProjects();
    updateStatistics();
}

// 編輯專案名稱
function editProjectName(projectIndex) {
    const newName = prompt('請輸入新的專案名稱:', projects[projectIndex].name);
    if (newName && newName.trim()) {
        projects[projectIndex].name = newName.trim();
        saveProjects();
        renderProjectsTable();
    }
}

// 編輯支出備註
function editExpenseNote(projectIndex, expenseType) {
    const currentNote = (projects[projectIndex].notes && projects[projectIndex].notes[expenseType]) || '';
    const newNote = prompt(`請輸入「${expenseType}」的備註:`, currentNote);
    
    if (newNote !== null) {
        if (!projects[projectIndex].notes) {
            projects[projectIndex].notes = {};
        }
        projects[projectIndex].notes[expenseType] = newNote;
        saveProjects();
        renderProjectsTable();
    }
}

// 刪除專案
function deleteProject(projectIndex) {
    if (confirm(`確定要刪除專案「${projects[projectIndex].name}」嗎？`)) {
        projects.splice(projectIndex, 1);
        saveProjects();
        renderProjectsTable();
        updateStatistics();
        showToast('專案已刪除');
    }
}

// 更新月度支出
function updateMonthlyExpenses() {
    document.querySelectorAll('.monthly-input').forEach(input => {
        monthlyExpenses[input.id] = parseFloat(input.value) || 0;
    });
    
    saveMonthlyExpenses();
    updateMonthlyStats();
    renderProjectsTable(); // 重新渲染表格以更新公司盈虧
}

// 更新月度統計
function updateMonthlyStats() {
    const totalMonthlyExpenses = Object.values(monthlyExpenses).reduce((sum, val) => sum + val, 0);
    const totalPayments = projects.reduce((sum, project) => sum + (project.payment || 0), 0);
    const totalIncome = projects.reduce((sum, project) => sum + project.totalIncome, 0);
    
    document.getElementById('monthlyRevenue').textContent = `$${totalIncome.toLocaleString()}`;
    document.getElementById('monthlyExpenses').textContent = `$${totalMonthlyExpenses.toLocaleString()}`;
    document.getElementById('monthlyIncome').textContent = `$${totalPayments.toLocaleString()}`;
}

// 更新統計
function updateStatistics() {
    const totalIncome = projects.reduce((sum, project) => sum + project.totalIncome, 0);
    const totalExpenses = projects.reduce((sum, project) => {
        return sum + expenseTypes.reduce((expSum, type) => expSum + (project.expenses[type] || 0), 0);
    }, 0);
    const netProfit = totalIncome - totalExpenses;
    const avgRatio = totalIncome > 0 ? (netProfit / totalIncome * 100) : 0;
    
    document.getElementById('quickTotalIncome').textContent = `$${totalIncome.toLocaleString()}`;
    document.getElementById('quickTotalExpenses').textContent = `$${totalExpenses.toLocaleString()}`;
    document.getElementById('quickNetProfit').textContent = `$${netProfit.toLocaleString()}`;
    document.getElementById('quickAvgRatio').textContent = `${avgRatio.toFixed(1)}%`;
    
    updateMonthlyStats();
}

// 新增支出類型
function addExpenseType() {
    const newType = prompt('請輸入新的支出類型名稱:');
    if (newType && newType.trim()) {
        if (!expenseTypes.includes(newType.trim())) {
            expenseTypes.push(newType.trim());
            saveExpenseTypes();
            showToast('支出類型新增成功！請重新載入頁面查看新欄位');
        } else {
            alert('此支出類型已存在');
        }
    }
}

// 保存相關函數
function saveProjects() {
    localStorage.setItem(`projects_${currentMonth}`, JSON.stringify(projects));
}

function saveMonthlyExpenses() {
    localStorage.setItem(`monthlyExpenses_${currentMonth}`, JSON.stringify(monthlyExpenses));
}

function saveExpenseTypes() {
    localStorage.setItem('expenseTypes', JSON.stringify(expenseTypes));
}

// 導出數據
function exportData() {
    const allData = {
        month: currentMonth,
        projects: projects,
        monthlyExpenses: monthlyExpenses,
        expenseTypes: expenseTypes,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `專案收支_${currentMonth}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('數據導出成功！');
}

// 顯示提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--brand-success);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: slideInRight 0.3s ease-out;
    `;
    toast.innerHTML = `<i class="fas fa-check-circle" style="margin-right: 0.5rem;"></i>${message}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 添加CSS動畫
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// 新增月度支出項目（補充遺漏的函數）
function addMonthlyExpense() {
    // 這個函數可能在舊版本中存在，現在通過updateMonthlyExpenses處理
    console.log('addMonthlyExpense 函數已合併到 updateMonthlyExpenses 中');
}

// 載入支出類別選項（補充遺漏的函數）
function loadExpenseCategoryOptions() {
    // 在新版本中，支出類別直接在表格中顯示，不需要下拉選單
    console.log('loadExpenseCategoryOptions 函數在新版本中不需要');
}

// 顯示標籤頁（補充遺漏的函數）
function showTab(tabName) {
    // 新版本使用單一表格界面，不需要標籤頁切換
    console.log('showTab 函數在新版本中不需要，使用單一表格界面');
}

// 導出全域函數
window.initializeAppAfterLogin = initializeAppAfterLogin;
window.updateProjectExpense = updateProjectExpense;
window.updateProjectIncome = updateProjectIncome;
window.updateProjectPayment = updateProjectPayment;
window.editProjectName = editProjectName;
window.editExpenseNote = editExpenseNote;
window.deleteProject = deleteProject;
window.selectMonth = selectMonth;
window.addExpenseType = addExpenseType;
window.exportData = exportData;
window.addMonthlyExpense = addMonthlyExpense;
window.loadExpenseCategoryOptions = loadExpenseCategoryOptions;
window.showTab = showTab;
window.startLocalMode = startLocalMode;