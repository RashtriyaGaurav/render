const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let count = 0; // Variable to track connected users

// MongoDB connection
const mongoUri = process.env.MONGODB_URI;
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Schema and Model for storing visitor data
const visitorSchema = new mongoose.Schema({
  username: String,
  visitTime: { type: Date, default: Date.now }
});
const Visitor = mongoose.model('Visitor', visitorSchema);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('New client connected');

  // Increase count and emit to all clients
  count++;
  io.emit('userCount', count);

  socket.on('setUsername', (username) => {
    const visitor = new Visitor({ username });
    visitor.save();

    socket.username = username; // Store username in the socket instance
  });

  socket.on('message', (data) => {
    const message = `${data.username}: ${data.message}`;
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    // Decrease count and emit to all clients
    count--;
    io.emit('userCount', count);
  });
});

// Endpoint to get visitor data
app.get('/visitors', async (req, res) => {
  try {
    const visitors = await Visitor.find();
    res.json(visitors);
  } catch (err) {
    res.status(500).send(err);
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
