import prisma from '../config/prisma.js';


const getCitas = async (req, res) => {
    try{
        const { doctorId, pacienteId } = req.query;

        const citas = await prisma.cita.findMany({
            where: {
                ...(doctorId && { doctorId: parseInt(doctorId) }),
                ...(pacienteId && { pacienteId: parseInt(pacienteId) }),
            },
            include: {
                doctor: { select: { nombres: true, especialidad: true } },
                paciente: { select: { nombres: true, apellidos: true } }
            },
            orderBy: {
                fecha: 'asc'
            }
        });

        const reporteTraducido = citas.map(cita => {
            return {
                id: cita.id_cita,
                paciente: `${cita.paciente.nombres} ${cita.paciente.apellidos}`,
                doctor: cita.doctor.nombres,
                motivo: cita.motivo,

                fecha_iso: cita.fecha, 

                fecha_reporte: new Intl.DateTimeFormat('es-GT', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'America/Guatemala'
                }).format(cita.fecha)
            };
        });

        res.json({
            total: reporteTraducido.length,
            citas: reporteTraducido
        });

    }catch(error){
        res.status(500).json({ error: "Error al generar reporte: " + error.message });
    }
};

const createCita = async (req, res) => {
    try {
        const { fecha, motivo, pacienteId, doctorId } = req.body;

        const fechaConZona = fecha.includes('Z') || fecha.includes('-') 
            ? fecha 
            : `${fecha}-06:00`;

        const fechaCita = new Date(fechaConZona);

        const inicioRango = new Date(fechaCita.getTime() - 30 * 60000);
        const finRango = new Date(fechaCita.getTime() + 30 * 60000);

        const choqueDoctor = await prisma.cita.findFirst({
            where: {
                doctorId: parseInt(doctorId),
                fecha: {
                    gt: inicioRango,
                    lt: finRango
                }
            },
            include: { doctor: true } 
        });

        if (choqueDoctor) {
            const horaLegible = new Intl.DateTimeFormat('es-GT', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/Guatemala'
            }).format(choqueDoctor.fecha);

            return res.status(400).json({
                error: `El Dr. ${choqueDoctor.doctor.nombres} ya tiene una cita programada a las ${horaLegible}.`
            });
        }

        const choquePaciente = await prisma.cita.findFirst({
            where: {
                pacienteId: parseInt(pacienteId),
                fecha: {
                    gt: inicioRango,
                    lt: finRango
                }
            },
            include: { paciente: true }
        });

        if(choquePaciente){
            const horaLegiblePac = new Intl.DateTimeFormat('es-GT', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/Guatemala'
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
                estado: 'PENDIENTE'
            },
            include: {
                doctor: true,
                paciente: true
            }
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
            include: { paciente: true, doctor: true }
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
        const { fecha, motivo, estado, doctorId } = req.body;

        const actualizada = await prisma.cita.update({
            where: { id_cita: parseInt(id)},
            data: {
                fecha: fecha ? new Date(fecha) : undefined,
                motivo,
                estado, 
                doctorId: doctorId ? parseInt(doctorId) : undefined
            }
        });
        res.json(actualizada);
    }catch (error){
        res.status(500).json({ error: error.message });
    }
};


const deleteCita = async (req, res) => {
    try{
        const { id } = req.params;
        await prisma.cita.delete({ where: { id_cita: parseInt(id) } });
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
    deleteCita
}