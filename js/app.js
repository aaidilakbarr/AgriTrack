document.addEventListener('DOMContentLoaded', () => {
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

    // Sidebar Toggle Logic
    const initSidebar = () => {
        const mainBody = document.getElementById('mainBody');
        const toggleBtn = document.getElementById('sidebarToggle');
        
        if (!mainBody || !toggleBtn) return;

        if (localStorage.sidebar === 'collapsed') {
            mainBody.setAttribute('data-sidebar', 'collapsed');
        }

        toggleBtn.addEventListener('click', () => {
            const isCollapsed = mainBody.getAttribute('data-sidebar') === 'collapsed';
            if (isCollapsed) {
                mainBody.removeAttribute('data-sidebar');
                localStorage.sidebar = 'expanded';
            } else {
                mainBody.setAttribute('data-sidebar', 'collapsed');
                localStorage.sidebar = 'collapsed';
            }
        });
    };
    initSidebar();

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
        
        const expenseCategoryContainer = document.getElementById('expenseCategoryContainer');
        const expenseCategoryRadios = document.querySelectorAll('input[name="expenseCategory"]');
        const wageFields = document.getElementById('wageFields');
        const transWorkerName = document.getElementById('transWorkerName');

        if (expenseCategoryRadios && wageFields) {
            expenseCategoryRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.value === 'wage') {
                        wageFields.classList.remove('hidden');
                        if (transWorkerName) transWorkerName.required = true;
                    } else {
                        wageFields.classList.add('hidden');
                        if (transWorkerName) transWorkerName.required = false;
                    }
                });
            });
        }
        
        if (typeRadios) {
            typeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.value === 'purchase') {
                        if (purchaseFields) purchaseFields.classList.remove('hidden');
                        if (itemNameInput) itemNameInput.required = true;
                        if (itemUnitInput) itemUnitInput.required = true;
                        if (expenseCategoryContainer) expenseCategoryContainer.classList.add('hidden');
                        if (wageFields) wageFields.classList.add('hidden');
                        if (transWorkerName) transWorkerName.required = false;
                    } else if (e.target.value === 'expense') {
                        if (purchaseFields) purchaseFields.classList.add('hidden');
                        if (itemNameInput) itemNameInput.required = false;
                        if (itemUnitInput) itemUnitInput.required = false;
                        if (expenseCategoryContainer) expenseCategoryContainer.classList.remove('hidden');
                        const checkedEx = document.querySelector('input[name="expenseCategory"]:checked');
                        if (checkedEx && checkedEx.value === 'wage') {
                            if (wageFields) wageFields.classList.remove('hidden');
                            if (transWorkerName) transWorkerName.required = true;
                        } else {
                            if (wageFields) wageFields.classList.add('hidden');
                            if (transWorkerName) transWorkerName.required = false;
                        }
                    } else {
                        if (purchaseFields) purchaseFields.classList.add('hidden');
                        if (itemNameInput) itemNameInput.required = false;
                        if (itemUnitInput) itemUnitInput.required = false;
                        if (expenseCategoryContainer) expenseCategoryContainer.classList.add('hidden');
                        if (wageFields) wageFields.classList.add('hidden');
                        if (transWorkerName) transWorkerName.required = false;
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
                
                if (purchaseFields) {
                    if (transData.type === 'purchase') {
                        purchaseFields.classList.remove('hidden');
                        if(itemNameInput) {
                            itemNameInput.value = transData.itemName || '';
                            itemNameInput.required = true;
                        }
                        if(itemUnitInput) {
                            itemUnitInput.value = transData.itemUnit || '';
                            itemUnitInput.required = true;
                        }
                    } else {
                        purchaseFields.classList.add('hidden');
                        if(itemNameInput) {
                            itemNameInput.value = '';
                            itemNameInput.required = false;
                        }
                        if(itemUnitInput) {
                            itemUnitInput.value = '';
                            itemUnitInput.required = false;
                        }
                    }
                }
                
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
                        } else {
                            if (wageFields) wageFields.classList.add('hidden');
                            if (transWorkerName) transWorkerName.required = false;
                        }
                    } else {
                        expenseCategoryContainer.classList.add('hidden');
                        if (wageFields) wageFields.classList.add('hidden');
                        if (transWorkerName) transWorkerName.required = false;
                    }
                }
                
                deleteBtn.classList.remove('hidden');
            } else {
                document.getElementById('modalTitle').textContent = 'Tambah Transaksi';
                form.reset();
                document.getElementById('transId').value = '';
                document.getElementById('transDate').value = new Date().toISOString().split('T')[0];
                if(wallets[0]) document.getElementById('transWallet').value = wallets[0].id;
                
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
                amount: document.getElementById('transAmount').value,
                note: document.getElementById('transNote').value,
                date: document.getElementById('transDate').value
            };
            
            if (type === 'purchase') {
                const trName = document.getElementById('transItemName');
                const trUnit = document.getElementById('transItemUnit');
                if(trName) data.itemName = trName.value;
                if(trUnit) data.itemUnit = trUnit.value;
            } else if (type === 'expense') {
                const exCatRadios = document.querySelector('input[name="expenseCategory"]:checked');
                if (exCatRadios) {
                    data.expenseCategory = exCatRadios.value;
                    if (exCatRadios.value === 'wage') {
                        const wTypeRadios = document.querySelector('input[name="wageType"]:checked');
                        if (wTypeRadios) data.wageType = wTypeRadios.value;
                        const wName = document.getElementById('transWorkerName');
                        if (wName) data.workerName = wName.value;
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
