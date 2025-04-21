import React, { useEffect, useState } from 'react';
import Sidebar from '../Components/Sidebar/Sidebar';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const Profile = ({ SideBar }) => {
  const [userVideos, setUserVideos] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse( localStorage.getItem('user'));
  const {role} = user;
  const userInfo = userVideos.length > 0 ? userVideos[0].user : null;
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`https://yotube-full-stack.onrender.com/api/${id}/getAllVideosById`);
        setUserVideos(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, [id]);

 
  
  
if(role  == "admin"){
  navigate('/admin');
}


 

  return (
    <div className="bg-black flex w-full min-h-screen text-white flex-col md:flex-row">
      {SideBar && <Sidebar />}

      <div className="flex flex-col w-full px-6 md:px-12 py-8">
        {/* User Info */}
        {userInfo && (
          <div className="user_info flex items-center gap-4 bg-gray-800 p-4 rounded-lg shadow-md">
            <img
              src={userInfo.profilePic}
              className="w-20 h-20 rounded-full object-cover"
              alt={userInfo.userName}
            />
            <div className="info text-lg">
              <h1 className="font-bold text-xl md:text-2xl">{userInfo.userName}</h1>
              <h1 className="text-gray-400 text-lg md:text-xl">@{userInfo.channelName}</h1>
            </div>
          </div>
        )}

        {/* Videos Section */}
        <h1 className="text-2xl font-bold mt-6 mb-4">Videos</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {userVideos.map((video, index) => (
            <div
              onClick={()=>{
                navigate(`/watch/${video._id}`);
              }}
              key={index}
              className="video_card bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-700 transition"
            >
              <div
                className="video_thumbnail w-full h-40 bg-gray-600 rounded-md mb-3"
                style={{
                  backgroundImage: `url(${video.thumbnail})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              ></div>
              <h1 className="text-lg font-semibold">{video.title}</h1>
              <h1 className="text-gray-400 text-sm">{video.user.userName}</h1>
              <h1 className="text-gray-400 text-sm">Likes: {video.like}</h1>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
