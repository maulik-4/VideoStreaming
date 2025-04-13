const express = require('express');
const cookieParser = require('cookie-parser'); // ✅ fixed spelling
const app = express();
const cors = require('cors');


app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser()); 

require('./Connection/conn');

const Authuser = require('./Routes/user');
const video = require('./Routes/video');

app.use('/auth', Authuser);
app.use('/api', video);

const port = 9999;
app.listen(port, () => {
    console.log("serverStarted");
});
