const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let count = 0; // Variable to track connected users
let chatLogs = []; // Array to store chat logs
let users = {}; // Object to store user status

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("New client connected");

  // Set initial status for the user
  socket.on("status", (status) => {
    users[socket.id] = {
      username: status.username,
      online: true,
      socket: socket,
    };
  });

  // Handle new user joining with a username
  socket.on("join", (username) => {
    users[socket.id] = {
      username: username,
      online: true,
      socket: socket,
    };

    const joinMessage = {
      user: "System",
      text: `${username} has joined the chat.`,
      time: new Date().toISOString(),
    };
    io.emit("message", joinMessage);

    // Notify offline users
    Object.keys(users).forEach((userId) => {
      const user = users[userId];
      if (!user.online && user.username === "<name>") {
        user.socket.emit("notification", `${username} has joined the chat.`);
      }
    });
  });

  socket.on("message", (message) => {
    const chatMessage = {
      user: users[socket.id].username,
      text: message,
      time: new Date().toISOString(),
    };
    io.emit("message", chatMessage);
    chatLogs.push(chatMessage);
  });

  socket.on("disconnect", () => {
    if (users[socket.id]) {
      const username = users[socket.id].username;
      delete users[socket.id];
      const leaveMessage = {
        user: "System",
        text: `${username} has left the chat.`,
        time: new Date().toISOString(),
      };
      io.emit("message", leaveMessage);
    }
  });
});

// Endpoint to retrieve chat logs
app.get("/chatlogs", (req, res) => {
  res.json(chatLogs);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
