document.addEventListener('DOMContentLoaded', () => {
  renderLayout('Analytics');
  initAnalytics();
});

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

function initAnalytics() {
  const store = window.appStore;
  
  renderSpendingTrends(store);
  renderCategoryBreakdown(store);
  renderIncomeVsExpense(store);
  renderTopExpenses(store);
}

function renderSpendingTrends(store) {
  const ctx = document.getElementById('spendingTrendsChart').getContext('2d');
  
  // Real app would aggregate. Mocking for MVP display.
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const spendData = [1200, 1900, 1500, 2200, 1800, 2500, 2100, 2400, 2800, 2600, 3100, 2900];
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Monthly Spend',
        data: spendData,
        borderColor: '#EF4444', // Danger color for spend
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { border: { display: false } }
      }
    }
  });
}

function renderCategoryBreakdown(store) {
  const ctx = document.getElementById('categoryBreakdownChart').getContext('2d');
  
  // Aggregate expenses by category
  const expenses = store.getData('transactions').filter(t => t.type === 'expense');
  const catMap = {};
  expenses.forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  
  // Sort and prep data
  const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const labels = sortedCats.map(x => x[0]);
  const data = sortedCats.map(x => x[1]);
  
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#2E3A8C', '#4A5FD9', '#1A2254', '#F59E0B', '#10B981', '#EF4444', '#9333EA', '#14B8A6'
        ],
        borderWidth: 1,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, font: { size: 10 } } }
      }
    }
  });
}

function renderIncomeVsExpense(store) {
  const ctx = document.getElementById('incomeVsExpenseChart').getContext('2d');
  
  // Mock monthly data
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const incomeData = [4500, 4500, 4800, 4500, 5000, 4500];
  const expenseData = [3200, 2900, 3500, 3100, 4000, 3000];
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#10B981', // Success
          borderRadius: 4
        },
        {
          label: 'Expense',
          data: expenseData,
          backgroundColor: '#EF4444', // Danger
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
      },
      scales: {
        x: { grid: { display: false } },
        y: { border: { display: false } }
      }
    }
  });
}

function renderTopExpenses(store) {
  const expenses = store.getData('transactions')
    .filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
    
  const container = document.getElementById('top-expenses-list');
  
  if (expenses.length === 0) {
    container.innerHTML = '<p class="text-small">No expenses found.</p>';
    return;
  }
  
  let html = '';
  expenses.forEach(t => {
    const dateObj = new Date(t.date);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    html += `
      <div class="top-expense-row">
        <div>
          <div style="font-weight: 600;">${t.recipientName}</div>
          <div class="text-caption">${t.category} • ${dateStr}</div>
        </div>
        <div style="font-weight: 600; color: var(--color-text-heading);">
          -${formatCurrency(t.amount)}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}
