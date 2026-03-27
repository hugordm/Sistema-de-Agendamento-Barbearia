const API_URL = "https://sistema-de-agendamento-barbearia-1-oako.onrender.com";

function getToken() {
  return localStorage.getItem("token");
}

// AUTH
export async function cadastrar(nome, email, senha) {
  const res = await fetch(API_URL + "/cadastro", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha }),
  });
  return res.json();
}

export async function login(email, senha) {
  const res = await fetch(API_URL + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  return res.json();
}

// SERVIÇOS
export async function getServicos() {
  const res = await fetch(API_URL + "/servicos");
  return res.json();
}

// AGENDAMENTOS
export async function criarAgendamento(servico_id, data, horario) {
  const res = await fetch(API_URL + "/agendamentos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken(),
    },
    body: JSON.stringify({ servico_id, data, horario }),
  });
  return res.json();
}

export async function getMeusAgendamentos() {
  const res = await fetch(API_URL + "/agendamentos/meus", {
    headers: { Authorization: "Bearer " + getToken() },
  });
  return res.json();
}

export async function getTodosAgendamentos(data = "") {
  let url = API_URL + "/agendamentos";

  if (data) {
    url += "?data=" + data;
  }

  const res = await fetch(url, {
    headers: { Authorization: "Bearer " + getToken() },
  });

  return res.json();
}

export async function cancelarAgendamento(id) {
  const res = await fetch(API_URL + "/agendamentos/" + id + "/cancelar", {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + getToken(),
    },
  });
  return res.json();
}

// HORÁRIOS
export async function getHorariosOcupados(data) {
  const res = await fetch(
    API_URL + "/agendamentos/horarios-ocupados?data=" + data
  );
  return res.json();
}

// CONFIGURAÇÕES
export async function getConfiguracoes() {
  const res = await fetch(API_URL + "/configuracoes");
  return res.json();
}

export async function atualizarConfiguracoes(aberta) {
  const res = await fetch(API_URL + "/configuracoes", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken(),
    },
    body: JSON.stringify({ aberta }),
  });
  return res.json();
}

// ADMIN - DELETAR
export async function deletarAgendamento(id) {
  const res = await fetch(API_URL + "/agendamentos/" + id, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + getToken(),
    },
  });
  return res.json();
}