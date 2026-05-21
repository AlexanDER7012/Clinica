export function initViewRouter(cargarSelectsFormulario, cambiarContextoControl, cargarModuloCitas) {
  const btnDashboard      = document.getElementById('btn-nav-dashboard');
  const btnDoctores       = document.getElementById('btn-nav-doctores');
  const btnSedes          = document.getElementById('btn-nav-sedes');
  const btnCitas          = document.getElementById('btn-nav-citas');
  const btnPacientes      = document.getElementById('btn-nav-pacientes');
  const btnEspecialidades = document.getElementById('btn-nav-excepciones');
  const btnControl        = document.getElementById('btn-nav-control');

  const secDashboard      = document.getElementById('sec-dashboard');
  const secDoctores       = document.getElementById('sec-doctores');
  const secSedes          = document.getElementById('sec-sedes');
  const secCitas          = document.getElementById('sec-citas');
  const secPacientes      = document.getElementById('sec-pacientes');
  const secEspecialidades = document.getElementById('sec-excepciones');
  const secControl        = document.getElementById('sec-control');
  const pageTitle         = document.getElementById('dinamic-title');

  const todasLasVistas = [secDashboard, secDoctores, secSedes, secCitas,
                        secPacientes, secEspecialidades, secControl];

  function ocultarTodasLasVistas() {
    todasLasVistas.forEach(v => { if (v) v.classList.remove('active-view'); });
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  }

  if (btnDashboard) {
    btnDashboard.addEventListener('click', (e) => {
      e.preventDefault(); ocultarTodasLasVistas(); btnDashboard.classList.add('active');
      if (secDashboard) secDashboard.classList.add('active-view');
      if (pageTitle) pageTitle.textContent = "Dashboard Analítico";
    });
  }
  if (btnDoctores) {
    btnDoctores.addEventListener('click', (e) => {
      e.preventDefault(); ocultarTodasLasVistas(); btnDoctores.classList.add('active');
      if (secDoctores) secDoctores.classList.add('active-view');
      if (pageTitle) pageTitle.textContent = "Gestión de Médicos Clínicos";
      cargarSelectsFormulario();
    });
  }
  if (btnSedes) {
    btnSedes.addEventListener('click', (e) => {
      e.preventDefault(); ocultarTodasLasVistas(); btnSedes.classList.add('active');
      if (secSedes) secSedes.classList.add('active-view');
      if (pageTitle) pageTitle.textContent = "Gestión de Sedes Clínicas";
    });
  }
  if (btnCitas) {
    btnCitas.addEventListener('click', (e) => {
      e.preventDefault(); ocultarTodasLasVistas(); btnCitas.classList.add('active');
      if (secCitas) secCitas.classList.add('active-view');
      if (pageTitle) pageTitle.textContent = "Gestión de Citas Médicas";
      cargarModuloCitas();
    });
  }
  if (btnPacientes) {
    btnPacientes.addEventListener('click', (e) => {
      e.preventDefault(); ocultarTodasLasVistas(); btnPacientes.classList.add('active');
      if (secPacientes) secPacientes.classList.add('active-view');
      if (pageTitle) pageTitle.textContent = "Módulo de Pacientes";
    });
  }
  if (btnEspecialidades) {
    btnEspecialidades.addEventListener('click', (e) => {
      e.preventDefault(); ocultarTodasLasVistas(); btnEspecialidades.classList.add('active');
      if (secEspecialidades) secEspecialidades.classList.add('active-view');
      if (pageTitle) pageTitle.textContent = "Gestión de Especialidades Médicas";
    });
  }
  if (btnControl) {
    btnControl.addEventListener('click', (e) => {
      e.preventDefault(); ocultarTodasLasVistas(); btnControl.classList.add('active');
      if (secControl) secControl.classList.add('active-view');
      if (pageTitle) pageTitle.textContent = "Módulo de Control y Mantenimiento";
      cambiarContextoControl('doctores');
    });
  }
}
