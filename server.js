const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let count = 0; // Variable to track connected users

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('New client connected');

    // Increase count and emit to all clients
    count++;
    io.emit('userCount', count);

    // Handle new user joining with a username
    socket.on('join', (username) => {
        socket.username = username;
        io.emit('message', { user: 'System', text: `${username} has joined the chat.` });
    });

    socket.on('message', (message) => {
        io.emit('message', { user: socket.username, text: message });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        // Decrease count and emit to all clients
        io.emit('message', { user: 'System', text: `${socket.username} has left the chat.` });
        count--;
        io.emit('userCount', count);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
