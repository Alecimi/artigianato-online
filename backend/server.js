const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rotta di test
app.get('/', (req, res) => {
  res.send('Backend Artigianato Online è attivo');
});

// Avvia server
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
