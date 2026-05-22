import prisma from '../config/prisma.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { registrarLog, getIp } from '../helpers/auditoria.helper.js';

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

        await registrarLog({
            accion:'CREAR_USUARIO',
            tabla_afectada: 'Usuario',
            ip_origen: getIp(req),
            detalle:`Usuario ${nombres} (${email}) creado con rol ${rol}`,
            usuarioId: req.usuario?.id || null
        });

        res.status(201).json({
            mensaje: "Usuario creado con éxito",
            usuario: {
                id: nuevoUsuario.id_usuario,
                nombres: nuevoUsuario.nombres,
                email: nuevoUsuario.email,
                role: nuevoUsuario.rol
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
        const ip = getIp(req);

        const usuario = await prisma.usuario.findUnique({ where: { email }});

        if(!usuario){
            await registrarLog({
                accion:    'LOGIN_FALLIDO',
                ip_origen: ip,
                detalle:   `Intento de login con email inexistente: ${email}`
            });
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        if (!usuario.estado) {
            await registrarLog({
                accion:    'LOGIN_BLOQUEADO',
                ip_origen: ip,
                detalle:   `Intento de acceso a cuenta deshabilitada: ${email}`,
                usuarioId: usuario.id_usuario
            });
            return res.status(403).json({ mensaje: "Este usuario ha sido deshabilitado del sistema" });
        }

        if (usuario.bloqueado) {
            await registrarLog({
                accion:    'LOGIN_BLOQUEADO',
                ip_origen: ip,
                detalle:   `Intento de acceso a cuenta bloqueada: ${email}`,
                usuarioId: usuario.id_usuario
            });
            return res.status(423).json({ 
                mensaje: "Esta cuenta se encuentra bloqueada por superar el límite de 3 intentos fallidos. Contacte al Administrador." 
            });
        }

        const validPassword = await bcrypt.compare(password, usuario.password);
        
        if (!validPassword) {
            const nuevosIntentos = usuario.intentos_fallidos + 1;
            const debeBloquearse = nuevosIntentos >= 3;

            await prisma.usuario.update({
                where: { id_usuario: usuario.id_usuario },
                data: {
                    intentos_fallidos: nuevosIntentos,
                    bloqueado: debeBloquearse
                }
            });

            await registrarLog({
                accion:    debeBloquearse ? 'CUENTA_BLOQUEADA' : 'LOGIN_FALLIDO',
                ip_origen: ip,
                detalle:   debeBloquearse
                    ? `Cuenta bloqueada por 3 intentos fallidos: ${email}`
                    : `Contraseña incorrecta para ${email}. Intento ${nuevosIntentos}/3`,
                usuarioId: usuario.id_usuario
            });

            if (debeBloquearse) {
                return res.status(423).json({ 
                    mensaje: "Contraseña incorrecta. Has alcanzado el límite de intentos. Tu cuenta ha sido bloqueada." 
                });
            }

            return res.status(401).json({ 
                mensaje: `Contraseña incorrecta. Te quedan ${3 - nuevosIntentos} intentos antes de bloquear la cuenta.` 
            });
        }

        if (usuario.intentos_fallidos > 0) {
            await prisma.usuario.update({
                where: { id_usuario: usuario.id_usuario },
                data: { intentos_fallidos: 0 }
            });
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

        await registrarLog({
            accion:    'LOGIN_EXITOSO',
            ip_origen: ip,
            detalle:   `${usuario.nombres} (${usuario.rol}) inició sesión`,
            usuarioId: usuario.id_usuario
        });

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