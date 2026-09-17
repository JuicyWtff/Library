const express = require('express');
const router = express.Router();
const librosController = require('../controllers/libros.controller');

router.get('/buscar', librosController.buscar);
router.get('/categoria', librosController.buscarPorCategoria);

module.exports = router;