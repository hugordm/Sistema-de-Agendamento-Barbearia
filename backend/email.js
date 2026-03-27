const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "barbeariapirulitodocorte@gmail.com",
    pass: "xcqtdrxpetqokoli",
  },
});

async function enviarEmailConfirmacao(emailCliente, nomeCliente, servico, data, horario) {
  await transporter.sendMail({
    from: '"Barbearia Pirulito do Corte" <barbeariapirulitodocorte@gmail.com>',
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
  await transporter.sendMail({
    from: '"Barbearia Pirulito do Corte" <barbeariapirulitodocorte@gmail.com>',
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

module.exports = { enviarEmailConfirmacao, enviarEmailCancelamento, transporter};