const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const salt=10; // more salt - slower login

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true,index:true },
    password: { type: String, required: true },
    public_key: { type: String, required: true },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, salt); //
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    // console.time('Inside matchPassword method');
    // console.log('Starting password comparison...');
    const result = await bcrypt.compare(enteredPassword, this.password);
    // console.log('Password comparison completed');
    // console.timeEnd('Inside matchPassword method');
    return result;
};

module.exports = mongoose.model('User', userSchema);
