const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

router.get('/', (req, res, next) => {
  req.params.group = 'disk';
  return resourceController.getResourceGroup(req, res, next);
});

router.get('/:id', (req, res, next) => {
  req.params.group = 'disk';
  return resourceController.getResourceById(req, res, next);
});

module.exports = router;

