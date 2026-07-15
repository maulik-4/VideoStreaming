const mongoose = require('mongoose');
require('dotenv').config();

class DatabaseConnection {
  constructor() {
    this.MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/Youtube-Backend';
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      return;
    }

    try {
      mongoose.connect(process.env.MONGO_URL);
      this.isConnected = true;
      
    } catch (err) {
      
      throw err;
    }
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      
    } catch (err) {
      
      throw err;
    }
  }
}

const dbConnection = new DatabaseConnection();
dbConnection.connect();

module.exports = dbConnection;