import prisma from '../config/prisma.js';
import { enviarCorreoCita }  from '../helpers/correo.helper.js';
import { registrarLog, getIp } from '../helpers/auditoria.helper.js';

const enviarCorreo = async (req, res) => {
    try {
        const { id } = req.params;

        const cita = await prisma.cita.findUnique({
            where: { id_cita: parseInt(id) },
            include: {
                paciente: true,
                doctor: true,
                sede:  true
            }
        });

        if (!cita){
            return res.status(404).json({ error: 'Cita no encontrada.' });
        }

        if (!['PENDIENTE', 'CONFIRMADA'].includes(cita.estado)) {
            return res.status(400).json({ 
                error: `No se puede enviar correo para una cita en estado ${cita.estado}.` 
            });
        }

        if (!cita.paciente.email) {
            return res.status(400).json({ 
                error: 'El paciente no tiene correo electrónico registrado.' 
            });
        }

        await enviarCorreoCita(cita);
        await registrarLog({
            accion: 'ENVIAR_CORREO_CITA',
            tabla_afectada:'Cita',
            ip_origen:getIp(req),
            detalle: `Correo de ${cita.estado === 'CONFIRMADA' ? 'confirmación' : 'recordatorio'} enviado a ${cita.paciente.email} — Cita #${id}`,
            usuarioId:req.usuario?.id || null
        });

        res.json({ 
            mensaje: `Correo de ${cita.estado === 'CONFIRMADA' ? 'confirmación' : 'recordatorio'} enviado exitosamente a ${cita.paciente.email}.`
        });

    } catch (error) {
        console.error('Error al enviar correo:', error);
        const mensajeError = error?.response?.body?.errors?.[0]?.message || error.message;
        res.status(500).json({ error: `Error al enviar correo: ${mensajeError}` });
    }
};

export { enviarCorreo };