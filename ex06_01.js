const f = require('fs')
var util = require('util')
var readline = require('readline')

var lineNum = 0;

util.log(util.inspect({age:34, gender:"female"}, false,2,true))

console.log('the file name is:' + __filename + '\n')
console.log('the folder is:' + __dirname + '\n')
console.log('the file content is:\n-----')

util.debuglog("test debug log msg:"+__filename)
util.log("test log msg:"+__filename)


var interface1 = readline.createInterface({
	input: f.createReadStream(__filename)
});

util.log("test log msg one")

interface1.on('line', function(line){
	lineNum++;
	util.log('Line ' + lineNum + ': ' + line);
});
util.log("test log msg two")
