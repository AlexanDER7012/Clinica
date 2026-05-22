import { API_URL } from './menuConfig.js';

let chartBarMensual = null;
let chartArea       = null;
let chartBarMini    = null;

export async function initDashboard() {
  await cargarDashboard(null);
  initSelectorSede();
}

function initSelectorSede() {
  const selector = document.getElementById('dashboard-sede-selector');
  if (!selector) return;
  selector.addEventListener('change', async (e) => {
    await cargarDashboard(e.target.value || null);
  });
}

async function cargarDashboard(sedeId) {
  const token = localStorage.getItem('token');
  try {
    const url = `${API_URL}/reportes/stats${sedeId ? '?sedeId=' + sedeId : ''}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error('Error al cargar datos del dashboard');
    const data = await res.json();

    actualizarTarjetas(data.tarjetas);
    actualizarGraficaMensual(data.grafica_mensual);
    actualizarRanking(data.ranking);
    poblarSelectorSedes(data.sedes, sedeId);

  } catch (err) {
    console.error('Error dashboard:', err);
  }
}

// ── Tarjetas ──────────────────────────────────────────────────
function actualizarTarjetas(tarjetas) {
  const elIngresos   = document.getElementById('stat-ingresos');
  const elConsultas  = document.getElementById('stat-consultas');
  const elPagos      = document.getElementById('stat-pagos');
  const elEficiencia = document.getElementById('stat-eficiencia');

  if (elIngresos)   elIngresos.textContent   = `Q ${parseFloat(tarjetas.ingresos_totales).toLocaleString('es-GT')}`;
  if (elConsultas)  elConsultas.textContent  = tarjetas.total_consultas.toLocaleString('es-GT');
  if (elPagos)      elPagos.textContent      = tarjetas.total_pagos.toLocaleString('es-GT');
  if (elEficiencia) elEficiencia.textContent = `${tarjetas.eficiencia}%`;
}

// ── Gráfica mensual ───────────────────────────────────────────
function actualizarGraficaMensual(grafica) {
  const canvas = document.getElementById('mainBar');
  if (!canvas) return;

  if (chartBarMensual) { chartBarMensual.destroy(); chartBarMensual = null; }

  chartBarMensual = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels:   grafica.labels,
      datasets: [{
        label:           `Citas ${grafica.anio}`,
        data:            grafica.datos,
        backgroundColor: '#42a5f5',
        borderRadius:    4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            // ← Tooltip muestra "42 consultas"
            label: (ctx) => ` ${ctx.parsed.y} consultas`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            // ← Eje Y muestra "42 citas"
            callback: (val) => `${val} citas`
          }
        }
      }
    }
  });

  const titulo = document.getElementById('chart-titulo');
  if (titulo) titulo.textContent = `Citas por Mes — ${grafica.anio}`;
}

// ── Ranking de médicos ────────────────────────────────────────
function actualizarRanking(ranking) {
  const container = document.getElementById('rankList');
  if (!container) return;
  container.innerHTML = '';

  if (!ranking.length) {
    container.innerHTML = `<p style="color:#888; font-size:0.9rem; padding:8px;">Sin datos de consultas aún.</p>`;
    return;
  }

  ranking.forEach(medico => {
    const claseNum = medico.top ? 'top' : 'other';
    const item     = document.createElement('div');
    item.className = 'rank-item';
    item.innerHTML = `
      <div class="rank-num ${claseNum}">${medico.posicion}</div>
      <div class="rank-name">${medico.nombre}</div>
      <div style="display:flex; flex-direction:column; align-items:flex-end;">
        <span class="rank-val">${medico.consultas.toLocaleString('es-GT')}</span>
        <span style="font-size:0.72rem; color:#a0aec0; font-weight:400;">consultas</span>
      </div>
    `;
    container.appendChild(item);
  });
}

// ── Poblar selector de sedes ──────────────────────────────────
function poblarSelectorSedes(sedes, sedeActual) {
  const selector = document.getElementById('dashboard-sede-selector');
  if (!selector || selector.options.length > 1) return;

  selector.innerHTML = '<option value="">Todas las Sedes</option>';
  sedes.forEach(s => {
    const opt       = document.createElement('option');
    opt.value       = s.id_sede;
    opt.textContent = s.nombre;
    if (sedeActual && parseInt(sedeActual) === s.id_sede) opt.selected = true;
    selector.appendChild(opt);
  });
}

// ── Mini gráficas decorativas ─────────────────────────────────
export function initAreaChart() {
  const canvas = document.getElementById('areaChart');
  if (!canvas) return;
  if (chartArea) chartArea.destroy();
  const ctx  = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 52);
  grad.addColorStop(0,   'rgba(0,188,212,.55)');
  grad.addColorStop(0.5, 'rgba(66,165,245,.35)');
  grad.addColorStop(1,   'rgba(255,87,34,.2)');
  chartArea = new Chart(ctx, {
    type: 'line',
    data: {
      labels:   [1,2,3,4,5,6,7,8,9,10,11,12],
      datasets: [{ data: [30,45,35,60,50,70,55,80,65,75,60,85], fill: true, backgroundColor: grad, borderColor: '#00acc1', borderWidth: 2, pointRadius: 0, tension: 0.4 }],
    },
    options: { plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } },
  });
}

export function initBarMiniChart() {
  const canvas = document.getElementById('barMini');
  if (!canvas) return;
  if (chartBarMini) chartBarMini.destroy();
  chartBarMini = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels:   ['E','F','M','A','M','J','J','A','S','O','N','D'],
      datasets: [{ data: [40,55,35,65,50,70,45,80,60,75,55,90], backgroundColor: '#1976d2', borderRadius: 3 }],
    },
    options: { plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } },
  });
}