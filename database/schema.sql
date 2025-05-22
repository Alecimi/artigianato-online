-- Tabella utenti/artigiani
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('cliente', 'artigiano')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



