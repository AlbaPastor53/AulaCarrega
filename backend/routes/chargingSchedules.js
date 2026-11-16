const express = require('express');
const router = express.Router();
const {
  listSchedules,
  listMySchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  connectSchedule,
  disconnectSchedule,
  cancelSchedule,
  deleteSchedule,
  generateWeek
} = require('../controllers/chargingSchedules');
const { protect, requireRole } = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');

router.use(protect);

router.get('/me', listMySchedules);
router.get('/', requireRole('Admin'), listSchedules);
router.post('/generate-week', requireRole('Admin'), generateWeek);
router.get('/:id', validateObjectId, getSchedule);
router.post('/', requireRole('Admin'), createSchedule);
router.patch('/:id', requireRole('Admin'), validateObjectId, updateSchedule);
router.post('/:id/connect', validateObjectId, connectSchedule);
router.post('/:id/disconnect', validateObjectId, disconnectSchedule);
router.post('/:id/cancel', requireRole('Admin'), validateObjectId, cancelSchedule);
router.delete('/:id', requireRole('Admin'), validateObjectId, deleteSchedule);

module.exports = router;
