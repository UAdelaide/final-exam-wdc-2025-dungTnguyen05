var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'DogWalkService'
});

// 1. /api/dogs
app.get('/api/dogs', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT d.name AS dog_name, d.size, u.username AS owner_username
            FROM Dogs d
            JOIN Users u ON d.owner_id = u.user_id
        `);

        res.json(rows);
    }

    catch (error) {
        console.error("Error fetching dogs: ", error);
        res.status(500).json({ error: 'Failed to fetch dogs' });
    }
});

// 2. /api/walkrequests/open
app.get('/api/walkrequests/open', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT wr.request_id, d.name AS dog_name
        `);
    }

    catch (error) {

    }
});

// 3. /api/walkers/summary
app.get('api/walkers/summary', async (req, res) => {
    try {

    }

    catch (error) {

    }
});

module.exports = app;
