/* ══════════════════════════════════════
   js/menuHistorial.js
   Historial Clínico — REQ 1.2
══════════════════════════════════════ */

import { API_URL } from './menuConfig.js';

export function initHistorialModule() {
  initBuscadorHistorial();
}

function initBuscadorHistorial() {
  document.getElementById('hist-btn-buscar')?.addEventListener('click', buscarPacienteHistorial);
  document.getElementById('hist-dpi')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') buscarPacienteHistorial();
  });
}

async function buscarPacienteHistorial() {
  const token = localStorage.getItem('token');
  const dpi   = document.getElementById('hist-dpi')?.value.trim();
  const panel = document.getElementById('hist-panel-resultado');
  if (!dpi) { alert('Ingrese el DPI del paciente.'); return; }

  panel.innerHTML = `<p style="text-align:center;color:#888;padding:20px;">Buscando...</p>`;

  try {
    const resPac = await fetch(`${API_URL}/pacientes/dpi/${dpi}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resPac.ok) {
      panel.innerHTML = `
        <div style="text-align:center;padding:40px;color:#718096;">
          <div style="font-size:2.5rem;margin-bottom:12px;">🔍</div>
          <p>No se encontró ningún paciente con DPI <strong>${dpi}</strong></p>
        </div>`;
      return;
    }
    const paciente = await resPac.json();
    const resHist  = await fetch(`${API_URL}/historial/${paciente.id_paciente}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    renderHistorial(await resHist.json());
  } catch (err) {
    panel.innerHTML = `<p style="color:red;padding:20px;">Error: ${err.message}</p>`;
  }
}

// ── Render historial ──────────────────────────────────────────
function renderHistorial(p) {
  const panel = document.getElementById('hist-panel-resultado');
  if (!panel) return;

  const edad = p.fecha_nacimiento
    ? Math.floor((new Date() - new Date(p.fecha_nacimiento)) / (365.25 * 24 * 3600 * 1000))
    : '—';
  const citasFinalizadas = p.citas.filter(c => c.estado === 'FINALIZADA').length;
  const nacStr = p.fecha_nacimiento ? p.fecha_nacimiento.slice(0, 10) : '';

  panel.innerHTML = `
    <!-- Datos del paciente -->
    <div style="background:white;border:1px solid #eef2f8;border-radius:12px;padding:24px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#1a365d,#1a7a5e);
                      display:flex;align-items:center;justify-content:center;color:white;font-size:1.3rem;font-weight:700;flex-shrink:0;">
            ${p.nombres.charAt(0)}${p.apellidos.charAt(0)}
          </div>
          <div>
            <h3 style="margin:0 0 4px;font-size:1.05rem;font-weight:700;color:#1a365d;">${p.nombres} ${p.apellidos}</h3>
            <p style="margin:0;color:#718096;font-size:0.85rem;">DPI: <strong>${p.dpi}</strong> &nbsp;|&nbsp; ${p.sexo} &nbsp;|&nbsp; ${edad} años</p>
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:flex-start;">
          <button id="hist-btn-editar-datos"
            style="background:#1a365d;color:white;border:none;padding:8px 16px;border-radius:8px;font-size:0.82rem;cursor:pointer;font-weight:600;">
            ✏️ Editar Datos
          </button>
          <div style="text-align:center;background:#f8fafc;border-radius:8px;padding:10px 16px;">
            <div style="font-size:1.4rem;font-weight:700;color:#1a365d;">${p.citas.length}</div>
            <div style="font-size:0.7rem;color:#718096;text-transform:uppercase;">Total citas</div>
          </div>
          <div style="text-align:center;background:#f0fff4;border-radius:8px;padding:10px 16px;">
            <div style="font-size:1.4rem;font-weight:700;color:#22543d;">${citasFinalizadas}</div>
            <div style="font-size:0.7rem;color:#718096;text-transform:uppercase;">Finalizadas</div>
          </div>
        </div>
      </div>

      <!-- Datos contacto -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;
                  margin-top:16px;padding-top:16px;border-top:1px solid #eef2f8;">
        <div>
          <span style="font-size:0.7rem;color:#a0aec0;text-transform:uppercase;">Teléfono</span>
          <p style="margin:2px 0 0;font-size:0.9rem;color:#2d3748;font-weight:500;">${p.telefono || '—'}</p>
        </div>
        <div>
          <span style="font-size:0.7rem;color:#a0aec0;text-transform:uppercase;">Email</span>
          <p style="margin:2px 0 0;font-size:0.9rem;color:#2d3748;font-weight:500;">${p.email || '—'}</p>
        </div>
        <div>
          <span style="font-size:0.7rem;color:#a0aec0;text-transform:uppercase;">Dirección</span>
          <p style="margin:2px 0 0;font-size:0.9rem;color:#2d3748;font-weight:500;">${p.direccion || '—'}</p>
        </div>
        <div>
          <span style="font-size:0.7rem;color:#a0aec0;text-transform:uppercase;">Emergencia</span>
          <p style="margin:2px 0 0;font-size:0.9rem;color:#2d3748;font-weight:500;">${p.contacto_emergencia || '—'}</p>
        </div>
      </div>

      <!-- Formulario edición (oculto) -->
      <div id="hist-form-editar" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid #eef2f8;">
        <p style="font-size:0.75rem;font-weight:700;color:#1a7a5e;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">
          Editar Información del Paciente
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div>
            <label style="font-size:0.72rem;font-weight:600;color:#4a5568;text-transform:uppercase;display:block;margin-bottom:4px;">Nombres *</label>
            <input id="edit-nombres" type="text" value="${p.nombres}"
              style="width:100%;border:1.5px solid #d4e8e0;border-radius:8px;padding:8px 12px;font-family:inherit;font-size:0.88rem;outline:none;">
            <p id="edit-err-nombres" style="color:#e53e3e;font-size:0.72rem;margin:3px 0 0;"></p>
          </div>
          <div>
            <label style="font-size:0.72rem;font-weight:600;color:#4a5568;text-transform:uppercase;display:block;margin-bottom:4px;">Apellidos *</label>
            <input id="edit-apellidos" type="text" value="${p.apellidos}"
              style="width:100%;border:1.5px solid #d4e8e0;border-radius:8px;padding:8px 12px;font-family:inherit;font-size:0.88rem;outline:none;">
            <p id="edit-err-apellidos" style="color:#e53e3e;font-size:0.72rem;margin:3px 0 0;"></p>
          </div>
          <div>
            <label style="font-size:0.72rem;font-weight:600;color:#4a5568;text-transform:uppercase;display:block;margin-bottom:4px;">Teléfono * (8 dígitos)</label>
            <input id="edit-telefono" type="text" value="${p.telefono}" maxlength="8"
              style="width:100%;border:1.5px solid #d4e8e0;border-radius:8px;padding:8px 12px;font-family:inherit;font-size:0.88rem;outline:none;">
            <p id="edit-err-telefono" style="color:#e53e3e;font-size:0.72rem;margin:3px 0 0;"></p>
          </div>
          <div>
            <label style="font-size:0.72rem;font-weight:600;color:#4a5568;text-transform:uppercase;display:block;margin-bottom:4px;">Email *</label>
            <input id="edit-email" type="email" value="${p.email}"
              style="width:100%;border:1.5px solid #d4e8e0;border-radius:8px;padding:8px 12px;font-family:inherit;font-size:0.88rem;outline:none;">
            <p id="edit-err-email" style="color:#e53e3e;font-size:0.72rem;margin:3px 0 0;"></p>
          </div>
          <div>
            <label style="font-size:0.72rem;font-weight:600;color:#4a5568;text-transform:uppercase;display:block;margin-bottom:4px;">Sexo *</label>
            <select id="edit-sexo"
              style="width:100%;border:1.5px solid #d4e8e0;border-radius:8px;padding:8px 12px;font-family:inherit;font-size:0.88rem;outline:none;">
              <option value="MASCULINO" ${p.sexo === 'MASCULINO' ? 'selected' : ''}>Masculino</option>
              <option value="FEMENINO"  ${p.sexo === 'FEMENINO'  ? 'selected' : ''}>Femenino</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.72rem;font-weight:600;color:#4a5568;text-transform:uppercase;display:block;margin-bottom:4px;">Fecha Nacimiento *</label>
            <input id="edit-nacimiento" type="date" value="${nacStr}"
              style="width:100%;border:1.5px solid #d4e8e0;border-radius:8px;padding:8px 12px;font-family:inherit;font-size:0.88rem;outline:none;">
          </div>
        </div>
        <div style="margin-bottom:12px;">
          <label style="font-size:0.72rem;font-weight:600;color:#4a5568;text-transform:uppercase;display:block;margin-bottom:4px;">Dirección *</label>
          <input id="edit-direccion" type="text" value="${p.direccion}"
            style="width:100%;border:1.5px solid #d4e8e0;border-radius:8px;padding:8px 12px;font-family:inherit;font-size:0.88rem;outline:none;">
          <p id="edit-err-direccion" style="color:#e53e3e;font-size:0.72rem;margin:3px 0 0;"></p>
        </div>
        <div style="margin-bottom:16px;">
          <label style="font-size:0.72rem;font-weight:600;color:#4a5568;text-transform:uppercase;display:block;margin-bottom:4px;">
            Contacto Emergencia <span style="color:#a0aec0;font-weight:400;">(Opcional)</span>
          </label>
          <input id="edit-contacto" type="text" value="${p.contacto_emergencia || ''}"
            style="width:100%;border:1.5px solid #d4e8e0;border-radius:8px;padding:8px 12px;font-family:inherit;font-size:0.88rem;outline:none;">
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="hist-btn-cancelar-edicion"
            style="background:#e2e8f0;color:#4a5568;border:none;padding:9px 18px;border-radius:8px;font-size:0.85rem;cursor:pointer;font-weight:500;">
            Cancelar
          </button>
          <button id="hist-btn-guardar-edicion" data-paciente="${p.id_paciente}" data-dpi="${p.dpi}"
            style="background:#1a7a5e;color:white;border:none;padding:9px 20px;border-radius:8px;font-size:0.85rem;cursor:pointer;font-weight:600;">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>

    <!-- Alergias -->
    <div style="background:white;border:1px solid #eef2f8;border-radius:12px;padding:24px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h4 style="margin:0;font-size:1rem;font-weight:700;color:#1a365d;">⚠️ Alergias Conocidas</h4>
        <button id="hist-btn-editar-alergias"
          style="background:#f8fafc;border:1px solid #e2e8f0;color:#4a5568;padding:6px 14px;border-radius:8px;font-size:0.82rem;cursor:pointer;font-weight:500;">
          ✏️ Editar
        </button>
      </div>
      <div id="hist-vista-alergias">
        ${p.alergias
          ? `<div style="background:#fff5f5;border:1px solid #feb2b2;border-radius:8px;padding:12px 16px;">
               <p style="margin:0;color:#822727;font-size:0.9rem;">⚠️ ${p.alergias}</p>
             </div>`
          : `<p style="color:#a0aec0;font-size:0.88rem;margin:0;">Sin alergias registradas.</p>`
        }
      </div>
      <div id="hist-form-alergias" style="display:none;margin-top:12px;">
        <textarea id="hist-input-alergias" rows="3"
          placeholder="Ej: Penicilina, Polen, Mariscos. Dejar vacío si no tiene alergias."
          style="width:100%;border:1.5px solid #d4e8e0;border-radius:8px;padding:10px 14px;font-family:inherit;font-size:0.9rem;resize:vertical;outline:none;"
        >${p.alergias || ''}</textarea>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
          <button id="hist-btn-cancelar-alergias"
            style="background:#e2e8f0;color:#4a5568;border:none;padding:7px 16px;border-radius:8px;font-size:0.85rem;cursor:pointer;">
            Cancelar
          </button>
          <button id="hist-btn-guardar-alergias" data-paciente="${p.id_paciente}"
            style="background:#1a7a5e;color:white;border:none;padding:7px 18px;border-radius:8px;font-size:0.85rem;cursor:pointer;font-weight:600;">
            Guardar
          </button>
        </div>
      </div>
    </div>

    <!-- Historial de consultas -->
    <div style="background:white;border:1px solid #eef2f8;border-radius:12px;padding:24px;">
      <h4 style="margin:0 0 16px;font-size:1rem;font-weight:700;color:#1a365d;">📋 Historial de Consultas</h4>
      ${renderCitas(p.citas)}
    </div>
  `;

  // ── Eventos edición datos ─────────────────────────────────
  document.getElementById('hist-btn-editar-datos')?.addEventListener('click', () => {
    const form = document.getElementById('hist-form-editar');
    if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('hist-btn-cancelar-edicion')?.addEventListener('click', () => {
    document.getElementById('hist-form-editar').style.display = 'none';
    limpiarErrores();
  });

  document.getElementById('hist-btn-guardar-edicion')?.addEventListener('click', async () => {
    if (!validarFormulario()) return;
    const token      = localStorage.getItem('token');
    const btn        = document.getElementById('hist-btn-guardar-edicion');
    const pacienteId = btn.dataset.paciente;
    const dpi        = btn.dataset.dpi;

    const datos = {
      dpi,
      nombres:             document.getElementById('edit-nombres').value.trim(),
      apellidos:           document.getElementById('edit-apellidos').value.trim(),
      telefono:            document.getElementById('edit-telefono').value.trim(),
      email:               document.getElementById('edit-email').value.trim(),
      sexo:                document.getElementById('edit-sexo').value,
      direccion:           document.getElementById('edit-direccion').value.trim(),
      contacto_emergencia: document.getElementById('edit-contacto').value.trim() || null,
      fecha_nacimiento:    document.getElementById('edit-nacimiento').value,
    };

    try {
      const res = await fetch(`${API_URL}/pacientes/${pacienteId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify(datos)
      });
      if (!res.ok) throw new Error('Error al guardar cambios');

      alert('✅ Datos actualizados correctamente.');
      const resHist = await fetch(`${API_URL}/historial/${pacienteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      renderHistorial(await resHist.json());
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  // Restricciones teclado
  ['edit-nombres', 'edit-apellidos'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '');
    });
  });
  document.getElementById('edit-telefono')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
  });

  // ── Eventos alergias ──────────────────────────────────────
  document.getElementById('hist-btn-editar-alergias')?.addEventListener('click', () => {
    document.getElementById('hist-vista-alergias').style.display = 'none';
    document.getElementById('hist-form-alergias').style.display  = 'block';
  });

  document.getElementById('hist-btn-cancelar-alergias')?.addEventListener('click', () => {
    document.getElementById('hist-vista-alergias').style.display = 'block';
    document.getElementById('hist-form-alergias').style.display  = 'none';
  });

  document.getElementById('hist-btn-guardar-alergias')?.addEventListener('click', async () => {
    const token      = localStorage.getItem('token');
    const pacienteId = document.getElementById('hist-btn-guardar-alergias').dataset.paciente;
    const alergias   = document.getElementById('hist-input-alergias')?.value.trim();

    try {
      const res = await fetch(`${API_URL}/historial/${pacienteId}/alergias`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ alergias: alergias || null })
      });
      if (!res.ok) throw new Error('Error al guardar');

      const vista = document.getElementById('hist-vista-alergias');
      vista.innerHTML = alergias
        ? `<div style="background:#fff5f5;border:1px solid #feb2b2;border-radius:8px;padding:12px 16px;">
             <p style="margin:0;color:#822727;font-size:0.9rem;">⚠️ ${alergias}</p>
           </div>`
        : `<p style="color:#a0aec0;font-size:0.88rem;margin:0;">Sin alergias registradas.</p>`;

      document.getElementById('hist-vista-alergias').style.display = 'block';
      document.getElementById('hist-form-alergias').style.display  = 'none';
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
}

// ── Validaciones ──────────────────────────────────────────────
function validarFormulario() {
  limpiarErrores();
  let valido = true;

  const campos = [
    { id: 'edit-nombres',   err: 'edit-err-nombres',   regex: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, msg: 'Solo letras.' },
    { id: 'edit-apellidos', err: 'edit-err-apellidos', regex: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, msg: 'Solo letras.' },
    { id: 'edit-telefono',  err: 'edit-err-telefono',  regex: /^\d{8}$/,                       msg: 'Exactamente 8 dígitos.' },
    { id: 'edit-email',     err: 'edit-err-email',     regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,   msg: 'Correo no válido.' },
    { id: 'edit-direccion', err: 'edit-err-direccion', regex: /.+/,                            msg: 'La dirección es obligatoria.' },
  ];

  campos.forEach(({ id, err, regex, msg }) => {
    const val = document.getElementById(id)?.value.trim();
    if (!val || !regex.test(val)) {
      document.getElementById(err).textContent = msg;
      document.getElementById(id).style.borderColor = '#e53e3e';
      valido = false;
    }
  });

  return valido;
}

function limpiarErrores() {
  ['edit-err-nombres','edit-err-apellidos','edit-err-telefono','edit-err-email','edit-err-direccion'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  ['edit-nombres','edit-apellidos','edit-telefono','edit-email','edit-direccion'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.borderColor = '#d4e8e0';
  });
}

// ── Tabla de consultas ────────────────────────────────────────
function renderCitas(citas) {
  if (!citas.length) return `<p style="color:#a0aec0;font-size:0.88rem;text-align:center;padding:16px;">Sin consultas registradas.</p>`;

  const COL = {
    FINALIZADA: { bg:'#e2e8f0', color:'#4a5568' },
    CONFIRMADA: { bg:'#c6f6d5', color:'#22543d' },
    CANCELADA:  { bg:'#fed7d7', color:'#822727' },
    PENDIENTE:  { bg:'#fefcbf', color:'#744210' },
  };

  return `
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:0.88rem;">
        <thead>
          <tr style="background:#f8fafc;border-bottom:2px solid #eef2f8;">
            <th style="padding:10px 14px;text-align:left;color:#4a5568;font-weight:600;">Fecha</th>
            <th style="padding:10px 14px;text-align:left;color:#4a5568;font-weight:600;">Médico</th>
            <th style="padding:10px 14px;text-align:left;color:#4a5568;font-weight:600;">Especialidad</th>
            <th style="padding:10px 14px;text-align:left;color:#4a5568;font-weight:600;">Motivo</th>
            <th style="padding:10px 14px;text-align:left;color:#4a5568;font-weight:600;">Receta</th>
            <th style="padding:10px 14px;text-align:center;color:#4a5568;font-weight:600;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${citas.map(c => {
            const col   = COL[c.estado] || COL.PENDIENTE;
            const fecha = new Intl.DateTimeFormat('es-GT', {
              dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Guatemala'
            }).format(new Date(c.fecha));
            return `
              <tr style="border-bottom:1px solid #eef2f8;">
                <td style="padding:10px 14px;color:#4a5568;white-space:nowrap;">${fecha}</td>
                <td style="padding:10px 14px;font-weight:500;color:#2d3748;">${c.doctor.nombres}</td>
                <td style="padding:10px 14px;color:#718096;">${c.doctor.especialidad?.nombre || '—'}</td>
                <td style="padding:10px 14px;color:#4a5568;">${c.motivo || '—'}</td>
                <td style="padding:10px 14px;color:#4a5568;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${c.receta_medica || ''}">
                  ${c.receta_medica || '<span style="color:#a0aec0;">Sin receta</span>'}
                </td>
                <td style="padding:10px 14px;text-align:center;">
                  <span style="background:${col.bg};color:${col.color};font-size:0.72rem;padding:2px 10px;border-radius:20px;font-weight:700;">
                    ${c.estado}
                  </span>
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}