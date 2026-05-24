import express from "express";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../public')));
const app = express();

import pacientes from "./routes/paciente.routes.js";
import doctores from "./routes/doctor.routes.js";
import sedes from "./routes/sede.routes.js";
import especialidades from "./routes/especialidad.routes.js";
import usuarios from "./routes/usuario.routes.js";
import citas from "./routes/cita.routes.js";
import auth from "./routes/auth.routes.js";
import facturas from "./routes/factura.routes.js"; 
import reportes from "./routes/reporte.routes.js";
import auditoria from "./routes/auditoria.routes.js";
import correo from "./routes/correo.routes.js";
import historial from "./routes/historial.routes.js";
import documentos from "./routes/documento.routes.js";
const configCors = {
    origin:"http://127.0.0.1:5500"
};
app.use(cors(configCors));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Api is working",
    });
});

app.use("/pacientes", pacientes);
app.use("/doctores", doctores);
app.use("/sedes", sedes);
app.use("/especialidades", especialidades);
app.use("/usuarios", usuarios);
app.use("/citas",citas);
app.use("/auth", auth);
app.use("/facturas", facturas);
app.use("/reportes", reportes);
app.use("/auditoria", auditoria);
app.use("/correo", correo);
app.use("/historial", historial);
app.use("/documentos", documentos);

export default app;