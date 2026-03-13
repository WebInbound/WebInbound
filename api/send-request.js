"use strict";

const nodemailer = require("nodemailer");
const {
  buildCustomerConfirmationEmailHtml,
  buildCustomerConfirmationEmailText,
  buildRequestEmailHtml,
  buildRequestEmailText,
  collectPayload,
  json,
  validatePayload
} = require("./_lib/request");

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variabile ambiente mancante: ${name}`);
  }
  return value;
}

function createTransport() {
  return nodemailer.createTransport({
    host: getRequiredEnv("SMTP_HOST"),
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_ENCRYPTION || "ssl").toLowerCase() === "ssl",
    auth: {
      user: getRequiredEnv("SMTP_USERNAME"),
      pass: getRequiredEnv("SMTP_PASSWORD")
    }
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { success: false, message: "Metodo non consentito." });
  }

  try {
    const payload = collectPayload(req.body || {});
    validatePayload(payload);

    const transport = createTransport();
    const siteName = process.env.SITE_NAME || "WebInbound";
    const fromEmail = process.env.FROM_EMAIL || getRequiredEnv("SMTP_USERNAME");
    const fromName = process.env.FROM_NAME || siteName;
    const recipientEmail = process.env.RECIPIENT_EMAIL || fromEmail;

    await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: recipientEmail,
      replyTo: payload.email || undefined,
      subject: process.env.REQUEST_SUBJECT || "Richiesta dal sito",
      html: buildRequestEmailHtml(payload),
      text: buildRequestEmailText(payload)
    });

    if (payload.email) {
      await transport.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: payload.email,
        subject: "Conferma ricezione richiesta - WebInbound",
        html: buildCustomerConfirmationEmailHtml(payload),
        text: buildCustomerConfirmationEmailText(payload)
      });
    }

    return json(res, 200, {
      success: true,
      message: "Richiesta inviata correttamente. Ti ricontatteremo al più presto."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Si è verificato un problema durante l'invio.";
    const statusCode = /Inserisci|Devi accettare/.test(message) ? 422 : 500;

    return json(res, statusCode, {
      success: false,
      message: statusCode === 500 ? "Si è verificato un problema durante l'invio. Riprova tra pochi minuti." : message
    });
  }
};
