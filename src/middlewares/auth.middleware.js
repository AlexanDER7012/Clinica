import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    const token = authHeader && authHeader.split(' ')[1];

    if(!token){
        return res.status(401).json({ mensaje: "Acceso denegado. No hay token." });
    }

    try {
        const cifrado = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = cifrado;
        next();
    }catch (error){
        res.status(403).json({ mensaje: "Token inválido o expirado." });
    }
};