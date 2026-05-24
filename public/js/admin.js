/* ══════════════════════════════════════
   js/admin.js — Punto de entrada ADMIN
══════════════════════════════════════ */

import { verificarSesion, initLogout } from './menuAuth.js';
import { initDoctorForm, initSedeForm, initEspecialidadForm, cargarSelectsFormulario } from './menuForms.js';
import { initControlModule, cambiarContextoControl }from './menuControl.js';
import { initDashboard, initAreaChart, initBarMiniChart } from './menuCharts.js';
import { initUsuariosModule, cargarModuloUsuarios } from './menuUsuarios.js';
import { initAuditoriaModule, cargarModuloAuditoria } from './menuAuditoria.js';
import { initReportesModule, cargarModuloReportes } from './menuReportes.js';
import { initHistorialModule } from './menuHistorial.js';
import { API_URL }from './menuConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!verificarSesion() || usuario?.rol !== 'ADMIN') {
    window.location.href = 'index.html';
    return;
  }
 
  initRouter();
  initDoctorForm();
  initSedeForm();
  initEspecialidadForm();
  initControlModule();
  initUsuariosModule();
  initAuditoriaModule();
  initReportesModule();
  initHistorialModule();
  initLogout();
  initAreaChart();
  initBarMiniChart();
  initDashboard();
  cargarPacientes();
});
 
function initRouter() {
  const vistas = {
    'btn-nav-dashboard':   { sec: 'sec-dashboard',   titulo: 'Dashboard Analítico' },
    'btn-nav-doctores':    { sec: 'sec-doctores',     titulo: 'Gestión de Médicos Clínicos' },
    'btn-nav-sedes':       { sec: 'sec-sedes',        titulo: 'Gestión de Sedes Clínicas' },
    'btn-nav-pacientes':   { sec: 'sec-pacientes',    titulo: 'Listado de Pacientes' },
    'btn-nav-usuarios':    { sec: 'sec-usuarios',     titulo: 'Gestión de Usuarios del Sistema' },
    'btn-nav-excepciones': { sec: 'sec-excepciones',  titulo: 'Gestión de Especialidades Médicas' },
    'btn-nav-control':     { sec: 'sec-control',      titulo: 'Módulo de Control y Mantenimiento' },
    'btn-nav-historial':   { sec: 'sec-historial',   titulo: 'Expediente Clínico' },
    'btn-nav-reportes':    { sec: 'sec-reportes',    titulo: 'Reportes Estadísticos' },
    'btn-nav-auditoria':   { sec: 'sec-auditoria',    titulo: 'Log de Auditoría del Sistema' },
  };
 
  const pageTitle = document.getElementById('dinamic-title');
 
  function ocultarTodo() {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active-view'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  }
 
  Object.entries(vistas).forEach(([btnId, { sec, titulo }]) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      ocultarTodo();
      btn.classList.add('active');
      document.getElementById(sec)?.classList.add('active-view');
      if (pageTitle) pageTitle.textContent = titulo;
 
      if (btnId === 'btn-nav-doctores')  cargarSelectsFormulario();
      if (btnId === 'btn-nav-control')   cambiarContextoControl('doctores');
      if (btnId === 'btn-nav-usuarios')  cargarModuloUsuarios();
      if (btnId === 'btn-nav-pacientes') cargarPacientes();
      if (btnId === 'btn-nav-dashboard') initDashboard();
      if (btnId === 'btn-nav-reportes')  cargarModuloReportes();
      if (btnId === 'btn-nav-auditoria') cargarModuloAuditoria();
    });
  });
}
 
async function cargarPacientes() {
  const token = localStorage.getItem('token');
  const tbody = document.getElementById('pacientes-tbody');
  if (!tbody) return;
 
  tbody.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center; color:#888;">Cargando...</td></tr>`;
 
  try {
    const res       = await fetch(`${API_URL}/pacientes`, { headers: { 'Authorization': `Bearer ${token}` } });
    const pacientes = await res.json();
 
    if (!pacientes.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center; color:#888;">No hay pacientes.</td></tr>`;
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