import { Router } from "express";
import * as documentoController from "../controllers/documento.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { upload } from "../config/cloudinary.config.js";

const router = Router();

router.get("/:id",           verificarToken, documentoController.getDocumentosPaciente);
router.post("/:id",          verificarToken, upload.single('archivo'), documentoController.subirDocumento);
router.delete("/:id/:docId", verificarToken, documentoController.eliminarDocumento);
router.get("/url/:docId",    verificarToken, documentoController.getUrlDescarga);

export default router;