import { API_URL } from './menuConfig.js';

const estadoCitas = {
  listaCitas:  [],
  vistaActual: 'lista',
};

export function initCitasModule() {
  const btnNuevaCita   = document.getElementById('btn-nueva-cita');
  const btnVolverLista = document.getElementById('btn-volver-lista');

  if (btnNuevaCita)   btnNuevaCita.addEventListener('click',   () => mostrarVista('nueva'));
  if (btnVolverLista) btnVolverLista.addEventListener('click', () => mostrarVista('lista'));

  initBuscadorDpi();
  initFormularioCita();
  initFiltros();
  initModalReprogramar();
}

export async function cargarModuloCitas() {
  mostrarVista('lista');
  await cargarListaCitas();
  await poblarSelectoresCita();
}

function mostrarVista(vista) {
  estadoCitas.vistaActual = vista;
  const secLista = document.getElementById('citas-sec-lista');
  const secNueva = document.getElementById('citas-sec-nueva');
  if (secLista) secLista.style.display = vista === 'lista' ? 'block' : 'none';
  if (secNueva) secNueva.style.display = vista === 'nueva' ? 'block' : 'none';
}

// ── Cargar citas ──────────────────────────────────────────────
export async function cargarListaCitas(filtros = {}) {
  const token = localStorage.getItem('token');
  const tbody = document.getElementById('citas-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="padding:20px; text-align:center; color:#888;">Cargando citas...</td></tr>`;

  try {
    const params = new URLSearchParams(filtros).toString();
    const res    = await fetch(`${API_URL}/citas${params ? '?' + params : ''}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Error al cargar citas');

    const data             = await res.json();
    estadoCitas.listaCitas = data.citas || [];
    renderizarTablaCitas(estadoCitas.listaCitas);

    const conteo = document.getElementById('citas-conteo');
    if (conteo) conteo.textContent = `${estadoCitas.listaCitas.length} registros`;

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:20px; text-align:center; color:red;">Error: ${err.message}</td></tr>`;
  }
}

// ── Render tabla ──────────────────────────────────────────────
function renderizarTablaCitas(lista) {
  const tbody = document.getElementById('citas-tbody');
  if (!tbody) return;

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:20px; text-align:center; color:#888;">No hay citas registradas.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  lista.forEach(cita => {
    const badge = getBadgeEstado(cita.estado);
    const tr    = document.createElement('tr');
    tr.style.borderBottom = '1px solid #eef2f8';
    tr.style.transition    = 'background 0.2s';
    tr.addEventListener('mouseenter', () => tr.style.backgroundColor = '#f8fafc');
    tr.addEventListener('mouseleave', () => tr.style.backgroundColor = 'transparent');

    tr.innerHTML = `
      <td style="padding:12px 16px; font-family:'DM Mono',monospace; font-size:0.82rem; color:#718096;">#${cita.id}</td>
      <td style="padding:12px 16px; font-weight:500; color:#2d3748;">${cita.paciente}</td>
      <td style="padding:12px 16px; color:#4a5568;">${cita.doctor}</td>
      <td style="padding:12px 16px; color:#718096; font-size:0.88rem;">${cita.motivo || '—'}</td>
      <td style="padding:12px 16px; color:#4a5568; font-size:0.88rem;">${cita.fecha_reporte}</td>
      <td style="padding:12px 16px;">${badge}</td>
      <td style="padding:12px 16px; text-align:center; white-space:nowrap;">
        ${cita.estado === 'PENDIENTE' ? `
          <button class="btn-confirmar" data-id="${cita.id}"
            style="background:#48bb78; color:white; border:none; padding:4px 9px; border-radius:4px; font-size:0.78rem; cursor:pointer; font-weight:500; margin-right:4px;">
            Confirmar
          </button>
          <button class="btn-reprogramar" data-id="${cita.id}" data-fecha="${cita.fecha_iso}"
            style="background:#f6ad55; color:white; border:none; padding:4px 9px; border-radius:4px; font-size:0.78rem; cursor:pointer; font-weight:500; margin-right:4px;">
            Reprogramar
          </button>
          <button class="btn-cancelar-cita" data-id="${cita.id}"
            style="background:#fc8181; color:white; border:none; padding:4px 9px; border-radius:4px; font-size:0.78rem; cursor:pointer; font-weight:500;">
            Cancelar
          </button>` : '—'}
      </td>
    `;

    tr.querySelector('.btn-confirmar')?.addEventListener('click',     () => cambiarEstadoCita(cita.id, 'CONFIRMADA'));
    tr.querySelector('.btn-cancelar-cita')?.addEventListener('click', () => cambiarEstadoCita(cita.id, 'CANCELADA'));
    tr.querySelector('.btn-reprogramar')?.addEventListener('click',   () => abrirModalReprogramar(cita));

    tbody.appendChild(tr);
  });
}

