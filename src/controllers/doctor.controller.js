import prisma from '../config/prisma.js';

const getDoctores = async (req, res) => {
    try{
        const doctores = await prisma.doctor.findMany({
            include: {
                especialidad: true, 
                sede: true
            }
        });
        res.json(doctores);
    }catch(error){
        res.status(500).json({error: error.message});
    }
};

const getDoctorById = async (req, res) => {
    try{
        const {id} = req.params;
        const doctor = await prisma.doctor.findUnique({
            where: { id_doctor:parseInt(id)},
            include: {
                especialidad: true,
                sede: true,
                citas: true
            }
        });
        if(!doctor){
            return res.status(404).json({error: 'Doctor no encontrado'});
        }
        res.json(doctor);
    }catch(error){
        res.status(500).json({error:error.message});
    }
};

const createDoctor = async (req, res) =>{
    try{
        const { nombres, telefono, email, especialidadId, sedeId } = req.body;
        const doctorNuevo = await prisma.doctor.create({
            data: {
                nombres,
                telefono,
                email,
                especialidadId : parseInt(especialidadId),
                sedeId : parseInt(sedeId)
            },  
            include: { especialidad: true, sede: true }
        });
        res.status(201).json(doctorNuevo);
    } catch(error){
        res.status(500).json({error: error.message});
    }
};

const updateDoctor = async (req, res) => {
    try{
        const {id} = req.params;
        const { nombres, telefono, email, especialidadId, sedeId } = req.body;
        const doctorActualizado = await prisma.doctor.update({
            where: { id_doctor: parseInt(id)},
            data: {
                nombres,
                telefono,
                email,
                especialidadId: especialidadId ? parseInt(especialidadId) : undefined,
                sedeId: sedeId ? parseInt(sedeId) : undefined
            },
            include: { especialidad: true, sede: true }
        });
        res.json(doctorActualizado);
    }catch(error){
        res.status(500).json({error: error.message});
    }
};

const deleteDoctor = async (req, res) =>{
    try{
        const {id} = req.params;

        const doctorEliminado = await prisma.doctor.delete({
            where: {id_doctor: parseInt(id)},
        });

        res.json({ message: "Doctor eliminado correctamente"});

    }catch(error){
        res.status(500).json({error: error.message});
    }
};

export {
    getDoctores,
    getDoctorById,
    createDoctor,
    updateDoctor,
    deleteDoctor
}