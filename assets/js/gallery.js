// ===== VITRINE PREMIUM v2.1 =====
let galleryItems = [];
let galleryMode = 'showcase';
let galleryFilter = 'all';
let gallerySearch = '';
let heroIndex = 0;
let mouseX = 0, mouseY = 0;
let favIds = JSON.parse(localStorage.getItem('pkm_favs') || '[]');

function getGalleryData() {
  try {
    const stored = localStorage.getItem('pkm_gallery_items');
    return stored ? JSON.parse(stored) : [];
  } catch(e) { return []; }
}

function saveGalleryData(items) {
  try {
    localStorage.setItem('pkm_gallery_items', JSON.stringify(items));
  } catch(e) {
    showToast('Stockage plein — utilisez des URLs d\'images plutôt que des uploads', 'error', 5000);
  }
}

function renderGallery() {
  galleryItems = getGalleryData();
  const container = document.getElementById('gallery-container');
  if (!container) return;
  container.innerHTML = buildGalleryHTML();
  initGalleryEvents();

  // Suivi souris
  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    const light = document.getElementById('pv-mouse-light');
    if (light) { light.style.left = mouseX + 'px'; light.style.top = mouseY + 'px'; }
  });
}

function getFilteredItems() {
  let items = [...galleryItems];
  if (galleryFilter === 'favs') items = items.filter(i => favIds.includes(i.id));
  else if (galleryFilter !== 'all') items = items.filter(i => i.cat === galleryFilter);
  if (gallerySearch) items = items.filter(i => i.nom.toLowerCase().includes(gallerySearch.toLowerCase()));
  return items;
}

function buildGalleryHTML() {
  const items = getFilteredItems();
  const hero = items.length > 0 ? items[heroIndex % items.length] : null;

  return `
  <div class="pv-wrap" id="pv-wrap">
    <div class="pv-mouse-light" id="pv-mouse-light"></div>

    <!-- HEADER -->
    <div class="pv-header">
      <div class="pv-search-wrap">
        <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:13px;pointer-events:none;opacity:0.4">🔍</span>
        <input type="text" class="pv-search" id="pv-search" placeholder="Rechercher..." value="${gallerySearch}">
      </div>
      <div class="pv-filters">
        <button class="pv-filter ${galleryFilter==='all'?'active':''}" onclick="setGalleryFilter('all')">Tout</button>
        <button class="pv-filter ${galleryFilter==='graded'?'active':''}" onclick="setGalleryFilter('graded')">🏆 Gradées</button>
        <button class="pv-filter ${galleryFilter==='sealed'?'active':''}" onclick="setGalleryFilter('sealed')">📦 Scellés</button>
        <button class="pv-filter ${galleryFilter==='favs'?'active':''}" onclick="setGalleryFilter('favs')">⭐ Mes préférés</button>
      </div>
      <div class="pv-actions">
        <div class="pv-mode-toggle">
          <button class="pv-mode-btn ${galleryMode==='showcase'?'active':''}" onclick="setGalleryMode('showcase')" title="Mode vitrine">
            <span class="mode-icon-showcase">
              <span></span><span></span><span></span>
            </span>
            Vitrine
          </button>
          <button class="pv-mode-btn ${galleryMode==='grid'?'active':''}" onclick="setGalleryMode('grid')" title="Mode grille">
            <span class="mode-icon-grid">
              <span></span><span></span><span></span><span></span>
            </span>
            Grille
          </button>
        </div>
        <button class="pv-btn pv-btn-add" onclick="openAddGalleryItem()" title="Ajouter">＋</button>
      </div>
    </div>

    ${items.length === 0 ? buildEmptyState() : `
      ${hero ? buildHero(hero, items) : ''}
      <div class="pv-section-title">
        <span>La Collection</span>
        <span style="color:rgba(255,255,255,0.3);font-size:12px">${items.length} pièce${items.length>1?'s':''}</span>
      </div>
      <div class="pv-grid ${galleryMode === 'showcase' ? 'pv-grid-showcase' : 'pv-grid-compact'}" id="pv-grid">
        ${items.map((item, i) => buildCard(item, i)).join('')}
        <div class="pv-add-card" onclick="openAddGalleryItem()">
          <div style="font-size:28px;margin-bottom:6px;opacity:0.3">＋</div>
          <div style="font-size:11px;opacity:0.3;font-weight:600">Ajouter</div>
        </div>
      </div>
    `}
  </div>`;
}

