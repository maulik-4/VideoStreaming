# YouTube Clone Backend

This is the backend for a full-stack MERN application that mimics some of the core functionalities of YouTube. It's built with Node.js, Express, and MongoDB, and includes features like user authentication, video management, subscriptions, watch history, and even AI-powered user analytics.

## Technologies Used

- **Node.js**: JavaScript runtime for the server.
- **Express.js**: Web framework for Node.js.
- **MongoDB**: NoSQL database for storing user and video data.
- **Mongoose**: ODM for MongoDB to model application data.
- **JWT (JSON Web Tokens)**: For secure user authentication and session management.
- **bcrypt.js**: For hashing user passwords.
- **Redis**: In-memory data store used for caching and rate limiting.
- **Groq API**: For AI-powered analysis of user watch history.
- **Dotenv**: For managing environment variables.
- **CORS**: To handle cross-origin requests from the frontend.

## Project Structure

The backend code is organized into the following directories:

- `Connection/`: Handles the connection to the MongoDB database.
- `Controllers/`: Contains the business logic for handling requests.
- `middlewares/`: Custom middleware for authentication, admin checks, and rate limiting.
- `Modals/`: Mongoose schemas for Users, Videos, and History.
- `Redis/`: Configuration for the Redis client.
- `Routes/`: Defines the API endpoints.
- `Services/`: Contains services for interacting with external APIs like Groq.
- `utils/`: Utility functions, like the YouTube service.

## Features and Implementation

### 1. Database Connection

The application connects to a MongoDB database using Mongoose. The connection logic is encapsulated in `Connection/conn.js`.

```javascript
// In Connection/conn.js
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
      await mongoose.connect(this.MONGO_URL, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
      });
      this.isConnected = true;
    } catch (err) {
      throw err;
    }
  }
}
```

### 2. User Authentication

Authentication is handled using JWT. When a user signs in, a token is generated and sent back as a cookie. This token is then used to authenticate subsequent requests.

#### User Signup & Login

- The `userSignup` function in `Controllers/user.js` handles new user registration. It hashes the password using `bcrypt` before saving it to the database.
- The `userSignin` function validates user credentials, and if successful, creates a JWT containing the `userId` and an optional `deviceId`.

```javascript
// In Controllers/user.js - userSignin
async userSignin(req, res) {
  try {
    const { userName, password, deviceId } = req.body;
    const userExist = await User.findOne({ userName });

    if (!userExist) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, userExist.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: userExist._id, deviceId }, 
      this.SECRET_KEY, 
      { expiresIn: '1h' }
    );
    
    res.cookie('token', token, {
      ...this.cookieOptions,
      maxAge: 3600000 // 1 hour
    });

    // ... respond with user data
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
}
```

#### Authentication Middleware

The `authenticate` middleware in `middlewares/authentication.js` protects routes. It checks for a valid JWT in the request cookies or the `Authorization` header.

```javascript
// In middlewares/authentication.js
async authenticate(req, res, next) {
  try {
    let token = req.cookies.token;
    
    if (!token && req.headers.authorization) {
      // ... logic to extract from header
    }
    
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token" });
    }

    const decoded = jwt.verify(token, this.SECRET_KEY);
    const user = await User.findById(decoded.userId);

    if (!user || user.isBlocked) {
      return res.status(401).json({ message: "Invalid token or user blocked" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
}
```

### 3. Video Management

This includes uploading, fetching, searching, and interacting with videos.

#### Video Upload

A user can upload a video by providing details like title, description, and links. This is handled in `Controllers/video.js`.

```javascript
// In Controllers/video.js - videoUpload
async videoUpload(req, res) {
  try {
    const { title, description, videoLink, category, thumbnail } = req.body;
    const videoUpload = new Video({
      user: req.user._id,
      title,
      description,
      videoLink,
      category,
      thumbnail
    });
    await videoUpload.save();
    res.status(201).json({ message: "Video uploaded successfully", data: videoUpload });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
}
```

#### Video Search

The search functionality uses MongoDB's `$regex` operator to find videos matching a query in the title, description, or category. The results are cached in Redis to improve performance for repeated searches.

```javascript
// In Controllers/video.js - searchVideos
async searchVideos(req, res) {
  try {
    const { q } = req.query;
    const CACHE_KEY = `search:${q.trim().toLowerCase()}`;

    // Try to get from cache
    const cachedResults = await redisClient.get(CACHE_KEY);
    if (cachedResults) {
      return res.status(200).json({ data: JSON.parse(cachedResults) });
    }

    // Search in database
    const videos = await Video.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    }).populate("user", "userName channelName profilePic");

    // Cache results
    await redisClient.set(CACHE_KEY, JSON.stringify(videos), { EX: 300 });

    res.status(200).json({ data: videos });
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
}
```

