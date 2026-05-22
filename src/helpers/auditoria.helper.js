import prisma from '../config/prisma.js';

/**
 * registrarLog — Guarda una entrada en LogAuditoria
 * @param {object} opciones
 * @param {string}  opciones.accion          
 * @param {string}  [opciones.tabla_afectada]
 * @param {string}  [opciones.ip_origen]
 * @param {string}  [opciones.detalle] 
 * @param {number}  [opciones.usuarioId]
 */
export async function registrarLog({ accion, tabla_afectada, ip_origen, detalle, usuarioId }) {
  try {
    await prisma.logAuditoria.create({
      data: {
        accion,
        tabla_afectada: tabla_afectada || null,
        ip_origen:      ip_origen      || null,
        detalle:        detalle        || null,
        usuarioId:      usuarioId      || null,
      }
    });
  } catch (error) {
    console.error('[Auditoría] Error al registrar log:', error.message);
  }
}
export function getIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'IP desconocida'
  );
}