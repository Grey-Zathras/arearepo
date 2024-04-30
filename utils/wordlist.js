const fs = require('fs');
const fullWordList = fs.readFileSync('wordlist.txt', 'utf-8');
const wordList = fullWordList.split(/\r?\n/);

module.exports = wordList;