const log_debug_on=1;

const teams_list=["observer","Red","Blue"]; //team membership text for chat
const step_verbs=["Challenge", "Response"]; // game status terms

const fs = require('fs');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const fullWordList = fs.readFileSync('wordlist.txt', 'utf-8');
const wordList = fullWordList.split(/\r?\n/);

// Short-circuiting, and saving a parse operation
function isInt(value) {
    var x;
    if (isNaN(value)) {
      return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
  }

const app = express();

// chat server support
const server = http.createServer(app);
const io = socketIo(server);

module.exports = {
  app,
  server,
  io,
  teams_list,
  step_verbs,
  wordList,
  log_debug_on,
  isInt
}
