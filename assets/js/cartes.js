// ===== CARTES GRADÉES =====
let gradedSort = { key: 'nom', dir: 'asc' };
let gradedFilters = { search: '', gradeur: '', note: '', langue: '' };
let editingGradedId = null;

function renderGraded() {
  renderGradedStats();
  renderGradedTable();
}

function renderGradedStats() {
  const valAchat = getTotalGradedValue('achat');
  const valMarche = APP.data.graded.some(i => i.prixMarche) ? getTotalGradedValue('marche') : null;
  const psa = APP.data.graded.filter(i => i.gradeur === 'PSA').length;
  const note10 = APP.data.graded.filter(i => parseFloat(i.note) === 10).length;
  document.getElementById('graded-count').textContent = APP.data.graded.length;
  document.getElementById('graded-val-achat').textContent = formatPrice(valAchat);
  document.getElementById('graded-val-marche').textContent = valMarche ? formatPrice(valMarche) : '—';
  document.getElementById('graded-psa').textContent = psa;
  document.getElementById('graded-10').textContent = note10;
}

function getFilteredGraded() {
  let data = [...APP.data.graded];
  const { search, gradeur, note, langue } = gradedFilters;
  if (search) data = data.filter(i => i.nom.toLowerCase().includes(search.toLowerCase()));
  if (gradeur) data = data.filter(i => i.gradeur === gradeur);
  if (langue) data = data.filter(i => i.langue === langue);
  if (note) {
    if (note === '10') data = data.filter(i => parseFloat(i.note) === 10);
    else if (note === '9+') data = data.filter(i => parseFloat(i.note) >= 9);
    else if (note === 'ec') data = data.filter(i => isNaN(parseFloat(i.note)));
  }
  if (gradedSort.key) data = sortTable(data, gradedSort.key, gradedSort.dir);
  return data;
}

