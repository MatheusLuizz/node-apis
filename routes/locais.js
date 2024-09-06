const express = require('express');
const router = express.Router();
const locaisController = require('../controllers/locaisController');

router.get('/', locaisController.getNearbyPlaces);

module.exports = router;
