// 表格式UI控制邏輯

let currentMonth = new Date().toISOString().slice(0, 7);
let expenseTypes = ['器材租賃費用', '交通費', '餐費', '雜費', '人事費', '後製費'];
let projects = [];
let monthlyExpenses = {};

// 初始化應用
function initializeAppAfterLogin() {
    console.log('用戶已登入，初始化表格界面...');
    
    // 設定用戶信息
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name || '本地用戶';
        if (currentUser.picture) {
            document.getElementById('userAvatar').src = currentUser.picture;
        }
    }
    
    // 初始化月份選擇器
    initializeMonthSelector();
    
    // 載入數據
    loadProjects();
    loadMonthlyExpenses();
    
    // 設定事件監聽器
    setupEventListeners();
    
    // 渲染表格
    renderProjectsTable();
    updateStatistics();
    
    console.log('表格界面初始化完成');
}

// 本地模式初始化
function initializeLocalMode() {
    console.log('使用本地模式初始化...');
    
    // 設定本地用戶信息
    document.getElementById('userName').textContent = '本地用戶';
    document.getElementById('userAvatar').src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23007bff"/><text x="16" y="20" text-anchor="middle" fill="white" font-size="14">本</text></svg>';
    
    // 顯示主應用
    document.getElementById('loginPage').classList.add('d-none');
    document.getElementById('mainApp').classList.remove('d-none');
    
    // 初始化界面
    initializeMonthSelector();
    loadProjects();
    loadMonthlyExpenses();
    setupEventListeners();
    renderProjectsTable();
    updateStatistics();
    
    console.log('本地模式初始化完成');
}

// 初始化月份選擇器
function initializeMonthSelector() {
    const monthSelector = document.getElementById('monthSelector');
    monthSelector.innerHTML = '';
    
    // 生成最近12個月的選項
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthValue = date.toISOString().slice(0, 7);
        const monthText = date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
        
        const option = document.createElement('option');
        option.value = monthValue;
        option.textContent = monthText;
        if (monthValue === currentMonth) {
            option.selected = true;
        }
        monthSelector.appendChild(option);
    }
}

