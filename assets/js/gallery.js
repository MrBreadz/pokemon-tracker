// ===== VITRINE PREMIUM v2.0 =====
let galleryItems = [];
let galleryMode = 'showcase'; // 'showcase' | 'grid'
let galleryFilter = 'all';
let gallerySearch = '';
let heroIndex = 0;
let mouseX = 0, mouseY = 0;
let curatorMode = false;
let curatedIds = JSON.parse(localStorage.getItem('pkm_curated') || '[]');

// ===== DONNÉES GALERIE (séparées de la collection) =====
function getGalleryData() {
  const stored = localStorage.getItem('pkm_gallery_items');
  return stored ? JSON.parse(stored) : [];
}
function saveGalleryData(items) {
  // Stocker URLs uniquement (pas de base64 pour éviter quota)
  const safe = items.map(i => ({...i, image: i.image && i.image.startsWith('http') ? i.image : i.image ? '[photo locale]' : null}));
  try { localStorage.setItem('pkm_gallery_items', JSON.stringify(items)); } catch(e) {
    showToast('Stockage plein — utilisez des URLs d\'images plutôt que des uploads', 'error', 5000);
  }
}

function renderGallery() {
  galleryItems = getGalleryData();
  const container = document.getElementById('gallery-container');
  if (!container) return;

  // Suivi souris pour effet lumière
  container.onmousemove = (e) => {
    const rect = container.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    updateMouseLight(mouseX, mouseY);
  };

  container.innerHTML = buildGalleryHTML();
  initGalleryEvents();
}

function getFilteredGalleryItems() {
  let items = [...galleryItems];
  if (curatorMode) items = items.filter(i => curatedIds.includes(i.id));
  if (galleryFilter !== 'all') items = items.filter(i => i.cat === galleryFilter);
  if (gallerySearch) items = items.filter(i => i.nom.toLowerCase().includes(gallerySearch.toLowerCase()));
  return items;
}

function buildGalleryHTML() {
  const items = getFilteredGalleryItems();
  const hero = items[heroIndex] || items[0] || null;

  return `
  <div class="pv-wrap" id="pv-wrap">

    <!-- Lumière souris -->
    <div class="pv-mouse-light" id="pv-mouse-light"></div>

    <!-- HEADER -->
    <div class="pv-header">
      <div class="pv-search-wrap">
        <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:14px;pointer-events:none">🔍</span>
        <input type="text" class="pv-search" id="pv-search" placeholder="Rechercher dans la vitrine..." value="${gallerySearch}">
      </div>
      <div class="pv-filters">
        <button class="pv-filter ${galleryFilter==='all'?'active':''}" onclick="setGalleryFilter('all')">Tout</button>
        <button class="pv-filter ${galleryFilter==='graded'?'active':''}" onclick="setGalleryFilter('graded')">🏆 Gradées</button>
        <button class="pv-filter ${galleryFilter==='sealed'?'active':''}" onclick="setGalleryFilter('sealed')">📦 Scellés</button>
        <button class="pv-filter ${galleryFilter==='rare'?'active':''}" onclick="setGalleryFilter('rare')">💎 Rares</button>
      </div>
      <div class="pv-actions">
        <button class="pv-btn ${galleryMode==='showcase'?'active':''}" onclick="setGalleryMode('showcase')" title="Mode vitrine">◈</button>
        <button class="pv-btn ${galleryMode==='grid'?'active':''}" onclick="setGalleryMode('grid')" title="Mode grille">⊞</button>
        <button class="pv-btn ${curatorMode?'active':''}" onclick="toggleCurator()" title="Mode curator">⭐</button>
        <button class="pv-btn pv-btn-add" onclick="openAddGalleryItem()" title="Ajouter un item">＋</button>
      </div>
    </div>

    ${items.length === 0 ? `
      <div style="text-align:center;padding:80px 20px;color:rgba(255,255,255,0.3)">
        <div style="font-size:64px;margin-bottom:16px">🖼️</div>
        <div style="font-size:18px;font-weight:700;color:rgba(255,255,255,0.5);margin-bottom:8px">Vitrine vide</div>
        <div style="font-size:14px;margin-bottom:24px">Clique sur ＋ pour ajouter tes premiers items en vitrine</div>
        <button class="pv-btn pv-btn-add" onclick="openAddGalleryItem()" style="padding:10px 24px;font-size:14px">＋ Ajouter un item</button>
      </div>
    ` : `
      ${hero ? buildHeroSection(hero) : ''}
      <div class="pv-section-title">
        <span>La Collection</span>
        <span style="color:rgba(255,255,255,0.3);font-size:12px">${items.length} pièce${items.length>1?'s':''}</span>
      </div>
      <div class="pv-grid pv-grid-${galleryMode}" id="pv-grid">
        ${items.map((item, i) => buildItemCard(item, i)).join('')}
        <div class="pv-add-card" onclick="openAddGalleryItem()">
          <div style="font-size:32px;margin-bottom:8px;opacity:0.4">＋</div>
          <div style="font-size:12px;opacity:0.4;font-weight:600">Ajouter</div>
        </div>
      </div>
    `}
  </div>`;
}

