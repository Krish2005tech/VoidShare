const express = require('express');
const { registerUser, loginUser, getUserProfile,logoutUser } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', getUserProfile);
router.post('/logout', logoutUser);
// router.get('/profile/:username', getUserProfile); // Added route to get user profile by username

module.exports = router;
