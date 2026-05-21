import { API_URL } from './menuConfig.js';


export function initUsuariosModule() {
initFormularioUsuario();
initRolDinamico();
}

export async function cargarModuloUsuarios() {
await poblarSedesSelector();
await cargarListaUsuarios();
}

function initRolDinamico() {
const selectRol  = document.getElementById('usuario-rol');
const grupSede   = document.getElementById('grupo-sede-usuario');
if(!selectRol) return;

selectRol.addEventListener('change', () => {
    if (grupSede) {
    grupSede.style.display = selectRol.value === 'SECRETARIA' ? 'block' : 'none';
    }
});
}


async function poblarSedesSelector() {
  const token     = localStorage.getItem('token');
  const selectSede = document.getElementById('usuario-sedeId');
  if (!selectSede) return;

  try {
    const res   = await fetch(`${API_URL}/sedes`, { headers: { 'Authorization': `Bearer ${token}` } });
    const sedes = await res.json();
    selectSede.innerHTML = '<option value="">-- Seleccione Sede --</option>';
    sedes.forEach(s => {
      selectSede.innerHTML += `<option value="${s.id_sede}">${s.nombre}</option>`;
    });
  } catch (err) {
    console.error('Error cargando sedes para usuario:', err);
  }
}


async function cargarListaUsuarios() {
  const token = localStorage.getItem('token');
  const tbody = document.getElementById('usuarios-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="padding:16px; text-align:center; color:#888;">Cargando...</td></tr>`;

  try {
    const res      = await fetch(`${API_URL}/usuarios`, { headers: { 'Authorization': `Bearer ${token}` } });
    const usuarios = await res.json();

    if (usuarios.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding:16px; text-align:center; color:#888;">No hay usuarios registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    usuarios.forEach(u => {
      const rolBadge  = u.rol === 'ADMIN'
        ? `<span style="background:#ebf8ff; color:#2b6cb0; font-size:0.78rem; padding:3px 10px; border-radius:20px; font-weight:600;">ADMIN</span>`
        : `<span style="background:#f0fff4; color:#22543d; font-size:0.78rem; padding:3px 10px; border-radius:20px; font-weight:600;">SECRETARIA</span>`;

      const bloqBadge = u.bloqueado
        ? `<span style="background:#fed7d7; color:#822727; font-size:0.78rem; padding:3px 8px; border-radius:20px; font-weight:600;">Bloqueado</span>`
        : `<span style="background:#c6f6d5; color:#22543d; font-size:0.78rem; padding:3px 8px; border-radius:20px; font-weight:600;">Activo</span>`;

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #eef2f8';
      tr.style.transition    = 'background 0.2s';
      tr.addEventListener('mouseenter', () => tr.style.backgroundColor = '#f8fafc');
      tr.addEventListener('mouseleave', () => tr.style.backgroundColor = 'transparent');

      tr.innerHTML = `
        <td style="padding:12px 16px; font-family:'DM Mono',monospace; font-size:0.82rem; color:#718096;">#${u.id_usuario}</td>
        <td style="padding:12px 16px; font-weight:500; color:#2d3748;">${u.nombres}</td>
        <td style="padding:12px 16px; color:#718096; font-size:0.88rem;">${u.email}</td>
        <td style="padding:12px 16px;">${rolBadge}</td>
        <td style="padding:12px 16px; color:#718096; font-size:0.88rem;">${u.sede?.nombre || '— Global —'}</td>
        <td style="padding:12px 16px;">${bloqBadge}</td>
        <td style="padding:12px 16px; text-align:center; white-space:nowrap;">
          ${u.bloqueado ? `
            <button class="btn-desbloquear" data-id="${u.id_usuario}"
              style="background:#48bb78; color:white; border:none; padding:4px 10px; border-radius:4px; font-size:0.78rem; cursor:pointer; font-weight:500;">
              Desbloquear
            </button>` : ''}
          <button class="btn-desactivar" data-id="${u.id_usuario}"
            style="background:#fc8181; color:white; border:none; padding:4px 10px; border-radius:4px; font-size:0.78rem; cursor:pointer; font-weight:500; margin-left:4px;">
            Desactivar
          </button>
        </td>
      `;

      const btnDesbloquear = tr.querySelector('.btn-desbloquear');
      const btnDesactivar  = tr.querySelector('.btn-desactivar');
      if (btnDesbloquear) btnDesbloquear.addEventListener('click', () => desbloquearUsuario(u.id_usuario));
      if (btnDesactivar)  btnDesactivar.addEventListener('click',  () => desactivarUsuario(u.id_usuario));

      tbody.appendChild(tr);
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding:16px; text-align:center; color:red;">Error al cargar usuarios: ${err.message}</td></tr>`;
  }
}


async function desbloquearUsuario(id) {
  const token = localStorage.getItem('token');
  if (!confirm(`¿Desbloquear al usuario #${id}?`)) return;
  try {
    const res = await fetch(`${API_URL}/usuarios/desbloquear/${id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('No se pudo desbloquear');
    alert('Usuario desbloqueado correctamente.');
    cargarListaUsuarios();
  } catch (err) { alert(`Error: ${err.message}`); }
}

async function desactivarUsuario(id) {
  const token = localStorage.getItem('token');
  if (!confirm(`¿Desactivar al usuario #${id}? Ya no podrá iniciar sesión.`)) return;
  try {
    const res = await fetch(`${API_URL}/usuarios/delete/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('No se pudo desactivar');
    alert('Usuario desactivado correctamente.');
    cargarListaUsuarios();
  } catch (err) { alert(`Error: ${err.message}`); }
}

function initFormularioUsuario() {
  const form = document.getElementById('formulario-usuario');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const rol    = document.getElementById('usuario-rol').value;
    const sedeId = document.getElementById('usuario-sedeId')?.value;

    const payload = {
      nombres:  document.getElementById('usuario-nombres').value,
      email:    document.getElementById('usuario-email').value,
      password: document.getElementById('usuario-password').value,
      rol,
      sedeId:   rol === 'SECRETARIA' && sedeId ? parseInt(sedeId) : null
    };

    if (rol === 'SECRETARIA' && !sedeId) {
      alert('Debe seleccionar una sede para la secretaria.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Error al crear usuario');

      alert(`¡Usuario ${payload.nombres} creado exitosamente!`);
      form.reset();
      document.getElementById('grupo-sede-usuario').style.display = 'none';
      cargarListaUsuarios();
    } catch (err) { alert(`Error: ${err.message}`); }
  });
}
