const users = [];

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
  const existingUser = users.find(user => {
    return user.room === room && user.username === username;
  });

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
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const updateUser = ( {id,  active, team } ) => {
    const index = users.findIndex(user => user.id === id);
    if (index == -1){
        return {
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

const getUsersInRoom = room => {
  //room = room.trim().toLowerCase();
  return users.filter(user => user.room === room);
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  updateUser
};

