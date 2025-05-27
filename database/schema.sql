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
CREATE TABLE IF NOT EXISTS prodotti (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descrizione TEXT,
  prezzo NUMERIC(10,2) NOT NULL,
  artigiano_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella ordini (semplice, ogni ordine ha cliente e riferimento a prodotti in tabella ordini_prodotti)
CREATE TABLE IF NOT EXISTS ordini (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES users(id),
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella per gestire i prodotti in ogni ordine (relazione molti a molti)
CREATE TABLE IF NOT EXISTS ordini_prodotti (
  ordine_id INTEGER REFERENCES ordini(id),
  prodotto_id INTEGER REFERENCES prodotti(id),
  quantita INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ordine_id, prodotto_id)
);
