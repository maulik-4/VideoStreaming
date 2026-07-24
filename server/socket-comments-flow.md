# Real-Time Comments — Socket.io Flow (Vidmo)

This document explains how live comments work end-to-end: server setup, room logic, comment posting, and client-side updates.

---

## 1. High-Level Flow

```
User A posts comment
        │
        ▼
POST /api/:id/comments  ───────►  Server saves comment to MongoDB
        │                                   │
        │                                   ▼
        │                        getIO().to(videoId).emit("new-comment", {...})
        │                                   │
        ▼                                   ▼
Response to User A            Broadcast to everyone in room "videoId"
                                             │
                              ┌──────────────┴──────────────┐
                              ▼                              ▼
                        User A's socket                User B's socket
                     (also in the room)              (also in the room)
                              │                              │
                              ▼                              ▼
                  socket.on("new-comment")         socket.on("new-comment")
                              │                              │
                              ▼                              ▼
                     setvideo_Data(...)               setvideo_Data(...)
                    UI updates for A                  UI updates for B
```

The key idea: **nobody updates their own UI directly after posting.** Everyone — including the poster — waits for the `new-comment` socket event. This guarantees everyone sees the exact same data, in the same order, at (roughly) the same time.

---

## 2. Server Side

### 2.1 `index.js` — Creating the Socket Server

```javascript
this.server = http.createServer(this.app);
...
this.io = new SocketServer(this.server, {
  cors: {
    origin: [...],
    credentials: true
  }
});
setIO(this.io);
```

- Socket.io is attached to the **same HTTP server** as Express (`this.server`), not a separate port. This is standard — both HTTP requests and WebSocket upgrades go through one server.
- `setIO(this.io)` stores the `io` instance in a shared module (`Socket/socket.js`) so any other file (like your controller) can access it **without circular imports**.

### 2.2 Room Join / Leave

```javascript
this.io.on("connection", (socket) => {
  socket.on("join-video", (videoId) => {
    socket.join(videoId);
  });

  socket.on("leave-video", (videoId) => {
    socket.leave(videoId);
  });
});
```

- Every connected client gets a unique `socket`.
- `socket.join(videoId)` puts that socket into a **room** named after the video's ID. Rooms are just in-memory groupings maintained by socket.io — not a database concept.
- Rooms let you broadcast to *only* the people watching a specific video, instead of every connected user on the entire site.

### 2.3 `Socket/socket.js` — Sharing the `io` Instance

```javascript
let io;
const setIO = (socketInstance) => { io = socketInstance; };
const getIO = () => {
  if (!io) throw new Error("Socket.io has not been initialized");
  return io;
};
module.exports = { setIO, getIO };
```

- This is a simple singleton pattern. `index.js` sets it once at startup; any controller can call `getIO()` later to emit events — without needing to pass `io` through every function call manually.

### 2.4 `postController.js` — Emitting the Comment

```javascript
async addComment(req, res) {
  const { id } = req.params;
  const { text } = req.body;

  const video = await Video.findById(id);
  video.comments.push({ user: req.user._id, text });
  await video.save();

  await video.populate({
    path: "comments.user",
    select: "userName channelName profilePic"
  });

  const newComment = video.comments[video.comments.length - 1];

  getIO().to(id).emit("new-comment", {
    videoId: id,
    comment: newComment
  });

  return res.status(201).json({ message: "Comment added", comment: newComment });
}
```

Step by step:
1. Comment is saved to MongoDB first — the database is the source of truth.
2. `.populate(...)` fills in the commenter's user details (name, avatar) so the frontend doesn't need a second request.
3. `getIO().to(id).emit("new-comment", {...})` broadcasts to **every socket currently in the room named `id`** — this is the video's `_id`, which doubles as the room name.
4. The HTTP response (`res.status(201)...`) just confirms success to the poster's browser — it is **not** what updates the UI. The UI update comes from the socket event.

---

## 3. Client Side

### 3.1 `utils/socket.js` — The Shared Socket Instance

