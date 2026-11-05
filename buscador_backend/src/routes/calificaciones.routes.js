const express = require('express');
const controlador = require('../controllers/calificaciones.controller');

const router = express.Router();

router.get('/resumenes', controlador.resumenes);
router.get('/biblioteca', controlador.listarBiblioteca);
router.get('/biblioteca/:isbn', controlador.obtenerEntrada);
router.put('/biblioteca/:isbn', controlador.guardarEntrada);
router.delete('/biblioteca/:isbn', controlador.eliminarEntrada);
router.get('/resenas/:isbn', controlador.listarResenas);

module.exports = router;