import { useState } from "react";
import { login } from "../services/api";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setErro("");

    const data = await login(email, senha);

    if (data.erro) {
      setErro(data.erro);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));

    if (data.usuario.tipo === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/agendar";
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-topo">
          <h1>✂ Pirulito do Corte</h1>
          <p>Entre na sua conta</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
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
          <button type="submit">Entrar</button>
        </form>

        {erro && <p className="erro login-erro">{erro}</p>}

        <p className="login-rodape">
  Não tem conta? <a href="/cadastro">Cadastre-se</a>
</p>
<p className="login-rodape">
  <a href="/recuperar-senha">Esqueceu a senha?</a>
</p>
      </div>
    </div>
  );
}