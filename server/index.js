const express = require('express');
const cookieParser = require('cookie-parser'); 
const cors = require('cors');
require('dotenv').config();

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 9999;
    this.setupMiddleware();
    this.setupDatabase();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors({
      origin: ['http://localhost:5173', "https://yotube-full-stack.vercel.app", "https://vidmo.vercel.app"],
      credentials: true,
    }));
    
    this.app.use(express.json());
    this.app.use(cookieParser());
  }

  setupDatabase() {
    require('./Connection/conn');
  }

  setupRoutes() {
    const authRoutes = require('./Routes/user');
    const videoRoutes = require('./Routes/video');
    const historyRoutes = require('./Routes/history');
    const analysisRoutes = require('./Routes/analysis');
    
    this.app.use('/auth', authRoutes);
    this.app.use('/api', videoRoutes);
    this.app.use('/history', historyRoutes);
    this.app.use('/api/analysis', analysisRoutes);
  }

  start() {
    this.app.listen(this.port, () => {});
  }
}

const server = new Server();
server.start();

module.exports = server;
