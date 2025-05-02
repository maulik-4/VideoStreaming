require('dotenv').config();
const User = require('../Modals/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY;

// Cookie config
const cookieOptions = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
};

// Signup
exports.userSignup = async (req, res) => {
  try {
    const { channelName, userName, password, about, profilePic } = req.body;
    const userExists = await User.findOne({ userName });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      channelName,
      userName,
      password: hashedPassword,
      about,
      profilePic,
      role: "user", // default role
      isBlocked: false // default status
    });

    await newUser.save();

    res.status(201).json({ message: "User created successfully", success: "yes", data: newUser });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Signin
exports.userSignin = async (req, res) => {
  try {
    const { userName, password } = req.body;
    const userExist = await User.findOne({ userName });

    if (!userExist) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, userExist.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: userExist._id }, SECRET_KEY, { expiresIn: '1h' });
    res.cookie('token', token, cookieOptions);

    const cleanUser = {
      _id: userExist._id,
      userName: userExist.userName,
      channelName: userExist.channelName,
      about: userExist.about,
      profilePic: userExist.profilePic,
      role: userExist.role
    };

    res.status(200).json({
      message: "User logged in successfully",
      success: "yes",
      data: cleanUser,
      token: token,
      user: cleanUser
    });
    console.log('JWT Secret Key:', SECRET_KEY);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Logout
exports.userLogout = async (req, res) => {
  res.clearCookie('token', cookieOptions).json({
    message: "User logged out successfully"
  });
};

// Block user (admin only)
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send({ message: "User blocked" });
  } catch (err) {
    res.status(500).json({ message: "Error blocking user" });
  }
};

// Unblock user (admin only)
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send({ message: "User unblocked" });
  } catch (err) {
    res.status(500).json({ message: "Error unblocking user" });
  }
};
