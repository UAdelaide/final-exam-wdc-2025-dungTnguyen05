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
            SELECT wr.request_id, d.name AS dog_name, wr.requested_time,
            wr.duration_minutes, wr.location, u.username AS owner_username
            FROM WalkRequests wr
            JOIN Dogs d ON wr.dog_id = d.dog_id
            JOIN Users u ON d.owner_id = u.user_id
            WHERE wr.status = 'open'
        `);

        res.json(rows);
    }

    catch (error) {
        console.error('Error fetching open walk requests: ', error);
        res.status(500).json( { error: 'Failed to fetch open walk requests' });
    }
});

// 3. /api/walkers/summary
app.get('api/walkers/summary', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                u.username AS walker_username,
                COUNT(wr.rating_id) AS total_ratings,
                AVG(wr.rating) AS average_rating,
                COUNT(DISTINCT CASE WHEN wreq.status = 'completed' THEN wa.request_id END) AS completed_walks
            FROM
                Users u
            LEFT JOIN
                WalkApplications wa ON u.user_id = wa.walker_id AND wa.status = 'accepted'
            LEFT JOIN
                WalkRequests wreq ON wa.request_id = wreq.request_id
            LEFT JOIN
                WalkRatings wr ON wreq.request_id = wr.request_id AND u.user_id = wr.walker_id
            WHERE
                u.role = 'walker'
            GROUP BY
                u.user_id
        `);

        res.json(rows);
    }

    catch (error) {
        console.error('Error fetching walker summary: ', error);
        res.status(500).json( { error: 'Failed to fetch open walk requests' });
    }
});

module.exports = app;
