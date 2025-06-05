const User = require('../models/Users.js');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis.js');

const bcrypt = require('bcrypt');

const generateToken = require('../utils/jwtHelper.js').generateToken;

const setUserOnline = async (username) => {
    await redisClient.set(`online:${username}`, 'true', {'EX': 2700}); // Set user online with 45-min expiration
    console.log(`User ${username} set online in Redis`);
};

exports.registerUser = async (req, res) => {
    try {
        const { username, password,key } = req.body;

        // console.log(req.body);

        const check = await User.findOne({ username });
        if (check) {
            return res.status(400).json({ error: 'User already exists' });
        }

        let user = await User.create({ username, password, public_key: key });
        console.log(user);

        await setUserOnline(username);
        console.log("User added to redis");
        res.status(201).json({ token: generateToken(user._id) });

    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
        console.error(error);

    }
};

exports.loginUser = async (req, res) => {
    // console.time('Total Login Time');
    try {
        const { username, password } = req.body;
        
        // console.time('1. Database Query');
        const user = await User.findOne({ username });
        // console.timeEnd('1. Database Query');

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Test direct bcrypt vs method call
        // console.time('2a. Direct bcrypt compare');
        const directResult = await bcrypt.compare(password, user.password);
        // console.timeEnd('2a. Direct bcrypt compare');
        
        // console.time('2b. User method compare');
        const methodResult = await user.matchPassword(password);
        // console.timeEnd('2b. User method compare');
        
        if(!methodResult){
            return res.status(401).json({ error: 'Wrong Password' });
        }

        // console.time('3. Redis Set Online');
        await setUserOnline(username);
        // console.timeEnd('3. Redis Set Online');
        
        // console.time('4. Generate Token');
        const token = generateToken(user._id);
        // console.timeEnd('4. Generate Token');

        res.status(200).json({ user, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    // } finally {
    //     console.timeEnd('Total Login Time');
    }
};

exports.getUserProfile = async (req, res) => {
    // const user = await User.findById(req.user.id);
    const {username} = req.body;
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }
    await setUserOnline(user.username);
    res.json({ public_key: user.public_key });
};

// for /api/user/profile/:username return the public key of the user
// exports.getUserPublicKey = async (req, res) => {
//     const user = await User.findOne({ username: req.params.username });
//     if (!user) {
//         return res.status(404).json({ error: 'User not found' });
//     }
//     res.json({ public_key: user.public_key });
// }


exports.logoutUser = async (req, res) => {
    const { username } = req.body;
    await redisClient.del(`online:${username}`);
    console.log(`User ${username} set offline in Redis`);
    res.status(200).json({ message: 'User logged out' });
}