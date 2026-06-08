// ─── SANTÉ FÉMININE — SÉLECTEUR DE LANGUE ───
// Langues disponibles
const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'عربي', flag: '🇸🇦' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
];

// Injecter Google Translate
function loadGoogleTranslate() {
  window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
      pageLanguage: 'fr',
      includedLanguages: 'fr,nl,en,ar,pt',
      autoDisplay: false,
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
  };
  const script = document.createElement('script');
  script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  document.head.appendChild(script);
}

// Changer la langue
function setLanguage(langCode) {
  const select = document.querySelector('.goog-te-combo');
  if (select) {
    select.value = langCode;
    select.dispatchEvent(new Event('change'));
  }
  localStorage.setItem('sf_lang', langCode);
  updateLangBtn(langCode);
  document.getElementById('langDropdown').style.display = 'none';
}

// Mettre à jour le bouton actif
function updateLangBtn(code) {
  const lang = LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
  const btn = document.getElementById('langBtn');
  if (btn) btn.innerHTML = `${lang.flag} ${lang.label} ▾`;
}

// Afficher/cacher le dropdown
function toggleLangDropdown() {
  const d = document.getElementById('langDropdown');
  d.style.display = d.style.display === 'block' ? 'none' : 'block';
}

// Fermer si clic en dehors
document.addEventListener('click', e => {
  if (!e.target.closest('.lang-selector')) {
    const d = document.getElementById('langDropdown');
    if (d) d.style.display = 'none';
  }
});

// Créer le sélecteur de langue dans la nav
function injectLangSelector() {
  // Conteneur Google Translate caché
  const hidden = document.createElement('div');
  hidden.id = 'google_translate_element';
  hidden.style.display = 'none';
  document.body.appendChild(hidden);

  // Bouton visible
  const wrapper = document.createElement('div');
  wrapper.className = 'lang-selector';
  wrapper.style.cssText = 'position:relative;margin-left:auto;';
  wrapper.innerHTML = `
    <button id="langBtn" onclick="toggleLangDropdown()" style="
      display:flex;align-items:center;gap:6px;
      padding:7px 14px;border-radius:20px;
      border:1px solid var(--cream-dark);
      background:var(--white);font-size:13px;
      font-family:'DM Sans',sans-serif;color:var(--text-mid);
      cursor:pointer;transition:all .2s;white-space:nowrap;
    " onmouseover="this.style.borderColor='var(--rose-deep)'"
       onmouseout="this.style.borderColor='var(--cream-dark)'">
      🇫🇷 Français ▾
    </button>
    <div id="langDropdown" style="
      display:none;position:absolute;top:calc(100% + 6px);right:0;
      background:var(--white);border:1px solid var(--cream-dark);
      border-radius:14px;box-shadow:0 8px 32px rgba(44,36,32,.12);
      overflow:hidden;z-index:1000;min-width:160px;
    ">
      ${LANGUAGES.map(l => `
        <button onclick="setLanguage('${l.code}')" style="
          display:flex;align-items:center;gap:10px;width:100%;
          padding:10px 16px;border:none;background:none;
          font-size:13px;font-family:'DM Sans',sans-serif;
          color:var(--text-dark);cursor:pointer;transition:all .15s;
          text-align:left;
        " onmouseover="this.style.background='var(--cream)'"
           onmouseout="this.style.background='none'">
          <span style="font-size:18px">${l.flag}</span> ${l.label}
        </button>
      `).join('')}
    </div>
  `;

  // Insérer dans la nav (avant le nav-back s'il existe, sinon à la fin)
  const nav = document.querySelector('nav');
  if (nav) {
    const navBack = nav.querySelector('.nav-back');
    if (navBack) {
      nav.insertBefore(wrapper, navBack);
    } else {
      nav.appendChild(wrapper);
    }
  }

  // Appliquer la langue sauvegardée
  setTimeout(() => {
    const saved = localStorage.getItem('sf_lang');
    if (saved && saved !== 'fr') {
      setLanguage(saved);
    }
  }, 1500);
}

// Initialiser au chargement
window.addEventListener('DOMContentLoaded', () => {
  loadGoogleTranslate();
  setTimeout(injectLangSelector, 500);
});
