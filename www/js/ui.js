const UI = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    },

    formatDate(dateString) {
        if (!dateString) return 'Tanggal -';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'Tanggal -';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return d.toLocaleDateString('id-ID', options);
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
        const container = document.getElementById('recentTransactionsList');
        if (!container) return;
        container.innerHTML = '';

        if (transactions.length === 0) {
            container.innerHTML = '<div class="flex items-center justify-center py-8 text-gray-400 dark:text-gray-500 text-sm">Belum ada transaksi aktivitas.</div>';
            return;
        }

        const recent = [...transactions].sort((a, b) => {
            const dateDiff = new Date(b.date) - new Date(a.date);
            return dateDiff !== 0 ? dateDiff : parseInt(b.id) - parseInt(a.id);
        }).slice(0, 5);

        recent.forEach(t => {
            container.appendChild(this.renderTransactionItem(t, wallets));
        });
    },

    renderAllTransactions(filter = 'all') {
        const transactions = Store.getTransactions();
        const wallets = Store.getWallets();
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
                const wName = wallets.find(w => w.id === t.walletId)?.name || 'Uang Tunai';
                const searchStr = `${t.note || ''} ${t.itemName || ''} ${t.itemSupplier || ''} ${t.workerName || ''} ${t.incomeName || ''} ${t.saleItemName || ''} ${t.saleBuyer || ''} ${t.amount || ''} ${wName}`.toLowerCase();
                return searchStr.includes(query);
            });
        }

        if (filtered.length === 0) {
            container.innerHTML = '<div class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500"><i class="ph ph-receipt text-6xl mb-4 opacity-50"></i><p>Tidak ada transaksi.</p></div>';
            return;
        }

        filtered.forEach(t => {
            container.appendChild(this.renderTransactionItem(t, wallets));
        });
    },

    renderTransactionItem(t, wallets) {
        const getWalletName = (wId) => {
            if (!wallets || !Array.isArray(wallets)) return '💵 Uang Tunai';
            const w = wallets.find(x => x.id === wId);
            return w ? `${w.category === 'cash' ? '💵' : '💳'} ${w.name}` : '💵 Uang Tunai';
        };

        let iconClass, bgClass, textClass, sign, label;
        if (t.type === 'income') {
            iconClass = 'ph-duotone ph-arrow-down-left text-blue-600 dark:text-blue-400';
            bgClass = 'bg-blue-100 dark:bg-blue-900/30';
            textClass = 'text-blue-600 dark:text-blue-400';
            sign = '+';
            label = 'Pemasukan';
        } else {
            iconClass = 'ph-duotone ph-arrow-up-right text-red-600 dark:text-red-400';
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
        el.className = 'flex items-center justify-between p-4 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl shadow-sm transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer';
        el.onclick = () => {
            if (window.editTransaction) window.editTransaction(t.id);
            else window.location.href = (window.location.pathname.includes('pages') ? '' : 'pages/') + 'transactions.html';
        };

        el.innerHTML = `
            <div class="flex items-center gap-3 flex-1 min-w-0 pr-2">
                <div class="w-12 h-12 rounded-2xl ${bgClass || 'bg-gray-100'} flex items-center justify-center shrink-0">
                    <i class="ph ${iconClass || 'ph-question'} text-2xl"></i>
                </div>
                <div class="min-w-0 flex-1 flex flex-col justify-center">
                    ${titleHtml}
                    ${extraLines}
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 leading-relaxed">${dateStr}</p>
                </div>
            </div>
            <div class="text-right shrink-0 ml-2 mt-1 self-start items-end flex flex-col">
                <p class="text-sm border rounded-lg px-2 py-1 shadow-sm font-bold ${textClass || 'text-gray-600'} ${t.type === 'income' ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-900/10' : 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10'}">${sign || ''} ${this.formatCurrency(t.amount || 0)}</p>
            </div>
        `;
        return el;
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
            container.appendChild(this.renderNoteItem(n));
        });
    },

    renderNoteItem(note) {
        const el = document.createElement('div');
        el.className = 'premium-glass p-5 rounded-3xl reveal hover-lift cursor-pointer border border-white/20 dark:border-white/5';
        el.style.animationDelay = `${Math.random() * 0.3}s`;
        el.onclick = () => {
            if (window.editNote) window.editNote(note.id);
            else window.location.href = (window.location.pathname.includes('pages') ? '' : 'pages/') + 'notes.html';
        };
        
        el.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl grad-emerald text-white flex items-center justify-center shadow-md">
                        <i class="ph-duotone ph-note-penciled"></i>
                    </div>
                    <h3 class="font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">${note.title}</h3>
                </div>
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${note.date}</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">${note.content}</p>
        `;
        return el;
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
            container.appendChild(this.renderNoteItem(n));
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

        wallets.forEach(w => {
            container.appendChild(this.renderWalletItem(w));
        });
    },

    renderWalletItem(wallet, totalBalance = 0) {
        const trs = Store.getTransactions().filter(t => t.walletId === wallet.id || (!t.walletId && wallet.id === 'w-cash'));
        let balance = 0;
        trs.forEach(t => {
            if(t.type==='income') balance += parseFloat(t.amount);
            else balance -= parseFloat(t.amount);
        });

        const el = document.createElement('div');
        el.className = 'premium-glass p-6 rounded-[2.5rem] reveal hover-lift cursor-pointer';
        el.style.animationDelay = `${Math.random() * 0.3}s`;
        el.onclick = () => window.editWallet(wallet.id);

        const icon = wallet.category === 'cash' ? 'ph-duotone ph-money' : 'ph-duotone ph-credit-card';
        const gradClass = wallet.category === 'cash' ? 'grad-emerald' : 'bg-gradient-to-br from-blue-600 to-indigo-800';

        el.innerHTML = `
            <div class="flex items-center justify-between mb-5">
                <div class="w-12 h-12 rounded-2xl ${gradClass} text-white flex items-center justify-center text-2xl shadow-lg">
                    <i class="${icon}"></i>
                </div>
                <i class="ph-duotone ph-dots-three-circle-vertical text-2xl text-gray-400"></i>
            </div>
            <div>
                <h3 class="font-black text-lg text-gray-800 dark:text-gray-100 tracking-tight mb-1">${wallet.name}</h3>
                <p class="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4">${wallet.category === 'cash' ? 'Tunai' : 'Rekening/Kartu'}</p>
                <p class="text-2xl font-black text-agri-600 dark:text-agri-400">
                    ${this.formatCurrency(balance).replace('Rp&nbsp;', 'Rp ')}
                </p>
            </div>
        `;
        return el;
    },

    parseNumber(value) {
        if (!value) return 0;
        // Remove everything except numbers and decimal point
        const clean = value.toString().replace(/[^0-9]/g, '');
        return parseFloat(clean) || 0;
    },

    formatInput(value) {
        if (!value) return '';
        // Remove non-digits
        const clean = value.toString().replace(/\D/g, '');
        if (!clean) return '';
        // Format with Indonesian locale (dots for thousands)
        return new Intl.NumberFormat('id-ID').format(clean);
    },

    exportToCSV(transactions) {
        if (!transactions || transactions.length === 0) return;

        const headers = ['ID', 'Tanggal', 'Jenis', 'Kategori', 'Sub-Kategori', 'Nama/Item', 'Jumlah', 'Satuan', 'Dompet', 'Keterangan/Pihak Terkait'];
        const wallets = Store.getWallets();

        const csvRows = [headers.join(',')];

        transactions.forEach(t => {
            const wName = wallets.find(w => w.id === t.walletId)?.name || 'Uang Tunai';
            let category = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
            let subCategory = '';
            let nameItem = '';
            let detail = t.note || '';

            if (t.type === 'income') {
                subCategory = t.incomeCategory === 'sale' ? 'Penjualan' : 'Umum';
                nameItem = t.incomeCategory === 'sale' ? t.saleItemName : t.incomeName;
                if (t.incomeCategory === 'sale' && t.saleBuyer) detail += ` (Pembeli: ${t.saleBuyer})`;
            } else {
                subCategory = t.expenseCategory === 'wage' ? 'Upah' : (t.expenseCategory === 'purchase' ? 'Pembelian' : 'Lainnya');
                nameItem = t.expenseCategory === 'wage' ? t.workerName : (t.expenseCategory === 'purchase' ? t.itemName : '');
                if (t.expenseCategory === 'purchase' && t.itemSupplier) detail += ` (Asal: ${t.itemSupplier})`;
            }

            const row = [
                t.id,
                t.date,
                category,
                subCategory,
                t.expenseCategory || t.incomeCategory || '',
                `"${(nameItem || '').replace(/"/g, '""')}"`,
                t.amount,
                t.itemUnit || t.saleUnit || '',
                `"${wName.replace(/"/g, '""')}"`,
                `"${detail.replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const timestamp = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `AgriTrack_Transaksi_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
