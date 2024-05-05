const fs = require('fs');
var debug_mdl = require('debug')('wordlist');
debug_mdl.log = console.log.bind(console); // don't forget to bind to console!

//const fullWordList = fs.readFileSync('./wordlist.txt', 'utf-8');
//const wordList = fullWordList.split(/\r?\n/);
//languages = ['en', 'ru', 'bg']
const wordList = {
    init: function({languages,loadPath,debug}) {
        for (const value of languages) {
            //this[value]= new Array();
            var path= loadPath.replace("{{lng}}",value);
            const fullWordList = fs.readFileSync(path, 'utf-8');
            this[value] = fullWordList.split(/\r?\n/);
            debug_mdl("wordList.init: Word List loaded for lang ",value,", ", this[value].length ," words" );  
        }
    }
};
module.exports = wordList;