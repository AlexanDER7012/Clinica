import { Router } from "express";
import * as pacientes from "../controllers/paciente.controller.js";

const router = Router();

router.get("/", pacientes.getPacientes);
router.get("/:id", pacientes.getPacienteById);
router.post("/create/", pacientes.createPaciente);
router.put("/update/:id", pacientes.updatePaciente);
router.delete("/delete/:id", pacientes.deletePaciente);

export default router;