const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
const mongoUri = 'mongodb+srv://rashtriyahello:Df3qDh3oXwtg6cqr@cluster0.xjz2hmo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Replace with your MongoDB URI
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const chatSchema = new mongoose.Schema({
  user: String,
  text: String,
  time: String
});

const ChatLog = mongoose.model('ChatLog', chatSchema);

let count = 0; // Variable to track connected users

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("New client connected");

  // Increase count and emit to all clients
  count++;
  io.emit("userCount", count);

  // Handle new user joining with a username
  socket.on("join", async (username) => {
    socket.username = username;
    const joinMessage = {
      user: "System",
      text: `${username} has joined the chat.`,
      time: new Date().toISOString(),
    };
    io.emit("message", joinMessage);

    // Save to MongoDB
    await new ChatLog(joinMessage).save();
  });

  socket.on("message", async (message) => {
    const chatMessage = {
      user: socket.username,
      text: message,
      time: new Date().toISOString(),
    };
    io.emit("message", chatMessage);

    // Save to MongoDB
    await new ChatLog(chatMessage).save();
  });

  socket.on("disconnect", async () => {
    console.log("Client disconnected");
    const leaveMessage = {
      user: "System",
      text: `${socket.username} has left the chat.`,
      time: new Date().toISOString(),
    };
    io.emit("message", leaveMessage);

    // Save to MongoDB
    await new ChatLog(leaveMessage).save();

    // Decrease count and emit to all clients
    count--;
    io.emit("userCount", count);
  });
});

// Endpoint to retrieve chat logs
app.get("/chatlogs", async (req, res) => {
  const chatLogs = await ChatLog.find().sort({ time: 1 });
  res.json(chatLogs);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
