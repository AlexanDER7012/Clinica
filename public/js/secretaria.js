import { verificarSesion, initLogout }                        from './menuAuth.js';
import { initCitasModule, cargarModuloCitas }                 from './menuCitas.js';
import { initFacturacionModule, cargarModuloFacturacion }     from './menuFacturacion.js';
import { initCalendarioModule, cargarModuloCalendario }       from './menuCalendario.js';
import { initHistorialModule }                                 from './menuHistorial.js';
import { API_URL }                                            from './menuConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!verificarSesion() || usuario?.rol !== 'SECRETARIA') {
    window.location.href = 'index.html';
    return;
  }

  initRouter();
  initCitasModule();
  initFacturacionModule();
  initCalendarioModule();
  initHistorialModule();
  initLogout();

  cargarModuloCitas();
});

// ── Router de la secretaria ───────────────────────────────────
function initRouter() {
  const pageTitle = document.getElementById('dinamic-title');

  function ocultarTodo() {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active-view'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  }

  const btnHistorial   = document.getElementById('btn-nav-historial');
  const btnCalendario  = document.getElementById('btn-nav-calendario');
  const btnCitas       = document.getElementById('btn-nav-citas');
  const btnFacturacion = document.getElementById('btn-nav-facturacion');
  const btnPacientes   = document.getElementById('btn-nav-pacientes');

  if (btnHistorial) {
    btnHistorial.addEventListener('click', (e) => {
      e.preventDefault(); ocultarTodo(); btnHistorial.classList.add('active');
      document.getElementById('sec-historial')?.classList.add('active-view');
      if (pageTitle) pageTitle.textContent = 'Expediente Clínico';
    });
  }

  if (btnCalendario) {
    btnCalendario.addEventListener('click', (e) => {
      e.preventDefault(); ocultarTodo(); btnCalendario.classList.add('active');
      document.getElementById('sec-calendario')?.classList.add('active-view');
      if (pageTitle) pageTitle.textContent = 'Calendario de Citas';
      cargarModuloCalendario();
    });
  }

  if (btnCitas) {
    btnCitas.addEventListener('click', (e) => {
      e.preventDefault(); ocultarTodo(); btnCitas.classList.add('active');
      document.getElementById('sec-citas')?.classList.add('active-view');
      if (pageTitle) pageTitle.textContent = 'Gestión de Citas Médicas';
      cargarModuloCitas();
    });
  }

  if (btnFacturacion) {
    btnFacturacion.addEventListener('click', (e) => {
      e.preventDefault(); ocultarTodo(); btnFacturacion.classList.add('active');
      document.getElementById('sec-facturacion')?.classList.add('active-view');
      if (pageTitle) pageTitle.textContent = 'Módulo de Facturación';
      cargarModuloFacturacion();
    });
  }

  if (btnPacientes) {
    btnPacientes.addEventListener('click', (e) => {
      e.preventDefault(); ocultarTodo(); btnPacientes.classList.add('active');
      document.getElementById('sec-pacientes')?.classList.add('active-view');
      if (pageTitle) pageTitle.textContent = 'Listado de Pacientes';
      cargarPacientes();
    });
  }
}

// ── Cargar listado de pacientes ───────────────────────────────
async function cargarPacientes() {
  const token = localStorage.getItem('token');
  const tbody = document.getElementById('pacientes-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center; color:#888;">Cargando...</td></tr>`;

  try {
    const res       = await fetch(`${API_URL}/pacientes`, { headers: { 'Authorization': `Bearer ${token}` } });
    const pacientes = await res.json();

    if (pacientes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center; color:#888;">No hay pacientes registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    pacientes.forEach(p => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #eef2f8';
      tr.style.transition    = 'background 0.2s';
      tr.addEventListener('mouseenter', () => tr.style.backgroundColor = '#f8fafc');
      tr.addEventListener('mouseleave', () => tr.style.backgroundColor = 'transparent');
      tr.innerHTML = `
        <td style="padding:12px 16px; font-family:'DM Mono',monospace; font-size:0.82rem; color:#718096;">#${p.id_paciente}</td>
        <td style="padding:12px 16px; font-weight:500; color:#2d3748;">${p.nombres} ${p.apellidos}</td>
        <td style="padding:12px 16px; color:#4a5568;">${p.dpi}</td>
        <td style="padding:12px 16px; color:#718096;">${p.telefono}</td>
        <td style="padding:12px 16px; color:#718096; font-size:0.88rem;">${p.email}</td>
        <td style="padding:12px 16px; text-align:center;">
          <span style="background:#ebf8ff; color:#2b6cb0; font-size:0.78rem; padding:3px 10px; border-radius:20px; font-weight:600;">
            ${p._count?.citas ?? 0} citas
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center; color:red;">Error: ${err.message}</td></tr>`;
  }
}