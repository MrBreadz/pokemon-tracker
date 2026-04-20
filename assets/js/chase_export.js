// ===== CHASE CARDS =====
let editingChaseId = null;

function renderChase() {
  const grid = document.getElementById('chase-grid');
  if (!grid) return;
  grid.innerHTML = APP.data.chase.map(item => `
    <div class="chase-card">
      <div class="chase-img" onclick="openPhotoZoomChase('${item.id}')" style="${item.image ? 'cursor:zoom-in' : ''}">
        ${item.image
          ? `<img src="${item.image}" alt="${item.nom}">`
          : '<span style="font-size:48px">🃏</span>'
        }
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;flex:1">
        <div class="chase-name">${item.nom}</div>
        <span class="badge ${getChaseStatutBadge(item.statut)}">${getChaseStatutLabel(item.statut)}</span>
        ${item.notes ? `<div style="font-size:11px;color:var(--text-3);font-style:italic;line-height:1.4">${item.notes}</div>` : ''}
      </div>
      <div style="display:flex;gap:6px;margin-top:8px">
        <button class="btn btn-ghost btn-sm" style="flex:1" onclick="openEditChase('${item.id}')">✏️ Modifier</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteChase('${item.id}')">🗑️</button>
      </div>
    </div>
  `).join('') + `
    <div class="chase-card" style="border-style:dashed;cursor:pointer;align-items:center;justify-content:center;text-align:center;min-height:240px;gap:8px" onclick="openAddChase()">
      <div style="font-size:36px">+</div>
      <div style="color:var(--text-3);font-size:13px;font-weight:600">Ajouter une carte</div>
    </div>
  `;
}

function getChaseStatutBadge(statut) {
  return statut === 'Gradée' ? 'badge-note-10' : 'badge-type';
}
function getChaseStatutLabel(statut) {
  return statut === 'Gradée' ? 'Gradée' : 'Loose';
}

function openAddChase() {
  editingChaseId = null;
  document.getElementById('modal-chase-title').textContent = 'Ajouter une chase card';
  document.getElementById('form-chase').reset();
  const preview = document.getElementById('chase-img-preview');
  preview.innerHTML = '<span style="font-size:36px">🃏</span><div style="color:var(--text-3);font-size:12px;margin-top:8px">Cliquez pour ajouter une image</div>';
  preview.classList.remove('has-image');
  delete preview.dataset.pendingImage;
  openModal('modal-chase');
}

function openEditChase(id) {
  editingChaseId = id;
  const item = APP.data.chase.find(c => c.id === id);
  if (!item) return;
  document.getElementById('modal-chase-title').textContent = 'Modifier la chase card';
  document.getElementById('chase-nom').value = item.nom;
  document.getElementById('chase-statut').value = item.statut;
  document.getElementById('chase-notes').value = item.notes || '';
  const preview = document.getElementById('chase-img-preview');
  if (item.image) {
    preview.innerHTML = '<img src="' + item.image + '" style="max-width:100%;max-height:200px;border-radius:8px;object-fit:cover">';
    preview.classList.add('has-image');
  } else {
    preview.innerHTML = '<span style="font-size:36px">🃏</span><div style="color:var(--text-3);font-size:12px;margin-top:8px">Cliquez pour ajouter une image</div>';
    preview.classList.remove('has-image');
  }
  delete preview.dataset.pendingImage;
  openModal('modal-chase');
}

function saveChase() {
  const nom = document.getElementById('chase-nom').value.trim();
  const statut = document.getElementById('chase-statut').value;
  const notes = document.getElementById('chase-notes').value.trim();
  if (!nom) { showToast('Le nom est requis', 'error'); return; }
  const preview = document.getElementById('chase-img-preview');
  const pendingImage = preview.dataset.pendingImage || null;
  if (editingChaseId) {
    const item = APP.data.chase.find(c => c.id === editingChaseId);
    if (item) {
      item.nom = nom; item.statut = statut; item.notes = notes;
      if (pendingImage) item.image = pendingImage;
    }
    showToast('Chase card modifiée ✓', 'success');
  } else {
    APP.data.chase.push({ id: genId('c'), nom, statut, notes, image: pendingImage });
    showToast('Chase card ajoutée ✓', 'success');
  }
  saveData(); closeModal(); renderChase(); updateNavBadges();
}

function deleteChase(id) {
  if (!confirm('Supprimer cette carte de la wish list ?')) return;
  APP.data.chase = APP.data.chase.filter(c => c.id !== id);
  saveData(); renderChase(); updateNavBadges();
  showToast('Carte supprimée', 'info');
}

function openPhotoZoomChase(id) {
  const item = APP.data.chase.find(c => c.id === id);
  if (!item || !item.image) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:20px';
  overlay.innerHTML = '<img src="' + item.image + '" style="max-width:100%;max-height:90vh;border-radius:12px;box-shadow:0 20px 80px rgba(0,0,0,0.8)">';
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}

