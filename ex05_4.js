var events = require('events');
var emitter = new events.EventEmitter();

emitter.on("DoorEvent",function(ringtype){
	console.log(ringtype);
})
emitter.emit("DoorEvent","Ding-Dong");
console.log("stop 1st event");

var ringBell = function () {
	console.log("Bell Ringing");
};
var openDoor = function () {
	console.log("Door Opened");
};
var closeDoor = function () {
	console.log("Door Closed");
};
emitter.on("DoorEvent", ringBell);
emitter.on("DoorEvent", openDoor);
emitter.on("DoorEvent", closeDoor);

emitter.emit("DoorEvent","hello");
