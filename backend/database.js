require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function iniciarBanco() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'cliente'
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS servicos (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      preco REAL NOT NULL,
      duracao_minutos INTEGER NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS agendamentos (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER NOT NULL,
      servico_id INTEGER,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente'
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY,
      barbearia_aberta INTEGER NOT NULL DEFAULT 1
    )
  `);

  const config = await pool.query("SELECT * FROM configuracoes WHERE id = 1");
  if (config.rows.length === 0) {
    await pool.query("INSERT INTO configuracoes (id, barbearia_aberta) VALUES (1, 1)");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS recuperacao_senha (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      expira_em BIGINT NOT NULL
    )
  `);
}

module.exports = { pool, iniciarBanco };