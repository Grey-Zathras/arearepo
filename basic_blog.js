// Whole-script strict mode syntax
"use strict";

//var allUsers= nem Map();
var allUsers= {};
var allRooms ={};

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
//const session = require('express-session');

//const fsPromises = require('fs/promises')
const fs = require('fs');

const cardGenerator = require('./utils/card_generator');
const { addUser, removeUser, getUser, getUsersInRoom,updateUser } = require("./utils/users");
const codenames_DB = require('./db');

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
/*
app.use(session({
  secret: 'Wonka-Willi',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000000 } // session timeout of 60 seconds
}));
*/

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
    //const { userTeam } = req._parsedUrl.query;
    //console.log("User team is", userTeam );
    if (isInt(int_id)) {
    const { rows } = await codenames_DB.query('SELECT * FROM rooms WHERE id = $1', [int_id]);
        if (rows.length === 0) {
            res.status(404).send('Room not found');
            //res.status(404).json({ message: 'Post not found' });
        } else {
            res.render('room', { room: rows[0] });
            //req.session.username = username;
            //req.session.room_id = int_id; 
            //console.log(socket.id,` User ${socket.data.user} entering room: ${socket.data.room}`);
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
    
    async function joinTeam(team_id, data) { // data.room
      socket.data.team = team_id;
      const room_id = socket.data.room_id;
      //   room <-> data.room <-> room=rooms[room_id] ?
      const room_name = data.room;// rooms.title ??
      // read database stats
      if (isInt(room_id)) {
        if (team_id >0) {
            const { rows } = await codenames_DB.query('SELECT states FROM rooms WHERE id = $1', [room_id]);
            if (rows.length === 0) {
              socket.emit('error message',  `Room ${room_id} not found`);
              //res.status(404).send('Room not found');
            } else {
              if (Array.isArray(rows[0].states)  ) {
                //console.dir(rows[0].states);
                updateUser ( { id:socket.data.user_id, active:1,team: team_id});
                io.to(room_name).emit('roomData', {
                  room: room_id,
                  users: getUsersInRoom(room_id)
                });
                socket.emit('team scheme',  { room_id: room_id,team:team_id, states: rows[0].states[team_id-1]});
              } else {
                socket.emit('error message',  `Room ${room_id} - game data not found, pls generate the table`);
              }
            }
          }
        }  else {
            // SQL injection attack
            console.log(`SQL injection attack ${socket.data.room_id}`);
            socket.emit('error message',  `Room ${room_id} not found`);
        }
        console.log(socket.id,` User ${socket.data.username}/${socket.data.user_id} changed team to ${team_id} in room: ${room_name}`);

    }
  
    // Join a room
  socket.on('join room', async (data) => {
    
    if (data.user_id == 0) {
      data.user_id = socket.id;
      socket.emit('userID',  "User ID assigned: "+data.user_id);
    }
    var res= addUser({id: data.user_id,username: data.user,room: data.room_id}); 
    if (res.error) {
      /*
      if (res.error=="Username is in use!") {
        // socket.emit('team scheme',  { room_id: int_id,team:data.team, states: rows[0].states[data.team-1]});
      } else {
      */
        console.log(res.error);
        socket.emit('error message',  "Cannot join the room: "+res.error);
      // }
    } else {
      socket.join(data.room);
      socket.data.username = data.user;
      socket.data.user_id = data.user_id;
      socket.data.room_id = data.room_id;
      
      //addUser(socket.id,data.user,data.room_id); 
      
      io.to(data.room).emit('roomData', {
        room: data.room_id,
        users: getUsersInRoom(data.room_id)
      });
      if (res.msg && res.user.team){
        joinTeam(res.user.team, data);
        console.log(socket.id,` User ${data.user}/${data.user_id} reconnected to room: ${data.room} and team ${res.user.team}`);
        //console.log(socket.id,` res.user `, res.user);
      } else {
        console.log(socket.id,` User ${data.user} joined room: ${data.room}`);
      }
    } 
  });

  socket.on('team change', async  (data) => {
    
    joinTeam(data.team, data);

    /*
    //socket.join(data.room+"/"+data.team);
    socket.data.team = data.team;
    //socket.emit('chat message', { msg: 'Your new team in room '+socket.data.room_id+' is '+data.team }); // + room.title?
    const int_id = socket.data.room_id;
    //   room <-> data.room <-> rooms[room_id] ?
    // read database stats
    if (isInt(int_id)) {
      if (data.team >0) {
          //data.team--;
          //const { rows } = await codenames_DB.query('SELECT states[$2] FROM rooms WHERE id = $1', [int_id],[data.team]);
          const { rows } = await codenames_DB.query('SELECT states FROM rooms WHERE id = $1', [int_id]);
          if (rows.length === 0) {
            socket.emit('error message',  `Room ${int_id} not found`);
            //res.status(404).send('Room not found');
          } else {
            if (Array.isArray(rows[0].states)  ) {
              //console.dir(rows[0].states);
              updateUser ( { id:socket.id, active:1,team: data.team});
              io.to(data.room).emit('roomData', {
                room: int_id,
                users: getUsersInRoom(int_id)
              });
              socket.emit('team scheme',  { room_id: int_id,team:data.team, states: rows[0].states[data.team-1]});
        
            //res.render('room', { room: rows[0] });
            } else {
              socket.emit('error message',  `Room ${int_id} - game data not found, pls generate the table`);
            }
          }
        }
      }  else {
          // SQL injection attack
          console.log(`SQL injection attack ${socket.data.room_id}`);
          socket.emit('error message',  `Room ${int_id} not found`);
        }
    console.log(socket.id,` User ${data.user} changed team to ${data.team} in room: ${data.room}`);
    // */

  });

  // Listen for chat messages and emit to the room
  socket.on('chat message', (data) => {
    io.to(data.room).emit('chat message', { msg: data.msg, user: data.user });
    console.log(socket.id,'chat message', data.room, data.user, data.msg);
  });
  
  socket.on('disconnect', (reason) => {
    const user = getUser(socket.id);
    if (user === undefined){
      console.log("socket",socket.data);
      console.log(socket.id,`unknown user ${socket.data.user_id} disconnected`, reason);
    } else  {
      updateUser ( { id:socket.id, active:0 });
      /*
      room = ... user.room
      io.to(room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
      */

      console.log(socket.id,`user ${user.username} disconnected`, reason);
    }
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