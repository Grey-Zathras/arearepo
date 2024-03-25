function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
  }

  function setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }

  function addChatLine (text, msgclass=""){
    var item = document.createElement('li');
    if (msgclass==""){
      item.textContent = text;
    } else{
      var item1 = document.createElement('span');
      item1.className=msgclass;
      item.appendChild(item1);
      item1.textContent = text;
      console.log(item.outerHTML, text);
    }
    chat_messages.insertBefore(item, chat_messages.firstChild);
      //messages.appendChild(item);
      //window.scrollTo(0, document.body.scrollHeight);
    //window.scrollTo(0, 0); // Scroll to the top to show the newest message
  }

function addSysMsgLine (text, msgclass=""){
    var item = document.createElement('li');
    if (msgclass==""){
      item.textContent = text;
    } else{
      var item1 = document.createElement('span');
      item1.className=msgclass;
      item.appendChild(item1);
      item1.textContent = text;
      console.log(item.outerHTML, text);
    }
    system_messages.insertBefore(item, system_messages.firstChild);
      //messages.appendChild(item);
      //window.scrollTo(0, document.body.scrollHeight);
    //window.scrollTo(0, 0); // Scroll to the top to show the newest message
  }

  var activeClass=["inactive","active"];
  var memberTagID = ["Observers","Red_team", "Blue_team"];
  var player_class_array=['closed', 'spy', 'killer', 'spy_opened','civilian','killer_opened' ];
  var observer_class_array=[ 'spy_opened','civilian','killer_opened' ];
  var teams_list=["observer","Red","Blue"]; //for chat
  
  var socket = io();

  function ResetMembers(){
    for(var i =0; i<3; i++)
      document.getElementById(memberTagID[i]).innerHTML="";
  }
  function AddMemberLine ({username, team, active}) {
      var item = document.createElement('li');
      var item1 = document.createElement('span');
      //item1.className=activeClass[active];
      item.appendChild(item1);
      item1.textContent = username;
      item1.className=activeClass[active];
      document.getElementById(memberTagID[team]).appendChild(item);
  }

  function refreshTable(states, role){
    if (role=="player") {
      for (var i=0;i<25;i++){
        var card = document.getElementById('card['+i+']');
        card.className="card "+player_class_array[states[i] ];
      }
    }
}

window.onload = function() {
    var userName = getCookie("username");
    var userID = getCookie("userid");
    if (!userName) {
      userName = prompt("Please enter your name:");
      setCookie("username", userName, 7);
      userID = 0;
      //userID = socket.id;
      //setCookie("userid", userID, 7);
    }   else {
      if (!userID) {
        userID = 0;
        //userID = socket.id;
        //setCookie("userid", userID, 7);
      }
    } 

  var chatForm = document.getElementById('chatForm');
  var userForm = document.getElementById('userForm');
  var input = document.getElementById('input');
  
  //var roomInput = document.getElementById('room');
  document.getElementById('userName').value = userName;

  // Join a room
  //document.getElementById('joinRoom').onclick = function() {
    //var room = roomInput.value;
    socket.emit('join room', { room: room, user: userName, room_id: room_id, user_id: userID  });
    socket.emit('chat message', { room: room, msg: "welcome to chat" , user: userName});
  //};

  chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
      //var room = roomInput.value;
      socket.emit('chat message', { room: room, msg: input.value, user: userName , user_id: userID });
      console.log({ room: room, msg: input.value, user: userName  });
      input.value = '';
    }
  });

  userForm.addEventListener('submit', function(e) {
    e.preventDefault();
    console.log(userTeam.value);
    if (userTeam.value) {
      var team = userTeam.value;
      socket.emit('team change', { room: room, team: team, user: userName , user_id: userID });
      //console.log('team change event', { room: room, team: team, user: userName  });
      //input.value = '';
    }
  });
  //  document.getElementById('startButton').addEventListener('click', function(e) {

  startButton.addEventListener('click', function(e) {
    
    socket.emit('start game', { room: room, user: userName , user_id: userID });
    startButton.disabled = true;

    });

  socket.on('chat message', function(data) {
    console.log('chat message data', data);
    addChatLine(data.user + ": " + data.msg);
  });
  socket.on('system message', function(data) {
    console.log('system message data', data);
    addSysMsgLine(data.user + ": " + data.msg,"sysmsg");
  });
  socket.on('error message', function(data) {
    console.log('error message data', data);
    addSysMsgLine(data,"errormsg");
  });
  socket.on('team scheme', function(data) {
    console.log('team scheme data',data);
    //addChatLine(data,"errormsg");
    refreshTable(data.states,"player")
    addChatLine("welcome to the "+teams_list[data.team]+" team" ,"sysmsg");
  });
  socket.on('userID', function(data) {
    console.log('userID data',data,"socket.id",socket.id );
    userID = socket.id;
    setCookie("userid", userID, 7);
  });
  socket.on('roomData', function(data) {
    console.log('roomData',data);
    // check for host and start button
    document.getElementById('host').innerText = data.host;
    if (data.host==userName && !data.room.game_status){
        startButton.disabled=false;
    } else {
        startButton.disabled=true;
    }
    // refresh Teams and Player status
    ResetMembers();
    data.users.forEach((element) => {
      console.dir(element);
      AddMemberLine (element);
    }); 
  });
  /*
  window.addEventListener("visibilitychange", (event) => {
    console.log("visibilitychange "+document.visibilityState );   
  });
  */
  window.addEventListener('beforeunload', function (e) {
    // Uncomment below to cancel the popup and event
    //window.onbeforeunload = undefined;
    //return false; 

    // You can customize the message, but modern browsers often display their own default message for security reasons.
    var confirmationMessage = 'You have unsaved changes! Are you sure you want to leave?';
    socket.emit('chat message', {  msg: "user leaving the room "+room+" - window event1", user: userName, userid:getCookie("userid")});

    // Some browsers may display this message to the user, prompting them to confirm if they want to leave the page.
    (e || window.event).returnValue = confirmationMessage; // Gecko + IE
    return confirmationMessage; // Webkit, Safari, Chrome etc.
  });
  window.addEventListener('unload', function (e) {
    socket.emit('leave room', { room: room, msg: "user left the room", user: userName, });
  });
};