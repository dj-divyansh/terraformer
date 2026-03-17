const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

router.get('/', (req, res, next) => {
  // Inject group param for controller reuse
  req.params.group = 'vm';
  return resourceController.getResourceGroup(req, res, next);
});

router.get('/:id', (req, res, next) => {
  req.params.group = 'vm';
  return resourceController.getResourceById(req, res, next);
});

module.exports = router;

