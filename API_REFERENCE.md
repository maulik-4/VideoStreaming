# 📡 Watch History API Reference

Base URL: `http://localhost:9999` (or your server URL)

## Authentication
All endpoints except YouTube metadata require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. 💾 Save/Update Watch History
```http
POST /history
Content-Type: application/json
Authorization: Bearer <token>

{
  "videoId": "string",                    // Required
  "platform": "local" | "youtube",        // Required
  "progress": number,                     // Required (seconds)
  "duration": number,                     // Required (seconds)
  "title": "string",                      // Optional*
  "thumbnail": "string",                  // Optional*
  "channelName": "string"                 // Optional*
}

* For local videos, these are fetched automatically
* For YouTube, provide these to avoid API call
```

**Response:**
```json
{
  "success": true,
  "message": "History saved successfully",
  "data": {
    "_id": "...",
    "user": "...",
    "videoId": "abc123",
    "platform": "local",
    "title": "My Video",
    "thumbnail": "https://...",
    "channelName": "Creator",
    "progress": 120,
    "duration": 600,
    "watchedAt": "2024-01-23T...",
    "watchCount": 1,
    "completed": false,
    "watchPercentage": 20
  }
}
```

**Rules:**
- ✅ Updates if video already in history (upsert)
- ✅ Ignores if progress < 5 seconds
- ✅ Auto-marks completed if progress > 90%
- ✅ Increments watchCount on rewatch
- ✅ Auto-cleans to keep latest 100 items

---

### 2. 📜 Get Watch History
```http
GET /history?page=1&limit=20&platform=local
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)
- `platform` (optional) - Filter by 'local' or 'youtube'

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "videoId": "abc123",
      "platform": "local",
      "title": "My Video",
      "thumbnail": "https://...",
      "channelName": "Creator",
      "progress": 120,
      "duration": 600,
      "watchedAt": "2024-01-23T...",
      "watchCount": 1,
      "completed": false,
      "watchPercentage": 20
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 95,
    "itemsPerPage": 20,
    "hasMore": true
  }
}
```

---

### 3. 🎯 Get Single Video History
```http
GET /history/video/:videoId?platform=local
Authorization: Bearer <token>
```

**Use Case:** Check if user has watched this video before (for resume)

**Response:**
```json
{
  "success": true,
  "data": {
    "videoId": "abc123",
    "platform": "local",
    "progress": 120,
    "duration": 600,
    "watchPercentage": 20,
    "watchedAt": "2024-01-23T...",
    ...
  }
}
```

**404 if not found**

---

### 4. 🗑️ Delete Single History Item
```http
DELETE /history/:videoId?platform=local
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "History item deleted successfully",
  "data": { ...deletedItem }
}
```

---

### 5. 🧹 Clear All History
```http
DELETE /history
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "History cleared successfully",
  "deletedCount": 42
}
```

---

### 6. 📺 Get YouTube Video Metadata
```http
GET /history/youtube/metadata/:videoId
```

**No authentication required**

**Response:**
```json
{
  "success": true,
  "data": {
    "videoId": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up",
    "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    "channelName": "Rick Astley",
    "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
    "duration": 213,
    "publishedAt": "2009-10-25T06:57:33Z",
    "description": "...",
    "viewCount": 1000000
  }
}
```

**Requires:** `YOUTUBE_API_KEY` in server `.env`

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "videoId and platform are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "History item not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Failed to save history",
  "error": "Detailed error message"
}
```

---

## Example: Full Flow

### 1. User Starts Watching Local Video
```javascript
// Frontend sends progress every 30 seconds
POST /history
{
  "videoId": "507f1f77bcf86cd799439011",
  "platform": "local",
  "progress": 30,
  "duration": 600
}
// Backend fetches video details automatically
```

### 2. User Stops at 2 Minutes
```javascript
POST /history
{
  "videoId": "507f1f77bcf86cd799439011",
  "platform": "local",
  "progress": 120,
  "duration": 600
}
// Updates existing entry (upsert)
```

### 3. User Returns Later
```javascript
// Check for saved progress
GET /history/video/507f1f77bcf86cd799439011?platform=local

// Response: { progress: 120, watchPercentage: 20 }
// Frontend shows "Resume from 2:00?"
```

### 4. View All History
```javascript
GET /history?page=1&limit=20

// Returns paginated list sorted by latest watched
```

---

## Rate Limits (Recommended)

```javascript
// Add to server/index.js
const rateLimit = require('express-rate-limit');

const historyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many history updates, please slow down'
});

app.use('/history', historyLimiter);
```

---

## Testing with cURL

### Save History
```bash
curl -X POST http://localhost:9999/history \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "videoId": "abc123",
    "platform": "local",
    "progress": 60,
    "duration": 300
  }'
```

### Get History
```bash
curl -X GET http://localhost:9999/history?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Delete Item
```bash
curl -X DELETE http://localhost:9999/history/abc123?platform=local \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Frontend Integration Examples

### Using Axios
```javascript
import axiosInstance from './utils/axiosConfig';

// Save progress
await axiosInstance.post('/history', {
  videoId: 'abc123',
  platform: 'local',
  progress: 120,
  duration: 600
});

// Get history
const { data } = await axiosInstance.get('/history', {
  params: { page: 1, limit: 20 }
});

// Delete item
await axiosInstance.delete(`/history/${videoId}`, {
  params: { platform: 'local' }
});
```

### Using Fetch
```javascript
// Save progress
fetch('http://localhost:9999/history', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    videoId: 'abc123',
    platform: 'local',
    progress: 120,
    duration: 600
  })
});
```

---

## Database Queries (For Backend)

### Get User's Total Watch Time
```javascript
const totalTime = await History.aggregate([
  { $match: { user: userId } },
  { $group: { _id: null, total: { $sum: '$progress' } } }
]);
```

### Get Most Watched Videos
```javascript
const popular = await History.aggregate([
  { $match: { user: userId } },
  { $sort: { watchCount: -1 } },
  { $limit: 10 }
]);
```

### Count by Platform
```javascript
const counts = await History.aggregate([
  { $match: { user: userId } },
  { $group: { _id: '$platform', count: { $sum: 1 } } }
]);
```

---

**Quick Tip:** Use the `historyTracker` utility on frontend instead of calling API directly. It handles debouncing and optimization automatically!
