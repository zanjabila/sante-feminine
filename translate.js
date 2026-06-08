// ─── SANTÉ FÉMININE — SÉLECTEUR DE LANGUE ───

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'عربي', flag: '🇸🇦' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
];

// ─── GOOGLE TRANSLATE INIT ───
window.googleTranslateElementInit = function() {
  new google.translate.TranslateElement({
    pageLanguage: 'fr',
    includedLanguages: 'fr,nl,en,ar,pt',
    autoDisplay: false,
  }, 'google_translate_element');
};

function loadGoogleTranslate() {
  const div = document.createElement('div');
  div.id = 'google_translate_element';
  div.style.display = 'none';
  document.body.appendChild(div);

  const script = document.createElement('script');
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  document.head.appendChild(script);
}

// ─── CHANGER LA LANGUE ───
function setLanguage(code) {
  // Fermer le dropdown
  const dd = document.getElementById('langDropdown');
  if (dd) dd.style.display = 'none';

  // Mettre à jour le bouton
  const lang = LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
  const btn = document.getElementById('langBtn');
  if (btn) btn.innerHTML = `${lang.flag} ${lang.label} ▾`;

  // Sauvegarder
  localStorage.setItem('sf_lang', code);

  if (code === 'fr') {
    // Revenir au français — recharger la page sans traduction
    const url = window.location.href;
    if (url.includes('googtrans')) {
      window.location.href = url.replace(/#googtrans\([^)]+\)/, '');
    } else {
      // Utiliser le cookie Google Translate
      document.cookie = 'googtrans=/fr/fr; path=/';
      document.cookie = `googtrans=/fr/fr; domain=.github.io; path=/`;
      location.reload();
    }
    return;
  }

  // Appliquer via cookie (méthode la plus fiable)
  document.cookie = `googtrans=/fr/${code}; path=/`;
  document.cookie = `googtrans=/fr/${code}; domain=.github.io; path=/`;

  // Essayer aussi via le select Google Translate
  setTimeout(() => {
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event('change'));
    } else {
      // Si le widget n'est pas encore prêt, recharger
      location.reload();
    }
  }, 800);
}

// ─── TOGGLE DROPDOWN ───
function toggleLangDropdown() {
  const dd = document.getElementById('langDropdown');
  if (dd) dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
}

// Fermer si clic en dehors
document.addEventListener('click', e => {
  if (!e.target.closest('.lang-selector')) {
    const dd = document.getElementById('langDropdown');
    if (dd) dd.style.display = 'none';
  }
});

// ─── INJECTER LE SÉLECTEUR DANS LA NAV ───
function injectLangSelector() {
  // Ne pas injecter si déjà présent (page d'accueil l'a en dur)
  if (document.getElementById('langBtn')) {
    // Juste initialiser
    applyCurrentLang();
    return;
  }

  const nav = document.querySelector('nav');
  if (!nav) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'lang-selector';
  wrapper.style.cssText = 'position:relative;margin-left:auto;';
  wrapper.innerHTML = `
    <button id="langBtn" onclick="toggleLangDropdown()" style="
      display:flex;align-items:center;gap:6px;padding:7px 14px;
      border-radius:20px;border:1px solid var(--cream-dark);
      background:var(--white);font-size:13px;
      font-family:'DM Sans',sans-serif;color:var(--text-mid);
      cursor:pointer;transition:all .2s;white-space:nowrap;
    ">🇫🇷 Français ▾</button>
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

  // Insérer avant le nav-back s'il existe
  const navBack = nav.querySelector('.nav-back, .nav-logout');
  if (navBack) nav.insertBefore(wrapper, navBack);
  else nav.appendChild(wrapper);

  applyCurrentLang();
}

// ─── APPLIQUER LA LANGUE SAUVEGARDÉE ───
function applyCurrentLang() {
  const saved = localStorage.getItem('sf_lang') || 'fr';
  const lang = LANGUAGES.find(l => l.code === saved) || LANGUAGES[0];
  const btn = document.getElementById('langBtn');
  if (btn) btn.innerHTML = `${lang.flag} ${lang.label} ▾`;
}

// ─── INIT ───
window.addEventListener('DOMContentLoaded', () => {
  loadGoogleTranslate();
  setTimeout(injectLangSelector, 300);
});
