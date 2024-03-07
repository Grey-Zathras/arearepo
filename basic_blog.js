const express = require('express');
//const { Pool } = require('pg');
const codenames_DB = require('./db');
const app = express();
app.use(express.json());

/*
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
  res.json(rows);
});

// Route to get a specific post by id
app.get('/post/:id', async (req, res) => {
  const { rows } = await codenames_DB.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
  if (rows.length === 0) {
    res.status(404).json({ message: 'Post not found' });
  } else {
    res.json(rows[0]);
  }
});

// Route to create a new post
app.post('/post', async (req, res) => {
  const { title, content } = req.body;
  const { rows } = await codenames_DB.query(
    'INSERT INTO posts(title, content) VALUES($1, $2) RETURNING *',
    [title, content]
  );
  res.status(201).json(rows[0]);
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
