/* ══════════════════════════════════════
   js/menuControl.js
   Tabla Dinámica de Control: Render, Filtros, Editar, Eliminar
══════════════════════════════════════ */

import { API_URL, estado }                                              from './menuConfig.js';
import { cargarSelectsFormulario,
         restablecerFormularioDoctor,
         restablecerFormularioSede,
         restablecerFormularioEspecialidad }                            from './menuForms.js';

// ── Inicialización del módulo ─────────────────────────────────
export function initControlModule() {
  const tabsContainer = document.getElementById('control-tabs-container');
  if (tabsContainer) {
    tabsContainer.querySelectorAll('.chart-tab').forEach(button => {
      button.addEventListener('click', () => {
        tabsContainer.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        cambiarContextoControl(button.getAttribute('data-target'));
      });
    });
  }

  const buscador = document.getElementById('input-buscador-control');
  if (buscador) {
    buscador.addEventListener('input', (e) => {
      filtrarYMostrarTabla(e.target.value.toLowerCase().trim());
    });
  }
}

// ── Carga de datos desde la API ───────────────────────────────
export async function cambiarContextoControl(contexto) {
  estado.contextoControlActual = contexto;
  const token = localStorage.getItem('token');
  const inputBuscador = document.getElementById('input-buscador-control');
  if (inputBuscador) inputBuscador.value = "";

  try {
    const respuesta = await fetch(`${API_URL}/${contexto}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!respuesta.ok) throw new Error('Error al leer la base de datos');

    estado.coleccionDatosControl = await respuesta.json();
    procesarYRenderizarTabla(estado.coleccionDatosControl);
  } catch (error) {
    console.error(error);
    document.getElementById('tabla-body-rows').innerHTML =
      `<tr><td colspan="6" style="padding:16px; color:red; text-align:center;">No se pudieron cargar los datos de ${contexto}.</td></tr>`;
  }
}

export function procesarYRenderizarTabla(datos) {
  const trHeaders = document.getElementById('tabla-headers');
  const tbody     = document.getElementById('tabla-body-rows');
  if (!trHeaders || !tbody) return;

  trHeaders.innerHTML = "";
  tbody.innerHTML     = "";

  if (datos.length === 0) {
    trHeaders.innerHTML = `<th style="padding:12px 16px; color:#666;">Registros</th>`;
    tbody.innerHTML     = `<tr><td style="padding:16px; color:#888; text-align:center;">No existen registros en esta sección.</td></tr>`;
    return;
  }

  if (estado.contextoControlActual === 'doctores') {
    trHeaders.innerHTML = `
      <th style="padding:12px 16px; color:#4a5568; font-weight:600;">ID</th>
      <th style="padding:12px 16px; color:#4a5568; font-weight:600;">Nombre Completo</th>
      <th style="padding:12px 16px; color:#4a5568; font-weight:600;">DPI</th>
      <th style="padding:12px 16px; color:#4a5568; font-weight:600;">Teléfono</th>
      <th style="padding:12px 16px; color:#4a5568; font-weight:600;">Especialidad / Sede</th>
      <th style="padding:12px 16px; color:#4a5568; font-weight:600; text-align:center;">Acciones</th>
    `;
  } else if (estado.contextoControlActual === 'sedes') {
    trHeaders.innerHTML = `
      <th style="padding:12px 16px; color:#4a5568; font-weight:600;">ID</th>
      <th style="padding:12px 16px; color:#4a5568; font-weight:600;">Nombre de Sede</th>
      <th style="padding:12px 16px; color:#4a5568; font-weight:600;">Dirección</th>
      <th style="padding:12px 16px; color:#4a5568; font-weight:600;">Teléfono</th>
      <th style="padding:12px 16px; color:#4a5568; font-weight:600;">Email Oficial</th>
      <th style="padding:12px 16px; color:#4a5568; font-weight:600; text-align:center;">Acciones</th>
    `;
  } else if (estado.contextoControlActual === 'especialidades') {
    trHeaders.innerHTML = `
      <th style="padding:12px 16px; color:#4a5568; font-weight:600;">ID</th>
      <th style="padding:12px 16px; color:#4a5568; font-weight:600;">Especialidad</th>
      <th style="padding:12px 16px; color:#4a5568; font-weight:600;">Descripción</th>
      <th style="padding:12px 16px; color:#4a5568; font-weight:600; text-align:center;">Acciones</th>
    `;
  }

  inyectarFilasEnTabla(datos);
}

export function inyectarFilasEnTabla(listaFiltro) {
  const tbody = document.getElementById('tabla-body-rows');
  tbody.innerHTML = "";

  listaFiltro.forEach(item => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = "1px solid #eef2f8";
    tr.style.transition    = "background 0.2s";
    tr.addEventListener('mouseenter', () => tr.style.backgroundColor = '#f8fafc');
    tr.addEventListener('mouseleave', () => tr.style.backgroundColor = 'transparent');

    const idObj = item.id_doctor || item.id_sede || item.id_especialidad || item.id;
    let celdasHTML = "";

    if (estado.contextoControlActual === 'doctores') {
      const especialidadTexto = item.especialidad ? item.especialidad.nombre : `ID: ${item.especialidadId}`;
      const sedeTexto         = item.sede ? item.sede.nombre : `Sede ID: ${item.sedeId}`;
      celdasHTML = `
        <td style="padding:12px 16px; font-family:'DM Mono', monospace; font-size:0.85rem; color:#718096;">#${idObj}</td>
        <td style="padding:12px 16px; font-weight:500; color:#2d3748;">${item.nombres}</td>
        <td style="padding:12px 16px; color:#4a5568;">${item.dpi}</td>
        <td style="padding:12px 16px; color:#718096;">${item.telefono || '—'}</td>
        <td style="padding:12px 16px;">
          <span style="font-size:0.8rem; background:#ebf8ff; color:#2b6cb0; padding:2px 8px; border-radius:4px; font-weight:500; margin-right:4px;">${especialidadTexto}</span>
          <span style="font-size:0.8rem; background:#f0fff4; color:#22543d; padding:2px 8px; border-radius:4px; font-weight:500;">${sedeTexto}</span>
        </td>
      `;
    } else if (estado.contextoControlActual === 'sedes') {
      celdasHTML = `
        <td style="padding:12px 16px; font-family:'DM Mono', monospace; font-size:0.85rem; color:#718096;">#${idObj}</td>
        <td style="padding:12px 16px; font-weight:500; color:#2d3748;">${item.nombre}</td>
        <td style="padding:12px 16px; color:#4a5568;">${item.direccion}</td>
        <td style="padding:12px 16px; color:#718096;">${item.telefono}</td>
        <td style="padding:12px 16px; color:#4a5568; font-size:0.9rem;">${item.email}</td>
      `;
    } else if (estado.contextoControlActual === 'especialidades') {
      celdasHTML = `
        <td style="padding:12px 16px; font-family:'DM Mono', monospace; font-size:0.85rem; color:#718096;">#${idObj}</td>
        <td style="padding:12px 16px; font-weight:500; color:#2d3748;">${item.nombre}</td>
        <td style="padding:12px 16px; color:#718096; font-size:0.9rem;">${item.descripcion || 'Sin descripción opcional'}</td>
      `;
    }

    celdasHTML += `
      <td style="padding:12px 16px; text-align:center; white-space:nowrap;">
        <button class="btn-tabla-editar"   style="background:#42a5f5; color:white; border:none; padding:4px 10px; margin-right:6px; border-radius:4px; font-size:0.8rem; cursor:pointer; font-weight:500;">Modificar</button>
        <button class="btn-tabla-eliminar" style="background:#ff5722; color:white; border:none; padding:4px 10px; border-radius:4px; font-size:0.8rem; cursor:pointer; font-weight:500;">Eliminar</button>
      </td>
    `;

    tr.innerHTML = celdasHTML;
    tr.querySelector('.btn-tabla-editar').addEventListener('click',   () => ejecutarModificacionRegistro(idObj, item));
    tr.querySelector('.btn-tabla-eliminar').addEventListener('click', () => ejecutarEliminacionRegistro(idObj));

    tbody.appendChild(tr);
  });
}

export function filtrarYMostrarTabla(termino) {
  if (!termino) { inyectarFilasEnTabla(estado.coleccionDatosControl); return; }

  const filtrados = estado.coleccionDatosControl.filter(item => {
    if (estado.contextoControlActual === 'doctores') {
      return item.nombres.toLowerCase().includes(termino) ||
             item.dpi.toLowerCase().includes(termino) ||
             (item.telefono && item.telefono.toLowerCase().includes(termino));
    } else if (estado.contextoControlActual === 'sedes') {
      return item.nombre.toLowerCase().includes(termino) ||
             item.direccion.toLowerCase().includes(termino) ||
             item.telefono.toLowerCase().includes(termino);
    } else if (estado.contextoControlActual === 'especialidades') {
      return item.nombre.toLowerCase().includes(termino) ||
             (item.descripcion && item.descripcion.toLowerCase().includes(termino));
    }
    return false;
  });

  inyectarFilasEnTabla(filtrados);
}

export async function ejecutarModificacionRegistro(id, objetoOriginal) {
  if (estado.contextoControlActual === 'doctores') {
    estado.idDoctorEditando = id;
    document.getElementById('btn-nav-doctores').click();

    document.getElementById('nombres').value        = objetoOriginal.nombres;
    document.getElementById('doctorDpi').value      = objetoOriginal.dpi;
    document.getElementById('doctorTelefono').value = objetoOriginal.telefono || '';
    document.getElementById('doctorEmail').value    = objetoOriginal.email || '';

    await cargarSelectsFormulario();

    document.getElementById('especialidadId').value = objetoOriginal.especialidadId || '';
    document.getElementById('sedeId').value         = objetoOriginal.sedeId || '';

    const form = document.getElementById('formulario-doctor');
    const btnGuardar = form.querySelector('.btn-submit');
    if (btnGuardar) btnGuardar.textContent = "Guardar Cambios";
    const btnCancelar = document.getElementById('btn-cancelar-doctor');
    if (btnCancelar) btnCancelar.style.display = 'inline-block';

  } else if (estado.contextoControlActual === 'sedes') {
    estado.idSedeEditando = id;
    document.getElementById('btn-nav-sedes').click();

    document.getElementById('sedeNombre').value    = objetoOriginal.nombre;
    document.getElementById('sedeDireccion').value = objetoOriginal.direccion;
    document.getElementById('sedeTelefono').value  = objetoOriginal.telefono;
    document.getElementById('sedeEmail').value     = objetoOriginal.email;

    const form = document.getElementById('formulario-sede');
    const btnGuardar = form.querySelector('.btn-submit');
    if (btnGuardar) btnGuardar.textContent = "Guardar Cambios";
    const btnCancelar = document.getElementById('btn-cancelar-sede');
    if (btnCancelar) btnCancelar.style.display = 'inline-block';

  } else if (estado.contextoControlActual === 'especialidades') {
    estado.idEspecialidadEditando = id;
    document.getElementById('btn-nav-excepciones').click();

    document.getElementById('especialidadNombre').value      = objetoOriginal.nombre;
    document.getElementById('especialidadDescripcion').value = objetoOriginal.descripcion || '';

    const form = document.getElementById('formulario-especialidad');
    const btnGuardar = form.querySelector('.btn-submit');
    if (btnGuardar) btnGuardar.textContent = "Guardar Cambios";
    const btnCancelar = document.getElementById('btn-cancelar-especialidad');
    if (btnCancelar) btnCancelar.style.display = 'inline-block';
  }
}

export async function ejecutarEliminacionRegistro(id) {
  const token = localStorage.getItem('token');
  if (confirm(`¿Estás completamente seguro de eliminar permanentemente el registro #${id}? Esta acción no se puede deshacer.`)) {
    try {
      const respuesta = await fetch(`${API_URL}/${estado.contextoControlActual}/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!respuesta.ok) throw new Error('No se pudo procesar la eliminación en el servidor');
      alert('¡Registro removido de la base de datos exitosamente!');
      cambiarContextoControl(estado.contextoControlActual);
    } catch (err) { alert(err.message); }
  }
}
