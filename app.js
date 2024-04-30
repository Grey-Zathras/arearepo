// Whole-script strict mode syntax
"use strict";

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
//const session = require('express-session');


const { log_debug_on, isInt } = require("./utils/glbl_objcts.js");
const wordList = require('./utils/wordlist.js');
const cardGenerator = require('./utils/card_generator.js');
const codenames_DB = require('./db.js');

const app = express();

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
    const { rows } = await codenames_DB.query('SELECT id, title,code, stat  FROM rooms where priv=FALSE');
    //res.json(rows);
    res.render('index', { rooms: rows });
    //console.log(`${JSON.stringify(rows)} `);
  });
  
  // Route to get a specific room by id
  app.get('/room/:id', async (req, res) => {
      const int_id= req.params.id;
      //const { userTeam } = req._parsedUrl.query;
      //console.log("User team is", userTeam );
      if (isInt(int_id)) {
      const { rows } = await codenames_DB.query('SELECT * FROM rooms WHERE id = $1', [int_id]);
          if (rows.length === 0) {
              res.status(404).send('Room not found');
              //res.status(404).json({ message: 'Post not found' });
          } else {
              res.render('room', { room: rows[0] });
              //res.json(rows[0]);
          }
      }  else {
          // SQL injection attack
          console.log(`SQL injection attack ${req.params.id}`);
          res.status(404).send('Room not found');
      }
  });
  
  // Route to display the form for creating a new room
  app.get('/create', (req, res) => {
      res.render('create', {code: makeid(6)});
    });
    
  // Route to create a new room
  app.post('/create', async (req, res) => {
    const { title, code } = req.body;
    //console.log(`creating new room  ${title}`); //{req.body}
    var cards = cardGenerator.generateCards25(wordList);
    var states = cardGenerator.generateSpies();
    
    const { rows } = await codenames_DB.query(
      'INSERT INTO rooms(title, code, cards, states ) VALUES($1, $2, $3, $4) RETURNING *',
      [title, code, cards, states]
    );
    //res.status(201).json(rows[0]);
    console.log(`creating new room  ${title}`,JSON.stringify(rows[0])); //{req.body}
    
    res.status(201).render('create_confirmation', { room:  req.body , rows:rows[0]});
  });

  module.exports = app;