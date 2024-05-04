-- Run this script in your PostgreSQL client to set up the blog database and table

-- Create the database
CREATE DATABASE blog_engine;

-- Connect to the newly created database
\c blog_engine

-- Create a table for the blog posts
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Insert a sample post into the table
INSERT INTO posts (title, content) VALUES ('Sample Post', 'This is a sample blog post.');

-- to do: code should be unique
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    code VARCHAR(255) NOT NULL,
    lang VARCHAR(10) DEFAULT 'RU', 
    priv boolean DEFAULT 0,
    stat integer DEFAULT 0,
    cards VARCHAR(30) [25],
    states integer[2][25],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- unique value for code + index
--ALTER TABLE rooms ADD CONSTRAINT code_key UNIQUE (code);
CREATE UNIQUE INDEX room_code_idx ON rooms (code) ;