// ===== VITRINE DIGITALE v2.0 =====
const SHOWCASE_KEY = 'pkm_showcase_v2';
const SHOWCASE_FLOORS = [
  { id: 'floor1', label: 'Scellé Classique',  sub: 'Blisters · Duo · Tri · Bundle',   icon: '📦', color: '#5b8dee' },
  { id: 'floor2', label: 'Scellé Premium',     sub: 'Displays · Coffrets · UPC',       icon: '💎', color: '#a78bfa' },
  { id: 'floor3', label: 'Cartes Loose',       sub: 'Cartes premium non gradées',      icon: '✨', color: '#34d399' },
  { id: 'floor4', label: 'Cartes Gradées',     sub: 'PSA · CGC · PCA · Collect Aura', icon: '🏆', color: '#fbbf24' },
];

let showcaseData = { floors: { floor1:[], floor2:[], floor3:[], floor4:[] } };
let showcaseState = 'closed';   // closed | opening | floor | item
let showcaseActiveFloor = null;
let showcaseActiveItem  = null;
let showcaseEditingFloor = null;
let showcaseEditingId    = null;

function loadShowcaseData() {
  try {
    const s = localStorage.getItem(SHOWCASE_KEY);
    if (s) showcaseData = JSON.parse(s);
    SHOWCASE_FLOORS.forEach(f => { if (!showcaseData.floors[f.id]) showcaseData.floors[f.id] = []; });
  } catch(e) {}
}
function saveShowcaseData() { localStorage.setItem(SHOWCASE_KEY, JSON.stringify(showcaseData)); }

// ===== RENDER =====
function renderShowcase() {
  loadShowcaseData();
  const container = document.getElementById('showcase-container');
  if (!container) return;
  container.innerHTML = buildShowcaseHTML();
  bindShowcaseEvents();
}

function buildShowcaseHTML() {
  return `
<div class="sc-scene" id="sc-scene">

  <!-- FOND SALLE -->
  <div class="sc-room-bg">
    <div class="sc-room-wall"></div>
    <div class="sc-room-floor-shadow"></div>
  </div>

  <!-- VITRINE PRINCIPALE -->
  <div class="sc-cabinet-wrap" id="sc-cabinet-wrap">
    <div class="sc-cabinet" id="sc-cabinet">

      <!-- CARCASSE -->
      <div class="sc-frame">

        <!-- BORD HAUT -->
        <div class="sc-frame-top">
          <div class="sc-led-bar"></div>
        </div>

        <!-- ÉTAGES (du haut = floor4 au bas = floor1) -->
        <div class="sc-floors-wrap">
          ${[...SHOWCASE_FLOORS].reverse().map((floor, ri) => {
            const items = showcaseData.floors[floor.id] || [];
            return `
            <div class="sc-floor-unit" id="fu-${floor.id}" data-floor="${floor.id}">
              <!-- Fond LED de l'étage -->
              <div class="sc-floor-bg">
                <div class="sc-floor-led-top"></div>
                <div class="sc-floor-glow" style="--fc:${floor.color}20"></div>
              </div>

              <!-- CONTENU ÉTAGÈRE (masqué si vitrine fermée) -->
              <div class="sc-floor-content" id="fc-${floor.id}">
                ${items.length === 0
                  ? `<div class="sc-floor-empty">Aucun item — cliquez ＋ pour ajouter</div>`
                  : items.map(item => buildItem(item, floor.id)).join('')
                }
              </div>

              <!-- LABEL CENTRÉ (visible vitrine fermée) -->
              <div class="sc-floor-overlay" id="fo-${floor.id}" onclick="openFloor('${floor.id}')">
                <div class="sc-floor-label-wrap">
                  <div class="sc-floor-label-icon">${floor.icon}</div>
                  <div class="sc-floor-label-text">${floor.label}</div>
                  <div class="sc-floor-label-count">${items.length} item${items.length!==1?'s':''}</div>
                </div>
              </div>

              <!-- Planche étagère -->
              <div class="sc-shelf"></div>
            </div>`;
          }).join('')}
        </div>

        <!-- BORD BAS -->
        <div class="sc-frame-bottom"></div>
      </div>

      <!-- PORTES VITRÉES -->
      <div class="sc-doors" id="sc-doors">
        <div class="sc-door sc-door-left"  id="sc-door-left">
          <div class="sc-door-glass">
            <div class="sc-door-reflet"></div>
            <div class="sc-door-handle sc-door-handle-right"></div>
          </div>
        </div>
        <div class="sc-door sc-door-right" id="sc-door-right">
          <div class="sc-door-glass">
            <div class="sc-door-reflet"></div>
            <div class="sc-door-handle sc-door-handle-left"></div>
          </div>
        </div>
      </div>

      <!-- MONTANTS LATÉRAUX -->
      <div class="sc-side sc-side-left"></div>
      <div class="sc-side sc-side-right"></div>
    </div>
  </div>

  <!-- BOUTON FERMER (visible quand étage ouvert) -->
  <button class="sc-back-btn" id="sc-back-btn" onclick="closeFloor()">
    ← Fermer la vitrine
  </button>

  <!-- BOUTON AJOUTER -->
  <button class="sc-add-fab" id="sc-add-fab" onclick="openAddShowcaseItem(showcaseActiveFloor)" title="Ajouter un item">＋</button>

  <!-- VISUALISATEUR ITEM -->
  <div class="sc-viewer" id="sc-viewer" onclick="closeViewer()">
    <div class="sc-viewer-inner" onclick="event.stopPropagation()" id="sc-viewer-inner"></div>
    <button class="sc-viewer-close" onclick="closeViewer()">✕</button>
  </div>

</div>`;
}

