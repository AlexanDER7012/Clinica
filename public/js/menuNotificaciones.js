import { API_URL } from './menuConfig.js';

export function initNotificaciones() {
  const btn      = document.getElementById('btn-notificaciones');
  const dropdown = document.getElementById('dropdown-notif');
  if (!btn || !dropdown) return;

  // Toggle dropdown al click
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const visible = dropdown.style.display === 'block';
    dropdown.style.display = visible ? 'none' : 'block';
    if (!visible) cargarNotificaciones();
  });

  // Cerrar al click fuera
  document.addEventListener('click', () => {
    if (dropdown) dropdown.style.display = 'none';
  });

  // Cargar badge al iniciar
  cargarBadge();

  // Refrescar badge cada 2 minutos
  setInterval(cargarBadge, 2 * 60 * 1000);
}

async function cargarBadge() {
  const token = localStorage.getItem('token');
  const badge = document.getElementById('badge-notif');
  if (!badge) return;

  try {
    const res   = await fetch(`${API_URL}/citas?estado=CANCELADA&limite=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const citas = await res.json();

    // Solo las canceladas de hoy y ayer
    const limite = new Date();
    limite.setDate(limite.getDate() - 1);

    const recientes = Array.isArray(citas)
      ? citas.filter(c => new Date(c.fecha) >= limite)
      : [];

    if (recientes.length > 0) {
      badge.textContent    = recientes.length > 9 ? '9+' : recientes.length;
      badge.style.display  = 'flex';
    } else {
      badge.style.display  = 'none';
    }
  } catch {
    badge.style.display = 'none';
  }
}

async function cargarNotificaciones() {
  const token    = localStorage.getItem('token');
  const lista    = document.getElementById('notif-lista');
  const subtitulo = document.getElementById('notif-subtitulo');
  if (!lista) return;

  lista.innerHTML = `<p style="text-align:center;color:#a0aec0;font-size:0.85rem;padding:20px;">Cargando...</p>`;

  try {
    const res   = await fetch(`${API_URL}/citas?estado=CANCELADA&limite=20`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const citas = await res.json();

    // Filtrar últimas 48 horas
    const limite   = new Date();
    limite.setDate(limite.getDate() - 2);
    const recientes = Array.isArray(citas)
      ? citas.filter(c => new Date(c.createdAt || c.fecha) >= limite).slice(0, 15)
      : [];

    if (subtitulo) subtitulo.textContent = `${recientes.length} recientes`;

    if (!recientes.length) {
      lista.innerHTML = `
        <div style="text-align:center;padding:28px 16px;">
          <div style="font-size:2rem;margin-bottom:8px;">✅</div>
          <p style="color:#718096;font-size:0.85rem;margin:0;">Sin citas canceladas recientes.</p>
        </div>`;
      return;
    }

    lista.innerHTML = recientes.map(c => {
      const fecha = new Intl.DateTimeFormat('es-GT', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        timeZone: 'America/Guatemala'
      }).format(new Date(c.fecha));

      const paciente = c.paciente
        ? `${c.paciente.nombres} ${c.paciente.apellidos}`
        : `Paciente #${c.pacienteId}`;

      const doctor = c.doctor?.nombres || `Dr. #${c.doctorId}`;

      return `
        <div style="padding:12px 16px;border-bottom:1px solid #f0f4f8;transition:background 0.15s;"
             onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background='white'">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
            <div>
              <p style="margin:0 0 3px;font-weight:600;color:#2d3748;font-size:0.87rem;">${paciente}</p>
              <p style="margin:0 0 3px;color:#718096;font-size:0.78rem;">${doctor}</p>
              <p style="margin:0;color:#a0aec0;font-size:0.75rem;">📅 ${fecha}</p>
            </div>
            <span style="background:#fed7d7;color:#822727;font-size:0.68rem;padding:2px 8px;
                         border-radius:20px;font-weight:700;white-space:nowrap;flex-shrink:0;">
              Cancelada
            </span>
          </div>
          ${c.motivo ? `<p style="margin:6px 0 0;font-size:0.75rem;color:#718096;">Motivo cita: ${c.motivo}</p>` : ''}
        </div>`;
    }).join('');

  } catch (err) {
    lista.innerHTML = `<p style="color:red;font-size:0.82rem;padding:16px;">Error: ${err.message}</p>`;
  }
}