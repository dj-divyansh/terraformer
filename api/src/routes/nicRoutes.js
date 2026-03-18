const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

router.get('/', (req, res, next) => {
  req.params.type = 'nic';
  return resourceController.getResourcesByType(req, res, next);
});

router.get('/:id', (req, res, next) => {
  req.params.type = 'nic';
  return resourceController.getResourceById(req, res, next);
});

module.exports = router;
