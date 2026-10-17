(function () {
  'use strict';
  const root = document.documentElement;
  const themeButtons = document.querySelectorAll('.theme-toggle');
  function setTheme(theme) {
    root.dataset.theme = theme;
    themeButtons.forEach(function (button) {
      const next = theme === 'dark' ? 'Day' : 'Dark';
      button.setAttribute('aria-label', 'Switch to ' + next.toLowerCase() + ' theme');
      button.setAttribute('title', next + ' Theme');
      button.querySelector('.theme-symbol').textContent = theme === 'dark' ? '☀' : '☾';
      button.querySelector('.theme-label').textContent = next + ' Theme';
    });
    try { localStorage.setItem('shazin-theme', theme); } catch (_) { /* Works without browser storage, too. */ }
  }
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('shazin-theme') || 'dark'; } catch (_) {}
  setTheme(savedTheme === 'day' ? 'day' : 'dark');
  themeButtons.forEach(function (button) {
    button.addEventListener('click', function () { setTheme(root.dataset.theme === 'dark' ? 'day' : 'dark'); });
  });
  const welcome = document.getElementById('welcome');
  const website = document.getElementById('website');
  const continueButton = document.getElementById('continue');
  continueButton.addEventListener('click', function () {
    continueButton.disabled = true;
    website.hidden = false;
    document.body.classList.add('entered');
    welcome.classList.add('leaving');
    window.setTimeout(function () {
      welcome.hidden = true;
      document.getElementById('home').focus({ preventScroll: true });
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650);
  });
  const menuButton = document.getElementById('menu-toggle');
  const navigation = document.getElementById('navigation');
  function closeMenu() {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
  }
  menuButton.addEventListener('click', function () {
    const open = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  navigation.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') { closeMenu(); } });
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (section) { revealObserver.observe(section); });
    const activeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navigation.querySelectorAll('a').forEach(function (link) {
          const active = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    document.querySelectorAll('main section[id]').forEach(function (section) { activeObserver.observe(section); });
  } else { document.querySelectorAll('.reveal').forEach(function (section) { section.classList.add('visible'); }); }
})();
