import { Router } from "express";
import * as citas from "../controllers/cita.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
const router = Router();


router.get("/",verificarToken, citas.getCitas);
router.get("/:id",citas.getCitaById);
router.post("/registrar-completo",citas.registrarCitaCompleta); 
router.post("/create",verificarToken, citas.createCita);
router.put("/update/:id", verificarToken, citas.updateCita);
router.delete("/delete/:id",verificarToken, citas.deleteCita);
router.patch("/update-receta/:id",verificarToken, citas.updateRecetaCita);

export default router;