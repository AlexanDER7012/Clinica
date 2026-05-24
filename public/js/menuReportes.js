import { toastExito, toastError, toastAlerta, toastInfo } from './menuToast.js';
import { API_URL } from './menuConfig.js';

let chartMorbilidad   = null;
let chartProductividad = null;

export function initReportesModule() {
  initFormularioReporte();
}

export async function cargarModuloReportes() {
  await poblarSelectoresSede();
  await cargarHistorialReportes();
  ocultarResultados();
}

// ── Ocultar sección resultados al entrar ──────────────────────
function ocultarResultados() {
  const sec = document.getElementById('reportes-resultados');
  if (sec) sec.style.display = 'none';
}

// ── Poblar selector de sedes ──────────────────────────────────
async function poblarSelectoresSede() {
  const token  = localStorage.getItem('token');
  const select = document.getElementById('reporte-sedeId');
  if (!select || select.options.length > 1) return;

  try {
    const res   = await fetch(`${API_URL}/sedes`, { headers: { 'Authorization': `Bearer ${token}` } });
    const sedes = await res.json();
    select.innerHTML = '<option value="">-- Seleccione Sede --</option>';
    sedes.forEach(s => {
      select.innerHTML += `<option value="${s.id_sede}">${s.nombre}</option>`;
    });
  } catch (err) {
    console.error('Error cargando sedes:', err);
  }
}

// ── Formulario generar reporte ────────────────────────────────
function initFormularioReporte() {
  const form = document.getElementById('form-generar-reporte');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token  = localStorage.getItem('token');
    const mes    = document.getElementById('reporte-mes')?.value;
    const anio   = document.getElementById('reporte-anio')?.value;
    const sedeId = document.getElementById('reporte-sedeId')?.value;
    const btnGen = document.getElementById('btn-generar-reporte');

    if (!mes || !anio || !sedeId) {
      toastInfo('Complete todos los campos para generar el reporte.');
      return;
    }

    if (btnGen) { btnGen.disabled = true; btnGen.textContent = 'Generando...'; }

    try {
      const res  = await fetch(`${API_URL}/reportes/generar`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ mes: parseInt(mes), anio: parseInt(anio), sedeId: parseInt(sedeId) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar reporte');

      mostrarResultadosReporte(data.reporte);
      await cargarHistorialReportes();

    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      if (btnGen) { btnGen.disabled = false; btnGen.textContent = 'Generar y Guardar Reporte'; }
    }
  });
}

// ── Mostrar resultados del reporte generado ───────────────────
function mostrarResultadosReporte(reporte) {
  const sec = document.getElementById('reportes-resultados');
  if (sec) sec.style.display = 'block';

  const datos   = reporte.datos_json;
  const resumen = datos.resumen;
  const meses   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  // Título del reporte
  const titulo = document.getElementById('reporte-titulo');
  if (titulo) titulo.textContent = `Reporte ${meses[resumen.mes_referencia - 1]} ${resumen.anio_referencia} — ${reporte.sede?.nombre || ''}`;

  // Tarjetas resumen
  document.getElementById('rep-total-citas')?.setAttribute('data-val',   resumen.total_atenciones);
  document.getElementById('rep-ingresos')?.setAttribute('data-val',      `Q ${parseFloat(resumen.ingreso_financiero).toLocaleString('es-GT')}`);
  document.getElementById('rep-finalizacion')?.setAttribute('data-val',  `${resumen.tasa_finalizacion_pct}%`);

  ['rep-total-citas','rep-ingresos','rep-finalizacion'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = el.getAttribute('data-val');
  });

  // ── 5.1 Morbilidad ───────────────────────────────────────────
  renderMorbilidad(datos.morbilidad_anonimizada || []);

  // ── 5.2 Productividad ─────────────────────────────────────────
  renderProductividad(datos.productividad_medicos || {});

  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Gráfica 5.1 Morbilidad ────────────────────────────────────
