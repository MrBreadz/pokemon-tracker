let sealedView = "table"; // table | grid | grid-large
// ===== COLLECTION SCELLÉE =====
let sealedSort = { key: 'nom', dir: 'asc' };
let sealedFilters = { search: '', type: '', langue: '' };
let editingSealedId = null;

function renderSealed() {
  renderSealedStats();
  renderSealedViewToggle();
  if (sealedView === 'table') renderSealedTable();
  else renderSealedGrid();
  initSealedFAB();
}

function renderSealedViewToggle() {
  const header = document.querySelector('#page-sealed .section-header');
  if (!header) return;
  if (document.getElementById('sealed-view-toggle')) return;
  const toggle = document.createElement('div');
  toggle.className = 'view-toggle';
  toggle.id = 'sealed-view-toggle';
  toggle.innerHTML = `
    <button class="view-btn ${sealedView==='table'?'active':''}" onclick="setSealedView('table')" title="Tableau">☰</button>
    <button class="view-btn ${sealedView==='grid'?'active':''}" onclick="setSealedView('grid')" title="Grille">⊞</button>
    <button class="view-btn ${sealedView==='grid-large'?'active':''}" onclick="setSealedView('grid-large')" title="Grandes vignettes">⬜</button>
  `;
  header.appendChild(toggle);
}

function setSealedView(v) {
  sealedView = v;
  document.querySelectorAll('#sealed-view-toggle .view-btn').forEach((b,i) => {
    b.classList.toggle('active', ['table','grid','grid-large'][i] === v);
  });
  const tableWrap = document.querySelector('#page-sealed .table-wrap');
  const gridWrap = document.getElementById('sealed-grid-wrap');
  if (v === 'table') {
    if (tableWrap) tableWrap.style.display = '';
    if (gridWrap) gridWrap.remove();
    renderSealedTable();
  } else {
    if (tableWrap) tableWrap.style.display = 'none';
    renderSealedGrid();
  }
}

function renderSealedGrid() {
  const tableWrap = document.querySelector('#page-sealed .table-wrap');
  if (tableWrap) tableWrap.style.display = 'none';
  let gridWrap = document.getElementById('sealed-grid-wrap');
  if (!gridWrap) {
    gridWrap = document.createElement('div');
    gridWrap.id = 'sealed-grid-wrap';
    tableWrap?.parentNode.appendChild(gridWrap);
  }
  const data = getFilteredSealed();
  const isLarge = sealedView === 'grid-large';
  gridWrap.innerHTML = '<div class="items-grid-view ' + (isLarge ? 'large' : '') + '">' +
    data.map(item => `
      <div class="grid-item-card">
        ${item.image
          ? '<img class="grid-item-img" src="' + item.image + '" alt="' + item.nom + '">'
          : '<div class="grid-item-img-placeholder">' + getTypeEmoji(item.type) + '</div>'
        }
        <div class="grid-item-body">
          <div class="grid-item-nom">${item.nom}</div>
          <div class="grid-item-meta">
            <span class="badge ${getBadgeType(item.type)}" style="font-size:10px">${item.type}</span>
            <span style="font-weight:700;font-size:12px;color:var(--accent)">${formatPrice(item.prixAchat)}</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
            <span class="badge ${getLangBadge(item.langue)}" style="font-size:14px;padding:3px 6px">${getLangFlag(item.langue)}</span>
            <div style="display:flex;align-items:center;gap:4px">
              <button class="btn btn-ghost btn-sm btn-icon" onclick="changeStock('${item.id}',-1)">−</button>
              <span style="font-size:12px;font-weight:600;min-width:18px;text-align:center">${item.stock}</span>
              <button class="btn btn-ghost btn-sm btn-icon" onclick="changeStock('${item.id}',1)">+</button>
            </div>
          </div>
          <div style="display:flex;gap:4px;margin-top:8px">
            <button class="btn btn-ghost btn-sm" style="flex:1;font-size:11px" onclick="editSealed('${item.id}')">✏️ Modifier</button>
            <button class="btn btn-danger btn-sm btn-icon" onclick="deleteSealed('${item.id}')">🗑️</button>
          </div>
        </div>
      </div>
    `).join('') +
  '</div>';
}

