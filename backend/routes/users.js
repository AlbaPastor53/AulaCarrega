const express = require('express');
const router = express.Router();
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserPenalties,
  deleteUser
} = require('../controllers/users');
const { protect, requireRole } = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');

// Totes les rutes d'usuaris són només per a administradors
router.use(protect, requireRole('Admin'));

router.get('/', listUsers);
router.post('/', createUser);
router.get('/:id', validateObjectId, getUser);
router.patch('/:id', validateObjectId, updateUser);
router.patch('/:id/status', validateObjectId, updateUserStatus);
router.patch('/:id/penalties', validateObjectId, updateUserPenalties);
router.delete('/:id', validateObjectId, deleteUser);

module.exports = router;
