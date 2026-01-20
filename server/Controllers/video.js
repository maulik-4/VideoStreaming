const Video = require('../Modals/video');
const redisClient = require('../Redis/redisClient');

class VideoController {
  constructor() {}

  async videoUpload(req, res) {
    console.log("Upload route hit by user:", req.user);
    try {
      const { title, description, videoLink, category, thumbnail } = req.body;
      const videoUpload = new Video({
        user: req.user._id,
        title,
        description,
        videoLink,
        category,
        thumbnail
      });
      await videoUpload.save();
      res.status(201).json({ message: "Video uploaded successfully", success: "yes", data: videoUpload });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

 
  async  getAllVideos(req, res) {
  const CACHE_KEY = "home:videos";

  try {
    try {
      const cachedVideos = await redisClient.get(CACHE_KEY);

      if (cachedVideos) {
        console.log("HOME VIDEOS CACHE HIT");
        return res.status(200).json({
          message: "Videos fetched successfully",
          success: "yes",
          data: JSON.parse(cachedVideos)
        });
      }
    } catch (redisErr) {
      console.error("Redis read failed:", redisErr);
      // continue to DB (never break API)
    }

    console.log("HOME VIDEOS CACHE MISS");

    // 2️⃣ Fetch from DB
    const videos = await Video.find()
      .populate("user", "userName channelName profilePic isBlocked")
      .lean(); // important for caching

    // 3️⃣ Store in Redis (best-effort)
    try {
      await redisClient.set(
        CACHE_KEY,
        JSON.stringify(videos),
        { EX: 300 } // 5 minutes
      );
    } catch (redisErr) {
      console.error("Redis write failed:", redisErr);
    }

    // 4️⃣ Return response
    res.status(200).json({
      message: "Videos fetched successfully",
      success: "yes",
      data: videos
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
  }
  async getVideoById(req, res) {
    try {
      const { id } = req.params;
      const videoData = await Video.findById(id).populate('user', 'userName channelName profilePic');
      if (!videoData) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.status(200).json({ message: "Video fetched successfully", success: "yes", data: videoData });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getAllvideosById(req, res) {
    try {
      const { id } = req.params;
      const videos = await Video.find({ user: id }).populate('user', 'userName channelName profilePic');
      if (!videos) {
        return res.status(404).json({ message: "Videos not found" });
      }
      res.status(200).json({ message: "Videos fetched successfully", success: "yes", data: videos });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateLikes(req, res) {
    try {
      const { id } = req.params;
      const videoData = await Video.findById(id);
      if (!videoData) {
        return res.status(404).json({ message: "Video not found" });
      }
      videoData.likes += 1;
      const updatedVideo = await videoData.save();
      res.status(200).json({
        message: "Like added successfully",
        likes: updatedVideo.likes
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateDislikes(req, res) {
    try {
      const { id } = req.params;
      const videoData = await Video.findById(id);
      if (!videoData) {
        return res.status(404).json({ message: "Video not found" });
      }
      videoData.dislike += 1;
      const updatedVideo = await videoData.save();
      res.status(200).json({
        message: "Dislike added successfully",
        dislike: updatedVideo.dislike
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateViews(req, res) {
    try {
      const { id } = req.params;
      const videoData = await Video.findById(id);
      if (!videoData) {
        return res.status(404).json({ message: "Video not found" });
      }
      videoData.views += 1;
      const updatedVideo = await videoData.save();
      res.status(200).json({
        message: "Views updated successfully",
        views: updatedVideo.views
      });
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = new VideoController();