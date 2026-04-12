// ===== CORE APP v1.9 =====
let APP = {
  data: { sealed: [], graded: [], chase: [] },
  theme: localStorage.getItem('pkm_theme') || 'dark',
  currentPage: 'dashboard',
  ready: false,
};

// ===== STORAGE =====
function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(APP.data)); } catch(e) {}
  if (typeof window.firebaseSave === 'function') window.firebaseSave();
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const p = JSON.parse(stored);
      APP.data.sealed = Array.isArray(p.sealed) ? p.sealed : JSON.parse(JSON.stringify(INITIAL_DATA.sealed));
      APP.data.graded = Array.isArray(p.graded) ? p.graded : JSON.parse(JSON.stringify(INITIAL_DATA.graded));
      APP.data.chase  = Array.isArray(p.chase)  ? p.chase  : JSON.parse(JSON.stringify(INITIAL_DATA.chase));
    } else {
      APP.data = JSON.parse(JSON.stringify(INITIAL_DATA));
      saveData();
    }
  } catch(e) {
    APP.data = JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

// ===== THEME =====
function applyTheme(t) {
  APP.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('pkm_theme', t);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = t === 'dark' ? '🌙' : '☀️';
}
function toggleTheme() { applyTheme(APP.theme === 'dark' ? 'light' : 'dark'); }

// ===== UTILS =====
function genId(p) { return p + Date.now() + Math.random().toString(36).slice(2,6); }

function formatPrice(val) {
  if (val === null || val === undefined || val === '') return '—';
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', minimumFractionDigits:0, maximumFractionDigits:2 }).format(n);
}

function formatPriceDiff(achat, marche) {
  if (!marche || !achat) return '<span style="color:var(--text-3)">—</span>';
  const diff = marche - achat;
  const pct = ((diff / achat) * 100).toFixed(1);
  const cls = diff > 0 ? 'price-positive' : diff < 0 ? 'price-negative' : '';
  const sign = diff > 0 ? '+' : '';
  return '<span class="' + cls + '">' + sign + formatPrice(diff) + ' (' + sign + pct + '%)</span>';
}

function getBadgeType(type) {
  const map = {'ETB':'badge-etb','Display':'badge-display','Booster':'badge-booster','Coffret':'badge-coffret','Coffret Ultra Premium':'badge-coffret','Bundle':'badge-bundle','Tinbox':'badge-tinbox'};
  return map[type] || 'badge-type';
}
function getLangBadge(l) { return l==='JAP'?'badge-jap':l==='FR'?'badge-fr':'badge-type'; }
function getLangFlag(l) {
  const flags = { 'FR':'🇫🇷', 'JAP':'🇯🇵', 'EN':'🇬🇧', 'CHI':'🇨🇳', 'KOR':'🇰🇷' };
  return (flags[l] || '🌐') + ' ' + l;
}
function getTypeEmoji(t) {
  const m = {'ETB':'📦','Display':'📤','Booster':'🃏','Coffret':'🎁','Coffret Ultra Premium':'👑','Bundle':'🎴','Tinbox':'🥫','Pokebox':'📫','Duo pack':'2️⃣','Tri pack':'3️⃣','Produit dérivé':'🎮'};
  return m[t] || '📦';
}
function getTotalSealedValue(type) {
  return APP.data.sealed.reduce((s,i) => s + ((type==='marche'&&i.prixMarche?i.prixMarche:i.prixAchat)*i.stock), 0);
}
function getTotalGradedValue(type) {
  return APP.data.graded.reduce((s,i) => s + (type==='marche'&&i.prixMarche?i.prixMarche:i.prixAchat), 0);
}
function getTotalValue(type) { return getTotalSealedValue(type) + getTotalGradedValue(type); }
function sortTable(data, key, dir) {
  return [...data].sort((a,b) => {
    let va=a[key]??'', vb=b[key]??'';
    if (typeof va==='number'&&typeof vb==='number') return dir==='asc'?va-vb:vb-va;
    return dir==='asc'?String(va).localeCompare(String(vb),'fr'):String(vb).localeCompare(String(va),'fr');
  });
}
function imageToBase64(file) {
  return new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.onerror=rej;r.readAsDataURL(file);});
}

// ===== NAVIGATION =====
function navigate(page) {
  APP.currentPage = page;

  // Nav highlight
  document.querySelectorAll('.nav-item[data-page]').forEach(el =>
    el.classList.toggle('active', el.dataset.page === page)
  );

  // Afficher/cacher les pages
  document.querySelectorAll('.page-section').forEach(el => {
    if (el.id === 'page-' + page) {
      el.removeAttribute('style'); // enlève display:none
    } else {
      el.style.display = 'none';
    }
  });

  // Titre topbar
  const titles = {dashboard:'📊 Dashboard', sealed:'📦 Collection Scellée', graded:'🏆 Cartes Gradées', chase:'🌟 Chase Cards'};
  const t = document.getElementById('topbar-title');
  if (t) t.textContent = titles[page] || page;

  // Fermer sidebar mobile
  document.querySelector('.sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('active');

  // Rendre la page avec un léger délai pour que le DOM soit prêt
  setTimeout(() => renderPage(page), 0);
}

function renderPage(page) {
  if (!APP.data) return;
  try {
    if (page === 'dashboard') renderDashboard();
    else if (page === 'sealed') renderSealed();
    else if (page === 'graded') renderGraded();
    else if (page === 'chase') renderChase();
  } catch(e) {
    console.error('renderPage[' + page + ']:', e);
  }
}

// ===== TOAST =====
function showToast(msg, type='info', duration=3000) {
  const icons = {success:'✅', error:'❌', info:'ℹ️'};
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = '<span>' + icons[type] + '</span><span>' + msg + '</span>';
  c.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity 0.3s';setTimeout(()=>t.remove(),300);}, duration);
}

// ===== MODAL =====
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.style.display = 'flex';
  requestAnimationFrame(() => m.classList.add('open'));
}
function closeModal() {
  document.querySelectorAll('.modal-overlay.open').forEach(m => {
    m.classList.remove('open');
    setTimeout(() => { m.style.display = 'none'; }, 300);
  });
}

function updateNavBadges() {
  const sb = document.getElementById('badge-sealed');
  const gb = document.getElementById('badge-graded');
  const cb = document.getElementById('badge-chase');
  if (sb) sb.textContent = APP.data.sealed.reduce((s,i)=>s+i.stock,0);
  if (gb) gb.textContent = APP.data.graded.length;
  if (cb) cb.textContent = APP.data.chase.length;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  applyTheme(APP.theme);

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  document.querySelectorAll('.nav-item[data-page]').forEach(el =>
    el.addEventListener('click', () => navigate(el.dataset.page))
  );

  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.add('open');
    document.getElementById('sidebar-overlay')?.classList.add('active');
  });

  document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
  });

  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) closeModal();
  });

  APP.ready = true;
  navigate('dashboard');
  updateNavBadges();
});
