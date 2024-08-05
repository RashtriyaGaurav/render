const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let count = 0; // Variable to track connected users
let chatLogs = []; // Array to store chat logs

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("New client connected");

  // Increase count and emit to all clients
  count++;
  io.emit("userCount", count);

  // Handle new user joining with a username
  socket.on("join", (username) => {
    socket.username = username;
    const joinMessage = {
      user: "System",
      text: `${username} has joined the chat.`,
      time: new Date().toISOString(),
    };
    io.emit("message", joinMessage);
    chatLogs.push(joinMessage);
  });

  socket.on("message", (message) => {
    const chatMessage = {
      user: socket.username,
      text: message,
      time: new Date().toISOString(),
    };
    io.emit("message", chatMessage);
    chatLogs.push(chatMessage);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    const leaveMessage = {
      user: "System",
      text: `${socket.username} has left the chat.`,
      time: new Date().toISOString(),
    };
    io.emit("message", leaveMessage);
    chatLogs.push(leaveMessage);

    // Decrease count and emit to all clients
    count--;
    io.emit("userCount", count);
  });
});

// Endpoint to retrieve chat logs
app.get("/chatlogs", (req, res) => {
  res.json(chatLogs);
});

// Keep-alive endpoint
app.get('/keep-alive', (req, res) => {
  res.send('Server is alive');
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
