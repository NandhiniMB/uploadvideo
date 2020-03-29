const mongoose = require('mongoose');
const config = require('../config/database');
mongoose.connect(config.database);
const Schema = mongoose.Schema;
// User Schema
const UserSchema = mongoose.Schema({
  uname:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true
  },
 password:{
    type: String,
    required: true
  },
  password2:{
    type: String,
    required: true
  }
});

const User = module.exports = mongoose.model('User', UserSchema);