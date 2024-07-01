const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect('mongodb+srv://rashtriyahello:Df3qDh3oXwtg6cqr@cluster0.xjz2hmo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true });

const visitorSchema = new mongoose.Schema({
    username: String,
    visitTime: { type: Date, default: Date.now }
});
const Visitor = mongoose.model('Visitor', visitorSchema);

let count = 0; // Variable to track connected users

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('New client connected');

    // Increase count and emit to all clients
    count++;
    io.emit('userCount', count);

    socket.on('setUsername', async (username) => {
        const newVisitor = new Visitor({ username });
        await newVisitor.save();
        console.log(`User connected: ${username}`);
    });

    socket.on('message', (data) => {
        io.emit('message', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        // Decrease count and emit to all clients
        count--;
        io.emit('userCount', count);
    });
});

app.get('/visitors', async (req, res) => {
    const visitors = await Visitor.find({});
    res.json(visitors);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
