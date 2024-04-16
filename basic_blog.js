// Whole-script strict mode syntax
"use strict";

//var allUsers= nem Map();
//var allUsers= {};
//var allRooms ={};

//const teams_list=["observer","Red","Blue"]; //team membership text for chat
//const step_verbs=["Challenge", "Response"]; // game status terms

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
//const session = require('express-session');

//const fsPromises = require('fs/promises')
//const fs = require('fs');

const { app, server, io, teams_list, step_verbs, wordList, log_debug_on, isInt } = require("./utils/glbl_objcts.js");
const gameLogic = require('./utils/game_logic');
const cardGenerator = require('./utils/card_generator');
const { addUser, removeUser, getUser, getUsersInRoom, getUserByRoomAndName, updateUser } = require("./utils/users");
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
/*
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
*/

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

  async function joinTeam(team_id, data) { // data.room
    try {
      socket.data.team = team_id;
      const room_id = socket.data.room_id;
      // read database stats
      if (!isInt(room_id)) {
        console.log(` joinTeam - SQL injection attack ${socket.data.room_id}`);
        throw(`Room ${room_id} not found`);
      }  
      updateUser ( { id:socket.data.user_id, active:1,team: team_id});
      const the_room=getRoom(room_id);
      gameLogic.roomData({room: the_room });
      if (team_id >0) {
        if(the_room.game_status==1) { // if (the_room.game_status==1)
          var states = await gameLogic.getTeamStates({room_id:room_id, team_id:team_id});
          //console.log(` joinTeam, states `,states);
          socket.emit('team scheme',  { room_id: room_id,team:team_id, states: states});
        }
        socket.join(the_room.room_name+team_id);
        //io.to(the_room.room_name+team_id).emit('system message', { msg: "secret team channel test!", user: data.user }); // system message 
        //console.log(socket.id,` Join Team: User ${team_id} result socket:`,socket);
      } else { // reconnect for observer
        var states = await gameLogic.getTeamStates({room_id:the_room.id, team_id:0 });
        socket.emit('team scheme',  { room_id: room_id,team:0, states: states}); // Observer
      }
      io.to(the_room.room_name).emit('system message', { msg: "User joined the team", user: data.user,team:team_id , msg_type:1}); // system message
      console.log(socket.id,` User ${socket.data.username}/${socket.data.user_id} changed team to ${team_id} in room: ${the_room.room_name}`);
    } catch (err){
      console.log(socket.id,` Join Team: User ${socket.data} has got error`,err);
      socket.emit('error message',  err);
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
      
      if (res.msg && res.user.team){
        await joinTeam(res.user.team, data);
        console.log(socket.id,` User ${data.user}/${data.user_id} reconnected to room: ${the_room.room_name} and team ${res.user.team}`);
        //console.log(socket.id,` res.user `, res.user);
      } else {
        console.log(socket.id,` User ${data.user} joined room: ${the_room.room_name} as Observer`);
        if (the_room.game_status){
          await joinTeam(0, data); // send schema to observer
        }
      }
      gameLogic.roomData({room: the_room });
    } 
  });

  socket.on('team change', async  (data) => {
    joinTeam(data.team, data);
  });

  socket.on('rebuild table request', async  (data) => {
    try {
      console.log("rebuild table request", "socket.data",socket.data, "data",data);
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      //let the_room=gameLogic.getRoomWithTeamsReady(socket);
      let the_room=getRoom(socket.data.room_id);
      gameLogic.checkHost({user:user, room:the_room });
      if (the_room.game_status) {
        throw "Cannot generate new cards and spies, game is still in progress!";
      }

      var cards = cardGenerator.generateCards25(wordList);
      var states = cardGenerator.generateSpies();
      gameLogic.writeStates({the_room_id: the_room.id, states: states, cards: cards});
      io.to(the_room.room_name).emit('new table',  { room_id: the_room.id, cards: cards}); // no team!
      io.to(the_room.room_name).emit('system message', { msg: "Table recreated!", user: data.user, msg_type:0}); // general system message
    } catch (err) {
      console.log(socket.id,`rebuild table request error: User ${socket.data}, request: ${data} `,err);
      socket.emit('error message',  err);
    }
  });

  socket.on('delete room', async  (data) => {
    try {    
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      //let the_room=gameLogic.getRoomWithTeamsReady(socket);
      let the_room=getRoom(socket.data.room_id);
      gameLogic.checkHost({user:user, room:the_room });
      if (the_room.game_status) {
        throw "Cannot delete room, game is still in progress!";
      }

      //io.socketsLeave("room1");

    } catch (err) {
      console.log(socket.id,`delete room request error: User ${socket.data}, request: ${data} `,err);
      socket.emit('error message',  err);
    }
  });

  socket.on('stop game', async  (data) => {
    try {
      console.log("stop game request", "socket.data",socket.data, "data",data);
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      //let the_room=gameLogic.getRoomWithTeamsReady(socket);
      let the_room=getRoom(socket.data.room_id);
      gameLogic.checkHost({user:user, room:the_room });


      the_room.game_status=0;
      // clean teams? hide states? 

      io.to(the_room.room_name).emit('system message', { msg: "the game has stopped!", user: data.user, msg_type:7 }); // system message stop game
      gameLogic.roomData({room: the_room });
    } catch (err) {
      console.log(socket.id,`start game  request error: User ${socket.data}, request: ${data} `,err);
      socket.emit('error message',  err);
    }
  });

  socket.on('start game', async  (data) => {
    //var errmsg="";
    try {
      console.log("start game request", "socket.data",socket.data, "data",data);

      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      let the_room=gameLogic.getRoomWithTeamsReady(socket);
      gameLogic.checkHost({user:user, room:the_room });

      the_room.game_status=1;
      the_room.step=0;
      the_room.turn=1;
      the_room.active_team=1;

      const states_unsecured = await gameLogic.getRoomStates(the_room.id);

        //send team sheme to the team
      for (let team_id = 1; team_id<3; team_id++ ){
        var states = await gameLogic.getTeamStates({room_id:the_room.id, team_id:team_id, states_unsecured: states_unsecured });
        io.to(the_room.room_name+team_id).emit('team scheme',  { room_id: the_room.id,team:team_id, states: states});
      }
      
      // send team scheme to observers
      var states = await gameLogic.getTeamStates({room_id:the_room.id, team_id:0, states_unsecured: states_unsecured });
      console.log(`start game - observer schema: `,states);
      io.to(the_room.room_name).emit('team scheme',  { room_id: the_room.id, states: states}); // no team!
      io.to(the_room.room_name).emit('system message', { msg: "Let's start the game!", user: data.user, msg_type:2 }); // system message start game
      gameLogic.roomData({room: the_room });
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
      let card_response_array= [];
      for (const [key, value] of the_room.card_response_map) {
        consent=consent && (value==data.card_id) ;
        if (isInt(value) ) {
          card_response_array.push(value);
        }
        //console.log(`card_response_map ${key} = ${value}`);
      }
      //console.log("card_choice consent", consent);
      if (consent) {
        // send final message
        // update states in the database
        var states = await gameLogic.getStatesRevertTheCard({the_room:the_room,card_id:data.card_id});
          
        // broadcast new states to all users
        const reveal_role= states[2-the_room.active_team][data.card_id];
        io.to(the_room.room_name).emit('system message', { 
            msg: `${teams_list[user.team] } team has chosen the card: {card_text}, which is {reveal_role}`, 
            user: user.username,
            team: the_room.active_team,
            card_id:data.card_id,
            reveal_role:reveal_role,
            msg_type:5}); // system message card_chosen
        if (reveal_role==4) {
          the_room.clicks[the_room.active_team]--;
          //check if any spies are left?
          if (!gameLogic.countHiddenSPies(states) ) {
            // end game
            the_room.game_status=0;
            io.to(the_room.room_name).emit('system message', { msg: "You all are WINNERS - the game has finished!", user: data.user, msg_type:7 }); // system message stop game
          } else if (!the_room.clicks[the_room.active_team]) {
            // change the  turn and the step, team is the same
            the_room.turn++;
            the_room.step = 0; //now is the Challenge step 
            //the_room.active_team=3-the_room.active_team;
            io.to(the_room.room_name).emit('system message', { msg: `${teams_list[user.team] } team run out of clicks.  New Turn:${the_room.turn} !`, user: user.username, msg_type:6}); // system message end turn
          }
        } else {
            // change the  turn and the step, team is the same
            the_room.turn++;
            the_room.step = 0; //now is the Challenge step 
            io.to(the_room.room_name).emit('system message', { msg: `${teams_list[user.team] } team is missed.  New Turn:${the_room.turn} !`, user: user.username, msg_type:6}); // system message end turn
        }
        gameLogic.roomData({room: the_room });
      } else {
        // send the status update on the card selection
        io.to(the_room.room_name).emit('system message', { msg: `${teams_list[user.team] } team has no consent:`, user: user.username, msg_type:4, card_response_array:card_response_array }); // system message no_consent
      }

    } catch (err) {
      console.log(socket.id,`card_choice error:`,err);
      socket.emit('error message',  err);
      //socket.emit('error message',  `unknown error ${err}`);
    }
  });

  socket.on('end_turn', async  (data) => { // emit the system message so team will agree to end the turn
    try {
      console.log("end_turn", "socket.data",socket.data, "data",data);
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      gameLogic.checkUserHasTeam(user);
      let the_room=gameLogic.getRoomInResponseStep(socket,user);
      
      the_room.end_turn_map.set(user.username,"end_turn"); 
      let consent=1;
      let end_turn_array= [];
      for (const [key, value] of the_room.end_turn_map) {
        consent=consent && (value=="end_turn") ;
        if (isInt(value) ) {
          end_turn_array.push(value);
        }
      }
       if (consent) {
            // change the  turn and the step, team is the same
            the_room.turn++;
            the_room.step = 0; //now is the Challenge step 
            io.to(the_room.room_name).emit('system message', { msg: `${teams_list[user.team] } team decided to end current turn.  New Turn:${the_room.turn} !`, user: user.username, msg_type:6}); // system message end turn
            gameLogic.roomData({room: the_room });
       } else {
        io.to(the_room.room_name).emit('system message', { msg: `${teams_list[user.team] } team has no consent for end turn `, user: user.username, msg_type:0 }); // system message / general
       }
   } catch (err) {
      console.log(socket.id,`end_turn error:`,err);
      socket.emit('error message',  err);      
    }
  });
  
  socket.on('cancel leaving room', async  (data) => {
    try {
      console.log("cancel leaving room", "socket.data",socket.data, "data",data);
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      let the_room=getRoom(user.room);
      updateUser ( { id:user.id, active:1 });
      gameLogic.roomData({room: the_room });
    } catch (err) {
      console.log(socket.id,`card_choice error:`,err);
      socket.emit('error message',  err);
    }
  });
  
  socket.on('request to leave room', async  (data) => {
    try{
      console.log("request to leave room", "socket.data",socket.data, "data",data);
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      let the_room=getRoom(user.room);
      //gameLogic.checkUserHasTeam(user);
      if (!user.team) {
        // leave the room
        var userleft=removeUser(user.id);
        gameLogic.kickUserFromTheRoom({the_room: the_room, userleft: userleft, socket: socket});
      } else {
        updateUser ( { id:user.id, active:0 });
        gameLogic.roomData({room: the_room });
        let timeout = setTimeout(function() {
          gameLogic.delayedUserLeaveTheRoom(the_room,user,socket);
        }, 30000); //0.5 min
        //let timeout = setTimeout(gameLogic.delayedUserLeaveTheRoom(the_room,user), 1500);
      }
      
    } catch (err) {
      console.log(socket.id,`challenge request error:`,err);
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
      gameLogic.kickUserFromTheRoom({the_room: the_room, userleft: userleft, socket: socket});
      //socket.leave(userleft.room);
    } 
    catch (err) {
      console.log("no room found to leave for 'userleft'",userleft, "socket.data",socket.data, "data",data,err);
    }
  });
    
  socket.on('kick user request', async  (data) => {
    try {
      console.log("kick user request", "socket.data",socket.data, "data",data);
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      //let the_room=gameLogic.getRoomWithTeamsReady(socket);
      let the_room=getRoom(socket.data.room_id);
      gameLogic.checkHost({user:user, room:the_room });
      //const users = gameLogic.getUsersInRoom(the_room.id, 0);
      var userleft = getUserByRoomAndName({room:the_room.id, username:data.user, strict:1});
      userleft=removeUser(userleft.id);
      gameLogic.kickUserFromTheRoom({the_room,userleft});

    } catch (err) {
      console.log(socket.id,`challenge request error:`,err);
      socket.emit('error message',  err);
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
          let timeout = setTimeout(function() {
            gameLogic.delayedUserLeaveTheRoom(the_room,user,socket);
          }, 120000); // 2 min
          } catch (err) {
            console.log(socket.id,`disconnect error: User ${socket.data} `,err);
            //socket.emit('error message',  `unknown error ${err}`);
          }
          console.log(socket.id,`user ${user.username} disconnected`, reason);
    }
  });
});

//process.env.PORT 
server.listen(3000, () => {
  console.log('listening chat server on *:3000');
});