function buildHeroSection(item) {
  const isMallette = item.cat === 'graded';
  const isCarton = item.cat === 'sealed';
  return `
  <div class="pv-hero" onclick="openItemFullscreen('${item.id}')">
    <div class="pv-hero-bg" style="${item.image ? 'background-image:url('+item.image+')' : ''}"></div>
    <div class="pv-hero-overlay"></div>
    <div class="pv-hero-content">
      <div class="pv-hero-label">★ PIÈCE VEDETTE</div>
      <div class="pv-hero-container ${isMallette ? 'hero-mallette' : isCarton ? 'hero-carton' : 'hero-vitrine'}">
        ${item.image
          ? `<img src="${item.image}" alt="${item.nom}" class="pv-hero-img">`
          : `<div class="pv-hero-placeholder">${isMallette ? '🏆' : isCarton ? '📦' : '💎'}</div>`
        }
        <div class="pv-hero-shine"></div>
      </div>
      <div class="pv-hero-info">
        <div class="pv-hero-nom">${item.nom}</div>
        <div class="pv-hero-meta">
          <span class="pv-tag">${item.cat === 'graded' ? '🏆 Gradée' : item.cat === 'sealed' ? '📦 Scellé' : '💎 Rare'}</span>
          ${item.prix ? `<span class="pv-tag pv-tag-gold">${formatPrice(item.prix)}</span>` : ''}
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:8px">Cliquer pour voir en détail →</div>
      </div>
    </div>
    <div class="pv-hero-nav">
      <button onclick="event.stopPropagation();changeHero(-1)" class="pv-hero-btn">‹</button>
      <button onclick="event.stopPropagation();changeHero(1)" class="pv-hero-btn">›</button>
    </div>
  </div>`;
}

function buildItemCard(item, i) {
  const isMallette = item.cat === 'graded';
  const isCarton = item.cat === 'sealed';
  const isRare = item.cat === 'rare';
  const isCurated = curatedIds.includes(item.id);

  return `
  <div class="pv-card pv-card-${item.cat}" style="animation-delay:${i*0.05}s"
       onclick="openItemFullscreen('${item.id}')"
       onmouseenter="animateCardOpen(this,'${item.cat}')"
       onmouseleave="animateCardClose(this,'${item.cat}')">

    <!-- Conteneur type -->
    <div class="pv-container ${isMallette ? 'pvc-mallette' : isCarton ? 'pvc-carton' : 'pvc-vitrine'}">
      ${isMallette ? buildMallette(item) : isCarton ? buildCarton(item) : buildVitrine(item)}
    </div>

    <!-- Glow -->
    <div class="pv-card-glow ${isMallette ? 'glow-gold' : isCarton ? 'glow-blue' : 'glow-purple'}"></div>

    <!-- Info -->
    <div class="pv-card-info">
      <div class="pv-card-nom">${item.nom}</div>
      ${item.prix ? `<div class="pv-card-prix">${formatPrice(item.prix)}</div>` : ''}
    </div>

    <!-- Actions -->
    <div class="pv-card-actions">
      <button class="pv-card-btn ${isCurated ? 'curated' : ''}" onclick="event.stopPropagation();toggleCurated('${item.id}')" title="${isCurated ? 'Retirer du curator' : 'Ajouter au curator'}">⭐</button>
      <button class="pv-card-btn" onclick="event.stopPropagation();deleteGalleryItem('${item.id}')" title="Supprimer">🗑️</button>
    </div>

    <!-- Badge reveal au scroll -->
    <div class="pv-reveal-badge">${isMallette ? '🏆' : isCarton ? '📦' : '💎'}</div>
  </div>`;
}

function buildMallette(item) {
  return `
    <div class="mallette">
      <div class="mallette-top">
        <div class="mallette-latch"></div>
      </div>
      <div class="mallette-body">
        ${item.image
          ? `<img src="${item.image}" alt="${item.nom}" style="width:100%;height:100%;object-fit:cover;border-radius:4px">`
          : `<div class="mallette-foam"><div class="foam-slot"></div></div>`
        }
      </div>
      <div class="mallette-bottom"></div>
    </div>`;
}

