const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./database");
const jwt = require("jsonwebtoken");
const { enviarEmailConfirmacao, enviarEmailCancelamento, transporter } = require("./email");

const SECRET = "barbearia_pirulito_secret";

function autenticarToken(req, res, next) {
  const auth = req.headers["authorization"];
  const token = auth && auth.split(" ")[1];

  if (!token) {
    return res.status(401).json({ erro: "Token não fornecido" });
  }

  jwt.verify(token, SECRET, (err, usuario) => {
    if (err) {
      return res.status(403).json({ erro: "Token inválido" });
    }
    req.usuario = usuario;
    next();
  });
}

function apenasAdmin(req, res, next) {
  if (req.usuario.tipo !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }
  next();
}

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("API da barbearia rodando 🚀");
});

app.post("/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  const usuarioExiste = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (usuarioExiste) {
    return res.status(400).json({ erro: "Email já cadastrado" });
  }

  const senhaCriptografada = await bcrypt.hash(senha, 10);

  db.prepare("INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)").run(nome, email, senhaCriptografada);

  res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!" });
});

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  const usuario = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!usuario) {
    return res.status(400).json({ erro: "Email ou senha inválidos" });
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

  if (!senhaCorreta) {
    return res.status(400).json({ erro: "Email ou senha inválidos" });
  }

  const token = jwt.sign(
    { id: usuario.id, tipo: usuario.tipo },
    SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    mensagem: "Login realizado com sucesso!",
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      tipo: usuario.tipo
    }
  });
});
// Listar serviços (qualquer um pode ver)
app.get("/servicos", (req, res) => {
  const servicos = db.prepare("SELECT * FROM servicos").all();
  res.json(servicos);
});

// Criar serviço (só admin)
app.post("/servicos", autenticarToken, apenasAdmin, (req, res) => {
  const { nome, preco, duracao_minutos } = req.body;

  if (!nome || !preco || !duracao_minutos) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  db.prepare("INSERT INTO servicos (nome, preco, duracao_minutos) VALUES (?, ?, ?)").run(nome, preco, duracao_minutos);

  res.status(201).json({ mensagem: "Serviço criado com sucesso!" });
});

// Editar serviço (só admin)
app.put("/servicos/:id", autenticarToken, apenasAdmin, (req, res) => {
  const { nome, preco, duracao_minutos } = req.body;
  const { id } = req.params;

  db.prepare("UPDATE servicos SET nome = ?, preco = ?, duracao_minutos = ? WHERE id = ?").run(nome, preco, duracao_minutos, id);

  res.json({ mensagem: "Serviço atualizado com sucesso!" });
});

// Deletar serviço (só admin)
app.delete("/servicos/:id", autenticarToken, apenasAdmin, (req, res) => {
  const { id } = req.params;

  db.prepare("DELETE FROM servicos WHERE id = ?").run(id);

  res.json({ mensagem: "Serviço deletado com sucesso!" });
});

// Criar agendamento (cliente logado)
app.post("/agendamentos", autenticarToken, (req, res) => {
  const { servico_id, data, horario } = req.body;

  if (!servico_id || !data || !horario) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  const horarioOcupado = db.prepare(
    "SELECT * FROM agendamentos WHERE data = ? AND horario = ? AND status != 'cancelado'"
  ).get(data, horario);

  if (horarioOcupado) {
    return res.status(400).json({ erro: "Horário já reservado" });
  }

  db.prepare(
    "INSERT INTO agendamentos (cliente_id, servico_id, data, horario) VALUES (?, ?, ?, ?)"
  ).run(req.usuario.id, servico_id, data, horario);

  res.status(201).json({ mensagem: "Agendamento criado com sucesso!" });
});

// Ver agendamentos do cliente logado
app.get("/agendamentos/meus", autenticarToken, (req, res) => {
  const agendamentos = db.prepare(`
    SELECT agendamentos.*, servicos.nome as servico_nome, servicos.preco
    FROM agendamentos
    JOIN servicos ON agendamentos.servico_id = servicos.id
    WHERE agendamentos.cliente_id = ?
    ORDER BY data, horario
  `).all(req.usuario.id);

  res.json(agendamentos);
});

app.put("/agendamentos/:id", autenticarToken, apenasAdmin, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!["pendente", "confirmado", "cancelado"].includes(status)) {
    return res.status(400).json({ erro: "Status inválido" });
  }

  db.prepare("UPDATE agendamentos SET status = ? WHERE id = ?").run(status, id);

  const agendamento = db.prepare(`
    SELECT agendamentos.*, 
           users.nome as cliente_nome,
           users.email as cliente_email,
           servicos.nome as servico_nome
    FROM agendamentos
    JOIN users ON agendamentos.cliente_id = users.id
    JOIN servicos ON agendamentos.servico_id = servicos.id
    WHERE agendamentos.id = ?
  `).get(id);

  try {
    if (status === "confirmado") {
      await enviarEmailConfirmacao(
        agendamento.cliente_email,
        agendamento.cliente_nome,
        agendamento.servico_nome,
        agendamento.data,
        agendamento.horario
      );
    } else if (status === "cancelado") {
      await enviarEmailCancelamento(
        agendamento.cliente_email,
        agendamento.cliente_nome,
        agendamento.servico_nome,
        agendamento.data,
        agendamento.horario
      );
    }
  } catch (err) {
    console.error("Erro ao enviar email:", err.message);
  }

  res.json({ mensagem: "Status atualizado com sucesso!" });
});

