/* ══════════════════════════════════════
   js/menuAuditoria.js
   Módulo de Log de Auditoría — Panel Admin
══════════════════════════════════════ */

import { API_URL } from './menuConfig.js';

export function initAuditoriaModule() {
  initFiltrosAuditoria();
}

export async function cargarModuloAuditoria() {
  await cargarLogs();
}

function initFiltrosAuditoria() {
  const btnFiltrar = document.getElementById('btn-filtrar-logs');
  const btnLimpiar = document.getElementById('btn-limpiar-logs');

  if (btnFiltrar) {
    btnFiltrar.addEventListener('click', () => {
      const accion = document.getElementById('filtro-log-accion')?.value.trim();
      cargarLogs({ accion });
    });
  }

  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
      const fa = document.getElementById('filtro-log-accion');
      if (fa) fa.value = '';
      cargarLogs();
    });
  }
}

async function cargarLogs(filtros = {}) {
  const token  = localStorage.getItem('token');
  const tbody  = document.getElementById('auditoria-tbody');
  const conteo = document.getElementById('auditoria-conteo');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center; color:#888;">Cargando registros...</td></tr>`;

  try {
    const params = new URLSearchParams();
    if (filtros.accion) params.append('accion', filtros.accion);
    params.append('limit', '200');

    const res  = await fetch(`${API_URL}/auditoria?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (conteo) conteo.textContent = `${data.total} registros`;

    if (!data.logs.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center; color:#888;">No hay registros de auditoría.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    data.logs.forEach(log => {
      const badge = getBadgeAccion(log.accion);
      const fecha = new Intl.DateTimeFormat('es-GT', {
        dateStyle: 'medium', timeStyle: 'medium', timeZone: 'America/Guatemala'
      }).format(new Date(log.fecha_hora));

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #eef2f8';
      tr.style.transition    = 'background 0.2s';
      tr.addEventListener('mouseenter', () => tr.style.backgroundColor = '#f8fafc');
      tr.addEventListener('mouseleave', () => tr.style.backgroundColor = 'transparent');

      tr.innerHTML = `
        <td style="padding:10px 16px; font-family:'DM Mono',monospace; font-size:0.8rem; color:#718096;">#${log.id_log}</td>
        <td style="padding:10px 16px;">${badge}</td>
        <td style="padding:10px 16px; color:#4a5568; font-size:0.88rem;">${log.tabla_afectada || '—'}</td>
        <td style="padding:10px 16px; color:#2d3748; font-size:0.88rem; max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${log.detalle || ''}">${log.detalle || '—'}</td>
        <td style="padding:10px 16px; color:#718096; font-size:0.85rem;">${log.usuario ? `${log.usuario.nombres}<br/><span style="font-size:0.78rem; color:#a0aec0;">${log.usuario.rol}</span>` : '<span style="color:#a0aec0;">Sistema</span>'}</td>
        <td style="padding:10px 16px; color:#718096; font-size:0.82rem; white-space:nowrap;">${fecha}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center; color:red;">Error: ${err.message}</td></tr>`;
  }
}

function getBadgeAccion(accion) {
  const colores = {
    LOGIN_EXITOSO:          'background:#c6f6d5; color:#22543d;',
    LOGIN_FALLIDO:          'background:#fed7d7; color:#822727;',
    LOGIN_BLOQUEADO:        'background:#fed7d7; color:#822727;',
    CUENTA_BLOQUEADA:       'background:#fed7d7; color:#822727;',
    CREAR_USUARIO:          'background:#ebf8ff; color:#2b6cb0;',
    DESBLOQUEAR_USUARIO:    'background:#c6f6d5; color:#22543d;',
    DESACTIVAR_USUARIO:     'background:#fed7d7; color:#822727;',
    CREAR_DOCTOR:           'background:#ebf8ff; color:#2b6cb0;',
    MODIFICAR_DOCTOR:       'background:#fefcbf; color:#744210;',
    DESACTIVAR_DOCTOR:      'background:#fed7d7; color:#822727;',
    CREAR_SEDE:             'background:#ebf8ff; color:#2b6cb0;',
    MODIFICAR_SEDE:         'background:#fefcbf; color:#744210;',
    DESACTIVAR_SEDE:        'background:#fed7d7; color:#822727;',
    CREAR_ESPECIALIDAD:     'background:#ebf8ff; color:#2b6cb0;',
    MODIFICAR_ESPECIALIDAD: 'background:#fefcbf; color:#744210;',
    DESACTIVAR_ESPECIALIDAD:'background:#fed7d7; color:#822727;',
    CREAR_CITA:             'background:#ebf8ff; color:#2b6cb0;',
    CITA_CONFIRMADA:        'background:#c6f6d5; color:#22543d;',
    CITA_CANCELADA:         'background:#fed7d7; color:#822727;',
    ACTUALIZAR_RECETA:      'background:#fefcbf; color:#744210;',
    ELIMINAR_CITA:          'background:#fed7d7; color:#822727;',
    EMITIR_FACTURA:         'background:#e9d8fd; color:#553c9a;',
  };
  const estilo = colores[accion] || 'background:#e2e8f0; color:#4a5568;';
  return `<span style="font-size:0.75rem; padding:3px 8px; border-radius:20px; font-weight:600; white-space:nowrap; ${estilo}">${accion.replace(/_/g, ' ')}</span>`;
}