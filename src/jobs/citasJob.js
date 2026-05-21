import prisma from '../config/prisma.js';

const MINUTOS_GRACIA = 20;

export async function cancelarCitasVencidas(){
try{
    const ahora = new Date();

    const umbral = new Date(ahora.getTime() - MINUTOS_GRACIA*60* 1000);

    const resultado = await prisma.cita.updateMany({
    where: {
        estado: 'PENDIENTE',
        fecha: { lt: umbral }
    },
    data: { estado: 'CANCELADA' }
    });

    if (resultado.count > 0) {
    console.log(`[Job Citas] ${resultado.count} cita(s) cancelada(s) — no confirmadas tras ${MINUTOS_GRACIA} min de gracia.`);
    }

} catch(error){
    console.error('[Job Citas] Error:', error.message);
}
}