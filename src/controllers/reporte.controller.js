import prisma from '../config/prisma.js';
import { registrarLog, getIp } from '../helpers/auditoria.helper.js';
const getDashboardData = async (req, res) => {
    try {
        const { sedeId } = req.query;
        const filtroSede = sedeId ? { sedeId: parseInt(sedeId) } : {};
        const anioActual = new Date().getFullYear();
        const inicioAnio = new Date(anioActual, 0, 1);
        const finAnio    = new Date(anioActual, 11, 31, 23, 59, 59);

        const [
            totalFacturas, ingresosTotales, citasFinalizadas,
            todasLasCitas, citasPorMes, rankingDoctores, sedes
        ] = await Promise.all([
            prisma.factura.count({ where: { ...(sedeId && { cita: { sedeId: parseInt(sedeId) } }) } }),
            prisma.factura.aggregate({ _sum: { monto: true }, where: { ...(sedeId && { cita: { sedeId: parseInt(sedeId) } }) } }),
            prisma.cita.count({ where: { estado: 'FINALIZADA', ...filtroSede } }),
            prisma.cita.count({ where: { ...filtroSede } }),
            prisma.cita.findMany({ where: { fecha: { gte: inicioAnio, lte: finAnio }, ...filtroSede }, select: { fecha: true, estado: true } }),
            prisma.cita.groupBy({ by: ['doctorId'], where: { estado: 'FINALIZADA', ...filtroSede }, _count: { doctorId: true }, orderBy: { _count: { doctorId: 'desc' } }, take: 5 }),
            prisma.sede.findMany({ where: { estado: true }, select: { id_sede: true, nombre: true } })
        ]);

        const meses = Array(12).fill(0);
        citasPorMes.forEach(c => { meses[new Date(c.fecha).getMonth()]++; });

        const doctorIds = rankingDoctores.map(r => r.doctorId);
        const doctores  = await prisma.doctor.findMany({ where: { id_doctor: { in: doctorIds } }, select: { id_doctor: true, nombres: true } });

        const ranking = rankingDoctores.map((r, i) => ({
            posicion:  i + 1,
            nombre:    doctores.find(d => d.id_doctor === r.doctorId)?.nombres || `Doctor #${r.doctorId}`,
            consultas: r._count.doctorId,
            top:       i < 3
        }));

        const citasProductivas = await prisma.cita.count({ where: { estado: { in: ['CONFIRMADA', 'FINALIZADA'] }, ...filtroSede } });
        const eficiencia = todasLasCitas > 0 ? Math.round((citasProductivas / todasLasCitas) * 100) : 0;

        res.json({
            tarjetas: {
                ingresos_totales: parseFloat(ingresosTotales._sum.monto || 0).toFixed(2),
                total_consultas:  citasFinalizadas,
                total_pagos:      totalFacturas,
                eficiencia
            },
            grafica_mensual: {
                labels: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
                datos:  meses,
                anio:   anioActual
            },
            ranking,
            sedes,
            filtro_sede: sedeId ? parseInt(sedeId) : null
        });

    } catch (error) {
        console.error('Error en getDashboardData:', error);
        res.status(500).json({ error: error.message });
    }
};

