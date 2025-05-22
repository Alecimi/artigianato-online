const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',         // o l'utente che hai creato
  host: 'localhost',
  database: 'artigianato',  // nome del tuo database
  password: 'postgre',// ⚠️ inserisci qui la password del tuo utente PostgreSQL
  port: 5432,
});

module.exports = pool;
