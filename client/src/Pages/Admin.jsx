import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast,ToastContainer } from 'react-toastify';

function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
   
  const fetchUsers = async () => {
    try {
      const res = await axios.get('https://yotube-full-stack.onrender.com/auth/all-users', { withCredentials: true });
     
      const token = localStorage.getItem('token');
      if(!token){
        toast.error("Please login as Admin  to access this page");
        return;
      }
      const Data = res.data.users;
      const reqData = Data.filter((user) => user.role !== "admin");
      setUsers(reqData);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }; 


  const blockUser = async (id) => {
    try {
      await axios.put(`https://yotube-full-stack.onrender.com/auth/block/${id}`, {}, { withCredentials: true });
      fetchUsers();
      toast.success("User blocked successfully");
    } catch (err) {
      console.error("Error blocking user:", err);
    }
  };

  const unblockUser = async (id) => {
    try {
      await axios.put(`https://yotube-full-stack.onrender.com/auth/unblock/${id}`, {}, { withCredentials: true });
      fetchUsers();
    } catch (err) {
      console.error("Error unblocking user:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 text-white min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
    <h1 className="text-3xl font-extrabold mb-6 text-blue-400 tracking-wide">
      Admin Dashboard
    </h1>
  
    <div className="overflow-x-auto rounded-xl shadow-lg">
      <table className="min-w-full text-sm bg-gray-800 rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-blue-600 text-white uppercase text-xs tracking-wider">
            <th className="px-6 py-4 text-left">Username</th>
            <th className="px-6 py-4 text-left">Channel Name</th>
            <th className="px-6 py-4 text-left">Role</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-left">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {users.map((user) => (
            <tr
              key={user._id}
              className="hover:bg-gray-700 transition duration-200 ease-in-out"
            >
              <td className="px-6 py-4">{user.userName}</td>
              <td className="px-6 py-4">{user.channelName}</td>
              <td className="px-6 py-4 capitalize">{user.role}</td>
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
