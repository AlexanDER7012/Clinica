const API_URL = 'http://localhost:3000';

const urlParams = new URLSearchParams(window.location.search);
const sedeActualId = urlParams.get('sedeId');

const formulario = document.querySelector('#formulario-cita');
const especialidadSelect = document.querySelector('#especialidad');
const doctorSelect = document.querySelector('#doctor');
const sedeLabel = document.querySelector('#sede-label');
const contenedorCitas = document.querySelector('#contenedor-citas');

function crearObjetoLimpio() {
  return { 
    dpi: '', nombres: '', apellidos: '', sexo: '', telefono: '', 
    email: '', direccion: '', fecha_nacimiento: '', contacto_emergencia: '',
    especialidad: '', doctorId: '', fecha: '', motivo: '' 
  };
}

let citaObj = crearObjetoLimpio();

document.addEventListener('DOMContentLoaded', () => {
  if (!sedeActualId) {
    alert("Error: No se seleccionó una sede.");
    window.location.href = 'portal.html';
    return;
  }

  sedeLabel.textContent = `Sede: ${sedeActualId == 1 ? 'Antigua Guatemala' : 'Petén'}`;

  cargarEspecialidades();

  // Listener general para todos los inputs de texto
  formulario.addEventListener('input', e => {
    if (e.target.id in citaObj) {
      citaObj[e.target.id] = e.target.value;
    }
  });

  formulario.addEventListener('change', e => {
    if (e.target.id in citaObj) {
      citaObj[e.target.id] = e.target.value;
    }
  });

  especialidadSelect.addEventListener('change', e => {
    citaObj.especialidad = e.target.value;
    citaObj.doctorId = ''; 
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

  try {
    const payload = {
      paciente: {
        nombres: citaObj.nombres,
        apellidos:citaObj.apellidos,
        dpi: citaObj.dpi,
        sexo: citaObj.sexo,
        telefono: citaObj.telefono,
        email: citaObj.email,
        direccion: citaObj.direccion,
        fecha_nacimiento: citaObj.fecha_nacimiento,
        contacto_emergencia:citaObj.contacto_emergencia
      },
      cita: {
        fecha:    citaObj.fecha,
        motivo:   citaObj.motivo,
        doctorId: parseInt(citaObj.doctorId)
      },
      sedeId: parseInt(sedeActualId)
    };

    const res = await fetch(`${API_URL}/citas/registrar-completo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const resultado = await res.json();
    if (!res.ok) throw new Error(resultado.error || 'Error al procesar el registro');

    new Notificacion('¡Cita registrada con éxito!', 'exito');
    mostrarCitaHTML(resultado);

    formulario.reset();
    citaObj = crearObjetoLimpio(); 

    especialidadSelect.value = '';
    doctorSelect.innerHTML = '<option value="">-- Seleccione Doctor --</option>';
    doctorSelect.disabled = true;

  } catch (error) {
    new Notificacion(error.message, 'error');
  }
}

function mostrarCitaHTML(cita) {

  const msgVacio = contenedorCitas.querySelector('p');
  if (msgVacio) msgVacio.remove();

  const divCita = document.createElement('div');
  divCita.classList.add(
    'mx-5', 'my-5', 'bg-white', 'shadow-md',
    'px-5', 'py-10', 'rounded-xl', 'border-l-4', 'border-indigo-500'
  );

  const fechaFormateada = new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Guatemala'
  }).format(new Date(cita.fecha));

  divCita.innerHTML = `
    <p class="font-bold uppercase text-gray-700 mb-2">Paciente: 
      <span class="font-normal normal-case">${cita.paciente.nombres} ${cita.paciente.apellidos}</span>
    </p>
    <p class="font-bold uppercase text-gray-700 mb-2">Doctor: 
      <span class="font-normal normal-case">${cita.doctor.nombres}</span>
    </p>
    <p class="font-bold uppercase text-gray-700 mb-2">Fecha: 
      <span class="font-normal normal-case">${fechaFormateada}</span>
    </p>
    <button 
      onclick="eliminarCita(${cita.id_cita}, this.parentElement)" 
      class="mt-4 bg-red-600 text-white px-4 py-2 rounded uppercase font-bold text-xs hover:bg-red-700">
      Eliminar
    </button>
  `;
  contenedorCitas.appendChild(divCita);
}

async function cargarEspecialidades() {
  try {
    const res = await fetch(`${API_URL}/especialidades`);
    const especialidades = await res.json();
    especialidadSelect.innerHTML = '<option value="">-- Seleccione Especialidad --</option>';
    especialidades.forEach(esp => {
      const option = document.createElement('option');
      option.value = esp.id_especialidad;
      option.textContent = esp.nombre;
      especialidadSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error cargando especialidades:", error);
  }
}

async function cargarDoctores(espId) {
  doctorSelect.innerHTML = '<option value="">-- Seleccione Doctor --</option>';
  doctorSelect.disabled = true;

  if (!espId) return;

  try {
    const res = await fetch(`${API_URL}/doctores`);
    const data = await res.json();
    const filtrados = data.filter(d => d.especialidadId == espId && d.sedeId == sedeActualId);

    if (filtrados.length === 0) {
      doctorSelect.innerHTML = '<option value="">No hay doctores disponibles en esta sede</option>';
      return;
    }

    filtrados.forEach(d => {
      const option = document.createElement('option');
      option.value = d.id_doctor;
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
    document.querySelector('.alert')?.remove();

    const alerta = document.createElement('div');
    alerta.classList.add(
      'text-center', 'w-full', 'p-3', 'text-white',
      'my-5', 'alert', 'uppercase', 'font-bold', 'rounded-md'
    );
    tipo === 'error'
      ? alerta.classList.add('bg-red-500')
      : alerta.classList.add('bg-green-500');

    alerta.textContent = texto;
    formulario.parentElement.insertBefore(alerta, formulario);
    setTimeout(() => alerta.remove(), 3000);
  }
}
