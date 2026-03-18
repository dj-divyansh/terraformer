const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

router.get('/', (req, res, next) => {
  // Inject type param for controller reuse
  req.params.type = 'vm';
  return resourceController.getResourcesByType(req, res, next);
});

router.get('/:id', (req, res, next) => {
  req.params.type = 'vm';
  return resourceController.getResourceById(req, res, next);
});

module.exports = router;