function buildEmptyState() {
  return `<div style="text-align:center;padding:100px 20px;color:rgba(255,255,255,0.3)">
    <div style="font-size:64px;margin-bottom:16px">🖼️</div>
    <div style="font-size:18px;font-weight:700;color:rgba(255,255,255,0.5);margin-bottom:8px">Vitrine vide</div>
    <div style="font-size:14px;margin-bottom:28px">Ajoute tes premières pièces pour les mettre en scène</div>
    <button onclick="openAddGalleryItem()" style="padding:12px 28px;background:rgba(232,180,34,0.15);border:1px solid rgba(232,180,34,0.3);color:#E8B422;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;font-family:var(--font-body)">＋ Ajouter un item</button>
  </div>`;
}

function buildHero(item, allItems) {
  const isFav = favIds.includes(item.id);
  return `
  <div class="pv-hero">
    <!-- Fond flouté -->
    ${item.image ? `<div class="pv-hero-bg" style="background-image:url('${item.image}')"></div>` : '<div class="pv-hero-bg" style="background:radial-gradient(circle at 50% 50%, rgba(232,180,34,0.15),transparent)"></div>'}
    <div class="pv-hero-overlay"></div>

    <!-- Contenu -->
    <div class="pv-hero-inner">
      <!-- Image -->
      <div class="pv-hero-visual">
        <div class="pv-hero-img-wrap">
          ${item.image
            ? `<img src="${item.image}" alt="${item.nom}" class="pv-hero-img" onclick="openItemFullscreen('${item.id}')">`
            : `<div class="pv-hero-placeholder">${item.cat==='graded'?'🏆':item.cat==='sealed'?'📦':'💎'}</div>`
          }
          <div class="pv-hero-shine"></div>
        </div>
      </div>

      <!-- Infos -->
      <div class="pv-hero-info">
        <div class="pv-hero-label">★ PIÈCE VEDETTE</div>
        <div class="pv-hero-nom">${item.nom}</div>
        <div class="pv-hero-meta">
          <span class="pv-tag">${item.cat==='graded'?'🏆 Gradée':item.cat==='sealed'?'📦 Scellé':'💎 Rare'}</span>
          ${item.prix ? `<span class="pv-tag pv-tag-gold">${formatPrice(item.prix)}</span>` : ''}
          ${isFav ? '<span class="pv-tag" style="color:#E8B422">⭐ Préféré</span>' : ''}
        </div>
        ${item.notes ? `<div style="color:rgba(255,255,255,0.4);font-size:13px;margin-top:12px;font-style:italic">"${item.notes}"</div>` : ''}
        <div style="margin-top:20px;display:flex;gap:10px">
          <button onclick="openItemFullscreen('${item.id}')" style="padding:10px 20px;background:rgba(232,180,34,0.15);border:1px solid rgba(232,180,34,0.3);color:#E8B422;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:var(--font-body)">Voir en détail →</button>
          <button onclick="toggleFav('${item.id}')" style="padding:10px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:${isFav?'#E8B422':'rgba(255,255,255,0.4)'};border-radius:8px;cursor:pointer;font-size:16px;font-family:var(--font-body);transition:all 0.2s">⭐</button>
        </div>
      </div>
    </div>

    <!-- Navigation slider -->
    <div class="pv-hero-nav-dots">
      ${allItems.slice(0,8).map((it, i) => `<div class="pv-dot ${i === heroIndex%allItems.length ? 'active' : ''}" onclick="setHero(${i})"></div>`).join('')}
    </div>
    <button class="pv-nav-arrow pv-nav-prev" onclick="changeHero(-1)">‹</button>
    <button class="pv-nav-arrow pv-nav-next" onclick="changeHero(1)">›</button>
  </div>`;
}

