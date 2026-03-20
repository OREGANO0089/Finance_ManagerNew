/**
 * Layout.js
 * Injects the Sidebar and Header into the #app-layout container
 */

const navItems = [
  { name: 'Dashboard', icon: 'fas fa-chart-pie', link: 'index.html' },
  { name: 'Transactions', icon: 'fas fa-exchange-alt', link: 'transactions.html' },
  { name: 'Wallet', icon: 'fas fa-wallet', link: 'wallet.html' },
  { name: 'Goals', icon: 'fas fa-bullseye', link: 'goals.html' },
  { name: 'Analytics', icon: 'fas fa-chart-line', link: 'analytics.html' },
  { name: 'Reports', icon: 'fas fa-file-alt', link: 'reports.html' }
];

function renderLayout(activePage) {
  const container = document.getElementById('app-layout');
  if (!container) return; // Exit if no container

  // Create Sidebar
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  
  const sidebarHeader = document.createElement('div');
  sidebarHeader.className = 'sidebar-header';
  sidebarHeader.innerHTML = '<span><i class="fas fa-wallet"></i></span> JM Solutionss';
  sidebar.appendChild(sidebarHeader);

  const nav = document.createElement('nav');
  nav.className = 'sidebar-nav';
  
  navItems.forEach(item => {
    const a = document.createElement('a');
    a.href = item.link;
    const isActive = activePage === item.name || (activePage === 'index' && item.name === 'Dashboard');
    a.className = `nav-item ${isActive ? 'active' : ''}`;
    a.innerHTML = `<i class="${item.icon}"></i> <span>${item.name}</span>`;
    nav.appendChild(a);
  });
  
  sidebar.appendChild(nav);

  // Read User Data for Header
  const user = window.appStore.getUser();

  // Create Header inner HTML
  const headerHtml = `
    <header class="app-header">
      <div class="header-search">
        <i class="fas fa-search text-small" style="color: var(--color-text-body)"></i>
        <input type="text" placeholder="Search transactions, goals..." />
      </div>
      <div class="header-actions">
        <div class="header-icon"><i class="fas fa-moon"></i></div>
        <div class="header-icon"><i class="fas fa-bell"></i></div>
        <div class="header-icon"><i class="fas fa-cog"></i></div>
        <div class="user-profile">
          <div style="text-align: right;">
            <div style="font-weight: 600; font-size: 14px; color: var(--color-text-heading);">${user.name}</div>
            <div class="text-caption">Personal Account</div>
          </div>
          <div class="avatar">${user.avatar}</div>
        </div>
      </div>
    </header>
  `;

  // We need to wrap the existing innerHTML of app-layout which is the content-area
  const contentAreaHtml = container.innerHTML;
  
  container.innerHTML = '';
  container.appendChild(sidebar);
  
  const mainWrapper = document.createElement('main');
  mainWrapper.className = 'main-wrapper';
  
  // Need to inject HTML, so we use template
  const tempTemplate = document.createElement('div');
  tempTemplate.innerHTML = headerHtml;
  mainWrapper.appendChild(tempTemplate.firstElementChild);
  
  const contentArea = document.createElement('div');
  contentArea.className = 'content-area';
  contentArea.innerHTML = contentAreaHtml;
  mainWrapper.appendChild(contentArea);
  
  container.appendChild(mainWrapper);
  
  // Attach specific scripts to the page body if not present
  if(!document.querySelector('script[src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"]')) {
      const faLink = document.createElement('link');
      faLink.rel = 'stylesheet';
      faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(faLink);
  }
}
