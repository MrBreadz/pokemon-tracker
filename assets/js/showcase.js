// ===== VITRINE DIGITALE v1.0 =====
// 4 étages LED, ambiance noir mat, zoom animé au clic

const SHOWCASE_KEY = 'pkm_showcase_v1';
const SHOWCASE_FLOORS = [
  { id: 'floor1', label: 'Scellé Classique',  sub: 'Blisters · Duo pack · Tri pack · Bundle', icon: '📦', color: '#ffffff' },
  { id: 'floor2', label: 'Scellé Premium',     sub: 'Displays · Coffrets · UPC',              icon: '🏆', color: '#e8f4ff' },
  { id: 'floor3', label: 'Cartes Loose',       sub: 'Cartes premium non gradées',             icon: '✨', color: '#fff8e8' },
  { id: 'floor4', label: 'Cartes Gradées',     sub: 'PSA · CGC · PCA · Collect Aura',        icon: '🎖️', color: '#f0f8ff' },
];

let showcaseData = { floors: { floor1:[], floor2:[], floor3:[], floor4:[] } };
let showcaseEditingFloor = null;
let showcaseEditingId = null;
let showcaseZoomed = null;

function loadShowcaseData() {
  try {
    const s = localStorage.getItem(SHOWCASE_KEY);
    if (s) showcaseData = JSON.parse(s);
    // S'assurer que tous les étages existent
    SHOWCASE_FLOORS.forEach(f => {
      if (!showcaseData.floors[f.id]) showcaseData.floors[f.id] = [];
    });
  } catch(e) { console.error(e); }
}

function saveShowcaseData() {
  localStorage.setItem(SHOWCASE_KEY, JSON.stringify(showcaseData));
}

// ===== RENDER PRINCIPAL =====
function renderShowcase() {
  loadShowcaseData();
  const container = document.getElementById('showcase-container');
  if (!container) return;
  container.innerHTML = buildShowcaseHTML();
  initShowcaseEvents();
}

function buildShowcaseHTML() {
  return `
  <div class="sc-outer" id="sc-outer">
    <!-- Fond vitrine -->
    <div class="sc-room">

      <!-- HEADER navigation rapide -->
      <div class="sc-nav">
        ${SHOWCASE_FLOORS.map((f,i) => `
          <button class="sc-nav-btn" onclick="scrollToFloor('${f.id}')">
            <span class="sc-nav-num">${4-i}</span>
            <span class="sc-nav-label">${f.label}</span>
          </button>
        `).reverse().join('')}
        <button class="sc-nav-btn sc-nav-add" onclick="openAddShowcaseItem(null)">＋ Ajouter</button>
      </div>

      <!-- VITRINE principale -->
      <div class="sc-cabinet" id="sc-cabinet">

        <!-- Structure de la vitrine -->
        <div class="sc-cabinet-frame">

          <!-- Lumière ambiante top -->
          <div class="sc-ambient-top"></div>

          <!-- 4 étages du bas vers le haut visuellement (étage 4 = haut) -->
          ${[...SHOWCASE_FLOORS].reverse().map((floor, ri) => {
            const items = showcaseData.floors[floor.id] || [];
            const floorNum = 4 - ri;
            return `
            <div class="sc-floor" id="${floor.id}" data-floor="${floor.id}">
              <!-- LED strip top de l'étagère -->
              <div class="sc-led-strip">
                <div class="sc-led-glow" style="background:radial-gradient(ellipse at 50% 0%, rgba(220,230,255,0.35) 0%, transparent 70%)"></div>
              </div>

              <!-- Label de l'étage -->
              <div class="sc-floor-label">
                <span class="sc-floor-icon">${floor.icon}</span>
                <div>
                  <div class="sc-floor-name">${floor.label}</div>
                  <div class="sc-floor-sub">${floor.sub}</div>
                </div>
                <button class="sc-floor-add" onclick="event.stopPropagation();openAddShowcaseItem('${floor.id}')" title="Ajouter un item">＋</button>
              </div>

              <!-- Items sur l'étagère -->
              <div class="sc-shelf-items" id="shelf-${floor.id}">
                ${items.length === 0
                  ? `<div class="sc-shelf-empty">
                      <span style="opacity:0.25;font-size:11px">Cliquez + pour ajouter des items</span>
                    </div>`
                  : items.map(item => buildShelfItem(item, floor.id)).join('')
                }
              </div>

              <!-- Planche de l'étagère -->
              <div class="sc-shelf-board">
                <div class="sc-shelf-reflection"></div>
              </div>
            </div>`;
          }).join('')}

          <!-- Sol de la vitrine -->
          <div class="sc-cabinet-floor"></div>
        </div>

        <!-- Reflets vitres -->
        <div class="sc-glass-left"></div>
        <div class="sc-glass-right"></div>
      </div>

    </div>

    <!-- OVERLAY zoom item -->
    <div class="sc-zoom-overlay" id="sc-zoom-overlay" onclick="closeZoom()">
      <div class="sc-zoom-content" id="sc-zoom-content" onclick="event.stopPropagation()">
        <button class="sc-zoom-close" onclick="closeZoom()">✕</button>
        <div id="sc-zoom-inner"></div>
      </div>
    </div>
  </div>`;
}

