import prisma from '../config/prisma.js';
import { registrarLog, getIp } from '../helpers/auditoria.helper.js';

const registrarCitaCompleta = async (req, res) => {
    const { paciente, cita, sedeId } = req.body;

    try {
        const fechaConZona = cita.fecha.includes('Z') || cita.fecha.includes('-') 
            ? cita.fecha 
            : `${cita.fecha}-06:00`;

        const fechaCita = new Date(fechaConZona);
        
        const inicioRango = new Date(fechaCita.getTime() - 30 * 60000);
        const finRango = new Date(fechaCita.getTime() + 30 * 60000);

        const formatearHora = (fecha) => new Intl.DateTimeFormat('es-GT', {
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true, 
            timeZone: 'America/Guatemala'
        }).format(fecha);

        const choqueDoctor = await prisma.cita.findFirst({
            where: {
                doctorId: parseInt(cita.doctorId),
                fecha: { gt: inicioRango, lt: finRango }
            },
            include: { doctor: true }
        });

        if (choqueDoctor) {
            return res.status(400).json({
                error: `El Dr. ${choqueDoctor.doctor.nombres} ya tiene una cita a las ${formatearHora(choqueDoctor.fecha)}.`
            });
        }

        const pacienteExistente = await prisma.paciente.findUnique({ 
            where: { dpi: paciente.dpi } 
        });
        
        if (pacienteExistente) {
            const choquePaciente = await prisma.cita.findFirst({
                where: {
                    pacienteId: pacienteExistente.id_paciente,
                    fecha: { gt: inicioRango, lt: finRango }
                },
                include: { paciente: true }
            });

            if (choquePaciente) {
                return res.status(400).json({
                    error: `El paciente ${choquePaciente.paciente.nombres} ya tiene otra cita a las ${formatearHora(choquePaciente.fecha)}.`
                });
            }
        }

        const resultado = await prisma.$transaction(async (tx) => {
            const pacienteDB = await tx.paciente.upsert({
                where: { dpi: paciente.dpi },
                update: {
                    nombres: paciente.nombres,
                    apellidos: paciente.apellidos,
                    telefono: paciente.telefono,
                    email: paciente.email,
                    direccion: paciente.direccion,
                    contacto_emergencia: paciente.contacto_emergencia,
                    fecha_nacimiento: new Date(paciente.fecha_nacimiento)
                },
                create: { 
                    ...paciente, 
                    fecha_nacimiento: new Date(paciente.fecha_nacimiento) 
                }
            });

            const nuevaCita = await tx.cita.create({
                data: {
                    fecha: fechaCita,
                    motivo: cita.motivo,
                    pacienteId: pacienteDB.id_paciente,
                    doctorId: parseInt(cita.doctorId),
                    sedeId: parseInt(sedeId),
                    estado: 'PENDIENTE'
                },
                include: {
                    paciente: true,
                    doctor: true,
                    sede: true
                }
            });

            return nuevaCita;
        });

        await registrarLog({
            accion: 'CREAR_CITA',
            tabla_afectada: 'Cita',
            ip_origen:getIp(req),
            detalle:`Cita agendada para ${resultado.paciente.nombres} ${resultado.paciente.apellidos} con ${resultado.doctor.nombres}`,
            usuarioId:  req.usuario?.id || null
        });

        res.status(201).json(resultado);

    } catch(error){
        console.error("Error en registrarCitaCompleta:", error);
        res.status(500).json({ 
            error: "Error interno del servidor", 
            detalle: error.message 
        });
    }
};

