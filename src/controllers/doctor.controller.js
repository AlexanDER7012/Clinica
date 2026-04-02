import prisma from '../config/prisma.js';

const getDoctores = async (req, res) => {
    try{
        const doctores = await prisma.doctor.findMany();
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
        const data = req.body;
        const doctorNuevo = await prisma.doctor.create({
            data,
        });
        res.status(201).json(doctorNuevo);
    } catch(error){
        res.status(500).json({error: error.message});
    }
};

const updateDoctor = async (req, res) => {
    try{
        const {id} = req.params;
        const data = req.body;
        const doctorActualizado = await prisma.doctor.update({
            where: { id_doctor: parseInt(id)},
            data,
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