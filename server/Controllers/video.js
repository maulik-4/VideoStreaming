const video = require('../Modals/video');

exports.videoUpload = async (req, res) => {

    console.log("Upload route hit by user:", req.user);
    try {
        const { title, description, videoLink ,category, thumbnail} = req.body;
        const videoUpload = new video({
            user:req.user._id,
            title,
            description,
            videoLink,
            category,
            thumbnail
        })
        await videoUpload.save();
        res.status(201).json({ message: "Video uploaded successfully", success: "yes", data: videoUpload });
    
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
};


exports.getAllVideos = async (req, res) => {
    try {
        const videos = await video.find().populate('user', 'userName channelName profilePic isBlocked');
        res.status(200).json({ message: "Videos fetched successfully", success: "yes", data: videos });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
}


exports.getVideoById = async (req, res) => {
    try {
        const { id } = req.params;
        const videoData = await video.findById(id).populate('user', 'userName channelName profilePic');
        if (!videoData) {
            return res.status(404).json({ message: "Video not found" });
        }
        res.status(200).json({ message: "Video fetched successfully", success: "yes", data: videoData });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
}   

exports.getAllvideosById = async(req,res) =>{
    try{
        const {id} = req.params;

        const videos = await video.find({user:id}).populate('user', 'userName channelName profilePic');
        if(!videos){
            return res.status(404).json({message:"Videos not found"});
        }
        res.status(200).json({message:"Videos fetched successfully", success:"yes", data:videos});
    }
    catch(err){
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
}

exports.UpdateLikes = async(req,res)=>{
    try{
        const { id } = req.params;
        const videoData = await video.findById(id);
        if (!videoData) {
            return res.status(404).json({ message: "Video not found" });
        }
        videoData.likes += 1;
        const updatedVideo = await videoData.save();
        res.status(200).json({
            message: "Like added successfully",
            likes: updatedVideo.likes
        });

    }
    catch(err){
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
}
exports.UpdateDislikes  = async(req,res)=>{
    try{
        const { id } = req.params;
        const videoData = await video.findById(id);
        if (!videoData) {
            return res.status(404).json({ message: "Video not found" });
        }
        videoData.dislike += 1;
        const updatedVideo = await videoData.save();
        res.status(200).json({
            message: "Dislike added successfully",
            dislike: updatedVideo.dislike
        });

    }
    catch(err){
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
}
exports.UpdateViews = async(req,res) =>{
   try{
    const {id} = req.params;
    const videoData = await video.findById(id);
    if(!videoData){
        return res.status(404).json({message:"Video not found"});
    }
    videoData.views += 1;
    const updatedVideo = await videoData.save();
    res.status(200).json({
        message: "Views updated successfully",
        views: updatedVideo.views
    });
   }
   catch(err){
    console.log(err);
   }
}