import { useState } from "react";
import { cadastrar } from "../services/api";
import "./Cadastro.css";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function handleCadastro(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const data = await cadastrar(nome, email, senha);

    if (data.erro) {
      setErro(data.erro);
      return;
    }

    setSucesso("Cadastro realizado! Faça o login.");
    setNome("");
    setEmail("");
    setSenha("");
  }

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <div className="cadastro-topo">
          <h1>✂ Pirulito do Corte</h1>
          <p>Crie sua conta</p>
        </div>

        <form className="cadastro-form" onSubmit={handleCadastro}>
          <input
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <button type="submit">Cadastrar</button>
        </form>

        {erro && <p className="erro cadastro-mensagem">{erro}</p>}
        {sucesso && <p className="sucesso cadastro-mensagem">{sucesso}</p>}

        <p className="cadastro-rodape">
          Já tem conta? <a href="/login">Faça o login</a>
        </p>
      </div>
    </div>
  );
}