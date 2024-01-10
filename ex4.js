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

emitter.on('error',function (){
	console.log('Error has been intercepted');
});

emitter.emit('error', new Error('A test error'));
console.log('completed');