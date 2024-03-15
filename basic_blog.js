// Whole-script strict mode syntax
"use strict";

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');

const codenames_DB = require('./db');

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Define the directory where the template files are located
app.set('views', path.join(__dirname, 'templates'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


/*
//const { Pool } = require('pg');

// PostgreSQL connection setup
const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
});
*/

// Short-circuiting, and saving a parse operation
function isInt(value) {
    var x;
    if (isNaN(value)) {
      return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
  }

// Home route to list all rooms
app.get('/', async (req, res) => {
  const { rows } = await codenames_DB.query('SELECT * FROM posts');
  //res.json(rows);
  res.render('index', { rooms: rows });
  //console.log(`${JSON.stringify(rows)} `);
});

// Route to get a specific room by id
app.get('/room/:id', async (req, res) => {
    const int_id= req.params.id;
    if (isInt(int_id)) {
    const { rows } = await codenames_DB.query('SELECT * FROM posts WHERE id = $1', [int_id]);
        if (rows.length === 0) {
            res.status(404).send('Room not found');
            //res.status(404).json({ message: 'Post not found' });
        } else {
            res.render('room', { room: rows[0] }); 
            //res.json(rows[0]);
        }
    }  else {
        // SQL injection attack
        console.log(`SQL injection attack ${req.params.id}`);
        res.status(404).send('Room not found');
    }
});

// Route to display the form for creating a new room
app.get('/create', (req, res) => {
    res.render('create');
  });
  
// Route to create a new room
app.post('/create', async (req, res) => {
  const { title, content } = req.body;
  console.log(`creating new room  ${title}`); //{req.body}
  const { rows } = await codenames_DB.query(
    'INSERT INTO posts(title, content) VALUES($1, $2) RETURNING *',
    [title, content]
  );
  //res.status(201).json(rows[0]);
  //res.status(201).send(`Post ${title} created`);
  res.status(201).render('create_confirmation', { room:  req.body });
});

// chat server support
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log(socket.id,'a user connected');
    
    // Join a room
    socket.on('join room', (room) => {
    socket.join(room);
    console.log(socket.id,`User joined room: ${room}`);
  });
  
  // Listen for chat messages and emit to the room
  socket.on('chat message', (data) => {
    io.to(data.room).emit('chat message', data.msg);
  });
  
  socket.on('disconnect', () => {
    console.log(socket.id,'user disconnected');
  });
  });
  

// Start the server
/*
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
*/

server.listen(3000, () => {
  console.log('listening chat server on *:3000');
  });