const express = require('express');
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3000;

app.use(express.json());

// Postgres
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '8dogstrong',
    port: 5432,
});


// MongoDB connection
const uri = 'mongodb+srv://lukemetcalfe:8dogstrong@databaseqap3.6sh8b.mongodb.net/';
const client = new MongoClient(uri);
const dbName = 'books';
let bookCollection;

// Connect to MongoDB and get the collection
async function connectToMongo() {
    try{
        await client.connect();
        const db = client.db(dbName);
        bookCollection = db.collection('books');

        // Make sure the collection exists
        await bookCollection.createIndex({title: 1}, {unique: true});
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

// create table
async function createTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                description TEXT NOT NULL,
                status VARCHAR(50) NOT NULL
            )`);
        console.log('Table created successfully');
    } catch (error) {
        console.error('Error creating table:', error);
    }
}

// initialize the connection
async function initalize() {
    await connectToMongo();
    await createTable();
}

// GET /tasks - Get all tasks
app.get('/tasks', async (req, res) => {
    try{
        const result = await pool.query('SELECT * FROM tasks');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        response.status(500).send('Internal Server Error');
    }
});

// POST /tasks - Add a new task
app.post('/tasks', async (request, response) => {
    const { description, status } = request.body;
   try{
    const result = await pool.query('INSERT INTO tasks (description, status) VALUES ($1, $2) RETURNING *', [description, status]);
    response.status(201).json(result.rows[0]);
   } catch (error) {
    console.error(error);
    response.status(500).send('Internal Server Error');
   }
});

// PUT /tasks/:id - Update a task's status
app.put('/tasks/:id', async (request, response) => {
    const { status } = request.body;
    const id = parseInt(request.params.id, 10);
    try{
        const result = await pool.query('UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
        if (result.rowCount === 0) {
            return response.status(404).send('Task not found');
        }
        response.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        response.status(500).send('Internal Server Error');
    }
});

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', async (request, response) => {
    const id = parseInt(request.params.id, 10);
    try{
        const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return response.status(404).send('Task not found');
        }
        response.send('Task deleted successfully');
    } catch (error) {
        console.error(error);
        response.status(500).send('Internal Server Error');
    }
});

initalize().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});
