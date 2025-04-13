  import React, { useState } from 'react';
  import { FaYoutube } from "react-icons/fa";
  import { useNavigate } from 'react-router-dom';
  import axios from "axios";
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
    
    const navigate = useNavigate();

    const handleUpload = async (e, type) => {
      const file = e.target.files[0];
      if (!file) return;

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
        const res = await axios.post("http://localhost:9999/api/upload", video, {
          withCredentials: true,
        });
    
        toast.success("🎉 Video uploaded successfully!");
        setTimeout(() => navigate('/'), 1500);
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "❌ Upload failed. Please try again.");
      }
    };
    

    return (
      <div className='bg-black text-white min-h-screen w-full flex justify-center items-center px-4'>
        <ToastContainer position="top-center" theme="dark" />
        <div className="upload_box flex flex-col gap-8 w-full max-w-3xl p-6 border border-gray-600 rounded-lg shadow-md bg-[#111]">
          
          {/* Title */}
          <div className="upload_title flex items-center gap-3 justify-center">
            <FaYoutube color="red" size={32} />
            <h1 className='font-bold text-2xl'>Upload Video</h1>
          </div>

          {/* Inputs */}
          <div className="info flex flex-col gap-4">
            <input
              type="text"
              value={video.title}
              onChange={(e) => handleInput(e, "title")}
              className='px-4 py-2 rounded bg-[#212121] text-white placeholder-gray-400'
              placeholder='Title of Video'
            />
            <input
              type="text"
              value={video.description}
              onChange={(e) => handleInput(e, "description")}
              className='px-4 py-2 rounded bg-[#212121] text-white placeholder-gray-400'
              placeholder='Description'
            />
            <input
              type="text"
              value={video.category}
              onChange={(e) => handleInput(e, "category")}
              className='px-4 py-2 rounded bg-[#212121] text-white placeholder-gray-400'
              placeholder='Category'
            />
          </div>

          {/* Uploads */}
          <div className="upload_section flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <label className='w-32 font-medium'>Thumbnail:</label>
              <input
                type="file"
                onChange={(e) => handleUpload(e, "thumbnail")}
                className='text-white file:bg-gray-700 file:border-none file:py-1 file:px-3 file:rounded cursor-pointer'
              />
            </div>
            <div className="flex items-center gap-3">
              <label className='w-32 font-medium'>Video:</label>
              <input
                type="file"
                onChange={(e) => handleUpload(e, "videoLink")}
                className='text-white file:bg-gray-700 file:border-none file:py-1 file:px-3 file:rounded cursor-pointer'
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="upload_btn flex justify-center gap-6 mt-4">
            <button
              onClick={handleSubmit}
              disabled={
                !video.title || !video.description || !video.category || !video.thumbnail || !video.videoLink
              }
              className={`${
                !video.title || !video.description || !video.category || !video.thumbnail || !video.videoLink
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              } px-6 py-2 rounded font-bold`}
            >
              Upload
            </button>
            <button
              onClick={() => navigate('/')}
              className='border border-gray-400 px-6 py-2 rounded font-bold hover:bg-gray-700'
            >
              Home
            </button>
          </div>

          {/* Previews */}
          {video.thumbnail && (
            <img
              src={video.thumbnail}
              alt="Thumbnail Preview"
              className="w-48 h-auto mx-auto mt-4 rounded"
            />
          )}
          {video.videoLink && (
            <video controls className="w-full max-w-lg mx-auto mt-4 rounded">
              <source src={video.videoLink} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </div>
    );
  };

  export default Upload;
