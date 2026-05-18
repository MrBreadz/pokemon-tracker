// ===== LIENS RAPIDES v1.0 =====
const LINKS_KEY = 'pkm_links_v1';

const LINKS_DEFAULT = [
  {
    id: 'cat_indie', label: 'Indépendants & Spécialistes', icon: '🏪', open: true,
    links: [
      { id:'l1',  name: 'GM Cards & Toys',    url: 'https://gmcardsandtoys.com/fr-fr/collections/pokemon',   icon: '🃏', desc: 'Ton shop principal' },
      { id:'l2',  name: 'Hikaru Shop',         url: 'https://www.hikarushop.com',                             icon: '⭐', desc: 'Spécialiste Pokémon FR' },
      { id:'l3',  name: 'Poké-Center',         url: 'https://www.pokemoncenter.com',                          icon: '🔴', desc: 'Officiel Pokémon' },
      { id:'l4',  name: 'Abyss Kingdom',       url: 'https://www.abyss-kingdom.com/fr/pokemon',               icon: '🌊', desc: 'Cartes & scellés' },
      { id:'l5',  name: 'CardCollect',         url: 'https://cardcollect.fr',                                 icon: '📦', desc: 'Scellés FR' },
    ]
  },
  {
    id: 'cat_ecom', label: 'E-commerce & Places de marché', icon: '🛒', open: true,
    links: [
      { id:'l10', name: 'eBay Pokémon FR',     url: 'https://www.ebay.fr/sch/i.html?_nkw=pokemon+carte',     icon: '🟡', desc: 'Occasion & neuf' },
      { id:'l11', name: 'CardMarket',          url: 'https://www.cardmarket.com/fr/Pokemon',                  icon: '💶', desc: 'Référence prix cartes' },
      { id:'l12', name: 'Fnac Pokémon',        url: 'https://www.fnac.com/SearchResult/ResultList.aspx?Search=pokemon+carte',  icon: '🟠', desc: 'Retail FR' },
      { id:'l13', name: 'King Jouet',          url: 'https://www.king-jouet.com/recherche/pokemon',           icon: '👑', desc: 'Retail FR' },
      { id:'l14', name: 'Cultura',             url: 'https://www.cultura.com/c/jeux-cartes-pokemon',          icon: '🎨', desc: 'Retail FR' },
      { id:'l15', name: 'Mavin',               url: 'https://mavin.io/search?q=pokemon',                     icon: '💰', desc: 'Prix vente eBay US' },
      { id:'l16', name: 'TCGPlayer',           url: 'https://www.tcgplayer.com/search/pokemon/product',       icon: '🇺🇸', desc: 'Marché US' },
      { id:'l17', name: 'Amazon FR',           url: 'https://www.amazon.fr/s?k=pokemon+carte',               icon: '📦', desc: 'Retail & occasion' },
    ]
  },
  {
    id: 'cat_tools', label: 'Outils & Références', icon: '🔧', open: true,
    links: [
      { id:'l20', name: 'PokéCardex',          url: 'https://www.pokecardex.com',                            icon: '📖', desc: 'Base de données cartes FR' },
      { id:'l21', name: 'Poké-Bulbapedia',     url: 'https://bulbapedia.bulbagarden.net',                    icon: '📚', desc: 'Wiki Pokémon complet' },
      { id:'l22', name: 'Poké-Index',          url: 'https://poke-index.fr',                                 icon: '🔍', desc: 'Cotes et valeurs FR' },
      { id:'l23', name: 'PSA Card',            url: 'https://www.psacard.com/cert',                          icon: '🏅', desc: 'Vérif certif PSA' },
      { id:'l24', name: 'CGC Verify',          url: 'https://www.cgccards.com/certlookup',                   icon: '🏅', desc: 'Vérif certif CGC' },
      { id:'l25', name: 'Centering Tool',      url: 'https://www.pokemonprice.com/CenteringTool',            icon: '📐', desc: 'Calcul centrage carte' },
      { id:'l26', name: 'PriceCharting',       url: 'https://www.pricecharting.com/category/pokemon-cards',  icon: '📈', desc: 'Historique prix' },
      { id:'l27', name: 'TCG Collector',       url: 'https://tcgcollector.com',                              icon: '🗂️', desc: 'Suivi collection en ligne' },
      { id:'l28', name: 'Limitless TCG',       url: 'https://limitlesstcg.com/cards',                       icon: '♾️', desc: 'Stats tournois & cotes' },
    ]
  },
  {
    id: 'cat_actu', label: 'Actualités & Communauté', icon: '📰', open: false,
    links: [
      { id:'l30', name: 'Poké-France',         url: 'https://www.pokemon.fr',                               icon: '🇫🇷', desc: 'Site officiel FR' },
      { id:'l31', name: 'Reddit r/pkmntcg',    url: 'https://www.reddit.com/r/PokemonTCG',                  icon: '🟠', desc: 'Communauté internationale' },
      { id:'l32', name: 'Reddit r/pokemonFR',  url: 'https://www.reddit.com/r/pokemonfrance',               icon: '🟠', desc: 'Communauté FR' },
      { id:'l33', name: 'PokeBeach',           url: 'https://www.pokebeach.com',                            icon: '🌊', desc: 'News TCG EN' },
    ]
  }
];

