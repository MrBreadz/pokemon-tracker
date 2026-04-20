// ===== FIREBASE v1.9 =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlKQmpxYxfehBegx5uz_89jzZZHGEiawg",
  authDomain: "pokemon-tracker-f4f67.firebaseapp.com",
  databaseURL: "https://pokemon-tracker-f4f67-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pokemon-tracker-f4f67",
  storageBucket: "pokemon-tracker-f4f67.firebasestorage.app",
  messagingSenderId: "538871749202",
  appId: "1:538871749202:web:74faa714a1dcd29e065d8b"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);

function setSyncStatus(status) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  const s = {
    connecting: '🔄 Connexion...',
    synced:     '☁️ Synchronisé',
    saving:     '💾 Sauvegarde...',
    offline:    '⚠️ Hors ligne',
  };
  const colors = { connecting:'var(--text-3)', synced:'var(--positive)', saving:'var(--accent)', offline:'var(--negative)' };
  el.innerHTML = '<span style="color:' + (colors[status]||'var(--text-3)') + ';font-size:12px;font-weight:500">' + (s[status]||status) + '</span>';
}


// Migration statuts chase : normaliser vers Gradée / Loose
function migrateChaseStatuts() {
  let changed = false;
  APP.data.chase = APP.data.chase.map(item => {
    const s = item.statut || '';
    if (s !== 'Gradée' && s !== 'Loose') {
      changed = true;
      return { ...item, statut: s === 'Gradée' ? 'Gradée' : 'Loose' };
    }
    return item;
  });
  if (changed) saveData();
}

// Sauvegarde avec debounce
let saveTimer = null;
window.firebaseSave = function() {
  clearTimeout(saveTimer);
  setSyncStatus('saving');
  saveTimer = setTimeout(async () => {
    try {
      await set(ref(db, 'collection'), {
        sealed: APP.data.sealed,
        graded: APP.data.graded,
        chase:  APP.data.chase,
        lastUpdated: new Date().toISOString(),
      });
      setSyncStatus('synced');
    } catch(e) {
      console.error('Firebase save error:', e);
      setSyncStatus('offline');
    }
  }, 800);
};

// Chargement depuis Firebase
async function loadFromFirebase() {
  try {
    const snap = await get(ref(db, 'collection'));
    if (snap.exists()) {
      const remote = snap.val();
      // PROTECTION : ne charger que si Firebase a plus de données que le local
      // Compter les items Firebase
      const fbSealed = Array.isArray(remote.sealed) ? remote.sealed.length : 0;
      const fbGraded = Array.isArray(remote.graded) ? remote.graded.length : 0;
      const localSealed = Array.isArray(APP.data.sealed) ? APP.data.sealed.length : 0;
      const localGraded = Array.isArray(APP.data.graded) ? APP.data.graded.length : 0;

      // Si Firebase a des vraies données (pas juste les initiales vides ou moins que local)
      // On fait confiance à Firebase s'il a des données ET que lastUpdated existe
      const hasRealData = remote.lastUpdated && (fbSealed > 0 || fbGraded > 0);

      if (hasRealData) {
        if (Array.isArray(remote.sealed)) APP.data.sealed = remote.sealed;
        if (Array.isArray(remote.graded)) APP.data.graded = remote.graded;
        if (Array.isArray(remote.chase))  APP.data.chase  = remote.chase;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(APP.data));
        setSyncStatus('synced');
        renderPage(APP.currentPage);
        updateNavBadges();
        showToast('Collection chargée ☁️', 'success');
      } else {
        // Firebase vide ou corrompu → pousser les données locales
        await window.firebaseSave();
      }
    } else {
      // Première utilisation : pousser les données locales
      await window.firebaseSave();
    }
  } catch(e) {
    console.error('Firebase load error:', e);
    setSyncStatus('offline');
    showToast('Mode local activé', 'info');
  }
}

