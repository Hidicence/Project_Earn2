// 數據管理相關功能 - 使用 localStorage

// 預設支出項目類型
const DEFAULT_EXPENSE_CATEGORIES = [
    { id: '1', name: '器材租賃費用', description: '攝影器材、設備租借費用' },
    { id: '2', name: '交通費', description: '差旅、運輸費用' },
    { id: '3', name: '餐費', description: '工作餐費、招待費' },
    { id: '4', name: '雜費', description: '其他小額支出' },
    { id: '5', name: '人事費', description: '人員薪資、勞務費' },
    { id: '6', name: '後製費', description: '影片剪輯、設計費用' }
];

// 生成唯一 ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 獲取數據鍵名（包含用戶ID以實現數據隔離）
function getStorageKey(type) {
    const userId = getCurrentUserId();
    return userId ? `${userId}_${type}` : type;
}

// ===== 支出項目管理 =====
function getExpenseCategories() {
    const key = getStorageKey('expenseCategories');
    const categories = localStorage.getItem(key);
    
    if (!categories) {
        // 如果沒有數據，初始化預設項目
        setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
        return DEFAULT_EXPENSE_CATEGORIES;
    }
    
    return JSON.parse(categories);
}

function setExpenseCategories(categories) {
    const key = getStorageKey('expenseCategories');
    localStorage.setItem(key, JSON.stringify(categories));
}

function addExpenseCategory(category) {
    const categories = getExpenseCategories();
    const newCategory = {
        id: generateId(),
        name: category.name,
        description: category.description || '',
        createdAt: new Date().toISOString()
    };
    
    categories.push(newCategory);
    setExpenseCategories(categories);
    return newCategory;
}

function deleteExpenseCategory(categoryId) {
    const categories = getExpenseCategories();
    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    setExpenseCategories(updatedCategories);
}

// ===== 專案管理 =====
function getProjects(month = null) {
    const key = getStorageKey('projects');
    const projects = localStorage.getItem(key);
    const allProjects = projects ? JSON.parse(projects) : [];
    
    if (month) {
        return allProjects.filter(project => project.month === month);
    }
    
    return allProjects;
}

function setProjects(projects) {
    const key = getStorageKey('projects');
    localStorage.setItem(key, JSON.stringify(projects));
}

function addProject(projectData) {
    const projects = getProjects();
    const newProject = {
        id: generateId(),
        name: projectData.name,
        description: projectData.description || '',
        month: projectData.month,
        totalRevenue: parseFloat(projectData.totalRevenue) || 0,
        createdAt: new Date().toISOString()
    };
    
    projects.push(newProject);
    setProjects(projects);
    return newProject;
}

function updateProject(projectId, updates) {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === projectId);
    
    if (index !== -1) {
        projects[index] = { ...projects[index], ...updates };
        setProjects(projects);
        return projects[index];
    }
    
    return null;
}

function deleteProject(projectId) {
    const projects = getProjects();
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    
    // 同時刪除相關的專案支出
    const expenses = getProjectExpenses();
    const updatedExpenses = expenses.filter(exp => exp.projectId !== projectId);
    setProjectExpenses(updatedExpenses);
}

// ===== 專案支出管理 =====
function getProjectExpenses(projectId = null) {
    const key = getStorageKey('projectExpenses');
    const expenses = localStorage.getItem(key);
    const allExpenses = expenses ? JSON.parse(expenses) : [];
    
    if (projectId) {
        return allExpenses.filter(expense => expense.projectId === projectId);
    }
    
    return allExpenses;
}

function setProjectExpenses(expenses) {
    const key = getStorageKey('projectExpenses');
    localStorage.setItem(key, JSON.stringify(expenses));
}

function addProjectExpense(expenseData) {
    const expenses = getProjectExpenses();
    const categories = getExpenseCategories();
    const category = categories.find(cat => cat.id === expenseData.categoryId);
    
    const newExpense = {
        id: generateId(),
        projectId: expenseData.projectId,
        categoryId: expenseData.categoryId,
        categoryName: category ? category.name : '未知項目',
        amount: parseFloat(expenseData.amount) || 0,
        description: expenseData.description || '',
        createdAt: new Date().toISOString()
    };
    
    expenses.push(newExpense);
    setProjectExpenses(expenses);
    return newExpense;
}

