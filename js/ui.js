const UI = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    },

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    },

    renderDashboardStats() {
        const transactions = Store.getTransactions();

        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            const amount = parseFloat(t.amount);
            if (t.type === 'income') totalIncome += amount;
            if (t.type === 'expense') totalExpense += amount;
        });

        const totalBalance = totalIncome - totalExpense;

        const balEl = document.getElementById('totalBalance');
        if (balEl) balEl.textContent = this.formatCurrency(totalBalance);

        const inEl = document.getElementById('totalIncome');
        if (inEl) inEl.textContent = this.formatCurrency(totalIncome);

        const exEl = document.getElementById('totalExpense');
        if (exEl) exEl.textContent = this.formatCurrency(totalExpense);
    },

    renderRecentTransactions() {
        const transactions = Store.getTransactions();
        const wallets = Store.getWallets();
        const getWalletName = (wId) => {
            const w = wallets.find(x => x.id === wId);
            return w ? `${w.category === 'cash' ? '💵' : '💳'} ${w.name}` : '💵 Uang Tunai';
        };

        const container = document.getElementById('recentTransactionsList');
        if (!container) return;

        container.innerHTML = '';

        if (transactions.length === 0) {
            container.innerHTML = '<div class="flex items-center justify-center py-8 text-gray-400 dark:text-gray-500 text-sm">Belum ada transaksi aktivitas.</div>';
            return;
        }

        // Sort descending and take top 5
        const recent = [...transactions].sort((a, b) => {
            const dateDiff = new Date(b.date) - new Date(a.date);
            return dateDiff !== 0 ? dateDiff : parseInt(b.id) - parseInt(a.id);
        }).slice(0, 5);

        recent.forEach(t => {
            let iconClass, bgClass, textClass, sign, label;
            if (t.type === 'income') {
                iconClass = 'ph-arrow-down-left text-blue-600 dark:text-blue-400';
                bgClass = 'bg-blue-100 dark:bg-blue-900/30';
                textClass = 'text-blue-600 dark:text-blue-400';
                sign = '+';
                label = 'Pemasukan';
            } else {
                iconClass = 'ph-arrow-up-right text-red-600 dark:text-red-400';
                bgClass = 'bg-red-100 dark:bg-red-900/30';
                textClass = 'text-red-600 dark:text-red-400';
                sign = '-';
                label = 'Pengeluaran';
            }

            let titleHtml = `<p class="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 flex items-center">${t.note || label}</p>`;
            let extraLines = '';

            let dateStr = `${this.formatDate(t.date)} &bull; <span class="font-medium text-gray-900 dark:text-gray-300 ml-1">${getWalletName(t.walletId)}</span>`;

            if (t.type === 'expense' && t.expenseCategory === 'purchase') {
                const qtyStr = t.itemQuantity ? `${t.itemQuantity}` : '';
                const unitStr = t.itemUnit ? ` ${t.itemUnit}` : '';
                const qtyHtml = qtyStr ? ` <span class="text-agri-600 dark:text-agri-400 font-semibold ml-1.5">${qtyStr}${unitStr}</span>` : '';

                titleHtml = `<p class="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 flex items-center">${t.itemName || 'Pembelian'}${qtyHtml}</p>`;

                if (t.itemSupplier) {
                    extraLines += `<p class="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">Asal: <span class="font-medium text-gray-800 dark:text-gray-200">${t.itemSupplier}</span></p>`;
                }
                if (t.note) {
                    extraLines += `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 italic">"${t.note}"</p>`;
                }
            } else if (t.type === 'expense' && t.expenseCategory === 'wage') {
                const wType = t.wageType === 'monthly' ? 'Bulanan' : 'Harian';
                titleHtml = `<p class="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 flex items-center">Upah Kerja ${wType}</p>`;
                if (t.workerName) {
                    extraLines += `<p class="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">Pekerja: <span class="font-medium text-gray-800 dark:text-gray-200">${t.workerName}</span></p>`;
                }
                if (t.note) {
                    extraLines += `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 italic">"${t.note}"</p>`;
                }
            } else if (t.type === 'income') {
                if (t.incomeCategory === 'sale') {
                    const qtyStr = t.saleQuantity ? `${t.saleQuantity}` : '';
                    const unitStr = t.saleUnit ? ` ${t.saleUnit}` : '';
                    const qtyHtml = qtyStr ? ` <span class="text-blue-600 dark:text-blue-400 font-semibold ml-1.5">${qtyStr}${unitStr}</span>` : '';

                    titleHtml = `<p class="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 flex items-center">${t.saleItemName || 'Penjualan'}${qtyHtml}</p>`;

                    if (t.saleBuyer) {
                        extraLines += `<p class="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">Pembeli: <span class="font-medium text-gray-800 dark:text-gray-200">${t.saleBuyer}</span></p>`;
                    }
                    if (t.note) {
                        extraLines += `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 italic">"${t.note}"</p>`;
                    }
                } else {
                    titleHtml = `<p class="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 flex items-center">${t.incomeName || t.note || label}</p>`;
                    if (t.incomeName && t.note) {
                        extraLines += `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 italic">"${t.note}"</p>`;
                    }
                }
            }

            const el = document.createElement('div');
            el.className = 'flex items-center justify-between p-3 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl shadow-sm transition-transform hover:scale-[1.02]';
            el.innerHTML = `
                <div class="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    <div class="w-10 h-10 rounded-full ${bgClass} flex items-center justify-center shrink-0">
                        <i class="ph ${iconClass} text-xl"></i>
                    </div>
                    <div class="min-w-0 flex-1 flex flex-col justify-center">
                        ${titleHtml}
                        ${extraLines}
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">${dateStr}</p>
                    </div>
                </div>
                <div class="text-right shrink-0 ml-2 mt-[2px] self-start items-end flex flex-col">
                    <p class="text-sm font-bold ${textClass}">${sign} ${this.formatCurrency(t.amount)}</p>
                </div>
            `;
            container.appendChild(el);
        });
    },

    renderAllTransactions(filter = 'all') {
        const transactions = Store.getTransactions();
        const container = document.getElementById('transactionListContainer');
        if (!container) return;

        container.innerHTML = '';

        let filtered = [...transactions].sort((a, b) => {
            const dateDiff = new Date(b.date) - new Date(a.date);
            return dateDiff !== 0 ? dateDiff : parseInt(b.id) - parseInt(a.id);
        });
        if (filter !== 'all') {
            filtered = filtered.filter(t => t.type === filter);
        }

        // Filter by month if activeMonthFilter is set
        if (window.activeMonthFilter) {
            filtered = filtered.filter(t => {
                const transDate = new Date(t.date);
                const transMonth = `${transDate.getFullYear()}-${String(transDate.getMonth() + 1).padStart(2, '0')}`;
                return transMonth === window.activeMonthFilter;
            });
        }

        const searchInput = document.getElementById('searchTransactionInput');
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        if (query) {
            filtered = filtered.filter(t => {
                const wName = Store.getWallets().find(w => w.id === t.walletId)?.name || 'Uang Tunai';
                const searchStr = `${t.note || ''} ${t.itemName || ''} ${t.itemSupplier || ''} ${t.workerName || ''} ${t.incomeName || ''} ${t.saleItemName || ''} ${t.saleBuyer || ''} ${t.amount || ''} ${wName}`.toLowerCase();
                return searchStr.includes(query);
            });
        }

        if (filtered.length === 0) {
            container.innerHTML = '<div class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500"><i class="ph ph-receipt text-6xl mb-4 opacity-50"></i><p>Tidak ada transaksi.</p></div>';
            return;
        }

        filtered.forEach(t => {
            let iconClass, bgClass, textClass, sign, label;
            if (t.type === 'income') {
                iconClass = 'ph-arrow-down-left text-blue-600 dark:text-blue-400';
                bgClass = 'bg-blue-100 dark:bg-blue-900/30';
                textClass = 'text-blue-600 dark:text-blue-400';
                sign = '+';
                label = 'Pemasukan';
            } else {
                iconClass = 'ph-arrow-up-right text-red-600 dark:text-red-400';
                bgClass = 'bg-red-100 dark:bg-red-900/30';
                textClass = 'text-red-600 dark:text-red-400';
                sign = '-';
                label = 'Pengeluaran';
            }

            let titleHtml = `<p class="text-base font-bold text-gray-900 dark:text-white line-clamp-1 flex items-center">${t.note || label}</p>`;
            let extraLines = '';

            const wName = Store.getWallets().find(w => w.id === t.walletId)?.name || 'Uang Tunai';
            let dateStr = `${this.formatDate(t.date)} &bull; <span class="font-medium text-gray-900 dark:text-gray-300 ml-1">${wName}</span>`;

            if (t.type === 'expense' && t.expenseCategory === 'purchase') {
                const qtyStr = t.itemQuantity ? `${t.itemQuantity}` : '';
                const unitStr = t.itemUnit ? ` ${t.itemUnit}` : '';
                const qtyHtml = qtyStr ? ` <span class="text-agri-600 dark:text-agri-400 font-semibold ml-2">${qtyStr}${unitStr}</span>` : '';

                titleHtml = `<p class="text-base font-bold text-gray-900 dark:text-white line-clamp-1 flex items-center">${t.itemName || 'Pembelian'}${qtyHtml}</p>`;

                if (t.itemSupplier) {
                    extraLines += `<p class="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">Asal: <span class="font-medium text-gray-800 dark:text-gray-200">${t.itemSupplier}</span></p>`;
                }
                if (t.note) {
                    extraLines += `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 italic">"${t.note}"</p>`;
                }
            } else if (t.type === 'expense' && t.expenseCategory === 'wage') {
                const wType = t.wageType === 'monthly' ? 'Bulanan' : 'Harian';
                titleHtml = `<p class="text-base font-bold text-gray-900 dark:text-white line-clamp-1 flex items-center">Upah Kerja ${wType}</p>`;
                if (t.workerName) {
                    extraLines += `<p class="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">Pekerja: <span class="font-medium text-gray-800 dark:text-gray-200">${t.workerName}</span></p>`;
                }
                if (t.note) {
                    extraLines += `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 italic">"${t.note}"</p>`;
                }
            } else if (t.type === 'income') {
                if (t.incomeCategory === 'sale') {
                    const qtyStr = t.saleQuantity ? `${t.saleQuantity}` : '';
                    const unitStr = t.saleUnit ? ` ${t.saleUnit}` : '';
                    const qtyHtml = qtyStr ? ` <span class="text-blue-600 dark:text-blue-400 font-semibold ml-2">${qtyStr}${unitStr}</span>` : '';

                    titleHtml = `<p class="text-base font-bold text-gray-900 dark:text-white line-clamp-1 flex items-center">${t.saleItemName || 'Penjualan'}${qtyHtml}</p>`;

                    if (t.saleBuyer) {
                        extraLines += `<p class="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">Pembeli: <span class="font-medium text-gray-800 dark:text-gray-200">${t.saleBuyer}</span></p>`;
                    }
                    if (t.note) {
                        extraLines += `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 italic">"${t.note}"</p>`;
                    }
                } else {
                    titleHtml = `<p class="text-base font-bold text-gray-900 dark:text-white line-clamp-1 flex items-center">${t.incomeName || t.note || label}</p>`;
                    if (t.incomeName && t.note) {
                        extraLines += `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 italic">"${t.note}"</p>`;
                    }
                }
            }

            const el = document.createElement('div');
            el.className = 'flex items-center justify-between p-4 mb-3 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl shadow-sm transition-transform active:scale-[0.98] cursor-pointer hover:border-agri-200 dark:hover:border-agri-800';
            el.onclick = () => window.editTransaction(t.id);

            el.innerHTML = `
                <div class="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    <div class="w-12 h-12 rounded-full ${bgClass} flex items-center justify-center shrink-0">
                        <i class="ph ${iconClass} text-2xl"></i>
                    </div>
                    <div class="min-w-0 flex-1 flex flex-col justify-center">
                        ${titleHtml}
                        ${extraLines}
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 leading-relaxed">${dateStr}</p>
                    </div>
                </div>
                <div class="text-right shrink-0 ml-2 mt-1 self-start items-end flex flex-col">
                    <p class="text-sm border rounded-lg px-2 py-1 shadow-sm font-bold ${textClass} ${t.type === 'income' ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-900/10' : 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10'}">${sign} ${this.formatCurrency(t.amount)}</p>
                </div>
            `;
            container.appendChild(el);
        });
    },

    renderNotes() {
        const notes = Store.getNotes();
        const container = document.getElementById('notesListContainer');
        if (!container) return;

        container.innerHTML = '';

        if (notes.length === 0) {
            container.innerHTML = '<div class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500 col-span-full"><i class="ph ph-notebook text-6xl mb-4 opacity-50"></i><p>Belum ada catatan.</p></div>';
            return;
        }

        const sorted = notes.sort((a, b) => new Date(b.date) - new Date(a.date));

        sorted.forEach(n => {
            const el = document.createElement('div');
            el.className = 'bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-5 shadow-sm transition-transform active:scale-[0.98] cursor-pointer hover:border-agri-200 dark:hover:border-agri-800 break-words flex flex-col h-full';
            el.onclick = () => window.editNote(n.id);

            // Format truncated content for preview
            const preview = n.content.length > 150 ? n.content.substring(0, 150) + '...' : n.content;

            el.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-lg text-gray-900 dark:text-white leading-tight">${n.title}</h4>
                    <span class="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-dark-border px-2 py-1 rounded-md shrink-0 ml-2">${this.formatDate(n.date)}</span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-4 flex-1">${preview}</p>
            `;
            container.appendChild(el);
        });
    },

    renderRecentNotes() {
        const notes = Store.getNotes();
        const container = document.getElementById('recentNotesList');
        if (!container) return;

        container.innerHTML = '';

        if (notes.length === 0) {
            container.innerHTML = '<div class="flex items-center justify-center py-8 text-gray-400 dark:text-gray-500 text-sm">Belum ada catatan aktif.</div>';
            return;
        }

        const sorted = notes.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);

        sorted.forEach(n => {
            const el = document.createElement('div');
            el.className = 'flex flex-col p-4 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl shadow-sm transition-transform hover:scale-[1.02] cursor-pointer hover:border-agri-200 dark:hover:border-agri-800';
            el.onclick = () => window.location.href = './pages/notes.html';

            const preview = n.content.length > 80 ? n.content.substring(0, 80) + '...' : n.content;

            el.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <i class="ph-fill ph-push-pin text-agri-500 text-lg"></i>
                        <h4 class="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">${n.title}</h4>
                    </div>
                    <span class="text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-dark-border px-2 py-1 rounded-md shrink-0 ml-2">${this.formatDate(n.date)}</span>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 pl-6">${preview}</p>
            `;
            container.appendChild(el);
        });
    },

    renderWallets() {
        const wallets = Store.getWallets();
        const container = document.getElementById('walletListContainer');
        if (!container) return;

        container.innerHTML = '';

        if (wallets.length === 0) {
            container.innerHTML = '<div class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500 col-span-full"><i class="ph ph-wallet text-6xl mb-4 opacity-50"></i><p>Belum ada dompet.</p></div>';
            return;
        }

        const transactions = Store.getTransactions();

        wallets.forEach(w => {
            let balance = 0;
            transactions.forEach(t => {
                if (t.walletId === w.id || (!t.walletId && w.id === 'w-cash')) {
                    const amt = parseFloat(t.amount);
                    if (t.type === 'income') balance += amt;
                    if (t.type === 'expense') balance -= amt;
                }
            });

            const isCash = w.category === 'cash';
            const iconClass = isCash ? 'ph-money' : 'ph-credit-card';
            const bgHoverClass = isCash ? 'hover:border-green-200 dark:hover:border-green-800' : 'hover:border-blue-200 dark:hover:border-blue-800';
            const badgeBgClass = isCash ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            const badgeLabel = isCash ? 'Tunai' : 'Kartu';
            const shadowColor = isCash ? 'shadow-green-500/10' : 'shadow-blue-500/10';

            const el = document.createElement('div');
            el.className = `bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-6 shadow-sm ${shadowColor} transition-transform active:scale-[0.98] cursor-pointer ${bgHoverClass} flex flex-col h-full group`;
            el.onclick = () => window.editWallet(w.id);

            el.innerHTML = `
                <div class="flex justify-between items-start mb-6">
                    <div class="w-12 h-12 rounded-xl ${badgeBgClass} flex items-center justify-center border-white dark:border-dark-bg border-[3px] shadow-sm transform -rotate-6 group-hover:rotate-0 transition-transform">
                        <i class="ph-fill ${iconClass} text-2xl"></i>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-1 rounded-[8px] uppercase tracking-wider ${badgeBgClass}">${badgeLabel}</span>
                </div>
                <div class="mt-auto">
                    <h4 class="font-semibold text-gray-500 dark:text-gray-400 mb-1 text-sm">${w.name}</h4>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white leading-tight">${this.formatCurrency(balance)}</p>
                </div>
            `;
            container.appendChild(el);
        });
    }
};
