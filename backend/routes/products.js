const express = require('express');
const pool = require('../db/pool');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// Lista tutti i prodotti
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.nome, p.descrizione, p.prezzo, u.nome AS artigiano_nome
      FROM prodotti p
      JOIN users u ON p.artigiano_id = u.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Crea nuovo prodotto
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'artigiano') {
    return res.status(403).json({ error: 'Accesso negato' });
  }

  const { nome, descrizione, prezzo } = req.body;
  try {
    await pool.query(
      'INSERT INTO prodotti (artigiano_id, nome, descrizione, prezzo) VALUES ($1, $2, $3, $4)',
      [req.user.id, nome, descrizione, prezzo]
    );
    res.status(201).json({ message: 'Prodotto creato' });
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
