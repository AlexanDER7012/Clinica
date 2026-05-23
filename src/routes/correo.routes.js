import { Router } from "express";
import * as correoController from "../controllers/correo.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/cita/:id", verificarToken, correoController.enviarCorreo);
router.post("/cita-publica/:id",correoController.enviarCorreo);

export default router;