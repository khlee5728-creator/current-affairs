// Mobile hamburger toggle
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      hamburger.textContent = mobileNav.classList.contains('open') ? '\u2715' : '\u2630';
    });
  }

  // Expression card toggle
  document.querySelectorAll('.expr-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.expr-card').classList.toggle('open');
    });
  });

  // Expand All / Collapse All
  const expandBtn = document.getElementById('expand-all');
  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      const cards = document.querySelectorAll('.expr-card');
      const allOpen = [...cards].every(c => c.classList.contains('open'));
      cards.forEach(c => {
        if (allOpen) c.classList.remove('open');
        else c.classList.add('open');
      });
      expandBtn.textContent = allOpen ? 'Expand All' : 'Collapse All';
    });
  }

  // Weeks dropdown toggle
  const dropdownTrigger = document.querySelector('.nav-dropdown-trigger');
  const dropdown = document.querySelector('.nav-dropdown');
  if (dropdownTrigger && dropdown) {
    dropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
    dropdown.querySelector('.nav-dropdown-menu')?.addEventListener('click', (e) => e.stopPropagation());
  }

  // Sentence component color toggle
  const scToggle = document.querySelector('.sc-toggle-btn');
  if (scToggle) {
    scToggle.addEventListener('click', () => {
      document.body.classList.toggle('sc-off');
      scToggle.textContent = document.body.classList.contains('sc-off') ? 'Show Colors' : 'Hide Colors';
    });
  }

  // PDF save
  window.printPDF = function() {
    const cards = document.querySelectorAll('.expr-card');
    const wasOpen = [...cards].map(c => c.classList.contains('open'));
    cards.forEach(c => c.classList.add('open'));
    window.print();
    cards.forEach((c, i) => { if (!wasOpen[i]) c.classList.remove('open'); });
  };

  // Active nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) link.classList.add('active');
  });
});
