import { useEffect, useState } from "react";
import { getTodosAgendamentos, getServicos, getConfiguracoes, atualizarConfiguracoes, deletarAgendamento } from "../services/api";
import "./Admin.css";

export default function Admin() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [nomeServico, setNomeServico] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [aba, setAba] = useState("agendamentos");
  const [barbeariaAberta, setBarbeariaAberta] = useState(true);
  const [filtroData, setFiltroData] = useState("");

  function getToken() {
    return localStorage.getItem("token");
  }

  useEffect(() => {
    carregar();
  }, []);

  async function carregar(data = "") {
    const a = await getTodosAgendamentos(data);
    setAgendamentos(Array.isArray(a) ? a : []);
    const s = await getServicos();
    setServicos(Array.isArray(s) ? s : []);
    const c = await getConfiguracoes();
    setBarbeariaAberta(c.aberta);
  }

  async function handleToggleBarbearia() {
    await atualizarConfiguracoes(!barbeariaAberta);
    setBarbeariaAberta(!barbeariaAberta);
  }

  async function handleCriarServico(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const res = await fetch("http://localhost:3000/servicos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ nome: nomeServico, preco: Number(preco), duracao_minutos: Number(duracao) }),
    });

    const data = await res.json();

    if (data.erro) {
      setErro(data.erro);
      return;
    }

    setSucesso("Serviço criado com sucesso!");
    setNomeServico("");
    setPreco("");
    setDuracao("");
    carregar();
  }

  async function handleDeletarServico(id) {
    await fetch(`http://localhost:3000/servicos/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    carregar();
  }

  async function handleStatus(id, status) {
    await fetch(`http://localhost:3000/agendamentos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ status }),
    });
    carregar(filtroData);
  }

  async function handleDeletarAgendamento(id) {
    const confirmar = window.confirm("Tem certeza que quer excluir este agendamento?");
    if (!confirmar) return;
    await deletarAgendamento(id);
    carregar(filtroData);
  }

  function sair() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "/login";
  }

  const statusCor = {
    pendente: "#C9A84C",
    confirmado: "#5ec97a",
    cancelado: "#e05555",
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>✂ Painel do Barbeiro</h1>
        <div className="admin-header-botoes">
          <button className={barbeariaAberta ? "btn-fechar" : "btn-abrir"} onClick={handleToggleBarbearia}>
            {barbeariaAberta ? "Fechar barbearia" : "Abrir barbearia"}
          </button>
          <button className="btn-sair" onClick={sair}>Sair</button>
        </div>
      </div>

      <div className="admin-abas">
        <button className={`aba ${aba === "agendamentos" ? "ativa" : ""}`} onClick={() => setAba("agendamentos")}>Agendamentos</button>
        <button className={`aba ${aba === "servicos" ? "ativa" : ""}`} onClick={() => setAba("servicos")}>Serviços</button>
      </div>

      {aba === "agendamentos" && (
        <div>
          <div className="filtro-data">
            <input
              type="date"
              value={filtroData}
              onChange={(e) => {
                setFiltroData(e.target.value);
                carregar(e.target.value);
              }}
            />
            {filtroData && (
              <button className="btn-sair" onClick={() => { setFiltroData(""); carregar(); }}>
                Limpar filtro
              </button>
            )}
          </div>

          {agendamentos.length === 0 ? (
            <p className="sem-agendamentos">Nenhum agendamento ainda.</p>
          ) : (
            agendamentos.map((a) => (
              <div key={a.id} className="card">
                <div className="card-header">
                  <p>{a.cliente_nome}</p>
                  <span className="badge" style={{ background: statusCor[a.status] + "22", color: statusCor[a.status] }}>
                    {a.status}
                  </span>
                </div>
                <p className="card-info">{a.servico_nome} — R${a.preco}</p>
                <p className="card-info mb">{a.data} às {a.horario}</p>
                <div className="card-botoes">
                  <button className="btn-confirmar" onClick={() => handleStatus(a.id, "confirmado")}>Confirmar</button>
                  <button className="btn-cancelar" onClick={() => handleStatus(a.id, "cancelado")}>Cancelar</button>
                  {a.status === "cancelado" && (
                    <button className="btn-deletar" onClick={() => handleDeletarAgendamento(a.id)}>Excluir</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {aba === "servicos" && (
        <div>
          <div className="form-card">
            <h2>Adicionar serviço</h2>
            <form className="form-coluna" onSubmit={handleCriarServico}>
              <input type="text" placeholder="Nome do serviço" value={nomeServico} onChange={(e) => setNomeServico(e.target.value)} />
              <input type="number" placeholder="Preço (R$)" value={preco} onChange={(e) => setPreco(e.target.value)} />
              <input type="number" placeholder="Duração (minutos)" value={duracao} onChange={(e) => setDuracao(e.target.value)} />
              <button type="submit">Adicionar</button>
            </form>
            {erro && <p className="erro" style={{ marginTop: "12px" }}>{erro}</p>}
            {sucesso && <p className="sucesso" style={{ marginTop: "12px" }}>{sucesso}</p>}
          </div>

          {servicos.map((s) => (
            <div key={s.id} className="servico-card">
              <div>
                <p>{s.nome}</p>
                <span>R${s.preco} — {s.duracao_minutos} min</span>
              </div>
              <button className="btn-deletar" onClick={() => handleDeletarServico(s.id)}>Deletar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}