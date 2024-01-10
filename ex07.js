const h = require('http')

const s = h.createServer((q, r) => {

  console.log("In server, q is a " + q.constructor.name)

  console.log("client said: "+ q.url)

  r.end('/bar')

}).listen(12000, () => {

  h.get('http://localhost:12000/foo', (m) => {

    console.log(`In client, m is a ${m.constructor.name}`)

    m.on('data', (d) => {

      console.log(`server said: ${d.toString()}`)

    })

    m.on('end', () => {

      //s.close()

    })

  })

})