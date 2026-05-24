export const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://clinica-medica-rpgg.onrender.com';

export const DATA = {
  visitasMensuales: [30, 45, 35, 60, 50, 70, 55, 80, 65, 75, 60, 85],
  pagosMensuales: [40, 55, 35, 65, 50, 70, 45, 80, 60, 75, 55, 90],
  consultasPorAnio: {
    labels: ['2023', '2024', '2025', '2026'],
    Q1: [44, 27, 30, 25], Q2: [36, 30, 55, 34], Q3: [30, 33, 40, 26], Q4: [28, 29, 40, 39],
  },
  medicos: [
    { nombre: 'Dr. González', consultas: '432,641', top: true  },
    { nombre: 'Dr. Martínez', consultas: '387,210', top: true  },
    { nombre: 'Dra. López',   consultas: '361,540', top: true  },
    { nombre: 'Dr. Pérez',    consultas: '298,770', top: false },
    { nombre: 'Dra. Ruíz',    consultas: '275,300', top: false },
  ],
};

// ── Estado global del módulo de control ──────────────────────
export const estado = {
  contextoControlActual: 'doctores',
  coleccionDatosControl: [],
  idDoctorEditando: null,
  idSedeEditando: null,
  idEspecialidadEditando: null,
};