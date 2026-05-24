import { Router } from 'express';
import * as especialidad from "../controllers/especialidad.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/",verificarToken, especialidad.getEspecialidades);
router.get("/:id", verificarToken, especialidad.getEspecialidadById);
router.post("/create",verificarToken, especialidad.createEspecialidad);
router.put("/update/:id", verificarToken, especialidad.updateEspecialidad);
router.delete("/delete/:id", verificarToken, especialidad.deleteEspecialidad);

export default router;