import express from "express";
import cors from "cors";
const app = express();

import pacientes from "./routes/paciente.routes.js";
import doctores from "./routes/doctor.routes.js";
import sedes from "./routes/sede.routes.js";
import especialidades from "./routes/especialidad.routes.js";
import usuarios from "./routes/usuario.routes.js";
import citas from "./routes/cita.routes.js";
import auth from "./routes/auth.routes.js";
const configCors = {
    origin:"http://localhost:3000"
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

export default app;