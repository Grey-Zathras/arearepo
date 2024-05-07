
var ok_to_leave=0;
var card_event=""; // event dumb object 
var my_team=0; // current team 0|1|2
var game_obj = {}; // game status / room object

/*
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
*/
function cardAnimation(card,callback) {
  card.classList.add("rotated");
  let timeout = setTimeout(function() {
    if (callback){
      callback();
    }
    card.classList.remove("rotated");
  }, 3000); //3 sec
}

function bannerAnimation (obj) {
  obj.classList.add("pop-up-banner");
  //obj.style.top="20vh";
  obj.querySelector(".banner-text").style="display:inline-block";
}

function currentTime(){
  const date = new Date();
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };
  return new Intl.DateTimeFormat('en-GB', options).format(date);
}

function addChatLine (text, msgclass=""){
    var item = document.createElement('li');
    //if (msgclass==""){
    //  item.textContent = text;
    //} else{
      var item1 = document.createElement('span');
      item1.className="timestamp";
      item1.textContent = currentTime();
      item.appendChild(item1);
      item1 = document.createElement('span');
      item1.className=msgclass;
      item1.textContent = " "+ text;
      item.appendChild(item1);
      //console.log(item.outerHTML, text);
    //}
    chat_messages.insertBefore(item, chat_messages.firstChild);
      //messages.appendChild(item);
      //window.scrollTo(0, document.body.scrollHeight);
    //window.scrollTo(0, 0); // Scroll to the top to show the newest message
}

