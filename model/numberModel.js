const crypto = require('crypto');
const mongoose = require('mongoose');
const numberController = require('../controllers/numberController');
// const bcrypt = require('bcryptjs');
// const validator = require('validator');

const numberSchema = new mongoose.Schema({
    number: {
      type: String,
      required: [true, 'A user must have a number!'],
    },
    token: String,
    tokenExpires: Date,
    verify: {
        type: Boolean,
        default: false
    }
});

numberSchema.pre('save', async function (next) {
  if (this.isModified('token') || this.isModified('tokenExpires')) return next();
  const token = crypto.randomBytes(2).toString('hex');
  this.token = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.tokenExpires = Date.now() + 1 * 60 * 1000;
  numberController.sendCodeToNumber(this.number, token);
  next();
});

const Number = mongoose.model('Number', numberSchema);

module.exports = Number;