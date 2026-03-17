const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

// GET /api/v1/resources
router.get('/', resourceController.getAllResources);

// GET /api/v1/resources/:group (e.g., vm, disk)
router.get('/:group', resourceController.getResourceGroup);

// GET /api/v1/resources/:group/:id
router.get('/:group/:id', resourceController.getResourceById);

module.exports = router;