function addSysMsgLine (text, msgclass=""){
  var item = document.createElement('li');
  if (msgclass==""){
    item.textContent = currentTime()+" "+text;
  } else{
    var item1 = document.createElement('span');
    item1.className="timestamp";
    item1.textContent = currentTime();
    item.appendChild(item1);
    item1 = document.createElement('span');
    item1.className=msgclass;
    item.appendChild(item1);
    item1.innerHTML = " "+text;
    //item1.textContent = text;
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

const countSpies = () => {
  //let spies=0;
  //return states[0].filter (state => state==4).length;
  return card_table.querySelectorAll("td.spy_opened1").length;
}

const removeClassFromAllElements = (className) => {
  const allElements = card_table.querySelectorAll('*'); 
  allElements.forEach(el => el.classList.remove(className));
}

const activeClass=["inactive","active"]; // member chat status
const memberTagID = ["Observers","Red_team", "Blue_team"]; // team membership 
const player_class_array=['closed', 'spy', 'killer','civilian', 'spy_opened','killer_opened' ]; // cards on the table
//var observer_class_array=[ 'spy_opened','civilian','killer_opened' ]; // cards on the table



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

function rebuildTable(new_cards){
  for (var i=0;i<25;i++){
    var card = document.getElementById('card['+i+']');
    card.querySelectorAll("div")[0].innerText=new_cards[i];
  }
}

function refreshStates(states, role,team){
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
var socket = "";

window.onload = function() {
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
 // Get the modal
 var modal = document.getElementById("myModal");
 
 // Get the button that opens the modal
 var btn = document.getElementById("manageUsersButton");
 
 // Get the <span> element that closes the modal
 var span_x = document.getElementsByClassName("close")[0];
 
 var userName = getCookie("username");
 var userID = getCookie("userid");
 if (!userName) {
   userName = prompt(i18n_text["Please enter your name"]+':');
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
  socket = io();
  
  //var chatForm = document.getElementById('chatForm');
    //var userForm = document.getElementById('userForm');
    //var input = document.getElementById('input');
    
    //var roomInput = document.getElementById('room');
    //document.getElementById('userNameBox').value = userName;
    userNameBox.value = userName;

    // Join a room
    //document.getElementById('joinRoom').onclick = function() {
    //var room = roomInput.value;
    //socket.emit('join room', { room: room, user: userName, room_id: room_id, user_id: userID  });

    socket.emit('chat message', { room: room, msg: "Hi" , user: userName, msgclass:"sysmsg"});
    let timeout = setTimeout(function() {
      socket.emit('cancel leaving room', {  msg: "user just entered the room "+room+" - on-enter setTimeout", user: userName, userid:getCookie("userid")});
    }, 10000); //10 sec

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
  });
  stopButton.addEventListener('click', function(e) {
    socket.emit('stop game', { room: room, user: userName , user_id: userID });
  });
  endTurnButton.addEventListener('click', function(e) {
    socket.emit('end_turn', { room: room, user: userName , user_id: userID });
  });

  socket.on('chat message', function(data) {
    console.log('chat message data', data);
    addChatLine(data.user + ": " + data.msg,data.msgclass);
  });
  socket.on('system message', function(data) {
    console.log('system message data', data);
    var msg=data.msg;
    if (my_team) {
      card_table.classList.remove("team"+(3-my_team)); // cleanup for hover css 
    }
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
          msg+=` <span class="${memberTagID[data.team]}"> ${data.challenge}</span>, clicks ${data.clicks}`;
          //msg+=" "+data.challenge+ ", clicks " + data.clicks;
            challenged_text.innerText=data.challenge;
            //totalclicks.innerText=data.totalclicks;
            if (game_obj.room.active_team==my_team) {
              card_event=clickTheCard;
              card_table.classList.add("team"+(3-my_team)); // for hover css 
              bannerAnimation(yourTurn);
            }
            break;
        }
        case 4: { // no consent
          if (game_obj.room.active_team==my_team) {
            card_event=clickTheCard;
            card_table.classList.add("team"+(3-my_team)); // for hover css 
          }
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
            cardAnimation(cardObj,function(){
            if (data.reveal_role == 4){ // spy revealed - overwrite both classes -but not for the killer 
                cardObj.className="card spy_opened1 spy_opened2";
                spies_left.innerText = 15 - countSpies();
              } else { // overwrite other class
                cardObj.classList.remove("closed"+(3-data.team));
                cardObj.classList.add(player_class_array[data.reveal_role]+(3-data.team));
              }
            } );  
            if (game_obj.room.active_team==my_team) {
              card_event=clickTheCard;
              card_table.classList.add("team"+(3-my_team)); // for hover css 
            }
            break;
          }
          case 6: { // end turn msg
            if (game_obj.room.active_team==my_team) {
              bannerAnimation(yourTurn);
            }
            break;
          }
        case 7: { // stop the game
          // clean stats at the table
          stopFireworks();
          for(var i =1; i<3; i++){ // both teams
            for(var j =0; j<6; j++) {
              removeClassFromAllElements(player_class_array[j]+i);  
            }
          }
          //removeClassFromAllElements();
          break;
      }
      case 8: { // win-win!
        startFireWorks();
        card_event=""; 
        break;
    }
}
    addSysMsgLine(data.user + ": " + msg,"sysmsg");
  });

  socket.on('error message', function(data) {
    console.log('error message data', data);
    addSysMsgLine(data,"errormsg");
    if (ok_to_leave) {
      window.onbeforeunload = undefined;
      location.reload();
    }
  });

  socket.on('go away', function(data) {
    console.log('go away',data,"socket.id",socket.id );

    window.onbeforeunload = undefined;
    ok_to_leave=1;
    window.location.href="/";
  });

  socket.on('new table', function(data) {
    console.log('new table data', data);
    rebuildTable(data.cards);
  });

  socket.on('team scheme', function(data) {
    console.log('team scheme data',data);
    if (data.team) {
      refreshStates();
      my_team=data.team;
      refreshStates(data.states[my_team-1],"player",(my_team));
      refreshStates(data.states[2-my_team],"team",(3-my_team));
      //addChatLine("welcome to the "+teams_list[my_team]+" team" ,"sysmsg"); //starting game as XXX team
    } else {
      if (!my_team){
        refreshStates();
        refreshStates(data.states[1],"team",(2));
        refreshStates(data.states[0],"team",(1));
      }
    }
  });

  socket.on('userID', function(data) {
    console.log('userID data',data,"socket.id",socket.id );
    //userID = socket.id;
    userID = data;
    ok_to_leave=0;
    setCookie("userid", userID, 7);
  });
  
  socket.on('roomData', function(data) { // general refresh page / status event
    console.log('roomData',data);
    ok_to_leave =0;
    // check for host and start button
    game_obj=data;
    document.getElementById('host').innerText = data.host;
    // refresh Teams and Player status
    ResetMembers();
    data.users.forEach((element) => {
      //console.log(element);
      AddMemberLine (element);
    });
    startButton.disabled=true;
    stopButton.disabled=true;
    manageUsersButton.disabled=( data.host!=userName);
    if (data.room.game_status>0) { //game started, cannot join the Team
      startButton.style.display="none";
      stopButton.style.display="inline-block";
      if (data.host==userName ){
        stopButton.disabled=false;
      } 
      chooseTeamBlock.style.display = "none";
      game_progress.style.display = "contents";
      if (game_obj.room.active_team==my_team) {
        gamestat.innerHTML=`${i18n_text["Game Started"]}: <b>${i18n_text["Your turn!"]}</b>`;
      } else {
        gamestat.innerText = i18n_text["Game Started"];
      }
      spies_left.innerText = 15 - countSpies();       
      activeteam.innerHTML = `<span class="${memberTagID[data.room.active_team]} nowrap">${teams_list[data.room.active_team]}</span>`;  //teams_list[data.room.active_team];
      activestep.innerText =  step_verbs[data.room.step];
      turn.innerText =  data.room.turn;
      if (data.room.step ) { // Response step
        challenged_text.innerText=game_obj.room.challenge;
      } else {
        challenged_text.innerText="";
      }
      if (my_team>0) { // game started, show the Challenge block to the Team member or enable click event to the cards
        if (game_obj.room.active_team==my_team && data.room.step ) { // Response step and my team
          card_event=clickTheCard;
          card_table.classList.add("team"+(3-my_team)); // for hover css
        } else { // not my team  - or challenge phase
          card_event="";
          card_table.classList.remove("team"+(3-my_team));
        }
        system_messages.classList.remove("team"+(3-my_team));
        system_messages.classList.remove("team"+(my_team));
        if (game_obj.room.active_team==my_team ) {
          endTurnButton.disabled=false;
          if (data.room.step) { // Response step and my team, highlight the other team's challendge
            system_messages.classList.add("team"+(3-my_team)); // for highligt
          } else { // Challendgs step and my team, highlight the other team's challendge
            system_messages.classList.add("team"+(my_team)); // for highligt
          }
        } else {
          endTurnButton.disabled=true;
        }
          challengeBlock.style.display = "contents";
        totalclicks.innerText=data.room.clicks[my_team];
        secretCheckbox.style.display = "block";
        yourteamContainer.style.display = "contents";
        yourteam.innerHTML=`<span class="${memberTagID[my_team]} nowrap">${teams_list[my_team]}</span>`;
        if (data.room.active_team==my_team && !data.room.step) { // challedge phase
            challengeBlock.querySelector("button").disabled=false;
            challenge.disabled=false;
            clicks.disabled=false;
        } else { // not my team  - or Response phase / card choice
            challengeBlock.querySelector("button").disabled=true;
            challenge.disabled=true;
            clicks.disabled=true;
        }
        /*
        if (data.room.active_team!=my_team || !data.room.step){ // not my team  - or challenge phase
            card_event=""; 
        } 
        */        
      } else { // Observer role
        card_event=""; 
        challengeBlock.disabled=true;
        challenge.disabled=true;
        clicks.disabled=true;
        yourteamContainer.style.display="none";
        challengeBlock.style.display ="none";
        totalclicks.innerText=data.room.clicks[data.room.active_team];
      }
    } else {
        //Game Not Started
        stopButton.style.display="none";
        startButton.style.display="inline-block";
        if (data.host==userName ){
          startButton.disabled=false;
        } 
        game_progress.style.display = "none";
        challengeBlock.style.display = "none";
        secretCheckbox.style.display = "none";
        chooseTeamBlock.style.display = "inline-block";

        let game_str="";
        if (game_obj.host == userName) {
          if (! (game_obj.users.filter(user => user.team == 1).length && game_obj.users.filter(user => user.team == 2).length) ) {
              game_str = i18n_text["one of the teams is empty"];
          } else {
              game_str = `<b>${i18n_text["Click start!"]}</b>`;
          }
        }
        gamestat.innerHTML = `${i18n_text["Game Not Started"]} ${(game_str ? `: ${game_str}` : "" )}`;
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
        var confirmationMessage = i18n_text['Are you sure you want to leave the room?'];
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
    var confirmationMessage = i18n_text['Are you sure you want to leave the room?'];
    const res = window.confirm(confirmationMessage);
    if (res) {
        socket.emit('leave room', { room: room, msg: "user left the room", user: userName, });
        window.onbeforeunload = undefined;
        ok_to_leave=1;
    } else {
        e.preventDefault();
    }
  });
  reconnectButton.addEventListener('click', function(e) {
        //socket.emit('leave room', { room: room, msg: "user left the room", user: userName, });
        socket.connect();
        ok_to_leave=1;
        let timeout = setTimeout(function() {
          if (ok_to_leave){
            window.onbeforeunload = undefined;
            location.reload();
          } else {
            console.log("reconnect is succsessfull");
          }
      }, 5000); //5 sec
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

  // When the user clicks on the button, open the modal
  btn.onclick = function() {
    modalUserList.innerHTML="";
    game_obj.users.forEach(user => {
      var txt = `${user.username} - ${memberTagID[user.team]}`;
      var opt1= new Option(txt,user.username);
        modalUserList.add(opt1);
    });
    modal.style.display = "block";
  }
  // When the user clicks on <span> (x), close the modal
  span_x.onclick = function() {
    modal.style.display = "none";
  }
  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
  modalCloseButton.onclick = function(event) {
    modal.style.display = "none";
  }
  kickUserButton.onclick = function() {
    //modal.style.display = "none";
    let userleft =modalUserList.value;
    if (userleft==game_obj.host) {
      var confirmationMessage = i18n_text['Are you sure you want to kick yourself?'];
      const res = window.confirm(confirmationMessage);
        if (!res) {
          userleft="";
        }
    }
    if (userleft) {
      socket.emit('kick user request', { room: room, msg: "host kicks the user:", host: userName, user: userleft });
      for (var i=0; i<modalUserList.length; i++) {
        if (modalUserList.options[i].value == userleft)
          modalUserList.remove(i);
      }    
    }
  }
  deleteRoomButton.onclick = function() {
    modal.style.display = "none";
    socket.emit('delete room', { room: room, msg: "delete this room", user: userName, room: room});    
  }
  rebuildTableButton.onclick = function() {
    modal.style.display = "none";
    socket.emit('rebuild table request', { room: room, msg: "Let's rebuild the table with the new cards:", user: userName});    
  }
  yourTurn.addEventListener('transitionend', function() {
    yourTurn.classList.remove("pop-up-banner");
    yourTurn.style.top="90vh";
    yourTurn.querySelector(".banner-text").style="display:none";
  });

};
