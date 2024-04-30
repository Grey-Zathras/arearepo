// Whole-script strict mode syntax
"use strict";

/*
//process.env.PORT 
server.listen(process.env.PORT || 3000, () => {
    console.log('listening chat server on *:3000');
  });
*/
  /**
   * Module dependencies.
   */
  
  //var { io } = require("./utils/glbl_objcts");
  var app = require('./app');
  var debug = require('debug')('card-names-duet:server');
  var http = require('http');
  const socketIo = require('socket.io');
  const io_socket_connected = require('./utils/chat_socket_io');
  
  /**
   * Get port from environment and store in Express.
   */
  
  var port = normalizePort(process.env.PORT || '3000');
  app.set('port', port);
  
  /**
   * Create HTTP server.
   */
  
  var server = http.createServer(app);
  
  // chat server support
  const io = socketIo(server);
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
  