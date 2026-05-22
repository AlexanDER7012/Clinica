import prisma from '../config/prisma.js';
import { registrarLog, getIp } from '../helpers/auditoria.helper.js';

const getEspecialidades = async (req, res) => {
    try{
        const especialidades = await prisma.especialidad.findMany({
            where: {
                estado: true
            },
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
            return res.status(404).json({error: 'Especialidad no encontrada'});
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

        await registrarLog({
            accion: 'CREAR_ESPECIALIDAD',
            tabla_afectada: 'Especialidad',
            ip_origen: getIp(req),
            detalle:`Especialidad "${nombre}" creada`,
            usuarioId: req.usuario?.id || null
        });

        res.status(201).json(especialidadNueva);
    }catch(error){
        res.status(500).json({error: error.message});
    }
};

const updateEspecialidad = async (req, res) => {
    try{
        const { id } = req.params;
        const {nombre, descripcion, estado } = req.body;
        const actualizada = await prisma.especialidad.update({
            where: { id_especialidad: parseInt(id) },
            data: { 
                nombre, 
                descripcion,
                estado: estado !== undefined ? estado : undefined
            }
        });


        await registrarLog({
            accion:'MODIFICAR_ESPECIALIDAD',
            tabla_afectada: 'Especialidad',
            ip_origen: getIp(req),
            detalle: `Especialidad #${id} "${nombre}" modificada`,
            usuarioId: req.usuario?.id || null
        });

        res.json(actualizada);
    }catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteEspecialidad = async (req, res) => {
    try {
        const { id } = req.params;
        
        await prisma.especialidad.update({
            where: {id_especialidad: parseInt(id) },
            data: { estado: false }
        });

        await registrarLog({
            accion:'DESACTIVAR_ESPECIALIDAD',
            tabla_afectada: 'Especialidad',
            ip_origen:getIp(req),
            detalle:`Especialidad #${id} desactivada`,
            usuarioId:req.usuario?.id || null
        });

        res.json({ message: "Especialidad desactivada correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export {
    getEspecialidades,  
    getEspecialidadById,
    createEspecialidad,
    updateEspecialidad,
    deleteEspecialidad
}