import prisma from '../config/prisma.js';
import { cloudinary } from '../config/cloudinary.config.js';
import { registrarLog, getIp } from '../helpers/auditoria.helper.js';

// ── Subir documento ───────────────────────────────────────────
const subirDocumento = async (req, res) => {
    try {
        const { id }   = req.params;
        const { tipo } = req.body;

        if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });

        console.log('FILE:', req.file);

        const paciente = await prisma.paciente.findUnique({ where: { id_paciente: parseInt(id) } });
        if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado.' });

        const documento = await prisma.documento.create({
            data: {
                nombre:     req.file.originalname,
                tipo:       tipo || 'OTRO',
                url:        req.file.path,
                public_id:  req.file.filename,
                pacienteId: parseInt(id)
            }
        });

        await registrarLog({
            accion:         'SUBIR_DOCUMENTO',
            tabla_afectada: 'Documento',
            ip_origen:      getIp(req),
            detalle:        `Documento "${req.file.originalname}" subido para paciente #${id}`,
            usuarioId:      req.usuario?.id || null
        });

        res.status(201).json({ mensaje: 'Documento subido exitosamente.', documento });

    } catch (error) {
        console.error('Error subirDocumento:', error);
        res.status(500).json({ error: error.message });
    }
};

// ── Obtener documentos ────────────────────────────────────────
const getDocumentosPaciente = async (req, res) => {
    try {
        const { id } = req.params;
        const documentos = await prisma.documento.findMany({
            where:   { pacienteId: parseInt(id) },
            orderBy: { createdAt: 'desc' }
        });
        res.json(documentos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── Eliminar documento ────────────────────────────────────────
const eliminarDocumento = async (req, res) => {
    try {
        const { id, docId } = req.params;

        const documento = await prisma.documento.findUnique({
            where: { id_documento: parseInt(docId) }
        });
        if (!documento) return res.status(404).json({ error: 'Documento no encontrado.' });

        const isPdf = documento.nombre.toLowerCase().endsWith('.pdf');
        try {
            await cloudinary.uploader.destroy(documento.public_id, {
                resource_type: isPdf ? 'raw' : 'image'
            });
        } catch (e) {
            console.warn('No se pudo eliminar de Cloudinary:', e.message);
        }

        await prisma.documento.delete({ where: { id_documento: parseInt(docId) } });

        await registrarLog({
            accion:         'ELIMINAR_DOCUMENTO',
            tabla_afectada: 'Documento',
            ip_origen:      getIp(req),
            detalle:        `Documento "${documento.nombre}" eliminado del paciente #${id}`,
            usuarioId:      req.usuario?.id || null
        });

        res.json({ message: 'Documento eliminado correctamente.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── URL directa ───────────────────────────────────────────────
const getUrlDescarga = async (req, res) => {
    try {
        const { docId } = req.params;
        const documento = await prisma.documento.findUnique({
            where: { id_documento: parseInt(docId) }
        });
        if (!documento) return res.status(404).json({ error: 'Documento no encontrado.' });
        res.json({ url: documento.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export { subirDocumento, getDocumentosPaciente, eliminarDocumento, getUrlDescarga };