function renderMorbilidad(motivos) {
  const canvas = document.getElementById('chart-morbilidad');
  if (!canvas) return;

  if (chartMorbilidad) { chartMorbilidad.destroy(); chartMorbilidad = null; }

  const labels = motivos.map(m => { const s = m.motivo.trim(); return s.charAt(0).toUpperCase() + s.slice(1, 30); });
  const datos  = motivos.map(m => m.count);
  const total  = datos.reduce((a, b) => a + b, 0);

  chartMorbilidad = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label:           'Casos',
        data:            datos,
        backgroundColor: [
          '#2aa87f','#1a7a5e','#42a5f5','#1976d2','#f6ad55',
          '#ed8936','#fc8181','#e53e3e','#9f7aea','#6b46c1'
        ],
        borderRadius: 6,
      }]
    },
    options: {
      indexAxis: 'y', // barras horizontales
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.x} casos (${total > 0 ? Math.round(ctx.parsed.x/total*100) : 0}%)`
          }
        }
      },
      scales: {
        x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f0f0f0' } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

// ── Tabla 5.2 Productividad ───────────────────────────────────
function renderProductividad(productividad) {
  const tbody = document.getElementById('tbody-productividad');
  if (!tbody) return;

  tbody.innerHTML = '';
  const medicos = Object.entries(productividad).sort((a, b) => b[1].finalizadas - a[1].finalizadas);

  if (!medicos.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:16px; text-align:center; color:#888;">Sin datos de médicos este mes.</td></tr>`;
    return;
  }

  medicos.forEach(([nombre, datos], i) => {
    const pct     = datos.efectividad_pct;
    const color   = pct >= 80 ? '#22543d' : pct >= 50 ? '#744210' : '#822727';
    const bgColor = pct >= 80 ? '#c6f6d5' : pct >= 50 ? '#fefcbf' : '#fed7d7';

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #eef2f8';
    tr.innerHTML = `
      <td style="padding:10px 16px; font-weight:600; color:#2d3748;">${i + 1}. ${nombre}</td>
      <td style="padding:10px 16px; text-align:center; color:#4a5568;">${datos.total}</td>
      <td style="padding:10px 16px; text-align:center; color:#22543d; font-weight:600;">${datos.finalizadas}</td>
      <td style="padding:10px 16px; text-align:center; color:#822727;">${datos.canceladas}</td>
      <td style="padding:10px 16px; text-align:center; color:#718096;">${datos.pendientes}</td>
      <td style="padding:10px 16px; text-align:center;">
        <span style="background:${bgColor}; color:${color}; font-size:0.8rem; padding:3px 10px; border-radius:20px; font-weight:700;">
          ${pct}%
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Historial de reportes guardados ──────────────────────────
async function cargarHistorialReportes() {
  const token  = localStorage.getItem('token');
  const tbody  = document.getElementById('tbody-historial');
  const conteo = document.getElementById('historial-conteo');
  if (!tbody) return;

  try {
    const res  = await fetch(`${API_URL}/reportes/historial`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (conteo) conteo.textContent = `${data.total_reportes} reportes`;

    if (!data.reportes.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding:16px; text-align:center; color:#888;">No hay reportes generados aún.</td></tr>`;
      return;
    }

    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    tbody.innerHTML = '';

    data.reportes.forEach(r => {
      const fecha = new Intl.DateTimeFormat('es-GT', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Guatemala'
      }).format(new Date(r.createdAt));

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #eef2f8';
      tr.style.cursor        = 'pointer';
      tr.style.transition    = 'background 0.2s';
      tr.addEventListener('mouseenter', () => tr.style.backgroundColor = '#f8fafc');
      tr.addEventListener('mouseleave', () => tr.style.backgroundColor = 'transparent');

      tr.innerHTML = `
        <td style="padding:10px 16px; font-family:'DM Mono',monospace; font-size:0.82rem; color:#718096;">#${r.id_reporte}</td>
        <td style="padding:10px 16px; font-weight:500; color:#2d3748;">${meses[r.mes_referencia - 1]} ${r.anio_referencia}</td>
        <td style="padding:10px 16px; color:#4a5568;">${r.sede?.nombre || '—'}</td>
        <td style="padding:10px 16px;">
          <span style="background:#ebf8ff; color:#2b6cb0; font-size:0.78rem; padding:3px 8px; border-radius:20px; font-weight:600;">
            ${r.tipo_reporte}
          </span>
        </td>
        <td style="padding:10px 16px; color:#718096; font-size:0.85rem;">${fecha}</td>
        <td style="padding:10px 16px; text-align:center;">
          <button class="btn-ver-reporte" data-id="${r.id_reporte}"
            style="background:#e2e8f0; color:#4a5568; border:none; padding:4px 12px; border-radius:6px; font-size:0.8rem; cursor:pointer; font-weight:500;">
            Ver
          </button>
        </td>
      `;

      tr.querySelector('.btn-ver-reporte').addEventListener('click', () => mostrarResultadosReporte(r));
      tbody.appendChild(tr);
    });

  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="padding:16px; text-align:center; color:red;">Error: ${err.message}</td></tr>`;
  }
}