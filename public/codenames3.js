var ok_to_leave=0;
var card_event=""; // event dumb object 
var my_team=0; // current team 0|1|2
var game_obj = {}; // game status / room object

/*
var chat_messages ??= document.getElementById('chat_messages');
var system_messages ??= document.getElementById('system_messages');
var card_table ??= document.getElementById('card_table');
var challenge ??= document.getElementById('challenge');
var room ??= "";
var room_id ??= "";
var clicks ??= document.getElementById('clicks');
var userTeam ??= document.getElementById('userTeam');
var startButton ??= document.getElementById('startButton');
var challenged_text ??= document.getElementById('challenged_text');
var startButton ??= document.getElementById('startButton');
var chooseTeamBlock ??= document.getElementById('chooseTeamBlock');
var game_progress ??= document.getElementById('game_progress');
var gamestat ??= document.getElementById('gamestat');
var activeteam ??= document.getElementById('activeteam');
var activestep ??= document.getElementById('activestep');
var turn ??= document.getElementById('turn');
*/

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

function clickTheCard(e) {
    let rx= /\[(\d+)\]/ ;
    var card_id = e.target.id.match(rx)[1];
    console.log("clickTheCard", e.target.id, "id:",card_id);
    removeClassFromAllElements("my_card_choice");
    e.target.className=e.target.className +" " + "my_card_choice"; 
    //socket.emit('card_choice', { room: room, user: userName , user_id: userID, card_id: card_id});
    socket.emit('card_choice', {  card_id: card_id});
}

function noCardConcent(card_response_array){
    removeClassFromAllElements("card_choice_no_concent");
    card_response_array.forEach((key)=>{
        let cardObj=document.getElementById("card["+key+"]");
        if (!cardObj.classList.contains("my_card_choice")) {
            cardObj.classList.add("card_choice_no_concent");
        }

    });
}

