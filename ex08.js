const h = require('http')

const s = h.createServer((q, r) => {

  //r.setHeader('hello', 'world')
    r.writeHead(200, {'hello': 'world'})

  r.end(r.getHeader('hello')+' body some text')

}).listen(12000, () => {

  h.get('http://localhost:12000', (m) => {

    m.on('data', (d) => {console.log(d.toString())})

    //m.on('end', () => {s.close()})

  })

})