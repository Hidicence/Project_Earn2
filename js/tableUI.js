// 表格UI邏輯 - 適配昨天的設計

if (!window.currentMonth) {
    window.currentMonth = new Date().toISOString().slice(0, 7);
}
let expenseTypes = ['器材租賃費用', '交通費', '餐費', '雜費', '人事費', '後製費'];
let projects = [];
let monthlyExpenses = {};
// currentUser 和 isLocalMode 在 auth.js 中已聲明

// 初始化應用
function initializeAppAfterLogin() {
    console.log('用戶已登入，初始化應用...');
    
    // 初始化主題
    initializeTheme();
    
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
    
    // 月份按鈕事件現在在 setupEventListeners 中統一處理
    
    // 檢查是否有保存的試算表並同步
    await checkAndSyncFromSheets();
    
    // 檢查是否需要顯示同步按鈕
    showSyncButton();
    
    console.log('應用初始化完成');
}

// 開始本地模式（從按鈕調用）
// 刪除與 auth.js 重複的 startLocalMode，改由 auth.js 負責

// 本地模式初始化
function initializeLocalMode() {
    console.log('使用本地模式初始化...');
    
    // 立即檢查按鈕是否存在
    const testBtn = document.getElementById('addMonthBtn');
    console.log('初始化時找到新增月份按鈕:', testBtn);
    
    // 初始化主題
    initializeTheme();
    
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
    
    // 月份按鈕事件現在在 setupEventListeners 中統一處理
    
    console.log('本地模式初始化完成');
}

// 初始化月份標籤
function initializeMonthTabs() {
    const container = document.getElementById('monthTabsContainer');
    container.innerHTML = '';
    
    // 獲取有資料的月份
    const userId = (window.getCurrentUserId && window.getCurrentUserId()) || 'local_user';
    const existingMonths = new Set();
    
    // 檢查 localStorage 中所有的月份資料
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const regex = new RegExp(`^${userId}_(?:projects|monthlyExpenses)_(\\d{4}-\\d{2})$`);
        const match = key.match(regex);
        if (match) {
            existingMonths.add(match[1]);
        }
    }
    
    // 確保當前月份包含在內
    existingMonths.add(window.currentMonth);
    
    // 只顯示有資料的月份，按時間順序排列（最新的在左邊）
    const sortedMonths = Array.from(existingMonths).sort().reverse();
    
    // 如果沒有任何月份資料，至少顯示當前月份
    if (sortedMonths.length === 0) {
        sortedMonths.push(window.currentMonth);
    }
    
    // 為每個月份創建標籤
    sortedMonths.forEach(monthValue => {
        const date = new Date(monthValue + '-01');
        const monthText = date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
        
        const tab = document.createElement('div');
        tab.className = 'month-tab';
        if (monthValue === window.currentMonth) {
            tab.classList.add('active');
        }
        
        // 檢查這個月份是否有資料
        const hasData = existingMonths.has(monthValue);
        if (hasData) {
            tab.setAttribute('data-has-data', 'true');
        }
        
        // 檢查是否有專案資料
        const userId = (window.getCurrentUserId && window.getCurrentUserId()) || 'local_user';
        const projectsData = localStorage.getItem(`${userId}_projects_${monthValue}`);
        const projects = projectsData ? JSON.parse(projectsData) : [];
        const hasProjects = projects.length > 0;
        
        tab.innerHTML = `
            <div class="month-tab-content">
                <div class="month-name">${monthText}</div>
                ${hasProjects ? `<div class="project-count">${projects.length} 個專案</div>` : '<div class="project-count empty">無專案</div>'}
            </div>
            <button class="delete-month" data-month="${monthValue}" title="刪除月份資料">
                <i class="fas fa-times"></i>
            </button>
        `;
        tab.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-month')) {
                selectMonth(monthValue, tab);
            }
        });
        
        container.appendChild(tab);
    });

    // 綁定刪除月份按鈕
    container.querySelectorAll('.delete-month').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const m = e.currentTarget.getAttribute('data-month');
            deleteMonth(m);
        });
    });
}

