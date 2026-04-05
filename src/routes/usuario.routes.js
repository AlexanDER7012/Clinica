import { Router } from "express";
import * as userController from "../controllers/usuario.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
const router = Router();
router.use(verificarToken);
router.get("/", userController.getUsuarios);
router.get("/:id", userController.getUsuarioById);
router.post("/create", userController.createUsuario);
router.put("/update/:id", userController.updateUsuario);
router.delete("/delete/:id", userController.deleteUsuario);

export default router;