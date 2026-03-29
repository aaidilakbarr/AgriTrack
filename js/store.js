const Store = {
    // ---- TRANSACTIONS ----
    getTransactions() {
        return JSON.parse(localStorage.getItem('agri_transactions')) || [];
    },
    saveTransactions(transactions) {
        localStorage.setItem('agri_transactions', JSON.stringify(transactions));
    },
    addTransaction(transaction) {
        const transactions = this.getTransactions();
        transactions.push({ id: Date.now().toString(), ...transaction });
        this.saveTransactions(transactions);
    },
    updateTransaction(id, updatedData) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updatedData };
            this.saveTransactions(transactions);
        }
    },
    deleteTransaction(id) {
        const transactions = this.getTransactions().filter(t => t.id !== id);
        this.saveTransactions(transactions);
    },

    // ---- NOTES ----
    getNotes() {
        return JSON.parse(localStorage.getItem('agri_notes')) || [];
    },
    saveNotes(notes) {
        localStorage.setItem('agri_notes', JSON.stringify(notes));
    },
    addNote(note) {
        const notes = this.getNotes();
        notes.push({ id: Date.now().toString(), ...note });
        this.saveNotes(notes);
    },
    updateNote(id, updatedData) {
        const notes = this.getNotes();
        const index = notes.findIndex(n => n.id === id);
        if (index !== -1) {
            notes[index] = { ...notes[index], ...updatedData };
            this.saveNotes(notes);
        }
    },
    deleteNote(id) {
        const notes = this.getNotes().filter(n => n.id !== id);
        this.saveNotes(notes);
    },

    // ---- WALLETS ----
    getWallets() {
        let wallets = JSON.parse(localStorage.getItem('agri_wallets'));
        if (!wallets) {
            wallets = [
                { id: 'w-cash', name: 'Uang Tunai Pokok', category: 'cash' },
                { id: 'w-card', name: 'Rekening Bank', category: 'card' }
            ];
            this.saveWallets(wallets);
        }
        return wallets;
    },
    saveWallets(wallets) {
        localStorage.setItem('agri_wallets', JSON.stringify(wallets));
    },
    addWallet(wallet) {
        const wallets = this.getWallets();
        wallets.push({ id: 'w-' + Date.now().toString(), ...wallet });
        this.saveWallets(wallets);
    },
    updateWallet(id, updatedData) {
        const wallets = this.getWallets();
        const index = wallets.findIndex(w => w.id === id);
        if (index !== -1) {
            wallets[index] = { ...wallets[index], ...updatedData };
            this.saveWallets(wallets);
        }
    },
    deleteWallet(id) {
        const wallets = this.getWallets().filter(w => w.id !== id);
        this.saveWallets(wallets);
    }
};
