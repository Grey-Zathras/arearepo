const h = require('http')

const s = h.createServer((q, r) => {

  console.log('In server, q is a ${q.constructor.name}')

  console.log("client said: ${q.url}")

  r.end('/bar')

}).listen(12000)