const express = require('express');
const controlador = require('../controllers/recomendaciones.controller');

const router = express.Router();

router.get('/para-ti', controlador.paraTi);
router.get('/arbol', controlador.verArbol);

module.exports = router;