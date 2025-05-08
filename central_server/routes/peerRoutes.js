const express = require('express');
const { getAllOnlineUsers, sendPeerRequest } = require('../controllers/peerController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/allOnline',  getAllOnlineUsers);
router.post('/request/:id', sendPeerRequest);

module.exports = router;
