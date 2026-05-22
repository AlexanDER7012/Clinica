import prisma from '../config/prisma.js';
const getDashboardData = async (req, res) => {
    try {
        const { sedeId } = req.query;
        const filtroSede = sedeId ? {sedeId: parseInt(sedeId)} : {};

        const anioActual  = new Date().getFullYear();
        const inicioAnio  = new Date(anioActual, 0, 1);
        const finAnio     = new Date(anioActual, 11, 31, 23, 59, 59);

        const [
            totalFacturas,
            ingresosTotales,
            citasFinalizadas,
            todasLasCitas,
            citasPorMes,
            rankingDoctores,
            sedes
        ] = await Promise.all([

            prisma.factura.count({
                where: {
                    ...(sedeId && {
                        cita: { sedeId: parseInt(sedeId) }
                    })
                }
            }),

            prisma.factura.aggregate({
                _sum: { monto: true },
                where: {
                    ...(sedeId && {
                        cita: { sedeId: parseInt(sedeId) }
                    })
                }
            }),

            prisma.cita.count({
                where: { estado: 'FINALIZADA', ...filtroSede }
            }),

            prisma.cita.count({
                where: { ...filtroSede }
            }),

            prisma.cita.findMany({
                where: {
                    fecha: { gte: inicioAnio, lte: finAnio },
                    ...filtroSede
                },
                select: { fecha: true, estado: true }
            }),

            prisma.cita.groupBy({
                by: ['doctorId'],
                where: { estado: 'FINALIZADA', ...filtroSede },
                _count: { doctorId: true },
                orderBy: { _count: { doctorId: 'desc' } },
                take: 5
            }),

            prisma.sede.findMany({
                where: { estado: true },
                select: { id_sede: true, nombre: true }
            })
        ]);

        const meses = Array(12).fill(0);
        citasPorMes.forEach(c => {
            const mes = new Date(c.fecha).getMonth(); // 0-11
            meses[mes]++;
        });

        const doctorIds = rankingDoctores.map(r => r.doctorId);
        const doctores  = await prisma.doctor.findMany({
            where: { id_doctor: { in: doctorIds } },
            select: { id_doctor: true, nombres: true }
        });

        const ranking = rankingDoctores.map((r, i) => {
            const doc = doctores.find(d => d.id_doctor === r.doctorId);
            return {
                posicion:  i + 1,
                nombre:    doc?.nombres || `Doctor #${r.doctorId}`,
                consultas: r._count.doctorId,
                top:       i < 3
            };
        });
        const citasProductivas = await prisma.cita.count({
            where: {
                estado: { in: ['CONFIRMADA', 'FINALIZADA'] },
                ...filtroSede
            }
        });
        const eficiencia = todasLasCitas > 0
            ? Math.round((citasProductivas / todasLasCitas) * 100)
            : 0;

        res.json({
            tarjetas: {
                ingresos_totales: parseFloat(ingresosTotales._sum.monto || 0).toFixed(2),
                total_consultas:  citasFinalizadas,
                total_pagos:      totalFacturas,
                eficiencia:       eficiencia
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

const generarReporteMensual = async (req, res) => {
    const { mes, anio, sedeId, tipo_reporte } = req.body;
    try {
        if (!mes || !anio || !sedeId) {
            return res.status(400).json({ error: "Faltan parámetros obligatorios (mes, anio, sedeId)." });
        }
        const fechaInicio = new Date(parseInt(anio), parseInt(mes) - 1, 1);
        const fechaFin    = new Date(parseInt(anio), parseInt(mes), 0, 23, 59, 59);

        const citasMes = await prisma.cita.findMany({
            where: { sedeId: parseInt(sedeId), fecha: { gte: fechaInicio, lte: fechaFin } },
            include: { doctor: true, factura: true }
        });

        const totalCitas    = citasMes.length;
        const totalIngresos = citasMes.reduce((sum, c) => sum + Number(c.precio_consulta), 0);
        const rendimientoDoctores = {};
        citasMes.forEach(c => {
            const docName = c.doctor.nombres;
            rendimientoDoctores[docName] = (rendimientoDoctores[docName] || 0) + 1;
        });

        const estructuraJsonDashboard = {
            resumen: { total_atenciones: totalCitas, ingreso_financiero_total: totalIngresos, moneda: "GTQ" },
            analisis_medicos: rendimientoDoctores,
            metadatos_servidor: { motor_db: "PostgreSQL", fecha_compilacion: new Date() }
        };

        const nuevoReporte = await prisma.reporteEstadistico.create({
            data: {
                tipo_reporte:    tipo_reporte || "CIERRE_MENSUAL_FINANZAS",
                datos_json:      estructuraJsonDashboard,
                mes_referencia:  parseInt(mes),
                anio_referencia: parseInt(anio),
                sedeId:          parseInt(sedeId)
            },
            include: { sede: true }
        });

        res.status(201).json({ mensaje: "Métricas consolidadas y reporte JSON guardado con éxito.", reporte: nuevoReporte });
    } catch (error) {
        console.error("Error en generarReporteMensual:", error);
        res.status(500).json({ error: "Error analítico en el servidor: " + error.message });
    }
};

const getReportesBySede = async (req, res) => {
    try {
        const { sedeId } = req.query;
        const reportes = await prisma.reporteEstadistico.findMany({
            where: { ...(sedeId && { sedeId: parseInt(sedeId) }) },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ total_reportes: reportes.length, reportes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export { getDashboardData, generarReporteMensual, getReportesBySede };