var express = require('express');
var expr = express();

expr.route(`/`)
.get(function (req,res) {
	console.log("GET request received for home page");
	res.send(`Hello World - GET`);
})
.post(function (req,res) {
	console.log("POST request received for home page");
	res.send(`Hello World - POST`);
})
.put(function (req,res) {
	console.log("PUT request received for home page");
	res.send(`Hello World - PUT request`);
})
.delete(function (req,res) {
	console.log("DELETE request received for home page");
	res.send(`Hello World - DELETE request`);
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