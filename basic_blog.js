const express = require('express');
const codenames_DB = require('./db');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Define the directory where the template files are located
app.set('views', path.join(__dirname, 'templates'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


/*
//const { Pool } = require('pg');

// PostgreSQL connection setup
const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
});
*/

// Home route to list all blog posts
app.get('/', async (req, res) => {
  const { rows } = await codenames_DB.query('SELECT * FROM posts');
  //res.json(rows);
  res.render('index', { posts: rows });
});

// Route to get a specific post by id
app.get('/post/:id', async (req, res) => {
  const { rows } = await codenames_DB.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
  if (rows.length === 0) {
    res.status(404).send('Post not found');
    //res.status(404).json({ message: 'Post not found' });
  } else {
    res.render('post', { post: rows[0] });
    //res.json(rows[0]);
  }
});

// Route to display the form for creating a new post
app.get('/create', (req, res) => {
    res.render('create');
  });
  
// Route to create a new post
app.post('/create', async (req, res) => {
  const { title, content } = req.body;
  console.log(`creating new record ${req.body}`);
  const { rows } = await codenames_DB.query(
    'INSERT INTO posts(title, content) VALUES($1, $2) RETURNING *',
    [title, content]
  );
  //res.status(201).json(rows[0]);
  //res.status(201).send(`Post ${title} created`);
  res.status(201).render('create_confirmation', { post:  req.body });
});
  
// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
