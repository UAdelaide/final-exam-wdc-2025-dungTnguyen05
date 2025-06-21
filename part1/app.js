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
app.get('/api/walkers/summary', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                u.username AS walker_username,
                COUNT(wr.rating) AS total_ratings,
                CASE
                    WHEN COUNT(wr.rating) > 0
                    THEN AVG(wr.rating)
                    ELSE NULL
                END AS average_rating,
                COALESCE(COUNT(DISTINCT cw.request_id), 0) AS completed_walks
            FROM
                Users u
            LEFT JOIN
                WalkApplications wa ON u.user_id = wa.walker_id AND wa.status = 'accepted'
            LEFT JOIN
                WalkRequests completed_walks ON wa.request_id = completed_walks.request_id AND completed_walks.status = 'completed'
            LEFT JOIN
                WalkRatings wr_ratings ON completed_walks.request_id = wr_ratings.request_id AND wr_ratings.walker_id = u.user_id
            WHERE
                u.role = 'walker'
            GROUP BY
                u.user_id, u.username
        `);

        res.json(rows);
    }

    catch (error) {
        console.error('Error fetching walker summary: ', error);
        res.status(500).json( { error: 'Failed to fetch walker summary' });
    }
});

module.exports = app;
