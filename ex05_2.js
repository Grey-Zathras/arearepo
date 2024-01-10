var events = require('events');
var emitter = new events.EventEmitter();
var http = require('http');
var fs = require('fs');
var cnt = 0;

// Create first listener
var listen1 = function listner1() {
	console.log ('First Listener/Handler Called');
}
// Create second listener
var listen2 = function listner2 () {
	setImmediate(function(){
		console.log ('Second Listener/Handler Called asynchronously?');
	});
}
// Create first listener
var listen3 = function listner1() {
	console.log ('Third Listener/Handler execution count:' + ++cnt);
}
// Bind event1 with the first listener function 
//emitter.addListener( 'event1', listen1);
emitter.on( 'event1', listen1);

// Bind event1 with the second listener function 
emitter.on('event1', listen2);

emitter.once('event1', listen3);

// Get the listener count for event1
var listnerCnt = require ('events').EventEmitter.listenerCount(emitter, 'event1');
console.log (listnerCnt + " listner(s) listening to event1");
// Fire event1
emitter.emit('event1');

// Remove the first listener function 
emitter.removeListener('event1', listen1); 
console.log ("Listner1 removed");

// Fire event1 
emitter.emit( 'event1');

listnerCnt = require ('events').EventEmitter.listenerCount (emitter, 'event1');

console.log (listnerCnt + " Listner(s) listening to event1");
console.log ("Task Completed");

http.createServer(function (req, res) {
    fs.readFile('welcome.html', function(err, data) {
		if (err){
			console.log("Err fired");
			console.log(err.stack);
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write(err.stack);
			res.end();
			return;
		}
		//console.log(data.toString());
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write(data);
		res.end();
		console.log('page request completed');
    });
}).listen(8080);