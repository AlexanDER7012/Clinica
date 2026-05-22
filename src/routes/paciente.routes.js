import { Router } from "express";
import * as pacientes from "../controllers/paciente.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
const router = Router();

router.get("/", verificarToken, pacientes.getPacientes);
router.get("/buscar", verificarToken, pacientes.buscarPaciente); 
router.get("/dpi/:dpi", pacientes.getPacienteByDpi);
router.get("/:id", pacientes.getPacienteById);
router.post("/create/", pacientes.createPaciente);
router.put("/update/:id", pacientes.updatePaciente);
router.delete("/delete/:id", pacientes.deletePaciente);


export default router;