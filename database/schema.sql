-- Tabella utenti/artigiani
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('cliente', 'artigiano')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella prodotti
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  artigiano_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  nome VARCHAR(150) NOT NULL,
  descrizione TEXT,
  prezzo NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella ordini
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  prodotto_id INTEGER REFERENCES products(id),
  quantita INTEGER NOT NULL DEFAULT 1,
  stato VARCHAR(50) DEFAULT 'in attesa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

