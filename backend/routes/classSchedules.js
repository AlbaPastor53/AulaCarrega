const express = require('express');
const router = express.Router();
const {
  getMySchedule,
  saveMySchedule,
  getUserSchedule,
  saveUserSchedule,
  deleteUserSchedule
} = require('../controllers/classSchedules');
const { protect, requireRole } = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');

router.use(protect);

// Rutes del propi usuari
router.get('/me', getMySchedule);
router.put('/me', saveMySchedule);

// Rutes d'administrador
router.get('/:userId', requireRole('Admin'), validateObjectId, getUserSchedule);
router.put('/:userId', requireRole('Admin'), validateObjectId, saveUserSchedule);
router.delete('/:userId', requireRole('Admin'), validateObjectId, deleteUserSchedule);

module.exports = router;
