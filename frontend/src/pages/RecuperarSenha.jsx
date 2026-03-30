import { useState } from "react";
import "./Login.css";

const API_URL = "https://sistema-de-agendamento-barbearia-1-oako.onrender.com";


export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function handleRecuperar(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");

    const res = await fetch(`${API_URL}/recuperar-senha`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (data.erro) {
      setErro(data.erro);
      return;
    }

    setMensagem("Email enviado! Verifique sua caixa de entrada.");
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-topo">
          <h1>✂ Pirulito do Corte</h1>
          <p>Recuperar senha</p>
        </div>

        <form className="login-form" onSubmit={handleRecuperar}>
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">Enviar email</button>
        </form>

        {erro && <p className="erro login-erro">{erro}</p>}
        {mensagem && <p className="sucesso login-erro">{mensagem}</p>}

        <p className="login-rodape">
          Lembrou a senha? <a href="/login">Voltar ao login</a>
        </p>
      </div>
    </div>
  );
}