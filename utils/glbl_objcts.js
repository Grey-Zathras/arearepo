const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();

// chat server support
const server = http.createServer(app);
const io = socketIo(server);

module.exports = {
  app,
  server,
  io
}
