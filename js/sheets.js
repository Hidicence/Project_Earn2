// Google Sheets API 集成
// 處理創建試算表、數據同步等功能

// Google Sheets API 設定
const SHEETS_API = {
    DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4',
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
    initialized: false
};

// 初始化 Google Sheets API
async function initSheetsAPI() {
    if (SHEETS_API.initialized) return true;
    
    try {
        // 等待 Google API 載入
        if (!window.gapi) {
            console.warn('Google API 尚未載入');
            return false;
        }
        
        await new Promise((resolve) => {
            gapi.load('client', resolve);
        });
        
        await gapi.client.init({
            discoveryDocs: [SHEETS_API.DISCOVERY_DOC],
        });
        
        SHEETS_API.initialized = true;
        console.log('Google Sheets API 初始化成功');
        return true;
    } catch (error) {
        console.error('Google Sheets API 初始化失敗:', error);
        return false;
    }
}

// 獲取當前用戶的 access token
function getAccessToken() {
    try {
        if (!window.currentUser || !window.currentUser.accessToken) {
            console.warn('用戶未登入或無訪問權限');
            return null;
        }
        return window.currentUser.accessToken;
    } catch (error) {
        console.error('獲取 access token 失敗:', error);
        return null;
    }
}

// 創建新的 Google 試算表
async function createGoogleSheet(title, data) {
    try {
        const accessToken = getAccessToken();
        if (!accessToken) {
            throw new Error('無法獲取 Google 訪問權限');
        }

        // 創建試算表請求
        const createRequest = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                properties: {
                    title: title
                }
            })
        };

        const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', createRequest);
        
        if (!response.ok) {
            throw new Error(`創建試算表失敗: ${response.status} ${response.statusText}`);
        }
        
        const spreadsheet = await response.json();
        console.log('試算表創建成功:', spreadsheet.properties.title);
        
        // 添加數據到試算表
        await addDataToSheet(spreadsheet.spreadsheetId, data, accessToken);
        
        return {
            id: spreadsheet.spreadsheetId,
            url: spreadsheet.spreadsheetUrl,
            title: spreadsheet.properties.title
        };
        
    } catch (error) {
        console.error('創建 Google 試算表失敗:', error);
        throw error;
    }
}

// 將數據添加到試算表
async function addDataToSheet(spreadsheetId, data, accessToken) {
    try {
        // 準備工作表數據
        const sheets = [
            {
                sheetName: '專案列表',
                data: prepareProjectsData(data.projects)
            },
            {
                sheetName: '月度支出',
                data: prepareMonthlyExpensesData(data.monthlyExpenses)
            },
            {
                sheetName: '支出類型',
                data: prepareExpenseTypesData(data.expenseTypes)
            }
        ];

        // 創建工作表並添加數據
        for (let i = 0; i < sheets.length; i++) {
            const sheet = sheets[i];
            
            // 如果不是第一個工作表，需要先創建
            if (i > 0) {
                await createWorksheet(spreadsheetId, sheet.sheetName, accessToken);
            } else {
                // 重命名第一個工作表
                await renameWorksheet(spreadsheetId, 0, sheet.sheetName, accessToken);
            }
            
            // 添加數據
            await updateSheetData(spreadsheetId, sheet.sheetName, sheet.data, accessToken);
        }
        
    } catch (error) {
        console.error('添加數據到試算表失敗:', error);
        throw error;
    }
}

// 創建新工作表
async function createWorksheet(spreadsheetId, sheetName, accessToken) {
    const request = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            requests: [{
                addSheet: {
                    properties: {
                        title: sheetName
                    }
                }
            }]
        })
    };

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, request);
    
    if (!response.ok) {
        throw new Error(`創建工作表失敗: ${response.status}`);
    }
}

// 重命名工作表
async function renameWorksheet(spreadsheetId, sheetId, newName, accessToken) {
    const request = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            requests: [{
                updateSheetProperties: {
                    properties: {
                        sheetId: sheetId,
                        title: newName
                    },
                    fields: 'title'
                }
            }]
        })
    };

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, request);
    
    if (!response.ok) {
        throw new Error(`重命名工作表失敗: ${response.status}`);
    }
}

// 更新工作表數據
async function updateSheetData(spreadsheetId, sheetName, data, accessToken) {
    const request = {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            values: data
        })
    };

    const range = `${sheetName}!A1`;
    const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
        request
    );
    
    if (!response.ok) {
        throw new Error(`更新工作表數據失敗: ${response.status}`);
    }
}

// 準備專案數據
function prepareProjectsData(projects) {
    const headers = ['專案名稱', '總收入', '收款金額'];
    
    // 添加所有支出類型作為列標題
    const expenseTypes = window.expenseTypes || [];
    headers.push(...expenseTypes);
    
    headers.push('支出總計', '利潤', '利潤率');
    
    const rows = [headers];
    
    projects.forEach(project => {
        const row = [
            project.name || '',
            project.totalIncome || 0,
            project.payment || 0
        ];
        
        // 添加支出數據
        let totalExpenses = 0;
        expenseTypes.forEach(type => {
            const amount = (project.expenses && project.expenses[type]) || 0;
            row.push(amount);
            totalExpenses += amount;
        });
        
        const profit = (project.totalIncome || 0) - totalExpenses;
        const profitRate = project.totalIncome > 0 ? (profit / project.totalIncome * 100).toFixed(2) + '%' : '0%';
        
        row.push(totalExpenses, profit, profitRate);
        rows.push(row);
    });
    
    return rows;
}

