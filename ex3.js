var events = require('events');
var emitter = new events.EventEmitter();

var connectHandler = function connected() {
	console.log('connected to the host');
	emitter.emit('received');
}

emitter.on('connected',connectHandler);
emitter.on('received',function (){
	console.log('File received successfully');
});

emitter.emit('connected');
console.log('completed');