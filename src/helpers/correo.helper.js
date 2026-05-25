import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function templatePendiente(cita) {
  const fecha = new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Guatemala'
  }).format(new Date(cita.fecha));

  return {
    subject: `📅 Recordatorio — Su cita está programada`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1a365d; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 1.4rem;">Clínica Privada</h1>
          <p style="color: #90cdf4; margin: 6px 0 0;">Sistema de Gestión de Citas</p>
        </div>

        <div style="padding: 28px;">
          <h2 style="color: #2d3748; margin: 0 0 16px;">📅 Recordatorio de Cita Médica</h2>
          <p style="color: #4a5568;">Estimado/a <strong>${cita.paciente.nombres} ${cita.paciente.apellidos}</strong>,</p>
          <p style="color: #4a5568;">Le recordamos que tiene una cita médica programada con los siguientes detalles:</p>

          <div style="background: #f8fafc; border-left: 4px solid #4299e1; border-radius: 4px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px;"><strong>🩺 Médico:</strong> ${cita.doctor.nombres}</p>
            <p style="margin: 0 0 8px;"><strong>📅 Fecha y Hora:</strong> ${fecha}</p>
            <p style="margin: 0 0 8px;"><strong>🏥 Sede:</strong> ${cita.sede.nombre}</p>
            <p style="margin: 0;"><strong>📍 Dirección:</strong> ${cita.sede.direccion}</p>
          </div>

          ${cita.motivo ? `<p style="color: #4a5568;"><strong>Motivo:</strong> ${cita.motivo}</p>` : ''}

          <div style="background: #fff3cd; border-radius: 6px; padding: 14px; margin: 20px 0;">
            <p style="margin: 0; color: #744210; font-size: 0.9rem;">
              ⚠️ Si necesita cancelar o reprogramar su cita, comuníquese con nosotros a la brevedad posible.
            </p>
          </div>

          <p style="color: #718096; font-size: 0.85rem; margin-top: 24px;">
            Este correo fue enviado por el sistema de gestión de la Clínica Privada.<br/>
            Por favor no responda directamente a este correo.
          </p>
        </div>

        <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #a0aec0; font-size: 0.8rem; margin: 0;">
            Clínica Privada — Antigua Guatemala & Petén
          </p>
        </div>
      </div>
    `
  };
}

function templateConfirmada(cita) {
  const fecha = new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Guatemala'
  }).format(new Date(cita.fecha));

  return {
    subject: `✅ Su cita ha sido confirmada`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1a365d; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 1.4rem;">Clínica Privada</h1>
          <p style="color: #90cdf4; margin: 6px 0 0;">Sistema de Gestión de Citas</p>
        </div>

        <div style="padding: 28px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 3rem;">✅</div>
            <h2 style="color: #22543d; margin: 8px 0 0;">¡Cita Confirmada!</h2>
          </div>

          <p style="color: #4a5568;">Estimado/a <strong>${cita.paciente.nombres} ${cita.paciente.apellidos}</strong>,</p>
          <p style="color: #4a5568;">Nos complace confirmarle su cita médica. Aquí están los detalles:</p>

          <div style="background: #f0fff4; border-left: 4px solid #48bb78; border-radius: 4px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px;"><strong>🩺 Médico:</strong> ${cita.doctor.nombres}</p>
            <p style="margin: 0 0 8px;"><strong>📅 Fecha y Hora:</strong> ${fecha}</p>
            <p style="margin: 0 0 8px;"><strong>🏥 Sede:</strong> ${cita.sede.nombre}</p>
            <p style="margin: 0;"><strong>📍 Dirección:</strong> ${cita.sede.direccion}</p>
          </div>

          ${cita.motivo ? `<p style="color: #4a5568;"><strong>Motivo:</strong> ${cita.motivo}</p>` : ''}

          <div style="background: #ebf8ff; border-radius: 6px; padding: 14px; margin: 20px 0;">
            <p style="margin: 0; color: #2b6cb0; font-size: 0.9rem;">
              💡 Por favor llegue <strong>10 minutos antes</strong> de su cita con su DPI a mano.
            </p>
          </div>

          <p style="color: #718096; font-size: 0.85rem; margin-top: 24px;">
            Este correo fue enviado por el sistema de gestión de la Clínica Privada.<br/>
            Por favor no responda directamente a este correo.
          </p>
        </div>

        <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #a0aec0; font-size: 0.8rem; margin: 0;">
            Clínica Privada — Antigua Guatemala & Petén
          </p>
        </div>
      </div>
    `
  };
}
export async function enviarCorreoCita(cita) {
  const emailPaciente = cita.paciente.email;
  if (!emailPaciente) throw new Error('El paciente no tiene email registrado.');

  const template = cita.estado === 'CONFIRMADA'
    ? templateConfirmada(cita)
    : templatePendiente(cita);

  const msg = {
    to:emailPaciente,
    from: process.env.SENDGRID_FROM,
    subject: template.subject,
    html:   template.html,
  };

  await sgMail.send(msg);
}
