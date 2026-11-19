import { salesIssues, validHttps } from './config-validation.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const menu = $('.menu-toggle');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
  $('#navigation').classList.toggle('open', open);
});
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Otwórz menu');
  $('#navigation').classList.remove('open');
}
$$('#navigation a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

let returnFocus;
function showDialog(dialog) {
  returnFocus = document.activeElement;
  dialog.showModal();
  document.body.classList.add('modal-open');
}
$$('dialog').forEach(dialog => {
  dialog.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    returnFocus?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', e => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });
});
const pages = [
  { number: 2, title: 'Twoja mapa pracy — spis treści' },
  { number: 5, title: 'Równania z ułamkami — przykład z rozwiązaniem' },
  { number: 6, title: 'Równania z ułamkami — ćwiczenia' }
];
let pageIndex = 0;
function updatePage() {
  const page = pages[pageIndex];
  $('#preview-image').src = `assets/page-${page.number}.webp`;
  $('#preview-image').alt = `Strona ${page.number} e-booka: ${page.title}`;
  $('#preview-title').textContent = page.title;
  $('#preview-position').textContent = `Podgląd ${pageIndex + 1} z ${pages.length} · strona ${page.number}`;
  $('#previous-page').disabled = pageIndex === 0;
  $('#next-page').disabled = pageIndex === pages.length - 1;
  $('#preview-dialog').scrollTop = 0;
}
$$('[data-preview]').forEach(button => button.addEventListener('click', () => {
  pageIndex = pages.findIndex(p => p.number === Number(button.dataset.preview));
  updatePage();
  showDialog($('#preview-dialog'));
}));
function changePage(delta) {
  pageIndex = Math.max(0, Math.min(pages.length - 1, pageIndex + delta));
  updatePage();
}
$('#previous-page').addEventListener('click', () => changePage(-1));
$('#next-page').addEventListener('click', () => changePage(1));
$('#preview-dialog').addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { e.preventDefault(); changePage(1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); changePage(-1); }
});
function information(title, text) {
  $('#info-title').textContent = title;
  $('#info-text').textContent = text;
  showDialog($('#info-dialog'));
}
let config = {};
let enabled = false;
const demoText = 'To wersja demonstracyjna strony. Cena i bezpieczny koszyk zostaną udostępnione przed rozpoczęciem sprzedaży. Nie pobrano płatności ani nie złożono zamówienia.';
$$('[data-buy]').forEach(button => button.addEventListener('click', () => {
  if (enabled) window.location.assign(config.checkoutUrl);
  else information('Sprzedaż jeszcze nie ruszyła', demoText);
}));
const legal = {
  terms: ['Regulamin sprzedaży', 'termsUrl'],
  privacy: ['Polityka prywatności', 'privacyUrl'],
  consumer: ['Informacje o prawach konsumenta', 'consumerRightsUrl']
};
$$('[data-legal]').forEach(button => button.addEventListener('click', () => {
  const [title, key] = legal[button.dataset.legal];
  if (validHttps(config[key])) window.location.assign(config[key]);
  else information(title, 'Dokument do uzupełnienia przez sprzedawcę przed uruchomieniem sprzedaży. To miejsce na rzeczywiste warunki i informacje — obecnie nie można złożyć zamówienia.');
}));
try {
  const response = await fetch('./sales-config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Konfiguracja niedostępna');
  config = await response.json();
  enabled = config.salesEnabled === true && salesIssues(config).length === 0;
  if (Number.isFinite(config.pricePLN) && config.pricePLN > 0) {
    $('#price').textContent = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(config.pricePLN);
    $('#price-note').textContent = enabled ? 'Cena za e-book PDF' : 'Cena oferty · sprzedaż jeszcze nieaktywna';
  }
  if (config.sellerName?.trim()) $('#seller').textContent = `${config.sellerName} ${config.sellerDetails || ''}`;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contactEmail || '')) {
    const link = document.createElement('a');
    link.href = `mailto:${config.contactEmail}`;
    link.textContent = config.contactEmail;
    $('#contact').replaceChildren('Kontakt: ', link);
  }
  if (enabled) {
    $('#demo-bar').hidden = true;
    $('#footer-demo').hidden = true;
    $('#purchase-note').textContent = 'Przejdziesz do zewnętrznej strony płatności.';
    $('#delivery').textContent = config.deliveryDescription;
    $('#faq-delivery').textContent = config.deliveryDescription;
  }
} catch {
  // Fail closed: a missing configuration must never start a purchase.
  enabled = false;
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  document.documentElement.classList.add('motion-ready');
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.remove('pending');
      revealObserver.unobserve(entry.target);
    }
  }), { threshold: 0.06 });
  $$('.reveal').forEach(el => {
    if (el.getBoundingClientRect().top > window.innerHeight) el.classList.add('pending');
    revealObserver.observe(el);
  });
}
let scrollQueued = false;
function updateSticky() {
  const offer = $('#oferta').getBoundingClientRect();
  const footer = $('.footer').getBoundingClientRect();
  $('#mobile-buy').classList.toggle('visible', window.scrollY > 650 && !(offer.top < innerHeight && offer.bottom > 0) && footer.top > innerHeight);
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateSticky); }
}, { passive: true });
window.addEventListener('resize', updateSticky);
updateSticky();