function initSealedFAB() {
  let fab = document.getElementById('fab-sealed');
  if (!fab) {
    fab = document.createElement('button');
    fab.id = 'fab-sealed';
    fab.className = 'fab-add';
    fab.title = 'Ajouter un article';
    fab.textContent = '+';
    fab.onclick = openAddSealed;
    document.body.appendChild(fab);
  }
  // Observer pour afficher/masquer
  const addBtn = document.getElementById('btn-add-sealed');
  if (addBtn) {
    const obs = new IntersectionObserver(entries => {
      fab.classList.toggle('visible', !entries[0].isIntersecting);
    }, { threshold: 0 });
    obs.observe(addBtn);
  }
}

function renderSealedStats() {
  const total = APP.data.sealed.reduce((s,i) => s + i.stock, 0);
  const valAchat = getTotalSealedValue('achat');
  const hasMarche = APP.data.sealed.some(i => i.prixMarche);
  const valMarche = hasMarche ? getTotalSealedValue('marche') : null;
  const evoPct = hasMarche && valAchat > 0 ? ((valMarche - valAchat) / valAchat * 100).toFixed(1) : null;
  const evoSign = evoPct > 0 ? '+' : '';
  const evoColor = evoPct > 0 ? 'var(--positive)' : evoPct < 0 ? 'var(--negative)' : 'var(--text-3)';
  const itemsWithPL = APP.data.sealed.filter(i => i.prixMarche);
  const avgPL = itemsWithPL.length > 0
    ? itemsWithPL.reduce((s,i) => s + ((i.prixMarche - i.prixAchat) * i.stock), 0) / itemsWithPL.length
    : null;

  const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.innerHTML = val; };
  setEl('sealed-count', total);
  setEl('sealed-val-achat', formatPrice(valAchat));
  setEl('sealed-val-marche', valMarche
    ? formatPrice(valMarche) + (evoPct !== null ? '<div style="font-size:11px;font-weight:600;color:' + evoColor + ';margin-top:2px">' + evoSign + evoPct + '% vs achat</div>' : '')
    : '—');
  // P&L moyen en % avec euros entre parenthèses
  const avgPLPct = avgPL !== null && itemsWithPL.length > 0
    ? (itemsWithPL.reduce((s,i) => s + i.prixAchat, 0) / itemsWithPL.length)
    : null;
  const avgPLPctVal = avgPLPct ? ((avgPL / avgPLPct) * 100).toFixed(1) : null;
  setEl('sealed-avg-pl', avgPL !== null
    ? '<span style="color:' + (avgPL >= 0 ? 'var(--positive)' : 'var(--negative)') + '">' +
      (avgPL >= 0 ? '+' : '') + avgPLPctVal + '%' +
      '<span style="font-size:11px;opacity:0.7;margin-left:4px">(' + (avgPL >= 0 ? '+' : '') + formatPrice(avgPL) + ')</span></span>'
    : '—');
}

function getFilteredSealed() {
  let data = [...APP.data.sealed];
  const { search, type, langue } = sealedFilters;
  if (search) data = data.filter(i => i.nom.toLowerCase().includes(search.toLowerCase()));
  if (type) data = data.filter(i => i.type === type);
  if (langue) data = data.filter(i => i.langue === langue);
  if (sealedSort.key) data = sortTable(data, sealedSort.key, sealedSort.dir);
  return data;
}