// Ver status da barbearia
app.get("/configuracoes", (req, res) => {
  const config = db.prepare("SELECT * FROM configuracoes WHERE id = 1").get();
  res.json({ aberta: config.barbearia_aberta === 1 });
});

// Atualizar status da barbearia (só admin)
app.put("/configuracoes", autenticarToken, apenasAdmin, (req, res) => {
  const { aberta } = req.body;
  db.prepare("UPDATE configuracoes SET barbearia_aberta = ? WHERE id = 1").run(aberta ? 1 : 0);
  res.json({ mensagem: "Status atualizado com sucesso!" });
});

// Cliente cancela o próprio agendamento
app.put("/agendamentos/:id/cancelar", autenticarToken, (req, res) => {
  const { id } = req.params;

  const agendamento = db.prepare("SELECT * FROM agendamentos WHERE id = ?").get(id);

  if (!agendamento) {
    return res.status(404).json({ erro: "Agendamento não encontrado" });
  }

  if (agendamento.cliente_id !== req.usuario.id) {
    return res.status(403).json({ erro: "Você não pode cancelar este agendamento" });
  }

  if (agendamento.status === "cancelado") {
    return res.status(400).json({ erro: "Agendamento já cancelado" });
  }

  db.prepare("UPDATE agendamentos SET status = 'cancelado' WHERE id = ?").run(id);

  res.json({ mensagem: "Agendamento cancelado com sucesso!" });
});

// Buscar horários ocupados em uma data
app.get("/agendamentos/horarios-ocupados", (req, res) => {
  const { data } = req.query;

  if (!data) {
    return res.status(400).json({ erro: "Data não informada" });
  }

  const ocupados = db.prepare(`
    SELECT horario FROM agendamentos 
    WHERE data = ? AND status != 'cancelado'
  `).all(data);

  res.json(ocupados.map((a) => a.horario));
});

app.get("/agendamentos", autenticarToken, apenasAdmin, (req, res) => {
  const { data } = req.query;

  let agendamentos;

  if (data) {
    agendamentos = db.prepare(`
      SELECT agendamentos.*, 
             users.nome as cliente_nome, 
             servicos.nome as servico_nome, 
             servicos.preco
      FROM agendamentos
      JOIN users ON agendamentos.cliente_id = users.id
      JOIN servicos ON agendamentos.servico_id = servicos.id
      WHERE agendamentos.data = ?
      ORDER BY horario
    `).all(data);
  } else {
    agendamentos = db.prepare(`
      SELECT agendamentos.*, 
             users.nome as cliente_nome, 
             servicos.nome as servico_nome, 
             servicos.preco
      FROM agendamentos
      JOIN users ON agendamentos.cliente_id = users.id
      JOIN servicos ON agendamentos.servico_id = servicos.id
      ORDER BY data, horario
    `).all();
  }

  res.json(agendamentos);
});

app.delete("/agendamentos/:id", autenticarToken, apenasAdmin, (req, res) => {
  const { id } = req.params;

  const agendamento = db.prepare("SELECT * FROM agendamentos WHERE id = ?").get(id);

  if (!agendamento) {
    return res.status(404).json({ erro: "Agendamento não encontrado" });
  }

  if (agendamento.status !== "cancelado") {
    return res.status(400).json({ erro: "Só é possível excluir agendamentos cancelados" });
  }

  db.prepare("DELETE FROM agendamentos WHERE id = ?").run(id);

  res.json({ mensagem: "Agendamento excluído com sucesso!" });
});

// Solicitar recuperação de senha
app.post("/recuperar-senha", async (req, res) => {
  const { email } = req.body;

  const usuario = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!usuario) {
    return res.status(400).json({ erro: "Email não encontrado" });
  }

  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expira = Date.now() + 1000 * 60 * 30;

  db.prepare("DELETE FROM recuperacao_senha WHERE user_id = ?").run(usuario.id);
  db.prepare("INSERT INTO recuperacao_senha (user_id, token, expira_em) VALUES (?, ?, ?)").run(usuario.id, token, expira);

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

// Redefinir senha
app.post("/nova-senha", async (req, res) => {
  const { token, senha } = req.body;

  const recuperacao = db.prepare("SELECT * FROM recuperacao_senha WHERE token = ?").get(token);

  if (!recuperacao) {
    return res.status(400).json({ erro: "Token inválido" });
  }

  if (Date.now() > recuperacao.expira_em) {
    db.prepare("DELETE FROM recuperacao_senha WHERE token = ?").run(token);
    return res.status(400).json({ erro: "Token expirado" });
  }

  const senhaCriptografada = await bcrypt.hash(senha, 10);
  db.prepare("UPDATE users SET senha = ? WHERE id = ?").run(senhaCriptografada, recuperacao.user_id);
  db.prepare("DELETE FROM recuperacao_senha WHERE token = ?").run(token);

  res.json({ mensagem: "Senha alterada com sucesso!" });
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});