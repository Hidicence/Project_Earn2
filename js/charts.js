// 圖表相關功能

let projectComparisonChart = null;
let expenseDistributionChart = null;

// 載入所有圖表
function loadCharts() {
    loadProjectComparisonChart();
    loadExpenseDistributionChart();
}

// 專案收支比較圖表
function loadProjectComparisonChart() {
    const canvas = document.getElementById('projectComparisonChart');
    const ctx = canvas.getContext('2d');
    
    // 如果圖表已存在，先銷毀
    if (projectComparisonChart) {
        projectComparisonChart.destroy();
    }
    
    const data = getProjectComparisonData(currentMonth);
    
    if (data.length === 0) {
        // 如果沒有數據，顯示空狀態
        showEmptyChart(canvas, '本月暫無專案數據');
        return;
    }
    
    const chartData = {
        labels: data.map(item => item.name),
        datasets: [
            {
                label: '收入',
                data: data.map(item => item.revenue),
                backgroundColor: 'rgba(40, 167, 69, 0.8)',
                borderColor: 'rgba(40, 167, 69, 1)',
                borderWidth: 1
            },
            {
                label: '支出',
                data: data.map(item => item.expenses),
                backgroundColor: 'rgba(220, 53, 69, 0.8)',
                borderColor: 'rgba(220, 53, 69, 1)',
                borderWidth: 1
            },
            {
                label: '盈餘',
                data: data.map(item => item.profit),
                backgroundColor: 'rgba(0, 123, 255, 0.8)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }
        ]
    };
    
    const config = {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${currentMonth} 專案收支比較`,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    };
    
    projectComparisonChart = new Chart(ctx, config);
}

// 支出分布圓餅圖
function loadExpenseDistributionChart() {
    const canvas = document.getElementById('expenseDistributionChart');
    const ctx = canvas.getContext('2d');
    
    // 如果圖表已存在，先銷毀
    if (expenseDistributionChart) {
        expenseDistributionChart.destroy();
    }
    
    const data = getExpenseDistributionData(currentMonth);
    
    if (data.length === 0) {
        // 如果沒有數據，顯示空狀態
        showEmptyChart(canvas, '本月暫無支出數據');
        return;
    }
    
    // 計算總額
    const total = data.reduce((sum, item) => sum + item.total, 0);
    
    const chartData = {
        labels: data.map(item => item.category),
        datasets: [{
            data: data.map(item => item.total),
            backgroundColor: [
                '#FF6384',
                '#36A2EB', 
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40',
                '#FF6384',
                '#C9CBCF',
                '#4BC0C0',
                '#FF8A80'
            ],
            borderColor: '#fff',
            borderWidth: 2
        }]
    };
    
    const config = {
        type: 'pie',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${currentMonth} 支出分布`,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': $' + context.parsed.toLocaleString() + 
                                   ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    };
    
    expenseDistributionChart = new Chart(ctx, config);
}

// 營利比趨勢圖（可選功能）
function loadProfitTrendChart() {
    // 這個功能可以展示多個月份的營利比趨勢
    // 暫時不實現，可以作為未來擴展功能
}

// 顯示空圖表狀態
function showEmptyChart(canvas, message) {
    const ctx = canvas.getContext('2d');
    
    // 清空畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 設定樣式
    ctx.fillStyle = '#6c757d';
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 繪製圖標
    ctx.font = '48px system-ui';
    ctx.fillText('📊', canvas.width / 2, canvas.height / 2 - 30);
    
    // 繪製訊息
    ctx.font = '16px system-ui';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 20);
}

// 更新圖表（當數據變更時調用）
function updateCharts() {
    if (currentTab === 'statistics') {
        loadCharts();
    }
}

// 下載圖表為圖片
function downloadChart(chartInstance, filename) {
    if (!chartInstance) return;
    
    const url = chartInstance.toBase64Image();
    const link = document.createElement('a');
    link.download = filename + '_' + currentMonth + '.png';
    link.href = url;
    link.click();
}

// 導出專案比較圖表
function downloadProjectChart() {
    downloadChart(projectComparisonChart, 'project_comparison');
}

// 導出支出分布圖表  
function downloadExpenseChart() {
    downloadChart(expenseDistributionChart, 'expense_distribution');
}

// 圖表顏色配置
const CHART_COLORS = {
    revenue: {
        background: 'rgba(40, 167, 69, 0.8)',
        border: 'rgba(40, 167, 69, 1)'
    },
    expense: {
        background: 'rgba(220, 53, 69, 0.8)',
        border: 'rgba(220, 53, 69, 1)'
    },
    profit: {
        background: 'rgba(0, 123, 255, 0.8)',
        border: 'rgba(0, 123, 255, 1)'
    },
    pie: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF8A80'
    ]
};

// 響應式圖表調整
function resizeCharts() {
    if (projectComparisonChart) {
        projectComparisonChart.resize();
    }
    if (expenseDistributionChart) {
        expenseDistributionChart.resize();
    }
}

// 監聽視窗大小變化
window.addEventListener('resize', resizeCharts);