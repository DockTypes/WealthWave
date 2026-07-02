// WealthWave - app.js

class TransactionManager {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('wealthwave_tx')) || [];
    }

    addTransaction(type, amount, category, desc) {
        const tx = {
            id: Date.now() + Math.random(),
            date: new Date().toISOString(),
            type, // 'income' or 'expense'
            amount: parseFloat(amount),
            category,
            desc
        };
        this.transactions.push(tx);
        this.save();
        return tx;
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.save();
    }

    getTransactions() {
        return this.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    save() {
        localStorage.setItem('wealthwave_tx', JSON.stringify(this.transactions));
    }
}

class AnalyticsEngine {
    constructor(txManager) {
        this.txManager = txManager;
        this.chartInstance = null;
        
        if(typeof document !== 'undefined') {
            document.addEventListener('transactionsUpdated', () => this.renderChart());
            // Initial render
            setTimeout(() => this.renderChart(), 100);
        }
    }

    getTotals() {
        const txs = this.txManager.getTransactions();
        let income = 0;
        let expense = 0;

        txs.forEach(t => {
            if (t.type === 'income') income += t.amount;
            if (t.type === 'expense') expense += t.amount;
        });

        return {
            income,
            expense,
            balance: income - expense
        };
    }
    
    getExpensesByCategory() {
        const txs = this.txManager.getTransactions().filter(t => t.type === 'expense');
        const categories = {};
        
        txs.forEach(t => {
            if (!categories[t.category]) categories[t.category] = 0;
            categories[t.category] += t.amount;
        });
        
        return categories;
    }
    
    renderChart() {
        if (typeof document === 'undefined' || typeof Chart === 'undefined') return;
        
        const ctx = document.getElementById('expenseChart');
        if (!ctx) return;
        
        const data = this.getExpensesByCategory();
        const labels = Object.keys(data).map(k => {
            const map = {
                'Food': 'Mâncare',
                'Transport': 'Transport',
                'Entertainment': 'Divertisment',
                'Utilities': 'Facturi',
                'Salary': 'Salariu',
                'Other': 'Altele'
            };
            return map[k] || k;
        });
        const values = Object.values(data);
        
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
        
        if (labels.length === 0) {
            return;
        }
        
        // Hide/show empty message
        const emptyMsg = document.getElementById('chart-empty');
        if (emptyMsg) emptyMsg.style.display = labels.length > 0 ? 'none' : 'block';
        
        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#a78bfa', '#67e8f9', '#fb7185', '#fbbf24', '#34d399', '#f472b6'
                    ],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#a1a1aa',
                            font: { family: 'Inter', size: 12 },
                            padding: 16,
                            usePointStyle: true,
                            pointStyleWidth: 10
                        }
                    }
                }
            }
        });
    }
}

