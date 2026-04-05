import { Router } from "express";
import * as citas from "../controllers/cita.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
const router = Router();

router.use(verificarToken);
router.get("/", citas.getCitas);
router.get("/:id", citas.getCitaById);
router.post("/create", citas.createCita);
router.put("/update/:id", citas.updateCita);
router.delete("/delete/:id", citas.deleteCita);

export default router;