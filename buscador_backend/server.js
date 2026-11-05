const express = require('express');
const cors = require('cors');
const librosRoutes = require('./src/routes/libros.routes');
const estadisticasRoutes = require('./src/routes/estadisticas.routes');
const calificacionesRoutes = require('./src/routes/calificaciones.routes');

const app = express();

app.use(cors());
app.use('/', librosRoutes);
app.use('/', estadisticasRoutes);
app.use(calificacionesRoutes);

const PUERTO = 3000;
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});