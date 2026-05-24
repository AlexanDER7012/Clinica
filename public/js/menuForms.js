import { toastExito, toastError, toastAlerta, toastInfo } from './menuToast.js';
import { API_URL } from './menuConfig.js';
import { estado }  from './menuConfig.js';

export async function cargarSelectsFormulario() {
  const token = localStorage.getItem('token');
  const selectEspecialidad = document.getElementById('especialidadId');
  const selectSede = document.getElementById('sedeId');
  try {
    const [resEspecialidades, resSedes] = await Promise.all([
      fetch(`${API_URL}/especialidades`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/sedes`,          { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    if (!resEspecialidades.ok || !resSedes.ok) throw new Error('Error en catálogos');
    const especialidades = await resEspecialidades.json();
    const sedes = await resSedes.json();

    if (selectEspecialidad) {
      selectEspecialidad.innerHTML = '<option value="">-- Seleccione Especialidad --</option>';
      especialidades.forEach(esp => {
        const idActual = esp.id_especialidad || esp.id;
        selectEspecialidad.innerHTML += `<option value="${idActual}">${esp.nombre}</option>`;
      });
    }
    if (selectSede) {
      selectSede.innerHTML = '<option value="">-- Seleccione Sede --</option>';
      sedes.forEach(s => {
        const idActual = s.id_sede || s.id;
        selectSede.innerHTML += `<option value="${idActual}">${s.nombre}</option>`;
      });
    }
  } catch (error) {
    console.error('Error al poblar desplegables:', error);
  }
}

// ── Restablecedores ───────────────────────────────────────────
export function restablecerFormularioDoctor() {
  const form = document.getElementById('formulario-doctor');
  if (form) {
    form.reset();
    estado.idDoctorEditando = null;
    const btnSubmit = form.querySelector('.btn-submit');
    if (btnSubmit) btnSubmit.textContent = "Guardar Médico en Base de Datos";
    const btnCancelar = document.getElementById('btn-cancelar-doctor');
    if (btnCancelar) btnCancelar.style.display = 'none';
  }
}

export function restablecerFormularioSede() {
  const formSede = document.getElementById('formulario-sede');
  if (formSede) {
    formSede.reset();
    estado.idSedeEditando = null;
    const btnSubmit = formSede.querySelector('.btn-submit');
    if (btnSubmit) btnSubmit.textContent = "Guardar Sede en Base de Datos";
    const btnCancelar = document.getElementById('btn-cancelar-sede');
    if (btnCancelar) btnCancelar.style.display = 'none';
  }
}

export function restablecerFormularioEspecialidad() {
  const formEsp = document.getElementById('formulario-especialidad');
  if (formEsp) {
    formEsp.reset();
    estado.idEspecialidadEditando = null;
    const btnSubmit = formEsp.querySelector('.btn-submit');
    if (btnSubmit) btnSubmit.textContent = "Guardar Especialidad en Base de Datos";
    const btnCancelar = document.getElementById('btn-cancelar-especialidad');
    if (btnCancelar) btnCancelar.style.display = 'none';
  }
}

export function initDoctorForm() {
  const form = document.getElementById('formulario-doctor');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');

      const payload = {
        nombres:       document.getElementById('nombres').value,
        dpi:           document.getElementById('doctorDpi').value,
        telefono:      document.getElementById('doctorTelefono').value || null,
        email:         document.getElementById('doctorEmail').value || null,
        especialidadId: parseInt(document.getElementById('especialidadId').value),
        sedeId:        parseInt(document.getElementById('sedeId').value)
      };

      const esEdicion = estado.idDoctorEditando !== null;
      const url    = esEdicion ? `${API_URL}/doctores/update/${estado.idDoctorEditando}` : `${API_URL}/doctores/create`;
      const metodo = esEdicion ? 'PUT' : 'POST';

      try {
        const respuesta = await fetch(url, {
          method: metodo,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok) throw new Error(resultado.message || resultado.error || 'Error procesando la solicitud');

        alert(esEdicion ? '¡Médico actualizado exitosamente!' : '¡Médico registrado exitosamente!');
        restablecerFormularioDoctor();
        if (esEdicion) document.getElementById('btn-nav-control').click();
      } catch (err) { alert(`Error: ${err.message}`); }
    });

    const btnCancelar = document.getElementById('btn-cancelar-doctor');
    if (btnCancelar) {
      btnCancelar.addEventListener('click', (e) => {
        e.preventDefault();
        restablecerFormularioDoctor();
        document.getElementById('btn-nav-control').click();
      });
    }
  }
}

export function initSedeForm() {
  const formSede = document.getElementById('formulario-sede');
  if (formSede) {
    formSede.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');

      const payload = {
        nombre:    document.getElementById('sedeNombre').value,
        direccion: document.getElementById('sedeDireccion').value,
        telefono:  document.getElementById('sedeTelefono').value,
        email:     document.getElementById('sedeEmail').value
      };

      const esEdicion = estado.idSedeEditando !== null;
      const url    = esEdicion ? `${API_URL}/sedes/update/${estado.idSedeEditando}` : `${API_URL}/sedes`;
      const metodo = esEdicion ? 'PUT' : 'POST';

      try {
        const respuesta = await fetch(url, {
          method: metodo,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (!respuesta.ok) throw new Error('Error al guardar la sede');

        alert(esEdicion ? '¡Sede actualizada exitosamente!' : '¡Sede registrada exitosamente!');
        restablecerFormularioSede();
        if (esEdicion) document.getElementById('btn-nav-control').click();
      } catch (err) { alert(`Error: ${err.message}`); }
    });

    const btnCancelar = document.getElementById('btn-cancelar-sede');
    if (btnCancelar) {
      btnCancelar.addEventListener('click', (e) => {
        e.preventDefault();
        restablecerFormularioSede();
        document.getElementById('btn-nav-control').click();
      });
    }
  }
}

// ── Formulario Especialidad ───────────────────────────────────
export function initEspecialidadForm() {
  const formEspecialidad = document.getElementById('formulario-especialidad');
  if (formEspecialidad) {
    formEspecialidad.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');

      const payload = {
        nombre:      document.getElementById('especialidadNombre').value,
        descripcion: document.getElementById('especialidadDescripcion').value || null
      };

      const esEdicion = estado.idEspecialidadEditando !== null;
      const url    = esEdicion ? `${API_URL}/especialidades/update/${estado.idEspecialidadEditando}` : `${API_URL}/especialidades/create`;
      const metodo = esEdicion ? 'PUT' : 'POST';

      try {
        const respuesta = await fetch(url, {
          method: metodo,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (!respuesta.ok) throw new Error('Error al guardar la especialidad');

        alert(esEdicion ? '¡Especialidad actualizada exitosamente!' : '¡Especialidad registrada exitosamente!');
        restablecerFormularioEspecialidad();
        if (esEdicion) document.getElementById('btn-nav-control').click();
      } catch (err) { alert(`Error: ${err.message}`); }
    });

    const btnCancelar = document.getElementById('btn-cancelar-especialidad');
    if (btnCancelar) {
      btnCancelar.addEventListener('click', (e) => {
        e.preventDefault();
        restablecerFormularioEspecialidad();
        document.getElementById('btn-nav-control').click();
      });
    }
  }
}