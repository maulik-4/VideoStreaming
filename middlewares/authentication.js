const jwt = require('jsonwebtoken');
const User = require('../Modals/user');

const auth = async(req,res,next) =>{
    const token = req.cookies.token;
    if(!token){
        return res.status(401).json({message : "Unauthorized access"});
    }
    else{
        try{
            const decode = jwt.verify(token, "secretkey");
            req.user = await User.findById(decode.userId).select("-password");
            next();
        }
        catch(err){
            return res.status(401).json({message : "TOken is not valid"});
        }
    }
}
module.exports = auth; 