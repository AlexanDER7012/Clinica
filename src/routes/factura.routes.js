import { Router } from "express";
import * as facturaController from "../controllers/factura.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create", verificarToken, facturaController.emitirFactura);
router.get("/:id",     verificarToken, facturaController.getFacturaById);

export default router;
