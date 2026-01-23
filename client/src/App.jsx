import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './Components/Navbar';
import Homepage from './Pages/Homepage';
import Sidebar from './Components/Sidebar/Sidebar';
import Video_Page from './Pages/Video_Page';
import Profile from './Pages/Profile';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import Upload from './Pages/Upload';
import Admin from './Pages/Admin';
import Subscriptions from './Pages/Subscriptions';
import Footer from './Components/Footer';

function App() {
  const [showSidebar, setShowSidebar] = useState(true);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <Router>
      <div className="app">
        <Navbar SideBar={showSidebar} SidbarHidden={toggleSidebar} />
        <div className="content">
          <Routes>
            <Route path='/' element={<Homepage SideBar={showSidebar} />} />
            <Route path='/watch/:id' element={<Video_Page SideBar={showSidebar} />} />
            <Route path='/profile/:id' element={<Profile SideBar={showSidebar} />} />
            <Route path='/subscriptions' element={<Subscriptions SideBar={showSidebar} />} />
            <Route path='/login' element={<Login />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/upload' element={<Upload />} />
            <Route path='/admin' element={<Admin />} />
          </Routes>
          <Footer/>
        </div>
      </div>
    </Router>
  );
}

export default App;
