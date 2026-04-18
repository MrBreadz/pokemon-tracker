// ===== DASHBOARD =====
let dashCharts = {};

function renderDashboard() {
  renderDashboardStats();
  setTimeout(renderDashboardCharts, 50); // légère attente pour que le canvas soit dans le DOM
  renderRecentActivity();
}

function renderDashboardStats() {
  const valAchat = getTotalValue('achat');
  const valMarche = getTotalValue('marche');
  const hasMarche = APP.data.sealed.some(i=>i.prixMarche) || APP.data.graded.some(i=>i.prixMarche);
  const diff = hasMarche ? valMarche - valAchat : 0;
  const pct = hasMarche && valAchat > 0 ? ((diff/valAchat)*100).toFixed(1) : 0;

  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  set('banner-val', formatPrice(valAchat));
  const bannerMarche = document.getElementById('banner-val-marche');
  if (bannerMarche) bannerMarche.textContent = hasMarche ? formatPrice(valMarche) : '—';
  set('dash-val-achat', formatPrice(valAchat));
  set('dash-val-marche', hasMarche ? formatPrice(valMarche) : '—');
  set('dash-items', APP.data.sealed.reduce((s,i)=>s+i.stock,0));
  // Plus-value latente
  const hasMarcheForPV = APP.data.sealed.some(i=>i.prixMarche) || APP.data.graded.some(i=>i.prixMarche);
  if (hasMarcheForPV) {
    const pv = getTotalValue('marche') - getTotalValue('achat');
    const pvEl = document.getElementById('dash-plusvalue');
    if (pvEl) {
      pvEl.textContent = formatPrice(pv);
      pvEl.style.color = pv >= 0 ? 'var(--positive)' : 'var(--negative)';
    }
  } else {
    set('dash-plusvalue', '—');
  }
  set('dash-graded', APP.data.graded.length);

  const trendEl = document.getElementById('dash-trend');
  if (trendEl) {
    if (hasMarche && diff !== 0) {
      const sign = diff > 0 ? '+' : '';
      const cls = diff > 0 ? 'positive' : 'negative';
      trendEl.innerHTML = '<span class="stat-trend ' + cls + '">' + sign + formatPrice(diff) + ' (' + sign + pct + '%)</span>';
    } else {
      trendEl.innerHTML = '<span style="color:var(--text-3);font-size:12px">Prix marché non renseignés</span>';
    }
  }
}

function getChartColors() {
  const isDark = APP.theme === 'dark';
  return {
    grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    text: isDark ? '#9A9899' : '#6B6560',
    colors: ['#E8B422','#E85D04','#007AFF','#34C759','#AF52DE','#FF9500','#5AC8FA','#FF453A'],
  };
}

function destroyChart(key) {
  if (dashCharts[key]) { try { dashCharts[key].destroy(); } catch(e){} dashCharts[key] = null; }
}

function renderDashboardCharts() {
  renderEvolutionChart();
  renderLangChart();
  renderGradeurChart();
  renderValeurTypeChart();
  renderTopValueChart();
}

function renderEvolutionChart() {
  destroyChart('evolution');
  const ctx = document.getElementById('chart-evolution');
  if (!ctx) return;
  const all = [
    ...APP.data.sealed.map(i=>({date:i.dateAjout, val:i.prixAchat*i.stock})),
    ...APP.data.graded.map(i=>({date:i.dateAjout, val:i.prixAchat})),
  ].filter(i=>i.date).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const byMonth = {};
  all.forEach(i=>{ const m=i.date.slice(0,7); byMonth[m]=(byMonth[m]||0)+i.val; });
  const labels = Object.keys(byMonth).sort();
  let cumul = 0;
  const data = labels.map(m=>{ cumul+=byMonth[m]; return Math.round(cumul); });
  const c = getChartColors();
  dashCharts.evolution = new Chart(ctx, {
    type: 'line',
    data: { labels: labels.map(l=>{ const [y,m]=l.split('-'); return new Date(y,m-1).toLocaleDateString('fr-FR',{month:'short',year:'2-digit'}); }),
      datasets: [{ label:'Valeur cumulée', data, borderColor:'#E8B422', backgroundColor:'rgba(232,180,34,0.08)', borderWidth:2.5, pointBackgroundColor:'#E8B422', pointRadius:4, fill:true, tension:0.4 }]
    },
    options: { responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:ctx=>' '+formatPrice(ctx.raw)}} },
      scales:{ x:{grid:{color:c.grid},ticks:{color:c.text,maxTicksLimit:8}}, y:{grid:{color:c.grid},ticks:{color:c.text,callback:v=>formatPrice(v)}} }
    }
  });
}

