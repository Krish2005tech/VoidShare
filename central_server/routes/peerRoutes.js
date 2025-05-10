const express = require('express');
const { getAllOnlineUsers, sendPeerRequest } = require('../controllers/peerController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/allOnline',protect,  getAllOnlineUsers);
router.post('/request/:id',protect, sendPeerRequest);

module.exports = router;