function getBadgeEstado(estado) {
  const estilos = {
    PENDIENTE:  'background:#fefcbf; color:#744210;',
    CONFIRMADA: 'background:#c6f6d5; color:#22543d;',
    CANCELADA:  'background:#fed7d7; color:#822727;',
    FINALIZADA: 'background:#e2e8f0; color:#4a5568;',
  };
  const estilo = estilos[estado] || 'background:#e2e8f0; color:#4a5568;';
  return `<span style="font-size:0.78rem; padding:3px 10px; border-radius:20px; font-weight:600; ${estilo}">${estado}</span>`;
}

async function cambiarEstadoCita(id, nuevoEstado) {
  const token  = localStorage.getItem('token');
  const accion = nuevoEstado === 'CONFIRMADA' ? 'confirmar' : 'cancelar';
  if (!confirm(`¿Desea ${accion} la cita #${id}?`)) return;

  try {
    const res = await fetch(`${API_URL}/citas/update/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body:    JSON.stringify({ estado: nuevoEstado })
    });
    if (!res.ok) throw new Error('No se pudo actualizar el estado');
    await cargarListaCitas();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

// ── Filtros ───────────────────────────────────────────────────
function initFiltros() {
  const btnFiltrar = document.getElementById('btn-filtrar-citas');
  const btnLimpiar = document.getElementById('btn-limpiar-filtros');

  if (btnFiltrar) {
    btnFiltrar.addEventListener('click', () => {
      const nombre = document.getElementById('filtro-nombre-paciente')?.value.trim();
      const dpi    = document.getElementById('filtro-dpi-paciente')?.value.trim();
      const filtros = {};
      if (nombre) filtros.nombre = nombre;
      if (dpi)    filtros.dpi    = dpi;
      cargarListaCitas(filtros);
    });
  }

  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
      const fn = document.getElementById('filtro-nombre-paciente');
      const fd = document.getElementById('filtro-dpi-paciente');
      if (fn) fn.value = '';
      if (fd) fd.value = '';
      cargarListaCitas();
    });
  }
}

// ── Modal Reprogramar ─────────────────────────────────────────
function initModalReprogramar() {
  // Cerrar modal al hacer click fuera
  const overlay = document.getElementById('modal-reprogramar-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cerrarModalReprogramar();
    });
  }

  // Botones cerrar
  const btnCerrar  = document.getElementById('modal-btn-cerrar');
  const btnCerrar2 = document.getElementById('modal-btn-cerrar-2');
  if (btnCerrar)  btnCerrar.addEventListener('click',  cerrarModalReprogramar);
  if (btnCerrar2) btnCerrar2.addEventListener('click', cerrarModalReprogramar);

  // Submit del formulario de reprogramación
  const form = document.getElementById('form-reprogramar');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token   = localStorage.getItem('token');
      const citaId  = document.getElementById('reprog-cita-id')?.value;
      const fecha   = document.getElementById('reprog-fecha')?.value;
      const doctor  = document.getElementById('reprog-doctorId')?.value;
      const errorEl = document.getElementById('modal-error');

      if (!fecha) { 
        if (errorEl) errorEl.textContent = 'Debe seleccionar una nueva fecha y hora.';
        return; 
      }

      try {
        const payload = {
          fecha,
          ...(doctor && { doctorId: parseInt(doctor) })
        };

        const res  = await fetch(`${API_URL}/citas/update/${citaId}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body:    JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Error al reprogramar');

        cerrarModalReprogramar();
        await cargarListaCitas();
        alert('¡Cita reprogramada exitosamente!');
      } catch (err) {
        if (errorEl) errorEl.textContent = `Error: ${err.message}`;
      }
    });
  }
}

