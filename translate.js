// ─── SANTÉ FÉMININE — TRADUCTION ───
// Méthode : URL Google Translate (100% fiable)

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'عربي', flag: '🇸🇦' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
];

const BASE_URL = 'https://zanjabila.github.io/sante-feminine/';

// Obtenir la page courante
function getCurrentPage() {
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';
  return page || 'index.html';
}

// Construire l'URL traduite
function getTranslatedURL(langCode) {
  if (langCode === 'fr') return BASE_URL + getCurrentPage();
  const pageUrl = BASE_URL + getCurrentPage();
  return `https://translate.google.com/translate?sl=fr&tl=${langCode}&u=${encodeURIComponent(pageUrl)}`;
}

// Changer la langue
function setLanguage(code) {
  const dd = document.getElementById('langDropdown');
  if (dd) dd.style.display = 'none';

  localStorage.setItem('sf_lang', code);

  // Rediriger vers la page traduite
  window.location.href = getTranslatedURL(code);
}

function toggleLangDropdown() {
  const dd = document.getElementById('langDropdown');
  if (dd) dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
}

document.addEventListener('click', e => {
  if (!e.target.closest('.lang-selector')) {
    const dd = document.getElementById('langDropdown');
    if (dd) dd.style.display = 'none';
  }
});

function buildDropdownHTML() {
  return `
    <button id="langBtn" onclick="toggleLangDropdown()" style="
      display:flex;align-items:center;gap:6px;padding:7px 14px;
      border-radius:20px;border:1px solid var(--cream-dark);
      background:var(--white);font-size:13px;
      font-family:'DM Sans',sans-serif;color:var(--text-mid);
      cursor:pointer;white-space:nowrap;
    ">🌐 Langue ▾</button>
    <div id="langDropdown" style="
      display:none;position:absolute;top:calc(100% + 6px);right:0;
      background:var(--white);border:1px solid var(--cream-dark);
      border-radius:14px;box-shadow:0 8px 32px rgba(44,36,32,.12);
      overflow:hidden;z-index:9999;min-width:160px;
    ">
      ${LANGUAGES.map(l => `
        <button onclick="setLanguage('${l.code}')" style="
          display:flex;align-items:center;gap:10px;width:100%;
          padding:10px 16px;border:none;background:none;
          font-size:13px;font-family:'DM Sans',sans-serif;
          color:var(--text-dark);cursor:pointer;text-align:left;
        " onmouseover="this.style.background='var(--cream)'"
           onmouseout="this.style.background='none'">
          <span style="font-size:18px">${l.flag}</span> ${l.label}
        </button>
      `).join('')}
    </div>
  `;
}

function injectUI() {
  // Ne pas injecter si déjà présent (page d'accueil)
  if (document.getElementById('langBtn')) return;

  const nav = document.querySelector('nav');
  if (!nav) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'lang-selector';
  wrapper.style.cssText = 'position:relative;flex-shrink:0;';
  wrapper.innerHTML = buildDropdownHTML();

  const navBack = nav.querySelector('.nav-back, .nav-logout');
  if (navBack) nav.insertBefore(wrapper, navBack);
  else nav.appendChild(wrapper);
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(injectUI, 300);
});
