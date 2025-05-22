const pool = require('./db');

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rotta di test
app.get('/', (req, res) => {
  res.send('Backend Artigianato Online è attivo');
});


app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0] });
  } catch (err) {
    console.error('Errore connessione DB:', err);
    res.status(500).send('Errore connessione DB');
  }
});


// Avvia server
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