// ── NUEVO: Generar reporte 5.1 + 5.2 con anonimización ───────
const generarReporteMensual = async (req, res) => {
    const { mes, anio, sedeId, tipo_reporte } = req.body;

    try {
        if (!mes || !anio || !sedeId) {
            return res.status(400).json({ error: "Faltan parámetros obligatorios (mes, anio, sedeId)." });
        }

        const fechaInicio = new Date(parseInt(anio), parseInt(mes) - 1, 1);
        const fechaFin    = new Date(parseInt(anio), parseInt(mes), 0, 23, 59, 59);

        const citasMes = await prisma.cita.findMany({
            where: {
                sedeId: parseInt(sedeId),
                fecha:  { gte: fechaInicio, lte: fechaFin }
            },
            include: { doctor: true, factura: true, paciente: true }
        });

        const totalCitas    = citasMes.length;
        const totalIngresos = citasMes.reduce((sum, c) => sum + Number(c.precio_consulta), 0);

        // ── 5.2 Productividad por médico (nombres reales de doctores OK) ──
        const productividadDoctores = {};
        citasMes.forEach(c => {
            const doc = c.doctor.nombres;
            if (!productividadDoctores[doc]) {
                productividadDoctores[doc] = { total: 0, finalizadas: 0, canceladas: 0, pendientes: 0 };
            }
            productividadDoctores[doc].total++;
            if (c.estado === 'FINALIZADA')  productividadDoctores[doc].finalizadas++;
            if (c.estado === 'CANCELADA')   productividadDoctores[doc].canceladas++;
            if (c.estado === 'PENDIENTE')   productividadDoctores[doc].pendientes++;
        });

        // Calcular % efectividad por médico
        Object.keys(productividadDoctores).forEach(doc => {
            const d = productividadDoctores[doc];
            d.efectividad_pct = d.total > 0 ? Math.round((d.finalizadas / d.total) * 100) : 0;
        });

        // ── 5.1 Morbilidad — motivos más frecuentes (ANONIMIZADO) ────────
        // Solo contamos motivos, sin datos del paciente
        const morbilidad = {};
        citasMes.forEach(c => {
            const motivo = c.motivo?.toLowerCase().trim() || 'sin especificar';
            morbilidad[motivo] = (morbilidad[motivo] || 0) + 1;
        });

        // Top 10 motivos ordenados
        const top10Motivos = Object.entries(morbilidad)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([motivo, count]) => ({ motivo, count }));

        // ── Datos anonimizados — SIN nombres de pacientes ────────────────
        const estructuraJson = {
            resumen: {
                mes_referencia:         parseInt(mes),
                anio_referencia:        parseInt(anio),
                total_atenciones:       totalCitas,
                ingreso_financiero:     totalIngresos,
                moneda:                 "GTQ",
                tasa_finalizacion_pct:  totalCitas > 0
                    ? Math.round((citasMes.filter(c => c.estado === 'FINALIZADA').length / totalCitas) * 100)
                    : 0
            },
            // 5.1 — Solo motivos, sin identificar pacientes
            morbilidad_anonimizada: top10Motivos,

            // 5.2 — Productividad por médico
            productividad_medicos: productividadDoctores,

            metadatos: {
                motor_db:          "PostgreSQL (Neon)",
                fecha_compilacion: new Date(),
                anonimizado:       true,
                nota_privacidad:   "Datos de pacientes anonimizados conforme a leyes de privacidad médica."
            }
        };

        const nuevoReporte = await prisma.reporteEstadistico.create({
            data: {
                tipo_reporte:    tipo_reporte || "CIERRE_MENSUAL",
                datos_json:      estructuraJson,
                mes_referencia:  parseInt(mes),
                anio_referencia: parseInt(anio),
                sedeId:          parseInt(sedeId)
            },
            include: { sede: true }
        });

        await registrarLog({
            accion:         'GENERAR_REPORTE',
            tabla_afectada: 'ReporteEstadistico',
            ip_origen:      getIp(req),
            detalle:        `Reporte mensual ${mes}/${anio} generado para sede #${sedeId} — ${totalCitas} citas`,
            usuarioId:      req.usuario?.id || null
        });

        res.status(201).json({
            mensaje: "Reporte estadístico generado y guardado exitosamente.",
            reporte: nuevoReporte
        });

    } catch (error) {
        console.error("Error en generarReporteMensual:", error);
        res.status(500).json({ error: "Error en el servidor: " + error.message });
    }
};

// ── Obtener historial de reportes ─────────────────────────────
const getReportesBySede = async (req, res) => {
    try {
        const { sedeId } = req.query;
        const reportes = await prisma.reporteEstadistico.findMany({
            where:   { ...(sedeId && { sedeId: parseInt(sedeId) }) },
            include: { sede: { select: { nombre: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ total_reportes: reportes.length, reportes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export { getDashboardData, generarReporteMensual, getReportesBySede };