class UIController {
    constructor(txManager, analytics) {
        this.txManager = txManager;
        this.analytics = analytics;

        this.form = document.getElementById('transaction-form');
        this.list = document.getElementById('transaction-list');
        
        this.lblBalance = document.getElementById('total-balance');
        this.lblIncome = document.getElementById('total-income');
        this.lblExpense = document.getElementById('total-expense');

        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const type = document.getElementById('t-type').value;
                const amount = document.getElementById('t-amount').value;
                const category = document.getElementById('t-category').value;
                const desc = document.getElementById('t-desc').value;

                this.txManager.addTransaction(type, amount, category, desc);
                this.form.reset();
                this.updateUI();
            });
        }
        
        this.updateUI();
    }

    deleteTx(id) {
        this.txManager.deleteTransaction(id);
        this.updateUI();
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(amount);
    }
    
    formatDate(isoString) {
        const d = new Date(isoString);
        return d.toLocaleDateString('ro-RO', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    updateUI() {
        if (!this.list) return;

        // Update Totals
        const totals = this.analytics.getTotals();
        if (this.lblBalance) this.lblBalance.textContent = this.formatCurrency(totals.balance);
        if (this.lblIncome) this.lblIncome.textContent = this.formatCurrency(totals.income);
        if (this.lblExpense) this.lblExpense.textContent = this.formatCurrency(totals.expense);

        // Update date display
        const dateEl = document.getElementById('current-date');
        if (dateEl) {
            dateEl.textContent = new Date().toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }

        // Update Table
        this.list.innerHTML = '';
        const txs = this.txManager.getTransactions();

        // Update tx count
        const countEl = document.getElementById('tx-count');
        if (countEl) countEl.textContent = `${txs.length} tranzacți${txs.length === 1 ? 'e' : 'i'}`;

        if (txs.length === 0) {
            this.list.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-tertiary); padding: 3rem 1rem;">Nicio tranzacție încă. Adaugă prima ta tranzacție!</td></tr>';
        }

        txs.forEach(t => {
            const tr = document.createElement('tr');
            
            const colorClass = t.type === 'income' ? 'text-success' : 'text-danger';
            const sign = t.type === 'income' ? '+' : '-';

            tr.innerHTML = `
                <td>${this.formatDate(t.date)}</td>
                <td><span class="tag">${t.category}</span></td>
                <td>${t.desc || '—'}</td>
                <td class="${colorClass}" style="font-weight: 600;">${sign} ${this.formatCurrency(t.amount)}</td>
                <td><button class="btn-delete" data-id="${t.id}">&#10006;</button></td>
            `;

            this.list.appendChild(tr);
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseFloat(e.target.dataset.id);
                this.deleteTx(id);
            });
        });
        
        document.dispatchEvent(new Event('transactionsUpdated'));
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TransactionManager, AnalyticsEngine, UIController };
}

