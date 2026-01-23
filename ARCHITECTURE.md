# 🎬 Watch History - System Architecture

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  Video_Page  │    │ YouTubePlayer│    │   History    │     │
│  │   (Local)    │    │  (YouTube)   │    │    Page      │     │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│         │                    │                    │              │
│         └────────────────────┴────────────────────┘              │
│                              │                                   │
│                    ┌─────────▼─────────┐                        │
│                    │ historyTracker.js │                        │
│                    │  (Debounce/Queue) │                        │
│                    └─────────┬─────────┘                        │
│                              │                                   │
│                    ┌─────────▼─────────┐                        │
│                    │  axiosInstance    │                        │
│                    │   (API Client)    │                        │
│                    └─────────┬─────────┘                        │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                        HTTP Requests
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                      BACKEND (Express)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   Routes (/history)                        │ │
│  │                                                            │ │
│  │  POST   /history              - Save/Update History       │ │
│  │  GET    /history              - Get User History          │ │
│  │  GET    /history/video/:id    - Get Single Video History  │ │
│  │  DELETE /history/:id          - Delete Single Item        │ │
│  │  DELETE /history              - Clear All History         │ │
│  │  GET    /youtube/metadata/:id - Get YouTube Info          │ │
│  └───────────────────┬───────────────────────────────────────┘ │
│                      │                                          │
│  ┌───────────────────▼───────────────────────────────────────┐ │
│  │           Middleware (authentication.js)                   │ │
│  │           - Verify JWT Token                               │ │
│  │           - Extract User ID                                │ │
│  └───────────────────┬───────────────────────────────────────┘ │
│                      │                                          │
│  ┌───────────────────▼───────────────────────────────────────┐ │
│  │              Controllers (history.js)                      │ │
│  │                                                            │ │
│  │  saveHistory()      - Upsert logic, auto-cleanup          │ │
│  │  getHistory()       - Pagination, filtering               │ │
│  │  deleteHistoryItem()- Delete single item                  │ │
│  │  clearHistory()     - Delete all user history             │ │
│  │  getHistoryItem()   - Get specific video history          │ │
│  └───────────────────┬───────────────────────────────────────┘ │
│                      │                                          │
│         ┌────────────┴────────────┐                            │
│         │                         │                            │
│  ┌──────▼──────┐         ┌───────▼────────┐                   │
│  │   MongoDB   │         │ YouTube API    │                   │
│  │  (History)  │         │   Service      │                   │
│  └─────────────┘         └────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1️⃣ Save History Flow (Local Video)

```
User Watches Video (> 5 seconds)
         │
         ▼
Video onTimeUpdate Event
         │
         ▼
historyTracker.trackProgress()
         │
         ├─── Check if progress > 5 seconds
         ├─── Debounce (5 seconds)
         │
         ▼
POST /history
         │
         ▼
Authentication Middleware
         │
         ▼
history.saveHistory()
         │
         ├─── Fetch video metadata from MongoDB
         ├─── Upsert (update or insert)
         ├─── Update watchedAt
         ├─── Increment watchCount
         ├─── Auto-cleanup (keep latest 100)
         │
         ▼
Save to MongoDB (histories collection)
         │
         ▼
Return success response
         │
         ▼
Frontend (silently continues)
```

### 2️⃣ Save History Flow (YouTube Video)

```
User Watches YouTube Video
         │
         ▼
YouTube IFrame API (onStateChange)
         │
         ▼
Track every 10 seconds while playing
         │
         ▼
historyTracker.trackProgress()
         │
         ├─── Include video metadata (title, thumbnail, channel)
         ├─── Debounce (5 seconds)
         │
         ▼
POST /history
         │
         ▼
Authentication Middleware
         │
         ▼
history.saveHistory()
         │
         ├─── Use provided metadata (or fetch from YouTube API)
         ├─── Upsert to prevent duplicates
         ├─── Platform = 'youtube'
         │
         ▼
Save to MongoDB
         │
         ▼
Return success
```

### 3️⃣ Resume Playback Flow

```
User Opens Video Page
         │
         ▼
Component Mount (useEffect)
         │
         ▼
GET /history/video/:id?platform=local
         │
         ▼
Authentication Middleware
         │
         ▼
history.getHistoryItem()
         │
         ├─── Find history by user + videoId + platform
         ├─── Check if 5% < watchPercentage < 95%
         │
         ▼
Return { progress: 120, watchPercentage: 20 }
         │
         ▼
Frontend: Show Resume Prompt
         │
         ├─── "Resume from 2:00?"
         │
User Clicks "Resume" ────────┐
         │                   │
         ▼                   ▼
Video seeks to progress   Start Over (progress = 0)
```

### 4️⃣ View History Flow

