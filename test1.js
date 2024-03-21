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
  /*     return {
      error: "Username is in use!"
    }; */
    return getUser(id);
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
  room = room.trim().toLowerCase();
  return users.filter(user => user.room === room);
};

var test=addUser({ id:11, username:"username", room:"room" });
updateUser( { id:11, active:1, team:3 } );
console.log(test);
  
  /*

  
  var test=exports.generateCards25(wordList);
  var test1=exports.generateSpies();

 console.log(test);
 console.log(test1[0]);
 console.log(test1[1]);


  var url = require('url');
var addr = ' http :// localhost : 8080 /curses.htm?course=Java&price=100';
var p = url.parse(addr, true);
var http = require('http');
http.createServer(function (req, res) {

    //print it to console
    console.log("Hostname: "+p.host);
    console.log("Path: "+ p.pathname);
    console.log("Search string: "+p.search);
    var pinfo = p.query;
    console.log("Price of course "+pinfo.course+" is $"+pinfo.price);
    // display on Web page
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("<p>Hostname: "+p.host);
    res.write("<p>Pathname: "+p.path);
    res.write("<p>Search string: "+p.search);
    res.write("<p>Price of course "+pinfo.course+" is $"+pinfo.price);
}).listen(8080);
*/