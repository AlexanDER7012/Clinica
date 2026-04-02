import prisma from '../config/prisma.js';

const getPacientes = async (req, res) => {
    try{
        const pacientes = await prisma.paciente.findMany();
        res.json(pacientes);
    }catch(error){
        res.status(500).json({ error : error.message})
    }
};

const getPacienteById = async (req, res) =>{
    try{
    const {id} = req.params;

    const paciente  = await prisma.paciente.findUnique({
        where: {id_paciente: parseInt(id)},
    });

    if(!paciente){
        return res.status(404).json({error: 'Paciente no encontrado'});
    }
    res.json(paciente);

    }catch(error){
        res.status(500).json({error: error.message});
    }

};

const createPaciente = async (req, res) => {
    const data = req.body;
    try{
        const pacienteNuevo = await prisma.paciente.create({
            data,
        });
    res.status(201).json(pacienteNuevo);

    }catch(error){
        res.status(500).json({error: error.message});
    }
};

const updatePaciente = async (req, res) => {
    try{

        const {id} = req.params;
        const data = req.body;

        const pacienteActualizado = await prisma.paciente.update({
            where: {id_paciente: parseInt(id)},
            data,
        });
        res.json(pacienteActualizado);
    }catch(error){
        res.status(500).json({error: error.message});
    }
};

const deletePaciente = async (req, res) =>{
    try{
        const {id} = req.params;

        const pacienteELiminado = await prisma.paciente.delete({
            where: {id_paciente: parseInt(id)},
        });

        res.json({ message: "Paciente eliminado correctamente"});

    }catch(error){
        res.status(500).json({error: error.message});
    }
};

export{
    getPacientes,
    getPacienteById,
    createPaciente,
    updatePaciente,
    deletePaciente,

};