import { Router } from "express";
import * as userController from "../controllers/usuario.controller.js";

const router = Router();

router.get("/", userController.getUsuarios);
router.get("/:id", userController.getUsuarioById);
router.post("/create", userController.createUsuario);
router.put("/update/:id", userController.updateUsuario);
router.delete("/delete/:id", userController.deleteUsuario);

export default router;