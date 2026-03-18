const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

// GET /api/v1/resources
router.get('/', resourceController.getAllResources);

// GET /api/v1/resources/:type (e.g., vm, disk)
router.get('/:type', resourceController.getResourcesByType);

// GET /api/v1/resources/:type/:id
router.get('/:type/:id', resourceController.getResourceById);

module.exports = router;
