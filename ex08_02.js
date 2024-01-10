var express = require('express');
var expr = express();

var callback1 = function  (req,res,next) {
	console.log("callback1 function executed. over to next function");
	//res.send(`callback1 `);
	next();
}
var callback2 = function  (req,res,next) {
	console.log("callback2 function executed. over to next function");
	//res.send(`callback2 `);
	next();
}

expr.get(`/`, [callback1,callback2], function (req,res,next) {
	//console.log(req);
	//console.log("---------------------------------");
	//console.log(res);
	console.log("anonymous function executed. over to next function");
	//res.send(`->anonymous callback->`);
	next();
}, function (req,res){
	res.send(`->anonymous Hello World->`);
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