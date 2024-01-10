var events = require('events');
var emitter = new events.EventEmitter();

emitter.on('connected',function connected() {
	console.log('connected to the host');
	emitter.emit('received');
});
emitter.on('received',function (){
	console.log('File received successfully');
});

emitter.emit('connected');
console.log('completed');