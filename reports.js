document.addEventListener('DOMContentLoaded', () => {
  renderLayout('Reports');
  initReports();
});

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

function initReports() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Populate dropdowns
  const monthSelect = document.getElementById('report-month');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  months.forEach((m, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = m;
    if (idx === currentMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  });
  
  const yearSelect1 = document.getElementById('report-year-monthly');
  const yearSelect2 = document.getElementById('report-year-yearly');
  for (let y = currentYear - 5; y <= currentYear; y++) {
    const opt1 = document.createElement('option');
    opt1.value = y;
    opt1.textContent = y;
    if (y === currentYear) opt1.selected = true;
    yearSelect1.appendChild(opt1);
    
    const opt2 = document.createElement('option');
    opt2.value = y;
    opt2.textContent = y;
    if (y === currentYear) opt2.selected = true;
    yearSelect2.appendChild(opt2);
  }
  
  // Event listeners
  monthSelect.addEventListener('change', updateMonthlyReport);
  yearSelect1.addEventListener('change', updateMonthlyReport);
  yearSelect2.addEventListener('change', updateYearlyReport);
  
  // Initial renders
  updateMonthlyReport();
  updateYearlyReport();
}

function updateMonthlyReport() {
  const store = window.appStore;
  const monthTarget = parseInt(document.getElementById('report-month').value);
  const yearTarget = parseInt(document.getElementById('report-year-monthly').value);
  
  const txs = store.getData('transactions').filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === monthTarget && d.getFullYear() === yearTarget;
  });
  
  let totalIn = 0;
  let totalEx = 0;
  let cnt = txs.length;
  const catMap = {};
  
  txs.forEach(t => {
    if (t.type === 'income') totalIn += t.amount;
    else {
      totalEx += t.amount;
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    }
  });
  
  let net = totalIn - totalEx;
  
  document.getElementById('monthly-in').textContent = formatCurrency(totalIn);
  document.getElementById('monthly-ex').textContent = formatCurrency(totalEx);
  document.getElementById('monthly-net').textContent = formatCurrency(net);
  document.getElementById('monthly-tx-count').textContent = cnt;
  
  // Top category
  const sortedCats = Object.entries(catMap).sort((a,b) => b[1] - a[1]);
  if (sortedCats.length > 0) {
    document.getElementById('monthly-top-cat').textContent = sortedCats[0][0];
    document.getElementById('monthly-top-cat-val').textContent = formatCurrency(sortedCats[0][1]);
  } else {
    document.getElementById('monthly-top-cat').textContent = 'N/A';
    document.getElementById('monthly-top-cat-val').textContent = '$0.00';
  }
}

function updateYearlyReport() {
  const store = window.appStore;
  const yearTarget = parseInt(document.getElementById('report-year-yearly').value);
  
  const txs = store.getData('transactions').filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === yearTarget;
  });
  
  let totalIn = 0;
  let totalEx = 0;
  
  txs.forEach(t => {
    if (t.type === 'income') totalIn += t.amount;
    else totalEx += t.amount;
  });
  
  let net = totalIn - totalEx;
  let rate = totalIn > 0 ? ((net / totalIn) * 100).toFixed(1) : 0;
  
  document.getElementById('yearly-in').textContent = formatCurrency(totalIn);
  document.getElementById('yearly-ex').textContent = formatCurrency(totalEx);
  document.getElementById('yearly-net').textContent = formatCurrency(net);
  document.getElementById('yearly-rate').textContent = `${rate}%`;
}

window.exportCSV = () => {
  const store = window.appStore;
  let txs = store.getData('transactions');
  const range = document.getElementById('export-range').value;
  
  const now = new Date();
  
  if (range === 'this-month') {
    txs = txs.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  } else if (range === 'last-month') {
    let m = now.getMonth() - 1;
    let y = now.getFullYear();
    if(m < 0) { m = 11; y--; }
    txs = txs.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === m && d.getFullYear() === y;
    });
  } else if (range === 'this-year') {
    txs = txs.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear();
    });
  }
  
  if (txs.length === 0) {
    alert("No transactions found for the selected range.");
    return;
  }
  
  // Headers
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "ID,Date,Type,Category,Recipient/Source,Status,Amount,Notes\n";
  
  txs.forEach(t => {
    const dateStr = new Date(t.date).toISOString().split('T')[0];
    const notes = t.notes ? t.notes.replace(/,/g, '') : '';
    const name = t.recipientName.replace(/,/g, '');
    const amount = t.type === 'income' ? t.amount : -t.amount;
    
    csvContent += `${t.id},${dateStr},${t.type},${t.category},${name},${t.status},${amount},${notes}\n`;
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `jmsolutionss_transactions_${range}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
