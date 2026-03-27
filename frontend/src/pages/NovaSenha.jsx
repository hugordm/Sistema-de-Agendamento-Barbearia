import { useState, useEffect } from "react";
import "./Login.css";

export default function NovaSenha() {
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [token, setToken] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  async function handleNovaSenha(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (senha !== confirmar) {
      setErro("As senhas não coincidem");
      return;
    }

    const res = await fetch("http://localhost:3000/nova-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, senha }),
    });

    const data = await res.json();

    if (data.erro) {
      setErro(data.erro);
      return;
    }

    setSucesso("Senha alterada com sucesso!");
    setTimeout(() => {
      window.location.href = "/login";
    }, 2000);
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-topo">
          <h1>✂ Pirulito do Corte</h1>
          <p>Criar nova senha</p>
        </div>

        <form className="login-form" onSubmit={handleNovaSenha}>
          <input
            type="password"
            placeholder="Nova senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirmar senha"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
          />
          <button type="submit">Salvar nova senha</button>
        </form>

        {erro && <p className="erro login-erro">{erro}</p>}
        {sucesso && <p className="sucesso login-erro">{sucesso}</p>}
      </div>
    </div>
  );
}