function deleteProjectExpense(expenseId) {
    const expenses = getProjectExpenses();
    const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
    setProjectExpenses(updatedExpenses);
}

// ===== 公司支出管理 =====
function getCompanyExpenses(month = null) {
    const key = getStorageKey('companyExpenses');
    const expenses = localStorage.getItem(key);
    const allExpenses = expenses ? JSON.parse(expenses) : [];
    
    if (month) {
        return allExpenses.filter(expense => expense.month === month);
    }
    
    return allExpenses;
}

function setCompanyExpenses(expenses) {
    const key = getStorageKey('companyExpenses');
    localStorage.setItem(key, JSON.stringify(expenses));
}

function addCompanyExpense(expenseData) {
    const expenses = getCompanyExpenses();
    const newExpense = {
        id: generateId(),
        month: expenseData.month,
        category: expenseData.category,
        amount: parseFloat(expenseData.amount) || 0,
        description: expenseData.description || '',
        createdAt: new Date().toISOString()
    };
    
    expenses.push(newExpense);
    setCompanyExpenses(expenses);
    return newExpense;
}

function deleteCompanyExpense(expenseId) {
    const expenses = getCompanyExpenses();
    const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
    setCompanyExpenses(updatedExpenses);
}

// ===== 統計計算 =====
function calculateProjectSummary(projectId) {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return null;
    
    const expenses = getProjectExpenses(projectId);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const profit = project.totalRevenue - totalExpenses;
    const profitMargin = project.totalRevenue > 0 ? (profit / project.totalRevenue * 100) : 0;
    
    return {
        ...project,
        totalExpenses,
        profit,
        profitMargin
    };
}

function calculateMonthlyStats(month) {
    const projects = getProjects(month);
    const companyExpenses = getCompanyExpenses(month);
    
    let totalRevenue = 0;
    let totalProjectExpenses = 0;
    let totalProfit = 0;
    
    projects.forEach(project => {
        const summary = calculateProjectSummary(project.id);
        if (summary) {
            totalRevenue += summary.totalRevenue;
            totalProjectExpenses += summary.totalExpenses;
            totalProfit += summary.profit;
        }
    });
    
    const totalCompanyExpenses = companyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const adjustedProfit = totalProfit - totalCompanyExpenses;
    const adjustedProfitMargin = totalRevenue > 0 ? (adjustedProfit / totalRevenue * 100) : 0;
    
    return {
        month,
        totalRevenue,
        totalProjectExpenses,
        totalCompanyExpenses,
        rawProfit: totalProfit,
        adjustedProfit,
        adjustedProfitMargin,
        projectCount: projects.length
    };
}

// ===== 圖表數據 =====
function getProjectComparisonData(month) {
    const projects = getProjects(month);
    
    return projects.map(project => {
        const summary = calculateProjectSummary(project.id);
        return {
            name: project.name,
            revenue: summary.totalRevenue,
            expenses: summary.totalExpenses,
            profit: summary.profit,
            profitMargin: summary.profitMargin
        };
    });
}

function getExpenseDistributionData(month) {
    const projects = getProjects(month);
    const categoryTotals = {};
    
    projects.forEach(project => {
        const expenses = getProjectExpenses(project.id);
        expenses.forEach(expense => {
            categoryTotals[expense.categoryName] = (categoryTotals[expense.categoryName] || 0) + expense.amount;
        });
    });
    
    return Object.entries(categoryTotals).map(([category, total]) => ({
        category,
        total
    }));
}

// ===== 數據導出和導入 =====
function exportData() {
    const userId = getCurrentUserId();
    if (!userId) return null;
    
    const data = {
        expenseCategories: getExpenseCategories(),
        projects: getProjects(),
        projectExpenses: getProjectExpenses(),
        companyExpenses: getCompanyExpenses(),
        exportDate: new Date().toISOString(),
        userId: userId
    };
    
    return JSON.stringify(data, null, 2);
}

function importData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        
        if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
        if (data.projects) setProjects(data.projects);
        if (data.projectExpenses) setProjectExpenses(data.projectExpenses);
        if (data.companyExpenses) setCompanyExpenses(data.companyExpenses);
        
        return true;
    } catch (error) {
        console.error('導入數據失敗:', error);
        return false;
    }
}

// ===== 初始化數據 =====
function initializeData() {
    // 確保支出項目存在
    getExpenseCategories();
    
    console.log('數據初始化完成');
}