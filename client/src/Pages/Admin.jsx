import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast,ToastContainer } from 'react-toastify';

function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
   
  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:9999/auth/all-users', { withCredentials: true });
     
      const token = localStorage.getItem('token');
      if(!token){
        toast.error("Please login as Admin  to access this page");
        return;
      }
      setUsers(res.data.users);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }; 


  const blockUser = async (id) => {
    try {
      await axios.put(`http://localhost:9999/auth/block/${id}`, {}, { withCredentials: true });
      fetchUsers();
      toast.success("User blocked successfully");
    } catch (err) {
      console.error("Error blocking user:", err);
    }
  };

  const unblockUser = async (id) => {
    try {
      await axios.put(`http://localhost:9999/auth/unblock/${id}`, {}, { withCredentials: true });
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
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <table className="w-full border border-collapse border-gray-300">
        <thead>
          <tr className="bg-blue-600">
            <th className="border p-2">Username</th>
            <th className="border p-2">Channel Name</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id} className="text-center">
              <td className="border p-2">{user.userName}</td>
              <td className="border p-2">{user.channelName}</td>
              <td className="border p-2">{user.role}</td>
              <td className="border p-2">{user.isBlocked ? 'Blocked' : 'Active'}</td>
              <td className="border p-2">
                {user.role !== 'admin' && (
                  user.isBlocked ? (
                    <button 
                      onClick={() => unblockUser(user._id)} 
                      className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button 
                      onClick={() => blockUser(user._id)} 
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
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
      <ToastContainer position='top-right' />
    </div>
  );
}

export default Admin;
