const express = require('express');
const controlador = require('../controllers/recomendaciones.controller');
const { requierePerfil } = require('../middleware/sesion');

const router = express.Router();

router.get('/para-ti', requierePerfil, controlador.paraTi);
router.get('/arbol', controlador.verArbol);

module.exports = router;
