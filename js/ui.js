// UI 控制相關功能

let currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
let currentTab = 'projects';
let currentProjectId = null;

// ===== 初始化應用 =====
function initializeApp() {
    initializeData();
    initializeMonthSelector();
    loadExpenseCategoryOptions();
    loadCurrentTab();
    
    console.log('應用初始化完成');
}

// 初始化月份選擇器
function initializeMonthSelector() {
    const monthSelector = document.getElementById('monthSelector');
    monthSelector.value = currentMonth;
}

// ===== 標籤頁管理 =====
function showTab(tabName) {
    // 隱藏所有標籤頁
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.add('d-none'));
    
    // 移除所有活動狀態
    const navItems = document.querySelectorAll('.list-group-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // 顯示選中的標籤頁
    document.getElementById(tabName + 'Tab').classList.remove('d-none');
    
    // 設定標籤頁標題
    const titles = {
        'projects': '專案管理',
        'company-expenses': '公司營運支出', 
        'statistics': '統計圖表',
        'settings': '支出項目管理'
    };
    
    document.getElementById('currentTabTitle').textContent = titles[tabName];
    
    // 設定活動狀態
    event.target.classList.add('active');
    
    currentTab = tabName;
    loadCurrentTab();
}

function loadCurrentTab() {
    switch (currentTab) {
        case 'projects':
            loadProjectsTab();
            break;
        case 'company-expenses':
            loadCompanyExpensesTab();
            break;
        case 'statistics':
            loadStatisticsTab();
            break;
        case 'settings':
            loadSettingsTab();
            break;
    }
}

// ===== 專案管理頁面 =====
function loadProjectsTab() {
    loadMonthlyStats();
    loadProjectsTable();
}

