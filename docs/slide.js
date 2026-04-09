/**
 * Slide Engine for Current English course
 * Converts week pages into a slide presentation format.
 * Keyboard: ← → arrows, touch: swipe left/right
 */
document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide');
  if (!slides.length) return;

  document.body.classList.add('slide-mode');
  let current = 0;
  const total = slides.length;

  // Read initial slide from URL hash
  const hashMatch = window.location.hash.match(/slide=(\d+)/);
  if (hashMatch) {
    const idx = parseInt(hashMatch[1]) - 1;
    if (idx >= 0 && idx < total) current = idx;
  }

  // Build nav bar
  const nav = document.createElement('div');
  nav.className = 'slide-nav';
  nav.innerHTML = `
    <button class="slide-prev" title="Previous (←)">&#9664;</button>
    <span class="slide-indicator">${current + 1} / ${total}</span>
    <span class="slide-label"></span>
    <div class="slide-progress-bar"><div class="slide-progress-fill"></div></div>
    <button class="slide-next" title="Next (→)">&#9654;</button>
  `;
  document.body.appendChild(nav);

  const prevBtn = nav.querySelector('.slide-prev');
  const nextBtn = nav.querySelector('.slide-next');
  const indicator = nav.querySelector('.slide-indicator');
  const label = nav.querySelector('.slide-label');
  const progressFill = nav.querySelector('.slide-progress-fill');

  function goTo(idx) {
    if (idx < 0 || idx >= total) return;
    slides.forEach(s => s.classList.remove('active'));
    current = idx;
    slides[current].classList.add('active');
    update();
    window.scrollTo(0, 0);
    window.location.hash = `slide=${current + 1}`;
  }

  function update() {
    indicator.textContent = `${current + 1} / ${total}`;
    label.textContent = slides[current].dataset.label || '';
    progressFill.style.width = `${((current + 1) / total) * 100}%`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Don't navigate if user is typing in an input/select
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    if (e.key === 'End') { e.preventDefault(); goTo(total - 1); }
  });

  // Touch swipe
  let touchStartX = 0;
  let touchStartY = 0;
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goTo(current + 1);
      else goTo(current - 1);
    }
  }, { passive: true });

  // TOC click navigation
  document.querySelectorAll('.slide-toc li[data-goto]').forEach(li => {
    li.addEventListener('click', () => goTo(parseInt(li.dataset.goto)));
  });

  // PDF: show all slides, then restore
  const origPrintPDF = window.printPDF;
  window.printPDF = function() {
    slides.forEach(s => s.classList.add('active'));
    window.print();
    slides.forEach((s, i) => {
      if (i !== current) s.classList.remove('active');
    });
  };

  // Initialize
  goTo(current);
});
