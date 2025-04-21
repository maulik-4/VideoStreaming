const mongoose = require('mongoose');
require('dotenv').config();
const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/Youtube-Backend";
mongoose.connect(MONGO_URI)
.then(() => {
    console.log("Connected to MongoDB successfully");
})
.catch((err) => {
    console.log("Error connecting to MongoDB", err);
});