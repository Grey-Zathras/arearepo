
const { app, server, io } = require("./glbl_objcts");
const { addUser, removeUser, getUser, getUsersInRoom,updateUser } = require("./users");
const { addRoom, removeRoom, getRoom, updateRoom } = require("./rooms");

exports.roomData = function ({room}) {
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
        //socket.emit('error message',  errmsg);
        throw (errmsg);
    }
}

exports.getUserFromSocket = function (socket) {
    const user = getUser(socket.data.user_id);
    if ( user === undefined){
        const errmsg="user id not found in the users list";
        //socket.emit('error message',  errmsg);
        throw (errmsg);
    }
    return user; 
}

exports.getRoomWithTeamsReady = function (socket) {
    let the_room=getRoom(socket.data.room_id);
    if (the_room.game_status) {
        const errmsg="wrong request - game is already started";
        //socket.emit('error message',  errmsg);
        throw (errmsg);
      }
    let users = getUsersInRoom(the_room.id, 0);
    if (! (users.filter(user => user.team == 1).length && users.filter(user => user.team == 2).length) ) {
     const  errmsg="one of the teams are empty";
      //socket.emit('error message',  errmsg);
      throw (errmsg);
    }
    return the_room;
}

exports.checkUserHasTeam = function (user) {
  console.log("checkUserHasTeam user",user);  
  if (!user.team) {
        const errmsg="user is obsever, not allowed to play";
        //socket.emit('error message',  errmsg);
        throw (errmsg);
      }
}

exports.getRoomInChallengeStep = function (socket,user) {
    let the_room=getRoom(socket.data.room_id);

    if (the_room.step) {
      const errmsg="wrong step - current step is Response:" + the_room.step;
      //socket.emit('error message',  errmsg);
      throw (errmsg);
    }
    if (the_room.active_team!= user.team) {
      const errmsg="wrong team - the other team should play this step";
      //socket.emit('error message',  errmsg);
      throw (errmsg);
    }  
    return the_room;
}

exports.getChallengeClicks = function (data) {
    if (data.challenge=="" || data.clicks=="") {
        const errmsg="Challenge or clicks data is missing";
        //socket.emit('error message',  errmsg);
        throw (errmsg);
      }
      var clicks=parseInt(data.clicks);
      if (!clicks) {
        const errmsg="clicks should be numeric";
        //socket.emit('error message',  errmsg);
        throw (errmsg);
      }
      if (clicks>9) {
        const errmsg="no more than 9 clicks!";
        //socket.emit('error message',  errmsg);
        throw (errmsg);
      }
}

exports.resetRoomCardsResponsesMap = function (the_room){
    //preparation for the cards selection by all the team members
    delete the_room.card_response_map;
    the_room.card_response_map=new Map();
    const users= getUsersInRoom(the_room.id, 1).filter(user => user.team == the_room.active_team);
    users.forEach(user1 => {
      the_room.card_response_map.set(user1.username,""); // don't share the user id with all the room
    });
}
