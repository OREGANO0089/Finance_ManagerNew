document.addEventListener('DOMContentLoaded', () => {
  renderLayout('Wallet');
  initWallet();
});

function initWallet() {
  renderCards();
  document.getElementById('card-form').addEventListener('submit', handleFormSubmit);
}

function renderCards() {
  const store = window.appStore;
  const cards = store.getData('cards');
  const container = document.getElementById('cards-container');
  
  if (cards.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-text-body);"><i class="fas fa-wallet" style="font-size: 48px; margin-bottom: 16px; opacity: 0.2;"></i><p>No cards added yet.</p></div>';
    return;
  }
  
  let html = '';
  cards.forEach(c => {
    // Determine logo
    let logoClass = 'fab fa-cc-visa';
    if (c.cardType === 'mastercard') logoClass = 'fab fa-cc-mastercard';
    else if (c.cardType === 'amex') logoClass = 'fab fa-cc-amex';
    else if (c.cardType === 'discover') logoClass = 'fab fa-cc-discover';
    
    // Masked number just taking last 4
    const displayNum = `**** **** **** ${c.cardNumber.slice(-4)}`;
    
    html += `
      <div class="card-preview">
        <div class="card-preview-actions">
          <button class="card-preview-btn" onclick="openEditModal('${c.id}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="card-preview-btn" onclick="deleteCard('${c.id}')" title="Delete"><i class="fas fa-trash-alt"></i></button>
        </div>
        <div class="flex justify-between items-center mb-4" style="position: relative; z-index: 2;">
          <i class="${logoClass}" style="font-size: 32px;"></i>
          <i class="fas fa-wifi" style="transform: rotate(90deg); font-size: 20px;"></i>
        </div>
        <div style="font-size: 22px; letter-spacing: 2px; margin-bottom: 24px; margin-top: 16px; position: relative; z-index: 2; font-family: monospace;">
          ${displayNum}
        </div>
        <div class="flex justify-between items-center text-small" style="position: relative; z-index: 2; opacity: 0.9;">
          <div>
            <div style="font-size: 10px; text-transform: uppercase;">Cardholder Name</div>
            <div style="font-weight: 600; font-size: 14px; text-transform: uppercase;">${c.cardholderName}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; text-transform: uppercase;">Expiry</div>
            <div style="font-weight: 600; font-size: 14px;">${c.expiryDate}</div>
          </div>
        </div>
        ${c.nickname ? `<div style="position:absolute; bottom: 16px; left: 50%; transform: translateX(-50%); font-size: 10px; opacity: 0.6; text-transform: uppercase; letter-spacing: 1px;">${c.nickname}</div>` : ''}
      </div>
    `;
  });
  
  // Add a "placeholder" card to add
  html += `
    <div class="card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; cursor: pointer; border: 2px dashed var(--color-border); box-shadow: none;" onclick="window.openCardModal()">
      <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(46, 58, 140, 0.1); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px;"><i class="fas fa-plus"></i></div>
      <div style="font-weight: 600; color: var(--color-primary);">Add New Card</div>
    </div>
  `;
  
  container.innerHTML = html;
}

window.openCardModal = () => {
  document.getElementById('modal-title').textContent = 'Add New Card';
  document.getElementById('card-form').reset();
  document.getElementById('card-id').value = '';
  document.getElementById('card-modal').classList.add('active');
};

window.closeCardModal = () => {
  document.getElementById('card-modal').classList.remove('active');
};

window.openEditModal = (id) => {
  const store = window.appStore;
  const c = store.getData('cards').find(c => c.id === id);
  if (!c) return;
  
  document.getElementById('modal-title').textContent = 'Edit Card';
  document.getElementById('card-id').value = c.id;
  document.getElementById('card-name').value = c.cardholderName;
  document.getElementById('card-number').value = `**** **** **** ${c.cardNumber.slice(-4)}`;
  document.getElementById('card-expiry').value = c.expiryDate;
  document.getElementById('card-type').value = c.cardType;
  document.getElementById('card-nickname').value = c.nickname || '';
  
  document.getElementById('card-modal').classList.add('active');
};

window.deleteCard = (id) => {
  if (confirm("Are you sure you want to remove this card?")) {
    window.appStore.deleteItem('cards', id);
    renderCards();
  }
};

function handleFormSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('card-id').value;
  let rawNumber = document.getElementById('card-number').value.replace(/\D/g, '');
  if (rawNumber.length < 4) {
      if(id) { // Editing, might just say **** 4242
         const existingCard = window.appStore.getData('cards').find(c => c.id === id);
         rawNumber = existingCard.cardNumber;
      } else {
         alert("Invalid card number");
         return;
      }
  }

  const newData = {
    cardholderName: document.getElementById('card-name').value,
    cardNumber: `**** **** **** ${rawNumber.slice(-4)}`, // Store only masked directly
    expiryDate: document.getElementById('card-expiry').value,
    cardType: document.getElementById('card-type').value,
    nickname: document.getElementById('card-nickname').value
  };
  
  if (id) {
    window.appStore.updateItem('cards', id, newData);
  } else {
    window.appStore.addItem('cards', newData);
  }
  
  closeCardModal();
  renderCards();
}
