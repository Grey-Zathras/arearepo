var debug = require('debug')('socket_IO');
debug.log = console.log.bind(console); // don't forget to bind to console!

  var {  teams_list, step_verbs,supported_languages, log_debug_on, isInt } = require("./glbl_objcts");
const wordList = require('./wordlist');
const gameLogic = require('./game_logic');
const cardGenerator = require('./card_generator');
const { addUser, removeUser, getUser, getUsersInRoom, getUserByRoomAndName, updateUser } = require("./users");
const { addRoom, removeRoom, getRoom, updateRoom, makeid } = require("./rooms");
//const codenames_DB = require('../db');

const io_socket_connected = (socket) => {
  const io = socket.server; 
  //const req = socket.request;
  //i18next.init(req);
  //const sessionId = socket.request.session.id;
  try {
    socket.request.i18n.changeLanguage(socket.request.session.room_lang);
  } catch (err){
    socket.emit('error message',  err.message);
    debug("io_socket_connected: session data not ready - hack? :", socket.id, err);
    return ;
  }
  
  debug(socket.id,'a user connected');


    // Join a room
  socket.on('join room', async (data) => {
    
    if (data.user_id == 0) {
      data.user_id = socket.id;
      socket.emit('userID',  "User ID assigned: "+data.user_id);
    }
    const room_id = (socket.request.session ? socket.request.session.room_id: data.room_id);
    const room_name = (socket.request.session ? socket.request.session.room_name: data.room);
    const room_lang = (socket.request.session ? socket.request.session.lang: "ru");
    const res= addUser({id: data.user_id,username: data.user,room: room_id}); 
    const res1 = addRoom({id: room_id, room_name: room_name, host: data.user_id}); 
    const the_room = res1.room; 
    //debug("Add Room - the_room object", the_room);
    if (res.error || res1.error) {
      /*
      if (res.error=="Username is in use!") {
        // socket.emit('team scheme',  { room_id: int_id,team:data.team, states: rows[0].states[data.team-1]});
      } else {
      */
        debug(res.error);
        socket.emit('error message',  socket.request.i18n.t("Cannot join the room")+": "+res.error);
      // }
    } else {
      socket.join(room_name);
      socket.data.username = data.user;
      socket.data.user_id = data.user_id;
      socket.data.room_id = the_room.id;
      
      //addUser(socket.id,data.user,data.room_id); 
      
      if (res.msg && res.user.team){
        await gameLogic.joinTeam({socket: socket, team_id: res.user.team}); //, data: data
        debug(socket.id,` User ${data.user}/${data.user_id} reconnected to room: ${the_room.room_name} and team ${res.user.team}`);
        //debug(socket.id,` res.user `, res.user);
      } else {
        debug(socket.id,` User ${data.user} joined room: ${the_room.room_name} as Observer`);
        if (the_room.game_status){
          await gameLogic.joinTeam({socket: socket, team_id: 0}); // , data: data // send schema to observer
        }
      }
      gameLogic.roomData({room: the_room, io:io });
    } 
  });

  socket.on('team change', async  (data) => {
    gameLogic.joinTeam({socket: socket, team_id: data.team}); //, data: data
  });

  socket.on('rebuild table request', async  (data) => {
    try {
      debug("rebuild table request", "socket.data",socket.data, "data",data);
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      let the_room=getRoom(socket.data.room_id);
      gameLogic.checkHost({user:user, room:the_room });
      if (the_room.game_status) {
        throw "Cannot generate new cards and spies, game is still in progress!";
      }
      const lang = socket.request.session.room_lang;
      var cards = cardGenerator.generateCards25(wordList[lang]);
      var states = cardGenerator.generateSpies();
      gameLogic.writeStates({the_room_id: the_room.id, states: states, cards: cards});
      io.to(the_room.room_name).emit('new table',  { room_id: the_room.id, cards: cards}); // no team!
      io.to(the_room.room_name).emit('system message', { msg: socket.request.i18n.t("Table recreated")+"!", user: data.user, msg_type:0}); // general system message
    } catch (err) {
      debug(socket.id,`rebuild table request error: User ${socket.data}, request: ${data} `,err);
      socket.emit('error message',  socket.request.i18n.t(err));
    }
  });

  socket.on('delete room', async  (data) => {
    try {    
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      let the_room=getRoom(socket.data.room_id);
      gameLogic.checkHost({user:user, room:the_room });
      if (the_room.game_status) {
        throw "Cannot delete room, game is still in progress!";
      }
      /*
      const users = getUsersInRoom(the_room.id, 1);
      users.forEach(userleft => {
        removeUser(userleft.id);
          gameLogic.kickUserFromTheRoom({the_room,userleft});  // await ?
      });      

      io.socketsLeave(the_room.room_name);
      const { rows } =  codenames_DB.query(
        'DELETE FROM rooms WHERE id = $1 RETURNING *',
        [the_room.id]
      ); //no await
      */
      gameLogic.destroyRoom({io:io, the_room:the_room});
    } catch (err) {
      debug(socket.id,`delete room request error: User ${socket.data}, request: ${data} `,err);
      socket.emit('error message',  socket.request.i18n.t(err));
    }
  });

  socket.on('stop game', async  (data) => {
    try {
      debug("stop game request", "socket.data",socket.data, "data",data);
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      let the_room=getRoom(socket.data.room_id);
      gameLogic.checkHost({user:user, room:the_room });


      the_room.game_status=0;
      // clean teams? hide states? 

      gameLogic.roomData({room: the_room, io:io });
      io.to(the_room.room_name).emit('system message', { msg: socket.request.i18n.t("the game has stopped")+"!", user: data.user, msg_type:7 }); // system message stop game
    } catch (err) {
      debug(socket.id,`start game  request error: User ${socket.data}, request: ${data} `,err);
      socket.emit('error message',  socket.request.i18n.t(err));
    }
  });

  socket.on('start game', async  (data) => {
    try {
      debug("start game request", "socket.data",socket.data, "data",data);

      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      let the_room=gameLogic.getRoomWithTeamsReady(socket);
      gameLogic.checkHost({user:user, room:the_room });

      the_room.game_status=1;
      the_room.step=0;
      the_room.turn=1;
      the_room.active_team=1;
      gameLogic.resetRoomCardsResponsesMap(the_room);

      const states_unsecured = await gameLogic.getRoomStates(the_room.id);

        //send team sheme to the team
      for (let team_id = 1; team_id<3; team_id++ ){
        var states = await gameLogic.getTeamStates({room_id:the_room.id, team_id:team_id, states_unsecured: states_unsecured });
        io.to(the_room.room_name+team_id).emit('team scheme',  { room_id: the_room.id,team:team_id, states: states});
      }
      
      // send team scheme to observers
      var states = await gameLogic.getTeamStates({room_id:the_room.id, team_id:0, states_unsecured: states_unsecured });
      debug(`start game - observer schema: `,states);
      io.to(the_room.room_name).emit('team scheme',  { room_id: the_room.id, states: states}); // no team!
      io.to(the_room.room_name).emit('system message', { msg: socket.request.i18n.t("Let's start the game")+"!", user: data.user, msg_type:2 }); // system message start game
      gameLogic.roomData({room: the_room, io:io });
      //const { rows } = await codenames_DB.query('UPDATE rooms SET stat=$2 WHERE id = $1', [room_id],[0]);  
      debug("start game success, room:",the_room);
    } catch (err) {
      debug(socket.id,`start game  request error: User ${socket.data}, request: ${data} `,err);
      socket.emit('error message',  socket.request.i18n.t(err));
      //socket.emit('error message',  `unknown error ${err}`);
    }
  });

  socket.on('challenge', async  (data) => { // emit the challenge so  players of other team will agree with the cards
    try {
      debug("challenge request", "socket.data",socket.data, "data",data);
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
      gameLogic.roomData({room: the_room, io:io });
      io.to(the_room.room_name).emit('system message', { msg: `${socket.request.i18n.t(teams_list[user.team]) } ${socket.request.i18n.t("team sends the challenge")}:`, user: data.user, team: user.team, challenge: data.challenge, clicks: clicks, msg_type:3 }); // system message challenge
      
    } catch (err) {
      debug(socket.id,`challenge request error:`,err);
      socket.emit('error message',  socket.request.i18n.t(err));
    }
  });

  socket.on('card_choice', async  (data) => { // emit the challenge so  players of other team will agree with the cards
    try {
      debug("card_choice", "socket.data",socket.data, "data",data);
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
        //debug(`card_response_map ${key} = ${value}`);
      }
      //debug("card_choice consent", consent);
      if (consent) {
        // update states in the database
        var states = await gameLogic.getStatesRevertTheCard({the_room:the_room,card_id:data.card_id});
          
        // broadcast new states to all users
        const reveal_role= states[2-the_room.active_team][data.card_id];
        io.to(the_room.room_name).emit('system message', { 
            msg: `${socket.request.i18n.t(teams_list[user.team]) } ${socket.request.i18n.t("team has chosen the card: {card_text}, which is {reveal_role}")}`, 
            user: user.username,
            team: the_room.active_team,
            card_id:data.card_id,
            reveal_role:reveal_role,
            msg_type:5
        }); // system message card_chosen
        //check if any spies are left?
        if (!gameLogic.countHiddenSpies(states) ) {
          // end game ?
          //the_room.game_status=0;
          gameLogic.roomData({room: the_room, io:io });
          io.to(the_room.room_name).emit('system message', { msg: socket.request.i18n.t("<span class=\"highlight\">You all are WINNERS - game over!</span> <br/> Host can stop the game and regenerate the room."), user: "game", msg_type:8 }); // system message win game
        } else {
          if (reveal_role==4) {
            the_room.clicks[the_room.active_team]--;
            if (!the_room.clicks[the_room.active_team]) {
              // change the  turn and the step, team is the same
              gameLogic.endTurn({io:io, i18n:socket.request.i18n, the_room:the_room,states:states,user: user.username,main_msg:`${socket.request.i18n.t(teams_list[user.team]) } ${socket.request.i18n.t("team run out of clicks")}.`});
            } else {
              gameLogic.roomData({room: the_room, io:io });
            }
          } else {
              // change the  turn and the step, team is the same
              gameLogic.endTurn({io:io, i18n:socket.request.i18n, the_room:the_room,states:states,user: user.username,main_msg:`${socket.request.i18n.t(teams_list[user.team]) } ${socket.request.i18n.t("team is missed")}.`});
          }
          //gameLogic.roomData({room: the_room, io:io });
        }
      } else {
        // send the status update on the card selection
        io.to(the_room.room_name).emit('system message', { msg: `${socket.request.i18n.t(teams_list[user.team]) } ${socket.request.i18n.t("team has no consent")}:`, user: user.username, msg_type:4, card_response_array:card_response_array }); // system message no_consent
      }

    } catch (err) {
      debug(socket.id,`card_choice error:`,err);
      socket.emit('error message',  socket.request.i18n.t(err));
    }
  });

  socket.on('end_turn', async  (data) => { // emit the system message so team will agree to end the turn
    try {
      debug("end_turn", "socket.data",socket.data, "data",data);
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      gameLogic.checkUserHasTeam(user);
      let the_room=getRoom(user.room);
      
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
            var rows = await gameLogic.readStates(the_room.id);
            gameLogic.endTurn({io:io, i18n:socket.request.i18n, the_room:the_room,states:rows[0].states, user: user.username, main_msg:`${socket.request.i18n.t(teams_list[user.team]) } ${socket.request.i18n.t("team decided to end current turn")}.`});            
        } else {
        io.to(the_room.room_name).emit('system message', { msg: `${socket.request.i18n.t(teams_list[user.team]) } ${socket.request.i18n.t("team has no consent for end turn")} `, user: user.username, msg_type:0 }); // system message / general
        }
    } catch (err) {
      debug(socket.id,`end_turn error:`,err);
      socket.emit('error message',  socket.request.i18n.t(err));      
    }
  });
  
  socket.on('cancel leaving room', async  (data) => {
    try {
      debug("cancel leaving room", "socket.data",socket.data, "data",data);
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      let the_room=getRoom(user.room);
      updateUser ( { id:user.id, active:1 });
      gameLogic.roomData({room: the_room, io:io });
    } catch (err) {
      debug(socket.id,`card_choice error:`,err);
      socket.emit('error message',  socket.request.i18n.t(err));
    }
  });
  
  socket.on('request to leave room', async  (data) => {
    try{
      debug("request to leave room", "socket.data",socket.data, "data",data);
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      let the_room=getRoom(user.room);
        updateUser ( { id:user.id, active:0 });
        gameLogic.roomData({room: the_room, io:io });
        let timeout = setTimeout(function() {
          gameLogic.delayedUserLeaveTheRoom(the_room,user,socket);
        }, 30000); //0.5 min
      
    } catch (err) {
      debug(socket.id,`challenge request error:`,err);
      socket.emit('error message',  socket.request.i18n.t(err));
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
    
    debug('leave room - userleft:',userleft);
    try { //|| !userleft.room
      let the_room=getRoom(userleft.room);
      gameLogic.kickUserFromTheRoom({the_room: the_room, userleft: userleft, socket: socket});
      //socket.leave(userleft.room);
    } 
    catch (err) {
      debug("no room found to leave for 'userleft'",userleft, "socket.data",socket.data, "data",data,err);
    }
  });
    
  socket.on('kick user request', async  (data) => {
    try {
      debug("kick user request", "socket.data",socket.data, "data",data);
      gameLogic.checkSocketDataUserIDReady(socket);
      const user = gameLogic.getUserFromSocket(socket);
      //let the_room=gameLogic.getRoomWithTeamsReady(socket);
      let the_room=getRoom(socket.data.room_id);
      gameLogic.checkHost({user:user, room:the_room });
      //const users = gameLogic.getUsersInRoom(the_room.id, 0);
      var userleft = getUserByRoomAndName({room:the_room.id, username:data.user, strict:1});
      userleft=removeUser(userleft.id);
      gameLogic.kickUserFromTheRoom({the_room: the_room, userleft: userleft, io:io});

    } catch (err) {
      debug(socket.id,`challenge request error:`,err);
      socket.emit('error message',  socket.request.i18n.t(err));
    }
  });

  // Listen for chat messages and emit to the room
  socket.on('chat message', (data) => {
    io.to(data.room).emit('chat message', { msg: data.msg, user: data.user, msgclass: data.msgclass });
    debug(socket.id,'chat message', socket.data, data.user, data.msg);
  });
  
  socket.on('disconnect', (reason) => {
    try {
      let user = getUser(socket.id);
      if (user === undefined){
        user = getUser(socket.data.user_id);
      }
      if (user === undefined){
        debug("disconnect - socket_data",socket.data);
        debug(socket.id,`disconnect - unknown user ${socket.data.user_id} disconnected`, reason);
      } else  {
          if ( !socket.data.room_id ) {
            throw "no room in socket";
          }
            const the_room = getRoom(socket.data.room_id);
            updateUser ( { id:user.id, active:0 });
            gameLogic.roomData({room: the_room, io:io });
            io.to(the_room.room_name).emit('system message', { msg: `${socket.request.i18n.t("I am disconnected")}, ${reason}`, user: user.username });
            let timeout = setTimeout(function() {
              gameLogic.delayedUserLeaveTheRoom(the_room,user,socket);
            }, 120000); // 2 min
            debug(socket.id,`user ${user.username} disconnected`, reason);
      }
    } catch (err) {
      debug(socket.id,`disconnect error: User ${socket.data}, reason ${reason}, `,err);
    }
  });
}
  
module.exports = io_socket_connected;