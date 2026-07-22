/**
 * ============================================================================
 * Types Used
 * ============================================================================
 * Express              - Main Express application
 * Application          - Express application type
 * Server               - Node HTTP server
 * SocketServer         - Socket.IO server
 * Socket               - Connected client socket
 *
 * Future Changes:
 * - When migrating to PostgreSQL, no changes should be required here.
 * - Database initialization will simply import Prisma instead of Mongoose.
 * ============================================================================
 */

import express, { Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import http, { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";

import "./Connection/conn";

import authRoutes from "./Routes/user";
import videoRoutes from "./Routes/video";
import historyRoutes from "./Routes/history";
import analysisRoutes from "./Routes/analysis";

import { setIO } from "./Socket/socket";

dotenv.config();

class Server {
    public app: Application;
    public server: HttpServer;
    public io!: SocketServer;
    public port: number | string;

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = process.env.PORT || 9999;

        this.setupMiddleware();
        this.setupDatabase();
        this.setupRoutes();
        this.setupSocket();
    }

    private setupSocket(): void {
    

        this.io = new SocketServer(this.server, {
            cors: {
                origin: [
                    "http://localhost:5173",
                    "https://yotube-full-stack.vercel.app",
                    "https://vidmo.vercel.app",
                ],
                credentials: true,
            },
        });

        setIO(this.io);


        this.io.on("connection", (socket: Socket) => {

            socket.on("join-video", (videoId: string) => {
                socket.join(String(videoId));
                
            });

            socket.on("leave-video", (videoId: string) => {
                socket.leave(String(videoId));
               
            });

            socket.on("disconnect", () => {
                console.log("Disconnected:", socket.id);
            });
        });

        
    }

    private setupMiddleware(): void {
        this.app.use(
            cors({
                origin: [
                    "http://localhost:5173",
                    "https://yotube-full-stack.vercel.app",
                    "https://vidmo.vercel.app",
                ],
                credentials: true,
            })
        );

        this.app.use(express.json());
        this.app.use(cookieParser());
    }

    private setupDatabase(): void {
        // Connection is initialized through import.
    }

    private setupRoutes(): void {
        this.app.use("/auth", authRoutes);
        this.app.use("/api", videoRoutes);
        this.app.use("/history", historyRoutes);
        this.app.use("/api/analysis", analysisRoutes);
    }

    public start(): void {
        console.log("Starting server");

        this.server.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`);
        });
    }
}

const server = new Server();

server.start();

export default server;