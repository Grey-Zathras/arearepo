
const { log_debug_on, teams_list, isInt } = require("./glbl_objcts");
const { addUser, removeUser, getUser, getUsersInRoom,updateUser } = require("./users");
const { addRoom, removeRoom, getRoom, updateRoom } = require("./rooms");
const codenames_DB = require('../db');

exports.roomData = function ({room, io}) {
    //console.log("gamelogic roomData room:",room);
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

exports.checkSocketDataUserIDReady = function (socket) {
    //console.log("checkSocketDataUserIDReady socket",socket);
    if (typeof socket.data.user_id === "undefined"){
        const errmsg="socket data is corrupted. pls reconnect";
        throw (errmsg);
    }
}

exports.checkHost = function ({user,room}) {
    if (user.id!=room.host){
      const errmsg="host role is required!";
      throw (errmsg);
    }
}

exports.getUserFromSocket = function (socket) {
    const user = getUser(socket.data.user_id);
    if ( user === undefined){
        const errmsg="user id not found in the users list";
        throw (errmsg);
    }
    return user; 
}

exports.getRoomWithTeamsReady = function (socket) {
    let the_room=getRoom(socket.data.room_id);
    if (the_room.game_status) {
        const errmsg="wrong request - game is already started";
        throw (errmsg);
      }
    let users = getUsersInRoom(the_room.id, 0);
    if (! (users.filter(user => user.team == 1).length && users.filter(user => user.team == 2).length) ) {
     const  errmsg="one of the teams is empty";
      throw (errmsg);
    }
    return the_room;
}

exports.checkUserHasTeam = function (user) {
  //console.log("checkUserHasTeam user",user);  
  if (!user.team) {
        const errmsg="user is obsever, not allowed to play";
        throw (errmsg);
      }
}

exports.getRoomInChallengeStep = function (socket,user) {
    let the_room=getRoom(socket.data.room_id);

    if (the_room.step) {
      const errmsg="wrong step - current step is Response:" + the_room.step;
      throw (errmsg);
    }
    exports.checkUserTeamIsActive (the_room,user);
    return the_room;
}

exports.getChallengeClicks = function (data) {
    if (data.challenge=="" || data.clicks=="") {
        const errmsg="Challenge or clicks data is missing";
        throw (errmsg);
      }
      var clicks=parseInt(data.clicks);
      if (!clicks || clicks < 0 ) {
        const errmsg="clicks should be integer and > 0";
        throw (errmsg);
      }
      if (clicks>9) {
        const errmsg="no more than 9 clicks!";
        throw (errmsg);
      }
    return clicks;
}

exports.resetRoomCardsResponsesMap = function (the_room){
    //preparation for the cards selection by all the team members
    delete the_room.card_response_map;
    the_room.card_response_map=new Map();
    delete the_room.end_turn_map;
    the_room.end_turn_map=new Map();
    const users= getUsersInRoom(the_room.id, 1).filter(user => user.team == the_room.active_team);
    users.forEach(user1 => {
      the_room.card_response_map.set(user1.username,""); // don't share the user id with all the room
      the_room.end_turn_map.set(user1.username,""); // don't share the user id with all the room
    });
}

exports.getRoomInResponseStep = function (socket,user) {
    let the_room=getRoom(socket.data.room_id);

    if (the_room.step != 1) {
      const errmsg="wrong step - current step is Challenge:" + the_room.step;
      throw (errmsg);
    }
    exports.checkUserTeamIsActive (the_room,user);
    return the_room;
}

exports.checkUserTeamIsActive = function (the_room,user) {
    if (the_room.active_team!= user.team) {
        const errmsg="wrong team - the other team should play this step";
        throw (errmsg);
      }  
}
exports.readStates = async function (the_room_id) {
  var { rows } = await codenames_DB.query('SELECT states FROM rooms WHERE id = $1', [the_room_id]);
  if (rows.length === 0) {
      const errmsg= `Room ${the_room_id} not found`;
      throw (errmsg);
  }
  if (!Array.isArray(rows[0].states)  ){
    const errmsg= `Room ${the_room_id} not found`; 
    throw (errmsg);
  }
  return rows;
}
exports.writeStates = async function ({the_room_id,cards,states}) {
  try {
    await codenames_DB.query('BEGIN');
    if (cards) {
      const queryText = 'UPDATE rooms SET states=$2, cards=$3 WHERE id = $1';
      var { rows } = await codenames_DB.query(queryText, [the_room_id,states,cards]);
    } else {
      const queryText = 'UPDATE rooms SET states=$2 WHERE id = $1';
      var { rows } = await codenames_DB.query(queryText, [the_room_id,states]);
    }
    
    await codenames_DB.query('COMMIT');
  } catch (e) {
    await codenames_DB.query('ROLLBACK');
    throw e;
  } finally {
    //codenames_DB.release()
  }
  return rows;
}

exports.getStatesRevertTheCard = async function ({the_room,card_id}) {
  var rows = await exports.readStates(the_room.id);
  if (rows[0].states[2-the_room.active_team][card_id] >2 ) {
      const errmsg= `Card ${the_room.id} is already opened`;
      throw (errmsg);
  }
  rows[0].states[2-the_room.active_team][card_id]+=3;
  if (rows[0].states[2-the_room.active_team][card_id] >3 ) { //4 = spy, 5 = killer
      rows[0].states[the_room.active_team-1][card_id]=rows[0].states[2-the_room.active_team][card_id];
  }
  exports.writeStates({the_room_id: the_room.id, states: rows[0].states}); //await not needed ?
  return rows[0].states;      
}

exports.kickUserFromTheRoom = async function ({the_room,userleft,socket,io}) {
    try {
        if (!io){
          io=socket.server;
        } 
        if (!userleft) {
            throw ("no user data to clean");
        }
        if (!the_room) 
            throw ("no room found to disconnect");
        io.to(the_room.room_name).emit('system message', { msg: socket.request.i18n.t("user left the room"), user: userleft.username, msgclass:"sysmsg" });
        if (the_room.host == userleft.id) {
          const users= getUsersInRoom(the_room.id, 1).filter(user => user.active == 1);
          const res1=users.length;
          console.log('kickUserFromTheRoom - getUsersInRoom:',users,res1);
          if (!users.length) {
            console.log("last active user left the room - room will be closed");
            io.to(the_room.room_name).emit('system message', { msg: socket.request.i18n.t("last active user left the room - room will be destroyed"), user: userleft.username });
            removeRoom(the_room.id);
          } else {
            const new_host = users[0];
            console.log("kickUserFromTheRoom - reassigning host to the 'host':",new_host.username );
            updateRoom({id:the_room.id, host:new_host.id });
            //let the_room=getRoom(the_room.id);
            exports.roomData({room: the_room , host:new_host.username, io:io});
            io.to(the_room.room_name).emit('system message', { msg: `${socket.request.i18n.t("Room host")}  ${userleft.username}  ${socket.request.i18n.t("left the room, I am the new host")}`, user: new_host.username });
          }
        } else {
          exports.roomData({room: the_room, io:io });
        }
        if (socket) { //user is leaving
          socket.disconnect(true);
          /*
          socket.leave(userleft.room);
          if (userleft.team) {
              socket.leave(userleft.room+userleft.team);
          }
          */
        } else {  // owner is kicking the user
          const userSockets = await io.of('/').in(the_room.room_name).fetchSockets(); // await ?
          //console.log(`kickUserFromTheRoom debug: the_room ${the_room}, userleft: ${userleft} `,"userSockets",userSockets);
          const userSocket = userSockets.find(the_socket => the_socket.data.user_id.toString() === userleft.id);
          //console.log(`kickUserFromTheRoom debug: the_room ${the_room}, userleft: ${userleft} `,"userSocket",userSocket);
          if (userSocket) {
            userSocket.emit('go away', { msg: userSocket.request.i18n.t("host kicked you from the room") });
            userSocket.disconnect(true);
          }
        }
    } catch (err) {
        console.log(`kickUserFromTheRoom error:  the_room ${the_room}, userleft: ${userleft} `,err);
        //throw (err);
    }
}

exports.delayedUserLeaveTheRoom =  function (the_room,user,socket) {
    try {
      const io = socket.server;    
      // user left ?
      console.log("Timeout on leaving the the room - ",the_room, "user",user);
      if(user.active) {
        console.log("user stays in the room room - ",the_room, "user",user);
        updateUser ( { id:user.id, active:1 });
        exports.roomData({room: the_room, io:io });
      }  else {
        console.log("user left the room by timeout - ",the_room, "user",user);
        var userleft=removeUser(user.id);
        exports.kickUserFromTheRoom({the_room: the_room, userleft: userleft, socket: socket});
      }
    } catch (err) {
        console.log(`delayedUserLeaveTheRoom :`,err,"the_room",the_room, "user",user);
    }
}

exports.getRoomStates = async function (room_id) {
    var { rows } = await codenames_DB.query('SELECT states FROM rooms WHERE id = $1', [room_id]);
    if (rows.length === 0) {
      throw(`Room ${room_id} not found`);
    } 
    if (!Array.isArray(rows[0].states)  ) {
      throw (`Room ${room_id} - game data not found, pls generate the table`);
    }
    return rows[0].states;
}

exports.getTeamStates = async function ({room_id,team_id,states_unsecured}) {
  if (!Array.isArray(states_unsecured)) {
      states_unsecured = await exports.getRoomStates(room_id); 
  }
  //console.log("getTeamStates, states_unsecured:", states_unsecured);     
  var states = [];
  states[0]=states_unsecured[0].slice();
  states[1]=states_unsecured[1].slice();
  
  const forbidden=[1,2];
  if (team_id) {
    states[2-team_id].forEach((state,index) => {
      // cleanup spies
      if (forbidden.includes(state) ){
        states[2-team_id][index]=0;
      }
    });
  } else {
    // secure both teams
    states.forEach((arr) => {
      arr.forEach((state,index) => {
        if (forbidden.includes(state) ){
          arr[index]=0;
        }
      });
    });
  }
  //console.log(`getTeamStates,team_id, ${team_id}, states:`, states);     
  return states;
}

exports.countHiddenSpies =  function (states) {
  let hidden_spies=0;
  states.forEach((arr) => {
    arr.forEach((state,index) => {
      if (state==1 ){
        hidden_spies++;
      }
    });
  });
  return hidden_spies;
}

exports.endTurn =  function ({the_room, states,main_msg, user, io, i18n }) {
  if ( !the_room.step ) {  //the Challenge step
    the_room.active_team=3-the_room.active_team;
  }
  the_room.turn++;
  the_room.step = 0; //now is the Challenge step
  let count = states[the_room.active_team-1].reduce((total,x) => total+(x==1), 0);
  if (!count){
    io.to(the_room.room_name).emit('system message', { msg: `${i18n.t(teams_list[the_room.active_team]) } ${i18n.t("team has no more spies")}!`, user: "game", msg_type:0 }); // system message / general
    the_room.active_team=3-the_room.active_team;
  } 
  exports.resetRoomCardsResponsesMap(the_room);
  exports.roomData({room: the_room, io:io });
  if (main_msg ) {
    io.to(the_room.room_name).emit('system message', { msg: `${main_msg } ${i18n.t("New Turn")}: ${the_room.turn} !`, user: user,team:the_room.active_team, msg_type:6}); // system message end turn
  }
}

exports.joinTeam = async function ({socket,team_id}) { // data.room
  try {
    const io = socket.server; 
    socket.data.team = team_id;
    const room_id = socket.data.room_id;
    // read database stats
    if (!isInt(room_id)) {
      console.log(` joinTeam - SQL injection attack ${socket.data.room_id}`);
      throw(`Room ${room_id} not found`);
    }  
    updateUser ( { id:socket.data.user_id, active:1,team: team_id});
    const the_room=getRoom(room_id);
    exports.roomData({room: the_room, io:io });
    if (team_id >0) {
      if(the_room.game_status==1) { // if (the_room.game_status==1)
        var states = await exports.getTeamStates({room_id:room_id, team_id:team_id});
        //console.log(` joinTeam, states `,states);
        socket.emit('team scheme',  { room_id: room_id,team:team_id, states: states});
      }
      socket.join(the_room.room_name+team_id);
      //console.log(socket.id,` Join Team: User ${team_id} result socket:`,socket);
    } else { // reconnect for observer
      var states = await exports.getTeamStates({room_id:the_room.id, team_id:0 });
      socket.emit('team scheme',  { room_id: room_id,team:0, states: states}); // Observer
    }
    io.to(the_room.room_name).emit('system message', { msg: socket.request.i18n.t("User joined the team"), user: socket.data.username,team:team_id , msg_type:1}); // system message
    console.log(socket.id,` User ${socket.data.username}/${socket.data.user_id} changed team to ${team_id} in room: ${the_room.room_name}`);
  } catch (err){
    console.log(socket.id,` Join Team: User ${socket.data} has got error`,err);
    socket.emit('error message',  err);
  }
}

exports.destroyRoom = function ({io, the_room}){
  const users = getUsersInRoom(the_room.id, 1);
  users.forEach(userleft => {
    removeUser(userleft.id);
    exports.kickUserFromTheRoom({the_room: the_room,userleft: userleft, io:io});  // await ?
  });      

  io.socketsLeave(the_room.room_name);
  const { rows } =  codenames_DB.query(
    'DELETE FROM rooms WHERE id = $1 RETURNING *',
    [the_room.id]
  ); //no await
}