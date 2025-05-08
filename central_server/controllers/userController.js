const User = require('../models/Users.js');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis.js');


const generateToken = require('../utils/jwtHelper.js').generateToken;

const setUserOnline = async (username) => {
    await redisClient.set(`online:${username}`, 'true', {'EX': 2700}); // Set user online with 45-min expiration
    console.log(`User ${username} set online in Redis`);
};

exports.registerUser = async (req, res) => {
    try {
        const { username, password,key } = req.body;

        const check = await User.findOne({ username });
        if (check) {
            return res.status(400).json({ error: 'User already exists' });
        }

        let user = await User.create({ username, password, public_key: key });
        console.log(user);

        await setUserOnline(username);
        console.log("User added to redis");
        res.status(201).json({ user,token: generateToken(user._id) });

    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
        console.error(error);

    }
};

exports.loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // if (user.password !== password) {
        //     return res.status(401).json({ error: 'Wrong Password' });
        // }

        if(!await user.matchPassword(password)){
            return res.status(401).json({ error: 'Wrong Password' });
        }

        await setUserOnline(username);
        res.status(200).json({ user,token: generateToken(user._id) });
        // res.status(200).json({ user});
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
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