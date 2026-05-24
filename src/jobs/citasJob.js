/* ══════════════════════════════════════
   src/jobs/citasJob.js
   Cancelación automática de citas vencidas
   Con retry para conexiones Neon dormidas
══════════════════════════════════════ */

import prisma from '../config/prisma.js';

const GRACIA_MINUTOS = 20;
const RETRY_INTENTOS = 3;
const RETRY_DELAY_MS = 3000; // 3 segundos entre reintentos

async function cancelarCitasVencidas() {
    const ahora         = new Date();
    const limiteGracia  = new Date(ahora.getTime() - GRACIA_MINUTOS * 60 * 1000);

    for (let intento = 1; intento <= RETRY_INTENTOS; intento++) {
        try {
            const resultado = await prisma.cita.updateMany({
                where: {
                    estado: 'PENDIENTE',
                    fecha:  { lt: limiteGracia }
                },
                data: { estado: 'CANCELADA' }
            });

            if (resultado.count > 0) {
                console.log(`[Job Citas] ${resultado.count} cita(s) cancelada(s) — no confirmadas tras ${GRACIA_MINUTOS} min de gracia.`);
            }
            return; // éxito, salir del retry

        } catch (error) {
            const esErrorConexion = error.message?.includes("Can't reach database") ||
                                    error.message?.includes("connection") ||
                                    error.code === 'P1001';

            if (esErrorConexion && intento < RETRY_INTENTOS) {
                console.warn(`[Job Citas] Intento ${intento}/${RETRY_INTENTOS} fallido — reintentando en ${RETRY_DELAY_MS/1000}s...`);
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
            } else {
                // Solo loguear si no es error de conexión temporal
                if (!esErrorConexion) {
                    console.error('[Job Citas] Error inesperado:', error.message);
                }
                // Si es conexión y ya agotamos reintentos, ignorar silenciosamente
                // Neon se reconectará en el siguiente ciclo
            }
        }
    }
}

export { cancelarCitasVencidas };

export function iniciarJobCitas() {
    // Ejecutar cada 5 minutos
    setInterval(cancelarCitasVencidas, 5 * 60 * 1000);
    console.log('[Job Citas] Job iniciado — revisión cada 5 minutos.');
}