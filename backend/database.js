const Database = require("better-sqlite3");

const db = new Database("database.db");

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'cliente'
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS servicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    preco REAL NOT NULL,
    duracao_minutos INTEGER NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    servico_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    horario TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    FOREIGN KEY (cliente_id) REFERENCES users(id),
    FOREIGN KEY (servico_id) REFERENCES servicos(id)
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS configuracoes (
    id INTEGER PRIMARY KEY,
    barbearia_aberta INTEGER NOT NULL DEFAULT 1
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS recuperacao_senha (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    expira_em INTEGER NOT NULL
  )
`).run();

const config = db.prepare("SELECT * FROM configuracoes WHERE id = 1").get();
if (!config) {
  db.prepare("INSERT INTO configuracoes (id, barbearia_aberta) VALUES (1, 1)").run();
}


module.exports = db;