function buildItem(item, floorId) {
  const isGraded = floorId === 'floor4';
  const isCard   = floorId === 'floor3' || floorId === 'floor4';
  const ph = getItemPlaceholder(item, floorId);

  return `
  <div class="sc-item ${isGraded?'sc-item-slab':isCard?'sc-item-card':'sc-item-box'}"
       data-id="${item.id}" data-floor="${floorId}"
       onclick="viewItem('${item.id}','${floorId}')">
    <div class="sc-item-wrap">
      ${item.image
        ? `<img src="${item.image}" class="sc-item-img" alt="${item.nom}">`
        : ph
      }
      ${isGraded && item.grade ? `
        <div class="sc-slab-top">
          <span class="sc-slab-gradeur">${item.gradeur||'PSA'}</span>
          <span class="sc-slab-num">${item.grade}</span>
        </div>` : ''
      }
      <div class="sc-item-shine"></div>
      <div class="sc-item-shadow"></div>
    </div>
    <div class="sc-item-label">${item.nom.split(' ').slice(0,3).join(' ')}</div>
    <!-- Actions -->
    <div class="sc-item-btns">
      <button onclick="event.stopPropagation();editShowcaseItem('${item.id}','${floorId}')" title="Modifier">✏️</button>
      <button onclick="event.stopPropagation();deleteShowcaseItem('${item.id}','${floorId}')" title="Supprimer">🗑️</button>
    </div>
  </div>`;
}

function getItemPlaceholder(item, floorId) {
  const colors = { floor1:'#3b5bdb', floor2:'#7048e8', floor3:'#0ca678', floor4:'#e67700' };
  const color = colors[floorId] || '#555';
  const label = item.nom.substring(0,2).toUpperCase();
  if (floorId === 'floor4') {
    return `<div class="sc-placeholder-slab" style="background:linear-gradient(160deg,${color}33,${color}11)">
      <div style="font-size:9px;font-weight:700;color:${color};letter-spacing:1px">${item.gradeur||'PSA'}</div>
      <div style="font-size:22px;margin:4px 0">🃏</div>
      <div class="sc-slab-grade-ph">${item.grade||'?'}</div>
    </div>`;
  }
  if (floorId === 'floor3') {
    return `<div class="sc-placeholder-card" style="background:linear-gradient(160deg,${color}44,${color}22)">
      <div style="font-size:28px">✨</div>
      <div style="font-size:9px;color:${color};font-weight:700;margin-top:4px">${label}</div>
    </div>`;
  }
  return `<div class="sc-placeholder-box" style="background:linear-gradient(160deg,${color}44,${color}22)">
    <div style="font-size:24px">${floorId==='floor2'?'💎':'📦'}</div>
    <div style="font-size:10px;color:${color};font-weight:700;margin-top:6px;text-align:center;padding:0 4px;line-height:1.3">${item.nom.split(' ').slice(0,2).join(' ')}</div>
  </div>`;
}

