const h = require('http')

const s = h.createServer((q, r) => {

 r.end('hello')

})

s.listen(12000)

const r = h.get('http://localhost:12000', (m) => {

  m.on('data', (d) => {console.log(d.toString())})

  m.on('end', ()  => {s.close()})

})