// 準備月度支出數據
function prepareMonthlyExpensesData(monthlyExpenses) {
    const headers = ['支出項目', '金額'];
    const rows = [headers];
    
    Object.entries(monthlyExpenses).forEach(([category, amount]) => {
        rows.push([category, amount || 0]);
    });
    
    return rows;
}

// 準備支出類型數據
function prepareExpenseTypesData(expenseTypes) {
    const headers = ['支出類型'];
    const rows = [headers];
    
    expenseTypes.forEach(type => {
        rows.push([type]);
    });
    
    return rows;
}

// 從 Google Sheets 讀取數據
async function readFromGoogleSheet(spreadsheetId) {
    try {
        const accessToken = getAccessToken();
        if (!accessToken) {
            throw new Error('無法獲取 Google 訪問權限');
        }

        // 讀取所有工作表的數據
        const sheetsData = await Promise.all([
            readSheetData(spreadsheetId, '專案列表', accessToken),
            readSheetData(spreadsheetId, '月度支出', accessToken),
            readSheetData(spreadsheetId, '支出類型', accessToken)
        ]);

        return {
            projects: parseProjectsData(sheetsData[0]),
            monthlyExpenses: parseMonthlyExpensesData(sheetsData[1]),
            expenseTypes: parseExpenseTypesData(sheetsData[2])
        };
        
    } catch (error) {
        console.error('從 Google Sheets 讀取數據失敗:', error);
        throw error;
    }
}

// 讀取工作表數據
async function readSheetData(spreadsheetId, sheetName, accessToken) {
    const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            }
        }
    );
    
    if (!response.ok) {
        throw new Error(`讀取工作表失敗: ${response.status}`);
    }
    
    const data = await response.json();
    return data.values || [];
}

// 解析專案數據
function parseProjectsData(data) {
    if (!data || data.length < 2) return [];
    
    const headers = data[0];
    const projects = [];
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const project = {
            name: row[0] || '',
            totalIncome: parseFloat(row[1]) || 0,
            payment: parseFloat(row[2]) || 0,
            expenses: {},
            notes: {}
        };
        
        // 解析支出數據
        const expenseTypes = window.expenseTypes || [];
        expenseTypes.forEach((type, index) => {
            const colIndex = 3 + index;
            if (row[colIndex] !== undefined) {
                project.expenses[type] = parseFloat(row[colIndex]) || 0;
            }
        });
        
        projects.push(project);
    }
    
    return projects;
}

// 解析月度支出數據
function parseMonthlyExpensesData(data) {
    const expenses = {};
    
    if (data && data.length > 1) {
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[0] && row[1] !== undefined) {
                expenses[row[0]] = parseFloat(row[1]) || 0;
            }
        }
    }
    
    return expenses;
}

// 解析支出類型數據
function parseExpenseTypesData(data) {
    const types = [];
    
    if (data && data.length > 1) {
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[0]) {
                types.push(row[0]);
            }
        }
    }
    
    return types;
}

// 儲存試算表 ID 到本地
function saveSpreadsheetId(spreadsheetId) {
    const userId = (window.getCurrentUserId && window.getCurrentUserId()) || 'local_user';
    const key = `${userId}_spreadsheetId_${window.currentMonth}`;
    localStorage.setItem(key, spreadsheetId);
}

// 獲取儲存的試算表 ID
function getSavedSpreadsheetId() {
    const userId = (window.getCurrentUserId && window.getCurrentUserId()) || 'local_user';
    const key = `${userId}_spreadsheetId_${window.currentMonth}`;
    return localStorage.getItem(key);
}

// 更新現有試算表
async function updateGoogleSheet(spreadsheetId, data) {
    try {
        const accessToken = getAccessToken();
        if (!accessToken) {
            throw new Error('無法獲取 Google 訪問權限');
        }

        // 清除現有內容並更新數據
        await clearSheet(spreadsheetId, '專案列表', accessToken);
        await clearSheet(spreadsheetId, '月度支出', accessToken);
        await clearSheet(spreadsheetId, '支出類型', accessToken);
        
        // 重新添加數據
        await addDataToSheet(spreadsheetId, data, accessToken);
        
        console.log('試算表更新成功');
        return true;
        
    } catch (error) {
        console.error('更新 Google 試算表失敗:', error);
        throw error;
    }
}

// 清除工作表內容
async function clearSheet(spreadsheetId, sheetName, accessToken) {
    try {
        const request = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requests: [{
                    updateCells: {
                        range: {
                            sheetId: await getSheetId(spreadsheetId, sheetName, accessToken)
                        },
                        fields: 'userEnteredValue'
                    }
                }]
            })
        };

        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, request);
        
    } catch (error) {
        console.warn(`清除工作表 ${sheetName} 失敗:`, error);
        // 不拋出錯誤，繼續更新流程
    }
}

// 獲取工作表 ID
async function getSheetId(spreadsheetId, sheetName, accessToken) {
    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            }
        });
        
        const data = await response.json();
        const sheet = data.sheets.find(s => s.properties.title === sheetName);
        return sheet ? sheet.properties.sheetId : 0;
        
    } catch (error) {
        console.warn('獲取工作表 ID 失敗:', error);
        return 0;
    }
}

// 導出到全域
window.SheetsAPI = {
    init: initSheetsAPI,
    createSheet: createGoogleSheet,
    readFromSheet: readFromGoogleSheet,
    updateSheet: updateGoogleSheet,
    saveSpreadsheetId,
    getSavedSpreadsheetId
};