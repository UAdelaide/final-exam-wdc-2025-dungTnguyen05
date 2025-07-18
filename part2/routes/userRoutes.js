const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

// POST login (Q13)
router.post('/login', async (req, res) => {
  const { username, password } = req.body; // Change email -> username

  try {
    const [rows] = await db.query(`
      SELECT user_id, username, role FROM Users
      WHERE username = ? AND password_hash = ?
    `, [username, password]); // Change email -> username

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Store user in session
    req.session.user = rows[0];

    // Redirect to appropriate dashboard based on role
    res.json({ message: 'Login successful', user: rows[0], redirectUrl: rows[0].role === 'owner' ? '/owner-dashboard.html' : '/walker-dashboard.html' });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST logout (Q14)
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// GET user's dogs (Q15)
router.get('/dogs', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const [rows] = await db.query(`
      SELECT dog_id, name, size FROM Dogs
      WHERE owner_id = ?
    `, [req.session.user.user_id]);

    res.json(rows);
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// GET all dogs (Q17)
router.get('/all-dogs', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.dog_id, d.name AS dog_name, d.size, d.owner_id
      FROM Dogs d
    `);

    res.json(rows);
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

module.exports = router;