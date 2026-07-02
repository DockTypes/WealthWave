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
        this.lblBalance.textContent = this.formatCurrency(totals.balance);
        this.lblIncome.textContent = this.formatCurrency(totals.income);
        this.lblExpense.textContent = this.formatCurrency(totals.expense);

        // Update Table
        this.list.innerHTML = '';
        const txs = this.txManager.getTransactions();

        if (txs.length === 0) {
            this.list.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 2rem;">Nu există tranzacții. Adaugă una!</td></tr>';
        }

        txs.forEach(t => {
            const tr = document.createElement('tr');
            
            const colorClass = t.type === 'income' ? 'text-success' : 'text-danger';
            const sign = t.type === 'income' ? '+' : '-';

            tr.innerHTML = `
                <td>${this.formatDate(t.date)}</td>
                <td><span class="tag">${t.category}</span></td>
                <td>${t.desc || '-'}</td>
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
