require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool, iniciarBanco } = require("./database");
const { enviarEmailConfirmacao, enviarEmailCancelamento, transporter } = require("./email");

const SECRET = process.env.SECRET;

const app = express();
app.use(express.json());
app.use(cors());

function autenticarToken(req, res, next) {
  const auth = req.headers["authorization"];
  const token = auth && auth.split(" ")[1];
  if (!token) return res.status(401).json({ erro: "Token não fornecido" });
  jwt.verify(token, SECRET, (err, usuario) => {
    if (err) return res.status(403).json({ erro: "Token inválido" });
    req.usuario = usuario;
    next();
  });
}

function apenasAdmin(req, res, next) {
  if (req.usuario.tipo !== "admin") return res.status(403).json({ erro: "Acesso negado" });
  next();
}

app.get("/", (req, res) => res.send("API da barbearia rodando 🚀"));

app.post("/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ erro: "Preencha todos os campos" });

  const existe = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  if (existe.rows.length > 0) return res.status(400).json({ erro: "Email já cadastrado" });

  const senhaCriptografada = await bcrypt.hash(senha, 10);
  await pool.query("INSERT INTO users (nome, email, senha) VALUES ($1, $2, $3)", [nome, email, senhaCriptografada]);
  res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!" });
});

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: "Preencha todos os campos" });

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const usuario = result.rows[0];
  if (!usuario) return res.status(400).json({ erro: "Email ou senha inválidos" });

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
  if (!senhaCorreta) return res.status(400).json({ erro: "Email ou senha inválidos" });

  const token = jwt.sign({ id: usuario.id, tipo: usuario.tipo }, SECRET, { expiresIn: "7d" });
  res.json({ mensagem: "Login realizado com sucesso!", token, usuario: { id: usuario.id, nome: usuario.nome, tipo: usuario.tipo } });
});

app.get("/servicos", async (req, res) => {
  const result = await pool.query("SELECT * FROM servicos");
  res.json(result.rows);
});

app.post("/servicos", autenticarToken, apenasAdmin, async (req, res) => {
  const { nome, preco, duracao_minutos } = req.body;
  if (!nome || !preco || !duracao_minutos) return res.status(400).json({ erro: "Preencha todos os campos" });
  await pool.query("INSERT INTO servicos (nome, preco, duracao_minutos) VALUES ($1, $2, $3)", [nome, preco, duracao_minutos]);
  res.status(201).json({ mensagem: "Serviço criado com sucesso!" });
});

app.put("/servicos/:id", autenticarToken, apenasAdmin, async (req, res) => {
  const { nome, preco, duracao_minutos } = req.body;
  const { id } = req.params;
  await pool.query("UPDATE servicos SET nome = $1, preco = $2, duracao_minutos = $3 WHERE id = $4", [nome, preco, duracao_minutos, id]);
  res.json({ mensagem: "Serviço atualizado com sucesso!" });
});

app.delete("/servicos/:id", autenticarToken, apenasAdmin, async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM servicos WHERE id = $1", [id]);
  res.json({ mensagem: "Serviço deletado com sucesso!" });
});

app.post("/agendamentos", autenticarToken, async (req, res) => {
  const { servico_id, data, horario } = req.body;
  if (!servico_id || !data || !horario) return res.status(400).json({ erro: "Preencha todos os campos" });

  const ocupado = await pool.query(
    "SELECT * FROM agendamentos WHERE data = $1 AND horario = $2 AND status != 'cancelado'",
    [data, horario]
  );
  if (ocupado.rows.length > 0) return res.status(400).json({ erro: "Horário já reservado" });

  await pool.query("INSERT INTO agendamentos (cliente_id, servico_id, data, horario) VALUES ($1, $2, $3, $4)",
    [req.usuario.id, servico_id, data, horario]);
  res.status(201).json({ mensagem: "Agendamento criado com sucesso!" });
});

app.get("/agendamentos/meus", autenticarToken, async (req, res) => {
  const result = await pool.query(`
    SELECT agendamentos.*, servicos.nome as servico_nome, servicos.preco
    FROM agendamentos
    JOIN servicos ON agendamentos.servico_id = servicos.id
    WHERE agendamentos.cliente_id = $1
    ORDER BY data, horario
  `, [req.usuario.id]);
  res.json(result.rows);
});

app.get("/agendamentos/horarios-ocupados", async (req, res) => {
  const { data } = req.query;
  if (!data) return res.status(400).json({ erro: "Data não informada" });
  const result = await pool.query(
    "SELECT horario FROM agendamentos WHERE data = $1 AND status != 'cancelado'",
    [data]
  );
  res.json(result.rows.map((a) => a.horario));
});

app.get("/agendamentos", autenticarToken, apenasAdmin, async (req, res) => {
  const { data } = req.query;
  let result;
  if (data) {
    result = await pool.query(`
      SELECT agendamentos.*, users.nome as cliente_nome, servicos.nome as servico_nome, servicos.preco
      FROM agendamentos
      JOIN users ON agendamentos.cliente_id = users.id
      JOIN servicos ON agendamentos.servico_id = servicos.id
      WHERE agendamentos.data = $1
      ORDER BY horario
    `, [data]);
  } else {
    result = await pool.query(`
      SELECT agendamentos.*, users.nome as cliente_nome, servicos.nome as servico_nome, servicos.preco
      FROM agendamentos
      JOIN users ON agendamentos.cliente_id = users.id
      JOIN servicos ON agendamentos.servico_id = servicos.id
      ORDER BY data, horario
    `);
  }
  res.json(result.rows);
});

