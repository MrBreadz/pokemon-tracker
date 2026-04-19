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
    grid: isDark ? 'rgba(141,153,174,0.1)' : 'rgba(43,45,66,0.06)',
    text: isDark ? '#8D99AE' : '#8D99AE',
    // Palette: navy, red, slate, et variations
    colors: ['#2B2D42','#EF233C','#8D99AE','#4a4e6a','#D90429','#adb4c0','#6b7080','#c4ccd6'],
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
  const c = getChartColors();

  // Données d'achat réelles (points clés fournis manuellement + valeur actuelle)
  const currentVal = getTotalValue('achat');
  const fixedAchat = [
    { label: 'janv. 24', val: 0 },
    { label: 'juin 24',  val: 240 },
    { label: 'nov. 24',  val: 500 },
    { label: 'mars 25',  val: 1500 },
    { label: 'juin 25',  val: 3000 },
    { label: 'déc. 25',  val: 4500 },
    { label: 'avr. 26',  val: Math.round(currentVal) },
  ];

  // Courbe marché estimée : légèrement supérieure avec une appréciation progressive
  // Hypothèse : les items prennent en moyenne 15-25% de valeur avec le temps
  const marcheMult = [1, 1.05, 1.08, 1.12, 1.18, 1.22, 1.25];
  const fixedMarche = fixedAchat.map((p, i) => ({
    label: p.label,
    val: Math.round(p.val * marcheMult[i])
  }));

  // Si on a des vraies données marché, on les utilise pour le dernier point
  const realMarche = getTotalValue('marche');
  const hasRealMarche = APP.data.sealed.some(i=>i.prixMarche) || APP.data.graded.some(i=>i.prixMarche);
  if (hasRealMarche && realMarche > 0) {
    fixedMarche[fixedMarche.length - 1].val = Math.round(realMarche);
  }

  dashCharts.evolution = new Chart(ctx, {
    type: 'line',
    data: {
      labels: fixedAchat.map(p => p.label),
      datasets: [
        {
          label: 'Valeur investie',
          data: fixedAchat.map(p => p.val),
          borderColor: '#E8B422',
          backgroundColor: 'rgba(232,180,34,0.07)',
          borderWidth: 2.5,
          pointBackgroundColor: '#E8B422',
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
          order: 2,
        },
        {
          label: 'Valeur marché estimée',
          data: fixedMarche.map(p => p.val),
          borderColor: '#34C759',
          backgroundColor: 'rgba(52,199,89,0.05)',
          borderWidth: 2,
          pointBackgroundColor: '#34C759',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
          borderDash: hasRealMarche ? [] : [5, 4],
          order: 1,
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: { color: c.text, font: { size: 10, family: 'Space Grotesk' }, boxWidth: 8, boxHeight: 8, padding: 14, usePointStyle: true, pointStyle: 'circle' }
        },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          titleColor: '#2B2D42',
          bodyColor: '#8D99AE',
          borderColor: 'rgba(43,45,66,0.1)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: ctx => ' ' + ctx.dataset.label + ' : ' + formatPrice(ctx.raw),
            afterBody: (items) => {
              if (items.length === 2) {
                const diff = items[1].raw - items[0].raw;
                const pct = items[0].raw > 0 ? ((diff/items[0].raw)*100).toFixed(1) : 0;
                const sign = diff >= 0 ? '+' : '';
                return ['', ' P&L : ' + sign + formatPrice(diff) + ' (' + sign + pct + '%)'];
              }
              return [];
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: c.grid, drawBorder: false },
          ticks: { color: c.text, font: { size: 10, family: 'Space Grotesk' } },
          border: { display: false }
        },
        y: {
          grid: { color: c.grid, drawBorder: false },
          ticks: { color: c.text, font: { size: 10, family: 'Space Grotesk' }, callback: v => formatPrice(v) },
          border: { display: false }
        }
      }
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
  const el = document.getElementById('chart-topval-list');
  if (!el) return;
  const items = [
    ...APP.data.graded.map(i=>({nom:i.nom.split(' ').slice(0,5).join(' '), val:i.prixAchat, type:'Gradée'})),
    ...APP.data.sealed.filter(i=>i.prixAchat>0).map(i=>({nom:i.nom.split(' ').slice(0,5).join(' '), val:i.prixAchat, type:'Scellé'})),
  ].sort((a,b)=>b.val-a.val).slice(0,8);

  el.innerHTML = items.map((item, i) => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;background:rgba(255,255,255,0.5);border:1px solid rgba(43,45,66,0.07);margin-bottom:5px;transition:all 0.15s">
      <div style="width:20px;height:20px;border-radius:50%;background:rgba(239,35,60,0.08);border:1px solid rgba(239,35,60,0.15);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#D90429;flex-shrink:0">${i+1}</div>
      <div style="flex:1;font-size:11px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.nom}</div>
      <span style="font-size:9px;font-weight:600;padding:2px 8px;border-radius:20px;flex-shrink:0;${item.type==='Gradée' ? 'background:rgba(239,35,60,0.08);color:#D90429;border:1px solid rgba(239,35,60,0.15)' : 'background:rgba(43,45,66,0.07);color:#8D99AE;border:1px solid rgba(43,45,66,0.12)'}">${item.type}</span>
      <span style="font-size:12px;font-weight:700;color:var(--text);flex-shrink:0;min-width:44px;text-align:right">${formatPrice(item.val)}</span>
    </div>
  `).join('');
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
