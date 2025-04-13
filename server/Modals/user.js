const mongoose = require('mongoose');
const userSchema  = new mongoose.Schema({
    channelName: {
        type : String,
        required : true
    },
    userName:{
        type : String,
        required : true,
        unique : true
    },
    password:{
        type : String,
        required : true
    },
    about:{
        type : String,
        required : true
    },
    profilePic:{
        type : String,
        required : true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
      },
      isBlocked: {
        type: Boolean,
        default: false
      }
}, {timestamps : true});
module.exports = mongoose.model('User', userSchema);