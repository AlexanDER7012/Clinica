import { Router } from "express";
import * as reporteController from "../controllers/reporte.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/stats",     verificarToken, reporteController.getDashboardData);  
router.post("/generar",  reporteController.generarReporteMensual);
router.get("/dashboard", reporteController.getReportesBySede);

export default router;