import { useEffect, useState } from "react";
import { getServicos, criarAgendamento, getMeusAgendamentos, getConfiguracoes, cancelarAgendamento, getHorariosOcupados} from "../services/api";
import "./Agendar.css";

export default function Agendar() {
  const [servicos, setServicos] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicoId, setServicoId] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [barbeariaAberta, setBarbeariaAberta] = useState(true);
  const [horariosOcupados, setHorariosOcupados] = useState([]);

  const horarios = [
    "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

  <input
  type="date"
  value={data}
  onChange={handleDataChange}
  min={new Date().toISOString().split("T")[0]}
/>

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const s = await getServicos();
    setServicos(Array.isArray(s) ? s : []);
    const a = await getMeusAgendamentos();
    setAgendamentos(Array.isArray(a) ? a : []);
    const c = await getConfiguracoes();
    setBarbeariaAberta(c.aberta);
  }

  async function handleAgendar(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const data_res = await criarAgendamento(servicoId, data, horario);

    if (data_res.erro) {
      setErro(data_res.erro);
      return;
    }

    setSucesso("Agendamento realizado com sucesso!");
    carregar();
  }

  async function handleCancelar(id) {
    const confirmar = window.confirm("Tem certeza que quer cancelar este agendamento?");
    if (!confirmar) return;

    const data = await cancelarAgendamento(id);

    if (data.erro) {
      alert(data.erro);
      return;
    }

    carregar();
  }

  async function handleDataChange(e) {
  const dataSelecionada = e.target.value;
  setData(dataSelecionada);
  setHorario("");

  if (dataSelecionada) {
    const ocupados = await getHorariosOcupados(dataSelecionada);
    setHorariosOcupados(Array.isArray(ocupados) ? ocupados : []);
  } else {
    setHorariosOcupados([]);
  }
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
    <div className="agendar-container">
      <div className="agendar-header">
        <h1>✂ Pirulito do Corte</h1>
        <button className="btn-sair" onClick={sair}>Sair</button>
      </div>

      <div className="agendar-form-card">
        <h2>Novo agendamento</h2>

        {!barbeariaAberta ? (
          <div className="barbearia-fechada">
            <p className="icone">✂</p>
            <p className="titulo">Barbearia fechada</p>
            <p className="subtitulo">No momento não estamos aceitando agendamentos.</p>
          </div>
        ) : (
          <form className="agendar-form" onSubmit={handleAgendar}>
            <select value={servicoId} onChange={(e) => setServicoId(e.target.value)}>
              <option value="">Escolha um serviço</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} — R${s.preco} — {s.duracao_minutos} min
                </option>
              ))}
            </select>

            <input
              type="date"
              value={data}
              onChange={handleDataChange}
            />
            
            
            <select value={horario} onChange={(e) => setHorario(e.target.value)}>
  <option value="">Escolha um horário</option>
  {horarios.map((h) => {
    const ocupado = horariosOcupados.includes(h);
    return (
      <option key={h} value={h} disabled={ocupado}>
        {ocupado ? `${h} — indisponível` : h}
      </option>
    );
  })}
</select>

            <button type="submit">Agendar</button>
          </form>
        )}

        {erro && <p className="erro" style={{ marginTop: "12px" }}>{erro}</p>}
        {sucesso && <p className="sucesso" style={{ marginTop: "12px" }}>{sucesso}</p>}
      </div>

      <h2 className="agendamentos-titulo">Meus agendamentos</h2>

      {agendamentos.length === 0 ? (
        <p className="sem-agendamentos">Nenhum agendamento ainda.</p>
      ) : (
        agendamentos.map((a) => (
          <div key={a.id} className="agendamento-card">
            <div className="agendamento-card-header">
              <p>{a.servico_nome}</p>
              <span className="badge" style={{ background: statusCor[a.status] + "22", color: statusCor[a.status] }}>
                {a.status}
              </span>
            </div>
            <p className="agendamento-card-data">{a.data} às {a.horario}</p>
            <p className="agendamento-card-preco">R${a.preco}</p>
            {a.status !== "cancelado" && (
              <button onClick={() => handleCancelar(a.id)} className="btn-cancelar-agendamento">
                Cancelar
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}