```javascript
import { io } from "socket.io-client";

const socket = io(baseURL, { withCredentials: true });

export default socket;
```

- This file is imported everywhere the app needs socket access. Because ES modules are cached, importing this file from multiple components reuses the **same single connection** — you don't get a new socket per component.

### 3.2 `VideoPage.jsx` — Joining the Room

```javascript
useEffect(() => {
  if (!id) return;

  const handleJoin = () => {
    socket.emit("join-video", id);
  };

  if (socket.connected) handleJoin();

  socket.on("connect", handleJoin);

  return () => {
    socket.emit("leave-video", id);
    socket.off("connect", handleJoin);
  };
}, [id]);
```

- On mount (or when `id` changes, e.g. navigating to a different video), the client asks the server to `join-video`.
- `socket.on("connect", handleJoin)` re-joins automatically if the connection drops and reconnects (e.g. after a server cold start on Render's free tier) — without this, a reconnect would silently leave the user out of the room with no comments arriving.
- On unmount/navigation away, it emits `leave-video` and removes the listener to avoid duplicate joins or memory leaks.

### 3.3 `VideoPage.jsx` — Listening for New Comments

```javascript
useEffect(() => {
  const handleNewComment = (data) => {
    if (data.videoId !== id) return;

    setvideo_Data((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: [...(prev.comments || []), data.comment],
      };
    });
  };

  socket.on("new-comment", handleNewComment);

  return () => {
    socket.off("new-comment", handleNewComment);
  };
}, [id]);
```

- `data.videoId !== id` is a safety check — since one socket connection *could* theoretically receive stray events, this ensures the update only applies if it matches the video currently open.
- State is updated **functionally** (`(prev) => {...}`) rather than referencing `video_Data` directly, avoiding stale-closure bugs common in React + socket listeners.
- Cleanup (`socket.off`) on unmount prevents duplicate listeners from stacking up if the component remounts.

### 3.4 `postComment` — Posting Without Touching Local State

```javascript
const postComment = async () => {
  const token = localStorage.getItem("token");
  if (!token) return toast.error("Please login to comment");

  await axiosInstance.post(`/api/${id}/comments`, { text: commentText });

  setCommentText("");
  toast.success("Comment added");
};
```

- Notice this function **never calls `setvideo_Data(...)`**. It only clears the input and shows a toast.
- The actual comment appearing in the list happens entirely through the `new-comment` socket listener above — for the poster too, since their own socket is also a member of the room.

---

## 4. Why the Original Bug Happened

Your symptom was: comment shows for the poster, but not for others.

The root cause traced back to **Render's free-tier cold starts**:

1. The backend spins down after inactivity.
2. A request wakes it up — a brand-new Node process boots with an **empty in-memory room map** (socket.io rooms live in memory, not the database, so they don't survive restarts).
3. Existing client sockets were still pointing at the dead process. They had to detect the disconnect and reconnect to the new instance.
4. If a comment was posted before all clients finished reconnecting and re-running `join-video`, the room was empty (`ALL ROOMS: []`) at emit time — so `getIO().to(id).emit(...)` had nobody to broadcast to.

Once the server was kept warm and both clients had time to fully reconnect and rejoin their rooms before posting, the room correctly contained every socket watching that video, and the broadcast reached everyone.

**Takeaway:** socket.io room state is ephemeral and tied to server process lifetime. Any deploy, restart, or cold start wipes all rooms — every client must rejoin, and that rejoin isn't instantaneous.

---

## 5. Event Reference

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `join-video` | client → server | `videoId` (string) | Adds socket to the video's room |
| `leave-video` | client → server | `videoId` (string) | Removes socket from the room |
| `connect` | server → client (built-in) | — | Fires on (re)connection; used to re-run room join |
| `new-comment` | server → client (room broadcast) | `{ videoId, comment }` | Notifies everyone in the room of a new comment |
| `edit-comment` | server → client (room broadcast) | `{ videoId, commentId, text, edited }` | Notifies everyone of an edited comment |
