const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

router.get('/', (req, res, next) => {
  req.params.group = 'nic';
  return resourceController.getResourceGroup(req, res, next);
});

router.get('/:id', (req, res, next) => {
  req.params.group = 'nic';
  return resourceController.getResourceById(req, res, next);
});

module.exports = router;

