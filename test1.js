var url = require('url');
var addr = ' http :// localhost : 8080 /curses.htm?course=Java&price=100';
var p = url.parse(addr, true);
var http = require('http');
http.createServer(function (req, res) {

    //print it to console
    console.log("Hostname: "+p.host);
    console.log("Path: "+ p.pathname);
    console.log("Search string: "+p.search);
    var pinfo = p.query;
    console.log("Price of course "+pinfo.course+" is $"+pinfo.price);
    // display on Web page
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("<p>Hostname: "+p.host);
    res.write("<p>Pathname: "+p.path);
    res.write("<p>Search string: "+p.search);
    res.write("<p>Price of course "+pinfo.course+" is $"+pinfo.price);
}).listen(8080);
