import { Router } from "express";
import * as auditoriaController from "../controllers/auditoria.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verificarToken, auditoriaController.getLogs);

export default router;