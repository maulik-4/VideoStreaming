const { io } = require("socket.io-client");

const socket1 = io("http://localhost:9999");
const socket2 = io("http://localhost:9999");

const videoId = "test-video-123";

socket1.on("connect", () => {
    console.log("Socket 1 connected:", socket1.id);
    socket1.emit("join-video", videoId);
});

socket2.on("connect", () => {
    console.log("Socket 2 connected:", socket2.id);
    socket2.emit("join-video", videoId);
    
    // After both join, simulate an API call by emitting from socket1? No, the server API emits.
    // We can't easily trigger the API without the DB. 
    // Let's just listen to events.
});

socket1.on("new-comment", (data) => {
    console.log("Socket 1 received new-comment:", data);
});

socket2.on("new-comment", (data) => {
    console.log("Socket 2 received new-comment:", data);
});

// We need a way to trigger a broadcast from the server to test it.
// Let's add a test event in server/index.js temporarily?