// ===== ANIMATIONS =====
function openFloor(floorId) {
  if (showcaseState !== 'closed') return;
  showcaseState = 'opening';
  showcaseActiveFloor = floorId;

  const doorL = document.getElementById('sc-door-left');
  const doorR = document.getElementById('sc-door-right');

  doorL.classList.add('open');
  doorR.classList.add('open');

  setTimeout(() => { zoomToFloor(floorId); }, 650);
}

function zoomToFloor(floorId) {
  const backBtn = document.getElementById('sc-back-btn');
  const addFab  = document.getElementById('sc-add-fab');
  const doors   = document.getElementById('sc-doors');

  // Masquer les portes après ouverture
  if (doors) doors.style.opacity = '0';

  // Masquer TOUS les autres étages
  SHOWCASE_FLOORS.forEach(f => {
    const fu = document.getElementById(`fu-${f.id}`);
    const fo = document.getElementById(`fo-${f.id}`);
    if (!fu || !fo) return;
    if (f.id === floorId) {
      // Étage actif : masquer overlay, montrer contenu, agrandir
      fo.classList.add('hidden');
      fu.classList.add('sc-floor-active');
      const content = document.getElementById(`fc-${f.id}`);
      if (content) content.classList.add('visible');
    } else {
      // Autres étages : masquer complètement
      fu.classList.add('sc-floor-hidden');
    }
  });

  // Agrandir la vitrine pour ne montrer que cet étage
  const cabinet = document.getElementById('sc-cabinet-wrap');
  cabinet.classList.add('floor-open');

  showcaseState = 'floor';
  backBtn.classList.add('visible');
  addFab.classList.add('visible');

  // Animer items
  setTimeout(() => {
    document.querySelectorAll(`#fc-${floorId} .sc-item`).forEach((el, i) => {
      setTimeout(() => el.classList.add('entered'), i * 55);
    });
  }, 150);
}

function closeFloor() {
  if (showcaseState !== 'floor') return;

  const doorL   = document.getElementById('sc-door-left');
  const doorR   = document.getElementById('sc-door-right');
  const cabinet = document.getElementById('sc-cabinet-wrap');
  const backBtn = document.getElementById('sc-back-btn');
  const addFab  = document.getElementById('sc-add-fab');
  const doors   = document.getElementById('sc-doors');

  // Retirer classe floor-open
  cabinet.classList.remove('floor-open');

  // Remettre les portes visibles puis les fermer
  if (doors) doors.style.opacity = '';
  setTimeout(() => {
    doorL.classList.remove('open');
    doorR.classList.remove('open');
  }, 100);

  // Remettre tous les étages visibles
  SHOWCASE_FLOORS.forEach(f => {
    const fu = document.getElementById(`fu-${f.id}`);
    const fo = document.getElementById(`fo-${f.id}`);
    const ct = document.getElementById(`fc-${f.id}`);
    if (fu) { fu.classList.remove('sc-floor-active'); fu.classList.remove('sc-floor-hidden'); }
    if (fo) fo.classList.remove('hidden');
    if (ct) {
      ct.classList.remove('visible');
      ct.querySelectorAll('.sc-item').forEach(el => el.classList.remove('entered'));
    }
  });

  backBtn.classList.remove('visible');
  addFab.classList.remove('visible');
  showcaseState = 'closed';
  showcaseActiveFloor = null;
}

