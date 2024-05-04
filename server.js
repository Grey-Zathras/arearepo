// Whole-script strict mode syntax
"use strict";

  /**
   * Module dependencies.
   */
  
  var debug = require('debug')('card-names-duet:server');
  var http = require('http');
  const socketIo = require('socket.io');
  const io_socket_connected = require('./utils/chat_socket_io');
  const i18next = require('i18next');
  //const i18nextMiddleware = require('i18next-http-middleware');
  const session = require('express-session');
  const sessionMiddleware = session({
    secret: "Wonka-Willi",
    resave: true,
    saveUninitialized: true,
  });
  var app = require('./app')(sessionMiddleware);
  /**
   * Get port from environment and store in Express.
   */
  
  var port = normalizePort(process.env.PORT || '3000');
  app.set('port', port);
  //app.use(sessionMiddleware);
  /**
   * Create HTTP server.
   */
  
  var server = http.createServer(app);
  
  // chat server support
  const io = socketIo(server);
  io.engine.use(sessionMiddleware);
  io.use(function(socket, next){
    const req=socket.request;
    socket.request.i18n=i18next;
    /*
    i18nextMiddleware.handle(i18next, {
      //getPath: (req) => req.path,
      getUrl: (req) => req.url,
      setUrl: (req, url) => (req.url = url),
      getQuery: (req) => req._query,
      //getParams: (req) => req.params,
      //getBody: (req) => req.body,
      //setHeader: (res, name, value) => res.setHeader(name, value),
      //setContentType: (res, type) => res.contentType(type),
      //setStatus: (res, code) => res.status(code),
      //send: (res, body) => res.send(body)
    }); */
    //(socket.request);
    next();
  });
  
  io.on('connection', io_socket_connected);

  /**
   * Listen on provided port, on all network interfaces.
   */
  
  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
  
  /**
   * Normalize a port into a number, string, or false.
   */
  
  function normalizePort(val) {
    var port = parseInt(val, 10);
  
    if (isNaN(port)) {
      // named pipe
      return val;
    }
  
    if (port >= 0) {
      // port number
      return port;
    }
  
    return false;
  }
  
  /**
   * Event listener for HTTP server "error" event.
   */
  
  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }
  
    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;
  
    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }
  
  /**
   * Event listener for HTTP server "listening" event.
   */
  
  function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    debug('Listening on ' + bind);
  }
  