import prisma from '../config/prisma.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const register = async (req, res) => {
    try{
        const {nombres, email, password, rol, sedeId} = req.body;


        const usuarioExiste = await prisma.usuario.findUnique({
            where: {email}
        });

        if(usuarioExiste){
            return res.status(400).json({mensaje: "El correo ya está registrado" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const nuevoUsuario = await prisma.usuario.create({
            data:{
                nombres,
                email,
                password: hashedPassword,
                rol,
                ...(sedeId && { sedeId: parseInt(sedeId)})
            }
        });

        res.status(201).json({
            mensaje: "Usuario creado con éxito",
            usuario: {
                id: nuevoUsuario.id_usuario,
                nombres: nuevoUsuario.nombres,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol
            }
        });

    }catch (error){
        console.error(error);
        res.status(500).json({ error: "Error al registrar usuario: " + error.message });
    }
};

const login = async (req, res) => {
    try{
        const {email, password} = req.body;

        const usuario = await prisma.usuario.findUnique({ where: { email }});
        if(!usuario){
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }


        const validPassword = await bcrypt.compare(password, usuario.password);
        if (!validPassword) {
            return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        }

        const token = jwt.sign(
            { 
                id: usuario.id_usuario, 
                rol: usuario.rol,
                sedeId: usuario.sedeId 
            }, 
            process.env.JWT_SECRET, 
            {expiresIn: '9h'}
        );

        res.json({
            mensaje: "Login exitoso",
            token,
            usuario: {
                nombres: usuario.nombres,
                rol: usuario.rol
            }
        });

    }catch(error){
        res.status(500).json({ error: error.message });
    }
};

export{
    register,
    login
}