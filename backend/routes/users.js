const express = require('express');
const pool = require('../db/pool');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, email, role FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
