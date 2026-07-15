const express = require('express');
const {
  getUsers,
  createUser,
  updateUser,
  toggleUserActive,
  deleteUser
} = require('../controllers/userController');
const requireAuth = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/toggle', toggleUserActive);
router.delete('/:id', deleteUser);

module.exports = router;