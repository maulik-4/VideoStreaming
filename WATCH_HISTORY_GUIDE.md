# 🎬 Watch History Feature - Complete Implementation Guide

## 📋 Overview
This implementation provides a **production-ready** watch history system that tracks:
- ✅ **Local videos** hosted on your platform
- ✅ **YouTube videos** watched inside your app
- ✅ Resume playback functionality
- ✅ Duplicate prevention with upsert logic
- ✅ Automatic history cleanup (keeps latest 100 items)
- ✅ Privacy-focused (per-user, no external API access)

---

## 🚀 Quick Setup

### 1️⃣ Backend Setup (Already Done)

**Files Created:**
- `server/Modals/history.js` - Mongoose schema
- `server/Controllers/history.js` - API controllers
- `server/Routes/history.js` - Express routes
- `server/utils/youtubeService.js` - YouTube API integration
- `server/index.js` - Updated with history routes

### 2️⃣ Frontend Setup (Already Done)

**Files Created:**
- `client/src/Pages/History.jsx` - History page component
- `client/src/utils/historyTracker.js` - Tracking utility
- `client/src/Pages/Video_Page.jsx` - Updated with tracking
- `client/src/Pages/YouTubePlayer.jsx` - Updated with YouTube tracking
- `client/src/App.jsx` - Added history route
- `client/src/Components/Sidebar/Sidebar.jsx` - Added history link

### 3️⃣ Environment Variables

Add to `server/.env`:
```env
# YouTube Data API Key (Get from https://console.cloud.google.com/)
YOUTUBE_API_KEY=your_youtube_api_key_here
```

**How to get YouTube API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Create credentials (API Key)
5. Copy the API key to your `.env` file

> ⚠️ **Note:** YouTube history will work without API key, but metadata won't be fetched automatically.

---

## 📊 Database Schema

### History Model
```javascript
{
  user: ObjectId,              // User reference
  platform: 'local' | 'youtube', // Video source
  videoId: String,             // Video identifier
  title: String,               // Cached video title
  thumbnail: String,           // Cached thumbnail URL
  channelName: String,         // Creator/channel name
  uploadedBy: ObjectId,        // (local only) Uploader reference
  progress: Number,            // Watch progress (seconds)
  duration: Number,            // Total duration (seconds)
  firstWatchedAt: Date,        // Initial watch timestamp
  watchedAt: Date,             // Last watch timestamp (for sorting)
  completed: Boolean,          // True if watched > 90%
  watchCount: Number           // Number of times rewatched
}
```

**Indexes:**
- Compound unique: `{ user, videoId, platform }`
- Sort index: `{ user, watchedAt: -1 }`
- Performance index: `{ user: 1 }`

---

## 🔌 API Endpoints

### 1. Save/Update History
```http
POST /history
Authorization: Bearer <token>

Body:
{
  "videoId": "abc123",
  "platform": "local" | "youtube",
  "progress": 120,  // seconds
  "duration": 600,  // seconds
  "title": "Video Title",
  "thumbnail": "https://...",
  "channelName": "Channel Name"
}

Response:
{
  "success": true,
  "message": "History saved successfully",
  "data": { ...historyEntry }
}
```

**Features:**
- ✅ Upsert logic (updates if exists, creates if not)
- ✅ Minimum 5-second watch time threshold
- ✅ Auto-completion detection (> 90% watched)
- ✅ Automatic cleanup (keeps latest 100)

### 2. Get Watch History
```http
GET /history?page=1&limit=20&platform=local
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [...videos],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 95,
    "itemsPerPage": 20,
    "hasMore": true
  }
}
```

### 3. Get Single Video History (Resume)
```http
GET /history/video/:videoId?platform=local
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "progress": 120,
    "duration": 600,
    "watchPercentage": 20,
    ...
  }
}
```

### 4. Delete Single Item
```http
DELETE /history/:videoId?platform=local
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "History item deleted successfully"
}
```

