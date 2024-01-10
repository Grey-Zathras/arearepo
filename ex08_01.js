var express = require('express');
var expr = express();

expr.get(`/`, function (req,res) {
	//console.log(req);
	//console.log("---------------------------------");
	//console.log(res);
	console.log("GET request received for home page");
	res.send(`Hello World`);
});

expr.get(`/user_info`, function (req,res) {
	console.log("GET request received for user_info");
	res.send(`user information`);
});

expr.get(`/*day`, function (req,res) {
	console.log("GET request received for nday");
	res.send(`nday`);
});

var server = expr.listen(8080, function() {
	var portNumber = server.address().port;
	console.log(`Application listening on port ${portNumber}`);
});