function loadMonthlyStats() {
    const stats = calculateMonthlyStats(currentMonth);
    
    document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue.toLocaleString()}`;
    document.getElementById('totalExpenses').textContent = `$${stats.totalProjectExpenses.toLocaleString()}`;
    document.getElementById('adjustedProfit').textContent = `$${stats.adjustedProfit.toLocaleString()}`;
    document.getElementById('adjustedProfitMargin').textContent = `${stats.adjustedProfitMargin.toFixed(2)}%`;
    
    // 設定顏色
    const profitElement = document.getElementById('adjustedProfit');
    const marginElement = document.getElementById('adjustedProfitMargin');
    
    if (stats.adjustedProfit >= 0) {
        profitElement.parentElement.className = 'card bg-success text-white';
        marginElement.parentElement.className = 'card bg-success text-white';
    } else {
        profitElement.parentElement.className = 'card bg-danger text-white';
        marginElement.parentElement.className = 'card bg-danger text-white';
    }
}

function loadProjectsTable() {
    const projects = getProjects(currentMonth);
    const tbody = document.getElementById('projectsTableBody');
    
    tbody.innerHTML = '';
    
    projects.forEach(project => {
        const summary = calculateProjectSummary(project.id);
        const row = createProjectRow(summary);
        tbody.appendChild(row);
    });
}

function createProjectRow(project) {
    const row = document.createElement('tr');
    
    const profitClass = project.profit >= 0 ? 'text-success' : 'text-danger';
    const marginClass = project.profitMargin >= 0 ? 'text-success' : 'text-danger';
    
    row.innerHTML = `
        <td>${project.name}</td>
        <td>$${project.totalRevenue.toLocaleString()}</td>
        <td>$${project.totalExpenses.toLocaleString()}</td>
        <td class="${profitClass}">$${project.profit.toLocaleString()}</td>
        <td class="${marginClass}">${project.profitMargin.toFixed(2)}%</td>
        <td>
            <button class="btn btn-sm btn-outline-primary" onclick="showProjectExpenses('${project.id}', '${project.name}')">
                <i class="fas fa-eye"></i> 查看支出
            </button>
        </td>
    `;
    
    return row;
}

// ===== 公司支出頁面 =====
function loadCompanyExpensesTab() {
    loadCompanyExpensesTable();
}

function loadCompanyExpensesTable() {
    const expenses = getCompanyExpenses(currentMonth);
    const tbody = document.getElementById('companyExpensesTableBody');
    
    tbody.innerHTML = '';
    
    expenses.forEach(expense => {
        const row = createCompanyExpenseRow(expense);
        tbody.appendChild(row);
    });
}

function createCompanyExpenseRow(expense) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${expense.category}</td>
        <td>$${expense.amount.toLocaleString()}</td>
        <td>${expense.description}</td>
        <td>${new Date(expense.createdAt).toLocaleDateString('zh-TW')}</td>
        <td>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteCompanyExpenseConfirm('${expense.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

// ===== 統計圖表頁面 =====
function loadStatisticsTab() {
    loadCharts();
}

// ===== 支出項目設定頁面 =====
function loadSettingsTab() {
    loadExpenseCategoriesList();
}

function loadExpenseCategoriesList() {
    const categories = getExpenseCategories();
    const container = document.getElementById('categoriesList');
    
    container.innerHTML = '';
    
    categories.forEach(category => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-3';
        
        col.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">${category.name}</h6>
                    <p class="card-text text-muted small">${category.description}</p>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCategoryConfirm('${category.id}')">
                        <i class="fas fa-trash"></i> 刪除
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(col);
    });
}

// ===== Modal 相關功能 =====
function showAddProjectModal() {
    const modal = new bootstrap.Modal(document.getElementById('addProjectModal'));
    modal.show();
}

function showAddCompanyExpenseModal() {
    const modal = new bootstrap.Modal(document.getElementById('addCompanyExpenseModal'));
    modal.show();
}

function showAddCategoryModal() {
    const modal = new bootstrap.Modal(document.getElementById('addCategoryModal'));
    modal.show();
}

function showProjectExpenses(projectId, projectName) {
    currentProjectId = projectId;
    
    document.getElementById('projectExpensesTitle').textContent = `${projectName} - 支出管理`;
    
    loadProjectExpensesCategorySelect();
    loadProjectExpensesTable();
    
    const modal = new bootstrap.Modal(document.getElementById('projectExpensesModal'));
    modal.show();
}

function loadProjectExpensesCategorySelect() {
    const categories = getExpenseCategories();
    const select = document.querySelector('#addExpenseForm select[name="categoryId"]');
    
    select.innerHTML = '<option value="">選擇項目</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

function loadProjectExpensesTable() {
    if (!currentProjectId) return;
    
    const expenses = getProjectExpenses(currentProjectId);
    const tbody = document.getElementById('projectExpensesTableBody');
    
    tbody.innerHTML = '';
    
    expenses.forEach(expense => {
        const row = createProjectExpenseRow(expense);
        tbody.appendChild(row);
    });
}

function createProjectExpenseRow(expense) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${expense.categoryName}</td>
        <td>$${expense.amount.toLocaleString()}</td>
        <td>${expense.description}</td>
        <td>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteProjectExpenseConfirm('${expense.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

function loadExpenseCategoryOptions() {
    // 預載入支出項目選項到各種表單中
    loadProjectExpensesCategorySelect();
}

// ===== 事件處理 =====
function onMonthChange() {
    currentMonth = document.getElementById('monthSelector').value;
    loadCurrentTab();
}

// ===== 新增功能 =====
function addProject() {
    const form = document.getElementById('addProjectForm');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const projectData = {
        name: formData.get('name'),
        description: formData.get('description'),
        month: currentMonth,
        totalRevenue: formData.get('totalRevenue')
    };
    
    addProject(projectData);
    
    bootstrap.Modal.getInstance(document.getElementById('addProjectModal')).hide();
    form.reset();
    loadProjectsTab();
    
    showToast('專案新增成功！');
}

function addProjectExpense() {
    const form = document.getElementById('addExpenseForm');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const expenseData = {
        projectId: currentProjectId,
        categoryId: formData.get('categoryId'),
        amount: formData.get('amount'),
        description: formData.get('description')
    };
    
    addProjectExpense(expenseData);
    
    form.reset();
    loadProjectExpensesTable();
    loadProjectsTable(); // 更新專案列表
    loadMonthlyStats(); // 更新統計
    
    showToast('支出新增成功！');
}

function addCompanyExpense() {
    const form = document.getElementById('addCompanyExpenseForm');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const expenseData = {
        month: currentMonth,
        category: formData.get('category'),
        amount: formData.get('amount'),
        description: formData.get('description')
    };
    
    addCompanyExpense(expenseData);
    
    bootstrap.Modal.getInstance(document.getElementById('addCompanyExpenseModal')).hide();
    form.reset();
    loadCompanyExpensesTab();
    loadMonthlyStats(); // 更新統計
    
    showToast('公司支出新增成功！');
}

function addCategory() {
    const form = document.getElementById('addCategoryForm');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const categoryData = {
        name: formData.get('name'),
        description: formData.get('description')
    };
    
    addExpenseCategory(categoryData);
    
    bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
    form.reset();
    loadSettingsTab();
    loadExpenseCategoryOptions(); // 更新所有支出項目選項
    
    showToast('支出項目新增成功！');
}

// ===== 刪除確認 =====
function deleteProjectExpenseConfirm(expenseId) {
    if (confirm('確定要刪除這筆支出嗎？')) {
        deleteProjectExpense(expenseId);
        loadProjectExpensesTable();
        loadProjectsTable();
        loadMonthlyStats();
        showToast('支出刪除成功！');
    }
}

function deleteCompanyExpenseConfirm(expenseId) {
    if (confirm('確定要刪除這筆公司支出嗎？')) {
        deleteCompanyExpense(expenseId);
        loadCompanyExpensesTab();
        loadMonthlyStats();
        showToast('公司支出刪除成功！');
    }
}

function deleteCategoryConfirm(categoryId) {
    if (confirm('確定要刪除這個支出項目嗎？刪除後相關的專案支出記錄將無法正確顯示項目名稱。')) {
        deleteExpenseCategory(categoryId);
        loadSettingsTab();
        loadExpenseCategoryOptions();
        showToast('支出項目刪除成功！');
    }
}

// ===== 工具功能 =====
function showToast(message) {
    // 創建簡單的提示框
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed';
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
    toast.setAttribute('role', 'alert');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-check-circle me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // 3秒後自動移除
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}