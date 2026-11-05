const express = require('express');
const cors = require('cors');
const librosRoutes = require('./src/routes/libros.routes');
const estadisticasRoutes = require('./src/routes/estadisticas.routes');

const app = express();

app.use(cors());
app.use('/', librosRoutes);
app.use('/', estadisticasRoutes);

const PUERTO = 3000;
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});