function initChaseImageUpload() {
  const preview = document.getElementById('chase-img-preview');
  const inp = document.getElementById('chase-img-input');
  if (!preview || !inp) return;
  preview.addEventListener('click', () => inp.click());
  inp.addEventListener('change', async () => {
    const file = inp.files[0];
    if (!file) return;
    const b64 = await imageToBase64(file);
    preview.innerHTML = '<img src="' + b64 + '" style="max-width:100%;max-height:200px;border-radius:8px;object-fit:cover">';
    preview.classList.add('has-image');
    preview.dataset.pendingImage = b64;
  });
}

// ===== EXPORT EXCEL =====
async function exportToExcel() {
  showToast('Génération du fichier Excel...', 'info');
  const { utils, writeFile } = XLSX;
  const wb = utils.book_new();

  const sealedData = [
    ['Nom', 'Type', 'Langue', 'Stock', 'Prix unitaire (€)', 'Valeur achat (€)', 'Prix marché unitaire (€)', 'Valeur marché (€)', 'P&L (€)', 'P&L (%)', 'Notes', 'Date ajout'],
    ...APP.data.sealed.map(i => {
      const valAchat = i.prixAchat * i.stock;
      const valMarche = i.prixMarche ? i.prixMarche * i.stock : null;
      const pl = valMarche ? valMarche - valAchat : null;
      const plPct = pl && valAchat > 0 ? ((pl / valAchat) * 100).toFixed(1) + '%' : null;
      return [i.nom, i.type, i.langue, i.stock, i.prixAchat, valAchat, i.prixMarche || '', valMarche || '', pl || '', plPct || '', i.notes || '', i.dateAjout];
    })
  ];
  const ws1 = utils.aoa_to_sheet(sealedData);
  ws1['!cols'] = [{wch:40},{wch:20},{wch:10},{wch:8},{wch:15},{wch:16},{wch:22},{wch:16},{wch:12},{wch:10},{wch:25},{wch:12}];
  utils.book_append_sheet(wb, ws1, 'Collection Scellée');

  const gradedData = [
    ['Nom', 'Note', 'Gradeur', 'Langue', 'N° Certification', 'Prix achat (€)', 'Prix marché (€)', 'P&L (€)', 'P&L (%)', 'Notes', 'Date ajout'],
    ...APP.data.graded.map(i => {
      const pl = i.prixMarche ? i.prixMarche - i.prixAchat : null;
      const plPct = pl && i.prixAchat > 0 ? ((pl / i.prixAchat) * 100).toFixed(1) + '%' : null;
      return [i.nom, i.note, i.gradeur, i.langue, i.numero || '', i.prixAchat, i.prixMarche || '', pl || '', plPct || '', i.notes || '', i.dateAjout];
    })
  ];
  const ws2 = utils.aoa_to_sheet(gradedData);
  ws2['!cols'] = [{wch:40},{wch:8},{wch:15},{wch:10},{wch:20},{wch:15},{wch:15},{wch:12},{wch:10},{wch:25},{wch:12}];
  utils.book_append_sheet(wb, ws2, 'Cartes Gradées');

  const chaseData = [
    ['Nom', 'Statut', 'Notes'],
    ...APP.data.chase.map(c => [c.nom, c.statut, c.notes || ''])
  ];
  const ws3 = utils.aoa_to_sheet(chaseData);
  ws3['!cols'] = [{wch:40},{wch:20},{wch:30}];
  utils.book_append_sheet(wb, ws3, 'Chase Cards');

  const resumeData = [
    ['RÉSUMÉ COLLECTION', '', ''],
    ['', '', ''],
    ['Catégorie', 'Valeur achat (€)', 'Valeur marché (€)'],
    ['Scellés', getTotalSealedValue('achat'), getTotalSealedValue('marche') || ''],
    ['Cartes gradées', getTotalGradedValue('achat'), getTotalGradedValue('marche') || ''],
    ['TOTAL', getTotalValue('achat'), ''],
    ['', '', ''],
    ["Nombre d'items scellés", APP.data.sealed.reduce((s, i) => s + i.stock, 0), ''],
    ['Nombre de cartes gradées', APP.data.graded.length, ''],
    ['Chase cards', APP.data.chase.length, ''],
    ['', '', ''],
    ['Date export', new Date().toLocaleDateString('fr-FR'), ''],
  ];
  const ws4 = utils.aoa_to_sheet(resumeData);
  ws4['!cols'] = [{wch:30},{wch:18},{wch:18}];
  utils.book_append_sheet(wb, ws4, 'Résumé');

  const date = new Date().toISOString().slice(0, 10);
  writeFile(wb, 'Pokemon_Collection_' + date + '.xlsx');
  showToast('Export Excel téléchargé ✓', 'success');
}

document.addEventListener('DOMContentLoaded', () => {
  initChaseImageUpload();
  document.getElementById('btn-save-chase')?.addEventListener('click', saveChase);
  document.getElementById('btn-export')?.addEventListener('click', exportToExcel);
});

// ===== IMPORT EXCEL =====
let importParsedData = null;

function initImport() {
  const btn = document.getElementById('btn-import');
  const inp = document.getElementById('import-file-input');
  const confirmBtn = document.getElementById('btn-confirm-import');

  btn?.addEventListener('click', () => inp?.click());

  inp?.addEventListener('change', async () => {
    const file = inp.files[0];
    if (!file) return;
    try {
      await parseImportFile(file);
    } catch(e) {
      showToast('Erreur de lecture du fichier', 'error');
      console.error(e);
    }
  });

  confirmBtn?.addEventListener('click', confirmImport);
}