### 5. Clear All History
```http
DELETE /history
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "History cleared successfully",
  "deletedCount": 42
}
```

### 6. Get YouTube Metadata
```http
GET /history/youtube/metadata/:videoId

Response:
{
  "success": true,
  "data": {
    "videoId": "dQw4w9WgXcQ",
    "title": "Video Title",
    "thumbnail": "https://...",
    "channelName": "Channel",
    "duration": 213,
    "publishedAt": "2023-01-01",
    ...
  }
}
```

---

## 💻 Frontend Usage

### History Page
Navigate to `/history` to view complete watch history with:
- ✅ Unified list (local + YouTube videos)
- ✅ Filter by platform
- ✅ Visual progress indicators
- ✅ Resume buttons for partially watched videos
- ✅ Delete individual items
- ✅ Clear all history
- ✅ Pagination support

### Video Player Integration

**Local Videos:**
```javascript
import historyTracker from '../utils/historyTracker';

// In your video component
const videoRef = useRef(null);

// Track on time update
const handleTimeUpdate = () => {
  const currentTime = videoRef.current.currentTime;
  const duration = videoRef.current.duration;
  
  historyTracker.trackProgress({
    videoId: id,
    platform: 'local',
    progress: currentTime,
    duration: duration,
    title: video.title,
    thumbnail: video.thumbnail,
    channelName: video.user.channelName
  });
};

<video 
  ref={videoRef}
  onTimeUpdate={handleTimeUpdate}
/>
```

**YouTube Videos:**
The `YouTubePlayer` component automatically:
- ✅ Tracks playback using YouTube IFrame API
- ✅ Updates progress every 10 seconds
- ✅ Saves position on pause/stop
- ✅ Shows resume prompt on load

---

## 🎯 Key Features Explained

### 1. Duplicate Prevention
```javascript
// Compound unique index ensures one entry per user+video
historySchema.index({ user: 1, videoId: 1, platform: 1 }, { unique: true });

// Upsert in controller
await History.findOneAndUpdate(
  { user, videoId, platform },
  { $set: { progress, watchedAt: new Date() } },
  { upsert: true, new: true }
);
```

### 2. Debounced Updates
```javascript
// Tracks progress with 5-second debounce
// Prevents excessive API calls
class HistoryTracker {
  DEBOUNCE_TIME = 5000;
  trackProgress({ videoId, platform, progress, ... }) {
    // Debounce logic
  }
}
```

### 3. Resume Playback
```javascript
// Load saved progress on video mount
const history = await historyTracker.getVideoHistory(videoId, platform);
if (history && history.watchPercentage > 5 && history.watchPercentage < 95) {
  videoRef.current.currentTime = history.progress;
}
```

### 4. Automatic Cleanup
```javascript
// Keeps only latest 100 items per user
historySchema.statics.cleanOldHistory = async function(userId, limit = 100) {
  const oldItems = await this.find({ user: userId })
    .sort({ watchedAt: -1 })
    .skip(limit);
  await this.deleteMany({ _id: { $in: oldItems.map(i => i._id) } });
};
```

---

## 🔒 Security & Privacy

### ✅ Implemented Safeguards
1. **Authentication Required** - All endpoints require valid JWT token
2. **User Isolation** - Users can only access their own history
3. **No YouTube Account Access** - Only tracks videos watched IN your app
4. **Public Metadata Only** - YouTube API fetches only public video info
5. **Rate Limiting Ready** - Debounced updates prevent API abuse
6. **Automatic Cleanup** - Old history auto-deleted (configurable limit)

### 🚫 What We DON'T Do
- ❌ Access user's YouTube watch history
- ❌ Track videos watched outside your app
- ❌ Store private YouTube user data
- ❌ Share history between users
- ❌ Keep indefinite history (auto-cleanup after 100 items)

---

## ⚡ Performance Optimizations

### Database Indexes
```javascript
// Fast user queries
{ user: 1 }

// Prevent duplicates
{ user: 1, videoId: 1, platform: 1 } (unique)

// Fast sorting and pagination
{ user: 1, watchedAt: -1 }
```

