const rooms = [];

const addRoom = ({ id, room_name, host /*, room_socket_id, room_code */}) => {
  // Clean the data
  
 // room_name = room_name.trim().toLowerCase();
 // room = room.trim().toLowerCase();

  // Validate the data
  if (!room_name || !id ||!host) {
    return {
      error: "Username and room are required!"
    };
  }

  // Check for existing room
  const existingRoom = rooms.find(room => {
    return room.id === id || room.room_name === room_name;
  });

  // Validate room_name
  if (existingRoom) {
    const room = getRoom(id);  
    return {
        room: room,
        msg: "Room name is in use!"
    }
  }

  // Store room { id, room_name, host , game_status 0|1|2 , active_team 1|2, turn, step 0|1, challenge, clicks[3], card_response_map  };
  const room = { id, room_name, host ,game_status :0, active_team:1, step:0, turn:0, challenge:"", clicks:[0,0,0], card_response_map:{}};
  rooms.push(room);
  return { room };
};

const removeRoom = id => {
  const index = rooms.findIndex(room => room.id === id);

  if (index !== -1) {
    return rooms.splice(index, 1)[0];
  }
};

const updateRoom = ( {id,  game_status, active_team, turn, step, host, challenge, clicks } ) => {
    const index = rooms.findIndex(room => room.id === id);
    if (index == -1){
        return {
            error: "Room not found!"
          };
    }
    if (typeof game_status !== "undefined")
        rooms[index].game_status = game_status;
    if (host !== undefined)
      rooms[index].host = host;
      if (challenge !== undefined)
      rooms[index].challenge = challenge;
      if (Array.isArray(clicks)){
        clicks.forEach((click, team_index) => {
          rooms[index].clicks[team_index] = click;
        });
      }
      //rooms[index].clicks = clicks;
    
    if (active_team !== undefined)
      rooms[index].active_team = active_team;
    if (step !== undefined)
      rooms[index].step = step;
    if (turn !== undefined)
      rooms[index].turn = turn;
  };
  
const getRoom = id => {
  return rooms.find(room => room.id === id);
};

module.exports = {
  addRoom,
  removeRoom,
  getRoom,
  updateRoom
};