// 設定事件監聽器
function setupEventListeners() {
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
        useLocalBtn.addEventListener('click', initializeLocalMode);
    }
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
            <td colspan="13" class="text-center text-muted py-4">
                <i class="fas fa-inbox fa-2x mb-2"></i><br>
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
    
    // 設定樣式類別
    const profitClass = profit >= 0 ? 'text-success' : 'text-danger';
    const ratioClass = profitRatio >= 0 ? 'text-success' : 'text-danger';
    
    row.innerHTML = `
        <td>
            <div class="d-flex align-items-center">
                <strong>${project.name}</strong>
                <button class="btn btn-sm btn-outline-secondary ms-2" onclick="editProjectName(${index})" title="編輯名稱">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </td>
        ${expenseTypes.map(type => `
            <td>
                <input type="number" 
                       class="form-control form-control-sm expense-input" 
                       value="${project.expenses[type] || 0}"
                       onchange="updateProjectExpense(${index}, '${type}', this.value)"
                       min="0" step="0.01">
            </td>
        `).join('')}
        <td class="fw-bold">$${totalExpenses.toLocaleString()}</td>
        <td>
            <input type="number" 
                   class="form-control form-control-sm income-input" 
                   value="${project.totalIncome}"
                   onchange="updateProjectIncome(${index}, this.value)"
                   min="0" step="0.01">
        </td>
        <td class="${profitClass} fw-bold">$${profit.toLocaleString()}</td>
        <td class="${ratioClass} fw-bold">${profitRatio.toFixed(1)}%</td>
        <td>
            <input type="number" 
                   class="form-control form-control-sm payment-input" 
                   value="${project.payment || 0}"
                   onchange="updateProjectPayment(${index}, this.value)"
                   min="0" step="0.01">
        </td>
        <td>
            <button class="btn btn-sm btn-danger" onclick="deleteProject(${index})" title="刪除專案">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

// 更新專案支出
function updateProjectExpense(projectIndex, expenseType, value) {
    const numValue = parseFloat(value) || 0;
    projects[projectIndex].expenses[expenseType] = numValue;
    saveProjects();
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

// 刪除專案
function deleteProject(projectIndex) {
    if (confirm(`確定要刪除專案「${projects[projectIndex].name}」嗎？`)) {
        projects.splice(projectIndex, 1);
        saveProjects();
        renderProjectsTable();
        updateStatistics();
        showToast('專案已刪除', 'success');
    }
}

// 新增專案
function addNewProject() {
    const modal = new bootstrap.Modal(document.getElementById('addProjectModal'));
    modal.show();
}

// 提交新專案
function submitNewProject() {
    const form = document.getElementById('addProjectForm');
    const formData = new FormData(form);
    
    const newProject = {
        name: formData.get('name').trim(),
        totalIncome: parseFloat(formData.get('totalIncome')) || 0,
        payment: parseFloat(formData.get('payment')) || 0,
        expenses: {}
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
    bootstrap.Modal.getInstance(document.getElementById('addProjectModal')).hide();
    form.reset();
    
    showToast('專案新增成功！', 'success');
}

// 更新月度支出
function updateMonthlyExpenses() {
    document.querySelectorAll('.monthly-input').forEach(input => {
        monthlyExpenses[input.id] = parseFloat(input.value) || 0;
    });
    
    saveMonthlyExpenses();
    updateMonthlyStats();
}

// 更新月度統計
function updateMonthlyStats() {
    const totalMonthlyExpenses = Object.values(monthlyExpenses).reduce((sum, val) => sum + val, 0);
    const totalPayments = projects.reduce((sum, project) => sum + (project.payment || 0), 0);
    const totalIncome = projects.reduce((sum, project) => sum + project.totalIncome, 0);
    const totalExpenses = projects.reduce((sum, project) => {
        return sum + expenseTypes.reduce((expSum, type) => expSum + (project.expenses[type] || 0), 0);
    }, 0);
    const adjustedProfit = totalIncome - totalExpenses - totalMonthlyExpenses;
    
    document.getElementById('monthlyExpenses').textContent = `$${totalMonthlyExpenses.toLocaleString()}`;
    document.getElementById('monthlyIncome').textContent = `$${totalPayments.toLocaleString()}`;
    document.getElementById('adjustedProfit').textContent = `$${adjustedProfit.toLocaleString()}`;
    document.getElementById('adjustedProfit').className = adjustedProfit >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold';
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
    
    // 更新統計卡片顏色
    const profitCard = document.getElementById('quickNetProfit').closest('.card');
    const ratioCard = document.getElementById('quickAvgRatio').closest('.card');
    
    if (netProfit >= 0) {
        profitCard.className = 'card bg-success text-white';
        ratioCard.className = 'card bg-success text-white';
    } else {
        profitCard.className = 'card bg-danger text-white';
        ratioCard.className = 'card bg-danger text-white';
    }
    
    updateMonthlyStats();
}

// 月份變更
function onMonthChange() {
    const newMonth = document.getElementById('monthSelector').value;
    if (newMonth !== currentMonth) {
        currentMonth = newMonth;
        loadProjects();
        loadMonthlyExpenses();
        renderProjectsTable();
        updateStatistics();
    }
}

// 保存專案數據
function saveProjects() {
    localStorage.setItem(`projects_${currentMonth}`, JSON.stringify(projects));
}

// 保存月度支出數據
function saveMonthlyExpenses() {
    localStorage.setItem(`monthlyExpenses_${currentMonth}`, JSON.stringify(monthlyExpenses));
}

// 切換圖表顯示
function toggleChartsView() {
    const chartsSection = document.getElementById('chartsSection');
    const isVisible = !chartsSection.classList.contains('d-none');
    
    if (isVisible) {
        chartsSection.classList.add('d-none');
    } else {
        chartsSection.classList.remove('d-none');
        // 載入圖表
        setTimeout(loadCharts, 100);
    }
}

// 導出數據
function exportData() {
    const allData = {
        month: currentMonth,
        projects: projects,
        monthlyExpenses: monthlyExpenses,
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
    showToast('數據導出成功！', 'success');
}

// 顯示提示
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'primary'} border-0`;
    toast.setAttribute('role', 'alert');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // 3秒後自動移除
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// 創建Toast容器
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// 圖表數據適配器
function getProjectComparisonData() {
    return projects.map(project => {
        const totalExpenses = expenseTypes.reduce((sum, type) => sum + (project.expenses[type] || 0), 0);
        return {
            name: project.name,
            revenue: project.totalIncome,
            expenses: totalExpenses,
            profit: project.totalIncome - totalExpenses,
            profitMargin: project.totalIncome > 0 ? ((project.totalIncome - totalExpenses) / project.totalIncome * 100) : 0
        };
    });
}

function getExpenseDistributionData() {
    const categoryTotals = {};
    
    expenseTypes.forEach(type => {
        categoryTotals[type] = projects.reduce((sum, project) => sum + (project.expenses[type] || 0), 0);
    });
    
    return Object.entries(categoryTotals)
        .filter(([_, total]) => total > 0)
        .map(([category, total]) => ({ category, total }));
}

// 全域函數導出
window.addNewProject = addNewProject;
window.submitNewProject = submitNewProject;
window.updateProjectExpense = updateProjectExpense;
window.updateProjectIncome = updateProjectIncome;
window.updateProjectPayment = updateProjectPayment;
window.editProjectName = editProjectName;
window.deleteProject = deleteProject;
window.onMonthChange = onMonthChange;
window.toggleChartsView = toggleChartsView;
window.exportData = exportData;
window.initializeAppAfterLogin = initializeAppAfterLogin;