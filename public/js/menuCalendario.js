/* ══════════════════════════════════════
   js/menuCalendario.js
   Calendario Dinámico de Citas — REQ 3.1
══════════════════════════════════════ */

import { API_URL } from './menuConfig.js';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

const COLORES = {
  PENDIENTE:  { bg: '#fefcbf', border: '#d69e2e', texto: '#744210' },
  CONFIRMADA: { bg: '#c6f6d5', border: '#38a169', texto: '#22543d' },
  CANCELADA:  { bg: '#fed7d7', border: '#e53e3e', texto: '#822727' },
  FINALIZADA: { bg: '#e2e8f0', border: '#718096', texto: '#4a5568' },
};

let estado = {
  anio:       new Date().getFullYear(),
  mes:        new Date().getMonth(),      // 0-11
  citas:      [],
  doctores:   [],
  filtroDr:   '',
  filtroDSede:'',
  vista:      'mes',                      // 'mes' | 'semana'
};

// ── Inicialización ────────────────────────────────────────────
export function initCalendarioModule() {
  initControles();
}

export async function cargarModuloCalendario() {
  await Promise.all([cargarDoctores(), cargarCitas()]);
  renderCalendario();
}

// ── Controles de navegación ───────────────────────────────────
function initControles() {
  document.getElementById('cal-btn-prev')?.addEventListener('click', () => {
    if (estado.vista === 'mes') {
      estado.mes--;
      if (estado.mes < 0) { estado.mes = 11; estado.anio--; }
    } else {
      // retroceder 7 días
      const ref = new Date(estado.anio, estado.mes, estado.semanaRef || 1);
      ref.setDate(ref.getDate() - 7);
      estado.anio = ref.getFullYear();
      estado.mes  = ref.getMonth();
      estado.semanaRef = ref.getDate();
    }
    renderCalendario();
  });

  document.getElementById('cal-btn-next')?.addEventListener('click', () => {
    if (estado.vista === 'mes') {
      estado.mes++;
      if (estado.mes > 11) { estado.mes = 0; estado.anio++; }
    } else {
      const ref = new Date(estado.anio, estado.mes, estado.semanaRef || 1);
      ref.setDate(ref.getDate() + 7);
      estado.anio = ref.getFullYear();
      estado.mes  = ref.getMonth();
      estado.semanaRef = ref.getDate();
    }
    renderCalendario();
  });

  document.getElementById('cal-btn-hoy')?.addEventListener('click', () => {
    const hoy = new Date();
    estado.anio = hoy.getFullYear();
    estado.mes  = hoy.getMonth();
    estado.semanaRef = hoy.getDate();
    renderCalendario();
  });

  document.getElementById('cal-vista-mes')?.addEventListener('click', () => {
    estado.vista = 'mes';
    document.getElementById('cal-vista-mes').classList.add('active');
    document.getElementById('cal-vista-semana').classList.remove('active');
    renderCalendario();
  });

  document.getElementById('cal-vista-semana')?.addEventListener('click', () => {
    estado.vista = 'semana';
    estado.semanaRef = new Date().getDate();
    document.getElementById('cal-vista-semana').classList.add('active');
    document.getElementById('cal-vista-mes').classList.remove('active');
    renderCalendario();
  });

  document.getElementById('cal-filtro-doctor')?.addEventListener('change', (e) => {
    estado.filtroDr = e.target.value;
    renderCalendario();
  });

  // Cerrar modal al click fuera
  document.getElementById('cal-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'cal-modal-overlay') cerrarModal();
  });
  document.getElementById('cal-modal-cerrar')?.addEventListener('click', cerrarModal);
}

