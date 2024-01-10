const h = require('http')

const s = h.createServer((q, r) => {

  switch(q.method) {

    case 'GET':

      r.end('GET invoked')

      break;

    case 'POST':

      r.end('POST invoked')

      break;

    default:

      r.end('default response!')

      break;

  }

})

s.listen(12000)



const r = h.get('http://localhost:12000', (m) => {

  m.on('data', (d) => {console.log(d.toString())})

  //m.on('end', ()  => {s.close()})

})