import { Router } from "express";
import * as doctor from "../controllers/doctor.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/",verificarToken, doctor.getDoctores);
router.get("/:id",verificarToken, doctor.getDoctorById);
router.post("/create/",verificarToken, doctor.createDoctor);
router.put("/update/:id", verificarToken, doctor.updateDoctor);
router.delete("/delete/:id", verificarToken, doctor.deleteDoctor);

export default router;