const removeClassFromAllElements = (className) => {
    const allElements = card_table.querySelectorAll('*'); 
    allElements.forEach(el => el.classList.remove(className));
}

  const activeClass=["inactive","active"]; // member chat status
  const memberTagID = ["Observers","Red_team", "Blue_team"]; // team membership 
  const player_class_array=['closed', 'spy', 'killer','civilian', 'spy_opened','killer_opened' ]; // cards on the table
  const card_verbs=['closed', 'spy', 'killer','Мирный житель', 'Шпион','Киллер' ]; // cards on the table - text for chat
  //var observer_class_array=[ 'spy_opened','civilian','killer_opened' ]; // cards on the table
  const teams_list=["observer","Red","Blue"]; //team membership text for chat
  const step_verbs=["Challenge", "Response"]; // game status terms
  
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
        card.className=card.className + " " +player_class_array[states[i] ]+team;
        //card.className=card.className +" " + player_class_array[states[i] ];
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
    socket.emit('chat message', { room: room, msg: "welcome to chat" , user: userName, msgclass:"sysmsg"});
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
    //console.log(userTeam.value);
    var game_status=0;
    if (typeof game_obj.room.game_status !== "undefined") {
        game_status = game_obj.room.game_status ;
    }
    if (game_status > 0) { // game started, send Challenge button pressed
        console.log ("send challenge: ", challenge.value, "",clicks.value);
        socket.emit('challenge', { room: room, team: my_team, user: userName , user_id: userID, challenge:challenge.value, clicks: clicks.value });
        challenge.value="";
        clicks.value="";
    } else { // game not started, join team button pressed
        if (userTeam.value) {
            var team = userTeam.value;
            socket.emit('team change', { room: room, team: team, user: userName , user_id: userID });
            //chooseTeamBlock.style.display = "none";
            //userTeam.disabled=true;
            //console.log('team change event', { room: room, team: team, user: userName  });
          }
    }

  });
  //  document.getElementById('startButton').addEventListener('click', function(e) {

  startButton.addEventListener('click', function(e) {
    
    socket.emit('start game', { room: room, user: userName , user_id: userID });
    //startButton.disabled = true;
    });

  socket.on('chat message', function(data) {
    console.log('chat message data', data);
    addChatLine(data.user + ": " + data.msg,data.msgclass);
  });
  socket.on('system message', function(data) {
    console.log('system message data', data);
    var msg=data.msg;
    switch (data.msg_type) {
        case 1: { // joining the team
            msg+=" "+memberTagID[data.team];
            break;
        }
        case 2: { // start the game
            //game_progress.style.display = "contents";
            //gamestat.innerText = "Game Started"; 
            //startButton.style.display = "none";
            //chooseTeamBlock.style.display = "none";
            //challengeBlock.style.display = "contents";
            break;
        }
        case 3: { // challenge -> card choice
            msg+=" "+data.challenge+ ", clicks " + data.clicks;
            challenged_text.innerText=data.challenge;
            card_event=clickTheCard;
            //totalclicks.innerText=data.totalclicks;
            break;
        }
        case 4: { // no consent
            noCardConcent(data.card_response_array);
            break;
        }
        case 5: { // card revealed!
            let cardObj=document.getElementById("card["+data.card_id+"]"); //.querySelector("span")
            console.log("system message 5 - cardObj:", cardObj.innerText);
            msg= msg.replace("{card_text}",cardObj.innerText).replace("{reveal_role}",card_verbs[data.reveal_role]);
            // cleanup choice classes
            removeClassFromAllElements("my_card_choice");
            removeClassFromAllElements("card_choice_no_concent");
            cardObj.classList.remove("closed"+(3-data.team));
            cardObj.classList.add(player_class_array[data.reveal_role]+(3-data.team));
            break;
        }
    }
    addSysMsgLine(data.user + ": " + msg,"sysmsg");
  });
  socket.on('error message', function(data) {
    console.log('error message data', data);
    addSysMsgLine(data,"errormsg");
  });
  socket.on('team scheme', function(data) {
    console.log('team scheme data',data);
    my_team=data.team;
    refreshTable();
    if (data.team >0 ) {
        refreshTable(data.states[data.team-1],"player",(data.team));
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
    game_obj=data;
    document.getElementById('host').innerText = data.host;
    if (data.host==userName && !data.room.game_status){
        startButton.disabled=false;
    } else {
        startButton.disabled=true;
    }
    // refresh Teams and Player status
    ResetMembers();
    data.users.forEach((element) => {
      //console.log(element);
      AddMemberLine (element);
    }); 
    if (data.room.game_status>0) { //game started, cannot join the Team
      chooseTeamBlock.style.display = "none";
      game_progress.style.display = "contents";
      if (game_obj.room.active_team==my_team) {
        gamestat.innerHTML="Game Started:&nbsp;<b>Your turn!</b>";
      } else {
        gamestat.innerText = "Game Started";
      }
       
      activeteam.innerHTML = `<span class="${memberTagID[data.room.active_team]}">${teams_list[data.room.active_team]}&nbsp;Team</span>`;  //teams_list[data.room.active_team];
      activestep.innerText =  step_verbs[data.room.step];
      turn.innerText =  data.room.turn;
      if (data.room.step ) { // Response step
        challenged_text.innerText=game_obj.room.challenge;
        card_event=clickTheCard;
      }
      if (my_team>0) { // game started, show the Challenge block to the Team member or enable click event to the cards
        challengeBlock.style.display = "contents";
        totalclicks.innerText=data.room.clicks[my_team];
        yourteam.style.display = "contents";
        yourteam.innerHTML=`<span class="${memberTagID[my_team]}">${teams_list[my_team]}&nbsp;Team</span>`;
        if (data.room.active_team==my_team && !data.room.step) { // challedge phase
            challengeBlock.querySelector("button").disabled=false;
            challenge.disabled=false;
            clicks.disabled=false;
        } else { // not my team  - or Response phase / card choice
            challengeBlock.querySelector("button").disabled=true;
            challenge.disabled=true;
            clicks.disabled=true;
        }
        if (data.room.active_team!=my_team || !data.room.step){ // not my team  - or challenge phase
            card_event=""; 
        }         
      } else { // Observer role
        card_event=""; 
        challengeBlock.disabled=true;
        challenge.disabled=true;
        clicks.disabled=true;
      }
    } else {
        //Game Not Started
        //gamestat.innerHTML = `Game Not Started: ${(game_obj.host == userName ? "<b>Click start!</b>" : "" )}`;
         /*
        if (game_obj.host == userName) {
            gamestat.innerHTML="Game Not Started:&nbsp;<b>Click start!</b>";
          } else {
            gamestat.innerText = "Game Not Started";
          }
         // */
         let game_str="";
         if (game_obj.host == userName) {
            if (! (game_obj.users.filter(user => user.team == 1).length && game_obj.users.filter(user => user.team == 2).length) ) {
                game_str = "one of the teams is empty";
            } else {
                game_str = "<b>Click start!</b>";
            }
         }
         gamestat.innerHTML = `Game Not Started ${(game_str ? `: ${game_str}` : "" )}`;
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

    if (ok_to_leave==0){

        let timeout = setTimeout(function() {
            // user stayed, do stuff here
          socket.emit('cancel leaving room', {  msg: "user stays in the room "+room+" - setTimeout", user: userName, userid:getCookie("userid")});
          console.log('cancel leaving room');
    
        }, 20000); //20 sec
    
        // You can customize the message, but modern browsers often display their own default message for security reasons.
        var confirmationMessage = 'Are you sure you want to leave the room?';
        //const res = window.confirm(confirmationMessage);
        socket.emit('request to leave room', {  msg: "user leaving the room "+room+" - window beforeunload", user: userName, userid:getCookie("userid")});
    
        // Some browsers may display this message to the user, prompting them to confirm if they want to leave the page.
        (e || window.event).returnValue = confirmationMessage; // Gecko + IE
        return confirmationMessage; // Webkit, Safari, Chrome etc.
    } else {
        window.onbeforeunload = undefined;
        return false;
    }
  });
  /*
  window.addEventListener('unload', function (e) {
    //if (ok_to_leave)
       socket.emit('leave room', { room: room, msg: "user left the room", user: userName, });
  });
*/
homelink.addEventListener('click', function(e) {
    var confirmationMessage = 'Are you sure you want to leave the room?';
    const res = window.confirm(confirmationMessage);
    if (res) {
        socket.emit('leave room', { room: room, msg: "user left the room", user: userName, });
        window.onbeforeunload = undefined;
        ok_to_leave=1;
    } else {
        e.preventDefault();
    }
});
 
  // card click event listener
  card_table.querySelectorAll('.card').forEach(item => {
    item.addEventListener('click', event => {
      //handle click
      //clickTheCard(event);
      const is_clickable=event.target.classList.contains("closed"+(3-my_team));
      console.log("card_click_outer, is_clickable", is_clickable, "classList",event.target.classList);
      if (card_event && is_clickable && game_obj.room.step) {
        card_event(event);
      }
    })
  });
 
  // secretOn checkbox event listener
  secretOn.addEventListener('change', function() {
    if ( secretOn.checked ) {
      if (!card_table.classList.contains("secret_on")) {
        card_table.classList.add("secret_on");
      }
    } else {
      card_table.classList.remove("secret_on");
    }
  })
  //Legend checkbox event listener
  legend.addEventListener('change', function() {
    legend_table.style.display = (legend.checked ?"block":"none");
  })


};
