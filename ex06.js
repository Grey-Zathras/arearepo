const f = require('fs')
var util = require('util')

util.log(util.inspect({age:34, gender:"female"}, false,2,true))

console.log('the file name is:' + __filename + '\n')
console.log('the folder is:' + __dirname + '\n')
console.log('the file content is:\n-----')

util.debuglog("test debug log msg:"+__filename)
util.log("test log msg:"+__filename)

const r = f.createReadStream(__filename)

r.on('data', (d) => {
  console.log('chunk:\n-----')
  console.log(d.toString())
  //console.log(d)
  //console.trace()

})

r.on('end', () => {

  console.log('-----\nend of file')

})