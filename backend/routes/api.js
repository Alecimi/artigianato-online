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

// GET /api/products - lista tutti i prodotti con nome artigiano
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.nome, p.descrizione, p.prezzo, u.nome AS artigiano_nome
      FROM prodotti p
      JOIN users u ON p.artigiano_id = u.id
    `);
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
      'INSERT INTO prodotti (artigiano_id, nome, descrizione, prezzo) VALUES ($1, $2, $3, $4)',
      [req.user.id, nome, descrizione, prezzo]
    );
    res.status(201).json({ message: 'Prodotto aggiunto' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// GET /api/orders - ordini per cliente o artigiano, con prodotti in ogni ordine
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    let ordersResult;

    if (req.user.role === 'cliente') {
      // Prendo tutti gli ordini del cliente con i prodotti
      ordersResult = await pool.query(`
        SELECT o.id AS ordine_id, o.data, p.id AS prodotto_id, p.nome AS prodotto_nome, p.prezzo, op.quantita, u.nome AS artigiano_nome
        FROM ordini o
        JOIN ordini_prodotti op ON o.id = op.ordine_id
        JOIN prodotti p ON op.prodotto_id = p.id
        JOIN users u ON p.artigiano_id = u.id
        WHERE o.cliente_id = $1
        ORDER BY o.data DESC
      `, [req.user.id]);
    } else if (req.user.role === 'artigiano') {
      // Prendo tutti gli ordini che includono prodotti di questo artigiano
      ordersResult = await pool.query(`
        SELECT o.id AS ordine_id, o.data, p.id AS prodotto_id, p.nome AS prodotto_nome, p.prezzo, op.quantita, u.nome AS cliente_nome
        FROM ordini o
        JOIN ordini_prodotti op ON o.id = op.ordine_id
        JOIN prodotti p ON op.prodotto_id = p.id
        JOIN users u ON o.cliente_id = u.id
        WHERE p.artigiano_id = $1
        ORDER BY o.data DESC
      `, [req.user.id]);
    } else {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    // Organizza i dati raggruppando i prodotti per ordine
    const ordersMap = new Map();

    for (const row of ordersResult.rows) {
      if (!ordersMap.has(row.ordine_id)) {
        ordersMap.set(row.ordine_id, {
          ordine_id: row.ordine_id,
          data: row.data,
          prodotti: [],
        });
        if (req.user.role === 'cliente') {
          ordersMap.get(row.ordine_id).artigiano_nome = row.artigiano_nome;
        } else if (req.user.role === 'artigiano') {
          ordersMap.get(row.ordine_id).cliente_nome = row.cliente_nome;
        }
      }
      ordersMap.get(row.ordine_id).prodotti.push({
        prodotto_id: row.prodotto_id,
        nome: row.prodotto_nome,
        prezzo: row.prezzo,
        quantita: row.quantita,
      });
    }

    res.json(Array.from(ordersMap.values()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// POST /api/orders - crea nuovo ordine (solo cliente), con più prodotti
router.post('/orders', authenticateToken, async (req, res) => {
  if (req.user.role !== 'cliente') {
    return res.status(403).json({ error: 'Accesso negato' });
  }

  // Aspettiamo un array di prodotti con id e quantità [{ prodotto_id, quantita }]
  const { prodotti } = req.body;

  if (!Array.isArray(prodotti) || prodotti.length === 0) {
    return res.status(400).json({ error: 'Devi fornire almeno un prodotto con quantità' });
  }

  try {
    await pool.query('BEGIN');

    // Inserisco ordine
    const ordineResult = await pool.query(
      'INSERT INTO ordini (cliente_id) VALUES ($1) RETURNING id',
      [req.user.id]
    );
    const ordine_id = ordineResult.rows[0].id;

    // Inserisco i prodotti ordinati nella tabella ordini_prodotti
    for (const item of prodotti) {
      const { prodotto_id, quantita } = item;

      // Controllo che prodotto esista
      const productCheck = await pool.query('SELECT id FROM prodotti WHERE id = $1', [prodotto_id]);
      if (productCheck.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ error: `Prodotto con id ${prodotto_id} non trovato` });
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