function buildShelfItem(item, floorId) {
  const isGraded = floorId === 'floor4';
  const isCard   = floorId === 'floor3' || floorId === 'floor4';

  return `
  <div class="sc-item" data-id="${item.id}" data-floor="${floorId}" onclick="zoomItem('${item.id}','${floorId}')">
    <div class="sc-item-inner">
      <!-- Image produit -->
      <div class="sc-item-img-wrap ${isGraded ? 'graded-slab' : isCard ? 'card-loose' : 'sealed-box'}">
        ${item.image
          ? `<img src="${item.image}" alt="${item.nom}" class="sc-item-img">`
          : `<div class="sc-item-placeholder">${getFloorEmoji(floorId)}</div>`
        }
        ${isGraded && item.grade ? `<div class="sc-slab-grade">${item.grade}</div>` : ''}
        ${isGraded && item.gradeur ? `<div class="sc-slab-label">${item.gradeur}</div>` : ''}
        <!-- Reflet sur l'item -->
        <div class="sc-item-shine"></div>
      </div>
      <!-- Nom sous l'item -->
      <div class="sc-item-name">${item.nom.split(' ').slice(0,3).join(' ')}</div>
    </div>
    <!-- Actions au hover -->
    <div class="sc-item-actions">
      <button onclick="event.stopPropagation();editShowcaseItem('${item.id}','${floorId}')" title="Modifier">✏️</button>
      <button onclick="event.stopPropagation();deleteShowcaseItem('${item.id}','${floorId}')" title="Supprimer">🗑️</button>
    </div>
  </div>`;
}

function getFloorEmoji(floorId) {
  return { floor1:'📦', floor2:'🏆', floor3:'✨', floor4:'🎖️' }[floorId] || '📦';
}