const getCitas = async (req, res) => {
    try{
        const { nombre, dpi } = req.query;

        const sedeIdDelToken = req.usuario?.rol === 'SECRETARIA' 
            ? req.usuario.sedeId 
            : null;

        const citas = await prisma.cita.findMany({
            where: {
                ...(sedeIdDelToken && { sedeId: sedeIdDelToken }),
                ...(nombre && {
                    paciente: {
                        OR: [
                            { nombres:   { contains: nombre } },
                            { apellidos: { contains: nombre } },
                        ]
                    }
                }),
                ...(dpi && {
                    paciente: { dpi: { contains: dpi } }
                }),
            },
            include: {
                doctor:   { select: { nombres: true, especialidad: true } },
                paciente: { select: { nombres: true, apellidos: true, dpi: true } }
            },
            orderBy: { fecha: 'asc' }
        });

        const reporteTraducido = citas.map(cita => ({
            id:            cita.id_cita,
            paciente:      `${cita.paciente.nombres} ${cita.paciente.apellidos}`,
            dpi_paciente:  cita.paciente.dpi,
            doctor:        cita.doctor.nombres,
            motivo:        cita.motivo,
            estado:        cita.estado,
            fecha_iso:     cita.fecha,
            fecha_reporte: new Intl.DateTimeFormat('es-GT', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'America/Guatemala'
            }).format(cita.fecha)
        }));
        const orden = { CONFIRMADA: 0, PENDIENTE: 1, CANCELADA: 2, FINALIZADA: 3 };
        reporteTraducido.sort((a, b) => (orden[a.estado] ?? 9) - (orden[b.estado] ?? 9));

        res.json({ total: reporteTraducido.length, citas: reporteTraducido });

    }catch(error){
        res.status(500).json({ error: "Error al generar reporte: " + error.message });
    }
};

const createCita = async (req, res) => {
    try {
        const { fecha, motivo, pacienteId, doctorId, sedeId } = req.body;

        const fechaConZona = fecha.includes('Z') || fecha.includes('-') 
            ? fecha 
            : `${fecha}-06:00`;

        const fechaCita = new Date(fechaConZona);
        const inicioRango = new Date(fechaCita.getTime() - 30 * 60000);
        const finRango = new Date(fechaCita.getTime() + 30 * 60000);

        const choqueDoctor = await prisma.cita.findFirst({
            where: {
                doctorId: parseInt(doctorId),
                fecha: { gt: inicioRango, lt: finRango }
            },
            include: { doctor: true } 
        });

        if (choqueDoctor) {
            const horaLegible = new Intl.DateTimeFormat('es-GT', {
                hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Guatemala'
            }).format(choqueDoctor.fecha);
            return res.status(400).json({
                error: `El Dr. ${choqueDoctor.doctor.nombres} ya tiene una cita programada a las ${horaLegible}.`
            });
        }

        const choquePaciente = await prisma.cita.findFirst({
            where: {
                pacienteId: parseInt(pacienteId),
                fecha: { gt: inicioRango, lt: finRango }
            },
            include: { paciente: true }
        });

        if(choquePaciente){
            const horaLegiblePac = new Intl.DateTimeFormat('es-GT', {
                hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Guatemala'
            }).format(choquePaciente.fecha);
            return res.status(400).json({
                error: `El paciente ${choquePaciente.paciente.nombres} ya tiene otra cita a las ${horaLegiblePac}.`
            });
        }

        const nuevaCita = await prisma.cita.create({
            data: {
                fecha: fechaCita,
                motivo,
                pacienteId: parseInt(pacienteId),
                doctorId: parseInt(doctorId),
                sedeId: parseInt(sedeId), 
                estado: 'PENDIENTE'
            },
            include: { doctor: true, paciente: true, sede: true }
        });

        await registrarLog({
            accion: 'CREAR_CITA',
            tabla_afectada: 'Cita',
            ip_origen: getIp(req),
            detalle: `Cita creada para paciente #${pacienteId} con doctor #${doctorId}`,
            usuarioId: req.usuario?.id || null
        });

        res.status(201).json(nuevaCita);

    }catch (error){
        console.error(error);
        res.status(500).json({ error: "Error al crear la cita: " + error.message });
    }
};

const getCitaById = async (req, res) =>{
    try{
        const { id } = req.params;
        const cita = await prisma.cita.findUnique({
            where: { id_cita: parseInt(id) },
            include: { paciente: true, doctor: true, sede: true } 
        });

        if(!cita) return res.status(404).json({ error: 'Cita no encontrada' });
        res.json(cita);
    }catch (error){
        res.status(500).json({ error: error.message });
    }
};

