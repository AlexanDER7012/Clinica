import prisma from "../config/prisma.js";

const getEspecialidades = async (req, res) => {
    try{
        const especialidades = await prisma.especialidad.findMany({
            include: {
                _count: {
                    select: {doctores: true}
                }
            }
        });
        res.json(especialidades);

    }catch (error){
        res.status(500).json({error: error.message});
    }
};

const getEspecialidadById = async (req, res) => {
    try{
        const {id} = req.params;
        const especialidad = await prisma.especialidad.findUnique({
            where: {id_especialidad:parseInt(id)},
            include: { doctores: true}
        });
        if(!especialidad){
            res.status(404).json({error: 'Especialidad no encontrada'});
        }
        res.json(especialidad);
    }catch(error){
        res.status(500).json({error: error.message});
    }
};

const createEspecialidad = async (req, res) => {
    try{
        const {nombre, descripcion} = req.body;
        const especialidadNueva = await prisma.especialidad.create({
            data: {nombre, descripcion}
        });
        res.status(201).json(especialidadNueva);
    }catch(error){
        res.status(500).json({error: error.message});
    }
};

const updateEspecialidad = async (req, res) => {
    try{
        const { id } = req.params;
        const {nombre, descripcion } = req.body;
        const actualizada = await prisma.especialidad.update({
            where: { id_especialidad: parseInt(id) },
            data: { nombre, descripcion }
        });
        res.json(actualizada);
    }catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteEspecialidad = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.especialidad.delete({
            where: {id_especialidad: parseInt(id) }
        });
        res.json({ message: "Especialidad eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ error: "No se puede eliminar si hay doctores asociados a esta especialidad." });
    }
};

export {
    getEspecialidades,  
    getEspecialidadById,
    createEspecialidad,
    updateEspecialidad,
    deleteEspecialidad
}

