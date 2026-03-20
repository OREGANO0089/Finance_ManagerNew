// User data model
const defaultUser = {
  id: "u_1",
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "JD",
  currency: "USD",
  monthlySpendingLimit: 5000,
  createdAt: new Date().toISOString()
};

// Initial state
const defaultState = {
  user: defaultUser,
  transactions: [
    {
      id: "t_1",
      type: "income",
      amount: 4500,
      category: "Salary",
      recipientName: "Tech Corp Inc.",
      status: "completed",
      date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
      notes: "Monthly salary",
      createdAt: new Date().toISOString()
    },
    {
      id: "t_2",
      type: "expense",
      amount: 120,
      category: "Food & Grocery",
      recipientName: "Whole Foods",
      status: "completed",
      date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
      notes: "Weekly groceries",
      createdAt: new Date().toISOString()
    },
    {
      id: "t_3",
      type: "expense",
      amount: 60,
      category: "Entertainment",
      recipientName: "Netflix",
      status: "completed",
      date: new Date().toISOString(),
      notes: "Monthly subscription",
      createdAt: new Date().toISOString()
    },
    {
      id: "t_4",
      type: "expense",
      amount: 1500,
      category: "Bills & Utilities",
      recipientName: "City Apartments",
      status: "pending",
      date: new Date().toISOString(),
      notes: "Rent for current month",
      createdAt: new Date().toISOString()
    }
  ],
  cards: [
    {
      id: "c_1",
      cardNumber: "**** **** **** 4242",
      cardholderName: "John Doe",
      expiryDate: "12/25",
      cardType: "visa",
      nickname: "Main Credit",
      createdAt: new Date().toISOString()
    }
  ],
  goals: [
    {
      id: "g_1",
      name: "Emergency Fund",
      targetAmount: 10000,
      currentAmount: 4500,
      targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      createdAt: new Date().toISOString()
    }
  ],
  budgets: [
    {
      id: "b_1",
      category: "Food & Grocery",
      allocatedAmount: 600,
      spentAmount: 120,
      month: new Date().toISOString().slice(0, 7) // YYYY-MM
    },
    {
      id: "b_2",
      category: "Entertainment",
      allocatedAmount: 200,
      spentAmount: 60,
      month: new Date().toISOString().slice(0, 7)
    }
  ]
};

// Store Wrapper
class Store {
  constructor() {
    this.storageKey = "jmsolutionss_finance_data";
    this.init();
  }

  init() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      this.data = JSON.parse(JSON.stringify(defaultState)); // Deep copy
      this.save();
    } else {
      this.data = JSON.parse(stored);
    }
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  // Generic Getters/Setters
  getData(key) {
    return this.data[key];
  }

  setData(key, value) {
    this.data[key] = value;
    this.save();
  }

  // Collections operations
  addItem(collection, item) {
    item.id = `${collection.charAt(0)}_${Date.now()}`;
    item.createdAt = new Date().toISOString();
    this.data[collection].unshift(item); // Add to beginning
    this.save();
    return item;
  }

  updateItem(collection, id, updates) {
    const index = this.data[collection].findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[collection][index] = { ...this.data[collection][index], ...updates };
      this.save();
      return true;
    }
    return false;
  }

  deleteItem(collection, id) {
    this.data[collection] = this.data[collection].filter(item => item.id !== id);
    this.save();
  }

  // Specialized Getters
  getUser() {
    return this.data.user;
  }
  
  updateUser(updates) {
    this.data.user = { ...this.data.user, ...updates };
    this.save();
  }

  // Dashboard Aggregations
  getDashboardMetrics() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Previous month info
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let totalBalance = 0;
    
    let currentIncome = 0;
    let currentExpense = 0;
    
    let prevIncome = 0;
    let prevExpense = 0;

    this.data.transactions.forEach(t => {
      const tDate = new Date(t.date);
      const tMonth = tDate.getMonth();
      const tYear = tDate.getFullYear();

      // Ensure positive/negative for total balance regardless of time
      if (t.type === 'income') totalBalance += t.amount;
      else if (t.type === 'expense') totalBalance -= t.amount;

      // Current month stats
      if (tMonth === currentMonth && tYear === currentYear) {
        if (t.type === 'income') currentIncome += t.amount;
        else if (t.type === 'expense') currentExpense += t.amount;
      }

      // Previous month stats
      if (tMonth === prevMonth && tYear === prevYear) {
        if (t.type === 'income') prevIncome += t.amount;
        else if (t.type === 'expense') prevExpense += t.amount;
      }
    });

    const currentSavings = currentIncome - currentExpense;
    const prevSavings = prevIncome - prevExpense;

    const calcChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return (((curr - prev) / prev) * 100).toFixed(1);
    };

    return {
      totalBalance,
      income: {
        total: currentIncome,
        change: calcChange(currentIncome, prevIncome)
      },
      expense: {
        total: currentExpense,
        change: calcChange(currentExpense, prevExpense)
      },
      savings: {
        total: currentSavings,
        change: calcChange(currentSavings, prevSavings)
      }
    };
  }
}

// Global instance
window.appStore = new Store();