// 選擇月份
function selectMonth(month, tabElement) {
    window.currentMonth = month;
    if (window.syncManager) window.syncManager.onMonthChange();
    
    // 更新標籤狀態
    document.querySelectorAll('.month-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // 重新載入數據
    loadProjects();
    loadMonthlyExpenses();
    renderProjectsTable();
    updateStatistics();
}

// 設定事件監聽器
function setupEventListeners() {
    console.log('設置事件監聽器...');
    
    // 新增月份按鈕
    const addMonthBtn = document.getElementById('addMonthBtn');
    console.log('在setupEventListeners中找到新增月份按鈕:', addMonthBtn);
    if (addMonthBtn && !addMonthBtn.hasAttribute('data-listener')) {
        console.log('開始綁定新增月份按鈕事件');
        addMonthBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('=== 新增月份按鈕被點擊 ===');
            console.log('當前月份:', window.currentMonth);
            
            try {
                // 找到所有已存在的月份
                const userId = (window.getCurrentUserId && window.getCurrentUserId()) || 'local_user';
                console.log('用戶 ID:', userId);
                
                const existingMonths = new Set();
                
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    const regex = new RegExp(`^${userId}_(?:projects|monthlyExpenses)_(\\d{4}-\\d{2})$`);
                    const match = key.match(regex);
                    if (match) {
                        existingMonths.add(match[1]);
                    }
                }
                
                console.log('已存在的月份:', Array.from(existingMonths));
                
                // 找到最新（最大）的月份
                const sortedExistingMonths = Array.from(existingMonths).sort();
                const latestMonth = sortedExistingMonths.length > 0 ? 
                    sortedExistingMonths[sortedExistingMonths.length - 1] : 
                    window.currentMonth;
                
                console.log('最新月份:', latestMonth);
                
                // 創建下個月（基於最新月份）- 使用字串操作方式
                console.log('開始計算下個月...');
                const [year, month] = latestMonth.split('-').map(Number);
                console.log('解析出的年份:', year, '月份:', month);
                
                let nextYear = year;
                let nextMonth = month + 1;
                
                if (nextMonth > 12) {
                    nextYear++;
                    nextMonth = 1;
                }
                
                const nextMonthValue = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
                console.log('最終計算結果:', nextMonthValue);
                
                console.log('計算出的新增月份:', nextMonthValue);
                
                // 檢查是否超出合理範圍（不能超過當前日期太遠）
                const today = new Date();
                const currentYear = today.getFullYear();
                const currentMonth = today.getMonth() + 1; // JavaScript 月份從0開始
                
                // 允許新增到明年的同月
                const maxAllowedYear = currentYear + 1;
                const maxAllowedMonth = currentMonth;
                
                if (nextYear > maxAllowedYear || (nextYear === maxAllowedYear && nextMonth > maxAllowedMonth)) {
                    console.log('月份超出範圍');
                    showToast('不能新增過於未來的月份');
                    return;
                }
                
                // 檢查該月份是否已存在
                if (existingMonths.has(nextMonthValue)) {
                    console.log('月份已存在');
                    showToast(`${nextMonthValue} 月份已存在`);
                    return;
                }
                
                // 創建新月份的資料
                const projectsKey = `${userId}_projects_${nextMonthValue}`;
                const expensesKey = `${userId}_monthlyExpenses_${nextMonthValue}`;
                
                console.log('創建資料鍵:', projectsKey, expensesKey);
                
                // 創建空的專案列表
                localStorage.setItem(projectsKey, JSON.stringify([]));
                
                // 創建預設的月度支出
                const defaultExpenses = {
                    tax: 0, charity: 0, equipment: 0, miscellaneous: 0, salary: 0,
                    loan: 0, rent: 0, bni: 0, consulting: 0, insurance: 0
                };
                localStorage.setItem(expensesKey, JSON.stringify(defaultExpenses));
                
                console.log('資料創建完成');
                
                // 重新初始化月份標籤
                initializeMonthTabs();
                console.log('月份標籤重新初始化完成');
                
                showToast(`已新增月份 ${nextMonthValue}`);
                
            } catch (error) {
                console.error('新增月份時發生錯誤:', error);
                showToast('新增月份時發生錯誤: ' + error.message);
            }
        });
        addMonthBtn.setAttribute('data-listener', 'true');
        console.log('新增月份按鈕事件綁定完成');
    }
    
    // 主題切換按鈕
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn && !themeToggleBtn.hasAttribute('data-listener')) {
        themeToggleBtn.addEventListener('click', toggleTheme);
        themeToggleBtn.setAttribute('data-listener', 'true');
    }
    
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
            if (window.startLocalMode) {
                window.startLocalMode();
            } else {
                initializeLocalMode();
            }
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
    
    // 新增支出類型按鈕 → 改為開啟管理器
    const addExpenseTypeBtn = document.getElementById('addExpenseTypeBtn');
    if (addExpenseTypeBtn) {
        console.log('綁定新增支出類型按鈕');
        addExpenseTypeBtn.addEventListener('click', function() {
            console.log('新增支出類型按鈕被點擊');
            openExpenseTypesManager();
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
    
    // 同步按鈕
    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn && !syncBtn.hasAttribute('data-listener')) {
        syncBtn.addEventListener('click', function() {
            console.log('同步按鈕被點擊');
            syncWithSheets();
        });
        syncBtn.setAttribute('data-listener', 'true');
    }

    // 搜尋/篩選
    const projectSearch = document.getElementById('projectSearch');
    if (projectSearch && !projectSearch.hasAttribute('data-listener')) {
        projectSearch.addEventListener('input', () => {
            renderProjectsTable();
        });
        projectSearch.setAttribute('data-listener', 'true');
    }
    const profitFilter = document.getElementById('profitFilter');
    if (profitFilter && !profitFilter.hasAttribute('data-listener')) {
        profitFilter.addEventListener('change', () => {
            renderProjectsTable();
        });
        profitFilter.setAttribute('data-listener', 'true');
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

    // 支出類型 Modal 內的新增與關閉
    const expenseTypesModal = document.getElementById('expenseTypesModal');
    if (expenseTypesModal && !expenseTypesModal.hasAttribute('data-listener')) {
        expenseTypesModal.addEventListener('click', function(e) {
            if (e.target.classList.contains('close')) {
                expenseTypesModal.style.display = 'none';
            }
        });
        expenseTypesModal.setAttribute('data-listener', 'true');
    }
    const confirmAddExpenseTypeBtn = document.getElementById('confirmAddExpenseTypeBtn');
    if (confirmAddExpenseTypeBtn && !confirmAddExpenseTypeBtn.hasAttribute('data-listener')) {
        confirmAddExpenseTypeBtn.addEventListener('click', async function() {
            const input = document.getElementById('newExpenseTypeInput');
            const val = (input.value || '').trim();
            if (!val) return;
            if (!expenseTypes.includes(val)) {
                expenseTypes.push(val);
                saveExpenseTypes();
                renderExpenseTypesList();
                updateTableHeaders(); // 這會自動調用 renderProjectsTable()
                input.value = '';
                showToast('支出類型新增成功！');
            } else {
                await customAlert('此支出類型已存在', '錯誤');
            }
        });
        confirmAddExpenseTypeBtn.setAttribute('data-listener', 'true');
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
    const thead = document.querySelector('#projectsTable thead tr');
    
    // 移除所有現有的支出類型欄位
    const existingExpenseCols = thead.querySelectorAll('.expense-col');
    existingExpenseCols.forEach(col => col.remove());
    
    // 找到專案名稱欄位，在它後面插入支出類型欄位
    const projectNameCol = thead.querySelector('.project-name-col');
    let insertAfter = projectNameCol;
    
    // 動態創建支出類型欄位
    expenseTypes.forEach((type, index) => {
        const th = document.createElement('th');
        th.className = 'expense-col';
        th.id = `expenseCol${index + 1}`;
        th.textContent = type;
        insertAfter.insertAdjacentElement('afterend', th);
        insertAfter = th;
    });
    
    // 重新渲染表格內容
    renderProjectsTable();
}

// 載入專案數據
function loadProjects() {
    // 獲取正確的存儲鍵（考慮用戶 ID）
    const userId = (window.getCurrentUserId && window.getCurrentUserId()) || 'local_user';
    const key = `${userId}_projects_${window.currentMonth}`;
    const storedProjects = localStorage.getItem(key);
    
    // 如果帶用戶ID的鍵沒有數據，嘗試讀取舊格式
    if (!storedProjects) {
        const oldKey = `projects_${window.currentMonth}`;
        const oldData = localStorage.getItem(oldKey);
        if (oldData) {
            console.log(`遷移數據從 ${oldKey} 到 ${key}`);
            localStorage.setItem(key, oldData);
            localStorage.removeItem(oldKey);
            projects = JSON.parse(oldData);
            return;
        }
    }
    
    projects = storedProjects ? JSON.parse(storedProjects) : [];
}

// 載入月度支出數據
function loadMonthlyExpenses() {
    // 獲取正確的存儲鍵（考慮用戶 ID）
    const userId = (window.getCurrentUserId && window.getCurrentUserId()) || 'local_user';
    const key = `${userId}_monthlyExpenses_${window.currentMonth}`;
    const storedExpenses = localStorage.getItem(key);
    
    let expenses = {};
    if (!storedExpenses) {
        // 如果帶用戶ID的鍵沒有數據，嘗試讀取舊格式
        const oldKey = `monthlyExpenses_${window.currentMonth}`;
        const oldData = localStorage.getItem(oldKey);
        if (oldData) {
            console.log(`遷移數據從 ${oldKey} 到 ${key}`);
            localStorage.setItem(key, oldData);
            localStorage.removeItem(oldKey);
            expenses = JSON.parse(oldData);
        }
    } else {
        expenses = JSON.parse(storedExpenses);
    }
    
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
    
    // 搜尋與篩選
    const keyword = (document.getElementById('projectSearch')?.value || '').toLowerCase().trim();
    const filter = (document.getElementById('profitFilter')?.value || 'all');
    
    const filtered = projects.filter(p => {
        const nameMatch = !keyword || (p.name || '').toLowerCase().includes(keyword);
        // 計算盈虧
        const totalExpenses = expenseTypes.reduce((sum, type) => sum + (p.expenses[type] || 0), 0);
        const profit = (p.totalIncome || 0) - totalExpenses;
        const ratio = (p.totalIncome || 0) > 0 ? (profit / p.totalIncome * 100) : 0;
        let pass = true;
        if (filter === 'profitable') pass = profit > 0;
        if (filter === 'loss') pass = profit < 0;
        if (filter === 'high-ratio') pass = ratio >= 30;
        return nameMatch && pass;
    });
    
    if (filtered.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="13" style="text-align: center; padding: 2rem; color: #6b7280;">
                <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                無符合條件的專案，試試調整搜尋或篩選
            </td>
        `;
        tbody.appendChild(row);
        return;
    }
    
    filtered.forEach((project, index) => {
        const realIndex = projects.indexOf(project);
        const row = createProjectRow(project, realIndex);
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
    
    // 計算本月營運盈虧比（按預算配比分攤營運支出）
    const totalCompanyExpenses = Object.values(monthlyExpenses).reduce((sum, val) => sum + val, 0);
    const totalProjectBudgets = projects.reduce((sum, p) => sum + (p.totalIncome || 0), 0);
    const projectBudgetRatio = totalProjectBudgets > 0 ? (project.totalIncome || 0) / totalProjectBudgets : 0;
    const projectCompanyExpenseShare = totalCompanyExpenses * projectBudgetRatio;
    const monthlyOperatingProfit = (project.totalIncome || 0) - projectCompanyExpenseShare;
    const monthlyOperatingProfitRatio = (project.totalIncome || 0) > 0 ? (monthlyOperatingProfit / (project.totalIncome || 0) * 100) : 0;
    
    // 設定樣式類別
    const profitClass = profit >= 0 ? 'positive' : 'negative';
    const ratioClass = profitRatio >= 0 ? 'positive' : 'negative';
    const monthlyOperatingRatioClass = monthlyOperatingProfitRatio >= 0 ? 'positive' : 'negative';
    
    row.innerHTML = `
        <td class="project-name-col"
            data-value="${project.name}"
            data-type="projectName"
            data-index="${index}"
            ondblclick="startCellEditFromTd(this)">
            <div class="editable-cell project-name-cell">
                ${project.name}
            </div>
        </td>
        ${expenseTypes.map((type, i) => `
            <td class="expense-col" 
                data-value="${project.expenses[type] || 0}"
                data-type="expense"
                data-index="${index}"
                data-expense-type="${type}"
                ondblclick="startCellEditFromTd(this)">
                <div class="expense-cell-content">
                    <div class="editable-cell">
                        ${(project.expenses[type] || 0) === 0 ? '' : (project.expenses[type] || 0).toLocaleString()}
                    </div>
                    <span class="note-indicator ${project.notes && project.notes[type] ? '' : 'empty'}" 
                          onclick="editExpenseNote(${index}, '${type}')" 
                          title="${project.notes && project.notes[type] ? project.notes[type] : '點擊添加備註'}">
                        <i class="fas fa-sticky-note"></i>
                    </span>
                </div>
            </td>
        `).join('')}
        <td class="total-col">$${totalExpenses.toLocaleString()}</td>
        <td class="income-col"
            data-value="${project.totalIncome || 0}"
            data-type="income"
            data-index="${index}"
            ondblclick="startCellEditFromTd(this)">
            <div class="editable-cell">
                ${(project.totalIncome || 0) === 0 ? '' : (project.totalIncome || 0).toLocaleString()}
            </div>
        </td>
        <td class="profit-col ${profitClass}">$${profit.toLocaleString()}</td>
        <td class="profit-ratio-col ${ratioClass}">${profitRatio.toFixed(1)}%</td>
        <td class="company-profit-col ${monthlyOperatingRatioClass}">${monthlyOperatingProfitRatio.toFixed(1)}%</td>
        <td class="payment-col">
            <div class="checkbox-container">
                <input type="checkbox" 
                       class="payment-checkbox" 
                       ${project.paymentReceived ? 'checked' : ''}
                       onchange="updatePaymentStatus(${index}, this.checked)"
                       id="payment-${index}">
                <label for="payment-${index}" class="checkbox-label">
                    ${project.paymentReceived ? '已收款' : '未收款'}
                </label>
            </div>
        </td>
        <td class="outsourcing-col">
            <div class="checkbox-container">
                <input type="checkbox" 
                       class="outsourcing-checkbox" 
                       ${project.isOutsourced ? 'checked' : ''}
                       onchange="updateOutsourcingStatus(${index}, this.checked)"
                       id="outsourcing-${index}">
                <label for="outsourcing-${index}" class="checkbox-label">
                    ${project.isOutsourced ? '已外發' : '未外發'}
                </label>
            </div>
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
async function submitNewProject() {
    const formData = new FormData(document.getElementById('projectForm'));
    
    const newProject = {
        name: (formData.get('projectName') || '').toString().trim(),
        totalIncome: parseFloat(formData.get('projectIncome') || '0') || 0,
        payment: parseFloat(formData.get('projectPayment') || '0') || 0,
        expenses: {},
        notes: {},
        paymentReceived: false,
        isOutsourced: false
    };
    
    // 初始化支出為0
    expenseTypes.forEach(type => {
        newProject.expenses[type] = 0;
    });
    
    if (!newProject.name) {
        await customAlert('請輸入專案名稱', '錯誤');
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

// 更新收款狀態
function updatePaymentStatus(projectIndex, checked) {
    projects[projectIndex].paymentReceived = checked;
    saveProjects();
    renderProjectsTable();
    updateStatistics();
}

// 更新後製外發狀態
function updateOutsourcingStatus(projectIndex, checked) {
    projects[projectIndex].isOutsourced = checked;
    saveProjects();
    renderProjectsTable();
}

// 更新專案名稱
function updateProjectName(projectIndex, newName) {
    if (newName && newName.trim()) {
        projects[projectIndex].name = newName.trim();
        saveProjects();
        renderProjectsTable();
    }
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
async function editExpenseNote(projectIndex, expenseType) {
    const currentNote = (projects[projectIndex].notes && projects[projectIndex].notes[expenseType]) || '';
    const newNote = await customPrompt(
        `請輸入「${expenseType}」的備註:`,
        currentNote,
        '編輯備註'
    );
    
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
async function deleteProject(projectIndex) {
    const confirmed = await customConfirm(
        `確定要刪除專案「${projects[projectIndex].name}」嗎？`,
        '刪除專案'
    );
    if (confirmed) {
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
    
    // 計算總收入和實際收款金額（根據 paymentReceived 狀態）
    const totalIncome = projects.reduce((sum, project) => sum + (project.totalIncome || 0), 0);
    const totalPayments = projects.reduce((sum, project) => {
        return sum + (project.paymentReceived ? (project.totalIncome || 0) : 0);
    }, 0);
    
    // 計算調整後盈餘：收款總額 - 當月支出總額
    const adjustedProfit = totalPayments - totalMonthlyExpenses;
    
    document.getElementById('monthlyRevenue').textContent = `$${totalIncome.toLocaleString()}`;
    document.getElementById('monthlyExpenses').textContent = `$${totalMonthlyExpenses.toLocaleString()}`;
    document.getElementById('monthlyIncome').textContent = `$${totalPayments.toLocaleString()}`;
    document.getElementById('adjustedProfit').textContent = `$${adjustedProfit.toLocaleString()}`;
}

// 更新統計
function updateStatistics() {
    // 計算總收入和總支出
    const totalIncome = projects.reduce((sum, project) => sum + (project.totalIncome || 0), 0);
    const totalExpenses = projects.reduce((sum, project) => {
        return sum + expenseTypes.reduce((expSum, type) => expSum + (project.expenses[type] || 0), 0);
    }, 0);
    
    // 計算淨利潤和平均營利比
    const netProfit = totalIncome - totalExpenses;
    const avgRatio = totalIncome > 0 ? (netProfit / totalIncome * 100) : 0;
    
    // 更新快速統計顯示
    document.getElementById('quickTotalIncome').textContent = `$${totalIncome.toLocaleString()}`;
    document.getElementById('quickTotalExpenses').textContent = `$${totalExpenses.toLocaleString()}`;
    document.getElementById('quickNetProfit').textContent = `$${netProfit.toLocaleString()}`;
    document.getElementById('quickAvgRatio').textContent = `${avgRatio.toFixed(1)}%`;
    
    // 同時更新月度統計
    updateMonthlyStats();
}

// 新增支出類型
async function addExpenseType() {
    const newType = prompt('請輸入新的支出類型名稱:');
    if (newType && newType.trim()) {
        if (!expenseTypes.includes(newType.trim())) {
            expenseTypes.push(newType.trim());
            saveExpenseTypes();
            showToast('支出類型新增成功！請重新載入頁面查看新欄位');
        } else {
            await customAlert('此支出類型已存在', '錯誤');
        }
    }
}

// 保存相關函數
function saveProjects() {
    // 獲取正確的存儲鍵（考慮用戶 ID）
    const userId = (window.getCurrentUserId && window.getCurrentUserId()) || 'local_user';
    const key = `${userId}_projects_${window.currentMonth}`;
    localStorage.setItem(key, JSON.stringify(projects));
    if (window.syncManager) window.syncManager.onLocalChange();
}

function saveMonthlyExpenses() {
    // 獲取正確的存儲鍵（考慮用戶 ID）
    const userId = (window.getCurrentUserId && window.getCurrentUserId()) || 'local_user';
    const key = `${userId}_monthlyExpenses_${window.currentMonth}`;
    localStorage.setItem(key, JSON.stringify(monthlyExpenses));
    if (window.syncManager) window.syncManager.onLocalChange();
}

function saveExpenseTypes() {
    localStorage.setItem('expenseTypes', JSON.stringify(expenseTypes));
    if (window.syncManager) window.syncManager.onLocalChange();
}

// 導出數據
async function exportData() {
    try {
        const allData = {
            month: window.currentMonth,
            projects: projects,
            monthlyExpenses: monthlyExpenses,
            expenseTypes: expenseTypes,
            exportDate: new Date().toISOString()
        };
        
        // 檢查是否已登入 Google
        if (!window.currentUser) {
            // 回退到 JSON 導出
            exportAsJSON(allData);
            return;
        }
        
        // 嘗試創建 Google 試算表
        showToast('正在創建 Google 試算表...', 'info');
        
        const title = `專案收支管理_${window.currentMonth}_${new Date().getTime()}`;
        
        try {
            const sheet = await window.SheetsAPI.createSheet(title, allData);
            
            // 保存試算表 ID
            window.SheetsAPI.saveSpreadsheetId(sheet.id);
            
            // 顯示同步按鈕
            onSheetCreated();
            
            // 在新視窗中開啟試算表
            window.open(sheet.url, '_blank');
            
            showToast(`試算表創建成功！已在新視窗開啟`, 'success');
            
        } catch (sheetsError) {
            console.error('Google Sheets 導出失敗:', sheetsError);
            
            // 詢問用戶是否要重新授權
            const shouldReauth = await customConfirm(
                'Google Sheets 導出失敗。可能需要重新授權。是否要重新授權？',
                '導出失敗'
            );
            
            if (shouldReauth) {
                await reauthorizeSheets();
                // 重新嘗試導出
                await exportData();
            } else {
                // 回退到 JSON 導出
                exportAsJSON(allData);
            }
        }
        
    } catch (error) {
        console.error('導出數據失敗:', error);
        showToast('導出失敗: ' + error.message, 'error');
    }
}

// 導出為 JSON (回退方案)
function exportAsJSON(allData) {
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `專案收支_${window.currentMonth}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('已導出為 JSON 文件', 'info');
}

// 重新授權 Sheets
async function reauthorizeSheets() {
    try {
        const hasPermission = await requestSheetsPermission();
        if (hasPermission) {
            showToast('授權成功！', 'success');
        } else {
            showToast('授權失敗', 'error');
        }
    } catch (error) {
        console.error('重新授權失敗:', error);
        showToast('授權失敗: ' + error.message, 'error');
    }
}

// 檢查並從 Google Sheets 同步數據
async function checkAndSyncFromSheets() {
    try {
        // 檢查是否已登入 Google 和是否有保存的試算表
        if (!window.currentUser || !window.currentUser.accessToken) {
            console.log('用戶未登入或無 Google 權限，跳過同步');
            return;
        }
        
        const savedSpreadsheetId = window.SheetsAPI.getSavedSpreadsheetId();
        if (!savedSpreadsheetId) {
            console.log('未找到保存的試算表 ID');
            return;
        }
        
        console.log('發現保存的試算表，開始同步...', savedSpreadsheetId);
        
        // 從試算表讀取數據
        const sheetsData = await window.SheetsAPI.readFromSheet(savedSpreadsheetId);
        
        // 應用數據到本地
        if (sheetsData.projects) {
            projects = sheetsData.projects;
            saveProjects();
        }
        
        if (sheetsData.monthlyExpenses) {
            monthlyExpenses = sheetsData.monthlyExpenses;
            saveMonthlyExpenses();
        }
        
        if (sheetsData.expenseTypes && sheetsData.expenseTypes.length > 0) {
            expenseTypes = sheetsData.expenseTypes;
            saveExpenseTypes();
            updateTableHeaders();
        }
        
        // 重新渲染界面
        renderProjectsTable();
        updateStatistics();
        
        showToast('已從 Google 試算表同步數據', 'success');
        console.log('Google Sheets 同步完成');
        
        // 顯示同步按鈕
        showSyncButton();
        
    } catch (error) {
        console.error('從 Google Sheets 同步數據失敗:', error);
        // 不顯示錯誤消息給用戶，避免打斷正常流程
    }
}

// 顯示或隱藏同步按鈕
function showSyncButton() {
    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn && window.currentUser && window.SheetsAPI.getSavedSpreadsheetId()) {
        syncBtn.style.display = 'flex';
    } else if (syncBtn) {
        syncBtn.style.display = 'none';
    }
}

// 當創建新試算表時顯示同步按鈕
function onSheetCreated() {
    showSyncButton();
}

// 手動同步功能
async function syncWithSheets() {
    try {
        const savedSpreadsheetId = window.SheetsAPI.getSavedSpreadsheetId();
        if (!savedSpreadsheetId) {
            showToast('未找到關聯的 Google 試算表', 'warning');
            return;
        }
        
        showToast('正在同步...', 'info');
        
        // 從試算表讀取最新數據
        const sheetsData = await window.SheetsAPI.readFromSheet(savedSpreadsheetId);
        
        // 詢問用戶是要更新本地數據還是更新試算表
        const syncDirection = await customConfirm(
            '請選擇同步方向：\n確定 - 用試算表數據更新本地\n取消 - 用本地數據更新試算表',
            '同步方向'
        );
        
        if (syncDirection) {
            // 用試算表數據更新本地
            if (sheetsData.projects) {
                projects = sheetsData.projects;
                saveProjects();
            }
            
            if (sheetsData.monthlyExpenses) {
                monthlyExpenses = sheetsData.monthlyExpenses;
                saveMonthlyExpenses();
            }
            
            if (sheetsData.expenseTypes) {
                expenseTypes = sheetsData.expenseTypes;
                saveExpenseTypes();
                updateTableHeaders();
            }
            
            renderProjectsTable();
            updateStatistics();
            showToast('已用試算表數據更新本地', 'success');
            
        } else {
            // 用本地數據更新試算表
            const allData = {
                month: window.currentMonth,
                projects: projects,
                monthlyExpenses: monthlyExpenses,
                expenseTypes: expenseTypes
            };
            
            await window.SheetsAPI.updateSheet(savedSpreadsheetId, allData);
            showToast('已用本地數據更新試算表', 'success');
        }
        
    } catch (error) {
        console.error('同步失敗:', error);
        showToast('同步失敗: ' + error.message, 'error');
    }
}

// 顯示提示 (支援不同類型)
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    
    let backgroundColor, icon;
    switch (type) {
        case 'error':
            backgroundColor = 'var(--brand-error)';
            icon = 'fas fa-times-circle';
            break;
        case 'info':
            backgroundColor = 'var(--brand-primary)';
            icon = 'fas fa-info-circle';
            break;
        case 'warning':
            backgroundColor = 'var(--warning-color)';
            icon = 'fas fa-exclamation-triangle';
            break;
        default: // success
            backgroundColor = 'var(--brand-success)';
            icon = 'fas fa-check-circle';
    }
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
    `;
    toast.innerHTML = `<i class="${icon}" style="margin-right: 0.5rem;"></i>${message}`;
    
    document.body.appendChild(toast);
    
    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
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

// 主題切換功能
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
    
    showToast(`已切換到${newTheme === 'light' ? '亮色' : '暗色'}模式`);
}

function updateThemeButton(theme) {
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    if (theme === 'dark') {
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = '亮色模式';
    } else {
        themeIcon.className = 'fas fa-moon';
        themeText.textContent = '暗色模式';
    }
}

// 自定義對話框函數
function customConfirm(message, title = '確認操作') {
    return new Promise((resolve) => {
        const modal = document.getElementById('customConfirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        modal.style.display = 'block';
        
        const handleResponse = (result) => {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            resolve(result);
        };
        
        const handleOk = () => handleResponse(true);
        const handleCancel = () => handleResponse(false);
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        
        // ESC鍵取消
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleKeyPress);
                handleResponse(false);
            }
        };
        document.addEventListener('keydown', handleKeyPress);
    });
}

function customPrompt(message, defaultValue = '', title = '輸入內容') {
    return new Promise((resolve) => {
        const modal = document.getElementById('customPromptModal');
        const titleEl = document.getElementById('promptTitle');
        const messageEl = document.getElementById('promptMessage');
        const inputEl = document.getElementById('promptInput');
        const okBtn = document.getElementById('promptOkBtn');
        const cancelBtn = document.getElementById('promptCancelBtn');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        inputEl.value = defaultValue;
        modal.style.display = 'block';
        
        // 聚焦輸入框並選中文字
        setTimeout(() => {
            inputEl.focus();
            inputEl.select();
        }, 100);
        
        const handleResponse = (result) => {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            inputEl.removeEventListener('keydown', handleKeyDown);
            resolve(result);
        };
        
        const handleOk = () => handleResponse(inputEl.value);
        const handleCancel = () => handleResponse(null);
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleResponse(inputEl.value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleResponse(null);
            }
        };
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        inputEl.addEventListener('keydown', handleKeyDown);
    });
}

function customAlert(message, title = '提示') {
    return new Promise((resolve) => {
        const modal = document.getElementById('customAlertModal');
        const titleEl = document.getElementById('alertTitle');
        const messageEl = document.getElementById('alertMessage');
        const okBtn = document.getElementById('alertOkBtn');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        modal.style.display = 'block';
        
        const handleResponse = () => {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', handleResponse);
            resolve();
        };
        
        okBtn.addEventListener('click', handleResponse);
        
        // ESC鍵關閉
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleKeyPress);
                handleResponse();
            }
        };
        document.addEventListener('keydown', handleKeyPress);
    });
}

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


// 從td開始編輯（處理整個欄位點擊）
function startCellEditFromTd(td) {
    console.log('startCellEditFromTd called with:', td); // 除錯用
    // 找到內部的editable-cell
    const editableCell = td.querySelector('.editable-cell');
    console.log('Found editable cell:', editableCell); // 除錯用
    if (editableCell) {
        // 將td的data屬性複製到editable-cell
        editableCell.dataset.value = td.dataset.value;
        editableCell.dataset.type = td.dataset.type;
        editableCell.dataset.index = td.dataset.index;
        editableCell.dataset.expenseType = td.dataset.expenseType;
        
        console.log('Starting cell edit...'); // 除錯用
        startCellEdit(editableCell);
    } else {
        console.log('No editable cell found in td'); // 除錯用
    }
}

// 雙擊編輯功能 - inline編輯
function startCellEdit(cell) {
    // 避免重複編輯
    if (cell.classList.contains('editing')) return;
    
    cell.classList.add('editing');
    const currentValue = cell.dataset.value || '0';
    const originalContent = cell.innerHTML;
    
    // 將cell變成可編輯狀態
    cell.contentEditable = true;
    cell.style.outline = '2px solid var(--brand-primary)';
    cell.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
    
    // 設置內容 - 專案名稱顯示原值，數字去掉千分位逗號
    if (cell.dataset.type === 'projectName') {
        cell.textContent = currentValue;
    } else {
        cell.textContent = currentValue === '0' ? '' : currentValue;
    }
    
    // 立即選取所有內容
    cell.focus();
    
    // 選取所有文字
    if (window.getSelection && document.createRange) {
        const range = document.createRange();
        range.selectNodeContents(cell);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    // 完成編輯
    function finishEdit() {
        const textValue = cell.textContent.trim();
        const newValue = parseFloat(textValue) || 0;
        const index = parseInt(cell.dataset.index);
        const type = cell.dataset.type;
        const expenseType = cell.dataset.expenseType;
        
        // 更新數據
        if (type === 'expense') {
            updateProjectExpense(index, expenseType, newValue);
        } else if (type === 'income') {
            updateProjectIncome(index, newValue);
        } else if (type === 'payment') {
            updateProjectPayment(index, newValue);
        } else if (type === 'projectName') {
            updateProjectName(index, textValue.trim());
        }
        
        // 恢復顯示
        cell.contentEditable = false;
        cell.style.outline = '';
        cell.style.backgroundColor = '';
        
        if (type === 'projectName') {
            cell.dataset.value = textValue.trim();
            cell.innerHTML = textValue.trim();
        } else {
            cell.dataset.value = newValue;
            cell.innerHTML = newValue === 0 ? '' : newValue.toLocaleString();
        }
        cell.classList.remove('editing');
        
        // 同時更新父td的dataset
        const parentTd = cell.closest('td[ondblclick]');
        if (parentTd) {
            parentTd.dataset.value = newValue;
        }
    }
    
    // 取消編輯
    function cancelEdit() {
        cell.contentEditable = false;
        cell.style.outline = '';
        cell.style.backgroundColor = '';
        cell.innerHTML = originalContent;
        cell.classList.remove('editing');
    }
    
    // 標記是否是Tab跳轉
    let isTabMove = false;
    
    // 事件處理
    cell.addEventListener('blur', function(e) {
        if (!isTabMove) {
            finishEdit();
        }
    }, { once: true });
    
    const keydownHandler = function(e) {
        console.log('Key pressed:', e.key); // 除錯用
        if (e.key === 'Enter') {
            e.preventDefault();
            cell.blur(); // 觸發blur事件完成編輯
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        } else if (e.key === 'Tab') {
            e.preventDefault();
            e.stopPropagation();
            isTabMove = true;
            console.log('Tab pressed, moving to next cell'); // 除錯用
            // 移除事件監聽器避免衝突
            cell.removeEventListener('keydown', keydownHandler);
            // 完成當前編輯並跳到下一個欄位
            finishEditAndMoveNext(cell, e.shiftKey);
            return false;
        }
        // 只允許數字、小數點、退格鍵等
        if (!/[\d.,\b\-]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
            e.preventDefault();
        }
    };
    
    cell.addEventListener('keydown', keydownHandler);
}

// Tab鍵跳轉功能
function finishEditAndMoveNext(currentCell, isShiftTab = false) {
    // 首先完成當前編輯
    const textValue = currentCell.textContent.trim();
    const newValue = parseFloat(textValue) || 0;
    const index = parseInt(currentCell.dataset.index);
    const type = currentCell.dataset.type;
    const expenseType = currentCell.dataset.expenseType;
    
    // 更新數據
    if (type === 'expense') {
        updateProjectExpense(index, expenseType, newValue);
    } else if (type === 'income') {
        updateProjectIncome(index, newValue);
    } else if (type === 'payment') {
        updateProjectPayment(index, newValue);
    }
    
    // 恢復當前cell顯示
    currentCell.contentEditable = false;
    currentCell.style.outline = '';
    currentCell.style.backgroundColor = '';
    currentCell.dataset.value = newValue;
    currentCell.innerHTML = newValue === 0 ? '' : newValue.toLocaleString();
    currentCell.classList.remove('editing');
    
    // 更新父td的dataset
    const parentTd = currentCell.closest('td[ondblclick]');
    if (parentTd) {
        parentTd.dataset.value = newValue;
    }
    
    // 找到下一個可編輯的欄位
    const nextCell = findNextEditableCell(currentCell, isShiftTab);
    console.log('Next cell found:', nextCell); // 除錯用
    if (nextCell) {
        // 延遲一點開始編輯下一個欄位，確保當前編輯完成
        setTimeout(() => {
            console.log('Starting edit on next cell'); // 除錯用
            startCellEditFromTd(nextCell);
        }, 100);
    } else {
        console.log('No next cell found'); // 除錯用
    }
}

// 找到下一個可編輯的欄位
function findNextEditableCell(currentCell, isShiftTab = false) {
    const parentTd = currentCell.closest('td[ondblclick]');
    if (!parentTd) return null;
    
    const currentRow = parentTd.closest('tr');
    if (!currentRow) return null;
    
    // 獲取當前行所有可編輯的td
    const editableTds = Array.from(currentRow.querySelectorAll('td[ondblclick]'));
    const currentIndex = editableTds.indexOf(parentTd);
    
    if (currentIndex === -1) return null;
    
    let nextIndex;
    if (isShiftTab) {
        // Shift+Tab: 往前移動
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
            // 移動到上一行的最後一個可編輯欄位
            const prevRow = currentRow.previousElementSibling;
            if (prevRow && prevRow.tagName === 'TR') {
                const prevRowEditableTds = Array.from(prevRow.querySelectorAll('td[ondblclick]'));
                return prevRowEditableTds[prevRowEditableTds.length - 1];
            }
            return null;
        }
    } else {
        // Tab: 往後移動
        nextIndex = currentIndex + 1;
        if (nextIndex >= editableTds.length) {
            // 移動到下一行的第一個可編輯欄位
            const nextRow = currentRow.nextElementSibling;
            if (nextRow && nextRow.tagName === 'TR') {
                const nextRowEditableTds = Array.from(nextRow.querySelectorAll('td[ondblclick]'));
                return nextRowEditableTds[0];
            }
            return null;
        }
    }
    
    return editableTds[nextIndex];
}

// bindMonthAddAndDelete 函數已經整合到 setupEventListeners 中

// 刪除月份（清除該月資料）
async function deleteMonth(month) {
    if (!month) return;
    const confirmed = await customConfirm(`確定清除 ${month} 的資料嗎？`, '刪除月份資料');
    if (!confirmed) return;
    
    // 獲取正確的存儲鍵（考慮用戶 ID）
    const userId = (window.getCurrentUserId && window.getCurrentUserId()) || 'local_user';
    const projectsKey = `${userId}_projects_${month}`;
    const expensesKey = `${userId}_monthlyExpenses_${month}`;
    
    // 同時清除新舊格式的數據
    localStorage.removeItem(projectsKey);
    localStorage.removeItem(expensesKey);
    localStorage.removeItem(`projects_${month}`);  // 舊格式
    localStorage.removeItem(`monthlyExpenses_${month}`);  // 舊格式
    
    if (window.currentMonth === month) {
        window.currentMonth = new Date().toISOString().slice(0, 7);
    }
    initializeMonthTabs();
    loadProjects();
    loadMonthlyExpenses();
    renderProjectsTable();
    updateStatistics();
    showToast('月份資料已清除');
}

// 打開支出類型管理器
function openExpenseTypesManager() {
    renderExpenseTypesList();
    const modal = document.getElementById('expenseTypesModal');
    if (modal) modal.style.display = 'block';
}

// 渲染支出類型列表（含刪除）
function renderExpenseTypesList() {
    const container = document.getElementById('expenseTypesList');
    if (!container) return;
    container.innerHTML = '';
    expenseTypes.forEach((type, idx) => {
        const item = document.createElement('div');
        item.className = 'expense-type-item';
        item.innerHTML = `
            <span class="expense-type-name">${type}</span>
            <div>
                <button class="btn delete" data-index="${idx}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        item.querySelector('.btn.delete').addEventListener('click', async () => {
            const confirmed = await customConfirm(`確定刪除「${type}」嗎？`, '刪除支出類型');
            if (confirmed) {
                expenseTypes.splice(idx, 1);
                saveExpenseTypes();
                updateTableHeaders();
                renderExpenseTypesList();
                showToast('支出類型已刪除');
            }
        });
        container.appendChild(item);
    });
}

// 導出全域函數
window.initializeAppAfterLogin = initializeAppAfterLogin;
window.updateProjectExpense = updateProjectExpense;
window.updateProjectIncome = updateProjectIncome;
window.updateProjectPayment = updateProjectPayment;
window.updatePaymentStatus = updatePaymentStatus;
window.updateOutsourcingStatus = updateOutsourcingStatus;
window.editProjectName = editProjectName;
window.editExpenseNote = editExpenseNote;
window.deleteProject = deleteProject;
window.selectMonth = selectMonth;
window.addExpenseType = addExpenseType;
window.exportData = exportData;
window.addMonthlyExpense = addMonthlyExpense;
window.loadExpenseCategoryOptions = loadExpenseCategoryOptions;
window.showTab = showTab;
window.deleteMonth = deleteMonth;
window.openExpenseTypesManager = openExpenseTypesManager;
window.renderExpenseTypesList = renderExpenseTypesList;
// 不再導出本檔的 startLocalMode，避免覆蓋 auth.js 的同名函式