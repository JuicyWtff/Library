const express = require('express');
const controlador = require('../controllers/explorar.controller');

const router = express.Router();

router.get('/explorar', controlador.explorar);

module.exports = router;