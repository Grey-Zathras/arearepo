const h = require('http')

const s = h.createServer((q, r) => {
  r.on('finish', () => {
    console.log('response finished')
  })
  r.on('data', () => {
    console.log('response received')
  })
  r.on('end', () => {
    console.log('response ended')
  })
  r.on('close', () => {
    console.log('response closed')
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
  console.log('SreateSErver')
  r.end('hello')
}).listen(12000, () => {
  h.get('http://localhost:12000', (m) => {
    m.on('data', (d) => {})
    m.on('end', () => { s.close()  })
  })
})