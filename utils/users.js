const users = [];

function ciEquals(a, b) {
    return typeof a === 'string' && typeof b === 'string'
        ? a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0
        : a === b; // sensitivity: 'accent'
}

const getUserByRoomAndName =  ({room, username,strict}) => {
  var existingUser;
  if (strict){
    existingUser = users.find(user => {
      return user.room === room && user.username == username;
    });
  } else {
    existingUser = users.find(user => {
      return user.room === room && ciEquals(user.username, username);
    });
  } 
  return existingUser;
};

const addUser = ({ id, username, room }) => {
  // Clean the data
  
 // username = username.trim().toLowerCase();
 // room = room.trim().toLowerCase();

  // Validate the data
  if (!username || !room) {
    return {
      error: "Username and room are required!"
    };
  }

  // Check for existing user 
  const existingUser = getUserByRoomAndName({room:room, username:username, strict:0});
  
  // Validate username
  if (existingUser) {
    const user = getUser(id);
    if (user === undefined ) {
       return {
        error: "Username is in use!"
        }
    } else  {
      return { 
        user,
        msg: "reconnect" 
      };
    }
  }

  // Store user { id, username, room , team 0|1|2 , active 0|1};
  const user = { id, username, room ,team:0, active:1};
  users.push(user);
  return { user };
};

const removeUser = id => {
  console.log("Users.removeUser","id",id,"from users",users);
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const updateUser = ( {id,  active, team } ) => {
    const index = users.findIndex(user => user.id === id);
    if (index == -1){
        throw {
            error: "User not found!"
          };
    }
    users[index].active = active;
    if (team !== undefined)
      users[index].team = team;
  };
  
const getUser = id => {
  return users.find(user => user.id === id);
};

const getUsersInRoom = (room, keepID) => {
  //room = room.trim().toLowerCase();
  let uu1=users.filter(user => user.room === room);
  //console.log("users.getUsersInRoom, keepID:",keepID,"room:",room);
  if (keepID)
    return uu1;
  else {
    let uu2=[];
    uu1.forEach(user => {
      let user2= Object.assign({}, user); 
      delete user2.id;
      uu2.push(user2);  
    });
    return uu2;
  }
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  getUserByRoomAndName,
  updateUser
};

