const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'tua_chiave_segreta';

// Middleware per autenticare token e salvare user nel req.user
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// GET /api/products - lista tutti i prodotti
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT p.id, p.nome, p.descrizione, p.prezzo, u.nome AS artigiano_nome FROM products p JOIN users u ON p.artigiano_id = u.id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// POST /api/products - aggiunge prodotto (solo artigiano)
router.post('/products', authenticateToken, async (req, res) => {
  if (req.user.role !== 'artigiano') {
    return res.status(403).json({ error: 'Accesso negato' });
  }

  const { nome, descrizione, prezzo } = req.body;

  try {
    await pool.query(
      'INSERT INTO products (artigiano_id, nome, descrizione, prezzo) VALUES ($1, $2, $3, $4)',
      [req.user.id, nome, descrizione, prezzo]
    );
    res.status(201).json({ message: 'Prodotto aggiunto' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// GET /api/orders - ordini per cliente o artigiano
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'cliente') {
      query = `
        SELECT o.id, o.quantita, o.stato, o.created_at, p.nome AS prodotto_nome, p.prezzo, u.nome AS artigiano_nome
        FROM orders o
        JOIN products p ON o.prodotto_id = p.id
        JOIN users u ON p.artigiano_id = u.id
        WHERE o.cliente_id = $1
        ORDER BY o.created_at DESC
      `;
      params = [req.user.id];
    } else if (req.user.role === 'artigiano') {
      query = `
        SELECT o.id, o.quantita, o.stato, o.created_at, p.nome AS prodotto_nome, u.nome AS cliente_nome
        FROM orders o
        JOIN products p ON o.prodotto_id = p.id
        JOIN users u ON o.cliente_id = u.id
        WHERE p.artigiano_id = $1
        ORDER BY o.created_at DESC
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

// POST /api/orders - crea nuovo ordine (solo cliente)
router.post('/orders', authenticateToken, async (req, res) => {
  if (req.user.role !== 'cliente') {
    return res.status(403).json({ error: 'Accesso negato' });
  }

  const { prodotto_id, quantita } = req.body;

  try {
    // Controlla che il prodotto esista
    const productCheck = await pool.query('SELECT * FROM products WHERE id = $1', [prodotto_id]);
    if (productCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Prodotto non trovato' });
    }

    await pool.query(
      'INSERT INTO orders (cliente_id, prodotto_id, quantita) VALUES ($1, $2, $3)',
      [req.user.id, prodotto_id, quantita || 1]
    );

    res.status(201).json({ message: 'Ordine creato' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
