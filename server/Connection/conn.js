const mongoose = require('mongoose');
require('dotenv').config();
const MONGO_URL = process.env.MONGO_URL;
console.log("MongoDB URI:", MONGO_URL); mongoose.connect(MONGO_URL)
.then(() => {
    console.log("Connected to MongoDB successfully");
})
.catch((err) => {
    console.log("Error connecting to MongoDB", err);
});