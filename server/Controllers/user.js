const user = require('../Modals/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const cookieOptions = {
   
    httpOnly: true,
    secure: false, 
    sameSite: 'lax' 
}


exports.userSignup = async (req, res) => {
    try {
        const { channelName, userName, password, about, profilePic } = req.body;
        const userexit = await user.findOne({ userName });

        if (userexit) {
            return res.status(400).json({ message: "User already exists" });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new user({
                channelName,
                userName,
                password: hashedPassword,
                about,
                profilePic
            });
            await newUser.save();
            res.status(201).json({ message: "User created successfully", success: "yes", data: newUser });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
}
exports.userSignin = async (req, res) => {
  try {
    const { userName, password } = req.body;
    const userExist = await user.findOne({ userName });

    if (!userExist) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, userExist.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: userExist._id }, 'secretkey'); 

    res.cookie('token', token, cookieOptions);

    const cleanUser = {
      _id: userExist._id,
      userName: userExist.userName,
      channelName: userExist.channelName,
      about: userExist.about,
      profilePic: userExist.profilePic
    };

    res.status(200).json({
      message: "User logged in successfully",
      success: "yes",
      data: cleanUser,
      token: token,
      user:cleanUser,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.userLogout = async (req, res) => {
  res.clearCookie('token', cookieOptions).json({
      message: "User logged out successfully"
  });
};
