import { DATA } from './menuConfig.js';

export function initAreaChart() {
  const canvas = document.getElementById('areaChart'); if (!canvas) return;
  const ctx  = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 52);
  grad.addColorStop(0,   'rgba(0,188,212,.55)');
  grad.addColorStop(0.5, 'rgba(66,165,245,.35)');
  grad.addColorStop(1,   'rgba(255,87,34,.2)');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: DATA.visitasMensuales.map((_, i) => i + 1),
      datasets: [{ data: DATA.visitasMensuales, fill: true, backgroundColor: grad, borderColor: '#00acc1', borderWidth: 2, pointRadius: 0, tension: 0.4 }],
    },
    options: { plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } },
  });
}

export function initBarMiniChart() {
  const canvas = document.getElementById('barMini'); if (!canvas) return;
  new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['E','F','M','A','M','J','J','A','S','O','N','D'],
      datasets: [{ data: DATA.pagosMensuales, backgroundColor: '#1976d2', borderRadius: 3 }],
    },
    options: { plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } },
  });
}

export function initMainBarChart() {
  const canvas = document.getElementById('mainBar'); if (!canvas) return;
  const { labels, Q1, Q2, Q3, Q4 } = DATA.consultasPorAnio;
  new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Q1', data: Q1, backgroundColor: '#1976d2', borderRadius: 4 },
        { label: 'Q2', data: Q2, backgroundColor: '#90caf9', borderRadius: 4 },
        { label: 'Q3', data: Q3, backgroundColor: '#42a5f5', borderRadius: 4 },
        { label: 'Q4', data: Q4, backgroundColor: '#bbdefb', borderRadius: 4 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
      scales: { x: { grid: { display: false } }, y: { min: 20, max: 60 } }
    },
  });
}

export function renderRanking() {
  const container = document.getElementById('rankList'); if (!container) return;
  container.innerHTML = "";
  DATA.medicos.forEach((medico, index) => {
    const posicion  = index + 1;
    const claseNum  = medico.top ? 'top' : 'other';
    const item      = document.createElement('div');
    item.className  = 'rank-item';
    item.innerHTML  = `<div class="rank-num ${claseNum}">${posicion}</div><div class="rank-name">${medico.nombre}</div><div class="rank-val">${medico.consultas}</div>`;
    container.appendChild(item);
  });
}
