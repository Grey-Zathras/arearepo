var {  teams_list, step_verbs, log_debug_on, isInt } = require("./glbl_objcts");
const wordList = require('./wordlist');
const gameLogic = require('./game_logic');
const cardGenerator = require('./card_generator');
const { addUser, removeUser, getUser, getUsersInRoom, getUserByRoomAndName, updateUser } = require("./users");
const { addRoom, removeRoom, getRoom, updateRoom, makeid } = require("./rooms");
const codenames_DB = require('../db');

const io_socket_connected = (socket) => {
  const io = socket.server; 
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
      gameLogic.roomData({room: the_room, io:io });
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
      gameLogic.roomData({room: the_room, io:io });
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

      gameLogic.roomData({room: the_room, io:io });
      io.to(the_room.room_name).emit('system message', { msg: "the game has stopped!", user: data.user, msg_type:7 }); // system message stop game
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
      gameLogic.resetRoomCardsResponsesMap(the_room);

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
      gameLogic.roomData({room: the_room, io:io });
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
      gameLogic.roomData({room: the_room, io:io });
      io.to(the_room.room_name).emit('system message', { msg: `${teams_list[user.team] } team sends the challenge:`, user: data.user, team: user.team, challenge: data.challenge, clicks: clicks, msg_type:3 }); // system message challenge
      
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
            msg_type:5
        }); // system message card_chosen
        //check if any spies are left?
        if (!gameLogic.countHiddenSPies(states) ) {
          // end game ?
          //the_room.game_status=0;
          gameLogic.roomData({room: the_room, io:io });
          io.to(the_room.room_name).emit('system message', { msg: "<span class=\"highlight\">You all are WINNERS - game over!</span> <br/> Host can stop the game and regenerate the room.", user: "game", msg_type:8 }); // system message win game
        } else {
          if (reveal_role==4) {
            the_room.clicks[the_room.active_team]--;
            if (!the_room.clicks[the_room.active_team]) {
              // change the  turn and the step, team is the same
              gameLogic.endTurn({io:io,the_room:the_room,states:states,user: user.username,main_msg:`${teams_list[user.team] } team run out of clicks.`});
            } else {
              gameLogic.roomData({room: the_room, io:io });
            }
          } else {
              // change the  turn and the step, team is the same
              gameLogic.endTurn({io:io, the_room:the_room,states:states,user: user.username,main_msg:`${teams_list[user.team] } team is missed.`});
          }
          //gameLogic.roomData({room: the_room, io:io });
        }
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
      //let the_room=gameLogic.getRoomInResponseStep(socket,user);
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
            //the_room.turn++;
            //the_room.step = 0; //now is the Challenge step 
            var rows = await gameLogic.readStates(the_room.id);

            gameLogic.endTurn({io:io, the_room:the_room,states:rows[0].states, user: user.username, main_msg:`${teams_list[user.team] } team decided to end current turn.`});
            
            //io.to(the_room.room_name).emit('system message', { msg: `${teams_list[user.team] } team decided to end current turn.  New Turn:${the_room.turn} !`, user: user.username, msg_type:6}); // system message end turn
            //gameLogic.roomData({room: the_room, io:io});
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
      gameLogic.roomData({room: the_room, io:io });
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
        updateUser ( { id:user.id, active:0 });
        gameLogic.roomData({room: the_room, io:io });
        let timeout = setTimeout(function() {
          gameLogic.delayedUserLeaveTheRoom(the_room,user,socket);
        }, 30000); //0.5 min
      
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
    try {
      let user = getUser(socket.id);
      if (user === undefined){
        user = getUser(socket.data.user_id);
      }
      if (user === undefined){
        console.log("disconnect - socket_data",socket.data);
        console.log(socket.id,`disconnect - unknown user ${socket.data.user_id} disconnected`, reason);
      } else  {
          if ( !socket.data.room_id ) {
            throw "no room in socket";
          }
            const the_room = getRoom(socket.data.room_id);
            updateUser ( { id:user.id, active:0 });
            gameLogic.roomData({room: the_room, io:io });
            io.to(the_room.room_name).emit('system message', { msg: `I am disconnected, ${reason}`, user: user.username });
            let timeout = setTimeout(function() {
              gameLogic.delayedUserLeaveTheRoom(the_room,user,socket);
            }, 120000); // 2 min
            console.log(socket.id,`user ${user.username} disconnected`, reason);
      }
    } catch (err) {
      console.log(socket.id,`disconnect error: User ${socket.data}, reason ${reason}, `,err);
      //socket.emit('error message',  `unknown error ${err}`);
    }
  });
}
  
module.exports = io_socket_connected;