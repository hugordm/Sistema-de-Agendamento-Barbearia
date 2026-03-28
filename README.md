# ✂ Barbearia Pirulito do Corte

Sistema de agendamento online para barbearia, desenvolvido com React no frontend e Node.js no backend.

🔗 **Demo:** [sistema-de-agendamento-barbearia-6kv9epi28.vercel.app](https://sistema-de-agendamento-barbearia-6kv9epi28.vercel.app)

---

## Funcionalidades

### Cliente
- Cadastro e login com autenticação JWT
- Agendamento de serviços com escolha de data e horário
- Horários já ocupados aparecem como indisponíveis
- Cancelamento de agendamentos
- Visualização dos próprios agendamentos com status em tempo real
- Recuperação de senha por email

### Barbeiro (Admin)
- Painel de controle com todos os agendamentos
- Filtro de agendamentos por data
- Confirmação e cancelamento de agendamentos
- Envio automático de email para o cliente ao confirmar ou cancelar
- Gerenciamento de serviços (criar, editar, deletar)
- Controle de disponibilidade da barbearia (abrir/fechar)
- Exclusão de agendamentos cancelados

---

## Tecnologias

### Frontend
- React 19 + Vite
- React Router DOM v7
- CSS modular por página
- Deploy no Vercel

### Backend
- Node.js + Express
- PostgreSQL (Neon)
- JWT para autenticação
- Bcrypt para criptografia de senhas
- Resend para envio de emails
- Deploy no Render

---

## Como rodar localmente

### Pré-requisitos
- Node.js instalado
- Conta no [Neon](https://neon.tech) para o banco de dados

### Backend

```bash
cd backend
npm install
```

Cria o arquivo `.env` na pasta backend:

```env
DATABASE_URL=sua_connection_string_do_neon
SECRET=sua_chave_secreta
RESEND_API_KEY=sua_chave_do_resend
```

Inicia o servidor:

```bash
node server.js
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Variáveis de ambiente

### Backend (.env)
| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string do PostgreSQL (Neon) |
| `SECRET` | Chave secreta para geração de tokens JWT |
| `RESEND_API_KEY` | Chave da API do Resend para envio de emails |

---

## Estrutura do projeto

```
Projeto FullStack/
├── backend/
│   ├── database.js      # Conexão e criação das tabelas
│   ├── server.js        # Rotas e lógica da API
│   ├── email.js         # Funções de envio de email
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/       # Telas da aplicação
    │   ├── components/  # Componentes reutilizáveis
    │   └── services/    # Comunicação com a API
    └── package.json
```

---

## Autor

Desenvolvido por **Hugo Melo**
