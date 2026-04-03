import prisma from '../config/prisma.js';


const getCitas = async (req, res) =>{
    try {
        const citas = await prisma.cita.findMany({
            include: {
                paciente: { select: { nombres: true, apellidos: true}},
                doctor: { 
                    select: { 
                        nombres: true, 
                        especialidad: { select: { nombre: true}} 
                    } 
                }
            },
            orderBy: { fecha: 'asc' }
        });
        res.json(citas);
    }catch (error){
        res.status(500).json({ error: error.message });
    }
};

const createCita = async (req, res) =>{
    try{
        const{fecha, motivo, pacienteId, doctorId} = req.body;

        const nuevaCita = await prisma.cita.create({
            data: {
                fecha: new Date(fecha),
                motivo,
                pacienteId: parseInt(pacienteId),
                doctorId: parseInt(doctorId)
            },
            include: {paciente: true, doctor: true}
        });
        res.status(201).json(nuevaCita);
    }catch (error){
        res.status(500).json({ error: "Error al crear cita. Verifique que los IDs existan." });
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