const h = require('http')

const s = h.createServer((q, r) => {

  setTimeout(() => {

   r.end('hello')

  }, 10)

})

s.timeout = 2

s.listen(12000, () => {

  const r = h.get('http://localhost:12000', (m) => {

    m.on('data', (d) => {console.log(d.toString())})

    m.on('end', ()  => {s.close()})

  })

  r.on('error', (e) => {

    console.log(e)

    s.close()

  })

})