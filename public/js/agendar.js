const API_URL = 'http://localhost:3000';

const urlParams    = new URLSearchParams(window.location.search);
const sedeActualId = urlParams.get('sedeId');

const formulario        = document.querySelector('#formulario-cita');
const especialidadSelect = document.querySelector('#especialidad');
const doctorSelect       = document.querySelector('#doctor');
const sedeLabel          = document.querySelector('#sede-label');
const contenedorCitas    = document.querySelector('#contenedor-citas');

function crearObjetoLimpio() {
  return { 
    dpi: '', nombres: '', apellidos: '', sexo: '', telefono: '', 
    email: '', direccion: '', fecha_nacimiento: '', contacto_emergencia: '',
    especialidad: '', doctorId: '', fecha: '', motivo: '' 
  };
}

let citaObj = crearObjetoLimpio();

// ── Validadores ───────────────────────────────────────────────
const validaciones = {
  dpi: {
    regex:   /^\d{13}$/,
    mensaje: 'El DPI debe tener exactamente 13 dígitos numéricos.'
  },
  nombres: {
    regex:   /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/,
    mensaje: 'El nombre solo debe contener letras.'
  },
  apellidos: {
    regex:   /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/,
    mensaje: 'Los apellidos solo deben contener letras.'
  },
  telefono: {
    regex:   /^\d{8}$/,
    mensaje: 'El teléfono debe tener exactamente 8 dígitos.'
  },
  email: {
    regex:   /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    mensaje: 'Ingrese un correo electrónico válido.'
  },
};

function mostrarError(campo, mensaje) {
  const input   = document.getElementById(campo);
  if (!input) return;
  let errorEl = document.getElementById(`error-${campo}`);
  if (!errorEl) {
    errorEl           = document.createElement('p');
    errorEl.id        = `error-${campo}`;
    errorEl.style.cssText = 'color:#e53e3e; font-size:0.78rem; margin:4px 0 0;';
    input.parentNode.appendChild(errorEl);
  }
  errorEl.textContent = mensaje;
  input.style.borderColor = '#e53e3e';
}

function limpiarError(campo) {
  const input   = document.getElementById(campo);
  const errorEl = document.getElementById(`error-${campo}`);
  if (errorEl) errorEl.textContent = '';
  if (input)   input.style.borderColor = '';
}

function validarCampo(id, valor) {
  if (!validaciones[id]) return true;
  const { regex, mensaje } = validaciones[id];
  if (!regex.test(valor.trim())) {
    mostrarError(id, mensaje);
    return false;
  }
  limpiarError(id);
  return true;
}

// ── Restricciones de teclado en tiempo real ───────────────────
function initRestriccionesTeclado() {
  // Solo letras
  ['nombres', 'apellidos'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      el.value = el.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '');
      if (citaObj[id] !== undefined) citaObj[id] = el.value;
    });
  });

  // Solo números — DPI (máx 13)
  const dpiEl = document.getElementById('dpi');
  if (dpiEl) {
    dpiEl.setAttribute('maxlength', '13');
    dpiEl.addEventListener('input', () => {
      dpiEl.value = dpiEl.value.replace(/\D/g, '').slice(0, 13);
      citaObj.dpi = dpiEl.value;
      if (dpiEl.value.length === 13) limpiarError('dpi');
      else if (dpiEl.value.length > 0) mostrarError('dpi', `${dpiEl.value.length}/13 dígitos`);
    });
  }

  // Solo números — teléfono (máx 8)
  const telEl = document.getElementById('telefono');
  if (telEl) {
    telEl.setAttribute('maxlength', '8');
    telEl.addEventListener('input', () => {
      telEl.value    = telEl.value.replace(/\D/g, '').slice(0, 8);
      citaObj.telefono = telEl.value;
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!sedeActualId) {
    alert("Error: No se seleccionó una sede.");
    window.location.href = 'portal.html';
    return;
  }

  sedeLabel.textContent = sedeActualId == 1 ? 'Sede Antigua Guatemala' : 'Sede Flores, Petén';

  cargarEspecialidades();
  initRestriccionesTeclado();

  formulario.addEventListener('input', e => {
    if (e.target.id in citaObj) citaObj[e.target.id] = e.target.value;
  });

  formulario.addEventListener('change', e => {
    if (e.target.id in citaObj) citaObj[e.target.id] = e.target.value;
  });

  especialidadSelect.addEventListener('change', e => {
    citaObj.especialidad = e.target.value;
    citaObj.doctorId     = '';
    cargarDoctores(e.target.value);
  });

  doctorSelect.addEventListener('change', e => {
    citaObj.doctorId = e.target.value;
  });

  formulario.addEventListener('submit', submitCita);
});

