import prisma from '../config/prisma.js';

const getLogs = async (req, res) => {
    try{
        const { accion, usuarioId, limit = 100 } = req.query;

        const logs = await prisma.logAuditoria.findMany({
            where: {
                ...(accion && { accion: { contains: accion } }),
                ...(usuarioId && { usuarioId:  parseInt(usuarioId) }),
            },
            include: {
                usuario: { select: { nombres: true, email: true, rol: true } }
            },
            orderBy: { fecha_hora: 'desc' },
            take:parseInt(limit)
        });

        res.json({ total: logs.length, logs });
    }catch(error){
        res.status(500).json({ error: error.message });
    }
};

export { getLogs };