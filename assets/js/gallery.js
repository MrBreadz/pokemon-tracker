// ===== GALERIE VITRINE =====

function renderGallery() {
  const container = document.getElementById('gallery-container');
  if (!container) return;

  const allItems = [
    ...APP.data.sealed.filter(i => i.image).map(i => ({
      id: i.id, nom: i.nom, image: i.image,
      type: i.type, badge: i.type, langue: i.langue,
      prix: i.prixAchat, cat: 'sealed'
    })),
    ...APP.data.graded.filter(i => i.photo).map(i => ({
      id: i.id, nom: i.nom, image: i.photo,
      type: 'Gradée', badge: i.gradeur + ' ' + i.note, langue: i.langue,
      prix: i.prixAchat, cat: 'graded'
    })),
    ...APP.data.chase.filter(i => i.image).map(i => ({
      id: i.id, nom: i.nom, image: i.image,
      type: 'Chase', badge: i.statut, langue: '',
      prix: null, cat: 'chase'
    })),
  ];

  // Compter les items sans image
  const totalSealed = APP.data.sealed.length;
  const totalGraded = APP.data.graded.length;
  const totalChase  = APP.data.chase.length;
  const withImg     = allItems.length;
  const withoutImg  = (totalSealed + totalGraded + totalChase) - withImg;

  if (allItems.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:80px 20px;color:var(--text-3)">
        <div style="font-size:64px;margin-bottom:16px">🖼️</div>
        <div style="font-size:18px;font-weight:700;color:var(--text-2);margin-bottom:8px">Vitrine vide</div>
        <div style="font-size:14px">Ajoutez des images à vos produits et cartes pour les voir apparaître ici</div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="vitrine-wrap">
      <!-- Barre LED haut -->
      <div class="vitrine-led-top"></div>

      <!-- Compteur -->
      <div class="vitrine-counter">
        <span>${withImg} item${withImg>1?'s':''} en vitrine</span>
        ${withoutImg > 0 ? `<span style="color:var(--text-3);font-size:11px"> · ${withoutImg} sans photo</span>` : ''}
      </div>

      <!-- Filtres galerie -->
      <div class="vitrine-filters">
        <button class="vfilter active" data-cat="all" onclick="filterGallery('all',this)">Tout</button>
        <button class="vfilter" data-cat="sealed" onclick="filterGallery('sealed',this)">📦 Scellés</button>
        <button class="vfilter" data-cat="graded" onclick="filterGallery('graded',this)">🏆 Gradées</button>
        <button class="vfilter" data-cat="chase" onclick="filterGallery('chase',this)">🌟 Chase</button>
      </div>

      <!-- Grille vitrine -->
      <div class="vitrine-grid" id="vitrine-grid">
        ${allItems.map((item, i) => `
          <div class="vitrine-item" data-cat="${item.cat}" style="animation-delay:${i*0.04}s" onclick="openGalleryZoom('${item.id}','${item.cat}')">
            <div class="vitrine-item-inner">
              <!-- Reflet -->
              <div class="vitrine-reflet"></div>
              <!-- Image -->
              <div class="vitrine-img-wrap">
                <img src="${item.image}" alt="${item.nom}" loading="lazy" onerror="this.parentElement.innerHTML='<div style=\\'font-size:32px;opacity:0.3\\'>📦</div>'">
              </div>
              <!-- Lumière sous le produit -->
              <div class="vitrine-glow ${item.cat === 'graded' ? 'glow-gold' : item.cat === 'chase' ? 'glow-purple' : 'glow-blue'}"></div>
              <!-- Info au hover -->
              <div class="vitrine-info">
                <div class="vitrine-info-nom">${item.nom}</div>
                <div class="vitrine-info-meta">
                  <span class="badge ${getBadgeType(item.type)}" style="font-size:10px">${item.badge}</span>
                  ${item.prix ? '<span style="color:var(--accent);font-weight:700;font-size:12px">' + formatPrice(item.prix) + '</span>' : ''}
                </div>
              </div>
            </div>
            <!-- Étiquette prix -->
            ${item.prix ? `<div class="vitrine-price-tag">${formatPrice(item.prix)}</div>` : ''}
          </div>
        `).join('')}
      </div>

      <!-- Barre LED bas -->
      <div class="vitrine-led-bottom">
        <div class="vitrine-led-line"></div>
      </div>
    </div>
  `;
}

function filterGallery(cat, btn) {
  // Mettre à jour les boutons
  document.querySelectorAll('.vfilter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Filtrer les items
  document.querySelectorAll('.vitrine-item').forEach(el => {
    if (cat === 'all' || el.dataset.cat === cat) {
      el.style.display = '';
      el.style.animation = 'vitrineIn 0.4s ease forwards';
    } else {
      el.style.display = 'none';
    }
  });
}

function openGalleryZoom(id, cat) {
  let item;
  if (cat === 'sealed') item = APP.data.sealed.find(i => i.id === id);
  else if (cat === 'graded') item = APP.data.graded.find(i => i.id === id);
  else item = APP.data.chase.find(i => i.id === id);
  if (!item) return;

  const img = item.photo || item.image;
  if (!img) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:20px;flex-direction:column;gap:16px';
  overlay.innerHTML = `
    <img src="${img}" style="max-width:min(500px,90vw);max-height:70vh;border-radius:16px;box-shadow:0 0 80px rgba(232,180,34,0.3),0 20px 60px rgba(0,0,0,0.8);object-fit:contain">
    <div style="text-align:center">
      <div style="color:#fff;font-weight:700;font-size:16px;margin-bottom:4px">${item.nom}</div>
      ${item.prixAchat ? '<div style="color:#E8B422;font-weight:600;font-size:14px">Achat : ' + formatPrice(item.prixAchat) + (item.prixMarche ? ' · Marché : ' + formatPrice(item.prixMarche) : '') + '</div>' : ''}
    </div>
    <div style="color:rgba(255,255,255,0.4);font-size:12px">Cliquez pour fermer</div>
  `;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}

document.addEventListener('DOMContentLoaded', () => {
  // Listener nav item galerie
});
