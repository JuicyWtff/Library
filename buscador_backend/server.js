const express = require('express');
const cors = require('cors');
const librosRoutes = require('./src/routes/libros.routes');

const app = express();

app.use(cors());
app.use('/', librosRoutes);

const PUERTO = 3000;
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});