let linksData = null;

function loadLinksData() {
  try {
    const s = localStorage.getItem(LINKS_KEY);
    linksData = s ? JSON.parse(s) : JSON.parse(JSON.stringify(LINKS_DEFAULT));
  } catch(e) {
    linksData = JSON.parse(JSON.stringify(LINKS_DEFAULT));
  }
}

function saveLinksData() {
  localStorage.setItem(LINKS_KEY, JSON.stringify(linksData));
}

// ===== RENDER =====
function renderLinks() {
  loadLinksData();
  const container = document.getElementById('links-container');
  if (!container) return;
  container.innerHTML = buildLinksHTML();
  initLinksEvents();
}

function buildLinksHTML() {
  return `
  <div class="lk-wrap">
    <!-- Header -->
    <div class="lk-header">
      <div>
        <h1 class="section-title">Liens Rapides</h1>
        <div class="section-sub">Vos sites favoris Pokémon en un clic</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" onclick="openAddLinkCategory()">＋ Catégorie</button>
        <button class="btn btn-primary"   onclick="openAddLink(null)">＋ Lien</button>
      </div>
    </div>

    <!-- Catégories -->
    <div class="lk-categories">
      ${linksData.map(cat => buildCategory(cat)).join('')}
    </div>
  </div>

  <!-- MODAL LIEN -->
  <div class="modal-overlay" id="modal-link" style="display:none">
    <div class="modal" style="max-width:440px">
      <div class="modal-header">
        <div class="modal-title" id="link-modal-title">Ajouter un lien</div>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="form-group">
        <label class="form-label">Catégorie</label>
        <select class="form-select" id="link-cat-select">
          ${linksData.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Nom *</label>
        <input class="form-input" id="link-name" type="text" placeholder="Ex: CardMarket">
      </div>
      <div class="form-group">
        <label class="form-label">URL *</label>
        <input class="form-input" id="link-url" type="url" placeholder="https://...">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Icône (emoji)</label>
          <input class="form-input" id="link-icon" type="text" placeholder="🔗" maxlength="4">
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="link-desc" type="text" placeholder="Optionnel">
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="saveLinkItem()">Sauvegarder</button>
      </div>
    </div>
  </div>

  <!-- MODAL CATÉGORIE -->
  <div class="modal-overlay" id="modal-link-cat" style="display:none">
    <div class="modal" style="max-width:380px">
      <div class="modal-header">
        <div class="modal-title" id="link-cat-modal-title">Ajouter une catégorie</div>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="form-group">
        <label class="form-label">Nom *</label>
        <input class="form-input" id="link-cat-name" type="text" placeholder="Ex: Mes favoris">
      </div>
      <div class="form-group">
        <label class="form-label">Icône (emoji)</label>
        <input class="form-input" id="link-cat-icon" type="text" placeholder="📁" maxlength="4">
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="saveLinkCategory()">Créer</button>
      </div>
    </div>
  </div>`;
}

