const cookie = require("cookie"); // Import the 'cookie' module

const log_debug_on=0;

const teams_list=["observer","Red","Blue"]; //team membership text for chat
const step_verbs=["Challenge", "Response"]; // game status terms
const supported_languages = ['en', 'ru', 'bg'];

// Short-circuiting, and saving a parse operation
function isInt(value) {
    var x;
    if (isNaN(value)) {
      return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}

function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getOneCookie(rawCookie, cokkieName){
  // Parse the raw cookie string into an object
  const parsedCookies = cookie.parse(rawCookie);

  // Now you can access individual cookies
  const myCookieValue = parsedCookies[cokkieName]; // Replace with your actual cookie name
  return myCookieValue;
}

module.exports = {
  teams_list,
  step_verbs,
  supported_languages,
  log_debug_on,
  getRandomValue,
  isInt,
  getOneCookie,
  makeid
}