// ===== VISUALISATEUR =====
function viewItem(id, floorId) {
  if (showcaseState !== 'floor') return;
  const items = showcaseData.floors[floorId] || [];
  const item  = items.find(i => i.id === id);
  if (!item) return;

  const floor = SHOWCASE_FLOORS.find(f => f.id === floorId);
  const isGraded = floorId === 'floor4';
  const isCard   = floorId === 'floor3' || floorId === 'floor4';
  const ph = getItemPlaceholder(item, floorId);

  const viewer  = document.getElementById('sc-viewer');
  const inner   = document.getElementById('sc-viewer-inner');

  inner.innerHTML = `
    <div class="scv-img-zone">
      <div class="scv-img-wrap ${isGraded?'scv-slab':isCard?'scv-card':'scv-box'}">
        ${item.image
          ? `<img src="${item.image}" class="scv-img" alt="${item.nom}">`
          : `<div class="scv-ph">${ph}</div>`
        }
        ${isGraded && item.grade ? `
          <div class="scv-slab-banner">
            <span class="scv-slab-gradeur">${item.gradeur||'PSA'}</span>
            <span class="scv-slab-score">${item.grade}</span>
          </div>` : ''
        }
        <div class="scv-shine"></div>
      </div>
    </div>
    <div class="scv-info">
      <div class="scv-badge" style="--fc:${floor.color}">${floor.icon} ${floor.label}</div>
      <h2 class="scv-name">${item.nom}</h2>
      ${item.prix ? `<div class="scv-prix">${formatPrice(item.prix)}</div>` : ''}
      ${isGraded && item.grade ? `<div class="scv-grade-row"><span class="scv-grade-num">${item.grade}</span><span class="scv-grade-lbl"> / 10</span><span class="scv-gradeur-tag">${item.gradeur||''}</span></div>` : ''}
      ${item.notes ? `<div class="scv-notes">"${item.notes}"</div>` : ''}
      <div style="display:flex;gap:8px;margin-top:20px">
        <button class="btn btn-secondary" style="font-size:12px" onclick="editShowcaseItem('${item.id}','${floorId}');closeViewer()">✏️ Modifier</button>
        <button class="btn btn-danger"    style="font-size:12px" onclick="deleteShowcaseItem('${item.id}','${floorId}');closeViewer()">🗑️ Supprimer</button>
      </div>
    </div>
  `;

  viewer.classList.add('open');
  showcaseState = 'item';
}

function closeViewer() {
  document.getElementById('sc-viewer').classList.remove('open');
  showcaseState = 'floor';
}

// ===== ADD / EDIT / DELETE =====
function openAddShowcaseItem(floorId) {
  showcaseEditingFloor = floorId || 'floor1';
  showcaseEditingId    = null;
  document.getElementById('sc-modal-title').textContent = 'Ajouter à la vitrine';
  document.getElementById('sc-item-nom').value     = '';
  document.getElementById('sc-item-prix').value    = '';
  document.getElementById('sc-item-notes').value   = '';
  document.getElementById('sc-item-grade').value   = '';
  document.getElementById('sc-item-gradeur').value = '';
  document.getElementById('sc-item-url').value     = '';
  document.getElementById('sc-item-floor').value   = showcaseEditingFloor;
  const prev = document.getElementById('sc-img-preview');
  prev.innerHTML = '<div style="font-size:26px;opacity:0.3">🖼️</div><div style="font-size:10px;opacity:0.3;margin-top:4px">Cliquez pour uploader</div>';
  prev.classList.remove('has-image');
  delete prev.dataset.pendingImage;
  toggleGradedFields();
  openModal('modal-showcase');
}

function editShowcaseItem(id, floorId) {
  const item = (showcaseData.floors[floorId]||[]).find(i => i.id === id);
  if (!item) return;
  showcaseEditingFloor = floorId;
  showcaseEditingId    = id;
  document.getElementById('sc-modal-title').textContent = 'Modifier l\'item';
  document.getElementById('sc-item-nom').value     = item.nom    || '';
  document.getElementById('sc-item-floor').value   = floorId;
  document.getElementById('sc-item-prix').value    = item.prix   || '';
  document.getElementById('sc-item-notes').value   = item.notes  || '';
  document.getElementById('sc-item-grade').value   = item.grade  || '';
  document.getElementById('sc-item-gradeur').value = item.gradeur|| '';
  document.getElementById('sc-item-url').value     = '';
  const prev = document.getElementById('sc-img-preview');
  if (item.image) {
    prev.innerHTML = `<img src="${item.image}" style="max-width:100%;max-height:130px;border-radius:8px;object-fit:contain">`;
    prev.classList.add('has-image');
  } else {
    prev.innerHTML = '<div style="font-size:26px;opacity:0.3">🖼️</div>';
    prev.classList.remove('has-image');
  }
  delete prev.dataset.pendingImage;
  toggleGradedFields();
  openModal('modal-showcase');
}

