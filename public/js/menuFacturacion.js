import { API_URL } from './menuConfig.js';

const estadoFac = {
  citaSeleccionada: null,
  pacienteSeleccionado: null,
  ultimaFactura: null,
};

export function initFacturacionModule() {
  initBuscador();
  initFormularioFactura();
}

export function cargarModuloFacturacion() {
  limpiarModulo();
}

function limpiarModulo() {
  estadoFac.citaSeleccionada     = null;
  estadoFac.pacienteSeleccionado = null;
  estadoFac.ultimaFactura        = null;

  const inputBuscar   = document.getElementById('fac-buscar-input');
  const secResultados = document.getElementById('fac-sec-resultados');
  const secFormulario = document.getElementById('fac-sec-formulario');
  const secResumen    = document.getElementById('fac-sec-resumen');

  if (inputBuscar)    inputBuscar.value = '';
  if (secResultados)  secResultados.style.display = 'none';
  if (secFormulario)  secFormulario.style.display  = 'none';
  if (secResumen)     secResumen.style.display     = 'none';
}

// ── PASO 1: Buscador ──────────────────────────────────────────
function initBuscador() {
  const btnBuscar = document.getElementById('fac-btn-buscar');
  if (!btnBuscar) return;

  btnBuscar.addEventListener('click', buscarPaciente);

  const input = document.getElementById('fac-buscar-input');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') buscarPaciente();
    });
  }
}

