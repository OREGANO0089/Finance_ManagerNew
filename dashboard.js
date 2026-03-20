// Initialize layout first
document.addEventListener('DOMContentLoaded', () => {
  renderLayout('Dashboard');
  initDashboard();
});

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

function initDashboard() {
  const store = window.appStore;
  const metrics = store.getDashboardMetrics();
  
  // 1. Update Metrics Cards
  document.querySelector('#metric-balance .metric-value').textContent = formatCurrency(metrics.totalBalance);
  updateMetricChange('#metric-balance', metrics.savings.change); // Roughly correlation

  document.querySelector('#metric-income .metric-value').textContent = formatCurrency(metrics.income.total);
  updateMetricChange('#metric-income', metrics.income.change);

  document.querySelector('#metric-expense .metric-value').textContent = formatCurrency(metrics.expense.total);
  updateMetricChange('#metric-expense', metrics.expense.change, true); // Lower is better for expense generally, but UI usually just shows if it went up or down

  document.querySelector('#metric-savings .metric-value').textContent = formatCurrency(metrics.savings.total);
  updateMetricChange('#metric-savings', metrics.savings.change);

  // 2. Render Charts
  renderIncomeChart();
  renderBudgetChart(store);

  // 3. Render Recent Transactions
  renderRecentTransactions(store);

  // 4. Render Spending Limits
  renderSpendingLimit(store, metrics.expense.total);

  // 5. Render Cards
  renderCardsWidget(store);
}

function updateMetricChange(selector, changeStr, invertedColors = false) {
  const changeNum = parseFloat(changeStr);
  const el = document.querySelector(`${selector} .metric-change`);
  
  if (changeNum >= 0) {
    el.innerHTML = `<i class="fas fa-arrow-up"></i> ${changeNum}%`;
    el.className = `metric-change ${invertedColors ? 'text-danger' : 'text-success'}`;
  } else {
    el.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.abs(changeNum)}%`;
    el.className = `metric-change ${invertedColors ? 'text-success' : 'text-danger'}`;
  }
}

function renderIncomeChart() {
  const ctx = document.getElementById('incomeChart').getContext('2d');
  
  // Mock data for months
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Create gradient or use brand colors
  // Fixed Income: JM Dark Blue (#2E3A8C)
  // Variable Income: JM Light Blue (#4A5FD9)
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Fixed Income',
          data: [3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500],
          backgroundColor: '#2E3A8C',
          borderRadius: 4,
          barPercentage: 0.6,
          categoryPercentage: 0.8
        },
        {
          label: 'Variable Income',
          data: [400, 600, 200, 800, 500, 1000, 300, 450, 700, 900, 200, 1200],
          backgroundColor: '#4A5FD9',
          borderRadius: 4,
          barPercentage: 0.6,
          categoryPercentage: 0.8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { 
          stacked: true, 
          border: { display: false },
          suggestedMax: 6000,
          ticks: {
            callback: function(value) {
              if (value >= 1000) return '$' + (value / 1000) + 'k';
              return '$' + value;
            }
          }
        }
      },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
      }
    }
  });
}

function renderBudgetChart(store) {
  const ctx = document.getElementById('budgetChart').getContext('2d');
  const budgets = store.getData('budgets');
  
  const labels = budgets.map(b => b.category);
  const dataSpent = budgets.map(b => b.spentAmount);
  
  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocatedAmount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
  
  document.getElementById('budget-center-value').textContent = `$${totalSpent} / $${totalAllocated}`;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: dataSpent,
        backgroundColor: [
          '#2E3A8C', // Primary
          '#4A5FD9', // Secondary
          '#10B981', // Success
          '#F59E0B', // Warning
          '#1A2254'  // Navy
        ],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } }
      }
    }
  });
}

function renderRecentTransactions(store) {
  const txs = store.getData('transactions').slice(0, 5); // top 5
  const container = document.getElementById('recent-transactions-list');
  
  if (txs.length === 0) {
    container.innerHTML = '<p class="text-small" style="text-align:center; padding: 20px;">No recent transactions.</p>';
    return;
  }
  
  let html = '';
  txs.forEach(t => {
    const isIncome = t.type === 'income';
    const amountStr = isIncome ? `+${formatCurrency(t.amount)}` : `-${formatCurrency(t.amount)}`;
    const amountColor = isIncome ? 'var(--color-success)' : 'var(--color-text-heading)';
    
    // Status Badge
    let badgeClass = 'badge-success';
    if (t.status === 'pending') badgeClass = 'badge-warning';
    if (t.status === 'failed') badgeClass = 'badge-danger';
    
    const dateObj = new Date(t.date);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
    
    const initials = t.recipientName.substring(0,2).toUpperCase();
    
    html += `
      <div class="transaction-row">
        <div class="tx-user">
          <div class="tx-avatar">${initials}</div>
          <div>
            <div style="font-weight: 600;">${t.recipientName}</div>
            <div class="text-caption">${t.category} • ${dateStr}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 600; color: ${amountColor};">${amountStr}</div>
          <div class="badge ${badgeClass}" style="margin-top: 4px; display: inline-block;">${t.status}</div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function renderSpendingLimit(store, currentExpense) {
  const user = store.getUser();
  const limit = user.monthlySpendingLimit || 5000;
  
  const perc = Math.min((currentExpense / limit) * 100, 100);
  
  document.getElementById('spending-limit-text').textContent = `${formatCurrency(currentExpense)} / ${formatCurrency(limit)}`;
  document.getElementById('spending-limit-bar').style.width = `${perc}%`;
  
  // Change color if close to limit
  if (perc > 90) {
    document.getElementById('spending-limit-bar').style.backgroundColor = 'var(--color-danger)';
  } else if (perc > 75) {
    document.getElementById('spending-limit-bar').style.backgroundColor = 'var(--color-warning)';
  }
  
  document.getElementById('spending-limit-perc').textContent = `${perc.toFixed(1)}% used`;
}

function renderCardsWidget(store) {
  const cards = store.getData('cards');
  const container = document.getElementById('my-cards-container');
  
  if (cards.length === 0) {
    container.innerHTML = '<p class="text-small" style="text-align:center;">No cards saved.</p>';
    return;
  }
  
  const c = cards[0]; // Just show the first one on dashboard
  const last4 = c.cardNumber.slice(-4);
  
  // basic logo logic
  let logoClass = 'fab fa-cc-visa';
  if (c.cardType === 'mastercard') logoClass = 'fab fa-cc-mastercard';
  else if (c.cardType === 'amex') logoClass = 'fab fa-cc-amex';

  container.innerHTML = `
    <div class="card-preview">
      <div class="flex justify-between items-center mb-4" style="position: relative; z-index: 2;">
        <i class="${logoClass}" style="font-size: 28px;"></i>
        <i class="fas fa-wifi" style="transform: rotate(90deg);"></i>
      </div>
      <div style="font-size: 20px; letter-spacing: 2px; margin-bottom: 16px; position: relative; z-index: 2;">
        **** **** **** ${last4}
      </div>
      <div class="flex justify-between items-center text-small" style="position: relative; z-index: 2; opacity: 0.9;">
        <div>
          <div style="font-size: 10px; text-transform: uppercase;">Cardholder</div>
          <div style="font-weight: 600;">${c.cardholderName}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 10px; text-transform: uppercase;">Expires</div>
          <div style="font-weight: 600;">${c.expiryDate}</div>
        </div>
      </div>
    </div>
  `;
}