function buildCard(item, i) {
  const isFav = favIds.includes(item.id);
  const delay = Math.min(i * 0.05, 0.5);

  if (galleryMode === 'showcase') {
    // MODE VITRINE : grande carte verticale avec image + infos
    return `
    <div class="pv-card pv-card-showcase" style="animation-delay:${delay}s" data-id="${item.id}">
      <div class="pv-card-img-wrap" onclick="openItemFullscreen('${item.id}')">
        ${item.image
          ? `<img src="${item.image}" alt="${item.nom}" class="pv-card-img">`
          : `<div class="pv-card-no-img">${item.cat==='graded'?'🏆':item.cat==='sealed'?'📦':'💎'}</div>`
        }
        <!-- Reflet vitrine -->
        <div class="pv-card-reflet"></div>
        <!-- Glow bas -->
        <div class="pv-card-bottom-glow ${item.cat==='graded'?'glow-gold':item.cat==='sealed'?'glow-blue':'glow-purple'}"></div>
        <!-- Overlay hover -->
        <div class="pv-card-hover-overlay">
          <span>Voir →</span>
        </div>
      </div>
      <!-- Info sous l'image -->
      <div class="pv-card-footer">
        <div class="pv-card-nom">${item.nom}</div>
        <div class="pv-card-footer-row">
          ${item.prix ? `<span class="pv-card-prix">${formatPrice(item.prix)}</span>` : '<span></span>'}
          <div style="display:flex;gap:4px">
            <button class="pv-icon-btn ${isFav?'fav-active':''}" onclick="toggleFav('${item.id}')" title="Favori">⭐</button>
            <button class="pv-icon-btn" onclick="editGalleryItem('${item.id}')" title="Modifier">✏️</button>
            <button class="pv-icon-btn danger" onclick="deleteGalleryItem('${item.id}')" title="Supprimer">🗑️</button>
          </div>
        </div>
      </div>
    </div>`;
  } else {
    // MODE GRILLE : compact, juste image + nom
    return `
    <div class="pv-card pv-card-grid" style="animation-delay:${delay}s" data-id="${item.id}" onclick="openItemFullscreen('${item.id}')">
      <div class="pv-grid-img">
        ${item.image
          ? `<img src="${item.image}" alt="${item.nom}">`
          : `<div class="pv-card-no-img" style="font-size:28px">${item.cat==='graded'?'🏆':item.cat==='sealed'?'📦':'💎'}</div>`
        }
        ${isFav ? '<div class="pv-fav-badge">⭐</div>' : ''}
        <div class="pv-grid-overlay">
          <div style="font-size:11px;font-weight:600;color:#fff;text-align:center;padding:0 8px">${item.nom}</div>
          ${item.prix ? `<div style="color:#E8B422;font-size:11px;font-weight:700;margin-top:3px">${formatPrice(item.prix)}</div>` : ''}
        </div>
      </div>
    </div>`;
  }
}

// ===== HERO NAVIGATION =====
function changeHero(dir) {
  const items = getFilteredItems();
  if (!items.length) return;
  heroIndex = ((heroIndex + dir) % items.length + items.length) % items.length;
  // Mettre à jour hero sans re-render tout
  const container = document.getElementById('gallery-container');
  if (container) {
    galleryItems = getGalleryData();
    container.innerHTML = buildGalleryHTML();
    initGalleryEvents();
  }
}

function setHero(i) { heroIndex = i; renderGallery(); }

