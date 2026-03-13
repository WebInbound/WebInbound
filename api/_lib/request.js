"use strict";

function json(res, statusCode, payload) {
  res.status(statusCode).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function sanitizeText(value, maxLength = 250) {
  const normalized = typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";

  return normalized
    .replace(/<[^>]*>/g, "")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeTextarea(value, maxLength = 4000) {
  const normalized = typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";

  return normalized
    .replace(/<[^>]*>/g, "")
    .replace(/\r\n|\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

function sanitizeEmail(value) {
  return sanitizeText(value, 320);
}

function sanitizeUrl(value) {
  const normalized = sanitizeText(value, 2000);
  if (!normalized) return "";

  try {
    const url = new URL(normalized);
    return url.toString();
  } catch {
    return "";
  }
}

function normalizeArray(value) {
  const items = Array.isArray(value) ? value : [value];
  return [...new Set(items.map((item) => sanitizeText(item)).filter(Boolean))];
}

function formatDateTime(date = new Date()) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Rome"
  }).format(date);
}

function collectPayload(input = {}) {
  return {
    site_name: process.env.SITE_NAME || "WebInbound",
    first_name: sanitizeText(input.first_name),
    last_name: sanitizeText(input.last_name),
    email: sanitizeEmail(input.email),
    phone: sanitizeText(input.phone),
    company: sanitizeText(input.company),
    industry: sanitizeText(input.industry),
    city: sanitizeText(input.city),
    project_type: sanitizeText(input.project_type),
    selected_package: sanitizeText(input.selected_package),
    page_count: sanitizeText(input.page_count),
    selected_features: normalizeArray(input.selected_features),
    estimated_price: sanitizeText(input.estimated_price),
    estimated_timeline: sanitizeText(input.estimated_timeline),
    selected_mode: sanitizeText(input.selected_mode),
    quote_summary: sanitizeTextarea(input.quote_summary),
    ai_prompt: sanitizeTextarea(input.ai_prompt),
    ai_estimate: sanitizeText(input.ai_estimate),
    final_message: sanitizeTextarea(input.final_message),
    privacy_consent: Boolean(input.privacy_consent),
    redirect_url: sanitizeUrl(input.redirect_url),
    submitted_at: formatDateTime()
  };
}

function validatePayload(payload) {
  if (!payload.first_name) {
    throw new Error("Inserisci il nome.");
  }

  if (!payload.email && !payload.phone) {
    throw new Error("Inserisci almeno un recapito: email oppure telefono.");
  }

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    throw new Error("Inserisci un indirizzo email valido.");
  }

  if (!payload.privacy_consent) {
    throw new Error("Devi accettare la privacy policy per inviare la richiesta.");
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sectionRows(fields) {
  return Object.entries(fields)
    .filter(([, value]) => value !== null && value !== "" && (!Array.isArray(value) || value.length))
    .map(([label, value]) => {
      const displayValue = Array.isArray(value)
        ? value.map((item) => escapeHtml(item)).join(", ")
        : escapeHtml(value).replace(/\n/g, "<br>");

      return `<tr><td style="padding:0 0 12px;width:220px;vertical-align:top;color:#5b6b64;font-size:14px;font-weight:700;">${escapeHtml(label)}</td><td style="padding:0 0 12px;color:#13221c;font-size:14px;line-height:1.6;">${displayValue}</td></tr>`;
    })
    .join("");
}

function renderSection(title, fields) {
  const rows = sectionRows(fields);
  if (!rows) return "";

  return `<section style="margin:0 0 22px;padding:24px;background:#f7faf8;border:1px solid #dfe8e2;border-radius:18px;"><h2 style="margin:0 0 18px;font-size:18px;line-height:1.2;color:#10211a;">${escapeHtml(title)}</h2><table role="presentation" style="width:100%;border-collapse:collapse;">${rows}</table></section>`;
}

function buildRequestEmailHtml(payload) {
  const customerSection = renderSection("Dati cliente", {
    Nome: payload.first_name,
    Cognome: payload.last_name,
    Email: payload.email,
    Telefono: payload.phone,
    Citta: payload.city
  });

  const businessSection = renderSection("Dati attività", {
    "Azienda / attività": payload.company,
    Settore: payload.industry
  });

  const projectSection = renderSection("Dati progetto", {
    "Modalità scelta": payload.selected_mode,
    "Tipo progetto": payload.project_type,
    "Pacchetto selezionato": payload.selected_package,
    "Numero pagine": payload.page_count,
    "Funzionalità selezionate": payload.selected_features,
    "Prompt AI": payload.ai_prompt,
    "Stima AI": payload.ai_estimate
  });

  const quoteSection = renderSection("Riepilogo preventivo", {
    "Stima prezzo": payload.estimated_price,
    "Tempi stimati": payload.estimated_timeline,
    "Riepilogo configurazione": payload.quote_summary
  });

  const messageSection = renderSection("Messaggio finale", {
    "Messaggio del cliente": payload.final_message
  });

  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Nuova richiesta</title></head><body style="margin:0;padding:32px 16px;background:#eef4f0;font-family:Arial,Helvetica,sans-serif;color:#13221c;"><div style="max-width:760px;margin:0 auto;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 18px 60px rgba(16,33,26,0.08);"><div style="padding:34px 32px;background:linear-gradient(135deg,#0f1f19 0%,#163328 55%,#1da35b 100%);color:#ffffff;"><div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.82;font-weight:700;">WebInbound</div><h1 style="margin:12px 0 10px;font-size:30px;line-height:1.1;">Nuova richiesta dal sito ${escapeHtml(payload.site_name)}</h1><p style="margin:0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.86);">È arrivata una nuova richiesta contatto / preventivo.</p></div><div style="padding:32px;">${customerSection}${businessSection}${projectSection}${quoteSection}${messageSection}<section style="padding:20px 24px;background:#10211a;border-radius:18px;color:#ffffff;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:0.12em;opacity:0.75;margin-bottom:8px;">Dettagli invio</div><p style="margin:0;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.9);">Data e ora invio: <strong>${escapeHtml(payload.submitted_at)}</strong></p></section></div></div></body></html>`;
}

function buildRequestEmailText(payload) {
  return [
    "Nuova richiesta dal sito WebInbound",
    "===================================",
    "",
    `Nome: ${payload.first_name || "-"}`,
    `Cognome: ${payload.last_name || "-"}`,
    `Email: ${payload.email || "-"}`,
    `Telefono: ${payload.phone || "-"}`,
    `Città: ${payload.city || "-"}`,
    `Azienda / attività: ${payload.company || "-"}`,
    `Settore: ${payload.industry || "-"}`,
    `Modalità scelta: ${payload.selected_mode || "-"}`,
    `Tipo progetto: ${payload.project_type || "-"}`,
    `Pacchetto selezionato: ${payload.selected_package || "-"}`,
    `Numero pagine: ${payload.page_count || "-"}`,
    `Funzionalità selezionate: ${payload.selected_features.join(", ") || "-"}`,
    `Prompt AI: ${payload.ai_prompt || "-"}`,
    `Stima AI: ${payload.ai_estimate || "-"}`,
    `Stima prezzo: ${payload.estimated_price || "-"}`,
    `Tempi stimati: ${payload.estimated_timeline || "-"}`,
    `Riepilogo configurazione: ${payload.quote_summary || "-"}`,
    "",
    "Messaggio finale:",
    payload.final_message || "-",
    "",
    `Data e ora invio: ${payload.submitted_at || "-"}`
  ].join("\n");
}

function summaryCard(label, value) {
  return `<div style="margin:0 0 12px;padding:14px 14px 13px;background:#f3faf6;border:1px solid #d8ebde;border-radius:16px;"><div style="font-size:12px;line-height:1.3;text-transform:uppercase;letter-spacing:0.08em;color:#547464;font-weight:700;margin-bottom:6px;">${escapeHtml(label)}</div><div style="font-size:15px;line-height:1.65;color:#13221c;font-weight:600;word-break:break-word;">${escapeHtml(value).replace(/\n/g, "<br>")}</div></div>`;
}

function buildCustomerConfirmationEmailHtml(payload) {
  const cards = [
    summaryCard("Pacchetto", payload.selected_package || "Configurazione personalizzata"),
    summaryCard("Numero pagine", payload.page_count || "Da definire"),
    summaryCard("Investimento indicativo", payload.estimated_price || "In definizione"),
    summaryCard("Tempi stimati", payload.estimated_timeline || "Da confermare"),
    summaryCard("Dettagli richiesta", payload.quote_summary || "Ricevuta correttamente.")
  ].join("");

  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Conferma ricezione richiesta</title></head><body style="margin:0;padding:24px 12px;background:#eef4f0;font-family:Arial,Helvetica,sans-serif;color:#13221c;"><div style="max-width:760px;margin:0 auto;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 18px 60px rgba(16,33,26,0.08);"><div style="padding:30px 22px;background:#f2fbf5;color:#173f2d;border-bottom:1px solid #d8ebde;"><div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#2f7d57;font-weight:700;">WebInbound</div><h1 style="margin:12px 0 10px;font-size:28px;line-height:1.1;color:#173f2d;">Richiesta inviata correttamente</h1><p style="margin:0;font-size:15px;line-height:1.7;color:#456457;">Ciao ${escapeHtml(payload.first_name || "Cliente")}, abbiamo ricevuto la tua richiesta e ti ricontatteremo il prima possibile.</p></div><div style="padding:24px 18px 28px;"><section style="margin:0 0 18px;padding:20px 16px;background:#ffffff;border:1px solid #dfe8e2;border-radius:20px;"><h2 style="margin:0 0 16px;font-size:20px;line-height:1.2;color:#10211a;">Riepilogo della tua richiesta</h2><div style="font-size:14px;line-height:1.6;color:#4a5c54;margin-bottom:14px;">Ti confermiamo che la tua richiesta è stata registrata correttamente nei sistemi WebInbound.</div>${cards}</section><section style="padding:18px 16px;background:#1e5d3f;border-radius:20px;color:#ffffff;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.78);margin-bottom:8px;">Conferma ricezione</div><p style="margin:0;font-size:14px;line-height:1.7;color:#ffffff;">Richiesta registrata il <strong>${escapeHtml(payload.submitted_at)}</strong></p></section></div></div></body></html>`;
}

function buildCustomerConfirmationEmailText(payload) {
  return [
    "Richiesta inviata correttamente",
    "",
    "Abbiamo ricevuto la tua richiesta e ti ricontatteremo il prima possibile.",
    "",
    `Pacchetto: ${payload.selected_package || "-"}`,
    `Numero pagine: ${payload.page_count || "-"}`,
    `Investimento indicativo: ${payload.estimated_price || "-"}`,
    `Tempi stimati: ${payload.estimated_timeline || "-"}`,
    `Dettagli: ${payload.quote_summary || "-"}`,
    "",
    `Richiesta registrata il ${payload.submitted_at || "-"}`
  ].join("\n");
}

module.exports = {
  buildCustomerConfirmationEmailHtml,
  buildCustomerConfirmationEmailText,
  buildRequestEmailHtml,
  buildRequestEmailText,
  collectPayload,
  json,
  validatePayload
};
