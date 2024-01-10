const h = require('http')

const s = h.createServer((q, r) => {

  q.on('aborted', () => {

    console.log('client request aborted')

  })

  r.write('ok')
  r.end(' end')

}).listen(12000, () => {

  const r = h.get('http://localhost:12000', (m) => {

    m.on('data', (d) => {

      console.log(d.toString())

    })

    m.on('end', () => {
		console.log('client request ended')
	})

    m.on('aborted', () => {

      console.log('server response aborted')

      //s.close()

    })

    r.abort()

  })

})	