function renderGradedTable() {
  const tbody = document.getElementById('graded-tbody');
  if (!tbody) return;
  const data = getFilteredGraded();
  populateGradedFilters();

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9">
      <div class="empty-state"><div class="empty-state-icon">🏆</div>
      <div class="empty-state-title">Aucune carte</div>
      <div class="empty-state-sub">Ajustez vos filtres ou ajoutez une carte gradée</div></div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(item => {
    const diff = formatPriceDiff(item.prixAchat, item.prixMarche);
    const photoHtml = item.photo
      ? `<img src="${item.photo}" alt="${item.nom}" style="width:48px;height:68px;object-fit:cover;border-radius:6px;border:1px solid var(--border);cursor:pointer" onclick="openPhotoZoom('${item.id}')">`
      : `<div style="width:48px;height:68px;border-radius:6px;border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;background:var(--bg-2)" onclick="triggerPhotoUpload('${item.id}')" title="Ajouter une photo">📷</div>`;

    const noteVal = parseFloat(item.note);
    let noteBadgeClass = 'badge-note-ec';
    if (noteVal === 10) noteBadgeClass = 'badge-note-10';
    else if (noteVal >= 9) noteBadgeClass = 'badge-note-9';
    else if (noteVal >= 8) noteBadgeClass = 'badge-note-8';

    return `<tr>
      <td style="padding:8px 12px">${photoHtml}</td>
      <td>
        <div style="font-weight:600;font-size:13px;max-width:200px">${item.nom}</div>
        ${item.numero ? `<div style="font-size:11px;color:var(--text-3);margin-top:2px">N° ${item.numero}</div>` : ''}
        ${item.notes ? `<div style="font-size:11px;color:var(--text-3);margin-top:2px;font-style:italic">${item.notes}</div>` : ''}
      </td>
      <td>
        <span class="badge ${noteBadgeClass}">${item.note || '—'}</span>
      </td>
      <td><span class="badge badge-type">${item.gradeur}</span></td>
      <td><span class="badge ${getLangBadge(item.langue)}">${item.langue}</span></td>
      <td style="font-weight:600">${formatPrice(item.prixAchat)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          ${item.prixMarche ? `<span style="font-weight:600">${formatPrice(item.prixMarche)}</span>` : '<span style="color:var(--text-3)">—</span>'}
          <button class="btn btn-ghost btn-sm btn-icon" onclick="updatePrixMarche('${item.id}', 'graded')" title="Saisir manuellement">✏️</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="window.fetchPrixMarcheAuto && window.fetchPrixMarcheAuto('${item.id}', 'graded')" title="Chercher le prix auto">🔄</button>
        </div>
      </td>
      <td>${diff}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="editGraded('${item.id}')" title="Modifier">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteGraded('${item.id}')" title="Supprimer">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function populateGradedFilters() {
  const gEl = document.getElementById('filter-graded-gradeur');
  const lEl = document.getElementById('filter-graded-lang');
  if (!gEl || !lEl) return;
  const cv = gEl.value, lv = lEl.value;
  const gradeurs = [...new Set(APP.data.graded.map(i => i.gradeur))].sort();
  const langs = [...new Set(APP.data.graded.map(i => i.langue))].sort();
  gEl.innerHTML = '<option value="">Tous gradeurs</option>' + gradeurs.map(g => `<option value="${g}" ${g === cv ? 'selected' : ''}>${g}</option>`).join('');
  lEl.innerHTML = '<option value="">Toutes langues</option>' + langs.map(l => `<option value="${l}" ${l === lv ? 'selected' : ''}>${l}</option>`).join('');
  gEl.value = cv; lEl.value = lv;
}

function openAddGraded() {
  editingGradedId = null;
  document.getElementById('modal-graded-title').textContent = 'Ajouter une carte gradée';
  document.getElementById('form-graded').reset();
  document.getElementById('graded-photo-preview').innerHTML = `<div style="font-size:40px;margin-bottom:8px">📷</div><div style="color:var(--text-3);font-size:12px">Cliquez pour uploader votre photo<br><small style="color:var(--text-3)">Importante : doit montrer le numéro d'identification</small></div>`;
  openModal('modal-graded');
}

function editGraded(id) {
  editingGradedId = id;
  const item = APP.data.graded.find(i => i.id === id);
  if (!item) return;
  document.getElementById('modal-graded-title').textContent = 'Modifier la carte';
  document.getElementById('graded-nom').value = item.nom;
  document.getElementById('graded-note').value = item.note;
  document.getElementById('graded-gradeur').value = item.gradeur;
  document.getElementById('graded-langue').value = item.langue;
  document.getElementById('graded-prix-achat').value = item.prixAchat;
  document.getElementById('graded-prix-marche').value = item.prixMarche || '';
  document.getElementById('graded-numero').value = item.numero || '';
  document.getElementById('graded-notes').value = item.notes || '';
  const preview = document.getElementById('graded-photo-preview');
  if (item.photo) {
    preview.innerHTML = `<img src="${item.photo}" style="max-width:100%;max-height:200px;border-radius:8px;object-fit:cover">`;
    preview.classList.add('has-image');
  } else {
    preview.innerHTML = `<div style="font-size:40px;margin-bottom:8px">📷</div><div style="color:var(--text-3);font-size:12px">Cliquez pour uploader votre photo</div>`;
    preview.classList.remove('has-image');
  }
  openModal('modal-graded');
}

function saveGraded() {
  const nom = document.getElementById('graded-nom').value.trim();
  const note = document.getElementById('graded-note').value.trim();
  const gradeur = document.getElementById('graded-gradeur').value.trim();
  const langue = document.getElementById('graded-langue').value;
  const prixAchat = parseFloat(document.getElementById('graded-prix-achat').value) || 0;
  const prixMarche = parseFloat(document.getElementById('graded-prix-marche').value) || null;
  const numero = document.getElementById('graded-numero').value.trim();
  const notes = document.getElementById('graded-notes').value.trim();
  if (!nom) { showToast('Le nom est requis', 'error'); return; }

  const pendingPhoto = document.getElementById('graded-photo-preview').dataset.pendingPhoto || null;

  if (editingGradedId) {
    const item = APP.data.graded.find(i => i.id === editingGradedId);
    if (item) {
      item.nom = nom; item.note = note; item.gradeur = gradeur; item.langue = langue;
      item.prixAchat = prixAchat; item.prixMarche = prixMarche;
      item.numero = numero; item.notes = notes;
      if (pendingPhoto) item.photo = pendingPhoto;
    }
    showToast('Carte modifiée ✓', 'success');
  } else {
    APP.data.graded.push({
      id: genId('g'), nom, note, gradeur, langue, prixAchat, prixMarche,
      photo: pendingPhoto, numero, notes,
      dateAjout: new Date().toISOString().slice(0, 10)
    });
    showToast('Carte ajoutée ✓', 'success');
  }

  saveData(); closeModal(); renderGraded(); updateNavBadges();
}

function deleteGraded(id) {
  if (!confirm('Supprimer cette carte ?')) return;
  APP.data.graded = APP.data.graded.filter(i => i.id !== id);
  saveData(); renderGraded(); updateNavBadges();
  showToast('Carte supprimée', 'info');
}

function triggerPhotoUpload(id) {
  editingGradedId = id;
  openModal('modal-graded');
  setTimeout(() => document.getElementById('graded-photo-input')?.click(), 300);
}

function openPhotoZoom(id) {
  const item = APP.data.graded.find(i => i.id === id);
  if (!item || !item.photo) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:20px';
  overlay.innerHTML = `<img src="${item.photo}" style="max-width:100%;max-height:90vh;border-radius:12px;box-shadow:0 20px 80px rgba(0,0,0,0.8)">`;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}

function initGradedImageUpload() {
  const preview = document.getElementById('graded-photo-preview');
  const inp = document.getElementById('graded-photo-input');
  if (!preview || !inp) return;

  preview.addEventListener('click', () => inp.click());
  inp.addEventListener('change', async () => {
    const file = inp.files[0];
    if (!file) return;
    const b64 = await imageToBase64(file);
    preview.innerHTML = `<img src="${b64}" style="max-width:100%;max-height:200px;border-radius:8px;object-fit:cover">`;
    preview.classList.add('has-image');
    preview.dataset.pendingPhoto = b64;
    if (editingGradedId) {
      const item = APP.data.graded.find(i => i.id === editingGradedId);
      if (item) { item.photo = b64; saveData(); renderGradedTable(); }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initGradedImageUpload();

  document.getElementById('search-graded')?.addEventListener('input', e => {
    gradedFilters.search = e.target.value; renderGradedTable();
  });
  document.getElementById('filter-graded-gradeur')?.addEventListener('change', e => {
    gradedFilters.gradeur = e.target.value; renderGradedTable();
  });
  document.getElementById('filter-graded-lang')?.addEventListener('change', e => {
    gradedFilters.langue = e.target.value; renderGradedTable();
  });
  document.getElementById('filter-graded-note')?.addEventListener('change', e => {
    gradedFilters.note = e.target.value; renderGradedTable();
  });
  document.querySelectorAll('[data-sort-graded]').forEach(th => {
    th.addEventListener('click', () => handleSort(th.dataset.sortGraded, gradedSort, renderGradedTable));
  });
  document.getElementById('btn-add-graded')?.addEventListener('click', openAddGraded);
  document.getElementById('btn-save-graded')?.addEventListener('click', saveGraded);
});
