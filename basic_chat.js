const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/basic_chat.html');
});

io.on('connection', (socket) => {
  console.log(socket.id,'a user connected');

  // Join a room
  socket.on('join room', (data) => {
    socket.join(data.room);
    socket.data.username = data.user;
    console.log(socket.id,` User ${data.user} joined room: ${data.room}`);
    //console.log('rooms:');
    //console.log(socket.rooms);
  });

  // Listen for chat messages and emit to the room
  socket.on('chat message', (data) => {
    io.to(data.room).emit('chat message', { msg: data.msg, user: data.user });
    console.log(socket.id,'chat message', data.room, data.user, data.msg);
  });

  socket.on('disconnect', (reason) => {
    console.log(socket.id,`user ${socket.data.username} disconnected`, reason);
  });
  
});

///*
io.use((socket, next) => {
  console.log(socket.id,'io.use');
    next();
});
// */

server.listen(3000, () => {
console.log('listening on *:3000');
});