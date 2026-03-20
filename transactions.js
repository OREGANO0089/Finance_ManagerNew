document.addEventListener('DOMContentLoaded', () => {
  renderLayout('Transactions');
  initTransactions();
});

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const expenseCategories = ['Food & Grocery', 'Transportation', 'Entertainment', 'Healthcare', 'Shopping', 'Bills & Utilities', 'Travel', 'Education', 'Subscriptions', 'Other'];
const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Rental Income', 'Gifts', 'Refunds', 'Other'];

function initTransactions() {
  renderTable();
  
  // Event listeners for filters
  document.getElementById('search-input').addEventListener('input', renderTable);
  document.getElementById('filter-type').addEventListener('change', renderTable);
  document.getElementById('filter-status').addEventListener('change', renderTable);
  document.getElementById('sort-by').addEventListener('change', renderTable);
  
  // Form submission
  document.getElementById('transaction-form').addEventListener('submit', handleFormSubmit);
  
  // Category dropdown logic
  document.getElementById('tx-type').addEventListener('change', updateCategoryDropdown);
}

function updateCategoryDropdown() {
  const type = document.getElementById('tx-type').value;
  const catSelect = document.getElementById('tx-category');
  catSelect.innerHTML = '';
  
  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    catSelect.appendChild(opt);
  });
}

function renderTable() {
  const store = window.appStore;
  let txs = [...store.getData('transactions')]; // clone for sorting
  
  const searchT = document.getElementById('search-input').value.toLowerCase();
  const typeT = document.getElementById('filter-type').value;
  const statusT = document.getElementById('filter-status').value;
  const sortT = document.getElementById('sort-by').value;
  
  // Filtering
  txs = txs.filter(t => {
    if (typeT !== 'all' && t.type !== typeT) return false;
    if (statusT !== 'all' && t.status !== statusT) return false;
    if (searchT) {
      const matchName = t.recipientName.toLowerCase().includes(searchT);
      const matchId = t.id.toLowerCase().includes(searchT);
      const matchNotes = t.notes && t.notes.toLowerCase().includes(searchT);
      if (!(matchName || matchId || matchNotes)) return false;
    }
    return true;
  });
  
  // Sorting
  txs.sort((a, b) => {
    switch (sortT) {
      case 'date-desc': return new Date(b.date) - new Date(a.date);
      case 'date-asc': return new Date(a.date) - new Date(b.date);
      case 'amount-desc': return b.amount - a.amount;
      case 'amount-asc': return a.amount - b.amount;
      default: return 0;
    }
  });
  
  const tbody = document.getElementById('transactions-table-body');
  tbody.innerHTML = '';
  
  if (txs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 32px;"><i class="fas fa-inbox" style="font-size: 32px; color: var(--color-border); margin-bottom: 12px; display:block;"></i>No transactions found.</td></tr>';
    return;
  }
  
  txs.forEach(t => {
    const isIncome = t.type === 'income';
    const amountStr = isIncome ? `+${formatCurrency(t.amount)}` : `-${formatCurrency(t.amount)}`;
    const amountColor = isIncome ? 'var(--color-success)' : 'var(--color-text-heading)';
    
    // Status Badge
    let badgeClass = 'badge-success';
    if (t.status === 'pending') badgeClass = 'badge-warning';
    if (t.status === 'failed') badgeClass = 'badge-danger';
    
    const dateObj = new Date(t.date);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit' });
    
    // Avatar logic
    let initials = '?';
    if(t.recipientName && t.recipientName.length >= 2) {
        initials = t.recipientName.substring(0,2).toUpperCase();
    }
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="font-weight: 600;"><span class="tx-avatar">${initials}</span> ${t.recipientName}</div>
        ${t.notes ? `<div class="text-caption" style="margin-left: 44px;">${t.notes}</div>` : ''}
      </td>
      <td class="text-small" style="color: var(--color-text-body)">${t.id}</td>
      <td>${t.category}</td>
      <td class="text-small">${dateStr}</td>
      <td><span class="badge ${badgeClass}">${t.status}</span></td>
      <td style="text-align: right; font-weight: 600; color: ${amountColor};">${amountStr}</td>
      <td style="text-align: center;">
        <button class="action-btn" onclick="openEditModal('${t.id}')" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="action-btn delete" onclick="deleteTransaction('${t.id}')" title="Delete"><i class="fas fa-trash-alt"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Modal Logic
window.openTransactionModal = () => {
  document.getElementById('modal-title').textContent = 'Add Transaction';
  document.getElementById('transaction-form').reset();
  document.getElementById('tx-id').value = '';
  
  // Set default date to now
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('tx-date').value = now.toISOString().slice(0, 16);
  
  updateCategoryDropdown();
  
  document.getElementById('transaction-modal').classList.add('active');
};

window.closeTransactionModal = () => {
  document.getElementById('transaction-modal').classList.remove('active');
};

window.openEditModal = (id) => {
  const store = window.appStore;
  const t = store.getData('transactions').find(t => t.id === id);
  if (!t) return;
  
  document.getElementById('modal-title').textContent = 'Edit Transaction';
  document.getElementById('tx-id').value = t.id;
  document.getElementById('tx-type').value = t.type;
  
  updateCategoryDropdown();
  
  document.getElementById('tx-amount').value = t.amount;
  document.getElementById('tx-category').value = t.category;
  document.getElementById('tx-status').value = t.status;
  document.getElementById('tx-name').value = t.recipientName;
  
  const dateObj = new Date(t.date);
  dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
  document.getElementById('tx-date').value = dateObj.toISOString().slice(0, 16);
  
  document.getElementById('tx-notes').value = t.notes || '';
  
  document.getElementById('transaction-modal').classList.add('active');
};

window.deleteTransaction = (id) => {
  if(confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
    window.appStore.deleteItem('transactions', id);
    renderTable();
  }
};

function handleFormSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('tx-id').value;
  const newData = {
    type: document.getElementById('tx-type').value,
    amount: parseFloat(document.getElementById('tx-amount').value),
    category: document.getElementById('tx-category').value,
    status: document.getElementById('tx-status').value,
    recipientName: document.getElementById('tx-name').value,
    date: new Date(document.getElementById('tx-date').value).toISOString(),
    notes: document.getElementById('tx-notes').value
  };
  
  if (id) {
    window.appStore.updateItem('transactions', id, newData);
  } else {
    window.appStore.addItem('transactions', newData);
  }
  
  closeTransactionModal();
  renderTable();
}
