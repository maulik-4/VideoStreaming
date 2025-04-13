import { useState } from 'react';
import './App.css';
import Navbar from './Components/Navbar';
import Homepage from './Pages/Homepage';
import Sidebar from './Components/Sidebar/Sidebar';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Video_Page from './Pages/Video_Page';
import Profile from './Pages/Profile';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import Upload from './Pages/Upload';


function App() {
  const [SideBar, setSidebar] = useState(false);

  function SidbarHidden() {
    setSidebar((prev) => !prev);
  }

  const user = localStorage.getItem('user');
  const profilePic = localStorage.getItem('profilePic');

  return (
   
      <div className='bg-black overflow-hidden'>
        <Router>
          <Navbar SideBar={SideBar} SidbarHidden={SidbarHidden} />
          <Routes>
            <Route path='/' element={<Homepage SideBar={SideBar} />} />
            <Route path='/watch/:id' element={<Video_Page SideBar={SideBar} />} />
            <Route path='/profile/:id' element={<Profile SideBar={SideBar} />} />
            <Route path='/login' element={<Login />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/upload' element={<Upload />} />
          </Routes>
        </Router>
      </div>
    
  );
}

export default App;
