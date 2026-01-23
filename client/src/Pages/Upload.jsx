import React, { useState } from 'react';
import { FaYoutube, FaCloudUploadAlt, FaImage, FaVideo } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import axiosInstance from "../utils/axiosConfig";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Upload = () => {
  const [video, setVideo] = useState({
    title: "",
    description: "",
    category: "",
    thumbnail: "",
    videoLink: ""
  });
  
  const [loading, setLoading] = useState({
    thumbnail: false,
    video: false
  });
  
  const navigate = useNavigate();

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Set loading state for the specific upload
    setLoading(prev => ({ ...prev, [type === "videoLink" ? "video" : "thumbnail"]: true }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "yotube"); // Cloudinary preset

    const cloudinaryType = type === "videoLink" ? "video" : "image";

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/de7gqhlpj/${cloudinaryType}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (res.ok && data.secure_url) {
        setVideo((prev) => ({
          ...prev,
          [type]: data.secure_url,
        }));
        toast.success(`✅ ${type === "videoLink" ? "Video" : "Thumbnail"} uploaded`);
      } else {
        toast.error(`❌ Upload failed: ${data.error?.message}`);
      }
    } catch (err) {
      toast.error("⚠️ Upload failed. Try again.");
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, [type === "videoLink" ? "video" : "thumbnail"]: false }));
    }
  };

  const handleInput = (e, field) => {
    setVideo((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = async () => {
    const { title, description, category, thumbnail, videoLink } = video;
  
    if (!title || !description || !category || !thumbnail || !videoLink) {
      toast.error("📄 Please fill all fields and upload both files.");
      return;
    }
  
    try {
      const res = await axiosInstance.post("/api/upload", video);
  
      toast.success("🎉 Video uploaded successfully!");
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "❌ Upload failed. Please try again.");
    }
  };
  
  const categories = ["Music", "Comedy", "Gaming", "Tech", "Education", "Sports", "Travel", "Food", "Fashion", "Science", "News"];

  const isFormComplete = video.title && video.description && video.category && video.thumbnail && video.videoLink;

  return (
    <div className='min-h-screen w-full pt-[70px] pb-8 px-4' style={{background:'var(--bg)', color:'var(--text)'}}>
      <ToastContainer position="top-center" theme="dark" />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <FaYoutube className="text-red-600 text-3xl" />
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Upload Video
          </h1>
        </div>
        
        <div className="glass-card backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-soft">
          {/* Main Form */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Left Column - Form Fields */}
              <div className="md:col-span-3 space-y-6">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-muted">Video Title</label>
                  <input type="text" value={video.title} onChange={(e) => handleInput(e, "title")} className="w-full px-4 py-3 rounded-lg input-card placeholder:text-muted outline-none border border-soft focus:border-blue-500 transition-all duration-300" placeholder="My Awesome Video" />
                </div>
                
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-muted">Description</label>
                  <textarea value={video.description} onChange={(e) => handleInput(e, "description")} rows="4" className="w-full px-4 py-3 rounded-lg input-card placeholder:text-muted outline-none border border-soft focus:border-blue-500 transition-all duration-300" placeholder="Describe your video..."></textarea>
                </div>
                
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-muted">Category</label>
                  <select value={video.category} onChange={(e) => handleInput(e, "category")} className="w-full px-4 py-3 rounded-lg input-card outline-none border border-soft focus:border-blue-500 transition-all duration-300">
                    <option value="" disabled>Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-muted">Thumbnail</label>
                    <div className="flex items-center">
                      <label className="flex items-center justify-center gap-2 py-3 px-5 rounded-lg cursor-pointer transition-colors w-full input-card">
                        <FaImage className="text-blue-400" />
                        <span className="text-sm">Choose Thumbnail</span>
                        <input type="file" onChange={(e) => handleUpload(e, "thumbnail")} className="hidden" />
                      </label>
                    </div>
                    {loading.thumbnail && (
                      <div className="flex justify-center">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-sm text-gray-300">Uploading...</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-muted">Video File</label>
                    <div className="flex items-center">
                      <label className="flex items-center justify-center gap-2 py-3 px-5 rounded-lg cursor-pointer transition-colors w-full input-card">
                        <FaVideo className="text-red-400" />
                        <span className="text-sm">Choose Video</span>
                        <input type="file" onChange={(e) => handleUpload(e, "videoLink")} className="hidden" />
                      </label>
                    </div>
                    {loading.video && (
                      <div className="flex justify-center">
                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-sm text-gray-300">Uploading video...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Column - Previews */}
              <div className="md:col-span-2 space-y-6">
                <div className="rounded-lg p-4 border border-soft glass-card">
                  <h3 className="text-center text-sm font-medium mb-3 text-muted">Preview</h3>
                  
                  {video.thumbnail ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-soft mb-4 glass-card">
                      <img
                        src={video.thumbnail}
                        alt="Thumbnail Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 text-xs font-medium px-2 py-1 rounded glass-card" style={{border:'1px solid rgba(255,255,255,0.04)'}}>
                        Thumbnail
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center rounded-lg mb-4 border border-dashed border-soft glass-card">
                      <div className="text-center px-4">
                        <FaImage className="mx-auto text-gray-500 text-3xl mb-2" />
                        <p className="text-xs text-muted">Thumbnail preview will appear here</p>
                      </div>
                    </div>
                  )}
                  
                  {video.videoLink ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-soft glass-card">
                      <video controls className="w-full h-full object-cover">
                        <source src={video.videoLink} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center rounded-lg border border-dashed border-soft glass-card">
                      <div className="text-center px-4">
                        <FaVideo className="mx-auto text-gray-500 text-3xl mb-2" />
                        <p className="text-xs text-muted">Video preview will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="rounded-lg p-4 border border-soft glass-card">
                  <div className="text-xs text-muted space-y-2 mb-4">
                    <p>• Videos must be under 100MB</p>
                    <p>• You can upload MP4, MOV, or WebM formats</p>
                    <p>• Thumbnails should be 16:9 ratio</p>
                    <p>• Be sure to follow community guidelines</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Actions */}
          <div className="px-8 py-6 border-t border-soft flex flex-col sm:flex-row justify-end gap-4 glass-card">
            <button onClick={() => navigate('/')} className="px-5 py-2.5 rounded-lg font-medium border border-soft text-main transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={!isFormComplete} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${isFormComplete ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-card text-muted cursor-not-allowed'}`}>
              <FaCloudUploadAlt className="text-lg" />
              Upload Video
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