### Frontend Optimizations
- ✅ Debounced progress updates (5 seconds)
- ✅ Periodic tracking (30 seconds) vs every frame
- ✅ Lean queries (`.lean()`) for read-only data
- ✅ Pagination (default 20 items per page)
- ✅ Lazy loading video metadata

### YouTube API Optimization
- ✅ Metadata cached in history document
- ✅ Fallback to client-provided data
- ✅ Single API call per video (on first watch)
- ✅ 5-second timeout on API requests

---

## 🧪 Testing Guide

### 1. Test Local Video History
```bash
# Watch a local video for > 5 seconds
# Navigate to /history
# Verify video appears
# Click video to resume from saved position
```

### 2. Test YouTube Video History
```bash
# Click any YouTube video link in your app
# Watch for > 5 seconds
# Close and reopen
# Verify resume prompt appears
# Check /history page
```

### 3. Test Edge Cases
```bash
# Test < 5 second watch (should NOT save)
# Test completion detection (watch > 90%)
# Test rewatch (watch count increments)
# Test pagination (add 25+ videos)
# Test filter by platform
# Test delete single item
# Test clear all history
```

---

## 🐛 Troubleshooting

### History Not Saving
**Check:**
1. User is logged in (`localStorage.getItem('token')`)
2. Video watched > 5 seconds
3. Network tab shows POST to `/history` succeeding
4. MongoDB connection active

**Solution:**
```javascript
// Add console logs to historyTracker.js
console.log('Tracking:', { videoId, progress, duration });
```

### YouTube Metadata Not Loading
**Check:**
1. `YOUTUBE_API_KEY` set in `.env`
2. API key has "YouTube Data API v3" enabled
3. No quota exceeded errors in console

**Solution:**
```bash
# Check server logs for YouTube API errors
# Verify API key in Google Cloud Console
# Use fallback metadata if API unavailable
```

### Resume Not Working
**Check:**
1. Progress saved in database (check MongoDB)
2. `watchPercentage` between 5% and 95%
3. Video element `ref` properly set

**Solution:**
```javascript
// Add console log in loadResumeTime
console.log('Loaded resume time:', history);
```

---

## 📦 Package Requirements

### Backend (Already Installed)
```json
{
  "axios": "^1.x.x",      // For YouTube API calls
  "mongoose": "^7.x.x",   // Database ODM
  "express": "^4.x.x",    // Web framework
  "dotenv": "^16.x.x"     // Environment variables
}
```

### Frontend (May Need to Install)
```bash
cd client
npm install react-toastify  # Toast notifications
```

---

## 🎨 UI Components

### History Page Features
- **Progress Bars** - Visual indication of watch progress
- **Platform Badges** - "Local" vs "YouTube" labels
- **Resume Buttons** - Click to continue watching
- **Time Ago** - "2 hours ago", "3 days ago" formatting
- **Filter Tabs** - All / My Platform / YouTube
- **Pagination** - Page numbers with next/previous
- **Delete Actions** - Remove single or clear all

### Video Player Features
- **Resume Prompt** - Modal asking to resume or start over
- **Auto-tracking** - Invisible background progress tracking
- **Position Memory** - Remembers across sessions

---

## 🔄 Migration Guide

### For Existing Apps
If you already have users and videos:

1. **Run Server** - Schema auto-creates on first use
2. **No Migration Needed** - History starts fresh
3. **Optional: Pre-populate** - Can bulk import if needed

```javascript
// Optional: Bulk import existing views
const History = require('./Modals/history');

async function migrateExistingData() {
  const videos = await Video.find().populate('user');
  for (const video of videos) {
    // Create history for users who already watched
    // (This is optional - history can start fresh)
  }
}
```

---

## 📝 Customization Options

### Change History Limit
```javascript
// In Controllers/history.js - saveHistory function
await History.cleanOldHistory(userId, 200); // Keep 200 instead of 100
```

