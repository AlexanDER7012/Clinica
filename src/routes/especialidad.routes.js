import {Router} from 'express';
import * as especialidad from "../controllers/especialidad.controller.js";

const router = Router();

router.get("/", especialidad.getEspecialidades);
router.get("/:id", especialidad.getEspecialidadById);
router.post("/create", especialidad.createEspecialidad);
router.put("/update/:id", especialidad.updateEspecialidad);
router.delete("/delete/:id", especialidad.deleteEspecialidad);

export default router;