// ── SPA Router ──────────────────────────────────────────────
class Router {
    constructor() {
        this.links = document.querySelectorAll('.nav-item[data-page]');
        this.pages = document.querySelectorAll('.page');
        this.onNavigate = null;

        this.links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(link.dataset.page);
            });
        });
    }

    navigate(pageId) {
        // Update nav
        this.links.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-item[data-page="${pageId}"]`);
        if (active) active.classList.add('active');

        // Show page
        this.pages.forEach(p => p.classList.remove('page-active'));
        const page = document.getElementById('page-' + pageId);
        if (page) page.classList.add('page-active');

        if (this.onNavigate) this.onNavigate(pageId);
    }
}

// ── Activity Page ───────────────────────────────────────────
class ActivityPage {
    constructor(txManager) {
        this.txManager = txManager;
        this.chartInstance = null;
    }

    render() {
        this.renderChart();
        this.renderFeed();
    }

    renderChart() {
        if (typeof Chart === 'undefined') return;
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        if (this.chartInstance) this.chartInstance.destroy();

        const txs = this.txManager.getTransactions();
        const labels = [];
        const incomeData = [];
        const expenseData = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric' }));

            let inc = 0, exp = 0;
            txs.forEach(t => {
                if (t.date.startsWith(dateStr)) {
                    if (t.type === 'income') inc += t.amount;
                    else exp += t.amount;
                }
            });
            incomeData.push(inc);
            expenseData.push(exp);
        }

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Venituri',
                        data: incomeData,
                        backgroundColor: 'rgba(52, 211, 153, 0.6)',
                        borderRadius: 6
                    },
                    {
                        label: 'Cheltuieli',
                        data: expenseData,
                        backgroundColor: 'rgba(251, 113, 133, 0.6)',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#52525b' } },
                    x: { grid: { display: false }, ticks: { color: '#52525b' } }
                },
                plugins: {
                    legend: { labels: { color: '#a1a1aa', font: { family: 'Inter' } } }
                }
            }
        });
    }

    renderFeed() {
        const feed = document.getElementById('activity-feed');
        const emptyMsg = document.getElementById('feed-empty');
        if (!feed) return;

        const txs = this.txManager.getTransactions().slice(0, 15);
        feed.innerHTML = '';

        if (txs.length === 0) {
            if (emptyMsg) emptyMsg.style.display = 'block';
            return;
        }
        if (emptyMsg) emptyMsg.style.display = 'none';

        const catMap = { 'Food': 'Mâncare', 'Transport': 'Transport', 'Entertainment': 'Divertisment', 'Utilities': 'Facturi', 'Salary': 'Salariu', 'Other': 'Altele' };

        txs.forEach(t => {
            const li = document.createElement('li');
            li.className = 'feed-item';
            const isIncome = t.type === 'income';
            const amount = new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(t.amount);
            const timeAgo = this.timeAgo(new Date(t.date));

            li.innerHTML = `
                <div class="feed-dot ${isIncome ? 'up' : 'down'}"></div>
                <div class="feed-text">
                    <strong>${isIncome ? '+' : '-'} ${amount}</strong> — ${catMap[t.category] || t.category}${t.desc ? ' · ' + t.desc : ''}
                </div>
                <span class="feed-time">${timeAgo}</span>
            `;
            feed.appendChild(li);
        });
    }

    timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'acum';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' min';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' ore';
        return Math.floor(seconds / 86400) + ' zile';
    }
}

// ── Transactions Page ───────────────────────────────────────
class TransactionsPage {
    constructor(txManager, uiController) {
        this.txManager = txManager;
        this.ui = uiController;

        const filterType = document.getElementById('filter-type');
        const filterCat = document.getElementById('filter-cat');
        if (filterType) filterType.addEventListener('change', () => this.render());
        if (filterCat) filterCat.addEventListener('change', () => this.render());
    }

    render() {
        const list = document.getElementById('full-transaction-list');
        if (!list) return;

        const typeFilter = document.getElementById('filter-type')?.value || 'all';
        const catFilter = document.getElementById('filter-cat')?.value || 'all';

        let txs = this.txManager.getTransactions();
        if (typeFilter !== 'all') txs = txs.filter(t => t.type === typeFilter);
        if (catFilter !== 'all') txs = txs.filter(t => t.category === catFilter);

        list.innerHTML = '';

        if (txs.length === 0) {
            list.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-3); padding:3rem">Nicio tranzacție găsită.</td></tr>';
            return;
        }

        txs.forEach(t => {
            const tr = document.createElement('tr');
            const colorClass = t.type === 'income' ? 'text-success' : 'text-danger';
            const sign = t.type === 'income' ? '+' : '-';
            const typeLabel = t.type === 'income' ? 'Venit' : 'Cheltuială';

            tr.innerHTML = `
                <td>${this.ui.formatDate(t.date)}</td>
                <td><span class="tag">${typeLabel}</span></td>
                <td><span class="tag">${t.category}</span></td>
                <td>${t.desc || '—'}</td>
                <td class="${colorClass}" style="font-weight:600">${sign} ${this.ui.formatCurrency(t.amount)}</td>
                <td><button class="btn-delete" data-id="${t.id}">&#10006;</button></td>
            `;
            list.appendChild(tr);
        });

        list.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.txManager.deleteTransaction(parseFloat(e.target.dataset.id));
                this.ui.updateUI();
                this.render();
            });
        });
    }
}

// ── Settings Page ───────────────────────────────────────────
class SettingsPage {
    constructor(txManager, uiController) {
        this.txManager = txManager;
        this.ui = uiController;

        const clearBtn = document.getElementById('btn-clear-data');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Sigur vrei să ștergi toate tranzacțiile?')) {
                    this.txManager.transactions = [];
                    this.txManager.save();
                    this.ui.updateUI();
                }
            });
        }
    }
}

// ── App Init ────────────────────────────────────────────────
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const txManager = new TransactionManager();
        const analytics = new AnalyticsEngine(txManager);
        const uiCtrl = new UIController(txManager, analytics);

        const activityPage = new ActivityPage(txManager);
        const txPage = new TransactionsPage(txManager, uiCtrl);
        new SettingsPage(txManager, uiCtrl);

        const router = new Router();
        router.onNavigate = (pageId) => {
            if (pageId === 'activity') activityPage.render();
            if (pageId === 'transactions') txPage.render();
        };
    });
}
