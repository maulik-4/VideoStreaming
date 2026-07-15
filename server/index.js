const express = require('express');
const cookieParser = require('cookie-parser'); 
const cors = require('cors');
const http = require("http");
const { Server: SocketServer } = require("socket.io");
const { setIO } = require("./Socket/socket");
require('dotenv').config();

class Server {
  constructor() {
    console.log("1. Constructor");

    this.app = express();
    this.server = http.createServer(this.app);
    this.port = process.env.PORT || 9999;

    console.log("2. Middleware");
    this.setupMiddleware();

    console.log("3. Database");
    this.setupDatabase();

    console.log("4. Routes");
    this.setupRoutes();

    console.log("5. Socket");
    this.setupSocket();
}
setupSocket() {
    console.log("Socket: before creating io");

   this.io = new SocketServer(this.server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "https://yotube-full-stack.vercel.app",
            "https://vidmo.vercel.app"
        ],
        credentials: true
    }
});

setIO(this.io);

    console.log("Socket: after creating io");

    this.io.on("connection", (socket) => {
        console.log("User Connected:", socket.id);

        socket.on("join-video", (videoId) => {
            socket.join(videoId);
            console.log(`${socket.id} joined room ${videoId}`);
        });

        socket.on("leave-video", (videoId) => {
            socket.leave(videoId);
            console.log(`${socket.id} left room ${videoId}`);
        });

        socket.on("disconnect", () => {
            console.log("Disconnected:", socket.id);
        });
    });

    console.log("Socket: finished");
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
   console.log("6. Starting server");

    this.server.listen(this.port, () => {
        console.log(`Server running on port ${this.port}`);
    });
  }
}

const server = new Server();
server.start();

module.exports = server;
