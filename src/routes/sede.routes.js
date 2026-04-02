import {Router} from "express";
import * as sedes from "../controllers/sede.controller.js";

const router = Router();

router.get("/", sedes.getSedes);          
router.get("/:id", sedes.getSedeById);  
router.post("/create", sedes.createSede);
router.put("/update/:id", sedes.updateSede);
router.delete("/delete/:id", sedes.deleteSede);

export default router;