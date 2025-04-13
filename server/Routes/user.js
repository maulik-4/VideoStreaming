const express= require('express');
const userSignup = require('../Controllers/user');


const router = express.Router();
//Routes
router.post('/signup' ,userSignup.userSignup);
router.post('/login' , userSignup.userSignin);
router.get('/logout' , userSignup.userLogout);
module.exports = router;