async function buscarPaciente() {
  const q     = document.getElementById('fac-buscar-input')?.value.trim();
  const token = localStorage.getItem('token');

  if (!q) { alert('Ingrese un DPI o nombre para buscar.'); return; }

  const contenedor = document.getElementById('fac-resultados-lista');
  const sec        = document.getElementById('fac-sec-resultados');
  if (!contenedor || !sec) return;

  contenedor.innerHTML = `<p style="color:#888; padding:12px;">Buscando...</p>`;
  sec.style.display = 'block';
  document.getElementById('fac-sec-formulario').style.display = 'none';
  document.getElementById('fac-sec-resumen').style.display    = 'none';

  try {
    const res       = await fetch(`${API_URL}/pacientes/buscar?q=${encodeURIComponent(q)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const pacientes = await res.json();

    if (!pacientes.length) {
      contenedor.innerHTML = `<p style="color:#888; padding:12px;">No se encontraron pacientes con ese criterio.</p>`;
      return;
    }

    contenedor.innerHTML = '';
    pacientes.forEach(p => {
      const citasConfirmadas = p.citas?.filter(c => c.estado === 'CONFIRMADA') || [];

      const div = document.createElement('div');
      div.style.cssText = 'border:1px solid #eef2f8; border-radius:8px; padding:16px; margin-bottom:12px; background:#fff;';

      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
          <div>
            <p style="font-weight:600; color:#2d3748; margin:0 0 4px;">${p.nombres} ${p.apellidos}</p>
            <p style="color:#718096; font-size:0.88rem; margin:0;">DPI: ${p.dpi} | Tel: ${p.telefono}</p>
          </div>
          <span style="background:#c6f6d5; color:#22543d; font-size:0.78rem; padding:3px 10px; border-radius:20px; font-weight:600;">
            ${citasConfirmadas.length} cita(s) confirmada(s)
          </span>
        </div>
        ${citasConfirmadas.length > 0 ? `
          <div style="margin-top:12px;">
            <p style="font-size:0.85rem; font-weight:600; color:#4a5568; margin:0 0 8px;">Seleccionar cita a facturar:</p>
            <div class="lista-citas-confirmadas">
              ${citasConfirmadas.map(cita => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:#f8fafc; border-radius:6px; margin-bottom:6px; border:1px solid #e2e8f0;">
                  <div>
                    <p style="margin:0; font-size:0.88rem; color:#2d3748; font-weight:500;">
                      ${cita.doctor?.nombres || 'Doctor'} — ${cita.sede?.nombre || 'Sede'}
                    </p>
                    <p style="margin:0; font-size:0.82rem; color:#718096;">
                      ${new Intl.DateTimeFormat('es-GT', { dateStyle:'medium', timeStyle:'short', timeZone:'America/Guatemala' }).format(new Date(cita.fecha))}
                      ${cita.motivo ? '| ' + cita.motivo : ''}
                    </p>
                  </div>
                  <button class="btn-seleccionar-cita btn-submit" data-cita-id="${cita.id_cita}"
                    style="padding:6px 14px; font-size:0.82rem; white-space:nowrap;">
                    Seleccionar
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `<p style="margin-top:10px; font-size:0.85rem; color:#e53e3e;">Este paciente no tiene citas confirmadas disponibles para facturar.</p>`}
      `;

      div.querySelectorAll('.btn-seleccionar-cita').forEach(btn => {
        btn.addEventListener('click', () => {
          const citaId  = parseInt(btn.getAttribute('data-cita-id'));
          const citaObj = citasConfirmadas.find(c => c.id_cita === citaId);
          estadoFac.citaSeleccionada     = citaObj;
          estadoFac.pacienteSeleccionado = p;
          mostrarFormularioFactura(p, citaObj);
        });
      });

      contenedor.appendChild(div);
    });

  } catch (err) {
    contenedor.innerHTML = `<p style="color:red; padding:12px;">Error: ${err.message}</p>`;
  }
}

// ── PASO 2 + 3: Formulario receta + datos facturación ─────────
function mostrarFormularioFactura(paciente, cita) {
  const sec = document.getElementById('fac-sec-formulario');
  if (!sec) return;

  sec.style.display = 'block';
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const resumenCita = document.getElementById('fac-resumen-cita-seleccionada');
  if (resumenCita) {
    const fechaFmt = new Intl.DateTimeFormat('es-GT', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Guatemala'
    }).format(new Date(cita.fecha));

    resumenCita.innerHTML = `
      <div style="background:#ebf8ff; border:1px solid #90cdf4; border-radius:8px; padding:12px 16px;">
        <p style="margin:0 0 4px; font-weight:600; color:#2b6cb0;">✓ Cita seleccionada #${cita.id_cita}</p>
        <p style="margin:0; color:#2d3748; font-size:0.9rem;">
          <strong>${paciente.nombres} ${paciente.apellidos}</strong> — ${cita.doctor?.nombres}<br/>
          ${fechaFmt} | ${cita.sede?.nombre}
        </p>
      </div>
    `;
  }

  const txtReceta = document.getElementById('fac-receta-medica');
  if (txtReceta) txtReceta.value = cita.receta_medica || '';
}

// ── PASO 4: Submit ────────────────────────────────────────────
function initFormularioFactura() {
  const form = document.getElementById('formulario-factura');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!estadoFac.citaSeleccionada) {
      alert('Debe seleccionar una cita primero.');
      return;
    }

    const receta_medica = document.getElementById('fac-receta-medica')?.value.trim();
    const precio        = document.getElementById('fac-precio')?.value;
    const nit_receptor  = document.getElementById('fac-nit')?.value.trim() || 'CF';

    if (!precio || parseFloat(precio) <= 0) {
      alert('Ingrese un precio de consulta válido.');
      return;
    }

    const payload = {
      citaId:          estadoFac.citaSeleccionada.id_cita,
      receta_medica:   receta_medica || null,
      precio_consulta: parseFloat(precio),
      nit_receptor
    };

    try {
      const res  = await fetch(`${API_URL}/facturas/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al emitir factura');

      estadoFac.ultimaFactura = data.factura; // ← guardar para descarga
      mostrarResumenFactura(data.factura);
      document.getElementById('fac-sec-formulario').style.display = 'none';

    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });
}

// ── Resumen final ─────────────────────────────────────────────
function mostrarResumenFactura(factura) {
  const sec = document.getElementById('fac-sec-resumen');
  if (!sec) return;

  sec.style.display = 'block';
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const fechaEmision = new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Guatemala'
  }).format(new Date(factura.fecha_emision));

  const xmlEscapado = (factura.xml_firmado || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  sec.innerHTML = `
    <div class="admin-card" style="padding:24px;">

      <div style="text-align:center; margin-bottom:24px;">
        <div style="font-size:2.5rem;">✅</div>
        <div class="admin-title" style="margin:8px 0 4px;">Factura Emitida Exitosamente</div>
        <p style="color:#718096; margin:0; font-size:0.9rem;">La cita ha sido marcada como FINALIZADA</p>
      </div>

      <div style="background:#f8fafc; border:1px solid #eef2f8; border-radius:8px; padding:20px; margin-bottom:20px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div>
            <p style="font-size:0.78rem; color:#718096; font-weight:600; margin:0 0 4px; text-transform:uppercase;">Serie</p>
            <p style="font-size:1rem; font-weight:600; color:#2d3748; margin:0;">${factura.serie}</p>
          </div>
          <div>
            <p style="font-size:0.78rem; color:#718096; font-weight:600; margin:0 0 4px; text-transform:uppercase;">Número</p>
            <p style="font-size:1rem; font-weight:600; color:#2d3748; margin:0;">${factura.numero}</p>
          </div>
          <div>
            <p style="font-size:0.78rem; color:#718096; font-weight:600; margin:0 0 4px; text-transform:uppercase;">Paciente</p>
            <p style="font-size:0.95rem; color:#2d3748; margin:0;">${factura.cita.paciente.nombres} ${factura.cita.paciente.apellidos}</p>
          </div>
          <div>
            <p style="font-size:0.78rem; color:#718096; font-weight:600; margin:0 0 4px; text-transform:uppercase;">NIT Receptor</p>
            <p style="font-size:0.95rem; color:#2d3748; margin:0;">${factura.nit_receptor}</p>
          </div>
          <div>
            <p style="font-size:0.78rem; color:#718096; font-weight:600; margin:0 0 4px; text-transform:uppercase;">Monto</p>
            <p style="font-size:1.2rem; font-weight:700; color:#22543d; margin:0;">Q ${parseFloat(factura.monto).toFixed(2)}</p>
          </div>
          <div>
            <p style="font-size:0.78rem; color:#718096; font-weight:600; margin:0 0 4px; text-transform:uppercase;">Fecha Emisión</p>
            <p style="font-size:0.88rem; color:#2d3748; margin:0;">${fechaEmision}</p>
          </div>
        </div>

        <div style="margin-top:16px; padding-top:16px; border-top:1px solid #eef2f8;">
          <p style="font-size:0.78rem; color:#718096; font-weight:600; margin:0 0 4px; text-transform:uppercase;">Autorización SAT (Simulada)</p>
          <p style="font-size:0.78rem; font-family:'DM Mono',monospace; color:#4a5568; margin:0; word-break:break-all;">${factura.autorizacion}</p>
        </div>

        <div style="margin-top:16px; padding-top:16px; border-top:1px solid #eef2f8;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <p style="font-size:0.78rem; color:#718096; font-weight:600; margin:0; text-transform:uppercase;">XML FEL Generado</p>
            <button id="btn-toggle-xml"
              style="background:#e2e8f0; color:#4a5568; border:none; padding:4px 12px; border-radius:4px; font-size:0.78rem; cursor:pointer; font-weight:500;">
              Ver XML
            </button>
          </div>
          <pre id="xml-preview"
            style="display:none; background:#1a202c; color:#68d391; padding:16px; border-radius:8px; font-size:0.75rem; overflow-x:auto; white-space:pre-wrap; word-break:break-all; font-family:'DM Mono',monospace; max-height:300px; overflow-y:auto; margin:0;">${xmlEscapado}</pre>
        </div>
      </div>

      <!-- Botones de acción -->
      <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
        <button id="btn-descargar-pdf" class="btn-submit"
          style="padding:10px 24px; background:#2b6cb0;">
          ⬇ Descargar PDF
        </button>
        <button id="btn-nueva-factura" class="btn-submit"
          style="padding:10px 24px; background:#e2e8f0; color:#4a5568;">
          Nueva Facturación
        </button>
      </div>

    </div>
  `;

  // Toggle XML
  document.getElementById('btn-toggle-xml')?.addEventListener('click', () => {
    const pre = document.getElementById('xml-preview');
    const btn = document.getElementById('btn-toggle-xml');
    if (pre.style.display === 'none') {
      pre.style.display = 'block';
      btn.textContent   = 'Ocultar XML';
    } else {
      pre.style.display = 'none';
      btn.textContent   = 'Ver XML';
    }
  });

  // Descargar PDF
  document.getElementById('btn-descargar-pdf')?.addEventListener('click', () => {
    generarPDF(factura);
  });

  document.getElementById('btn-nueva-factura')?.addEventListener('click', limpiarModulo);
}

