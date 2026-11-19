const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const librosRoutes = require('./src/routes/libros.routes');
const estadisticasRoutes = require('./src/routes/estadisticas.routes');
const calificacionesRoutes = require('./src/routes/calificaciones.routes');
const explorarRoutes = require('./src/routes/explorar.routes')
const authRoutes = require('./src/routes/auth.routes');
const recomendacionesRoutes = require('./src/routes/recomendaciones.routes');

const ORIGEN_FRONTEND = 'http://localhost:5173';

const app = express();

app.use(cors({ origin: ORIGEN_FRONTEND, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use('/', librosRoutes);
app.use('/', estadisticasRoutes);
app.use(calificacionesRoutes);
app.use(explorarRoutes);
app.use(authRoutes);
app.use(recomendacionesRoutes);

const PUERTO = 3000;
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
