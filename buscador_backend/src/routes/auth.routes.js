const express = require('express');
const controlador = require('../controllers/auth.controller');
const { requiereSesion, requierePerfil } = require('../middleware/sesion');

const router = express.Router();

router.post('/auth/registro', controlador.registro);
router.post('/auth/login', controlador.login);
router.post('/auth/logout', controlador.logout);
router.post('/auth/salir-perfil', requiereSesion, controlador.salirDePerfil);
router.get('/auth/yo', requiereSesion, controlador.yo);

router.get('/perfiles', requiereSesion, controlador.listarPerfiles);
router.post('/perfiles', requierePerfil, controlador.crearPerfil);
router.put('/perfiles/:id', requierePerfil, controlador.actualizarPerfil);
router.delete('/perfiles/:id', requierePerfil, controlador.eliminarPerfil);
router.post('/perfiles/:id/entrar', requiereSesion, controlador.entrarAPerfil);

module.exports = router;