function abrirModalReprogramar(cita) {
  const overlay  = document.getElementById('modal-reprogramar-overlay');
  const titulo   = document.getElementById('modal-cita-info');
  const inputId  = document.getElementById('reprog-cita-id');
  const inputFecha = document.getElementById('reprog-fecha');
  const errorEl  = document.getElementById('modal-error');

  if (!overlay) return;

  // Llenar datos
  if (titulo)    titulo.textContent = `Cita #${cita.id} — ${cita.paciente} con ${cita.doctor}`;
  if (inputId)   inputId.value      = cita.id;
  if (errorEl)   errorEl.textContent = '';

  // Pre-llenar con la fecha actual de la cita en formato datetime-local
  if (inputFecha && cita.fecha_iso) {
    const fechaLocal = new Date(cita.fecha_iso);
    const offset     = fechaLocal.getTimezoneOffset();
    const fechaAdj   = new Date(fechaLocal.getTime() - offset * 60000);
    inputFecha.value = fechaAdj.toISOString().slice(0, 16);
    inputFecha.min   = new Date().toISOString().slice(0, 16); // no permitir fechas pasadas
  }

  // Poblar doctores de la sede del token
  poblarDoctoresModal();

  // Mostrar modal
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function cerrarModalReprogramar() {
  const overlay = document.getElementById('modal-reprogramar-overlay');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}

async function poblarDoctoresModal() {
  const token = localStorage.getItem('token');
  let sedeIdToken = null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    sedeIdToken   = payload.sedeId || null;
  } catch (e) {}

  const selDoctor = document.getElementById('reprog-doctorId');
  if (!selDoctor) return;

  try {
    const url      = sedeIdToken ? `${API_URL}/doctores?sedeId=${sedeIdToken}` : `${API_URL}/doctores`;
    const res      = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    const doctores = await res.json();

    selDoctor.innerHTML = '<option value="">— Mantener mismo médico —</option>';
    doctores.forEach(d => {
      const esp = d.especialidad?.nombre || '';
      selDoctor.innerHTML += `<option value="${d.id_doctor}">${d.nombres} — ${esp}</option>`;
    });
  } catch (err) {
    console.error('Error cargando doctores modal:', err);
  }
}

