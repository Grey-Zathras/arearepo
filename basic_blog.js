// Whole-script strict mode syntax
"use strict";

//var allUsers= nem Map();
//var allUsers= {};
//var allRooms ={};
const teams_list=["observer","Red","Blue"]; //team membership text for chat
const step_verbs=["Challenge", "Response"]; // game status terms

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
//const session = require('express-session');

//const fsPromises = require('fs/promises')
const fs = require('fs');

const { app, server, io } = require("./utils/glbl_objcts.js");
const gameLogic = require('./utils/game_logic');
const cardGenerator = require('./utils/card_generator');
const { addUser, removeUser, getUser, getUsersInRoom,updateUser } = require("./utils/users");
const { addRoom, removeRoom, getRoom, updateRoom } = require("./utils/rooms");
const codenames_DB = require('./db');

//const app = express();

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
  res.status(201).render('create_confirmation', { room:  req.body });
});

// chat server support
//const server = http.createServer(app);
//const io = socketIo(server);

io.on('connection', (socket) => {
    console.log(socket.id,'a user connected');
/*    
    function roomData({room}) {
      const room_id= room.id;
      const host = getUser(room.host)
      const hostname = getUser(room.host).username; 
      const room_name = room.room_name;
      let room2= Object.assign({}, room); 
      delete room2.host;
      io.to(room_name).emit('roomData', {
        room: room2,
        host: hostname,
        users: getUsersInRoom(room_id)
      });
    }
*/
    async function joinTeam(team_id, data) { // data.room
      try {
        socket.data.team = team_id;
        const room_id = socket.data.room_id;
        // read database stats
        if (isInt(room_id)) {
          if (team_id >0) {
              var { rows } = await codenames_DB.query('SELECT states FROM rooms WHERE id = $1', [room_id]);
              if (rows.length === 0) {
                socket.emit('error message',  `Room ${room_id} not found`);
                //res.status(404).send('Room not found');
              } else {
                if (Array.isArray(rows[0].states)  ) {
                  //console.dir(rows[0].states);
                  updateUser ( { id:socket.data.user_id, active:1,team: team_id});
                  const the_room=getRoom(room_id);
                  gameLogic.roomData({room: the_room });
                  // socket.emit('team scheme',  { room_id: room_id,team:team_id, states: rows[0].states[team_id-1]});
                  const forbidden=[1,2];
                  rows[0].states[2-team_id].forEach((state,index) => {
                    // cleanup spies
                    if (forbidden.includes(state) ){
                      rows[0].states[2-team_id][index]=0;
                    }
                  });
                  socket.emit('team scheme',  { room_id: room_id,team:team_id, states: rows[0].states});
                  io.to(the_room.room_name).emit('system message', { msg: "User joined the team", user: data.user,team:team_id , msg_type:1}); // system message
                  console.log(socket.id,` User ${socket.data.username}/${socket.data.user_id} changed team to ${team_id} in room: ${the_room.room_name}`);
                } else {
                  socket.emit('error message',  `Room ${room_id} - game data not found, pls generate the table`);
                  console.log(socket.id,` Join Team: User ${socket.data} - Room ${room_id} - game data not found`);
                }
              }
            }
          }  else {
              // SQL injection attack
              console.log(`SQL injection attack ${socket.data.room_id}`);
              socket.emit('error message',  `Room ${room_id} not found`);
          }
  
      } catch (err){
        console.log(socket.id,` Join Team: User ${socket.data} has got unknown error`,err);
        socket.emit('error message',  `unknown error ${err}`);
      }

    }
  
    // Join a room
  socket.on('join room', async (data) => {
    
    if (data.user_id == 0) {
      data.user_id = socket.id;
      socket.emit('userID',  "User ID assigned: "+data.user_id);
    }
    const res= addUser({id: data.user_id,username: data.user,room: data.room_id}); 
    const res1 = addRoom({id: data.room_id, room_name: data.room, host: data.user_id}); 
    const the_room = res1.room; 
    //console.log("Add Room - the_room object", the_room);
    if (res.error || res1.error) {
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
      socket.data.room_id = the_room.id;
      
      //addUser(socket.id,data.user,data.room_id); 
      
      gameLogic.roomData({room: the_room });
      if (res.msg && res.user.team){
        joinTeam(res.user.team, data);
        console.log(socket.id,` User ${data.user}/${data.user_id} reconnected to room: ${the_room.room_name} and team ${res.user.team}`);
        //console.log(socket.id,` res.user `, res.user);
      } else {
        console.log(socket.id,` User ${data.user} joined room: ${the_room.room_name}`);
      }
    } 
  });

  socket.on('team change', async  (data) => {
    joinTeam(data.team, data);
  });

  socket.on('start game', async  (data) => {
    //var errmsg="";
    try {
      console.log("start game request", "socket.data",socket.data, "data",data);

      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      let the_room=gameLogic.getRoomWithTeamsReady(socket);

      the_room.game_status=1;
      the_room.step=0;
      the_room.active_team=1;
  
      gameLogic.roomData({room: the_room });

      io.to(the_room.room_name).emit('system message', { msg: "Let's start the game!", user: data.user, msg_type:2 }); // system message start game
      //const { rows } = await codenames_DB.query('UPDATE rooms SET stat=$2 WHERE id = $1', [room_id],[0]);  
      console.log("start game success, room:",the_room);
    } catch (err) {
      console.log(socket.id,`start game  request error: User ${socket.data}, request: ${data} `,err);
      socket.emit('error message',  err);
      //socket.emit('error message',  `unknown error ${err}`);
    }
  });

  socket.on('challenge', async  (data) => { // emit the challenge so  players of other team will agree with the cards
    //var errmsg="";
    try {
      console.log("challenge request", "socket.data",socket.data, "data",data);
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      gameLogic.checkUserHasTeam(user);
      let the_room=gameLogic.getRoomInChallengeStep(socket,user);
      var clicks=gameLogic.getChallengeClicks(data);

      the_room.step=1;
      the_room.active_team=3-the_room.active_team;
      the_room.clicks[the_room.active_team]+=clicks;
      the_room.challenge = data.challenge;
      //preparation for the cards selection by all the team members
      gameLogic.resetRoomCardsResponsesMap(the_room);

      io.to(the_room.room_name).emit('system message', { msg: `${teams_list[user.team] } team sends the challenge:`, user: data.user,challenge: data.challenge, clicks: clicks, msg_type:3 }); // system message challenge
      gameLogic.roomData({room: the_room });
    } catch (err) {
      console.log(socket.id,`challenge request error:`,err);
      socket.emit('error message',  err);
      //socket.emit('error message',  `unknown error ${err}`);
    }
  });

  socket.on('card_choice', async  (data) => { // emit the challenge so  players of other team will agree with the cards
    try {
      console.log("card_choice", "socket.data",socket.data, "data",data);
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      gameLogic.checkUserHasTeam(user);
      let the_room=gameLogic.getRoomInResponseStep(socket,user);
      
      the_room.card_response_map.set(user.username,data.card_id); 
      let consent=1;
      for (const [key, value] of the_room.card_response_map) {
        consent=consent && (value==data.card_id) ;
        console.log(`card_response_map ${key} = ${value}`);
      }
      console.log("card_choice consent", consent);
      /*
      the_room.step=1;
      the_room.active_team=3-the_room.active_team;
      the_room.clicks[the_room.active_team]+=clicks;
      the_room.challenge = data.challenge;
      //preparation for the cards selection by all the team members
      gameLogic.resetRoomCardsResponsesMap(the_room);

      io.to(the_room.room_name).emit('system message', { msg: `${teams_list[user.team] } team sends the challenge:`, user: data.user,challenge: data.challenge, clicks: clicks, msg_type:3 }); // system message challenge
      gameLogic.roomData({room: the_room });
      */

    } catch (err) {
      console.log(socket.id,`card_choice error:`,err);
      socket.emit('error message',  err);
      //socket.emit('error message',  `unknown error ${err}`);
    }
  });
  
  socket.on('leave room', async  (data) => {
    var userleft;
    if (data.userid) {
      userleft=removeUser(data.userid);
    } else if (socket.data.user_id){
       userleft=removeUser(socket.data.user_id);
   } 
   if (typeof userleft === "undefined" ) {
     userleft="undefined";
   }
    
    console.log('leave room - userleft:',userleft);
    try { //|| !userleft.room
      let the_room=getRoom(userleft.room);
      io.to(the_room.room_name).emit('chat message', { msg: "user left the room", user: userleft.username, msgclass:"sysmsg" });
      if (the_room.host == userleft.id) {
        const users= getUsersInRoom(the_room.id, 1).filter(user => user.active == 1);
        const res1=users.length;
        console.log('getUsersInRoom:',users,res1);
        if (!users.length) {
          console.log("last active user left the room - room will be destroyed");
          io.to(the_room.room_name).emit('system message', { msg: "last active user left the room - room will be destroyed", user: userleft.username });
          removeRoom(the_room.id);
        } else {
          const new_host = users[0];
          console.log("reassigning host to the 'host':",new_host.username );
          updateRoom({id:the_room.id, host:new_host.id });
          //let the_room=getRoom(the_room.id);
          gameLogic.roomData({room: the_room , host:new_host.username});
          io.to(the_room.room_name).emit('system message', { msg: "host "+ userleft.username +" left the room, I am the new host", user: new_host.username });
        }
    }
  } 
  catch (err) {
    console.log("no room found to leave for 'userleft'",userleft, "socket.data",socket.data, "data",data,err);
  }
});

  // Listen for chat messages and emit to the room
  socket.on('chat message', (data) => {
    io.to(data.room).emit('chat message', { msg: data.msg, user: data.user, msgclass: data.msgclass });
    console.log(socket.id,'chat message', socket.data, data.user, data.msg);
  });
  
  socket.on('disconnect', (reason) => {
    const user = getUser(socket.id);
    if (user === undefined){
      console.log("disconnect - socket_data",socket.data);
      console.log(socket.id,`disconnect - unknown user ${socket.data.user_id} disconnected`, reason);
    } else  {
      try {
        if ( !socket.data.room ) {
          throw "no room in socket";
        }
          const the_room = socket.data.room;
          updateUser ( { id:socket.id, active:0 });
          gameLogic.roomData({room: the_room });
          io.to(the_room.room_name).emit('system message', { msg: `I am disconnected, ${reason}`, user: socket.data.username });
        } catch (err) {
        console.log(socket.id,`disconnect error: User ${socket.data} `,err);
        //socket.emit('error message',  `unknown error ${err}`);
      }
  

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

server.listen(3000, () => {
  console.log('listening chat server on *:3000');
});