// ── Cargar datos ──────────────────────────────────────────────
async function cargarCitas() {
  const token = localStorage.getItem('token');
  try {
    const res  = await fetch(`${API_URL}/citas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    estado.citas = data.citas || [];
  } catch (err) {
    console.error('Error cargando citas:', err);
  }
}

async function cargarDoctores() {
  const token = localStorage.getItem('token');
  try {
    // Obtener sedeId del token
    let sedeIdToken = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      sedeIdToken   = payload.sedeId || null;
    } catch (e) {}

    const url = sedeIdToken
      ? `${API_URL}/doctores?sedeId=${sedeIdToken}`
      : `${API_URL}/doctores`;

    const res     = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    estado.doctores = await res.json();

    const select = document.getElementById('cal-filtro-doctor');
    if (select) {
      select.innerHTML = '<option value="">Todos los médicos</option>';
      estado.doctores.forEach(d => {
        select.innerHTML += `<option value="${d.id_doctor}">${d.nombres}</option>`;
      });
    }
  } catch (err) {
    console.error('Error cargando doctores:', err);
  }
}

// ── Filtrar citas ─────────────────────────────────────────────
function citasFiltradas() {
  return estado.citas.filter(c => {
    if (estado.filtroDr && c.doctor !== estado.doctores.find(d => d.id_doctor == estado.filtroDr)?.nombres) return false;
    return true;
  });
}

function citasDelDia(fecha) {
  const citas = citasFiltradas();
  return citas.filter(c => {
    const f = new Date(c.fecha_iso);
    return f.getFullYear() === fecha.getFullYear() &&
           f.getMonth()    === fecha.getMonth() &&
           f.getDate()     === fecha.getDate();
  });
}

// ── Render principal ──────────────────────────────────────────
function renderCalendario() {
  const titulo = document.getElementById('cal-titulo');
  if (titulo) titulo.textContent = `${MESES[estado.mes]} ${estado.anio}`;

  if (estado.vista === 'mes') renderMes();
  else renderSemana();

  actualizarLeyenda();
}

// ── Vista mensual ─────────────────────────────────────────────
function renderMes() {
  const grid = document.getElementById('cal-grid');
  if (!grid) return;

  const primerDia    = new Date(estado.anio, estado.mes, 1).getDay();
  const diasEnMes    = new Date(estado.anio, estado.mes + 1, 0).getDate();
  const hoy          = new Date();
  const esHoyMes     = hoy.getFullYear() === estado.anio && hoy.getMonth() === estado.mes;

  let html = '';

  // Cabecera días
  DIAS.forEach(d => {
    html += `<div class="cal-header-dia">${d}</div>`;
  });

  // Celdas vacías al inicio
  for (let i = 0; i < primerDia; i++) {
    html += `<div class="cal-celda cal-celda-vacia"></div>`;
  }

  // Días del mes
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fecha     = new Date(estado.anio, estado.mes, dia);
    const citasDia  = citasDelDia(fecha);
    const esHoy     = esHoyMes && hoy.getDate() === dia;
    const esWeekend = fecha.getDay() === 0 || fecha.getDay() === 6;

    html += `
      <div class="cal-celda ${esHoy ? 'cal-hoy' : ''} ${esWeekend ? 'cal-weekend' : ''}"
           data-fecha="${fecha.toISOString().slice(0,10)}">
        <div class="cal-num-dia ${esHoy ? 'cal-num-hoy' : ''}">${dia}</div>
        <div class="cal-citas-dia" id="cal-dia-${fecha.toISOString().slice(0,10)}">
          ${citasDia.slice(0,3).map(c => renderChipCita(c)).join('')}
          ${citasDia.length > 3 ? `
            <div class="cal-mas-citas" data-fecha="${fecha.toISOString().slice(0,10)}" data-total="${citasDia.length}">
              +${citasDia.length - 3} más — ver todas
            </div>` : ''}
        </div>
      </div>`;
  }

  grid.innerHTML = html;
  grid.className = 'cal-grid-mes';

  // Eventos en celdas
  grid.querySelectorAll('.cal-celda:not(.cal-celda-vacia)').forEach(celda => {
    celda.addEventListener('click', (e) => {
      const chipCita = e.target.closest('.cal-chip-cita');
      const masCitas = e.target.closest('.cal-mas-citas');

      if (chipCita) {
        const id   = parseInt(chipCita.dataset.id);
        const cita = estado.citas.find(c => c.id === id);
        if (cita) abrirModalCita(cita);
      }

      if (masCitas) {
        const fecha    = masCitas.dataset.fecha;
        const fechaObj = new Date(fecha + 'T00:00:00');
        const citasDia = citasDelDia(fechaObj);
        abrirModalDia(fecha, citasDia);
      }
    });
  });
}

// ── Vista semanal ─────────────────────────────────────────────
function renderSemana() {
  const grid = document.getElementById('cal-grid');
  if (!grid) return;

  const ref        = new Date(estado.anio, estado.mes, estado.semanaRef || new Date().getDate());
  const diaSemana  = ref.getDay();
  const lunesSem   = new Date(ref);
  lunesSem.setDate(ref.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1));

  const dias7 = Array.from({length: 7}, (_, i) => {
    const d = new Date(lunesSem);
    d.setDate(lunesSem.getDate() + i);
    return d;
  });

  const hoy = new Date();

  // Actualizar título con rango
  const titulo = document.getElementById('cal-titulo');
  if (titulo) {
    const ini = dias7[0];
    const fin = dias7[6];
    titulo.textContent = `${ini.getDate()} ${MESES[ini.getMonth()]} — ${fin.getDate()} ${MESES[fin.getMonth()]} ${fin.getFullYear()}`;
  }

  let html = '';

  // Cabecera
  dias7.forEach(d => {
    const esHoy = d.toDateString() === hoy.toDateString();
    html += `
      <div class="cal-sem-header ${esHoy ? 'cal-sem-hoy' : ''}">
        <span class="cal-sem-dia-nom">${DIAS[d.getDay()]}</span>
        <span class="cal-sem-dia-num ${esHoy ? 'cal-num-hoy' : ''}">${d.getDate()}</span>
      </div>`;
  });

  // Columnas de citas
  dias7.forEach(d => {
    const citasDia = citasDelDia(d);
    const esHoy    = d.toDateString() === hoy.toDateString();
    html += `
      <div class="cal-sem-col ${esHoy ? 'cal-sem-col-hoy' : ''}">
        ${citasDia.length === 0
          ? '<div class="cal-sem-vacio">Sin citas</div>'
          : citasDia.map(c => renderChipCitaSemana(c)).join('')
        }
      </div>`;
  });

  grid.innerHTML = html;
  grid.className = 'cal-grid-semana';

  // Eventos
  grid.querySelectorAll('.cal-chip-semana').forEach(chip => {
    chip.addEventListener('click', () => {
      const id   = parseInt(chip.dataset.id);
      const cita = estado.citas.find(c => c.id === id);
      if (cita) abrirModalCita(cita);
    });
  });
}

// ── Chips de cita ─────────────────────────────────────────────
function renderChipCita(cita) {
  const col   = COLORES[cita.estado] || COLORES.PENDIENTE;
  const hora  = new Date(cita.fecha_iso).toLocaleTimeString('es-GT', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Guatemala'
  });
  return `
    <div class="cal-chip-cita" data-id="${cita.id}"
         style="background:${col.bg}; border-left:3px solid ${col.border}; color:${col.texto};">
      <span class="cal-chip-hora">${hora}</span>
      <span class="cal-chip-nombre">${cita.paciente.split(' ')[0]}</span>
    </div>`;
}

function renderChipCitaSemana(cita) {
  const col  = COLORES[cita.estado] || COLORES.PENDIENTE;
  const hora = new Date(cita.fecha_iso).toLocaleTimeString('es-GT', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Guatemala'
  });
  return `
    <div class="cal-chip-semana" data-id="${cita.id}"
         style="background:${col.bg}; border-left:3px solid ${col.border}; color:${col.texto};">
      <div class="cal-chip-hora">${hora}</div>
      <div class="cal-chip-nombre">${cita.paciente}</div>
      <div class="cal-chip-doctor">${cita.doctor}</div>
    </div>`;
}

// ── Leyenda ───────────────────────────────────────────────────
function actualizarLeyenda() {
  const citas    = citasFiltradas();
  const conteos  = { PENDIENTE: 0, CONFIRMADA: 0, CANCELADA: 0, FINALIZADA: 0 };

  citas.forEach(c => {
    const f = new Date(c.fecha_iso);
    if (f.getFullYear() === estado.anio && f.getMonth() === estado.mes) {
      if (conteos[c.estado] !== undefined) conteos[c.estado]++;
    }
  });

  ['PENDIENTE','CONFIRMADA','CANCELADA','FINALIZADA'].forEach(est => {
    const el = document.getElementById(`cal-count-${est.toLowerCase()}`);
    if (el) el.textContent = conteos[est];
  });
}

// ── Modal listado de citas del día ───────────────────────────
function abrirModalDia(fechaStr, citas) {
  const overlay = document.getElementById('cal-modal-overlay');
  if (!overlay) return;

  const fecha = new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'full', timeZone: 'America/Guatemala'
  }).format(new Date(fechaStr + 'T12:00:00'));

  const COLORES_LOCAL = {
    PENDIENTE:  { bg: '#fefcbf', border: '#d69e2e', texto: '#744210' },
    CONFIRMADA: { bg: '#c6f6d5', border: '#38a169', texto: '#22543d' },
    CANCELADA:  { bg: '#fed7d7', border: '#e53e3e', texto: '#822727' },
    FINALIZADA: { bg: '#e2e8f0', border: '#718096', texto: '#4a5568' },
  };

  document.getElementById('cal-modal-body').innerHTML = `
    <p style="color:#718096; font-size:0.85rem; margin-bottom:16px; text-transform:capitalize;">${fecha}</p>
    <p style="font-size:0.8rem; color:#a0aec0; margin-bottom:12px;">${citas.length} citas programadas</p>
    <div style="display:flex; flex-direction:column; gap:8px; max-height:340px; overflow-y:auto;">
      ${citas.map(c => {
        const col  = COLORES_LOCAL[c.estado] || COLORES_LOCAL.PENDIENTE;
        const hora = new Intl.DateTimeFormat('es-GT', {
          hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Guatemala'
        }).format(new Date(c.fecha_iso));
        return `
          <div class="cal-dia-item" data-id="${c.id}"
               style="background:${col.bg}; border-left:3px solid ${col.border};
                      border-radius:6px; padding:10px 12px; cursor:pointer;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-weight:700; color:${col.texto}; font-size:0.82rem;">${hora}</span>
              <span style="background:white; color:${col.texto}; font-size:0.7rem; padding:2px 8px;
                           border-radius:20px; font-weight:600; border:1px solid ${col.border};">
                ${c.estado}
              </span>
            </div>
            <div style="font-weight:600; color:#2d3748; font-size:0.9rem;">${c.paciente}</div>
            <div style="color:#718096; font-size:0.8rem; margin-top:2px;">${c.doctor} — ${c.motivo || 'Sin motivo'}</div>
          </div>`;
      }).join('')}
    </div>
  `;

  // Click en item → ver detalle
  overlay.querySelectorAll('.cal-dia-item').forEach(item => {
    item.addEventListener('click', () => {
      const id   = parseInt(item.dataset.id);
      const cita = estado.citas.find(c => c.id === id);
      if (cita) abrirModalCita(cita);
    });
  });

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ── Modal detalle cita ────────────────────────────────────────
function abrirModalCita(cita) {
  const overlay = document.getElementById('cal-modal-overlay');
  if (!overlay) return;

  const col   = COLORES[cita.estado] || COLORES.PENDIENTE;
  const fecha = new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Guatemala'
  }).format(new Date(cita.fecha_iso));

  document.getElementById('cal-modal-body').innerHTML = `
    <div style="margin-bottom:16px;">
      <span style="background:${col.bg}; color:${col.texto}; border:1px solid ${col.border};
                   font-size:0.78rem; padding:4px 12px; border-radius:20px; font-weight:700;">
        ${cita.estado}
      </span>
    </div>
    <div class="cal-modal-row">
      <span class="cal-modal-lbl">Paciente</span>
      <span class="cal-modal-val">${cita.paciente}</span>
    </div>
    <div class="cal-modal-row">
      <span class="cal-modal-lbl">Médico</span>
      <span class="cal-modal-val">${cita.doctor}</span>
    </div>
    <div class="cal-modal-row">
      <span class="cal-modal-lbl">Fecha</span>
      <span class="cal-modal-val">${fecha}</span>
    </div>
    <div class="cal-modal-row">
      <span class="cal-modal-lbl">Motivo</span>
      <span class="cal-modal-val">${cita.motivo || '—'}</span>
    </div>
    <div class="cal-modal-row">
      <span class="cal-modal-lbl">DPI</span>
      <span class="cal-modal-val" style="font-family:monospace;">${cita.dpi_paciente}</span>
    </div>
  `;

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function cerrarModal() {
  const overlay = document.getElementById('cal-modal-overlay');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}