var http = require('http');
var fs = require('fs');
http.createServer(function (req, res) {
    fs.readFile('welcome_1.html', function(err, data) {
		if (err){
			console.log(err.stack);
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write(err.stack);
			res.end();
			return;
		}
		console.log(data.toString());
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write(data);
		res.end();
		console.log('completed');
    });
}).listen(8080);