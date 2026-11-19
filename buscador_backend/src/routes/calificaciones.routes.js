const express = require('express');
const controlador = require('../controllers/calificaciones.controller');
const { requiereSesion, requierePerfil } = require('../middleware/sesion');

const router = express.Router();

router.get('/resumenes', requiereSesion, controlador.resumenes);
router.get('/biblioteca', requierePerfil, controlador.listarBiblioteca);
router.get('/biblioteca/:isbn', requierePerfil, controlador.obtenerEntrada);
router.put('/biblioteca/:isbn', requierePerfil, controlador.guardarEntrada);
router.delete('/biblioteca/:isbn', requierePerfil, controlador.eliminarEntrada);
router.get('/resenas/:isbn', requierePerfil, controlador.listarResenas);

module.exports = router;
