const express = require('express');
const router = express.Router();
const {
  listHistory,
  listMyHistory,
  getHistory,
  createHistory,
  updateHistory,
  deleteHistory
} = require('../controllers/chargingHistory');
const { protect, requireRole } = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');

router.use(protect);

router.get('/me', listMyHistory);
router.get('/', requireRole('Admin'), listHistory);
router.get('/:id', validateObjectId, getHistory);
router.post('/', requireRole('Admin'), createHistory);
router.patch('/:id', requireRole('Admin'), validateObjectId, updateHistory);
router.delete('/:id', requireRole('Admin'), validateObjectId, deleteHistory);

module.exports = router;
