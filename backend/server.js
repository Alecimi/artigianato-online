const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

// Importa il pool dal file pool.js
const pool = require('./db/pool.js');  

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Chiave segreta per JWT (meglio metterla in variabile d'ambiente)
const JWT_SECRET = 'tua_chiave_segreta';

// Endpoint registrazione
app.post('/api/register', async (req, res) => {
  const { nome, email, password, role } = req.body;

  try {
    // Controllo ruolo valido
    if (!['cliente', 'artigiano'].includes(role)) {
      return res.status(400).json({ error: 'Ruolo non valido' });
    }

    // Controllo se esiste già email
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email già registrata' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserimento utente
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

// Endpoint login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Trova utente
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Email o password errati' });
    }

    const user = userResult.rows[0];

    // Verifica password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Email o password errati' });
    }

    // Genera token JWT
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

// Avvio server
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