function renderLangChart() {
  destroyChart('lang');
  const ctx = document.getElementById('chart-lang');
  if (!ctx) return;
  const counts = {};
  // Scellés
  APP.data.sealed.forEach(i=>{ counts[i.langue]=(counts[i.langue]||0)+(i.prixAchat*i.stock); });
  // Cartes gradées
  APP.data.graded.forEach(i=>{ counts[i.langue]=(counts[i.langue]||0)+i.prixAchat; });
  const c = getChartColors();
  dashCharts.lang = new Chart(ctx, {
    type: 'bar',
    data: { labels:Object.keys(counts), datasets:[{ label:'Valeur (€)', data:Object.values(counts), backgroundColor:c.colors, borderRadius:6, borderSkipped:false }] },
    options: { responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:ctx=>' '+formatPrice(ctx.raw)}} },
      scales:{ x:{grid:{color:c.grid},ticks:{color:c.text}}, y:{grid:{color:c.grid},ticks:{color:c.text,callback:v=>formatPrice(v)}} }
    }
  });
}

function renderGradeurChart() {
  destroyChart('gradeur');
  const ctx = document.getElementById('chart-gradeur');
  if (!ctx) return;
  const counts = {};
  APP.data.graded.forEach(i=>{ counts[i.gradeur]=(counts[i.gradeur]||0)+1; });
  const c = getChartColors();
  dashCharts.gradeur = new Chart(ctx, {
    type: 'doughnut',
    data: { labels:Object.keys(counts), datasets:[{ data:Object.values(counts), backgroundColor:c.colors, borderWidth:2, borderColor:'transparent' }] },
    options: { responsive:true, maintainAspectRatio:false, cutout:'60%',
      plugins:{ legend:{position:'right',labels:{color:c.text,font:{size:11},padding:10,boxWidth:10}}, tooltip:{callbacks:{label:ctx=>' '+ctx.label+': '+ctx.raw}} }
    }
  });
}

function renderValeurTypeChart() {
  destroyChart('valtype');
  const ctx = document.getElementById('chart-valtype');
  if (!ctx) return;
  const vals = {};
  APP.data.sealed.forEach(i=>{ vals[i.type]=(vals[i.type]||0)+(i.prixAchat*i.stock); });
  vals['Cartes gradées'] = getTotalGradedValue('achat');
  const sorted = Object.entries(vals).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const c = getChartColors();
  dashCharts.valtype = new Chart(ctx, {
    type: 'bar',
    data: { labels:sorted.map(e=>e[0]), datasets:[{ label:'Valeur (€)', data:sorted.map(e=>e[1]), backgroundColor:c.colors, borderRadius:6, borderSkipped:false }] },
    options: { responsive:true, maintainAspectRatio:false, indexAxis:'y',
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:ctx=>' '+formatPrice(ctx.raw)}} },
      scales:{ x:{grid:{color:c.grid},ticks:{color:c.text,callback:v=>formatPrice(v)}}, y:{grid:{display:false},ticks:{color:c.text,font:{size:11}}} }
    }
  });
}

function renderTopValueChart() {
  destroyChart('topval');
  const ctx = document.getElementById('chart-topval');
  if (!ctx) return;
  const items = [
    ...APP.data.graded.map(i=>({nom:i.nom.split(' ').slice(0,4).join(' '), val:i.prixAchat, type:'Gradée'})),
    ...APP.data.sealed.filter(i=>i.prixAchat>0).map(i=>({nom:i.nom.split(' ').slice(0,4).join(' '), val:i.prixAchat, type:'Scellé'})),
  ].sort((a,b)=>b.val-a.val).slice(0,8);
  const c = getChartColors();
  dashCharts.topval = new Chart(ctx, {
    type: 'bar',
    data: { labels:items.map(i=>i.nom), datasets:[{ label:'Valeur (€)', data:items.map(i=>i.val), backgroundColor:items.map(i=>i.type==='Gradée'?'#E8B422':'#007AFF'), borderRadius:6, borderSkipped:false }] },
    options: { responsive:true, maintainAspectRatio:false, indexAxis:'y',
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:ctx=>' '+formatPrice(ctx.raw)}} },
      scales:{ x:{grid:{color:c.grid},ticks:{color:c.text,callback:v=>formatPrice(v)}}, y:{grid:{display:false},ticks:{color:c.text,font:{size:11}}} }
    }
  });
}

function renderRecentActivity() {
  const el = document.getElementById('recent-list');
  if (!el) return;
  const all = [
    ...APP.data.sealed.map(i=>({nom:i.nom, type:i.type, date:i.dateAjout, cat:'Scellé', prix:i.prixAchat})),
    ...APP.data.graded.map(i=>({nom:i.nom, type:i.gradeur, date:i.dateAjout, cat:'Gradée', prix:i.prixAchat})),
  ].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6);
  el.innerHTML = all.map(item =>
    '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">' +
    '<div style="width:36px;height:36px;border-radius:8px;background:var(--badge-bg);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">' + (item.cat==='Scellé'?'📦':'🏆') + '</div>' +
    '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + item.nom + '</div>' +
    '<div style="font-size:11px;color:var(--text-3)">' + item.cat + ' · ' + item.type + '</div></div>' +
    '<div style="font-weight:600;font-size:13px;color:var(--accent);flex-shrink:0">' + formatPrice(item.prix) + '</div></div>'
  ).join('');
}