function renderSealedTable() {
  const tbody = document.getElementById('sealed-tbody');
  if (!tbody) return;
  const data = getFilteredSealed();

  // Mettre à jour indicateurs de tri
  document.querySelectorAll('th[data-sort-sealed]').forEach(th => {
    th.classList.remove('sorted-asc','sorted-desc');
    if (th.dataset.sortSealed === sealedSort.key) {
      th.classList.add(sealedSort.dir === 'asc' ? 'sorted-asc' : 'sorted-desc');
    }
  });

  // Populate filters
  populateSealedFilters();

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9">
      <div class="empty-state"><div class="empty-state-icon">📭</div>
      <div class="empty-state-title">Aucun résultat</div>
      <div class="empty-state-sub">Ajustez vos filtres ou ajoutez un article</div></div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(item => {
    const diff = formatPriceDiff(item.prixAchat * item.stock, item.prixMarche ? item.prixMarche * item.stock : null);
    const imgHtml = item.image
      ? `<div style="position:relative;display:inline-block">
          <img src="${item.image}" alt="${item.nom}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--border);cursor:pointer" onclick="openSealedImgZoom('${item.id}')" onerror="this.style.display='none'">
          <button onclick="event.stopPropagation();deleteItemImage('${item.id}','sealed')" style="position:absolute;top:-4px;right:-4px;width:16px;height:16px;border-radius:50%;background:#FF453A;border:none;cursor:pointer;font-size:9px;color:#fff;display:flex;align-items:center;justify-content:center;line-height:1" title="Supprimer l'image">✕</button>
         </div>`
      : `<div class="td-img-placeholder" style="width:64px;height:64px;font-size:24px">${getTypeEmoji(item.type)}</div>`;

    return `<tr>
      <td>
        <div class="td-name">
          ${imgHtml}
          <span>${item.nom}</span>
        </div>
      </td>
      <td><span class="badge ${getBadgeType(item.type)}">${item.type}</span></td>
      <td><span class="badge ${getLangBadge(item.langue)}">${getLangFlag(item.langue)}</span></td>
      <td style="font-weight:600;text-align:center">
        <div style="display:flex;align-items:center;gap:6px;justify-content:center">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="changeStock('${item.id}', -1)" title="Retirer un exemplaire">−</button>
          <span style="min-width:20px;text-align:center">${item.stock}</span>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="changeStock('${item.id}', 1)" title="Ajouter un exemplaire">+</button>
        </div>
      </td>
      <td style="font-weight:600">${formatPrice(item.prixAchat)}</td>
      <td style="font-weight:600">${formatPrice(item.prixAchat * item.stock)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-weight:600;cursor:pointer;min-width:40px" onclick="inlineEditPrix('${item.id}','sealed',this)" title="Cliquer pour modifier">${item.prixMarche ? formatPrice(item.prixMarche) : '<span style=\"color:var(--text-3)\">— Saisir</span>'}</span>
          <a href="https://www.google.com/search?q=${encodeURIComponent(item.nom + ' pokemon prix')}" target="_blank" class="btn btn-ghost btn-sm btn-icon" title="Rechercher sur Google">🔍</a>
        </div>
      </td>
      <td>${diff}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="editSealed('${item.id}')" title="Modifier">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteSealed('${item.id}')" title="Supprimer">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function populateSealedFilters() {
  const typeSelect = document.getElementById('filter-sealed-type');
  const langSelect = document.getElementById('filter-sealed-lang');
  if (!typeSelect || !langSelect) return;

  const currentType = typeSelect.value;
  const currentLang = langSelect.value;

  const types = [...new Set(APP.data.sealed.map(i => i.type))].sort();
  const langs = [...new Set(APP.data.sealed.map(i => i.langue))].sort();

  typeSelect.innerHTML = '<option value="">Tous les types</option>' + types.map(t => `<option value="${t}" ${t === currentType ? 'selected' : ''}>${t}</option>`).join('');
  langSelect.innerHTML = '<option value="">Toutes langues</option>' + langs.map(l => `<option value="${l}" ${l === currentLang ? 'selected' : ''}>${l}</option>`).join('');

  typeSelect.value = currentType;
  langSelect.value = currentLang;
}

function getTypeEmoji(type) {
  const map = { ETB: '📦', Display: '📤', Booster: '🃏', Coffret: '🎁', Bundle: '🎴', Tinbox: '🥫', Pokebox: '📫', 'Duo pack': '2️⃣', 'Tri pack': '3️⃣', 'Produit dérivé': '🎮', 'Coffret Ultra Premium': '👑' };
  return map[type] || '📦';
}

function changeStock(id, delta) {
  const item = APP.data.sealed.find(i => i.id === id);
  if (!item) return;
  item.stock = Math.max(0, item.stock + delta);
  saveData();
  renderSealed();
  updateNavBadges();
}

function updatePrixMarche(id, collection) {
  const data = collection === 'sealed' ? APP.data.sealed : APP.data.graded;
  const item = data.find(i => i.id === id);
  if (!item) return;
  const val = prompt(`Prix marché actuel pour "${item.nom}" (en €) :`, item.prixMarche || '');
  if (val === null) return;
  const n = parseFloat(val.replace(',', '.'));
  if (isNaN(n)) { showToast('Prix invalide', 'error'); return; }
  item.prixMarche = n;
  saveData();
  renderPage(APP.currentPage);
  showToast('Prix mis à jour ✓', 'success');
}

async function fetchPrixAuto(id) {
  const item = APP.data.sealed.find(i => i.id === id);
  if (!item) return;
  showToast('Recherche du prix en cours...', 'info');
  // Note: Les APIs prix Pokémon sealed sont payantes. On essaie TCG Player API.
  showToast('Prix auto non disponible pour le scellé. Veuillez saisir manuellement.', 'info', 4000);
}

// ===== ADD / EDIT SEALED =====
function openAddSealed() {
  editingSealedId = null;
  document.getElementById('modal-sealed-title').textContent = 'Ajouter un article scellé';
  document.getElementById('form-sealed').reset();
  document.getElementById('sealed-img-preview').innerHTML = `<div style="font-size:32px;margin-bottom:8px">📦</div><div style="color:var(--text-3);font-size:12px">Cliquez pour ajouter une image</div>`;
  openModal('modal-sealed');
}

function editSealed(id) {
  editingSealedId = id;
  const item = APP.data.sealed.find(i => i.id === id);
  if (!item) return;
  document.getElementById('modal-sealed-title').textContent = 'Modifier l\'article';
  document.getElementById('sealed-nom').value = item.nom;
  document.getElementById('sealed-type').value = item.type;
  document.getElementById('sealed-langue').value = item.langue;
  document.getElementById('sealed-prix-achat').value = item.prixAchat;
  document.getElementById('sealed-prix-marche').value = item.prixMarche || '';
  document.getElementById('sealed-stock').value = item.stock;
  document.getElementById('sealed-notes').value = item.notes || '';
  const preview = document.getElementById('sealed-img-preview');
  if (item.image) {
    preview.innerHTML = `<img src="${item.image}" style="max-width:100%;max-height:200px;border-radius:8px">`;
  } else {
    preview.innerHTML = `<div style="font-size:32px;margin-bottom:8px">📦</div><div style="color:var(--text-3);font-size:12px">Cliquez pour ajouter une image</div>`;
  }
  openModal('modal-sealed');
}

function saveSealed() {
  const nom = document.getElementById('sealed-nom').value.trim();
  const type = document.getElementById('sealed-type').value;
  const langue = document.getElementById('sealed-langue').value;
  const prixAchat = parseFloat(document.getElementById('sealed-prix-achat').value) || 0;
  const prixMarche = parseFloat(document.getElementById('sealed-prix-marche').value) || null;
  const stock = parseInt(document.getElementById('sealed-stock').value) || 1;
  const notes = document.getElementById('sealed-notes').value.trim();
  if (!nom) { showToast('Le nom est requis', 'error'); return; }

  if (editingSealedId) {
    const item = APP.data.sealed.find(i => i.id === editingSealedId);
    if (item) {
      item.nom = nom; item.type = type; item.langue = langue;
      item.prixAchat = prixAchat; item.prixMarche = prixMarche;
      item.stock = stock; item.notes = notes;
    }
    showToast('Article modifié ✓', 'success');
  } else {
    APP.data.sealed.push({
      id: genId('s'),
      nom, type, langue, prixAchat, prixMarche, stock, notes,
      image: null, dateAjout: new Date().toISOString().slice(0, 10)
    });
    showToast('Article ajouté ✓', 'success');
  }

  saveData(); closeModal(); renderSealed(); updateNavBadges();
}

function deleteSealed(id) {
  if (!confirm('Supprimer cet article ?')) return;
  APP.data.sealed = APP.data.sealed.filter(i => i.id !== id);
  saveData(); renderSealed(); updateNavBadges();
  showToast('Article supprimé', 'info');
}

// Upload image sealed
function initSealedImageUpload() {
  const el = document.getElementById('sealed-img-preview');
  const inp = document.getElementById('sealed-img-input');
  if (!el || !inp) return;
  el.addEventListener('click', () => inp.click());
  inp.addEventListener('change', async () => {
    const file = inp.files[0];
    if (!file) return;
    const b64 = await imageToBase64(file);
    el.innerHTML = `<img src="${b64}" style="max-width:100%;max-height:200px;border-radius:8px">`;
    if (editingSealedId) {
      const item = APP.data.sealed.find(i => i.id === editingSealedId);
      if (item) { item.image = b64; saveData(); }
    } else {
      el.dataset.pendingImage = b64;
    }
  });
}

// Init listeners quand DOM prêt
document.addEventListener('DOMContentLoaded', () => {
  initSealedImageUpload();

  document.getElementById('search-sealed')?.addEventListener('input', e => {
    sealedFilters.search = e.target.value;
    renderSealedTable();
  });

  document.getElementById('filter-sealed-type')?.addEventListener('change', e => {
    sealedFilters.type = e.target.value;
    renderSealedTable();
  });

  document.getElementById('filter-sealed-lang')?.addEventListener('change', e => {
    sealedFilters.langue = e.target.value;
    renderSealedTable();
  });

  // Tri par colonne
  document.querySelectorAll('[data-sort-sealed]').forEach(th => {
    th.addEventListener('click', () => {
      handleSort(th.dataset.sortSealed, sealedSort, renderSealedTable);
    });
  });

  document.getElementById('btn-add-sealed')?.addEventListener('click', openAddSealed);
  document.getElementById('btn-save-sealed')?.addEventListener('click', saveSealed);
});

function inlineEditPrix(id, collection, el) {
  const data = collection === 'sealed' ? APP.data.sealed : APP.data.graded;
  const item = data.find(i => i.id === id);
  if (!item) return;
  const current = item.prixMarche || '';
  const input = document.createElement('input');
  input.type = 'number';
  input.step = '0.01';
  input.min = '0';
  input.value = current;
  input.style.cssText = 'width:80px;padding:3px 6px;border-radius:6px;border:1px solid var(--accent);background:var(--input-bg);color:var(--text);font-size:13px;font-weight:600;outline:none';
  el.replaceWith(input);
  input.focus();
  input.select();
  const save = () => {
    const val = parseFloat(input.value.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      item.prixMarche = val;
      saveData();
      showToast('Prix mis à jour ✓', 'success');
    }
    renderSealedTable();
  };
  input.addEventListener('blur', save);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { input.blur(); } if (e.key === 'Escape') { renderSealedTable(); } });
}

// ===== APPLY IMAGE URL =====
function applyImageUrl(type) {
  const urlMap = { sealed: 'sealed-img-url', graded: 'graded-img-url', chase: 'chase-img-url' };
  const previewMap = { sealed: 'sealed-img-preview', graded: 'graded-photo-preview', chase: 'chase-img-preview' };
  const urlInput = document.getElementById(urlMap[type]);
  const preview = document.getElementById(previewMap[type]);
  if (!urlInput || !preview) return;
  const url = urlInput.value.trim();
  if (!url || !url.startsWith('http')) { showToast('URL invalide — doit commencer par https://', 'error'); return; }

  // Tester que l'image se charge bien
  const img = new Image();
  img.onload = () => {
    preview.innerHTML = '<img src="' + url + '" style="max-width:100%;max-height:200px;border-radius:8px;object-fit:cover">';
    preview.classList.add('has-image');
    preview.dataset.pendingImage = url;
    // Si on est en mode édition, sauvegarder directement
    if (type === 'sealed' && typeof editingSealedId !== 'undefined' && editingSealedId) {
      const item = APP.data.sealed.find(i => i.id === editingSealedId);
      if (item) { item.image = url; saveData(); }
    } else if (type === 'graded' && typeof editingGradedId !== 'undefined' && editingGradedId) {
      const item = APP.data.graded.find(i => i.id === editingGradedId);
      if (item) { item.photo = url; saveData(); }
    } else if (type === 'chase' && typeof editingChaseId !== 'undefined' && editingChaseId) {
      const item = APP.data.chase.find(i => i.id === editingChaseId);
      if (item) { item.image = url; saveData(); }
    }
    showToast('Image appliquée ✓', 'success');
    urlInput.value = '';
  };
  img.onerror = () => { showToast("Impossible de charger cette image — vérifie l'URL", 'error'); };
  img.src = url;
}

function openSealedImgZoom(id) {
  const item = APP.data.sealed.find(i => i.id === id);
  if (!item || !item.image) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:20px';
  overlay.innerHTML = '<img src="' + item.image + '" style="max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 20px 80px rgba(0,0,0,0.8);object-fit:contain">';
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}