### 4. Watch History and Analytics

The application tracks user watch history for both internal and YouTube videos.

#### Saving History

The `saveHistory` controller in `Controllers/history.js` is an `upsert` operation. It creates a new history entry or updates an existing one for a user and a specific video. It also updates the completion status and cleans up old history entries.

```javascript
// In Controllers/history.js - saveHistory
const historyEntry = await History.findOneAndUpdate(
    { user: userId, videoId: String(videoId), platform },
    {
        $set: {
            ...videoData,
            progress: progress || 0,
            watchedAt: new Date()
        },
        $inc: { watchCount: 1 },
        $setOnInsert: { firstWatchedAt: new Date() }
    },
    { 
        upsert: true, 
        new: true,
        runValidators: true
    }
);
```

### 5. Caching with Redis

Redis is used to cache data that is frequently accessed but doesn't change often, such as the list of all videos on the homepage or search results. This reduces the load on the MongoDB database and speeds up response times.

```javascript
// In Controllers/video.js - getAllVideos
async getAllVideos(req, res) {
  const CACHE_KEY = "home:videos";

  try {
    // 1. Try fetching from Redis
    const cachedVideos = await redisClient.get(CACHE_KEY);
    if (cachedVideos) {
      return res.status(200).json({ data: JSON.parse(cachedVideos) });
    }

    // 2. Fetch from DB if not in cache
    const videos = await Video.find().populate("user", "userName channelName profilePic").lean();

    // 3. Store in Redis for future requests
    await redisClient.set(CACHE_KEY, JSON.stringify(videos), { EX: 300 }); // 5-minute cache

    // 4. Return response
    res.status(200).json({ data: videos });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
}
```

### 6. Rate Limiting

To prevent abuse, certain endpoints are rate-limited using a custom middleware that leverages Redis. This limits the number of requests a user or IP address can make in a given time window.

```javascript
// In middlewares/rateLimiter.js
static createLimiter(options) {
  return async (req, res, next) => {
    try {
      // ... logic to get identifier (IP or user ID)
      const key = `${options.keyPrefix}:${identifier}`;
      const current = await redisClient.get(key);
      const currentCount = current ? parseInt(current) : 0;

      if (currentCount >= options.maxRequests) {
        return res.status(429).json({ message: options.message });
      }

      // Increment counter in Redis
      if (currentCount === 0) {
        await redisClient.set(key, 1, { EX: options.windowMs / 1000 });
      } else {
        await redisClient.incr(key);
      }

      next();
    } catch (error) {
      next(); // Fail open if Redis is down
    }
  };
}
```

### 7. AI-Powered Analysis

A unique feature of this backend is its ability to analyze a user's watch history using the Groq LLM API. It provides insights into the user's interests, learning patterns, and recommends new topics.

```javascript
// In Services/llmService.js
const getLLMAnalysis = async (prompt) => {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const chatCompletion = await groq.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: `You are a user behavior analyst... Your task is to analyze user watch history and provide structured insights in JSON format.`
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        model: 'llama3-8b-8192',
        response_format: { type: 'json_object' },
    });

    return JSON.parse(chatCompletion.choices[0].message.content);
};
```

## API Endpoints

- `POST /auth/signup`: Register a new user.
- `POST /auth/login`: Log in a user.
- `GET /auth/logout`: Log out a user.
- `POST /auth/subscribe/:id`: Subscribe to a channel.
- `POST /api/upload`: Upload a new video.
- `GET /api/getAllVideos`: Get all videos (cached).
- `GET /api/search`: Search for videos (cached).
- `POST /history`: Save watch history.
- `GET /history`: Get user's watch history.
- `GET /api/analysis/:userId`: Get AI-powered analysis of user's watch history.

## Setup and Running Locally

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file** in the `server` directory with the following variables:
    ```
    PORT=9999
    MONGO_URL=<your_mongodb_connection_string>
    SECRET_KEY=<your_jwt_secret>
    REDIS_URL=<your_redis_connection_string>
    GROQ_API_KEY=<your_groq_api_key>
    YOUTUBE_API_KEY=<your_youtube_data_api_key>
    ```
4.  **Start the server:**
    ```bash
    npm start
    ```

The server will be running on the port specified in your `.env` file.
