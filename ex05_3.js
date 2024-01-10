var events = require('events');
//var emitter = new events.EventEmitter();

const syncWait = ms => {
    const end = Date.now() + ms
    while (Date.now() < end) continue
	console.log("Done sync waiting");
}
function wait(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log("Done async waiting");
      resolve(ms)
    }, ms )
  })
}  

function NumberLoop(num) {
	var e = new events.EventEmitter();
	setTimeout(function(){
		console.log("starting the loop");
		for(var i=1; i<=num; i++){
			e.emit('ProcessBegin',i);
			console.log('Number processed is '+i);
			e.emit('ProcessEnd',i);
		}
	},1);
	return e;
}
var numLoop = NumberLoop(5);


(async function Main() {
  console.log("Starting async wait...")
  await wait(5000);
  console.log("Ended async wait!")
})();

console.log('one');
syncWait(4000);
console.log('two');

/*numLoop.on('ProcessBegin', function(data){
	console.log('Starting the process for ' + data);
});
//*/
console.log('three');
//syncWait(10000);
console.log('four');

/*
numLoop.on('ProcessEnd', function(data){
	console.log('Completed the process for ' + data);
});
//*/
console.log('five');
//syncWait(10000);
console.log('six');
