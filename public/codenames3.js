var ok_to_leave=0;
var card_event=0;

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
      //console.log(item.outerHTML, text);
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
      //console.log(item.outerHTML, text);
    }
    system_messages.insertBefore(item, system_messages.firstChild);
      //messages.appendChild(item);
      //window.scrollTo(0, document.body.scrollHeight);
    //window.scrollTo(0, 0); // Scroll to the top to show the newest message
  }

  const activeClass=["inactive","active"]; // member chat status
  const memberTagID = ["Observers","Red_team", "Blue_team"]; // team membership 
  const player_class_array=['closed', 'spy', 'killer', 'spy_opened','civilian','killer_opened' ]; // cards on the table
  //var observer_class_array=[ 'spy_opened','civilian','killer_opened' ]; // cards on the table
  const teams_list=["observer","Red","Blue"]; //team membership text for chat
  const step_verbs=["Challendge", "Response"]; // game status terms
  
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

  function refreshTable(states, role,team){
    if (typeof states === "undefined") {
        for (var i=0;i<25;i++){
            var card = document.getElementById('card['+i+']');
            card.className="card ";
          }
    } else if (role=="player") {
      for (var i=0;i<25;i++){
        var card = document.getElementById('card['+i+']');
        card.className=card.className +" " + player_class_array[states[i] ];
      }
    } else {
        for (var i=0;i<25;i++){
            var card = document.getElementById('card['+i+']');
            card.className=card.className + " " +player_class_array[states[i] ]+team;
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
      chooseTeamBlock.style.display = "none";
      userTeam.disabled=true;

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
    switch (data.msg_type) {
        case 0: { // start the game
            //game_progress.style.display = "contents";
            //gamestat.innerText = "Game Started"; 
            //startButton.style.display = "none";
            //chooseTeamBlock.style.display = "none";
            //challendgeBlock.style.display = "contents";
        }
    }
  });
  socket.on('error message', function(data) {
    console.log('error message data', data);
    addSysMsgLine(data,"errormsg");
  });
  socket.on('team scheme', function(data) {
    console.log('team scheme data',data);
    refreshTable();
    if (data.team >0 ) {
        refreshTable(data.states[data.team-1],"player");
        refreshTable(data.states[2-data.team],"team",(3-data.team));
        addChatLine("welcome to the "+teams_list[data.team]+" team" ,"sysmsg");
    } else {
        refreshTable(data.states[data.team-1],"team",(data.team));
        refreshTable(data.states[2-data.team],"team",(3-data.team));
    }
  });
  socket.on('userID', function(data) {
    console.log('userID data',data,"socket.id",socket.id );
    userID = socket.id;
    setCookie("userid", userID, 7);
  });
  socket.on('roomData', function(data) { // general refresh page / status event
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
    if (data.room.game_status>0) { //game started, cannot join the Team
      chooseTeamBlock.style.display = "none";
      game_progress.style.display = "contents";
      gamestat.innerText = "Game Started"; 
      activeteam.innerText =  data.room.active_team;
      activestep.innerText =  step_verbs[data.room.step];
      turn.innerText =  data.room.turn;
      if (data.room.active_team>0) { // game started, show the Challenge block fo the Team member
        challendgeBlock.style.display = "contents";
      }
    }
    
    //
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

    ok_to_leave=1;
    let timeout = setTimeout(function() {
        // user stayed, do stuff here
      ok_to_leave=0;
    }, 1000);

    // You can customize the message, but modern browsers often display their own default message for security reasons.
    var confirmationMessage = 'You have unsaved changes! Are you sure you want to leave?';
    socket.emit('chat message', {  msg: "user leaving the room "+room+" - window event1", user: userName, userid:getCookie("userid")});

    // Some browsers may display this message to the user, prompting them to confirm if they want to leave the page.
    (e || window.event).returnValue = confirmationMessage; // Gecko + IE
    return confirmationMessage; // Webkit, Safari, Chrome etc.
  });
  window.addEventListener('unload', function (e) {
    //if (ok_to_leave)
       socket.emit('leave room', { room: room, msg: "user left the room", user: userName, });
  });
};
