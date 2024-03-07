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