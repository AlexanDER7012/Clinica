import prisma from '../config/prisma.js';



const getPacientes = async (req, res) => {
    try{
        const pacientes = await prisma.paciente.findMany({
            include: {
                _count: {
                    select: { citas: true }
                }
            }
        });
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
            include: {
                citas: {
                    include: {
                        doctor: {
                            select: { nombres: true, especialidad: true }
                        },
                        sede: {
                            select: { nombre: true }
                        }
                    },
                    orderBy: {
                        fecha: 'desc'
                    }
                }
            }
        });

        if(!paciente){
            return res.status(404).json({error: 'Paciente no encontrado'});
        }
        res.json(paciente);

    }catch(error){
        res.status(500).json({error: error.message});
    }
};

const buscarPaciente = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({ error: 'Ingrese un término de búsqueda.' });
        }

        const pacientes = await prisma.paciente.findMany({
            where: {
                OR: [
                    { dpi:       { contains: q } },
                    { nombres:   { contains: q } },
                    { apellidos: { contains: q } },
                ]
            },
            include: {
                citas: {
                    where: { estado: 'CONFIRMADA' },
                    include: {
                        doctor: { select: { nombres: true } },
                        sede:   { select: { nombre: true  } }
                    },
                    orderBy: { fecha: 'desc' }
                }
            }
        });

        res.json(pacientes);
    } catch (error) {
        console.error('Error en buscarPaciente:', error);
        res.status(500).json({ error: error.message });
    }
};

const getPacienteByDpi = async (req, res) => {
    try{
        const { dpi } = req.params;
        const paciente = await prisma.paciente.findUnique({
            where: {dpi},
            include: {
                citas: {
                    include: {
                        doctor: {
                            select: { nombres: true, especialidad: true } 
                        },
                        sede: {
                            select: { nombre: true }
                        }
                    },
                    orderBy: {
                        fecha: 'desc' 
                    }
                }
            }
        });

        if(!paciente) return res.status(404).json({ mensaje: "Paciente no encontrado" });
        
        res.json(paciente);
    }catch (error){
        res.status(500).json({ error: error.message });
    }
};

const createPaciente = async (req, res) => {
    const { 
        nombres, 
        apellidos, 
        dpi, 
        sexo, 
        telefono, 
        email, 
        fecha_nacimiento, 
        direccion, 
        contacto_emergencia 
    } = req.body;
    try{
        const pacienteNuevo = await prisma.paciente.create({
            data: {
                nombres,
                apellidos,
                dpi,
                sexo,
                telefono,
                email,
                direccion,
                contacto_emergencia,
                fecha_nacimiento: new Date(fecha_nacimiento) 
            },
        });
        res.status(201).json(pacienteNuevo);

    }catch(error){
        res.status(500).json({error: error.message});
    }
};

const updatePaciente = async (req, res) => {
    try{
        const {id} = req.params;
        const { 
            nombres, apellidos, dpi, sexo, telefono, 
            email, direccion, contacto_emergencia, fecha_nacimiento 
        } = req.body;

        const pacienteActualizado = await prisma.paciente.update({
            where: {id_paciente: parseInt(id)},
            data: {
                nombres,
                apellidos,
                dpi,
                sexo,
                telefono,
                email,
                direccion,
                contacto_emergencia,
                fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : undefined
            },
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
    getPacienteByDpi,
    buscarPaciente
};