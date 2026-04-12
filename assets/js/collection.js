// ===== COLLECTION SCELLÉE =====
let sealedSort = { key: 'nom', dir: 'asc' };
let sealedFilters = { search: '', type: '', langue: '' };
let editingSealedId = null;

function renderSealed() {
  renderSealedStats();
  renderSealedTable();
}

function renderSealedStats() {
  const total = APP.data.sealed.reduce((s, i) => s + i.stock, 0);
  const valAchat = getTotalSealedValue('achat');
  const valMarche = APP.data.sealed.some(i => i.prixMarche) ? getTotalSealedValue('marche') : null;
  const types = new Set(APP.data.sealed.map(i => i.type)).size;
  document.getElementById('sealed-count').textContent = total;
  document.getElementById('sealed-val-achat').textContent = formatPrice(valAchat);
  document.getElementById('sealed-val-marche').textContent = valMarche ? formatPrice(valMarche) : '—';
  document.getElementById('sealed-types').textContent = types;
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
      ? `<img src="${item.image}" alt="${item.nom}" onerror="this.style.display='none'">`
      : `<div class="td-img-placeholder">${getTypeEmoji(item.type)}</div>`;

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
          ${item.prixMarche ? `<span style="font-weight:600">${formatPrice(item.prixMarche)}</span>` : '<span style="color:var(--text-3)">—</span>'}
          <button class="btn btn-ghost btn-sm btn-icon" onclick="updatePrixMarche('${item.id}', 'sealed')" title="Mettre à jour le prix">✏️</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="fetchPrixAuto('${item.id}')" title="Chercher le prix auto">🔄</button>
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
