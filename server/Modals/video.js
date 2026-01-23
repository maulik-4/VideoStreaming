const mongoose = require('mongoose');
const videoSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title:{
        type: String,
        required: true
    },
    description:{
        type: String
    },
    videoLink:{
        type: String,
        required: true
    },
    thumbnail:{
        type: String,
        required: true
    },
    category:{
        type: String,
        required: true,
        default: "All",
    },
    likes:{
        type: Number,
        default: 0
    },
    dislike:{
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    }
    ,
    comments: [new mongoose.Schema({
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        edited: { type: Boolean, default: false }
    }, { timestamps: true })]
} , {timestamps : true});
module.exports = mongoose.model('Video', videoSchema);
