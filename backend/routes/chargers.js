const express = require('express');
const router = express.Router();
const {
  listChargers,
  getCharger,
  createCharger,
  updateCharger,
  deleteCharger
} = require('../controllers/chargers');
const { protect, requireRole } = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');

router.use(protect);

router.get('/', listChargers);
router.get('/:id', validateObjectId, getCharger);
router.post('/', requireRole('Admin'), createCharger);
router.patch('/:id', requireRole('Admin'), validateObjectId, updateCharger);
router.delete('/:id', requireRole('Admin'), validateObjectId, deleteCharger);

module.exports = router;
