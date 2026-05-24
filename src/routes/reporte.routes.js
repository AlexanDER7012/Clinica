import { Router } from "express";
import * as reporteController from "../controllers/reporte.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/stats", verificarToken, reporteController.getDashboardData);
router.post("/generar", verificarToken, reporteController.generarReporteMensual);
router.get("/historial", verificarToken, reporteController.getReportesBySede);

export default router;