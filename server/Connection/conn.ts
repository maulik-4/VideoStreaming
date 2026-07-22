/**
 * ============================================================================
 * Types Used
 * ============================================================================
 * mongoose              - MongoDB ODM
 * ConnectOptions        - Mongoose connection options
 *
 * Variables
 * ============================================================================
 * MONGO_URL : string
 * isConnected : boolean
 *
 * Future PostgreSQL Changes
 * ============================================================================
 * Replace mongoose.connect() with PrismaClient().
 * The rest of the project should not need any changes.
 * ============================================================================
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

class DatabaseConnection {
    private readonly MONGO_URL: string;
    private isConnected: boolean;

    constructor() {
        this.MONGO_URL =
            process.env.MONGO_URL ??
            "mongodb://localhost:27017/Youtube-Backend";

        this.isConnected = false;
    }

    public async connect(): Promise<void> {
        if (this.isConnected) {
            return;
        }

        try {
            await mongoose.connect(this.MONGO_URL);

            this.isConnected = true;

         
        } catch (error) {
            console.error("❌ MongoDB Connection Failed");

            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        try {
            await mongoose.disconnect();

            this.isConnected = false;

            console.log("MongoDB Disconnected");
        } catch (error) {
            console.error("Error while disconnecting MongoDB");

            throw error;
        }
    }
}

const dbConnection = new DatabaseConnection();

dbConnection.connect();

export default dbConnection;