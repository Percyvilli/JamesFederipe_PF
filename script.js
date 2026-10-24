(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');

  let savedTheme = null;
  try { savedTheme = localStorage.getItem('jf-theme'); } catch { /* Storage can be disabled; use the system preference. */ }
  const preferredTheme = 'dark';

  function setTheme(theme) {
    root.dataset.theme = theme;
    themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    themeButton.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  }

  setTheme(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : preferredTheme);
  themeButton.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try { localStorage.setItem('jf-theme', nextTheme); } catch { /* The toggle still works for this page view. */ }
  });

  function closeMenu() {
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }

  menuButton.addEventListener('click', () => {
    const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(willOpen));
    nav.classList.toggle('is-open', willOpen);
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  const imageDialog = document.querySelector('.image-dialog');
  const previewImage = imageDialog.querySelector('.image-dialog-content');
  const previewCaption = imageDialog.querySelector('.image-dialog-caption');
  const previewCount = imageDialog.querySelector('.image-dialog-count');
  const closePreview = imageDialog.querySelector('.image-dialog-close');
  const previousPreview = imageDialog.querySelector('.image-dialog-previous');
  const nextPreview = imageDialog.querySelector('.image-dialog-next');
  let lastPreviewTrigger = null;
  let previewItems = [];
  let previewIndex = 0;
  function renderPreview() {
    const item = previewItems[previewIndex];
    previewImage.src = item.src;
    previewImage.alt = item.alt || item.caption || 'Portfolio image preview';
    previewImage.classList.toggle('is-blurred', Boolean(item.blurred));
    previewCaption.textContent = item.caption;
    previewCount.textContent = `${previewIndex + 1} / ${previewItems.length}`;
    previousPreview.disabled = previewItems.length < 2;
    nextPreview.disabled = previewItems.length < 2;
  }
  document.querySelectorAll('[data-image]').forEach((button) => {
    button.addEventListener('click', () => {
      lastPreviewTrigger = button;
      const gallery = button.dataset.gallery ? document.querySelector(button.dataset.gallery) : null;
      previewItems = gallery
        ? [...gallery.querySelectorAll('figure img')].map((img) => ({
            src: img.currentSrc || img.src,
            alt: img.alt,
            caption: img.closest('figure')?.querySelector('figcaption')?.textContent.trim() || button.dataset.caption || 'Portfolio image',
            blurred: img.closest('figure')?.dataset.blurred === 'true',
          }))
        : [{ src: button.dataset.image, alt: button.dataset.caption, caption: button.dataset.caption || 'Portfolio image' }];
      previewIndex = 0;
      previewImage.hidden = false;
      previousPreview.hidden = false;
      nextPreview.hidden = false;
      renderPreview();
      imageDialog.showModal();
      closePreview.focus();
    });
  });
  previousPreview.addEventListener('click', () => {
    previewIndex = (previewIndex - 1 + previewItems.length) % previewItems.length;
    renderPreview();
  });
  let touchStartX = null;
  imageDialog.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0]?.clientX ?? null; }, { passive: true });
  imageDialog.addEventListener('touchend', (event) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(delta) < 45 || previewItems.length < 2) return;
    previewIndex = (previewIndex + (delta < 0 ? 1 : -1) + previewItems.length) % previewItems.length;
    renderPreview();
  }, { passive: true });
  imageDialog.addEventListener('keydown', (event) => {
    if ((event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    previewIndex = (previewIndex + (event.key === 'ArrowRight' ? 1 : -1) + previewItems.length) % previewItems.length;
    renderPreview();
  });
  nextPreview.addEventListener('click', () => {
    previewIndex = (previewIndex + 1) % previewItems.length;
    renderPreview();
  });
  closePreview.addEventListener('click', () => imageDialog.close());
  imageDialog.addEventListener('click', (event) => {
    if (event.target === imageDialog) imageDialog.close();
  });
  imageDialog.addEventListener('close', () => lastPreviewTrigger?.focus());

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });

  const researchDialog = document.querySelector('#research-dialog');
  const researchOpen = document.querySelector('#research-open');
  const researchClose = researchDialog.querySelector('.research-dialog-close');
  researchOpen.addEventListener('click', () => {
    researchDialog.showModal();
    researchClose.focus();
  });
  researchClose.addEventListener('click', () => researchDialog.close());
  researchDialog.addEventListener('click', (event) => {
    if (event.target === researchDialog) researchDialog.close();
  });
  researchDialog.addEventListener('close', () => researchOpen.focus());

  const parkingVideo = document.querySelector('.project-video video');
  const parkingVideoFallback = document.querySelector('.video-unavailable-message');
  parkingVideo?.addEventListener('error', () => {
    parkingVideo.hidden = true;
    if (parkingVideoFallback) parkingVideoFallback.hidden = false;
  });

  const videos = [...document.querySelectorAll('video')];
  videos.forEach((video) => {
    video.addEventListener('play', () => {
      videos.forEach((other) => {
        if (other !== video && !other.paused) other.pause();
      });
    });
  });
  if ('IntersectionObserver' in window) {
    const videoVisibility = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if ((!entry.isIntersecting || entry.intersectionRatio < 0.2) && !entry.target.paused) entry.target.pause();
      });
    }, { threshold: [0, 0.2] });
    videos.forEach((video) => videoVisibility.observe(video));
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos.forEach((video) => video.pause());
  });

  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((link) => {
      if (link.getAttribute('href') === `#${visible.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.1, 0.5] });
  sections.forEach((section) => observer.observe(section));

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealTargets = document.querySelectorAll('.section-heading,.project-feature,.project-card,.skill-group,.timeline-item,.certificate-card,.research-panel');
    revealTargets.forEach((element) => element.classList.add('reveal'));
    const revealObserver = new IntersectionObserver((entries, reveal) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          reveal.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealTargets.forEach((element) => revealObserver.observe(element));
  }

  document.getElementById('year').textContent = String(new Date().getFullYear());
})();

