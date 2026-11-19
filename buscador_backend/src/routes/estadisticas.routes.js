const express = require('express');
const router = express.Router();
const estadisticasController = require('../controllers/estadisticas.controller');
const { requierePerfil } = require('../middleware/sesion');

router.get('/estadisticas', estadisticasController.obtener);
router.get('/estadisticas-perfiles', requierePerfil, estadisticasController.obtenerDePerfiles);

module.exports = router;