app.put("/agendamentos/:id", autenticarToken, apenasAdmin, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  if (!["pendente", "confirmado", "cancelado"].includes(status)) return res.status(400).json({ erro: "Status inválido" });

  await pool.query("UPDATE agendamentos SET status = $1 WHERE id = $2", [status, id]);

  const result = await pool.query(`
    SELECT agendamentos.*, users.nome as cliente_nome, users.email as cliente_email, servicos.nome as servico_nome
    FROM agendamentos
    JOIN users ON agendamentos.cliente_id = users.id
    JOIN servicos ON agendamentos.servico_id = servicos.id
    WHERE agendamentos.id = $1
  `, [id]);

  const agendamento = result.rows[0];

  try {
    if (status === "confirmado") {
      await enviarEmailConfirmacao(agendamento.cliente_email, agendamento.cliente_nome, agendamento.servico_nome, agendamento.data, agendamento.horario);
    } else if (status === "cancelado") {
      await enviarEmailCancelamento(agendamento.cliente_email, agendamento.cliente_nome, agendamento.servico_nome, agendamento.data, agendamento.horario);
    }
  } catch (err) {
    console.error("Erro ao enviar email:", err.message);
  }

  res.json({ mensagem: "Status atualizado com sucesso!" });
});

app.put("/agendamentos/:id/cancelar", autenticarToken, async (req, res) => {
  const { id } = req.params;
  const result = await pool.query("SELECT * FROM agendamentos WHERE id = $1", [id]);
  const agendamento = result.rows[0];

  if (!agendamento) return res.status(404).json({ erro: "Agendamento não encontrado" });
  if (agendamento.cliente_id !== req.usuario.id) return res.status(403).json({ erro: "Você não pode cancelar este agendamento" });
  if (agendamento.status === "cancelado") return res.status(400).json({ erro: "Agendamento já cancelado" });

  await pool.query("UPDATE agendamentos SET status = 'cancelado' WHERE id = $1", [id]);
  res.json({ mensagem: "Agendamento cancelado com sucesso!" });
});

app.delete("/agendamentos/:id", autenticarToken, apenasAdmin, async (req, res) => {
  const { id } = req.params;
  const result = await pool.query("SELECT * FROM agendamentos WHERE id = $1", [id]);
  const agendamento = result.rows[0];

  if (!agendamento) return res.status(404).json({ erro: "Agendamento não encontrado" });
  if (agendamento.status !== "cancelado") return res.status(400).json({ erro: "Só é possível excluir agendamentos cancelados" });

  await pool.query("DELETE FROM agendamentos WHERE id = $1", [id]);
  res.json({ mensagem: "Agendamento excluído com sucesso!" });
});

app.get("/configuracoes", async (req, res) => {
  const result = await pool.query("SELECT * FROM configuracoes WHERE id = 1");
  res.json({ aberta: result.rows[0].barbearia_aberta === 1 });
});

app.put("/configuracoes", autenticarToken, apenasAdmin, async (req, res) => {
  const { aberta } = req.body;
  await pool.query("UPDATE configuracoes SET barbearia_aberta = $1 WHERE id = 1", [aberta ? 1 : 0]);
  res.json({ mensagem: "Status atualizado com sucesso!" });
});

app.post("/recuperar-senha", async (req, res) => {
  const { email } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const usuario = result.rows[0];
  if (!usuario) return res.status(400).json({ erro: "Email não encontrado" });

  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expira = Date.now() + 1000 * 60 * 30;

  await pool.query("DELETE FROM recuperacao_senha WHERE user_id = $1", [usuario.id]);
  await pool.query("INSERT INTO recuperacao_senha (user_id, token, expira_em) VALUES ($1, $2, $3)", [usuario.id, token, expira]);

  const link = `http://localhost:5173/nova-senha?token=${token}`;

  try {
    await transporter.sendMail({
      from: '"Barbearia Pirulito do Corte" <barbeariapirulitodocorte@gmail.com>',
      to: email,
      subject: "Recuperação de senha",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #C9A84C;">Barbearia Pirulito do Corte</h2>
          <p>Você solicitou a recuperação de senha.</p>
          <p>Clique no botão abaixo para criar uma nova senha. O link expira em 30 minutos.</p>
          <a href="${link}" style="display: inline-block; background: #C9A84C; color: #1a1a1a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 1rem 0;">Criar nova senha</a>
          <p>Se não foi você, ignore este email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Erro ao enviar email:", err.message);
    return res.status(500).json({ erro: "Erro ao enviar email" });
  }

  res.json({ mensagem: "Email de recuperação enviado!" });
});

app.post("/nova-senha", async (req, res) => {
  const { token, senha } = req.body;
  const result = await pool.query("SELECT * FROM recuperacao_senha WHERE token = $1", [token]);
  const recuperacao = result.rows[0];

  if (!recuperacao) return res.status(400).json({ erro: "Token inválido" });
  if (Date.now() > recuperacao.expira_em) {
    await pool.query("DELETE FROM recuperacao_senha WHERE token = $1", [token]);
    return res.status(400).json({ erro: "Token expirado" });
  }

  const senhaCriptografada = await bcrypt.hash(senha, 10);
  await pool.query("UPDATE users SET senha = $1 WHERE id = $2", [senhaCriptografada, recuperacao.user_id]);
  await pool.query("DELETE FROM recuperacao_senha WHERE token = $1", [token]);
  res.json({ mensagem: "Senha alterada com sucesso!" });
});

iniciarBanco().then(() => {
  app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
}).catch((err) => {
  console.error("Erro ao iniciar banco:", err.message);
});