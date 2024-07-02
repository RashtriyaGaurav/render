const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let count = 0; // Variable to track connected users

// MongoDB URI (replace with your MongoDB connection string)
const mongoUri = "your-mongodb-uri-here";

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Define a schema and model for chat logs
const chatSchema = new mongoose.Schema({
  user: String,
  text: String,
  time: { type: Date, default: Date.now },
});

const ChatLog = mongoose.model("ChatLog", chatSchema);

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
      text: `${username} has joined the chat`,
    };
    io.emit("message", joinMessage);
  });

  socket.on("message", (text) => {
    const message = { user: socket.username, text: text };
    io.emit("message", message);

    // Save chat log to MongoDB
    const chatLog = new ChatLog(message);
    chatLog.save().catch((err) => console.error("Error saving chat log:", err));
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    // Decrease count and emit to all clients
    count--;
    io.emit("userCount", count);

    if (socket.username) {
      const leaveMessage = {
        user: "System",
        text: `${socket.username} has left the chat`,
      };
      io.emit("message", leaveMessage);
    }
  });
});

// Endpoint to fetch chat logs
app.get("/chatlogs", (req, res) => {
  ChatLog.find()
    .sort("time")
    .exec((err, logs) => {
      if (err) {
        return res.status(500).send(err);
      }
      res.json(logs);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
