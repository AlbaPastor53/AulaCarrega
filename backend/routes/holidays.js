const express = require('express');
const router = express.Router();
const {
  listHolidays,
  getHoliday,
  createHoliday,
  updateHoliday,
  deleteHoliday
} = require('../controllers/holidays');
const { protect, requireRole } = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');

router.use(protect);

router.get('/', listHolidays);
router.get('/:id', validateObjectId, getHoliday);
router.post('/', requireRole('Admin'), createHoliday);
router.patch('/:id', requireRole('Admin'), validateObjectId, updateHoliday);
router.delete('/:id', requireRole('Admin'), validateObjectId, deleteHoliday);

module.exports = router;
