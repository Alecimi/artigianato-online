const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db/pool.js');
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = 'tua_chiave_segreta';

// Middleware per autenticazione JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token mancante' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token non valido' });
    req.user = user; // id, nome, role
    next();
  });
}

// --- Registrazione e login (già presenti, li riporto per completezza) ---

app.post('/api/register', async (req, res) => {
  const { nome, email, password, role } = req.body;
  try {
    if (!['cliente', 'artigiano'].includes(role)) {
      return res.status(400).json({ error: 'Ruolo non valido' });
    }
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email già registrata' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (nome, email, password, role) VALUES ($1, $2, $3, $4)',
      [nome, email, hashedPassword, role]
    );
    res.status(201).json({ message: 'Utente registrato con successo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Email o password errati' });
    }
    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Email o password errati' });
    }
    const token = jwt.sign(
      { id: user.id, nome: user.nome, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// --- Nuove API ---

// Catalogo prodotti (visibile a tutti)
app.get('/api/prodotti', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prodotti ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Ordini cliente (solo cliente autenticato)
app.get('/api/ordini', authenticateToken, async (req, res) => {
  if (req.user.role !== 'cliente') {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  try {
    const result = await pool.query('SELECT * FROM ordini WHERE cliente_id = $1 ORDER BY data DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Visualizza prodotti artigiano (solo artigiano autenticato)
app.get('/api/artigiano/prodotti', authenticateToken, async (req, res) => {
  if (req.user.role !== 'artigiano') {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  try {
    const result = await pool.query('SELECT * FROM prodotti WHERE artigiano_id = $1 ORDER BY id DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Carica nuovo prodotto (solo artigiano autenticato)
app.post('/api/artigiano/prodotti', authenticateToken, async (req, res) => {
  if (req.user.role !== 'artigiano') {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  const { nome, descrizione, prezzo } = req.body;
  if (!nome || !prezzo) {
    return res.status(400).json({ error: 'Nome e prezzo sono obbligatori' });
  }
  try {
    await pool.query(
      'INSERT INTO prodotti (nome, descrizione, prezzo, artigiano_id) VALUES ($1, $2, $3, $4)',
      [nome, descrizione || '', prezzo, req.user.id]
    );
    res.status(201).json({ message: 'Prodotto aggiunto' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Avvio server
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
