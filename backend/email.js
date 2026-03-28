const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function enviarEmailConfirmacao(emailCliente, nomeCliente, servico, data, horario) {
  await resend.emails.send({
    from: "Barbearia Pirulito do Corte <onboarding@resend.dev>",
    to: emailCliente,
    subject: "Agendamento confirmado!",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #C9A84C;">Barbearia Pirulito do Corte</h2>
        <p>Olá, <strong>${nomeCliente}</strong>!</p>
        <p>Seu agendamento foi <strong style="color: #5ec97a;">confirmado</strong>.</p>
        <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p><strong>Serviço:</strong> ${servico}</p>
          <p><strong>Data:</strong> ${data}</p>
          <p><strong>Horário:</strong> ${horario}</p>
        </div>
        <p>Te esperamos!</p>
      </div>
    `,
  });
}

async function enviarEmailCancelamento(emailCliente, nomeCliente, servico, data, horario) {
  await resend.emails.send({
    from: "Barbearia Pirulito do Corte <onboarding@resend.dev>",
    to: emailCliente,
    subject: "Agendamento cancelado",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #C9A84C;">Barbearia Pirulito do Corte</h2>
        <p>Olá, <strong>${nomeCliente}</strong>!</p>
        <p>Infelizmente seu agendamento foi <strong style="color: #e05555;">cancelado</strong>.</p>
        <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p><strong>Serviço:</strong> ${servico}</p>
          <p><strong>Data:</strong> ${data}</p>
          <p><strong>Horário:</strong> ${horario}</p>
        </div>
        <p>Entre em contato para reagendar.</p>
      </div>
    `,
  });
}

async function enviarEmailRecuperacao(emailCliente, link) {
  await resend.emails.send({
    from: "Barbearia Pirulito do Corte <onboarding@resend.dev>",
    to: emailCliente,
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
}

module.exports = { enviarEmailConfirmacao, enviarEmailCancelamento, enviarEmailRecuperacao };