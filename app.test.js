/**
 * @jest-environment jsdom
 */
const { TransactionManager, AnalyticsEngine } = require('./app.js');

// Mock localStorage
global.localStorage = {
    store: {},
    getItem(key) {
        return this.store[key] || null;
    },
    setItem(key, value) {
        this.store[key] = value.toString();
    },
    clear() {
        this.store = {};
    }
};

describe('TransactionManager', () => {
    let txManager;

    beforeEach(() => {
        global.localStorage.clear();
        txManager = new TransactionManager();
    });

    test('addTransaction salvează tranzacția corect', () => {
        txManager.addTransaction('income', 5000, 'Salary', 'Salariu luna curenta');
        expect(txManager.transactions.length).toBe(1);
        expect(txManager.transactions[0].amount).toBe(5000);
        expect(txManager.transactions[0].type).toBe('income');
    });

    test('deleteTransaction șterge tranzacția după ID', () => {
        const tx = txManager.addTransaction('expense', 150, 'Food', 'Kaufland');
        txManager.deleteTransaction(tx.id);
        expect(txManager.transactions.length).toBe(0);
    });
});

describe('AnalyticsEngine', () => {
    let txManager;
    let analytics;

    beforeEach(() => {
        global.localStorage.clear();
        // Evităm randarea eronată de test a chart.js
        window.Chart = jest.fn(); 
        
        txManager = new TransactionManager();
        analytics = new AnalyticsEngine(txManager);
    });

    test('getTotals calculează corect balanța, veniturile și cheltuielile', () => {
        txManager.addTransaction('income', 1000, 'Salary', 'Bonus');
        txManager.addTransaction('expense', 200, 'Food', 'Restaurant');
        txManager.addTransaction('expense', 50, 'Transport', 'Uber');

        const totals = analytics.getTotals();
        expect(totals.income).toBe(1000);
        expect(totals.expense).toBe(250);
        expect(totals.balance).toBe(750);
    });

    test('getExpensesByCategory grupează cheltuielile corect', () => {
        txManager.addTransaction('expense', 100, 'Food', 'Mega Image');
        txManager.addTransaction('expense', 150, 'Food', 'Kaufland');
        txManager.addTransaction('expense', 300, 'Utilities', 'Enel');
        
        const categories = analytics.getExpensesByCategory();
        expect(categories['Food']).toBe(250);
        expect(categories['Utilities']).toBe(300);
        expect(categories['Transport']).toBeUndefined();
    });
});
