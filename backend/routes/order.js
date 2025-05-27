const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authenticateToken = require('../middleware/authenticateToken');

// GET /api/orders - cliente o artigiano
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'cliente') {
      query = `
        SELECT o.id AS ordine_id, o.data, p.nome AS prodotto_nome, op.quantita, p.prezzo, u.nome AS artigiano_nome
        FROM ordini o
        JOIN ordini_prodotti op ON o.id = op.ordine_id
        JOIN prodotti p ON op.prodotto_id = p.id
        JOIN users u ON p.artigiano_id = u.id
        WHERE o.cliente_id = $1
        ORDER BY o.data DESC
      `;
      params = [req.user.id];
    } else if (req.user.role === 'artigiano') {
      query = `
        SELECT o.id AS ordine_id, o.data, p.nome AS prodotto_nome, op.quantita, p.prezzo, u.nome AS cliente_nome
        FROM ordini o
        JOIN ordini_prodotti op ON o.id = op.ordine_id
        JOIN prodotti p ON op.prodotto_id = p.id
        JOIN users u ON o.cliente_id = u.id
        WHERE p.artigiano_id = $1
        ORDER BY o.data DESC
      `;
      params = [req.user.id];
    } else {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// POST /api/orders - cliente crea nuovo ordine
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'cliente') {
    return res.status(403).json({ error: 'Solo i clienti possono creare ordini' });
  }

  const { prodotti } = req.body;
  if (!Array.isArray(prodotti) || prodotti.length === 0) {
    return res.status(400).json({ error: 'Prodotti non validi' });
  }

  try {
    await pool.query('BEGIN');

    const ordineRes = await pool.query(
      'INSERT INTO ordini (cliente_id) VALUES ($1) RETURNING id',
      [req.user.id]
    );

    const ordine_id = ordineRes.rows[0].id;

    for (const item of prodotti) {
      const { prodotto_id, quantita } = item;

      const exists = await pool.query('SELECT id FROM prodotti WHERE id = $1', [prodotto_id]);
      if (exists.rowCount === 0) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ error: `Prodotto ID ${prodotto_id} non trovato` });
      }

      await pool.query(
        'INSERT INTO ordini_prodotti (ordine_id, prodotto_id, quantita) VALUES ($1, $2, $3)',
        [ordine_id, prodotto_id, quantita || 1]
      );
    }

    await pool.query('COMMIT');
    res.status(201).json({ message: 'Ordine creato', ordine_id });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
