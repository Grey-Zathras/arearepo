const h = require('http')

const s = h.createServer((q, r) => {

  q.on('aborted', () => {

    console.log('client request aborted')

  })
  q.on('data', () => {
    console.log('client data received')
  })
  q.on('end', () => {
    console.log('client stream ended')
  })
  q.on('close', () => {
    console.log('client stream closed')
  })
  q.on('finish', () => {
    console.log('client stream finished')
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