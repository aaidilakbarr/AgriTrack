document.addEventListener('DOMContentLoaded', () => {
    // Initialize month filter variable
    window.activeMonthFilter = '';

    // Init Dark Mode
    const themeToggle = document.getElementById('themeToggle');
    
    // Set theme based on localStorage
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            if (document.documentElement.classList.contains('dark')) {
                localStorage.theme = 'dark';
            } else {
                localStorage.theme = 'light';
            }
        });
    }

    // Migration logic for old 'purchase' transactions
    try {
        let _tx = Store.getTransactions();
        let _migrated = false;
        _tx.forEach(t => {
            if (t.type === 'purchase') {
                t.type = 'expense';
                t.expenseCategory = 'purchase';
                _migrated = true;
            }
        });
        if (_migrated) Store.saveTransactions(_tx);
    } catch(e) { }

    // Initialize Dashboard UI if on dashboard
    if (document.getElementById('totalBalance')) {
        UI.renderDashboardStats();
        UI.renderRecentTransactions();
        if (typeof UI.renderRecentNotes === 'function') {
            UI.renderRecentNotes();
        }
    }

    // Initialize Transactions Page UI
    if (document.getElementById('transactionListContainer')) {
        UI.renderAllTransactions();

        const searchInput = document.getElementById('searchTransactionInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const activeFilterBtn = document.querySelector('.filter-btn.bg-agri-600');
                const activeFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
                UI.renderAllTransactions(activeFilter);
            });
        }
        const mpCloseBtn = document.getElementById('closeMonthPickerBtn');
        const monthPickerModal = document.getElementById('monthPickerModal');
        const monthPickerContent = document.getElementById('monthPickerContent');
        const openMonthPickerBtn = document.getElementById('openMonthPickerBtn');
        const mpCurrentYear = document.getElementById('mpCurrentYear');
        const mpMonthsGrid = document.getElementById('mpMonthsGrid');
        const mpPrevYear = document.getElementById('mpPrevYear');
        const mpNextYear = document.getElementById('mpNextYear');
        const mpClearBtn = document.getElementById('mpClearBtn');
        const monthPickerBtnText = document.getElementById('monthPickerBtnText');

        if (openMonthPickerBtn && monthPickerModal) {
            let activeYear = new Date().getFullYear();
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

            const triggerSearch = () => {
                const activeFilterBtn = document.querySelector('.filter-btn.bg-agri-600');
                const activeFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
                UI.renderAllTransactions(activeFilter);
                updateMonthFilterBadge();
            };

            const updateMonthFilterBadge = () => {
                const badge = document.getElementById('monthFilterBadge');
                const badgeText = document.getElementById('monthFilterBadgeText');

                if (window.activeMonthFilter) {
                    const [year, month] = window.activeMonthFilter.split('-');
                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
                    const monthName = monthNames[parseInt(month) - 1];
                    badgeText.textContent = `${monthName} ${year}`;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            };

            const closeMp = () => {
                monthPickerModal.classList.add('opacity-0');
                monthPickerContent.classList.add('scale-95');
                
                // Show navbar when modal closed
                const bottomNav = document.getElementById('bottomNav');
                if (bottomNav) bottomNav.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
                
                setTimeout(() => monthPickerModal.classList.add('hidden'), 300);
            };

            const renderMonthsGrid = () => {
                mpCurrentYear.textContent = activeYear;
                mpMonthsGrid.innerHTML = '';
                
                const currentFilterParts = window.activeMonthFilter ? window.activeMonthFilter.split('-') : null;
                const filterYear = currentFilterParts ? parseInt(currentFilterParts[0]) : null;
                const filterMonth = currentFilterParts ? parseInt(currentFilterParts[1]) : null;
                
                let activeBtn = null;
                monthNames.forEach((m, idx) => {
                    const btn = document.createElement('button');
                    const monthNum = idx + 1; // 1 to 12
                    const isActive = (filterYear === activeYear && filterMonth === monthNum);
                    
                    btn.type = "button";
                    btn.className = `p-3 rounded-xl text-center font-bold text-sm transition-all ${
                        isActive 
                        ? 'bg-agri-600 text-white shadow-md shadow-agri-600/30' 
                        : 'bg-gray-50 dark:bg-dark-bg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                    }`;
                    btn.textContent = m;
                    
                    btn.addEventListener('click', () => {
                        window.activeMonthFilter = `${activeYear}-${monthNum.toString().padStart(2, '0')}`;
                        closeMp();
                        triggerSearch();
                    });
                    
                    if (isActive) activeBtn = btn;
                    mpMonthsGrid.appendChild(btn);
                });
            };

            window.openMonthPickerModal = () => {
                monthPickerModal.classList.remove('hidden');
                setTimeout(() => {
                    monthPickerModal.classList.remove('opacity-0');
                    monthPickerContent.classList.remove('scale-95', 'translate-y-full', 'sm:translate-y-10');
                }, 10);

                // Hide navbar when modal open
                const bottomNav = document.getElementById('bottomNav');
                if (bottomNav) bottomNav.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');

                if (window.activeMonthFilter) {
                    activeYear = parseInt(window.activeMonthFilter.split('-')[0]);
                } else {
                    activeYear = new Date().getFullYear();
                }
                renderMonthsGrid();
            };

            mpCloseBtn.addEventListener('click', closeMp);
            monthPickerModal.addEventListener('click', (e) => {
                if (e.target === monthPickerModal) closeMp();
            });

            mpPrevYear.addEventListener('click', () => { activeYear--; renderMonthsGrid(); });
            mpNextYear.addEventListener('click', () => { activeYear++; renderMonthsGrid(); });

            mpClearBtn.addEventListener('click', () => {
                window.activeMonthFilter = '';
                closeMp();
                triggerSearch();
            });

            // Clear month filter from badge button
            const clearMonthFilterBtn = document.getElementById('clearMonthFilterBtn');
            if (clearMonthFilterBtn) {
                clearMonthFilterBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.activeMonthFilter = '';
                    updateMonthFilterBadge();
                    const activeFilterBtn = document.querySelector('.filter-btn.bg-agri-600');
                    const activeFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
                    UI.renderAllTransactions(activeFilter);
                });
            }

            // Open month picker modal when button is clicked
            openMonthPickerBtn.addEventListener('click', window.openMonthPickerModal);

            // Export Transactions handler
            const exportBtn = document.getElementById('exportTransactionsBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    const activeFilterBtn = document.querySelector('.filter-btn.bg-agri-600');
                    const activeFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
                    
                    const transactions = Store.getTransactions();
                    let filtered = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    if (activeFilter !== 'all') {
                        filtered = filtered.filter(t => t.type === activeFilter);
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
                            const wName = Store.getWallets().find(w => w.id === t.walletId)?.name || 'Uang Tunai';
                            const searchStr = `${t.note || ''} ${t.itemName || ''} ${t.itemSupplier || ''} ${t.workerName || ''} ${t.incomeName || ''} ${t.saleItemName || ''} ${t.saleBuyer || ''} ${t.amount || ''} ${wName}`.toLowerCase();
                            return searchStr.includes(query);
                        });
                    }
                    
                    UI.exportToCSV(filtered);
                });
            }

            // Initialize badge display on page load
            updateMonthFilterBadge();
        }

        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => {
                    b.classList.remove('bg-agri-600', 'text-white', 'border-agri-600', 'shadow-md', 'shadow-agri-600/30');
                    b.classList.add('bg-white', 'dark:bg-dark-card', 'text-gray-500', 'dark:text-gray-400', 'border-gray-200', 'dark:border-dark-border');
                });
                const target = e.currentTarget;
                target.classList.remove('bg-white', 'dark:bg-dark-card', 'text-gray-500', 'dark:text-gray-400', 'border-gray-200', 'dark:border-dark-border');
                target.classList.add('bg-agri-600', 'text-white', 'border-agri-600', 'shadow-md', 'shadow-agri-600/30');
                
                UI.renderAllTransactions(target.dataset.filter);
            });
        });

        const modal = document.getElementById('transactionModal');
        const modalContent = document.getElementById('transactionModalContent');
        const addBtn = document.getElementById('addTransactionBtn');
        const closeBtn = document.getElementById('closeModalBtn');
        const form = document.getElementById('transactionForm');
        const deleteBtn = document.getElementById('deleteTransBtn');

        const typeRadios = document.querySelectorAll('input[name="type"]');
        const purchaseFields = document.getElementById('purchaseFields');
        const itemNameInput = document.getElementById('transItemName');
        const itemUnitInput = document.getElementById('transItemUnit');
        const itemQuantityInput = document.getElementById('transItemQuantity');
        const itemSupplierInput = document.getElementById('transItemSupplier');
        const incomeCategoryContainer = document.getElementById('incomeCategoryContainer');
        const incomeCategoryRadios = document.querySelectorAll('input[name="incomeCategory"]');
        const incomeGeneralFields = document.getElementById('incomeGeneralFields');
        const incomeNameInput = document.getElementById('transIncomeName');
        const saleFields = document.getElementById('saleFields');
        const saleItemNameInput = document.getElementById('saleItemName');
        const saleQuantityInput = document.getElementById('saleQuantity');
        const saleUnitInput = document.getElementById('saleUnit');
        const saleBuyerInput = document.getElementById('saleBuyer');
        
        const expenseCategoryContainer = document.getElementById('expenseCategoryContainer');
        const expenseCategoryRadios = document.querySelectorAll('input[name="expenseCategory"]');
        const wageFields = document.getElementById('wageFields');
        const transWorkerName = document.getElementById('transWorkerName');

        if (incomeCategoryRadios && incomeGeneralFields && saleFields) {
            incomeCategoryRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.value === 'general') {
                        incomeGeneralFields.classList.remove('hidden');
                        if (incomeNameInput) incomeNameInput.required = true;
                        saleFields.classList.add('hidden');
                        if (saleItemNameInput) saleItemNameInput.required = false;
                        if (saleQuantityInput) saleQuantityInput.required = false;
                        if (saleUnitInput) saleUnitInput.required = false;
                    } else if (e.target.value === 'sale') {
                        saleFields.classList.remove('hidden');
                        if (saleItemNameInput) saleItemNameInput.required = true;
                        if (saleQuantityInput) saleQuantityInput.required = true;
                        if (saleUnitInput) saleUnitInput.required = true;
                        incomeGeneralFields.classList.add('hidden');
                        if (incomeNameInput) incomeNameInput.required = false;
                    }
                });
            });
        }

        if (expenseCategoryRadios && wageFields) {
            expenseCategoryRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.value === 'wage') {
                        wageFields.classList.remove('hidden');
                        if (transWorkerName) transWorkerName.required = true;
                        if (purchaseFields) purchaseFields.classList.add('hidden');
                        if (itemNameInput) itemNameInput.required = false;
                        if (itemUnitInput) itemUnitInput.required = false;
                        if (itemQuantityInput) itemQuantityInput.required = false;
                        if (itemSupplierInput) itemSupplierInput.required = false;
                    } else if (e.target.value === 'purchase') {
                        if (purchaseFields) purchaseFields.classList.remove('hidden');
                        if (itemNameInput) itemNameInput.required = true;
                        if (itemUnitInput) itemUnitInput.required = true;
                        if (itemQuantityInput) itemQuantityInput.required = true;
                        if (itemSupplierInput) itemSupplierInput.required = true;
                        wageFields.classList.add('hidden');
                        if (transWorkerName) transWorkerName.required = false;
                    } else {
                        wageFields.classList.add('hidden');
                        if (transWorkerName) transWorkerName.required = false;
                        if (purchaseFields) purchaseFields.classList.add('hidden');
                        if (itemNameInput) itemNameInput.required = false;
                        if (itemUnitInput) itemUnitInput.required = false;
                        if (itemQuantityInput) itemQuantityInput.required = false;
                        if (itemSupplierInput) itemSupplierInput.required = false;
                    }
                });
            });
        }
        
        if (typeRadios) {
            typeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.value === 'expense') {
                        if (incomeCategoryContainer) incomeCategoryContainer.classList.add('hidden');
                        if (incomeGeneralFields) incomeGeneralFields.classList.add('hidden');
                        if (incomeNameInput) incomeNameInput.required = false;
                        if (saleFields) saleFields.classList.add('hidden');
                        if (saleItemNameInput) saleItemNameInput.required = false;
                        if (saleQuantityInput) saleQuantityInput.required = false;
                        if (saleUnitInput) saleUnitInput.required = false;
                        
                        if (expenseCategoryContainer) expenseCategoryContainer.classList.remove('hidden');
                        const checkedEx = document.querySelector('input[name="expenseCategory"]:checked');
                        if (checkedEx && checkedEx.value === 'wage') {
                            if (wageFields) wageFields.classList.remove('hidden');
                            if (transWorkerName) transWorkerName.required = true;
                            if (purchaseFields) purchaseFields.classList.add('hidden');
                            if (itemNameInput) itemNameInput.required = false;
                            if (itemUnitInput) itemUnitInput.required = false;
                            if (itemQuantityInput) itemQuantityInput.required = false;
                            if (itemSupplierInput) itemSupplierInput.required = false;
                        } else if (checkedEx && checkedEx.value === 'purchase') {
                            if (purchaseFields) purchaseFields.classList.remove('hidden');
                            if (itemNameInput) itemNameInput.required = true;
                            if (itemUnitInput) itemUnitInput.required = true;
                            if (itemQuantityInput) itemQuantityInput.required = true;
                            if (itemSupplierInput) itemSupplierInput.required = true;
                            if (wageFields) wageFields.classList.add('hidden');
                            if (transWorkerName) transWorkerName.required = false;
                        } else {
                            if (wageFields) wageFields.classList.add('hidden');
                            if (transWorkerName) transWorkerName.required = false;
                            if (purchaseFields) purchaseFields.classList.add('hidden');
                            if (itemNameInput) itemNameInput.required = false;
                            if (itemUnitInput) itemUnitInput.required = false;
                            if (itemQuantityInput) itemQuantityInput.required = false;
                            if (itemSupplierInput) itemSupplierInput.required = false;
                        }
                    } else {
                        if (incomeCategoryContainer) incomeCategoryContainer.classList.remove('hidden');
                        const checkedInc = document.querySelector('input[name="incomeCategory"]:checked');
                        if (checkedInc && checkedInc.value === 'sale') {
                            if (saleFields) saleFields.classList.remove('hidden');
                            if (saleItemNameInput) saleItemNameInput.required = true;
                            if (saleQuantityInput) saleQuantityInput.required = true;
                            if (saleUnitInput) saleUnitInput.required = true;
                            if (incomeGeneralFields) incomeGeneralFields.classList.add('hidden');
                            if (incomeNameInput) incomeNameInput.required = false;
                        } else {
                            if (incomeGeneralFields) incomeGeneralFields.classList.remove('hidden');
                            if (incomeNameInput) incomeNameInput.required = true;
                            if (saleFields) saleFields.classList.add('hidden');
                            if (saleItemNameInput) saleItemNameInput.required = false;
                            if (saleQuantityInput) saleQuantityInput.required = false;
                            if (saleUnitInput) saleUnitInput.required = false;
                        }
                        
                        if (expenseCategoryContainer) expenseCategoryContainer.classList.add('hidden');
                        if (wageFields) wageFields.classList.add('hidden');
                        if (transWorkerName) transWorkerName.required = false;
                        if (purchaseFields) purchaseFields.classList.add('hidden');
                        if (itemNameInput) itemNameInput.required = false;
                        if (itemUnitInput) itemUnitInput.required = false;
                        if (itemQuantityInput) itemQuantityInput.required = false;
                        if (itemSupplierInput) itemSupplierInput.required = false;
                    }
                });
            });
        }

        const openModal = (isEdit = false, transData = null) => {
            const walletSelect = document.getElementById('transWallet');
            walletSelect.innerHTML = '';
            const wallets = Store.getWallets();
            wallets.forEach(w => {
                const opt = document.createElement('option');
                opt.value = w.id;
                opt.textContent = `${w.name} (${w.category === 'cash' ? 'Tunai' : 'Kartu'})`;
                walletSelect.appendChild(opt);
            });

            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modalContent.classList.remove('translate-y-full', 'sm:translate-y-10');
            }, 10);

            if (isEdit && transData) {
                document.getElementById('modalTitle').textContent = 'Edit Transaksi';
                document.getElementById('transId').value = transData.id;
                document.getElementById('transAmount').value = transData.amount;
                document.getElementById('transNote').value = transData.note;
                document.getElementById('transDate').value = transData.date;
                document.getElementById('transWallet').value = transData.walletId || (wallets[0] ? wallets[0].id : '');
                document.querySelector(`input[name="type"][value="${transData.type}"]`).checked = true;
                
                if (expenseCategoryContainer) {
                    if (transData.type === 'expense') {
                        expenseCategoryContainer.classList.remove('hidden');
                        const cat = transData.expenseCategory || 'general';
                        const wType = transData.wageType || 'daily';
                        
                        const exRadio = document.querySelector(`input[name="expenseCategory"][value="${cat}"]`);
                        if (exRadio) exRadio.checked = true;
                        
                        if (cat === 'wage') {
                            if (wageFields) wageFields.classList.remove('hidden');
                            const wRadio = document.querySelector(`input[name="wageType"][value="${wType}"]`);
                            if (wRadio) wRadio.checked = true;
                            if (transWorkerName) {
                                transWorkerName.value = transData.workerName || '';
                                transWorkerName.required = true;
                            }
                            if (purchaseFields) purchaseFields.classList.add('hidden');
                            if (itemNameInput) { itemNameInput.value = ''; itemNameInput.required = false; }
                            if (itemUnitInput) { itemUnitInput.value = ''; itemUnitInput.required = false; }
                            if (itemQuantityInput) { itemQuantityInput.value = ''; itemQuantityInput.required = false; }
                            if (itemSupplierInput) { itemSupplierInput.value = ''; itemSupplierInput.required = false; }
                        } else if (cat === 'purchase') {
                            if (purchaseFields) purchaseFields.classList.remove('hidden');
                            if (itemNameInput) { itemNameInput.value = transData.itemName || ''; itemNameInput.required = true; }
                            if (itemUnitInput) { itemUnitInput.value = transData.itemUnit || ''; itemUnitInput.required = true; }
                            if (itemQuantityInput) { itemQuantityInput.value = transData.itemQuantity || ''; itemQuantityInput.required = true; }
                            if (itemSupplierInput) { itemSupplierInput.value = transData.itemSupplier || ''; itemSupplierInput.required = true; }
                            if (wageFields) wageFields.classList.add('hidden');
                            if (transWorkerName) transWorkerName.required = false;
                        } else {
                            if (wageFields) wageFields.classList.add('hidden');
                            if (transWorkerName) transWorkerName.required = false;
                            if (purchaseFields) purchaseFields.classList.add('hidden');
                            if (itemNameInput) { itemNameInput.value = ''; itemNameInput.required = false; }
                            if (itemUnitInput) { itemUnitInput.value = ''; itemUnitInput.required = false; }
                            if (itemQuantityInput) { itemQuantityInput.value = ''; itemQuantityInput.required = false; }
                            if (itemSupplierInput) { itemSupplierInput.value = ''; itemSupplierInput.required = false; }
                        }
                    } else {
                        if (incomeCategoryContainer) incomeCategoryContainer.classList.remove('hidden');
                        const incCat = transData.incomeCategory || 'general';
                        const incRadio = document.querySelector(`input[name="incomeCategory"][value="${incCat}"]`);
                        if (incRadio) incRadio.checked = true;

                        if (incCat === 'sale') {
                            if (saleFields) saleFields.classList.remove('hidden');
                            if (saleItemNameInput) { saleItemNameInput.value = transData.saleItemName || ''; saleItemNameInput.required = true; }
                            if (saleQuantityInput) { saleQuantityInput.value = transData.saleQuantity || ''; saleQuantityInput.required = true; }
                            if (saleUnitInput) { saleUnitInput.value = transData.saleUnit || ''; saleUnitInput.required = true; }
                            if (saleBuyerInput) { saleBuyerInput.value = transData.saleBuyer || ''; saleBuyerInput.required = false; }
                            if (incomeGeneralFields) incomeGeneralFields.classList.add('hidden');
                            if (incomeNameInput) { incomeNameInput.value = ''; incomeNameInput.required = false; }
                        } else {
                            if (incomeGeneralFields) incomeGeneralFields.classList.remove('hidden');
                            if (incomeNameInput) { incomeNameInput.value = transData.incomeName || ''; incomeNameInput.required = true; }
                            if (saleFields) saleFields.classList.add('hidden');
                            if (saleItemNameInput) { saleItemNameInput.value = ''; saleItemNameInput.required = false; }
                            if (saleQuantityInput) { saleQuantityInput.value = ''; saleQuantityInput.required = false; }
                            if (saleUnitInput) { saleUnitInput.value = ''; saleUnitInput.required = false; }
                            if (saleBuyerInput) { saleBuyerInput.value = ''; saleBuyerInput.required = false; }
                        }
                        
                        expenseCategoryContainer.classList.add('hidden');
                        if (wageFields) wageFields.classList.add('hidden');
                        if (transWorkerName) transWorkerName.required = false;
                        if (purchaseFields) purchaseFields.classList.add('hidden');
                        if (itemNameInput) { itemNameInput.value = ''; itemNameInput.required = false; }
                        if (itemUnitInput) { itemUnitInput.value = ''; itemUnitInput.required = false; }
                        if (itemQuantityInput) { itemQuantityInput.value = ''; itemQuantityInput.required = false; }
                        if (itemSupplierInput) { itemSupplierInput.value = ''; itemSupplierInput.required = false; }
                    }
                }
                
                deleteBtn.classList.remove('hidden');
            } else {
                document.getElementById('modalTitle').textContent = 'Tambah Transaksi';
                form.reset();
                document.getElementById('transId').value = '';
                document.getElementById('transDate').value = new Date().toISOString().split('T')[0];
                if(wallets[0]) document.getElementById('transWallet').value = wallets[0].id;
                
                if (incomeCategoryContainer) {
                    incomeCategoryContainer.classList.add('hidden');
                    const genIncRadio = document.querySelector('input[name="incomeCategory"][value="general"]');
                    if (genIncRadio) genIncRadio.checked = true;
                    if (incomeGeneralFields) incomeGeneralFields.classList.add('hidden');
                    if (incomeNameInput) { incomeNameInput.value = ''; incomeNameInput.required = false; }
                    if (saleFields) saleFields.classList.add('hidden');
                    if (saleItemNameInput) { saleItemNameInput.value = ''; saleItemNameInput.required = false; }
                    if (saleQuantityInput) { saleQuantityInput.value = ''; saleQuantityInput.required = false; }
                    if (saleUnitInput) { saleUnitInput.value = ''; saleUnitInput.required = false; }
                    if (saleBuyerInput) { saleBuyerInput.value = ''; saleBuyerInput.required = false; }

                    const activeType = document.querySelector('input[name="type"]:checked')?.value;
                    if (activeType === 'income') {
                        incomeCategoryContainer.classList.remove('hidden');
                        if (incomeGeneralFields) incomeGeneralFields.classList.remove('hidden');
                        if (incomeNameInput) incomeNameInput.required = true;
                    }
                }
                
                if (purchaseFields) {
                    purchaseFields.classList.add('hidden');
                    if(itemNameInput) {
                        itemNameInput.value = '';
                        itemNameInput.required = false;
                    }
                    if(itemUnitInput) {
                        itemUnitInput.value = '';
                        itemUnitInput.required = false;
                    }
                    if(itemQuantityInput) {
                        itemQuantityInput.value = '';
                        itemQuantityInput.required = false;
                    }
                    if(itemSupplierInput) {
                        itemSupplierInput.value = '';
                        itemSupplierInput.required = false;
                    }
                }
                
                if (expenseCategoryContainer) {
                    expenseCategoryContainer.classList.add('hidden');
                    const genRadio = document.querySelector('input[name="expenseCategory"][value="general"]');
                    if (genRadio) genRadio.checked = true;
                    const dailyRadio = document.querySelector('input[name="wageType"][value="daily"]');
                    if (dailyRadio) dailyRadio.checked = true;
                    if (wageFields) wageFields.classList.add('hidden');
                    if (transWorkerName) {
                        transWorkerName.value = '';
                        transWorkerName.required = false;
                    }
                }
                
                deleteBtn.classList.add('hidden');
            }

            // Apply formatting to amount and quantity fields upon opening
            if (typeof UI.formatInput === 'function') {
                const amountInput = document.getElementById('transAmount');
                if(amountInput) amountInput.value = UI.formatInput(amountInput.value);
                const sQty = document.getElementById('saleQuantity');
                if(sQty) sQty.value = UI.formatInput(sQty.value);
                const iQty = document.getElementById('transItemQuantity');
                if(iQty) iQty.value = UI.formatInput(iQty.value);
            }
        };

        const closeModal = () => {
            modal.classList.add('opacity-0');
            modalContent.classList.add('translate-y-full', 'sm:translate-y-10');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        };

        addBtn.addEventListener('click', () => openModal(false));
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        window.editTransaction = (id) => {
            const trans = Store.getTransactions().find(t => t.id === id);
            if(trans) openModal(true, trans);
        };

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('transId').value;
            const type = document.querySelector('input[name="type"]:checked').value;
            
            const data = {
                walletId: document.getElementById('transWallet').value,
                type: type,
                amount: UI.parseNumber(document.getElementById('transAmount').value),
                note: document.getElementById('transNote').value,
                date: document.getElementById('transDate').value
            };
            
            if (type === 'expense') {
                const exCatRadios = document.querySelector('input[name="expenseCategory"]:checked');
                if (exCatRadios) {
                    data.expenseCategory = exCatRadios.value;
                    if (exCatRadios.value === 'wage') {
                        const wTypeRadios = document.querySelector('input[name="wageType"]:checked');
                        if (wTypeRadios) data.wageType = wTypeRadios.value;
                        const wName = document.getElementById('transWorkerName');
                        if (wName) data.workerName = wName.value;
                    } else if (exCatRadios.value === 'purchase') {
                        const trName = document.getElementById('transItemName');
                        const trUnit = document.getElementById('transItemUnit');
                        const trQty = document.getElementById('transItemQuantity');
                        const trSupplier = document.getElementById('transItemSupplier');
                        if(trName) data.itemName = trName.value;
                        if(trUnit) data.itemUnit = trUnit.value;
                        if(trQty) data.itemQuantity = UI.parseNumber(trQty.value);
                        if(trSupplier) data.itemSupplier = trSupplier.value;
                    }
                }
            } else if (type === 'income') {
                const inCatRadios = document.querySelector('input[name="incomeCategory"]:checked');
                if (inCatRadios) {
                    data.incomeCategory = inCatRadios.value;
                    if (inCatRadios.value === 'general') {
                        const trIncomeName = document.getElementById('transIncomeName');
                        if (trIncomeName) data.incomeName = trIncomeName.value;
                    } else if (inCatRadios.value === 'sale') {
                        const trSaleItemName = document.getElementById('saleItemName');
                        const trSaleQuantity = document.getElementById('saleQuantity');
                        const trSaleUnit = document.getElementById('saleUnit');
                        const trSaleBuyer = document.getElementById('saleBuyer');
                        if (trSaleItemName) data.saleItemName = trSaleItemName.value;
                        if (trSaleQuantity) data.saleQuantity = UI.parseNumber(trSaleQuantity.value);
                        if (trSaleUnit) data.saleUnit = trSaleUnit.value;
                        if (trSaleBuyer) data.saleBuyer = trSaleBuyer.value;
                    }
                }
            }
            if (id) {
                Store.updateTransaction(id, data);
            } else {
                Store.addTransaction(data);
            }

            closeModal();
            const activeFilter = document.querySelector('.filter-btn.bg-agri-600').dataset.filter;
            UI.renderAllTransactions(activeFilter);
        });

        // Add Input Formatters for Digit Separator
        ['transAmount', 'saleQuantity', 'transItemQuantity'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    // Save cursor position
                    const cursor = e.target.selectionStart;
                    const oldLen = e.target.value.length;
                    
                    const formatted = UI.formatInput(e.target.value);
                    e.target.value = formatted;
                    
                    // Restore cursor position roughly
                    const newLen = formatted.length;
                    const pos = cursor + (newLen - oldLen);
                    e.target.setSelectionRange(pos, pos);
                });
            }
        });

        const deleteConfirmModal = document.getElementById('deleteConfirmModal');
        const deleteConfirmContent = document.getElementById('deleteConfirmContent');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const actualDeleteBtn = document.getElementById('actualDeleteBtn');

        const openDeleteConfirm = () => {
            if (deleteConfirmModal) {
                deleteConfirmModal.classList.remove('hidden');
                setTimeout(() => {
                    deleteConfirmModal.classList.remove('opacity-0');
                    if(deleteConfirmContent) deleteConfirmContent.classList.remove('scale-95');
                }, 10);
            }
        };

        const closeDeleteConfirm = () => {
            if (deleteConfirmModal) {
                deleteConfirmModal.classList.add('opacity-0');
                if(deleteConfirmContent) deleteConfirmContent.classList.add('scale-95');
                setTimeout(() => {
                    deleteConfirmModal.classList.add('hidden');
                }, 300);
            }
        };

        if (cancelDeleteBtn && actualDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', closeDeleteConfirm);
            
            actualDeleteBtn.addEventListener('click', () => {
                const id = document.getElementById('transId').value;
                if (id) {
                    Store.deleteTransaction(id);
                    closeDeleteConfirm();
                    closeModal();
                    const activeFilter = document.querySelector('.filter-btn.bg-agri-600').dataset.filter;
                    UI.renderAllTransactions(activeFilter);
                }
            });

            if (deleteConfirmModal) {
                deleteConfirmModal.addEventListener('click', (e) => {
                    if (e.target === deleteConfirmModal) closeDeleteConfirm();
                });
            }
        }

        deleteBtn.addEventListener('click', () => {
            const id = document.getElementById('transId').value;
            if (id) {
                openDeleteConfirm();
            }
        });
    }

    // Initialize Notes Page UI
    if (document.getElementById('notesListContainer')) {
        UI.renderNotes();

        const modal = document.getElementById('noteModal');
        const modalContent = document.getElementById('noteModalContent');
        const addBtn = document.getElementById('addNoteBtn');
        const closeBtn = document.getElementById('closeNoteModalBtn');
        const form = document.getElementById('noteForm');
        const deleteBtn = document.getElementById('deleteNoteBtn');

        const openModal = (isEdit = false, noteData = null) => {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modalContent.classList.remove('translate-y-full', 'sm:translate-y-10');
            }, 10);

            if (isEdit && noteData) {
                document.getElementById('noteModalTitle').textContent = 'Edit Catatan';
                document.getElementById('noteId').value = noteData.id;
                document.getElementById('noteTitle').value = noteData.title;
                document.getElementById('noteContent').value = noteData.content;
                document.getElementById('noteDate').value = noteData.date;
                deleteBtn.classList.remove('hidden');
            } else {
                document.getElementById('noteModalTitle').textContent = 'Tambah Catatan';
                form.reset();
                document.getElementById('noteId').value = '';
                document.getElementById('noteDate').value = new Date().toISOString().split('T')[0];
                deleteBtn.classList.add('hidden');
            }
        };

        const closeModal = () => {
            modal.classList.add('opacity-0');
            modalContent.classList.add('translate-y-full', 'sm:translate-y-10');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        };

        addBtn.addEventListener('click', () => openModal(false));
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        window.editNote = (id) => {
            const note = Store.getNotes().find(n => n.id === id);
            if(note) openModal(true, note);
        };

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('noteId').value;
            const data = {
                title: document.getElementById('noteTitle').value,
                content: document.getElementById('noteContent').value,
                date: document.getElementById('noteDate').value
            };

            if (id) {
                Store.updateNote(id, data);
            } else {
                Store.addNote(data);
            }

            closeModal();
            UI.renderNotes();
        });

        deleteBtn.addEventListener('click', () => {
            const id = document.getElementById('noteId').value;
            if (id && confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
                Store.deleteNote(id);
                closeModal();
                UI.renderNotes();
            }
        });
    }

    // Initialize Wallet Page UI
    if (document.getElementById('walletListContainer')) {
        UI.renderWallets();

        const modal = document.getElementById('walletModal');
        const modalContent = document.getElementById('walletModalContent');
        const addBtn = document.getElementById('addWalletBtn');
        const closeBtn = document.getElementById('closeWalletModalBtn');
        const form = document.getElementById('walletForm');
        const deleteBtn = document.getElementById('deleteWalletBtn');

        const openModal = (isEdit = false, walletData = null) => {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modalContent.classList.remove('translate-y-full', 'sm:translate-y-10');
            }, 10);

            if (isEdit && walletData) {
                document.getElementById('walletModalTitle').textContent = 'Edit Dompet';
                document.getElementById('walletId').value = walletData.id;
                document.getElementById('walletName').value = walletData.name;
                document.querySelector(`input[name="walletCategory"][value="${walletData.category}"]`).checked = true;
                if (walletData.id === 'w-cash' || walletData.id === 'w-card') {
                    deleteBtn.classList.add('hidden'); // Cannot delete default wallets
                } else {
                    deleteBtn.classList.remove('hidden');
                }
            } else {
                document.getElementById('walletModalTitle').textContent = 'Tambah Dompet';
                form.reset();
                document.getElementById('walletId').value = '';
                document.querySelector('input[name="walletCategory"][value="cash"]').checked = true;
                deleteBtn.classList.add('hidden');
            }
        };

        const closeModal = () => {
            modal.classList.add('opacity-0');
            modalContent.classList.add('translate-y-full', 'sm:translate-y-10');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        };

        addBtn.addEventListener('click', () => openModal(false));
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        window.editWallet = (id) => {
            const wallet = Store.getWallets().find(w => w.id === id);
            if(wallet) openModal(true, wallet);
        };

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('walletId').value;
            const data = {
                name: document.getElementById('walletName').value,
                category: document.querySelector('input[name="walletCategory"]:checked').value
            };

            if (id) {
                Store.updateWallet(id, data);
            } else {
                Store.addWallet(data);
            }

            closeModal();
            UI.renderWallets();
        });

        deleteBtn.addEventListener('click', () => {
            const id = document.getElementById('walletId').value;
            if (id === 'w-cash' || id === 'w-card') {
                alert('Dompet sistem tidak bisa dihapus!');
                return;
            }
            const transactions = Store.getTransactions();
            const isUsed = transactions.some(t => t.walletId === id);
            if (isUsed) {
                alert('Dompet ini tidak bisa dihapus karena sudah dipakai dalam histori transaksi Anda.');
                return;
            }

            if (id && confirm('Apakah Anda yakin ingin menghapus dompet ini?')) {
                Store.deleteWallet(id);
                closeModal();
                UI.renderWallets();
            }
        });
    }
});
