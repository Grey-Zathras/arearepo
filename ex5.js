const h = require('http')

h.get('http://www.google.com', (r) => {
  r.on('data', (m) => {
    console.log(m.toString())
  })
})