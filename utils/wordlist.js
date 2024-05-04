const fs = require('fs');
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
            if (debug) {
              console.log("wordList.init: Word List loaded for lang ",value,", ", this[value].length ," words" );  
            }
        }
    }
};
module.exports = wordList;