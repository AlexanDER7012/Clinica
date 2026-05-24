import { Router } from "express";
import * as historialController from "../controllers/historial.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:id", verificarToken, historialController.getHistorialPaciente);
router.put("/:id/alergias", verificarToken, historialController.updateAlergias);

export default router;