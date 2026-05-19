import prisma from '../config/prisma.js';

// Generar o compilar un cierre estadístico mensual utilizando agregaciones de base de datos
const generarReporteMensual = async (req, res) => {
    const { mes, anio, sedeId, tipo_reporte } = req.body;

    try {
        if (!mes || !anio || !sedeId) {
            return res.status(400).json({ error: "Faltan parámetros obligatorios (mes, anio, sedeId)." });
        }

        // 1. Rango de fechas para segmentar las consultas en Postgres
        const fechaInicio = new Date(parseInt(anio), parseInt(mes) - 1, 1);
        const fechaFin = new Date(parseInt(anio), parseInt(mes), 0, 23, 59, 59);

        // 2. Extraer todas las citas completadas dentro de ese mes en la sede indicada (Petén o Antigua)
        const citasMes = await prisma.cita.findMany({
            where: {
                sedeId: parseInt(sedeId),
                fecha: { gte: fechaInicio, lte: fechaFin }
            },
            include: { doctor: true, factura: true }
        });

        // 3. Procesamiento y estructuración analítica de los datos
        const totalCitas = citasMes.length;
        const totalIngresos = citasMes.reduce((sum, c) => sum + Number(c.precio_consulta), 0);
        
        // Agrupar y contar citas por médico para ver la demanda laboral
        const rendimientoDoctores = {};
        citasMes.forEach(c => {
            const docName = c.doctor.nombres;
            rendimientoDoctores[docName] = (rendimientoDoctores[docName] || 0) + 1;
        });

        // Construir la estructura flexible que se salvará en el campo Json de Postgres
        const estructuraJsonDashboard = {
            resumen: {
                total_atenciones: totalCitas,
                ingreso_financiero_total: totalIngresos,
                moneda: "GTQ"
            },
            analisis_medicos: rendimientoDoctores,
            metadatos_servidor: {
                motor_db: "PostgreSQL",
                fecha_compilacion: new Date()
            }
        };

        // 4. Persistir el reporte final en la tabla de la base de datos
        const nuevoReporte = await prisma.reporteEstadistico.create({
            data: {
                tipo_reporte: tipo_reporte || "CIERRE_MENSUAL_FINANZAS",
                datos_json: estructuraJsonDashboard, // Prisma mapea el objeto directamente a la columna JSON
                mes_referencia: parseInt(mes),
                anio_referencia: parseInt(anio),
                sedeId: parseInt(sedeId)
            },
            include: { sede: true }
        });

        res.status(201).json({
            mensaje: "Métricas consolidadas y reporte JSON guardado con éxito.",
            reporte: nuevoReporte
        });

    } catch (error) {
        console.error("Error en generarReporteMensual:", error);
        res.status(500).json({ error: "Error analítico en el servidor: " + error.message });
    }
};

// Obtener el historial de reportes estadísticos para las gráficas del administrador
const getReportesBySede = async (req, res) => {
    try {
        const { sedeId } = req.query;
        const reportes = await prisma.reporteEstadistico.findMany({
            where: {
                ...(sedeId && { sedeId: parseInt(sedeId) })
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            total_reportes: reportes.length,
            reportes
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export {
    generarReporteMensual,
    getReportesBySede
};