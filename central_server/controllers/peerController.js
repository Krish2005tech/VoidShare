const User = require('../models/Users.js');
const redisClient = require('../config/redis.js');

// Utility function to reset user timeout using username
const resetUserTimeout = async (username) => {
    await redisClient.expire(`online:${username}`, 2700); // Reset expiry to 45 minutes
};

exports.getAllOnlineUsers = async (req, res) => {
    try {
       
        // const onlineUsers = {usernames:["krish","sahil"]};
        const keys = await redisClient.keys('online:*');
        const onlineUsers = keys.map(key => key.replace('online:', '')); // Extracting usernames

        if (req.user && req.user.username) {
            await resetUserTimeout(req.user.username); // Reset timeout for requesting user
        }



        res.status(200).json({users:onlineUsers});
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve online users' });
    }
};

exports.sendPeerRequest = async (req, res) => {
    try {
        const { id } = req.params;  // id is basically username only
        // const peerUser = await User.findById(id);

        const peerUser = await User.findOne({ username: id });

        if (!peerUser) {
            return res.status(404).json({ error: 'User not found' });
        }

          // Reset timeout for the requesting user
          if (req.user && req.user.username) {
            await resetUserTimeout(req.user.username);
        }

          // Check if peer user is online
          const isOnline = await redisClient.exists(`online:${id}`);
          if (!isOnline) {
              return res.status(400).json({ error: 'User is not online' });
          }

        // need to handle the logic to send peer request

        
        res.json({ message: `Peer request sent to ${peerUser.name}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send peer request' });
    }
};
