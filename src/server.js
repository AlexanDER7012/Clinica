import "dotenv/config";
import app from './app.js';
import { cancelarCitasVencidas } from './jobs/citasJob.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log(`Servidor corriendo en puerto ${PORT}`);


cancelarCitasVencidas();


  setInterval(cancelarCitasVencidas, 5 * 60 * 1000);
});
