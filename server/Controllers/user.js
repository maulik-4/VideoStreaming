require('dotenv').config();
const User = require('../Modals/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserController {
  constructor() {
    this.SECRET_KEY = process.env.SECRET_KEY;
    this.cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };
  }

  // Subscribe to a channel
  async subscribe(req, res) {
    try {
      const targetId = req.params.id;
      const currentUser = req.user;
      if (currentUser._id.equals(targetId)) return res.status(400).json({ message: "Cannot subscribe to yourself" });

      const already = currentUser.subscriptions && currentUser.subscriptions.find(id => id.toString() === targetId);
      if (already) return res.status(400).json({ message: "Already subscribed" });

      currentUser.subscriptions = currentUser.subscriptions || [];
      currentUser.subscriptions.push(targetId);
      await currentUser.save();

      const targetUser = await User.findById(targetId);
      if (targetUser) {
        targetUser.subscribersCount = (targetUser.subscribersCount || 0) + 1;
        await targetUser.save();
      }

      res.status(200).json({ message: "Subscribed" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to subscribe" });
    }
  }

  // Unsubscribe
  async unsubscribe(req, res) {
    try {
      const targetId = req.params.id;
      const currentUser = req.user;
      currentUser.subscriptions = (currentUser.subscriptions || []).filter(id => id.toString() !== targetId);
      await currentUser.save();

      const targetUser = await User.findById(targetId);
      if (targetUser) {
        targetUser.subscribersCount = Math.max(0, (targetUser.subscribersCount || 0) - 1);
        await targetUser.save();
      }

      res.status(200).json({ message: "Unsubscribed" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to unsubscribe" });
    }
  }

  // Get videos from subscriptions (for feed)
  async getSubscriptionsVideos(req, res) {
    try {
      const subs = req.user.subscriptions || [];
      const Video = require('../Modals/video');
      const videos = await Video.find({ user: { $in: subs } }).populate('user', 'userName channelName profilePic');
      res.status(200).json({ success: 'yes', data: videos });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch subscriptions videos" });
    }
  }

  // Change role (admin only)
  async changeRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
      const user = await User.findByIdAndUpdate(id, { role }, { new: true });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ message: 'Role updated', user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to change role' });
    }
  }

  // Get profile by channel name
  async getByChannelName(req, res) {
    try {
      const { channelName } = req.params;
      const user = await User.findOne({ channelName }).select('_id channelName userName profilePic about');
      if (!user) return res.status(404).json({ message: 'Channel not found' });
      res.status(200).json({ success: 'yes', data: user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to fetch channel' });
    }
  }

  // Signup
  async userSignup(req, res) {
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
  }

  // Signin
  async userSignin(req, res) {
    try {
      const { userName, password, deviceId } = req.body;
      const userExist = await User.findOne({ userName });

      if (!userExist) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await bcrypt.compare(password, userExist.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Include deviceId in the JWT payload
      const token = jwt.sign(
        { userId: userExist._id, deviceId }, 
        this.SECRET_KEY, 
        { expiresIn: '1h' }
      );
      
      // Set cookie to expire with token (1 hour)
      res.cookie('token', token, {
        ...this.cookieOptions,
        maxAge: 3600000 // 1 hour in milliseconds
      });

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

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Logout
  async userLogout(req, res) {
    res.clearCookie('token', this.cookieOptions).json({
      message: "User logged out successfully"
    });
  }

  // Block user (admin only)
  async blockUser(req, res) {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true });
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }
      res.status(200).send({ message: "User blocked" });
    } catch (err) {
      res.status(500).json({ message: "Error blocking user" });
    }
  }

  // Unblock user (admin only)
  async unblockUser(req, res) {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false });
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }
      res.status(200).send({ message: "User unblocked" });
    } catch (err) {
      res.status(500).json({ message: "Error unblocking user" });
    }
  }

  // Get all users (admin only)
  async getAllUsers(req, res) {
    try {
      const users = await User.find({});
      res.status(200).json({ users });
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Error fetching users" });
    }
  }
}

module.exports = new UserController();