// ===== ZOOM ANIMÉ =====
function zoomItem(id, floorId) {
  const items = showcaseData.floors[floorId] || [];
  const item = items.find(i => i.id === id);
  if (!item) return;

  const isGraded = floorId === 'floor4';
  const isCard   = floorId === 'floor3' || floorId === 'floor4';
  const floor    = SHOWCASE_FLOORS.find(f => f.id === floorId);

  const overlay = document.getElementById('sc-zoom-overlay');
  const inner   = document.getElementById('sc-zoom-inner');

  inner.innerHTML = `
    <div class="sc-zoom-img-wrap ${isGraded ? 'zoom-graded' : isCard ? 'zoom-card' : 'zoom-sealed'}">
      ${item.image
        ? `<img src="${item.image}" alt="${item.nom}" class="sc-zoom-img">`
        : `<div class="sc-zoom-placeholder">${getFloorEmoji(floorId)}</div>`
      }
      ${isGraded && item.grade ? `<div class="sc-zoom-grade">${item.grade}</div>` : ''}
      ${isGraded && item.gradeur ? `<div class="sc-zoom-gradeur">${item.gradeur}</div>` : ''}
      <div class="sc-zoom-shine"></div>
    </div>
    <div class="sc-zoom-info">
      <div class="sc-zoom-floor-badge">${floor.icon} ${floor.label}</div>
      <div class="sc-zoom-name">${item.nom}</div>
      ${item.prix ? `<div class="sc-zoom-prix">${formatPrice(item.prix)}</div>` : ''}
      ${item.notes ? `<div class="sc-zoom-notes">"${item.notes}"</div>` : ''}
    </div>
  `;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeZoom() {
  const overlay = document.getElementById('sc-zoom-overlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ===== SCROLL VERS ÉTAGE =====
function scrollToFloor(floorId) {
  const el = document.getElementById(floorId);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('sc-floor-highlight');
  setTimeout(() => el.classList.remove('sc-floor-highlight'), 1500);
}

// ===== ADD / EDIT / DELETE =====
function openAddShowcaseItem(floorId) {
  showcaseEditingFloor = floorId;
  showcaseEditingId    = null;
  document.getElementById('sc-modal-title').textContent = 'Ajouter à la vitrine';
  document.getElementById('sc-item-nom').value    = '';
  document.getElementById('sc-item-prix').value   = '';
  document.getElementById('sc-item-notes').value  = '';
  document.getElementById('sc-item-grade').value  = '';
  document.getElementById('sc-item-gradeur').value = '';
  document.getElementById('sc-item-url').value    = '';
  if (floorId) document.getElementById('sc-item-floor').value = floorId;
  const prev = document.getElementById('sc-img-preview');
  prev.innerHTML = '<div style="font-size:28px;opacity:0.3">🖼️</div><div style="font-size:11px;opacity:0.3;margin-top:4px">Cliquez pour uploader</div>';
  prev.classList.remove('has-image');
  delete prev.dataset.pendingImage;
  toggleGradedFields();
  openModal('modal-showcase');
}

function editShowcaseItem(id, floorId) {
  const item = (showcaseData.floors[floorId] || []).find(i => i.id === id);
  if (!item) return;
  showcaseEditingFloor = floorId;
  showcaseEditingId    = id;
  document.getElementById('sc-modal-title').textContent = 'Modifier l\'item';
  document.getElementById('sc-item-nom').value    = item.nom || '';
  document.getElementById('sc-item-floor').value  = floorId;
  document.getElementById('sc-item-prix').value   = item.prix || '';
  document.getElementById('sc-item-notes').value  = item.notes || '';
  document.getElementById('sc-item-grade').value  = item.grade || '';
  document.getElementById('sc-item-gradeur').value = item.gradeur || '';
  document.getElementById('sc-item-url').value    = '';
  const prev = document.getElementById('sc-img-preview');
  if (item.image) {
    prev.innerHTML = `<img src="${item.image}" style="max-width:100%;max-height:140px;border-radius:8px;object-fit:contain">`;
    prev.classList.add('has-image');
  } else {
    prev.innerHTML = '<div style="font-size:28px;opacity:0.3">🖼️</div>';
    prev.classList.remove('has-image');
  }
  delete prev.dataset.pendingImage;
  toggleGradedFields();
  openModal('modal-showcase');
}

function toggleGradedFields() {
  const floor = document.getElementById('sc-item-floor').value;
  const gradedFields = document.getElementById('sc-graded-fields');
  if (gradedFields) gradedFields.style.display = floor === 'floor4' ? 'block' : 'none';
}

function saveShowcaseItem() {
  const nom    = document.getElementById('sc-item-nom').value.trim();
  const floor  = document.getElementById('sc-item-floor').value;
  const prix   = parseFloat(document.getElementById('sc-item-prix').value) || null;
  const notes  = document.getElementById('sc-item-notes').value.trim();
  const grade  = document.getElementById('sc-item-grade').value.trim();
  const gradeur= document.getElementById('sc-item-gradeur').value.trim();
  const url    = document.getElementById('sc-item-url').value.trim();
  const prev   = document.getElementById('sc-img-preview');
  const pending= prev.dataset.pendingImage || null;

  if (!nom) { showToast('Le nom est requis', 'error'); return; }
  const image = url.startsWith('http') ? url : (pending || null);

  if (!showcaseData.floors[floor]) showcaseData.floors[floor] = [];

  if (showcaseEditingId) {
    // Déplacer si changement d'étage
    if (floor !== showcaseEditingFloor) {
      showcaseData.floors[showcaseEditingFloor] = (showcaseData.floors[showcaseEditingFloor]||[]).filter(i => i.id !== showcaseEditingId);
    }
    const idx = (showcaseData.floors[floor]||[]).findIndex(i => i.id === showcaseEditingId);
    const updated = { id: showcaseEditingId, nom, prix, notes, grade, gradeur, image: image || ((showcaseData.floors[floor]||[])[idx]||{}).image || null };
    if (idx !== -1) showcaseData.floors[floor][idx] = updated;
    else showcaseData.floors[floor].push(updated);
    showToast('Item modifié ✓', 'success');
  } else {
    showcaseData.floors[floor].push({ id: genId('sc'), nom, prix, notes, grade, gradeur, image });
    showToast('Ajouté à la vitrine ✓', 'success');
  }

  saveShowcaseData();
  closeModal();
  renderShowcase();
}

function deleteShowcaseItem(id, floorId) {
  if (!confirm('Retirer cet item de la vitrine ?')) return;
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
    const file = inp.files[0];
    if (!file) return;
    const b64 = await compressImage(file, 800, 0.75);
    prev.innerHTML = `<img src="${b64}" style="max-width:100%;max-height:140px;border-radius:8px;object-fit:contain">`;
    prev.classList.add('has-image');
    prev.dataset.pendingImage = b64;
  });
}

// ===== EVENTS =====
function initShowcaseEvents() {
  // Rien de spécial, tout est en onclick inline
}

document.addEventListener('DOMContentLoaded', () => {
  initShowcaseImageUpload();
  document.getElementById('btn-save-showcase-item')?.addEventListener('click', saveShowcaseItem);
  document.getElementById('sc-item-floor')?.addEventListener('change', toggleGradedFields);
});
