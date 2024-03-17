// Whole-script strict mode syntax
"use strict";

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');

//const fsPromises = require('fs/promises')
const fs = require('fs');

const cardGenerator = require('./card_generator');
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

/*
const readFileAsync = async () => {
  try {
    const contents = await fsPromises.readFile('file.txt', 'utf-8');
    const arr = contents.split(/\r?\n/);
    console.log(arr);
    // [ 'this', 'is', 'an', 'example two two', 'text!' ]
  } catch (err) {
    console.error(err);
  }
}
*/

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

// Home route to list all rooms
app.get('/', async (req, res) => {
  const { rows } = await codenames_DB.query('SELECT id, title,code, stat  FROM rooms where priv=FALSE');
  //res.json(rows);
  res.render('index', { rooms: rows });
  //console.log(`${JSON.stringify(rows)} `);
});

// Route to get a specific room by id
app.get('/room/:id', async (req, res) => {
    const int_id= req.params.id;
    if (isInt(int_id)) {
    const { rows } = await codenames_DB.query('SELECT * FROM rooms WHERE id = $1', [int_id]);
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
  const { title, code } = req.body;
  console.log(`creating new room  ${title}`); //{req.body}
/*
  await new Promise((resolve, reject) => {
    fs.readFile('wordlist.txt', 'utf8', (err, content) => {
  })
})
*/
//readFileAsync();
  var cards = cardGenerator.generateCards25(wordList);
  var states = cardGenerator.generateSpies();

  const { rows } = await codenames_DB.query(
    'INSERT INTO rooms(title, code, cards, states ) VALUES($1, $2, $3, $4) RETURNING *',
    [title, code, cards, states]
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
    socket.on('join room', (data) => {
      socket.join(data.room);
      socket.data.username = data.user;
      socket.data.username = data.user;
    console.log(socket.id,` User ${data.user} joined room: ${data.room}`);
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