// Whole-script strict mode syntax
"use strict";

const express = require('express');
const createError = require('http-errors');
const path = require('path');
const bodyParser = require('body-parser');
//const session = require('express-session');
var cookieParser = require('cookie-parser')
var debug_app = require('debug')('app:app');
var debug_i18n = require('debug')('app:i18n');
debug_i18n.log = console.log.bind(console); // don't forget to bind to console!
debug_app.log = console.log.bind(console); // don't forget to bind to console!

// i18n
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');



const { log_debug_on, supported_languages, isInt, makeid } = require("./utils/glbl_objcts.js");
const wordList = require('./utils/wordlist.js');
const cardGenerator = require('./utils/card_generator.js');
const codenames_DB = require('./db.js');



wordList.init({
  languages:supported_languages,
  debug: log_debug_on,
  loadPath: __dirname + '/locales/{{lng}}/wordlist.txt'
});


i18next
  .use(i18nextMiddleware.LanguageDetector)
  .use(Backend)
  .init({
    debug: log_debug_on,
    detection: {
      order: ['querystring', 'cookie'],
      caches: ['cookie']
    },
    backend: {
      loadPath: __dirname + '/locales/{{lng}}/{{ns}}.json'
    },
    preload: supported_languages,
    fallbackLng: 'en',
    // nonExplicitSupportedLngs: true,
      supportedLngs:  supported_languages,
    load: "languageOnly", //all,
    saveMissing: true,
    lng: 'en',
    defaultLanguage: 'en',
    ignoreCase: true,
    fallBackLng: 'en'
  });

function app_init (sessionMiddleware){
     const app = express();

    app.use(sessionMiddleware);
    app.use(
      i18nextMiddleware.handle(i18next, {
        ignoreRoutes: ["/foo"], // or function(req, res, options, i18next) { /* return true to ignore */ }
        removeLngFromUrl: false
      })
    );
    app.use(cookieParser());
    app.use(express.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Set the view engine to ejs
    app.set('view engine', 'ejs');

    // Define the directory where the template files are located
    app.set('views', path.join(__dirname, 'templates'));

    // Serve static files from the 'public' directory
    app.use(express.static(path.join(__dirname, 'public')));

    // Home route to list all rooms
    app.get('/', async (req, res) => {
      const { rows } = await codenames_DB.query('SELECT *  FROM rooms where priv=FALSE'); //id, title,code, stat, lang
      //res.json(rows);
      res.render('index', { 
        rooms: rows,
        lang: req.language,
        languages: req.i18n.translator.backendConnector.options.preload
    });
      //console.log(`${JSON.stringify(rows)} `);
    });

    // Route to get a specific room by id
    app.get('/room/:id', async (req, res, next) => {
      const int_id= req.params.id;
      //const { userTeam } = req._parsedUrl.query;
      //console.log("User team is", userTeam );
      //if (isInt(int_id)) {
      const { rows } = await codenames_DB.query('SELECT * FROM rooms WHERE code = $1', [int_id]);
          if (rows.length === 0) {
              //res.status(404).send('Room not found');
              //res.status(404).json({ message: 'Post not found' });
              return next(
                createError(404, 'Room not found'));
          } else {
            const session = req.session;
            session.room_id = int_id;
            session.room_name = rows[0].title;
            session.room_lang =  rows[0].lang.toLowerCase(); 
            session.user_old_lang =  req.i18n.language;
            session.username = req.cookies.username;
            req.i18n.changeLanguage(session.room_lang); 
            res.render('room', { room: rows[0] });
              //res.json(rows[0]);
          }
      //}  else {
          // SQL injection attack
      //    debug_app(`SQL injection attack, parameter: ${req.params.id}`);
          //console.log(`SQL injection attack, parameter: ${req.params.id}`);
          //res.status(404).send('Room not found');
      //    return next(
      //      createError(404, 'Room not found'));
      //}
      //next();  
    });

    // Route to display the form for creating a new room
    app.get('/create', (req, res) => {
      res.render('create', {
        code: makeid(6),
        lang: req.language,
        languages: req.i18n.translator.backendConnector.options.preload
        //languages: req.languages
      });
    });
      
    // Route to create a new room
    app.post('/create', async (req, res) => {
      const { title, code, lang } = req.body;
      //console.log(`creating new room  ${title}`); //{req.body}
      var cards = cardGenerator.generateCards25(wordList[lang] );
      var states = cardGenerator.generateSpies();
      
      const { rows } = await codenames_DB.query(
        'INSERT INTO rooms(title, code, cards, states, lang ) VALUES($1, $2, $3, $4, $5) RETURNING *',
        [title, code, cards, states, lang]
      );
      //res.status(201).json(rows[0]);
      debug_app(`creating new room  ${title}`,JSON.stringify(rows[0]));
      //console.log(`creating new room  ${title}`,JSON.stringify(rows[0])); //{req.body}
      
      res.status(201).render('create_confirmation', { room:  req.body , rows:rows[0]});
    });
    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
      next(createError(404));
    });

    // error handler
    app.use(function(err, req, res, next) {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.render('error');
    });
  return app;
}   

//module.exports = app;
//module.exports = ( sessionMiddleware ) => { return new MyApp( sessionMiddleware ) };
module.exports = app_init;