### Change Minimum Watch Time
```javascript
// In Controllers/history.js
const MIN_WATCH_TIME = 10; // Require 10 seconds instead of 5
```

### Change Tracking Frequency
```javascript
// In utils/historyTracker.js
UPDATE_INTERVAL = 60000; // Track every 60 seconds instead of 30
```

### Change Debounce Time
```javascript
// In utils/historyTracker.js
DEBOUNCE_TIME = 10000; // Wait 10 seconds before saving
```

---

## 🌐 API Rate Limits

### YouTube Data API
- **Free Quota:** 10,000 units/day
- **Video Details:** 1 unit per request
- **Cost per Watch:** 1 unit (first time only)

**Example Calculation:**
- 10,000 units = 10,000 new YouTube videos watched/day
- Metadata cached after first watch
- Far exceeds typical usage

---

## ✅ Production Checklist

- [ ] YouTube API key configured in `.env`
- [ ] MongoDB indexes created (auto-created on first use)
- [ ] Authentication middleware working
- [ ] CORS configured for your domain
- [ ] Error logging setup (e.g., Sentry)
- [ ] Rate limiting on `/history` endpoints (optional)
- [ ] Monitoring for API quota usage
- [ ] Privacy policy updated (mention watch history)
- [ ] GDPR compliance (add data export/delete)

---

## 🎓 Usage Examples

### Example 1: Track Custom Video Player
```javascript
import historyTracker from '../utils/historyTracker';

function CustomPlayer({ videoId, metadata }) {
  const handleProgress = (current, total) => {
    historyTracker.trackProgress({
      videoId,
      platform: 'local',
      progress: current,
      duration: total,
      title: metadata.title,
      thumbnail: metadata.thumbnail,
      channelName: metadata.channel
    });
  };

  return <video onTimeUpdate={e => 
    handleProgress(e.target.currentTime, e.target.duration)
  } />;
}
```

### Example 2: Get User Stats
```javascript
// Add custom endpoint to get watch statistics
router.get('/stats', authentication, async (req, res) => {
  const userId = req.user._id;
  
  const stats = await History.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$platform',
        count: { $sum: 1 },
        totalTime: { $sum: '$progress' }
      }
    }
  ]);
  
  res.json({ success: true, stats });
});
```

---

## 🤝 Contributing

### Adding New Features

**Example: Add "Watch Later" based on history**
```javascript
// Mark as watch later in history schema
watchLater: { type: Boolean, default: false }

// New endpoint
router.post('/history/watch-later/:videoId', authentication, async (req, res) => {
  await History.updateOne(
    { user: req.user._id, videoId: req.params.videoId },
    { watchLater: true }
  );
  res.json({ success: true });
});
```

---

## 📞 Support & Issues

### Common Questions

**Q: Does this track videos from YouTube.com?**
A: No, only YouTube videos watched INSIDE your app.

**Q: Can users export their history?**
A: Yes, add a simple endpoint:
```javascript
router.get('/history/export', authentication, async (req, res) => {
  const history = await History.find({ user: req.user._id });
  res.json({ history });
});
```

**Q: What if YouTube API quota exceeded?**
A: App uses fallback metadata (thumbnail from URL pattern).

**Q: Is history synced across devices?**
A: Yes, stored in database and tied to user account.

---

## 🎉 Congratulations!

You now have a **complete, production-ready watch history system** that:
- ✅ Tracks both local and YouTube videos
- ✅ Resumes playback automatically
- ✅ Prevents duplicates and cleans up old entries
- ✅ Respects user privacy
- ✅ Optimized for performance
- ✅ Ready to scale

**Next Steps:**
1. Add `YOUTUBE_API_KEY` to `.env`
2. Test with real videos
3. Monitor usage and adjust limits
4. Add analytics dashboard (optional)
5. Implement "Watch Later" (optional)

---

**Built with ❤️ for your MERN YouTube Platform**
