"use strict";

const allowedFeatureIds = [
  "seoAdvanced",
  "aiIntegration",
  "analyticsSetup",
  "blog",
  "ecommerce",
  "bookings",
  "maps",
  "social",
  "contactForm",
  "whatsapp",
  "gallery",
  "portfolio",
  "multilingual",
  "commercePolicy",
  "hosting",
  "domain",
  "quoteSystem"
];

function json(res, statusCode, payload) {
  res.status(statusCode).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function euro(amount) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(amount);
}

function buildEstimate(packageName, pagesEstimate, featureIds) {
  const packagePrices = {
    Starter: 169,
    Professional: 429,
    Business: 899
  };

  const pagePrices = {
    1: 0,
    2: 150,
    3: 300,
    4: 450,
    5: 600,
    6: 750,
    7: 900,
    8: 1050,
    10: 1350,
    12: 1650,
    14: 1950
  };

  const featurePrices = {
    seoAdvanced: 80,
    aiIntegration: 250,
    analyticsSetup: 150,
    blog: 70,
    ecommerce: 250,
    bookings: 120,
    maps: 35,
    social: 25,
    contactForm: 60,
    whatsapp: 25,
    gallery: 55,
    portfolio: 85,
    multilingual: 140,
    commercePolicy: 250,
    hosting: 90,
    domain: 20,
    quoteSystem: 400
  };

  const nearestPageKey = Object.keys(pagePrices).reduce((carry, key) => {
    if (carry === null) return Number(key);
    return Math.abs(pagesEstimate - Number(key)) < Math.abs(pagesEstimate - carry) ? Number(key) : carry;
  }, null);

  let total = packagePrices[packageName] || packagePrices.Professional;
  total += pagePrices[nearestPageKey] || 0;
  featureIds.forEach((featureId) => {
    total += featurePrices[featureId] || 0;
  });

  return `Da ${euro(total)}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { success: false, message: "Metodo non consentito." });
  }

  const apiKey = process.env.OPENAI_API_KEY || "";
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKey || apiKey === "OPENAI_API_KEY_HERE") {
    return json(res, 503, { success: false, message: "Chiave OpenAI non configurata." });
  }

  const body = req.body || {};
  const description = String(body.initialDescription || "").trim();
  const conversation = Array.isArray(body.conversation) ? body.conversation : [];

  if (!description) {
    return json(res, 422, { success: false, message: "Inserisci una descrizione del progetto." });
  }

  const systemPrompt = [
    "Tu sei il Preventivatore intelligente WebInbound.",
    "Agisci come consulente digitale premium, analista progetto e guida professionale.",
    "Parla in italiano, in modo chiaro, sintetico e rassicurante.",
    "Obiettivo: leggere la descrizione progetto, capire il settore, fare solo le domande utili, fermarti quando ci sono abbastanza dati, non inventare prezzi, portare l'utente verso Genera preventivo.",
    "Settori da riconoscere: ristorante, hotel o B&B, impresa edile, palestra o fitness, studio professionale, negozio locale, startup, azienda tech.",
    "Se non è chiaro usa attività locale.",
    "Regole: massimo 2 domande mancanti, niente messaggi lunghi, se hai dati sufficienti imposta hasEnoughData=true.",
    "Dati sufficienti quando hai: settore, tipo sito, 2 funzionalità principali, dimensione indicativa.",
    "Pacchetti consentiti: Starter, Professional, Business.",
    `Feature ids consentite: ${allowedFeatureIds.join(", ")}.`,
    "Restituisci solo JSON valido conforme allo schema richiesto."
  ].join("\n");

  const messages = [{ role: "system", content: systemPrompt }];
  for (const message of conversation) {
    if (!message || typeof message !== "object") continue;
    const role = String(message.role || "");
    const content = String(message.content || "").trim();
    if (!content || !["user", "assistant"].includes(role)) continue;
    messages.push({ role, content });
  }
  if (messages.length === 1) {
    messages.push({ role: "user", content: description });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "webinbound_project_analysis",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                businessType: { type: "string" },
                siteType: { type: "string" },
                objective: { type: "string" },
                recommendedPackage: { type: "string", enum: ["Starter", "Professional", "Business"] },
                pagesEstimate: { type: "integer" },
                featureIds: { type: "array", items: { type: "string", enum: allowedFeatureIds } },
                missingQuestions: { type: "array", items: { type: "string" } },
                hasEnoughData: { type: "boolean" },
                summary: { type: "string" },
                replyPrimary: { type: "string" },
                replyFollowup: { type: "string" }
              },
              required: [
                "businessType",
                "siteType",
                "objective",
                "recommendedPackage",
                "pagesEstimate",
                "featureIds",
                "missingQuestions",
                "hasEnoughData",
                "summary",
                "replyPrimary",
                "replyFollowup"
              ]
            }
          }
        }
      })
    });

    const responseData = await response.json();
    if (!response.ok || !responseData || responseData.error) {
      const rawMessage = String(responseData?.error?.message || "").toLowerCase();
      let message = "Analisi AI non disponibile in questo momento.";
      if (rawMessage.includes("quota") || rawMessage.includes("billing")) {
        message = "La connessione OpenAI è attiva, ma il progetto API non ha quota disponibile.";
      } else if (rawMessage.includes("authentication") || rawMessage.includes("api key")) {
        message = "La chiave OpenAI configurata non risulta valida.";
      }
      return json(res, 502, { success: false, message });
    }

    const content = responseData?.choices?.[0]?.message?.content || "";
    const analysis = JSON.parse(content);
    const featureIds = [...new Set((analysis.featureIds || []).map(String).filter((id) => allowedFeatureIds.includes(id)))];
    const recommendedPackage = String(analysis.recommendedPackage || "Professional");
    const pagesEstimate = Math.max(1, Number(analysis.pagesEstimate || 5));
    const estimateRange = buildEstimate(recommendedPackage, pagesEstimate, featureIds);

    return json(res, 200, {
      success: true,
      mode: "openai",
      analysis: {
        businessType: String(analysis.businessType || "attività locale").trim(),
        siteType: String(analysis.siteType || "sito web professionale").trim(),
        objective: String(analysis.objective || "generare contatti e aumentare credibilità").trim(),
        recommendedPackage,
        pagesEstimate,
        featureIds,
        missingQuestions: (analysis.missingQuestions || []).map(String).filter(Boolean),
        hasEnoughData: Boolean(analysis.hasEnoughData),
        summary: String(analysis.summary || "").trim(),
        replyPrimary: String(analysis.replyPrimary || "").trim(),
        replyFollowup: String(analysis.replyFollowup || "").trim(),
        estimateRange
      }
    });
  } catch {
    return json(res, 502, { success: false, message: "Connessione al motore AI non riuscita." });
  }
};