async function submitCita(e) {
  e.preventDefault();

  const { contacto_emergencia, ...obligatorios } = citaObj;
  const faltantes = Object.keys(obligatorios).filter(k => !obligatorios[k] || obligatorios[k].toString().trim() === '');

  if (faltantes.length > 0) {
    return new Notificacion(`Faltan campos: ${faltantes.join(', ')}`, 'error');
  }

  // ── Validar todos los campos con reglas ───────────────────
  let hayErrores = false;
  ['dpi', 'nombres', 'apellidos', 'telefono', 'email'].forEach(campo => {
    if (!validarCampo(campo, citaObj[campo])) hayErrores = true;
  });
  if (hayErrores) return new Notificacion('Corrija los campos marcados en rojo.', 'error');

  try {
    const payload = {
      paciente: {
        nombres:             citaObj.nombres,
        apellidos:           citaObj.apellidos,
        dpi:                 citaObj.dpi,
        sexo:                citaObj.sexo,
        telefono:            citaObj.telefono,
        email:               citaObj.email,
        direccion:           citaObj.direccion,
        fecha_nacimiento:    citaObj.fecha_nacimiento,
        contacto_emergencia: citaObj.contacto_emergencia
      },
      cita: {
        fecha:    citaObj.fecha,
        motivo:   citaObj.motivo,
        doctorId: parseInt(citaObj.doctorId)
      },
      sedeId: parseInt(sedeActualId)
    };

    const res = await fetch(`${API_URL}/citas/registrar-completo`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    const resultado = await res.json();
    if (!res.ok) throw new Error(resultado.error || 'Error al procesar el registro');

    new Notificacion('¡Cita registrada con éxito!', 'exito');
    mostrarCitaHTML(resultado);

    // ── Enviar correo si el email es Gmail ────────────────────
    if (citaObj.email && citaObj.email.toLowerCase().endsWith('@gmail.com')) {
      try {
        await fetch(`${API_URL}/correo/cita-publica/${resultado.id_cita}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (correoErr) {
        console.warn('Correo no enviado:', correoErr.message);
      }
    }

    formulario.reset();
    citaObj = crearObjetoLimpio();

    especialidadSelect.value  = '';
    doctorSelect.innerHTML    = '<option value="">-- Seleccione Doctor --</option>';
    doctorSelect.disabled     = true;

  } catch (error) {
    new Notificacion(error.message, 'error');
  }
}

function mostrarCitaHTML(cita) {
  // Quitar estado vacío si existe
  const emptyState = contenedorCitas.querySelector('.empty-state');
  if (emptyState) emptyState.remove();

  const fechaFormateada = new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone:  'America/Guatemala'
  }).format(new Date(cita.fecha));

  const divCita = document.createElement('div');
  divCita.className = 'cita-card';
  divCita.innerHTML = `
    <div class="cita-badge">Cita Registrada</div>
    <div class="cita-row">
      <span class="lbl">Paciente</span>
      <span class="val">${cita.paciente.nombres} ${cita.paciente.apellidos}</span>
    </div>
    <div class="cita-row">
      <span class="lbl">Médico</span>
      <span class="val">${cita.doctor.nombres}</span>
    </div>
    <div class="cita-row">
      <span class="lbl">Fecha</span>
      <span class="val">${fechaFormateada}</span>
    </div>
    <div class="cita-row">
      <span class="lbl">Sede</span>
      <span class="val">${cita.sede?.nombre || '—'}</span>
    </div>
    <button class="btn-eliminar" onclick="eliminarCita(${cita.id_cita}, this.parentElement)">
      🗑 Eliminar cita
    </button>
  `;
  contenedorCitas.appendChild(divCita);
}

async function cargarEspecialidades() {
  try {
    const res            = await fetch(`${API_URL}/especialidades`);
    const especialidades = await res.json();
    especialidadSelect.innerHTML = '<option value="">-- Seleccione Especialidad --</option>';
    especialidades.forEach(esp => {
      const option       = document.createElement('option');
      option.value       = esp.id_especialidad;
      option.textContent = esp.nombre;
      especialidadSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error cargando especialidades:", error);
  }
}

async function cargarDoctores(espId) {
  doctorSelect.innerHTML = '<option value="">-- Seleccione Doctor --</option>';
  doctorSelect.disabled  = true;
  if (!espId) return;

  try {
    const res      = await fetch(`${API_URL}/doctores`);
    const data     = await res.json();
    const filtrados = data.filter(d => d.especialidadId == espId && d.sedeId == sedeActualId);

    if (filtrados.length === 0) {
      doctorSelect.innerHTML = '<option value="">No hay doctores disponibles en esta sede</option>';
      return;
    }

    filtrados.forEach(d => {
      const option       = document.createElement('option');
      option.value       = d.id_doctor;
      option.textContent = d.nombres;
      doctorSelect.appendChild(option);
    });
    doctorSelect.disabled = false;

  } catch (error) {
    console.error("Error cargando doctores:", error);
  }
}

async function eliminarCita(id, elemento) {
  if (!confirm("¿Deseas eliminar esta cita?")) return;
  try {
    const res = await fetch(`${API_URL}/citas/delete/${id}`, { method: 'DELETE' });
    if (res.ok) {
      elemento.remove();
      new Notificacion('Cita eliminada correctamente', 'exito');
    }
  } catch (error) {
    console.error("Error al eliminar:", error);
  }
}

class Notificacion {
  constructor(texto, tipo) {
    const contenedor = document.getElementById('alerta-container');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    const alerta       = document.createElement('div');
    alerta.className   = `alerta ${tipo === 'error' ? 'alerta-error' : 'alerta-exito'}`;
    alerta.textContent = texto;
    contenedor.appendChild(alerta);
    setTimeout(() => alerta.remove(), 4000);
  }
}