```
User Clicks "History" in Sidebar
         │
         ▼
Navigate to /history
         │
         ▼
History Component Mount
         │
         ▼
GET /history?page=1&limit=20
         │
         ▼
Authentication Middleware
         │
         ▼
history.getHistory()
         │
         ├─── Query: { user: userId }
         ├─── Sort: { watchedAt: -1 } (most recent first)
         ├─── Pagination: skip & limit
         ├─── Populate: uploadedBy (for local videos)
         │
         ▼
Return paginated results
         │
         ▼
Frontend Renders List
         │
         ├─── Show thumbnails
         ├─── Show progress bars
         ├─── Show platform badges
         ├─── Show time ago
         │
         ▼
User Can:
  - Click video → Resume watching
  - Click delete → Remove from history
  - Click "Clear All" → Delete all history
  - Filter by platform
  - Navigate pages
```

---

## 🗄️ Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                    histories Collection                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  _id: ObjectId                     [Primary Key]            │
│  user: ObjectId                    [Index, Required]  ─────┐│
│  videoId: String                   [Required]              ││
│  platform: 'local' | 'youtube'     [Required]              ││
│                                                             ││
│  ┌─── Compound Unique Index ───────────────────────────┐   ││
│  │  { user: 1, videoId: 1, platform: 1 }              │   ││
│  │  Prevents duplicate history entries                │   ││
│  └─────────────────────────────────────────────────────┘   ││
│                                                             ││
│  title: String                     [Required, Cached]      ││
│  thumbnail: String                 [Required, Cached]      ││
│  channelName: String               [Required, Cached]      ││
│  uploadedBy: ObjectId              [Optional, Local only] ││
│                                                             ││
│  progress: Number                  [Seconds watched]       ││
│  duration: Number                  [Total video length]    ││
│                                                             ││
│  firstWatchedAt: Date              [Initial watch time]    ││
│  watchedAt: Date                   [Last watch - Index] ───┘│
│                                                              │
│  completed: Boolean                [> 90% watched]          │
│  watchCount: Number                [Rewatch counter]        │
│                                                              │
│  createdAt: Date                   [Auto - timestamps]      │
│  updatedAt: Date                   [Auto - timestamps]      │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Relationships:
  - histories.user → users._id
  - histories.uploadedBy → users._id (local videos only)
  - histories.videoId → videos._id (local) or YouTube ID (youtube)
```

---

## 🔐 Security Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Security Layers                        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. Authentication (JWT)                                 │
│     ├─ Token required for all history endpoints         │
│     ├─ Token contains user ID                           │
│     └─ Verified by authentication middleware            │
│                                                           │
│  2. Authorization (User Isolation)                       │
│     ├─ req.user._id extracted from token                │
│     ├─ Only query history where user = req.user._id     │
│     └─ Users cannot access other users' history         │
│                                                           │
│  3. Data Privacy                                         │
│     ├─ No YouTube account data accessed                 │
│     ├─ Only track videos watched IN your app            │
│     ├─ YouTube API fetches only public metadata         │
│     └─ History automatically cleaned (latest 100)       │
│                                                           │
│  4. Input Validation                                     │
│     ├─ Mongoose schema validation                       │
│     ├─ Platform enum: only 'local' or 'youtube'         │
│     ├─ Progress/duration must be numbers                │
│     └─ Required fields enforced                         │
│                                                           │
│  5. Rate Limiting (Recommended)                          │
│     ├─ Debounce on frontend (5 seconds)                 │
│     ├─ Express rate limiting (optional)                 │
│     └─ YouTube API quota management                     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## ⚡ Performance Optimizations

```
┌──────────────────────────────────────────────────────────┐
│                  Performance Strategy                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Frontend Optimizations:                                 │
│  ├─ Debouncing (5s) - Reduce API calls                  │
│  ├─ Periodic tracking (30s) - Not every frame           │
│  ├─ Silent failures - Don't disrupt UX on error         │
│  ├─ Pagination - Load 20 items at a time                │
│  └─ Lazy metadata loading - Only when needed            │
│                                                           │
│  Backend Optimizations:                                  │
│  ├─ Indexes:                                             │
│  │  ├─ { user: 1 } - Fast user queries                  │
│  │  ├─ { user: 1, watchedAt: -1 } - Fast sorting        │
│  │  └─ { user: 1, videoId: 1, platform: 1 } - Unique    │
│  ├─ Upsert - Single operation vs find + update          │
│  ├─ Lean queries - No Mongoose overhead for reads       │
│  ├─ Populate only needed fields                         │
│  └─ Aggregate for statistics                            │
│                                                           │
│  Database Optimizations:                                 │
│  ├─ Compound indexes - Efficient lookups                │
│  ├─ Auto-cleanup - Keep collection small (100/user)     │
│  ├─ Caching metadata - Avoid repeated API calls         │
│  └─ Pagination - Limit data transfer                    │
│                                                           │
│  YouTube API Optimizations:                              │
│  ├─ Cache metadata in history document                  │
│  ├─ Fallback to client-provided data                    │
│  ├─ Single API call per video (first watch only)        │
│  ├─ 5-second timeout on API requests                    │
│  └─ Graceful degradation if quota exceeded              │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 Scalability Considerations

