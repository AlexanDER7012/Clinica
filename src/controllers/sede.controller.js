import prisma from '../config/prisma.js';


export const getSedes = async (req, res) => {
    try {
        const sedes = await prisma.sede.findMany({
            include: {
                _count: {
                    select: { doctores: true, usuarios: true } // Nos dice cuántos hay de cada uno
                }
            }
        });
        res.json(sedes);
    }catch (error){
        res.status(500).json({ error: error.message });
    }
};


export const getSedeById = async (req, res) => {
    try{
        const{id} = req.params;
        const sede = await prisma.sede.findUnique({
            where: { id_sede: parseInt(id) },
            include: {
                doctores: true 
            }
        });

        if(!sede){
            return res.status(404).json({ error: 'Sede no encontrada' });
        }
        res.json(sede);
    }catch (error){
        res.status(500).json({ error: error.message });
    }
};

export const createSede = async (req, res) => {
    try {
        const { nombre, direccion, telefono, email } = req.body;
        
        const nuevaSede = await prisma.sede.create({
            data: {
                nombre,
                direccion,
                telefono,
                email
            }
        });
        res.status(201).json(nuevaSede);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateSede = async (req, res) => {
    try{
        const { id } = req.params;
        const { nombre, direccion, telefono, email } = req.body;

        const sedeActualizada = await prisma.sede.update({
            where:{ id_sede: parseInt(id) },
            data: {
                nombre,
                direccion,
                telefono,
                email
            }
        });
        res.json(sedeActualizada);
    }catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const deleteSede = async (req, res) => {
    try{
        const {id} = req.params;
        
        await prisma.sede.delete({
            where: { id_sede: parseInt(id) }
        });

        res.json({message: "Sede eliminada correctamente" });
    } catch (error) {
    
        res.status(500).json({error: "No se puede eliminar la sede porque tiene doctores o usuarios asociados." });
    }
};

export{
    getSedes,
    getSedeById,
    createSede,
    updateSede,
    deleteSede
}