// ===== ACTIONS =====
function setGalleryFilter(f) { galleryFilter = f; heroIndex = 0; renderGallery(); }
function setGalleryMode(m) { galleryMode = m; renderGallery(); }

function toggleFav(id) {
  if (favIds.includes(id)) favIds = favIds.filter(i => i !== id);
  else favIds.push(id);
  localStorage.setItem('pkm_favs', JSON.stringify(favIds));
  renderGallery();
  showToast(favIds.includes(id) ? 'Ajouté aux préférés ⭐' : 'Retiré des préférés', 'info');
}

function openItemFullscreen(id) {
  const item = galleryItems.find(i => i.id === id);
  if (!item) return;
  const isFav = favIds.includes(id);
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.96);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;flex-direction:column;gap:20px';
  overlay.innerHTML = `
    <div style="max-width:520px;width:100%;text-align:center;position:relative">
      <button onclick="this.closest('[style*=fixed]').remove()" style="position:absolute;top:-40px;right:0;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:13px;font-family:var(--font-body)">✕ Fermer</button>
      ${item.image ? `<img src="${item.image}" style="max-width:100%;max-height:55vh;border-radius:20px;box-shadow:0 0 80px rgba(232,180,34,0.3),0 30px 80px rgba(0,0,0,0.9);object-fit:contain;margin-bottom:24px;display:block;margin-left:auto;margin-right:auto">` : `<div style="font-size:80px;margin-bottom:24px">${item.cat==='graded'?'🏆':item.cat==='sealed'?'📦':'💎'}</div>`}
      <div style="color:#fff;font-weight:800;font-size:22px;margin-bottom:10px;font-family:var(--font-display)">${item.nom}</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">
        <span style="background:rgba(255,255,255,0.08);padding:5px 14px;border-radius:20px;font-size:12px;color:rgba(255,255,255,0.6)">${item.cat==='graded'?'🏆 Gradée':item.cat==='sealed'?'📦 Scellé':'💎 Rare'}</span>
        ${item.prix ? `<span style="background:rgba(232,180,34,0.15);border:1px solid rgba(232,180,34,0.3);padding:5px 14px;border-radius:20px;font-size:12px;color:#E8B422;font-weight:700">${formatPrice(item.prix)}</span>` : ''}
        ${isFav ? '<span style="background:rgba(232,180,34,0.1);padding:5px 14px;border-radius:20px;font-size:12px;color:#E8B422">⭐ Préféré</span>' : ''}
      </div>
      ${item.notes ? `<div style="color:rgba(255,255,255,0.45);font-size:14px;font-style:italic;line-height:1.6">"${item.notes}"</div>` : ''}
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ===== ADD / EDIT / DELETE =====
let editingGalleryId = null;

function openAddGalleryItem() {
  editingGalleryId = null;
  document.getElementById('modal-gallery-title').textContent = 'Ajouter à la vitrine';
  document.getElementById('gi-nom').value = '';
  document.getElementById('gi-prix').value = '';
  document.getElementById('gi-notes').value = '';
  document.getElementById('gi-img-url').value = '';
  const preview = document.getElementById('gi-img-preview');
  preview.innerHTML = '<div style="font-size:32px">🖼️</div><div style="color:var(--text-3);font-size:12px;margin-top:6px">Cliquez pour uploader</div>';
  preview.classList.remove('has-image');
  delete preview.dataset.pendingImage;
  openModal('modal-gallery');
}

function editGalleryItem(id) {
  editingGalleryId = id;
  const item = galleryItems.find(i => i.id === id);
  if (!item) return;
  document.getElementById('modal-gallery-title').textContent = 'Modifier l\'item';
  document.getElementById('gi-nom').value = item.nom || '';
  document.getElementById('gi-cat').value = item.cat || 'graded';
  document.getElementById('gi-prix').value = item.prix || '';
  document.getElementById('gi-notes').value = item.notes || '';
  document.getElementById('gi-img-url').value = '';
  const preview = document.getElementById('gi-img-preview');
  if (item.image) {
    preview.innerHTML = '<img src="' + item.image + '" style="max-width:100%;max-height:160px;border-radius:8px;object-fit:cover">';
    preview.classList.add('has-image');
  } else {
    preview.innerHTML = '<div style="font-size:32px">🖼️</div><div style="color:var(--text-3);font-size:12px;margin-top:6px">Cliquez pour uploader</div>';
    preview.classList.remove('has-image');
  }
  delete preview.dataset.pendingImage;
  openModal('modal-gallery');
}

function saveGalleryItem() {
  const nom = document.getElementById('gi-nom').value.trim();
  const cat = document.getElementById('gi-cat').value;
  const prix = parseFloat(document.getElementById('gi-prix').value) || null;
  const notes = document.getElementById('gi-notes').value.trim();
  const urlInput = document.getElementById('gi-img-url').value.trim();
  const preview = document.getElementById('gi-img-preview');
  const pendingImg = preview.dataset.pendingImage || null;
  if (!nom) { showToast('Le nom est requis', 'error'); return; }
  const image = urlInput.startsWith('http') ? urlInput : (pendingImg || null);
  const items = getGalleryData();
  if (editingGalleryId) {
    const idx = items.findIndex(i => i.id === editingGalleryId);
    if (idx !== -1) items[idx] = { ...items[idx], nom, cat, prix, notes, image: image || items[idx].image };
    showToast('Item modifié ✓', 'success');
  } else {
    items.push({ id: genId('vi'), nom, cat, prix, notes, image });
    showToast('Item ajouté à la vitrine ✓', 'success');
  }
  saveGalleryData(items);
  closeModal();
  renderGallery();
}

function deleteGalleryItem(id) {
  if (!confirm('Retirer cet item de la vitrine ?')) return;
  const items = getGalleryData().filter(i => i.id !== id);
  saveGalleryData(items);
  favIds = favIds.filter(i => i !== id);
  localStorage.setItem('pkm_favs', JSON.stringify(favIds));
  renderGallery();
  showToast('Item retiré', 'info');
}

function applyGalleryImageUrl() {
  const url = document.getElementById('gi-img-url').value.trim();
  if (!url || !url.startsWith('http')) { showToast('URL invalide', 'error'); return; }
  const preview = document.getElementById('gi-img-preview');
  const img = new Image();
  img.onload = () => {
    preview.innerHTML = '<img src="' + url + '" style="max-width:100%;max-height:160px;border-radius:8px;object-fit:cover">';
    preview.classList.add('has-image');
    showToast('Image chargée ✓', 'success');
  };
  img.onerror = () => showToast("URL inaccessible", 'error');
  img.src = url;
}

function initGalleryImageUpload() {
  const preview = document.getElementById('gi-img-preview');
  const inp = document.getElementById('gi-img-input');
  if (!preview || !inp) return;
  preview.addEventListener('click', () => inp.click());
  inp.addEventListener('change', async () => {
    const file = inp.files[0];
    if (!file) return;
    const b64 = await compressImage(file, 600, 0.65);
    preview.innerHTML = '<img src="' + b64 + '" style="max-width:100%;max-height:160px;border-radius:8px;object-fit:cover">';
    preview.classList.add('has-image');
    preview.dataset.pendingImage = b64;
  });
}

function initGalleryEvents() {
  const search = document.getElementById('pv-search');
  if (search) {
    search.addEventListener('input', e => { gallerySearch = e.target.value; renderGallery(); });
    search.addEventListener('click', e => e.stopPropagation());
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
  }, { threshold: 0.05 });
  document.querySelectorAll('.pv-card').forEach(c => observer.observe(c));
}

document.addEventListener('DOMContentLoaded', () => {
  initGalleryImageUpload();
  document.getElementById('btn-save-gallery-item')?.addEventListener('click', saveGalleryItem);
});