function toggleGradedFields() {
  const floor = document.getElementById('sc-item-floor')?.value;
  const el = document.getElementById('sc-graded-fields');
  if (el) el.style.display = floor === 'floor4' ? 'block' : 'none';
}

function saveShowcaseItem() {
  const nom     = document.getElementById('sc-item-nom').value.trim();
  const floor   = document.getElementById('sc-item-floor').value;
  const prix    = parseFloat(document.getElementById('sc-item-prix').value) || null;
  const notes   = document.getElementById('sc-item-notes').value.trim();
  const grade   = document.getElementById('sc-item-grade').value.trim();
  const gradeur = document.getElementById('sc-item-gradeur').value.trim();
  const url     = document.getElementById('sc-item-url').value.trim();
  const prev    = document.getElementById('sc-img-preview');
  const pending = prev.dataset.pendingImage || null;

  if (!nom) { showToast('Le nom est requis', 'error'); return; }
  const image = url.startsWith('http') ? url : (pending || null);

  if (!showcaseData.floors[floor]) showcaseData.floors[floor] = [];

  if (showcaseEditingId) {
    if (floor !== showcaseEditingFloor) {
      showcaseData.floors[showcaseEditingFloor] = (showcaseData.floors[showcaseEditingFloor]||[]).filter(i => i.id !== showcaseEditingId);
    }
    const arr = showcaseData.floors[floor];
    const idx = arr.findIndex(i => i.id === showcaseEditingId);
    const updated = { id: showcaseEditingId, nom, prix, notes, grade, gradeur, image: image || (arr[idx]||{}).image || null };
    if (idx !== -1) arr[idx] = updated; else arr.push(updated);
    showToast('Item modifié ✓', 'success');
  } else {
    showcaseData.floors[floor].push({ id: genId('sc'), nom, prix, notes, grade, gradeur, image });
    showToast('Ajouté ✓', 'success');
  }

  saveShowcaseData();
  closeModal();
  // Refresh en gardant l'état
  const prevState = showcaseState;
  const prevFloor = showcaseActiveFloor;
  renderShowcase();
  if (prevState === 'floor' && prevFloor) {
    showcaseState = 'closed';
    openFloor(prevFloor);
  }
}

function deleteShowcaseItem(id, floorId) {
  if (!confirm('Retirer cet item ?')) return;
  showcaseData.floors[floorId] = (showcaseData.floors[floorId]||[]).filter(i => i.id !== id);
  saveShowcaseData();
  renderShowcase();
  showToast('Item retiré', 'info');
}

// ===== IMAGE UPLOAD =====
function initShowcaseImageUpload() {
  const prev = document.getElementById('sc-img-preview');
  const inp  = document.getElementById('sc-img-input');
  if (!prev || !inp) return;
  prev.addEventListener('click', () => inp.click());
  inp.addEventListener('change', async () => {
    const file = inp.files[0]; if (!file) return;
    const b64 = await compressImage(file, 800, 0.78);
    prev.innerHTML = `<img src="${b64}" style="max-width:100%;max-height:130px;border-radius:8px;object-fit:contain">`;
    prev.classList.add('has-image');
    prev.dataset.pendingImage = b64;
  });
}

function bindShowcaseEvents() {}

document.addEventListener('DOMContentLoaded', () => {
  initShowcaseImageUpload();
  document.getElementById('btn-save-showcase-item')?.addEventListener('click', saveShowcaseItem);
  document.getElementById('sc-item-floor')?.addEventListener('change', toggleGradedFields);
  // Fermer avec Echap
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (showcaseState === 'item') closeViewer();
      else if (showcaseState === 'floor') closeFloor();
    }
  });
});