// ── Poblar selectores nueva cita (con sede bloqueada) ─────────
async function poblarSelectoresCita() {
  const token = localStorage.getItem('token');
  let sedeIdToken = null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    sedeIdToken   = payload.sedeId || null;
  } catch (e) {}

  try {
    const urlDoctores = sedeIdToken
      ? `${API_URL}/doctores?sedeId=${sedeIdToken}`
      : `${API_URL}/doctores`;

    const [resDoctores, resSedes] = await Promise.all([
      fetch(urlDoctores,        { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/sedes`, { headers: { 'Authorization': `Bearer ${token}` } }),
    ]);

    const doctores = await resDoctores.json();
    const sedes    = await resSedes.json();

    const selDoctor = document.getElementById('cita-doctorId');
    if (selDoctor) {
      selDoctor.innerHTML = '<option value="">-- Seleccione Médico --</option>';
      doctores.forEach(d => {
        const esp = d.especialidad?.nombre || '';
        selDoctor.innerHTML += `<option value="${d.id_doctor}">${d.nombres} — ${esp}</option>`;
      });
    }

    const selSede = document.getElementById('cita-sedeId');
    if (selSede) {
      selSede.innerHTML = '<option value="">-- Seleccione Sede --</option>';
      sedes.forEach(s => {
        selSede.innerHTML += `<option value="${s.id_sede}">${s.nombre}</option>`;
      });

      if (sedeIdToken) {
        selSede.value              = sedeIdToken;
        selSede.disabled           = true;
        selSede.style.background   = '#f8fafc';
        selSede.style.color        = '#718096';
        selSede.style.cursor       = 'not-allowed';
      }
    }
  } catch (err) {
    console.error('Error poblando selectores:', err);
  }
}

// ── Buscador DPI ──────────────────────────────────────────────
function initBuscadorDpi() {
  const btnBuscar = document.getElementById('btn-buscar-dpi');
  if (!btnBuscar) return;

  btnBuscar.addEventListener('click', async () => {
    const dpi   = document.getElementById('cita-dpi')?.value.trim();
    const panel = document.getElementById('panel-datos-paciente');
    const info  = document.getElementById('info-paciente-encontrado');
    if (!dpi) { alert('Ingrese un DPI para buscar.'); return; }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/pacientes/dpi/${dpi}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const paciente = await res.json();
        if (panel) panel.style.display = 'block';
        if (info) info.innerHTML = `
          <div style="background:#f0fff4; border:1px solid #9ae6b4; border-radius:8px; padding:12px 16px;">
            <p style="margin:0 0 4px; font-weight:600; color:#22543d;">✓ Paciente encontrado</p>
            <p style="margin:0; color:#2d3748; font-size:0.9rem;">
              <strong>${paciente.nombres} ${paciente.apellidos}</strong> — DPI: ${paciente.dpi}<br/>
              Tel: ${paciente.telefono} | ${paciente.email}
            </p>
          </div>`;
        toggleFormularioPaciente(false);
      } else {
        if (panel) panel.style.display = 'block';
        if (info) info.innerHTML = `
          <div style="background:#fff5f5; border:1px solid #fc8181; border-radius:8px; padding:12px 16px;">
            <p style="margin:0; color:#822727; font-size:0.9rem;">⚠ Paciente no encontrado. Complete los datos para registrarlo.</p>
          </div>`;
        toggleFormularioPaciente(true);
      }
    } catch (err) {
      alert('Error al buscar paciente: ' + err.message);
    }
  });
}

function toggleFormularioPaciente(mostrar) {
  const campos = document.getElementById('campos-nuevo-paciente');
  if (campos) campos.style.display = mostrar ? 'grid' : 'none';
}

// ── Formulario nueva cita ─────────────────────────────────────
function initFormularioCita() {
  const form = document.getElementById('formulario-nueva-cita');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token    = localStorage.getItem('token');
    const dpi      = document.getElementById('cita-dpi')?.value.trim();
    const doctorId = document.getElementById('cita-doctorId')?.value;
    const sedeId   = document.getElementById('cita-sedeId')?.value;
    const fecha    = document.getElementById('cita-fecha')?.value;
    const motivo   = document.getElementById('cita-motivo')?.value;

    if (!dpi || !doctorId || !sedeId || !fecha) {
      alert('Complete todos los campos obligatorios.');
      return;
    }

    const camposNuevos = document.getElementById('campos-nuevo-paciente');
    const esNuevo      = camposNuevos && camposNuevos.style.display !== 'none';

    const payload = {
      paciente: {
        dpi,
        nombres:             esNuevo ? document.getElementById('pac-nombres')?.value    : dpi,
        apellidos:           esNuevo ? document.getElementById('pac-apellidos')?.value  : '',
        sexo:                esNuevo ? document.getElementById('pac-sexo')?.value       : 'MASCULINO',
        telefono:            esNuevo ? document.getElementById('pac-telefono')?.value   : '',
        email:               esNuevo ? document.getElementById('pac-email')?.value      : '',
        direccion:           esNuevo ? document.getElementById('pac-direccion')?.value  : '',
        contacto_emergencia: esNuevo ? document.getElementById('pac-contacto')?.value   : '',
        fecha_nacimiento:    esNuevo ? document.getElementById('pac-nacimiento')?.value : '2000-01-01',
      },
      cita:   { fecha, motivo, doctorId },
      sedeId
    };

    try {
      const res  = await fetch(`${API_URL}/citas/registrar-completo`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar la cita');

      alert('¡Cita registrada exitosamente!');
      form.reset();
      await poblarSelectoresCita();
      toggleFormularioPaciente(false);
      const panel = document.getElementById('panel-datos-paciente');
      const info  = document.getElementById('info-paciente-encontrado');
      if (panel) panel.style.display = 'none';
      if (info)  info.innerHTML = '';
      mostrarVista('lista');
      await cargarListaCitas();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });
}