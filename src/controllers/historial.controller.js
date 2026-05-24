import prisma from '../config/prisma.js';
import { registrarLog, getIp } from '../helpers/auditoria.helper.js';

const getHistorialPaciente = async (req, res) => {
    try {
        const { id } = req.params;

        const paciente = await prisma.paciente.findUnique({
            where: { id_paciente: parseInt(id) },
            include: {
                citas: {
                    include: {
                        doctor:  { select: { nombres: true, especialidad: { select: { nombre: true } } } },
                        sede:    { select: { nombre: true } },
                        factura: { select: { serie: true, numero: true, monto: true } }
                    },
                    orderBy: { fecha: 'desc' }
                }
            }
        });

        if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado.' });
        res.json(paciente);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateAlergias = async (req, res) => {
    try {
        const { id }      = req.params;
        const { alergias } = req.body;

        const paciente = await prisma.paciente.update({
            where: { id_paciente: parseInt(id) },
            data:  { alergias: alergias || null }
        });

        await registrarLog({
            accion:         'ACTUALIZAR_ALERGIAS',
            tabla_afectada: 'Paciente',
            ip_origen:      getIp(req),
            detalle:        `Alergias del paciente #${id} actualizadas`,
            usuarioId:      req.usuario?.id || null
        });

        res.json({ message: 'Alergias actualizadas correctamente.', paciente });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export { getHistorialPaciente, updateAlergias };