```
Current Implementation:
├─ Supports unlimited users
├─ 100 history items per user (configurable)
├─ 10,000 YouTube API calls/day (free tier)
└─ MongoDB scales horizontally

Estimated Capacity:
├─ 10,000 active users
├─ 1M history entries total
├─ ~50 history updates/second
└─ < 200ms average response time

If You Need More:
├─ Increase history limit per user (200, 500, etc.)
├─ Add Redis caching for frequent queries
├─ Implement YouTube metadata caching service
├─ Upgrade YouTube API quota (paid tier)
├─ Add read replicas for MongoDB
└─ Implement CDN for thumbnails
```

---

## 🔄 State Management

```
Frontend State Flow:

┌─────────────────────────────────────────────────────────┐
│                    History Page                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  State Variables:                                       │
│  ├─ history: []          - Array of history items       │
│  ├─ loading: true        - Loading indicator            │
│  ├─ page: 1              - Current page number          │
│  ├─ hasMore: false       - More items available?        │
│  ├─ totalPages: 0        - Total pages                  │
│  └─ platformFilter: ''   - Selected platform filter     │
│                                                          │
│  Effects:                                               │
│  ├─ useEffect(() => fetchHistory(), [page, filter])    │
│  └─ Cleanup: historyTracker.flush()                    │
│                                                          │
│  Actions:                                               │
│  ├─ fetchHistory()       - GET /history                 │
│  ├─ deleteItem()         - DELETE /history/:id          │
│  ├─ clearAll()           - DELETE /history              │
│  └─ handleVideoClick()   - Navigate to video            │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   Video Player                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  State Variables:                                       │
│  ├─ resumeTime: 0         - Saved watch position        │
│  ├─ showResumePrompt: false - Show resume dialog       │
│  └─ videoRef: useRef()    - Video element reference    │
│                                                          │
│  Effects:                                               │
│  ├─ useEffect(() => loadResumeTime(), [videoId])       │
│  ├─ useEffect(() => cleanup(), [])                     │
│  └─ onTimeUpdate event - Track progress                │
│                                                          │
│  Actions:                                               │
│  ├─ handleTimeUpdate()   - historyTracker.trackProgress│
│  ├─ handleResumeClick()  - Seek to resumeTime          │
│  └─ cleanup()            - historyTracker.flush()      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Relationships

```
App.jsx
  │
  ├─── Sidebar.jsx
  │      └─── History Link (onClick → /history)
  │
  ├─── Routes
  │      │
  │      ├─── /history → History.jsx
  │      │      ├─ Fetches: GET /history
  │      │      ├─ Displays: Paginated list
  │      │      ├─ Actions: Delete, Clear, Filter
  │      │      └─ Navigate: Click video → /watch/:id
  │      │
  │      ├─── /watch/:id → Video_Page.jsx
  │      │      ├─ Uses: historyTracker
  │      │      ├─ Tracks: Progress via onTimeUpdate
  │      │      ├─ Loads: Resume time on mount
  │      │      └─ Displays: Resume prompt
  │      │
  │      └─── /youtube/:id → YouTubePlayer.jsx
  │             ├─ Uses: historyTracker
  │             ├─ Tracks: Via YouTube IFrame API
  │             ├─ Loads: Resume time on mount
  │             └─ Displays: Resume prompt
  │
  └─── historyTracker.js (Shared Utility)
         ├─ trackProgress() - Debounced saving
         ├─ getVideoHistory() - Fetch resume time
         └─ flush() - Save pending updates
```

---

## 📈 Monitoring & Analytics

```
Key Metrics to Track:

Usage Metrics:
├─ Total history entries
├─ Average entries per user
├─ Most watched videos
├─ Platform distribution (local vs YouTube)
└─ Completion rate (% videos watched fully)

Performance Metrics:
├─ API response times
│  ├─ POST /history: < 100ms
│  ├─ GET /history: < 200ms
│  └─ GET /history/video: < 50ms
├─ Database query times
└─ YouTube API response times

Error Metrics:
├─ Failed history saves
├─ YouTube API errors
├─ Authentication failures
└─ Database connection errors

Business Metrics:
├─ Resume rate (% of users using resume)
├─ History page visits
├─ Videos per session
└─ User retention (related to history usage)
```

---

**This architecture provides a scalable, secure, and performant watch history system!** 🚀