const updateCita = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, motivo, estado, doctorId, receta_medica } = req.body; 

        if (fecha || doctorId) {
            const citaActual  = await prisma.cita.findUnique({ where: { id_cita: parseInt(id) } });
            const fechaFinal  = fecha ? new Date(fecha) : citaActual.fecha;
            const doctorFinal = doctorId ? parseInt(doctorId) : citaActual.doctorId;

            const inicioRango = new Date(fechaFinal.getTime() - 30 * 60000);
            const finRango    = new Date(fechaFinal.getTime() + 30 * 60000);

            const choqueDoctor = await prisma.cita.findFirst({
                where: {
                    doctorId: doctorFinal,
                    fecha: { gt: inicioRango, lt: finRango },
                    id_cita:  { not: parseInt(id) } 
                },
                include: { doctor: true }
            });

            if (choqueDoctor) {
                const hora = new Intl.DateTimeFormat('es-GT', {
                    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Guatemala'
                }).format(choqueDoctor.fecha);
                return res.status(400).json({
                    error: `El Dr. ${choqueDoctor.doctor.nombres} ya tiene una cita a las ${hora}. Elija otro horario.`
                });
            }
        }

        const actualizada = await prisma.cita.update({
            where: { id_cita: parseInt(id)},
            data: {
                fecha: fecha ? new Date(fecha) : undefined,
                motivo,
                estado, 
                receta_medica, 
                doctorId: doctorId ? parseInt(doctorId) : undefined
            }
        });

        if (estado) {
            await registrarLog({
                accion: `CITA_${estado}`,
                tabla_afectada: 'Cita',
                ip_origen: getIp(req),
                detalle:        `Cita #${id} cambió a estado ${estado}`,
                usuarioId:      req.usuario?.id || null
            });
        }

        if (fecha || doctorId) {
            await registrarLog({
                accion: 'REPROGRAMAR_CITA',
                tabla_afectada: 'Cita',
                ip_origen: getIp(req),
                detalle: `Cita #${id} reprogramada${fecha ? ' a nueva fecha' : ''}${doctorId ? ' con nuevo médico' : ''}`,
                usuarioId: req.usuario?.id || null
            });
        }

        res.json(actualizada);
    }catch (error){
        res.status(500).json({ error: error.message });
    }
};

const updateRecetaCita = async (req, res) => {
    try {
        const { id } = req.params;
        const { receta_medica } = req.body;

        if (!receta_medica || receta_medica.trim() === "") {
            return res.status(400).json({ error: "El contenido de la receta médica no puede estar vacío." });
        }

        const citaConReceta = await prisma.cita.update({
            where: { id_cita: parseInt(id) },
            data: { receta_medica: receta_medica },
            include: { paciente: true, doctor: true }
        });

        await registrarLog({
            accion:  'ACTUALIZAR_RECETA',
            tabla_afectada: 'Cita',
            ip_origen:getIp(req),
            detalle:`Receta médica actualizada en cita #${id} — Paciente: ${citaConReceta.paciente.nombres}`,
            usuarioId: req.usuario?.id || null
        });

        res.json({
            message: "Receta médica registrada exitosamente en el sistema.",
            cita: citaConReceta
        });
    } catch (error) {
        console.error("Error en updateRecetaCita:", error);
        res.status(500).json({ error: "Error al actualizar la receta: " + error.message });
    }
};

const deleteCita = async (req, res) => {
    try{
        const { id } = req.params;
        await prisma.cita.delete({ where: { id_cita: parseInt(id) } });

        await registrarLog({
            accion:'ELIMINAR_CITA',
            tabla_afectada: 'Cita',
            ip_origen:getIp(req),
            detalle:  `Cita #${id} eliminada del sistema`,
            usuarioId: req.usuario?.id || null
        });

        res.json({ message: "Cita eliminada correctamente" });
    }catch (error){
        res.status(500).json({ error: error.message });
    }
};

export{
    getCitas,
    getCitaById,
    createCita,
    updateCita,
    deleteCita,
    registrarCitaCompleta,
    updateRecetaCita 
}
