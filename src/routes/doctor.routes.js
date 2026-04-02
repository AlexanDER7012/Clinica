import {Router} from "express";
import * as doctor from "../controllers/doctor.controller.js";

const router = Router();

router.get("/", doctor.getDoctores);
router.get("/:id", doctor.getDoctorById);
router.post("/create/", doctor.createDoctor);
router.put("/update/:id", doctor.updateDoctor);
router.delete("/delete/:id", doctor.deleteDoctor);

export default router;