function buildCarton(item) {
  return `
    <div class="carton">
      <div class="carton-flap carton-flap-left"></div>
      <div class="carton-flap carton-flap-right"></div>
      <div class="carton-flap carton-flap-front"></div>
      <div class="carton-body">
        ${item.image
          ? `<img src="${item.image}" alt="${item.nom}" style="width:100%;height:100%;object-fit:cover;border-radius:0 0 6px 6px">`
          : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:28px;opacity:0.4">📦</div>`
        }
      </div>
    </div>`;
}

function buildVitrine(item) {
  return `
    <div class="mini-vitrine">
      <div class="mv-glass"></div>
      <div class="mv-content">
        ${item.image
          ? `<img src="${item.image}" alt="${item.nom}" style="max-width:90%;max-height:90%;object-fit:contain;border-radius:4px">`
          : `<div style="font-size:32px;opacity:0.5">💎</div>`
        }
      </div>
      <div class="mv-led"></div>
      <div class="mv-base"></div>
    </div>`;
}

function changeHero(dir) {
  const items = getFilteredGalleryItems();
  if (!items.length) return;
  heroIndex = (heroIndex + dir + items.length) % items.length;
  renderGallery();
}

function setGalleryFilter(f) { galleryFilter = f; heroIndex = 0; renderGallery(); }
function setGalleryMode(m) { galleryMode = m; renderGallery(); }
function toggleCurator() { curatorMode = !curatorMode; renderGallery(); }

function toggleCurated(id) {
  if (curatedIds.includes(id)) curatedIds = curatedIds.filter(i => i !== id);
  else curatedIds.push(id);
  localStorage.setItem('pkm_curated', JSON.stringify(curatedIds));
  renderGallery();
}

function updateMouseLight(x, y) {
  const light = document.getElementById('pv-mouse-light');
  if (light) { light.style.left = x + 'px'; light.style.top = y + 'px'; }
}

function animateCardOpen(el, cat) {
  if (cat === 'sealed') {
    const flaps = el.querySelectorAll('.carton-flap');
    flaps.forEach(f => f.classList.add('open'));
  } else if (cat === 'graded') {
    const top = el.querySelector('.mallette-top');
    if (top) top.classList.add('open');
  } else {
    const glow = el.querySelector('.mv-led');
    if (glow) glow.classList.add('active');
  }
}

function animateCardClose(el, cat) {
  el.querySelectorAll('.carton-flap, .mallette-top').forEach(f => f.classList.remove('open'));
  const led = el.querySelector('.mv-led');
  if (led) led.classList.remove('active');
}

function openItemFullscreen(id) {
  const item = galleryItems.find(i => i.id === id);
  if (!item) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.96);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:20px;flex-direction:column;gap:20px';
  overlay.innerHTML = `
    <div style="max-width:500px;width:100%;text-align:center">
      ${item.image ? `<img src="${item.image}" style="max-width:100%;max-height:60vh;border-radius:20px;box-shadow:0 0 80px rgba(232,180,34,0.4),0 30px 80px rgba(0,0,0,0.8);object-fit:contain;margin-bottom:20px">` : `<div style="font-size:80px;margin-bottom:20px">${item.cat==='graded'?'🏆':item.cat==='sealed'?'📦':'💎'}</div>`}
      <div style="color:#fff;font-weight:800;font-size:22px;margin-bottom:8px;font-family:var(--font-display)">${item.nom}</div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">
        <span style="background:rgba(255,255,255,0.1);padding:4px 14px;border-radius:20px;font-size:13px;color:rgba(255,255,255,0.7)">${item.cat==='graded'?'🏆 Gradée':item.cat==='sealed'?'📦 Scellé':'💎 Rare'}</span>
        ${item.prix ? `<span style="background:rgba(232,180,34,0.2);border:1px solid rgba(232,180,34,0.4);padding:4px 14px;border-radius:20px;font-size:13px;color:#E8B422;font-weight:700">${formatPrice(item.prix)}</span>` : ''}
      </div>
      ${item.notes ? `<div style="color:rgba(255,255,255,0.5);font-size:14px;font-style:italic">${item.notes}</div>` : ''}
      <div style="color:rgba(255,255,255,0.3);font-size:12px;margin-top:20px">Cliquez pour fermer</div>
    </div>`;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}

// ===== ADD / DELETE GALLERY ITEM =====
function openAddGalleryItem() {
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

  // Priorité : URL > upload
  let image = urlInput || pendingImg || null;

  const items = getGalleryData();
  items.push({ id: genId('vi'), nom, cat, prix, notes, image });
  saveGalleryData(items);
  closeModal();
  showToast('Item ajouté à la vitrine ✓', 'success');
  renderGallery();
}

function deleteGalleryItem(id) {
  if (!confirm('Retirer cet item de la vitrine ?')) return;
  const items = getGalleryData().filter(i => i.id !== id);
  saveGalleryData(items);
  curatedIds = curatedIds.filter(i => i !== id);
  localStorage.setItem('pkm_curated', JSON.stringify(curatedIds));
  renderGallery();
  showToast('Item retiré de la vitrine', 'info');
}

function initGalleryEvents() {
  const search = document.getElementById('pv-search');
  if (search) {
    search.addEventListener('input', e => { gallerySearch = e.target.value; renderGallery(); });
    search.addEventListener('click', e => e.stopPropagation());
  }

  // Intersection Observer pour reveal au scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.pv-card').forEach(c => observer.observe(c));
}

// Upload image galerie
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
  img.onerror = () => showToast("URL invalide ou image inaccessible", 'error');
  img.src = url;
}

document.addEventListener('DOMContentLoaded', () => {
  initGalleryImageUpload();
  document.getElementById('btn-save-gallery-item')?.addEventListener('click', saveGalleryItem);
});