// ── Generador de PDF con jsPDF ────────────────────────────────
function generarPDF(factura) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const fechaEmision = new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Guatemala'
  }).format(new Date(factura.fecha_emision));

  const margen  = 20;
  const ancho   = 170; // ancho útil en mm
  let   y       = 20;  // posición vertical actual

  // ── Encabezado ────────────────────────────────────────────
  doc.setFillColor(26, 54, 93); // azul oscuro
  doc.rect(0, 0, 210, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CLÍNICA MÉDICA INTEGRAL S.A.', 105, 14, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('FACTURA ELECTRÓNICA FEL', 105, 22, { align: 'center' });
  doc.text('NIT Emisor: 1234567-8', 105, 28, { align: 'center' });

  y = 45;

  // ── Serie, Número y Fecha ─────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(240, 244, 248);
  doc.rect(margen, y - 5, ancho, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(74, 85, 104);
  doc.text('SERIE', margen + 5, y + 2);
  doc.text('NÚMERO', margen + 60, y + 2);
  doc.text('FECHA DE EMISIÓN', margen + 110, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(45, 55, 72);
  doc.setFontSize(12);
  doc.text(factura.serie, margen + 5, y + 10);
  doc.text(factura.numero, margen + 60, y + 10);
  doc.setFontSize(9);
  doc.text(fechaEmision, margen + 110, y + 10);

  y += 30;

  // ── Datos del receptor ────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(74, 85, 104);
  doc.text('DATOS DEL RECEPTOR', margen, y);

  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(margen, y, margen + ancho, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(45, 55, 72);
  doc.text('Nombre:', margen, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${factura.cita.paciente.nombres} ${factura.cita.paciente.apellidos}`, margen + 25, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('NIT:', margen, y);
  doc.setFont('helvetica', 'normal');
  doc.text(factura.nit_receptor, margen + 25, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('DPI:', margen, y);
  doc.setFont('helvetica', 'normal');
  doc.text(factura.cita.paciente.dpi || '—', margen + 25, y);

  y += 14;

  // ── Detalle del servicio ──────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(74, 85, 104);
  doc.text('DETALLE DEL SERVICIO', margen, y);

  y += 6;
  doc.line(margen, y, margen + ancho, y);
  y += 2;

  // Cabecera tabla
  doc.setFillColor(26, 54, 93);
  doc.rect(margen, y, ancho, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DESCRIPCIÓN', margen + 3, y + 5.5);
  doc.text('CANT.', margen + 110, y + 5.5);
  doc.text('PRECIO', margen + 135, y + 5.5);
  doc.text('TOTAL', margen + 155, y + 5.5);

  y += 8;

  // Fila del servicio
  doc.setFillColor(248, 250, 252);
  doc.rect(margen, y, ancho, 10, 'F');
  doc.setTextColor(45, 55, 72);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Servicios Médicos Profesionales (Consulta)', margen + 3, y + 6.5);
  doc.text('1.00', margen + 110, y + 6.5);
  doc.text(`Q ${parseFloat(factura.monto).toFixed(2)}`, margen + 133, y + 6.5);
  doc.text(`Q ${parseFloat(factura.monto).toFixed(2)}`, margen + 153, y + 6.5);

  y += 10;
  doc.line(margen, y, margen + ancho, y);
  y += 2;

  // Total
  doc.setFillColor(235, 248, 255);
  doc.rect(margen + 100, y, 70, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(34, 84, 61);
  doc.text('GRAN TOTAL:', margen + 103, y + 8);
  doc.text(`Q ${parseFloat(factura.monto).toFixed(2)}`, margen + 148, y + 8);

  y += 20;

  // ── Datos del médico y sede ───────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(74, 85, 104);
  doc.text('DATOS DE LA CONSULTA', margen, y);

  y += 6;
  doc.line(margen, y, margen + ancho, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(45, 55, 72);
  doc.text('Médico:', margen, y);
  doc.setFont('helvetica', 'normal');
  doc.text(factura.cita.doctor?.nombres || '—', margen + 25, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Sede:', margen, y);
  doc.setFont('helvetica', 'normal');
  doc.text(factura.cita.sede?.nombre || '—', margen + 25, y);

  y += 14;

  // ── Autorización SAT ──────────────────────────────────────
  doc.setFillColor(240, 244, 248);
  doc.rect(margen, y - 4, ancho, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(74, 85, 104);
  doc.text('NÚMERO DE AUTORIZACIÓN SAT (SIMULADO)', margen + 5, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(45, 55, 72);
  doc.text(factura.autorizacion, margen + 5, y + 9, { maxWidth: ancho - 10 });

  y += 26;

  // ── Pie de página ─────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.line(margen, y, margen + ancho, y);
  y += 6;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Este documento es una factura electrónica FEL simulada con fines de demostración.', 105, y, { align: 'center' });
  doc.text('Clínica Médica Integral S.A. — Sistema de Gestión Clínica', 105, y + 5, { align: 'center' });

  // ── Descargar ─────────────────────────────────────────────
  doc.save(`Factura_${factura.serie}_${factura.numero}.pdf`);
}
