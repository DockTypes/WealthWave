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
                        '#6c7ee1', '#9b7bf7', '#e5484d', '#f0c000', '#3ecf8e', '#e879a8'
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
                            color: '#8b8fa3',
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

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const txManager = new TransactionManager();
        const analytics = new AnalyticsEngine(txManager);
        new UIController(txManager, analytics);
    });
}
