// 同步管理（Google Sheets 兩端更新 - 可配置端點）
// 不改 UI：透過攔截存檔點與週期拉取實現近即時同步

(function() {
    const DEFAULT_PULL_INTERVAL_MS = 5000; // 5 秒輪詢
    const LOCAL_FLAG_KEY = 'sync_endpoint'; // 可選：從 localStorage 設定端點

    function getCurrentUserIdSafe() {
        try { return (window.getCurrentUserId && window.getCurrentUserId()) || (window.currentUser && window.currentUser.id) || 'local_user'; } catch (_) { return 'local_user'; }
    }

    function getEndpoint() {
        // 端點優先順序：window.SYNC_ENDPOINT > localStorage(sync_endpoint) > ''
        if (typeof window.SYNC_ENDPOINT === 'string') return window.SYNC_ENDPOINT;
        const fromLS = localStorage.getItem(LOCAL_FLAG_KEY);
        return fromLS || '';
    }

    function buildStandardizedSnapshot(month) {
        // 轉換為 Sheets 友善表格：Projects / ProjectExpenses / CompanyExpenses / ExpenseCategories
        const userId = getCurrentUserIdSafe();
        const projects = JSON.parse(localStorage.getItem(`projects_${month}`) || '[]');
        const monthlyExpenses = JSON.parse(localStorage.getItem(`monthlyExpenses_${month}`) || '{}');
        const expenseTypes = JSON.parse(localStorage.getItem('expenseTypes') || '[]');

        const projectRows = projects.map(p => ({
            id: `${month}|${p.name}`,
            month,
            name: p.name,
            totalIncome: Number(p.totalIncome || 0),
            payment: Number(p.payment || 0)
        }));

        const projectExpenseRows = [];
        projects.forEach(p => {
            const pid = `${month}|${p.name}`;
            const notes = p.notes || {};
            const expenses = p.expenses || {};
            Object.keys(expenses).forEach(cat => {
                const amount = Number(expenses[cat] || 0);
                if (amount > 0) {
                    projectExpenseRows.push({
                        month,
                        projectId: pid,
                        categoryName: cat,
                        amount,
                        note: notes[cat] || ''
                    });
                }
            });
        });

        const companyExpenseRows = Object.keys(monthlyExpenses).map(cat => ({
            month,
            category: cat,
            amount: Number(monthlyExpenses[cat] || 0)
        }));

        const expenseCategoryRows = (Array.isArray(expenseTypes) ? expenseTypes : []).map(name => ({
            id: `cat|${name}`,
            name
        }));

        const lastUpdated = Number(localStorage.getItem(`lastUpdated_${month}`) || Date.now());

        return {
            userId,
            month,
            lastUpdated,
            projects: projectRows,
            projectExpenses: projectExpenseRows,
            companyExpenses: companyExpenseRows,
            expenseCategories: expenseCategoryRows
        };
    }

    async function httpPostJson(url, data) {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
        return res.json().catch(() => ({}));
    }

    async function httpGetJson(url) {
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
        return res.json();
    }

    function applySnapshotToLocal(month, snapshot) {
        // 以伺服器資料覆寫本地月份資料（簡單 LWW 策略）
        if (!snapshot) return;
        try {
            if (snapshot.projects) localStorage.setItem(`projects_${month}`, JSON.stringify(snapshot.projects.map(r => ({
                name: r.name,
                totalIncome: Number(r.totalIncome || 0),
                payment: Number(r.payment || 0),
                expenses: {},
                notes: {}
            }))));

            // 重建專案 expenses/notes：若伺服器已展開為列資料
            if (snapshot.projectExpenses) {
                const list = JSON.parse(localStorage.getItem(`projects_${month}`) || '[]');
                const map = new Map(list.map(p => [p.name, p]));
                snapshot.projectExpenses.forEach(e => {
                    const pid = (e.projectId || '').split('|').slice(1).join('|');
                    const proj = map.get(pid);
                    if (proj) {
                        if (!proj.expenses) proj.expenses = {};
                        proj.expenses[e.categoryName] = Number(e.amount || 0);
                        if (e.note) {
                            if (!proj.notes) proj.notes = {};
                            proj.notes[e.categoryName] = e.note;
                        }
                    }
                });
                localStorage.setItem(`projects_${month}`, JSON.stringify(Array.from(map.values())));
            }

            if (snapshot.companyExpenses) {
                const obj = {};
                snapshot.companyExpenses.forEach(e => { obj[e.category] = Number(e.amount || 0); });
                localStorage.setItem(`monthlyExpenses_${month}`, JSON.stringify(obj));
            }

            if (snapshot.expenseCategories) {
                const types = snapshot.expenseCategories.map(c => c.name).filter(Boolean);
                if (types.length > 0) localStorage.setItem('expenseTypes', JSON.stringify(types));
            }

            if (snapshot.lastUpdated) localStorage.setItem(`lastUpdated_${month}`, String(snapshot.lastUpdated));
        } catch (err) {
            console.error('applySnapshotToLocal error:', err);
        }
    }

    const syncManager = {
        isRunning: false,
        timer: null,
        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            // 立即嘗試上傳一次，之後進行週期拉取
            this.push().catch(() => {});
            this.timer = setInterval(() => this.pull().catch(() => {}), DEFAULT_PULL_INTERVAL_MS);
        },
        stop() {
            if (this.timer) clearInterval(this.timer);
            this.timer = null;
            this.isRunning = false;
        },
        onMonthChange() {
            // 月份切換後下次輪詢自然會拉取；也可立即拉取
            this.pull().catch(() => {});
        },
        onLocalChange() {
            // 本地有變更：記錄 lastUpdated 並 debounce push
            try { localStorage.setItem(`lastUpdated_${window.currentMonth}`, String(Date.now())); } catch (_) {}
            this.schedulePush();
        },
        _pushTimer: null,
        schedulePush() {
            if (this._pushTimer) clearTimeout(this._pushTimer);
            this._pushTimer = setTimeout(() => { this.push().catch(() => {}); }, 800);
        },
        async push() {
            const endpoint = getEndpoint();
            if (!endpoint) return; // 未配置端點則跳過
            const month = window.currentMonth;
            const payload = buildStandardizedSnapshot(month);
            await httpPostJson(`${endpoint}/sync`, payload);
        },
        async pull() {
            const endpoint = getEndpoint();
            if (!endpoint) return; // 未配置端點則跳過
            const userId = getCurrentUserIdSafe();
            const month = window.currentMonth;
            const localLU = Number(localStorage.getItem(`lastUpdated_${month}`) || 0);
            const data = await httpGetJson(`${endpoint}/snapshot?userId=${encodeURIComponent(userId)}&month=${encodeURIComponent(month)}&since=${localLU}`);
            if (data && Number(data.lastUpdated || 0) > localLU) {
                applySnapshotToLocal(month, data);
                // 重新渲染
                try {
                    if (typeof window.loadProjects === 'function') window.loadProjects();
                    if (typeof window.loadMonthlyExpenses === 'function') window.loadMonthlyExpenses();
                    if (typeof window.renderProjectsTable === 'function') window.renderProjectsTable();
                    if (typeof window.updateStatistics === 'function') window.updateStatistics();
                } catch (err) {
                    console.error('re-render after pull failed:', err);
                }
            }
        }
    };

    // 導出到全域
    window.syncManager = syncManager;
    window.exportForGoogleSheets = function() {
        return buildStandardizedSnapshot(window.currentMonth);
    };
})();


