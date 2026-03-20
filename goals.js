document.addEventListener('DOMContentLoaded', () => {
  renderLayout('Goals');
  initGoals();
});

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

function initGoals() {
  renderGoals();
  document.getElementById('goal-form').addEventListener('submit', handleGoalSubmit);
  document.getElementById('contribute-form').addEventListener('submit', handleContributeSubmit);
}

function renderGoals() {
  const store = window.appStore;
  const goals = store.getData('goals');
  const container = document.getElementById('goals-container');
  
  if (goals.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-text-body);"><i class="fas fa-bullseye" style="font-size: 48px; margin-bottom: 16px; opacity: 0.2;"></i><p>No goals set yet. Start saving!</p></div>';
    return;
  }
  
  let html = '';
  goals.forEach(g => {
    const perc = Math.min((g.currentAmount / g.targetAmount) * 100, 100).toFixed(1);
    const dateObj = new Date(g.targetDate);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Choose icon based on name (simple heuristic)
    let iconClass = 'fas fa-bullseye';
    const nameLower = g.name.toLowerCase();
    if(nameLower.includes('car')) iconClass = 'fas fa-car';
    else if(nameLower.includes('house') || nameLower.includes('home')) iconClass = 'fas fa-home';
    else if(nameLower.includes('vacation') || nameLower.includes('travel')) iconClass = 'fas fa-plane';
    else if(nameLower.includes('emergency')) iconClass = 'fas fa-medkit';
    
    html += `
      <div class="card goal-card">
        <div class="goal-actions">
          <button class="goal-action-btn" onclick="openEditGoalModal('${g.id}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="goal-action-btn delete" onclick="deleteGoal('${g.id}')" title="Delete"><i class="fas fa-trash-alt"></i></button>
        </div>
        <div class="goal-header">
          <div class="goal-icon"><i class="${iconClass}"></i></div>
        </div>
        <h3 style="margin-bottom: 4px;">${g.name}</h3>
        <p class="text-small" style="color: var(--color-text-body); margin-bottom: 16px;">Target: ${dateStr}</p>
        
        <div class="metric-value" style="font-size: 24px;">${formatCurrency(g.currentAmount)}</div>
        <p class="text-caption" style="color: var(--color-text-body); margin-bottom: 12px;">of ${formatCurrency(g.targetAmount)}</p>
        
        <div class="progress-bar-container" style="background: rgba(0,0,0,0.05); margin-bottom: 8px;">
          <div class="progress-bar-fill" style="width: ${perc}%; ${perc >= 100 ? 'background: var(--color-success);' : ''}"></div>
        </div>
        
        <div class="flex justify-between items-center">
          <span class="text-small" style="font-weight: 600; color: ${perc >= 100 ? 'var(--color-success)' : 'var(--color-primary)'};">${perc}%</span>
          <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" onclick="openContributeModal('${g.id}')">Add Funds</button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

window.openGoalModal = () => {
  document.getElementById('modal-title').textContent = 'Create New Goal';
  document.getElementById('goal-form').reset();
  document.getElementById('goal-id').value = '';
  document.getElementById('goal-initial').disabled = false; // can set initial on create
  document.getElementById('goal-modal').classList.add('active');
};

window.closeGoalModal = () => {
  document.getElementById('goal-modal').classList.remove('active');
};

window.openEditGoalModal = (id) => {
  const store = window.appStore;
  const g = store.getData('goals').find(x => x.id === id);
  if (!g) return;
  
  document.getElementById('modal-title').textContent = 'Edit Goal';
  document.getElementById('goal-id').value = g.id;
  document.getElementById('goal-name').value = g.name;
  document.getElementById('goal-target').value = g.targetAmount;
  
  // Disable initial deposit on edit since they should use "Add funds"
  document.getElementById('goal-initial').value = '';
  document.getElementById('goal-initial').disabled = true;
  
  const dateObj = new Date(g.targetDate);
  document.getElementById('goal-date').value = dateObj.toISOString().slice(0, 10);
  
  document.getElementById('goal-modal').classList.add('active');
};

window.deleteGoal = (id) => {
  if(confirm("Are you sure you want to delete this goal?")) {
    window.appStore.deleteItem('goals', id);
    renderGoals();
  }
};

function handleGoalSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('goal-id').value;
  const name = document.getElementById('goal-name').value;
  const target = parseFloat(document.getElementById('goal-target').value);
  const date = new Date(document.getElementById('goal-date').value).toISOString();
  
  if (id) {
    window.appStore.updateItem('goals', id, { name, targetAmount: target, targetDate: date });
  } else {
    const initial = parseFloat(document.getElementById('goal-initial').value) || 0;
    window.appStore.addItem('goals', { name, targetAmount: target, targetDate: date, currentAmount: initial });
  }
  
  closeGoalModal();
  renderGoals();
}

window.openContributeModal = (id) => {
  document.getElementById('contribute-form').reset();
  document.getElementById('contribute-goal-id').value = id;
  document.getElementById('contribute-modal').classList.add('active');
};

window.closeContributeModal = () => {
  document.getElementById('contribute-modal').classList.remove('active');
};

function handleContributeSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('contribute-goal-id').value;
  const amount = parseFloat(document.getElementById('contribute-amount').value);
  
  const store = window.appStore;
  const g = store.getData('goals').find(x => x.id === id);
  if(!g) return;
  
  store.updateItem('goals', id, { currentAmount: g.currentAmount + amount });
  
  closeContributeModal();
  renderGoals();
}
