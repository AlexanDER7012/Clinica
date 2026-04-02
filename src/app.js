import express from "express";
import cors from "cors";
const app = express();
import pacientes from "./routes/paciente.routes.js";

const configCors = {
    origin:"http://localhost:8081"
};
app.use(cors(configCors));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Api is working",
    });
});

app.use("/pacientes", pacientes);

export default app;