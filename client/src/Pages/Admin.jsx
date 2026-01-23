import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import axiosInstance from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || user.role !== 'admin') {
      toast.error("Access denied: Admin only");
      navigate('/');
      return;
    }
    
    fetchUsers();
  }, [navigate]);
  
  const fetchUsers = async () => {
    try {
      // Use axiosInstance instead of axios
      const res = await axiosInstance.get('/auth/all-users');
      
      const Data = res.data.users;
      const reqData = Data.filter((user) => user.role !== "admin");
      setUsers(reqData);
    } catch (err) {
      console.error("Error fetching users:", err);
      console.error("Response data:", err.response?.data);
      console.error("Status:", err.response?.status);
      toast.error("Failed to fetch users: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  console.log("Token:", localStorage.getItem('token'));
  const blockUser = async (id) => {
    try {
      await axiosInstance.put(`/auth/block/${id}`, {});
      fetchUsers();
      toast.success("User blocked successfully");
    } catch (err) {
      console.error("Error blocking user:", err);
      toast.error("Failed to block user");
    }
  };

  const unblockUser = async (id) => {
    try {
      await axiosInstance.put(`/auth/unblock/${id}`, {});
      fetchUsers();
      toast.success("User unblocked successfully");
    } catch (err) {
      console.error("Error unblocking user:", err);
      toast.error("Failed to unblock user");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 min-h-screen" style={{background:'var(--bg)', color:'var(--text)'}}>
    <h1 className="text-3xl font-extrabold mb-6 text-blue-400 tracking-wide">
      Admin Dashboard
    </h1>

    <div className="overflow-x-auto rounded-xl shadow-lg">
      <table className="min-w-full text-sm glass-card rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-blue-600 text-main uppercase text-xs tracking-wider">
            <th className="px-6 py-4 text-left">Username</th>
            <th className="px-6 py-4 text-left">Channel Name</th>
            <th className="px-6 py-4 text-left">Role</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-left">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{borderColor:'rgba(255,255,255,0.04)'}}>
          {users.map((user) => (
            <tr
              key={user._id}
              className="transition duration-200 ease-in-out hover:translate-x-0.5"
            >
              <td className="px-6 py-4 text-main">{user.userName}</td>
              <td className="px-6 py-4 text-muted">{user.channelName}</td>
              <td className="px-6 py-4 capitalize text-muted">{user.role}</td>
              <td className="px-6 py-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.isBlocked
                      ? "bg-red-600 text-white"
                      : "bg-green-600 text-white"
                  }`}
                >
                  {user.isBlocked ? "Blocked" : "Active"}
                </span>
              </td>
              <td className="px-6 py-4">
                {user.role !== "admin" && (
                  user.isBlocked ? (
                    <button
                      onClick={() => unblockUser(user._id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-md transition duration-200"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => blockUser(user._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-md transition duration-200"
                    >
                      Block
                    </button>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <ToastContainer position="top-right" theme="dark" />
  </div>

  );
}

export default Admin;
