import prisma from "../config/prisma.js";

const getUsuarios = async (req, res) => {
    try{
        const usuarios = await prisma.usuario.findMany({
            where: {
                estado: true
            },
            include: {
                sede: { select: { nombre: true} }             
            }
        });
        res.json(usuarios);
    }catch (error){
        res.status(500).json({ error: error.message});
    }
};

const getUsuarioById = async (req, res) =>{
    try{
        const {id} = req.params;
        const usuario = await prisma.usuario.findUnique({
            where: { id_usuario: parseInt(id) },
            include: { sede: true }
        });

        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(usuario);
    } catch(error){
        res.status(500).json({ error: error.message});
    }
};

const createUsuario = async (req, res) =>{
    try{
        const {nombres, email, password, rol, sedeId } = req.body;

        const nuevoUsuario = await prisma.usuario.create({
            data: {
                nombres,
                email,
                password,
                rol, 
                sedeId: sedeId ? parseInt(sedeId) : null 
            }
        });
        res.status(201).json(nuevoUsuario);
    }catch(error){
        if (error.code==='P2002') {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        res.status(500).json({ error: error.message });
    }
};

const updateUsuario = async (req, res) =>{
    try {
        const {id} = req.params;
        const {nombres, email, password, rol, sedeId, estado, intentos_fallidos, bloqueado } = req.body;

        const actualizado = await prisma.usuario.update({
            where: { id_usuario: parseInt(id) },
            data: {
                nombres,
                email,
                password,
                rol,
                sedeId: sedeId ? parseInt(sedeId) : undefined,
                estado: estado !== undefined ? estado : undefined,
                intentos_fallidos: intentos_fallidos !== undefined ? parseInt(intentos_fallidos) : undefined,
                bloqueado: bloqueado !== undefined ? bloqueado : undefined
            }
        });
        res.json(actualizado);
    }catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const desbloquearUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        const usuarioDesbloqueado = await prisma.usuario.update({
            where: { id_usuario: parseInt(id) },
            data: {
                intentos_fallidos: 0,
                bloqueado: false
            }
        });

        res.json({ 
            message: `El usuario ${usuarioDesbloqueado.nombres} ha sido desbloqueado exitosamente.`,
            usuario: {
                id_usuario: usuarioDesbloqueado.id_usuario,
                email: usuarioDesbloqueado.email,
                bloqueado: usuarioDesbloqueado.bloqueado
            }
        });
    } catch (error) {
        console.error("Error en desbloquearUsuario:", error);
        res.status(500).json({ error: "Error al intentar desbloquear al usuario: " + error.message });
    }
};

const deleteUsuario = async (req, res) => {
    try {
        const {id} = req.params;

        await prisma.usuario.update({ 
            where: { id_usuario: parseInt(id) },
            data: { estado: false }
        });

        res.json({ message: "Usuario desactivado correctamente" });
    }catch (error){
        res.status(500).json({ error: error.message });
    }
};

export{
    getUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    desbloquearUsuario
}