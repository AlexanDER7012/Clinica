import prisma from '../config/prisma.js';


const getSedes = async (req, res) => {
    try {
        const sedes = await prisma.sede.findMany({
            where: {
                estado: true
            },
            include: {
                _count: {
                    select: { doctores: true, usuarios:true} 
                }
            }
        });
        res.json(sedes);
    }catch (error){
        res.status(500).json({ error: error.message });
    }
};


const getSedeById = async (req, res) => {
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

const createSede = async (req, res) => {
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

const updateSede = async (req, res) => {
    try{
        const { id } = req.params;
        const { nombre, direccion, telefono, email, estado } = req.body;

        const sedeActualizada = await prisma.sede.update({
            where:{ id_sede: parseInt(id) },
            data: {
                nombre,
                direccion,
                telefono,
                email,
                estado: estado !== undefined ? estado : undefined
            }
        });
        res.json(sedeActualizada);
    }catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const deleteSede = async (req, res) => {
    try{
        const {id} = req.params;
        
        await prisma.sede.update({
            where: { id_sede: parseInt(id) },
            data: { estado: false }
        });

        res.json({message: "Sede desactivada correctamente" });
    } catch (error) {
    
        res.status(500).json({error: error.message });
    }
};

export{
    getSedes,
    getSedeById,
    createSede,
    updateSede,
    deleteSede
}