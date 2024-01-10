const h = require('http')
const f = require('fs')
var util = require('util')
var readline = require('readline')


const s = h.createServer((q, r) => {

  console.log('In server, q is a ' + q.constructor.name);

  console.log("client said: " + q.url);

  r.writeHead(200, {'hello': 'world'});
  r.write('<'+'P>Some header <'+'PRE>');

	const rs = f.createReadStream(__filename, { highWaterMark: 256 });

  var chunkNum = 0;

	rs.on('data', (d) => {
	  console.log('chunk: '+ ++chunkNum );
	  r.write(d.toString());
	  //console.log(d.toString())
	  //console.log(d)
	  //console.trace()

	})
	rs.on('end', () => {
	  console.log('-----\nend of file');
	  r.end('<'+'/PRE>********************');
	})
	
  /*
  var interface1 = readline.createInterface({
	input: f.createReadStream(__filename)
  });
  var lineNum = 0;
	interface1.on('line', (line) => {
		lineNum++;
		//util.log('Line ' + lineNum + ': ' + line);
		util.log('Line ' + lineNum );
		r.write('<'+'BR>Line ' + lineNum + ': ' + line);
		//interface1.close();
	});

	interface1.on('pause', function(){
		util.log('End of file' );
		r.end('<'+'P>********************');
		interface1.close();
	});
	// */
  //r.end('/bar')
  //interface1.close(); 
}).listen(12000)