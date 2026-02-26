/* ─── Global JS for Teh Ais ──────────────────────────── */

// Theme Toggle
function toggleTheme() {
  fetch('/api/toggle-theme', { method: 'POST' })
    .then((r) => r.json())
    .then((data) => {
      document.documentElement.setAttribute('data-theme', data.theme);
      updateThemeIcons(data.theme);
    });
}

function updateThemeIcons(theme) {
  document.querySelectorAll('.theme-icon').forEach((el) => {
    el.textContent = theme === 'dark' ? '☀️' : '🌙';
  });
  document.querySelectorAll('.theme-label').forEach((el) => {
    el.textContent = theme === 'dark' ? 'Light' : 'Dark';
  });
  document.querySelectorAll('.theme-toggle-label').forEach((el) => {
    el.textContent = theme === 'dark' ? 'Switch to Light' : 'Switch to Dark';
  });
}

// Mobile sidebar toggle
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
}

function closeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Set initial theme from data attribute
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  updateThemeIcons(theme);

  // Click overlay to close sidebar
  const overlay = document.querySelector('.sidebar-overlay');
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // Tab functionality
  document.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      const tabGroup = tab.closest('.tab-group');
      const contentGroup = tabGroup.nextElementSibling;

      // Update tabs
      tabGroup.querySelectorAll('[data-tab]').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Update content
      if (contentGroup) {
        contentGroup.querySelectorAll('.tab-content').forEach((c) => {
          c.classList.remove('active');
          if (c.dataset.tabContent === target) c.classList.add('active');
        });
      }
    });
  });
});

// Search with debounce
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Format Firestore timestamp
function formatDate(ts) {
  if (!ts) return 'TBD';
  let date;
  if (ts._seconds) {
    date = new Date(ts._seconds * 1000);
  } else if (ts.seconds) {
    date = new Date(ts.seconds * 1000);
  } else {
    date = new Date(ts);
  }
  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
