var http = require('http');
var area = require('.//rectarea');
var length=4;
var width=5;
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("rectangle = "+area.rectArea(length,width));
    res.end();
    }).listen(8080);