// SAUVEGARDE EXCEL JOURNALIÈRE
async function autoBackupExcel() {
  const today = new Date().toISOString().slice(0,10);
  const lastBackup = localStorage.getItem('pkm_last_backup');
  if (lastBackup === today) return; // Déjà fait aujourd'hui

  // Attendre que les données soient chargées
  await new Promise(r => setTimeout(r, 3000));

  try {
    const { utils, writeFile } = XLSX;
    const wb = utils.book_new();

    const sealedData = [
      ['Nom','Type','Langue','Stock','Prix achat','Valeur achat','Prix marché','Notes'],
      ...APP.data.sealed.map(i => [i.nom,i.type,i.langue,i.stock,i.prixAchat,i.prixAchat*i.stock,i.prixMarche||'',i.notes||''])
    ];
    utils.book_append_sheet(wb, utils.aoa_to_sheet(sealedData), 'Scellés');

    const gradedData = [
      ['Nom','Note','Gradeur','Langue','Prix achat','Prix marché','N° certif','Notes'],
      ...APP.data.graded.map(i => [i.nom,i.note,i.gradeur,i.langue,i.prixAchat,i.prixMarche||'',i.numero||'',i.notes||''])
    ];
    utils.book_append_sheet(wb, utils.aoa_to_sheet(gradedData), 'Gradées');

    writeFile(wb, 'PokéTracker_Backup_' + today + '.xlsx');
    localStorage.setItem('pkm_last_backup', today);
    showToast('📥 Sauvegarde Excel du jour téléchargée', 'success', 5000);
  } catch(e) {
    console.error('Backup error:', e);
  }
}

// Écoute temps réel
let listenerActive = false;
function startRealtime() {
  if (listenerActive) return;
  listenerActive = true;
  onValue(ref(db, 'collection'), (snap) => {
    if (!snap.exists()) return;
    const remote = snap.val();
    const before = JSON.stringify({sealed:APP.data.sealed, graded:APP.data.graded, chase:APP.data.chase});
    const after  = JSON.stringify({sealed:remote.sealed,   graded:remote.graded,   chase:remote.chase});
    if (before !== after) {
      if (Array.isArray(remote.sealed)) APP.data.sealed = remote.sealed;
      if (Array.isArray(remote.graded)) APP.data.graded = remote.graded;
      if (Array.isArray(remote.chase))  APP.data.chase  = remote.chase;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(APP.data));
      renderPage(APP.currentPage);
      updateNavBadges();
      setSyncStatus('synced');
    }
  });
}

// Auth anonyme
setSyncStatus('connecting');
signInAnonymously(auth).catch(e => {
  console.error('Auth error:', e);
  setSyncStatus('offline');
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadFromFirebase();
    setTimeout(startRealtime, 3000);
    setTimeout(autoBackupExcel, 5000);
  }
});

// Prix auto cartes
window.fetchPrixMarcheAuto = async function(id, collection) {
  const data = collection === 'graded' ? APP.data.graded : APP.data.sealed;
  const item = data.find(i => i.id === id);
  if (!item) return;
  showToast('Recherche du prix...', 'info', 2000);
  try {
    const cleanName = item.nom.replace(/[-–]\s*\d+\/\d+/g,'').replace(/\s+\d{3}\/\d{3}/g,'').split(/[-–]/)[0].trim();
    const resp = await fetch('https://api.pokemontcg.io/v2/cards?q=name:"' + encodeURIComponent(cleanName) + '"&pageSize=5');
    if (!resp.ok) throw new Error('API error');
    const apiData = await resp.json();
    if (!apiData.data?.length) { showToast('Prix non trouvé — saisie manuelle', 'info', 4000); return; }
    let prix = null, source = '';
    for (const card of apiData.data) {
      if (card.cardmarket?.prices?.averageSellPrice) { prix = card.cardmarket.prices.averageSellPrice; source = 'CardMarket'; break; }
      if (card.tcgplayer?.prices?.holofoil?.market) { prix = card.tcgplayer.prices.holofoil.market; source = 'TCGPlayer'; break; }
    }
    if (prix) {
      item.prixMarche = Math.round(prix * 100) / 100;
      saveData();
      renderPage(APP.currentPage);
      showToast('Prix trouvé via ' + source + ' : ' + prix.toFixed(2) + ' €', 'success');
    } else {
      showToast('Prix non trouvé — saisie manuelle', 'info', 4000);
    }
  } catch(e) {
    showToast('Erreur de recherche', 'error');
  }
};
