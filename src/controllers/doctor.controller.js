import prisma from '../config/prisma.js';
import { registrarLog, getIp } from '../helpers/auditoria.helper.js';

const getDoctores = async (req, res) => {
    try{
        const { sedeId } = req.query;
        const doctores = await prisma.doctor.findMany({
            where: {
                estado: true,
                ...(sedeId && { sedeId: parseInt(sedeId)})
            },
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
        const { nombres, dpi, telefono, email, especialidadId, sedeId } = req.body;
        const doctorNuevo = await prisma.doctor.create({
            data: {
                nombres,
                dpi,
                telefono,
                email,
                especialidadId : parseInt(especialidadId),
                sedeId : parseInt(sedeId)
            },  
            include: { especialidad: true, sede: true }
        });

        await registrarLog({
            accion: 'CREAR_DOCTOR',
            tabla_afectada: 'Doctor',
            ip_origen: getIp(req),
            detalle:`Doctor ${nombres} (DPI: ${dpi}) registrado`,
            usuarioId: req.usuario?.id || null
        });

        res.status(201).json(doctorNuevo);
    } catch(error){
        res.status(500).json({error: error.message});
    }
};

const updateDoctor = async (req, res) => {
    try{
        const {id} = req.params;
        const { nombres, dpi, telefono, email, especialidadId, sedeId, estado } = req.body;
        const doctorActualizado = await prisma.doctor.update({
            where: { id_doctor: parseInt(id)},
            data: {
                nombres,
                dpi,
                telefono,
                email,
                especialidadId: especialidadId ? parseInt(especialidadId) : undefined,
                sedeId: sedeId ? parseInt(sedeId) : undefined,
                estado: estado !== undefined ? estado : undefined
            },
            include: { especialidad: true, sede: true }
        });

        await registrarLog({
            accion: 'MODIFICAR_DOCTOR',
            tabla_afectada: 'Doctor',
            ip_origen: getIp(req),
            detalle: `Doctor #${id} (${nombres}) modificado`,
            usuarioId: req.usuario?.id || null
        });

        res.json(doctorActualizado);
    }catch(error){
        res.status(500).json({error: error.message});
    }
};

const deleteDoctor = async (req, res) =>{
    try{
        const {id} = req.params;

        await prisma.doctor.update({
            where: {id_doctor: parseInt(id)},
            data: { estado: false }
        });

        await registrarLog({
            accion: 'DESACTIVAR_DOCTOR',
            tabla_afectada: 'Doctor',
            ip_origen:getIp(req),
            detalle: `Doctor #${id} desactivado del sistema`,
            usuarioId:  req.usuario?.id || null
        });

        res.json({ message: "Doctor desactivado correctamente"});

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