async function parseImportFile(file) {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });

  importParsedData = null;
  const preview = document.getElementById('import-preview');
  const confirmBtn = document.getElementById('btn-confirm-import');

  // Chercher les onglets connus
  const sealedSheet = wb.SheetNames.find(n => n.toLowerCase().includes('scell'));
  const gradedSheet = wb.SheetNames.find(n => n.toLowerCase().includes('grad'));
  const chaseSheet  = wb.SheetNames.find(n => n.toLowerCase().includes('chase'));

  if (!sealedSheet && !gradedSheet) {
    preview.innerHTML = '<div style="color:var(--negative);font-size:13px;padding:12px">❌ Fichier non reconnu — doit contenir les onglets "Scellés" et/ou "Gradées"</div>';
    confirmBtn.disabled = true;
    return;
  }

  const parsed = { sealed: [], graded: [], chase: [] };

  // Parser scellés
  if (sealedSheet) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sealedSheet]);
    parsed.sealed = rows.map((row, i) => ({
      id: 's_imp_' + i,
      nom:        row['Nom'] || row['nom'] || '',
      type:       row['Type'] || row['type'] || 'Booster',
      langue:     row['Langue'] || row['langue'] || 'FR',
      stock:      parseInt(row['Stock'] || row['stock']) || 1,
      prixAchat:  parseFloat(row['Prix unitaire (€)'] || row['Prix achat'] || row['prixAchat']) || 0,
      prixMarche: parseFloat(row['Prix marché unitaire (€)'] || row['Prix marché'] || row['prixMarche']) || null,
      notes:      row['Notes'] || row['notes'] || '',
      image:      null,
      dateAjout:  row['Date ajout'] || new Date().toISOString().slice(0,10),
    })).filter(i => i.nom);
  }

  // Parser gradées
  if (gradedSheet) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[gradedSheet]);
    parsed.graded = rows.map((row, i) => ({
      id: 'g_imp_' + i,
      nom:        row['Nom'] || row['nom'] || '',
      note:       String(row['Note'] || row['note'] || ''),
      gradeur:    row['Gradeur'] || row['gradeur'] || '',
      langue:     row['Langue'] || row['langue'] || 'FR',
      prixAchat:  parseFloat(row['Prix achat (€)'] || row['Prix achat'] || row['prixAchat']) || 0,
      prixMarche: parseFloat(row['Prix marché (€)'] || row['Prix marché'] || row['prixMarche']) || null,
      numero:     String(row['N° Certification'] || row['numero'] || ''),
      notes:      row['Notes'] || row['notes'] || '',
      photo:      null,
      dateAjout:  row['Date ajout'] || new Date().toISOString().slice(0,10),
    })).filter(i => i.nom);
  }

  // Parser chase
  if (chaseSheet) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[chaseSheet]);
    parsed.chase = rows.map((row, i) => ({
      id: 'c_imp_' + i,
      nom:    row['Nom'] || row['nom'] || '',
      statut: row['Statut'] || row['statut'] || 'À obtenir',
      notes:  row['Notes'] || row['notes'] || '',
      image:  null,
    })).filter(i => i.nom);
  }

  importParsedData = parsed;
  confirmBtn.disabled = false;

  // Afficher aperçu
  preview.innerHTML = `
    <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:12px">📋 Aperçu du fichier :</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;justify-content:space-between;padding:10px 14px;background:var(--bg-2);border-radius:8px;border:1px solid var(--border)">
        <span style="color:var(--text-2)">📦 Scellés</span>
        <span style="font-weight:700;color:var(--accent)">${parsed.sealed.length} items</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 14px;background:var(--bg-2);border-radius:8px;border:1px solid var(--border)">
        <span style="color:var(--text-2)">🏆 Cartes gradées</span>
        <span style="font-weight:700;color:var(--accent)">${parsed.graded.length} cartes</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 14px;background:var(--bg-2);border-radius:8px;border:1px solid var(--border)">
        <span style="color:var(--text-2)">🌟 Chase cards</span>
        <span style="font-weight:700;color:var(--accent)">${parsed.chase.length} cartes</span>
      </div>
    </div>
  `;

  openModal('modal-import');
}

function confirmImport() {
  if (!importParsedData) return;

  APP.data.sealed = importParsedData.sealed;
  APP.data.graded = importParsedData.graded;
  if (importParsedData.chase.length > 0) APP.data.chase = importParsedData.chase;

  saveData();
  closeModal();
  renderPage(APP.currentPage);
  updateNavBadges();
  importParsedData = null;

  // Reset input
  const inp = document.getElementById('import-file-input');
  if (inp) inp.value = '';

  showToast('Import réussi ✓ — ' + APP.data.sealed.length + ' scellés, ' + APP.data.graded.length + ' cartes', 'success', 5000);
}

document.addEventListener('DOMContentLoaded', () => {
  initImport();
});
