const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'A user must have a name!'],
    },
    email: {
      type: String,
      required: [true, 'A user must have a email!'],
      unique: true,
      validate: [validator.isEmail, 'Invalid email.'],
    },
    password: {
      type: String,
      required: [true, 'A user must have a password!'],
      validate: [validator.isStrongPassword, 'Password should be at least 8 characters and should contain lower case letter, upper case letter, number, special symbol.'],
      // minlength: 4,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'A user must have a password!'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Password and confirm Password are not same.',
      },
    },
    country: {
      type: String,
      required: [true, 'A user must choose a country!'],
      enum: ['Afganistan','SriLanks','Pakistan','Bangladesh','India'],
    },
    number: {
      type: String,
      required: [true, 'A user must have a number!'],
      unique: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
    loginToken: String,
    loginTokenExpires: Date,
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

userSchema.methods.passwordCorrect = async (originalpassword, newpassword) => await bcrypt.compare(newpassword, originalpassword);  

userSchema.methods.createLoginToken = function (next) {
    const token = crypto.randomBytes(32).toString('hex');
    this.loginToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    this.loginTokenExpires = Date.now() + 10 * 60 * 1000;
    return token;
};

const User = mongoose.model('User', userSchema);

module.exports = User;