function buildCategory(cat) {
  return `
  <div class="lk-cat" id="lk-cat-${cat.id}">
    <div class="lk-cat-header" onclick="toggleLinkCat('${cat.id}')">
      <div style="display:flex;align-items:center;gap:10px">
        <span class="lk-cat-icon">${cat.icon}</span>
        <span class="lk-cat-name">${cat.label}</span>
        <span class="lk-cat-count">${cat.links.length}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openAddLink('${cat.id}')" title="Ajouter un lien">＋</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="event.stopPropagation();deleteLinkCategory('${cat.id}')" title="Supprimer la catégorie">🗑️</button>
        <span class="lk-chevron ${cat.open?'open':''}">›</span>
      </div>
    </div>
    <div class="lk-cat-body ${cat.open?'open':''}">
      <div class="lk-grid">
        ${cat.links.map(link => buildLinkCard(link, cat.id)).join('')}
        <div class="lk-add-card" onclick="openAddLink('${cat.id}')">
          <span style="font-size:20px;opacity:0.3">＋</span>
          <span style="font-size:11px;opacity:0.3">Ajouter</span>
        </div>
      </div>
    </div>
  </div>`;
}

function buildLinkCard(link, catId) {
  return `
  <a class="lk-card" href="${link.url}" target="_blank" rel="noopener">
    <div class="lk-card-icon">${link.icon || '🔗'}</div>
    <div class="lk-card-body">
      <div class="lk-card-name">${link.name}</div>
      ${link.desc ? `<div class="lk-card-desc">${link.desc}</div>` : ''}
    </div>
    <button class="lk-card-del" onclick="event.preventDefault();event.stopPropagation();deleteLinkItem('${link.id}','${catId}')" title="Supprimer">✕</button>
  </a>`;
}

// ===== INTERACTIONS =====
function toggleLinkCat(catId) {
  const cat = linksData.find(c => c.id === catId);
  if (!cat) return;
  cat.open = !cat.open;
  saveLinksData();
  const body = document.querySelector(`#lk-cat-${catId} .lk-cat-body`);
  const chev = document.querySelector(`#lk-cat-${catId} .lk-chevron`);
  if (body) body.classList.toggle('open', cat.open);
  if (chev) chev.classList.toggle('open', cat.open);
}

let editingLinkId = null;
let editingLinkCat = null;

function openAddLink(catId) {
  editingLinkId  = null;
  editingLinkCat = catId;
  document.getElementById('link-modal-title').textContent = 'Ajouter un lien';
  document.getElementById('link-name').value  = '';
  document.getElementById('link-url').value   = '';
  document.getElementById('link-icon').value  = '';
  document.getElementById('link-desc').value  = '';
  if (catId) document.getElementById('link-cat-select').value = catId;
  openModal('modal-link');
}

function saveLinkItem() {
  const name = document.getElementById('link-name').value.trim();
  const url  = document.getElementById('link-url').value.trim();
  const icon = document.getElementById('link-icon').value.trim() || '🔗';
  const desc = document.getElementById('link-desc').value.trim();
  const catId= document.getElementById('link-cat-select').value;
  if (!name || !url) { showToast('Nom et URL requis', 'error'); return; }

  const cat = linksData.find(c => c.id === catId);
  if (!cat) return;
  cat.links.push({ id: genId('lk'), name, url, icon, desc });
  saveLinksData();
  closeModal();
  renderLinks();
  showToast('Lien ajouté ✓', 'success');
}

function deleteLinkItem(linkId, catId) {
  const cat = linksData.find(c => c.id === catId);
  if (!cat) return;
  cat.links = cat.links.filter(l => l.id !== linkId);
  saveLinksData();
  renderLinks();
  showToast('Lien supprimé', 'info');
}

function openAddLinkCategory() {
  document.getElementById('link-cat-name').value = '';
  document.getElementById('link-cat-icon').value = '';
  openModal('modal-link-cat');
}

function saveLinkCategory() {
  const name = document.getElementById('link-cat-name').value.trim();
  const icon = document.getElementById('link-cat-icon').value.trim() || '📁';
  if (!name) { showToast('Nom requis', 'error'); return; }
  linksData.push({ id: genId('lc'), label: name, icon, open: true, links: [] });
  saveLinksData();
  closeModal();
  renderLinks();
  showToast('Catégorie créée ✓', 'success');
}

function deleteLinkCategory(catId) {
  const cat = linksData.find(c => c.id === catId);
  if (!cat) return;
  if (cat.links.length > 0 && !confirm(`Supprimer la catégorie "${cat.label}" et ses ${cat.links.length} liens ?`)) return;
  linksData = linksData.filter(c => c.id !== catId);
  saveLinksData();
  renderLinks();
  showToast('Catégorie supprimée', 'info');
}

function initLinksEvents() {}
