(() => {
  const STORAGE_KEY = "webinboundProject";
  const DRAFT_KEY = "webinboundAiDraft";
  const DEFAULT_PRICING_PATH = "../config/pricing.json";
  const CONTACTS_PATH = "contatti.html";

  const industryMatchers = [
    { id: "restaurant", patterns: ["ristor", "menu", "tavoli", "pizzeria", "trattoria"] },
    { id: "hotel", patterns: ["hotel", "b&b", "bnb", "camere", "booking", "ospital"] },
    { id: "construction", patterns: ["edile", "cantiere", "impresa", "ristruttur", "muratore"] },
    { id: "gym", patterns: ["palestra", "fitness", "trainer", "corsi", "allenamento"] },
    { id: "professional-studio", patterns: ["studio", "consulen", "avvocat", "commercial", "dentista", "notaio"] },
    { id: "local-shop", patterns: ["negozio", "retail", "store", "boutique", "vetrina"] },
    { id: "startup", patterns: ["startup", "pitch", "mvp", "investitori"] },
    { id: "tech-company", patterns: ["tech", "software", "saas", "applicazione", "piattaforma"] }
  ];

  const industryQuestions = {
    restaurant: [
      {
        id: "restaurant-menu",
        prompt: "Vuoi un menu digitale ben consultabile anche da telefono?",
        type: "choice",
        options: [
          { label: "Si, menu digitale", value: "menu", effect: { requiredFeatures: ["gallery"], projectType: "Sito per ristorante" } },
          { label: "No, non serve", value: "no-menu" }
        ]
      },
      {
        id: "restaurant-booking",
        prompt: "Vuoi integrare prenotazioni tavoli o una richiesta rapida?",
        type: "choice",
        options: [
          { label: "Prenotazioni tavoli", value: "booking", effect: { requiredFeatures: ["bookings", "contactForm"] } },
          { label: "Solo richiesta rapida", value: "lead", effect: { requiredFeatures: ["contactForm", "whatsapp"] } }
        ]
      }
    ],
    hotel: [
      {
        id: "hotel-booking",
        prompt: "Ti serve un booking diretto o una richiesta disponibilita?",
        type: "choice",
        options: [
          { label: "Booking diretto", value: "booking", effect: { requiredFeatures: ["bookings", "multilingual"], projectType: "Sito hotel / B&B" } },
          { label: "Richiesta disponibilita", value: "availability", effect: { requiredFeatures: ["contactForm", "gallery"] } }
        ]
      },
      {
        id: "hotel-multilingual",
        prompt: "Vuoi una struttura multilingua sin da subito?",
        type: "choice",
        options: [
          { label: "Si, multilingua", value: "yes", effect: { requiredFeatures: ["multilingual"] } },
          { label: "No, solo italiano", value: "no" }
        ]
      }
    ],
    construction: [
      {
        id: "construction-portfolio",
        prompt: "Vuoi mostrare portfolio lavori e gallery cantieri?",
        type: "choice",
        options: [
          { label: "Si, portfolio completo", value: "portfolio", effect: { requiredFeatures: ["portfolio", "gallery"], projectType: "Sito impresa edile" } },
          { label: "Solo casi principali", value: "essential", effect: { requiredFeatures: ["gallery"] } }
        ]
      },
      {
        id: "construction-leads",
        prompt: "Ti serve richiesta sopralluogo o un preventivatore iniziale?",
        type: "choice",
        options: [
          { label: "Richiesta sopralluogo", value: "survey", effect: { requiredFeatures: ["contactForm", "whatsapp"] } },
          { label: "Preventivatore iniziale", value: "quote-system", effect: { requiredFeatures: ["quoteSystem", "contactForm"] } }
        ]
      }
    ],
    gym: [
      {
        id: "gym-calendar",
        prompt: "Vuoi mostrare calendario corsi o pagina trainer?",
        type: "choice",
        options: [
          { label: "Corsi e trainer", value: "courses-trainers", effect: { requiredFeatures: ["gallery"], projectType: "Sito palestra / fitness" } },
          { label: "Solo presentazione palestra", value: "simple" }
        ]
      },
      {
        id: "gym-booking",
        prompt: "Ti serve prenotazione lezioni o richiesta prova?",
        type: "choice",
        options: [
          { label: "Prenotazione lezioni", value: "booking", effect: { requiredFeatures: ["bookings"] } },
          { label: "Richiesta prova", value: "trial", effect: { requiredFeatures: ["contactForm", "whatsapp"] } }
        ]
      }
    ],
    "professional-studio": [
      {
        id: "studio-booking",
        prompt: "Vuoi prenotazione consulenze o solo raccolta contatti?",
        type: "choice",
        options: [
          { label: "Prenotazione consulenze", value: "booking", effect: { requiredFeatures: ["bookings", "contactForm"], projectType: "Sito studio professionale" } },
          { label: "Solo raccolta contatti", value: "lead", effect: { requiredFeatures: ["contactForm", "whatsapp"] } }
        ]
      },
      {
        id: "studio-area",
        prompt: "Serve area clienti o caricamento documenti?",
        type: "choice",
        options: [
          { label: "Si, area clienti", value: "client-area", effect: { optionalFeatures: ["aiIntegration"] } },
          { label: "No, non serve", value: "none" }
        ]
      }
    ],
    "local-shop": [
      {
        id: "shop-catalog",
        prompt: "Ti serve una semplice vetrina o un catalogo con prodotti?",
        type: "choice",
        options: [
          { label: "Catalogo vetrina", value: "catalog", effect: { requiredFeatures: ["gallery"], projectType: "Sito negozio locale" } },
          { label: "Presentazione attivita", value: "presentation", effect: { requiredFeatures: ["maps", "whatsapp"] } }
        ]
      },
      {
        id: "shop-sales",
        prompt: "Vuoi attivare pagamenti o vendita online?",
        type: "choice",
        options: [
          { label: "Si, vendita online", value: "ecommerce", effect: { requiredFeatures: ["ecommerce"], optionalFeatures: ["analyticsSetup"] } },
          { label: "No, solo contatti", value: "lead", effect: { requiredFeatures: ["contactForm"] } }
        ]
      }
    ],
    startup: [
      {
        id: "startup-goal",
        prompt: "Ti serve una landing di conversione o un sito completo per presentare il progetto?",
        type: "choice",
        options: [
          { label: "Landing conversione", value: "landing", effect: { projectType: "Landing page startup", pagesEstimate: 3, requiredFeatures: ["contactForm", "analyticsSetup"] } },
          { label: "Sito completo", value: "site", effect: { projectType: "Sito corporate startup", pagesEstimate: 8, requiredFeatures: ["blog", "analyticsSetup"] } }
        ]
      },
      {
        id: "startup-demo",
        prompt: "Vuoi richiesta demo, sezione pricing o presentazione prodotto?",
        type: "choice",
        options: [
          { label: "Richiesta demo", value: "demo", effect: { requiredFeatures: ["contactForm"] } },
          { label: "Pricing e prodotto", value: "pricing-product", effect: { optionalFeatures: ["aiIntegration"] } }
        ]
      }
    ],
    "tech-company": [
      {
        id: "tech-layout",
        prompt: "Vuoi una landing di conversione o un sito corporate piu strutturato?",
        type: "choice",
        options: [
          { label: "Landing conversione", value: "landing", effect: { projectType: "Landing tech", pagesEstimate: 3, requiredFeatures: ["analyticsSetup", "contactForm"] } },
          { label: "Sito corporate", value: "corporate", effect: { projectType: "Sito corporate tech", pagesEstimate: 8, requiredFeatures: ["blog", "analyticsSetup"] } }
        ]
      },
      {
        id: "tech-demo",
        prompt: "Ti serve richiesta demo, pricing o presentazione prodotto?",
        type: "choice",
        options: [
          { label: "Richiesta demo", value: "demo", effect: { requiredFeatures: ["contactForm"] } },
          { label: "Pricing e prodotto", value: "pricing", effect: { optionalFeatures: ["aiIntegration"] } }
        ]
      }
    ],
    fallback: [
      {
        id: "generic-goal",
        prompt: "Qual e l'obiettivo principale del progetto?",
        type: "choice",
        options: [
          { label: "Generare contatti", value: "lead", effect: { projectGoal: "generare contatti", requiredFeatures: ["contactForm", "whatsapp"] } },
          { label: "Aumentare credibilita", value: "credibility", effect: { projectGoal: "aumentare credibilita online", requiredFeatures: ["gallery", "maps"] } }
        ]
      }
    ]
  };

  const genericQuestions = [
    {
      id: "pages-estimate",
      prompt: "Quanto deve essere strutturato il progetto?",
      type: "choice",
      options: [
        { label: "Essenziale", value: 3, effect: { pagesEstimate: 3 } },
        { label: "Intermedio", value: 5, effect: { pagesEstimate: 5 } },
        { label: "Strutturato", value: 8, effect: { pagesEstimate: 8 } },
        { label: "Avanzato", value: 10, effect: { pagesEstimate: 10 } }
      ]
    }
  ];

  function normalizeText(value) {
    return String(value || "").toLowerCase().trim();
  }

  function uniq(array) {
    return Array.from(new Set(array.filter(Boolean)));
  }

  function getBaseState() {
    return {
      initialDescription: "",
      detectedIndustry: "",
      projectType: "",
      pagesEstimate: 0,
      requiredFeatures: [],
      optionalFeatures: [],
      location: "",
      projectGoal: "",
      estimatedRange: "",
      aiSummary: "",
      readinessForQuote: false,
      answers: {},
      followUpQuestions: [],
      pricingConfig: null
    };
  }

  function detectIndustry(initialDescription) {
    const text = normalizeText(initialDescription);
    for (const matcher of industryMatchers) {
      if (matcher.patterns.some((pattern) => text.includes(pattern))) {
        return matcher.id;
      }
    }
    return "local-business";
  }

  function getFollowUpQuestions(industry, currentState) {
    const answeredIds = new Set(Object.keys(currentState.answers || {}));
    const industryKey = industryQuestions[industry] ? industry : "fallback";
    const pool = [...industryQuestions[industryKey], ...genericQuestions];

    return pool.filter((question) => {
      if (answeredIds.has(question.id)) return false;
      if (question.id === "pages-estimate" && currentState.pagesEstimate) return false;
      return true;
    }).slice(0, currentState.initialDescription ? 2 : 1);
  }

  function updateProjectState(currentState, answer) {
    const nextState = {
      ...currentState,
      answers: { ...(currentState.answers || {}) }
    };

    if (answer.initialDescription !== undefined) {
      nextState.initialDescription = answer.initialDescription.trim();
      nextState.detectedIndustry = detectIndustry(nextState.initialDescription);
      nextState.projectGoal = inferGoal(nextState.initialDescription) || nextState.projectGoal;
      nextState.projectType = inferProjectType(nextState.detectedIndustry, nextState.initialDescription) || nextState.projectType;
      nextState.pagesEstimate = inferPagesEstimate(nextState.initialDescription) || nextState.pagesEstimate;
      nextState.location = inferLocation(nextState.initialDescription) || nextState.location;
    }

    if (answer.questionId) {
      nextState.answers[answer.questionId] = answer.value;

      if (answer.effect?.projectType) nextState.projectType = answer.effect.projectType;
      if (answer.effect?.pagesEstimate) nextState.pagesEstimate = answer.effect.pagesEstimate;
      if (answer.effect?.projectGoal) nextState.projectGoal = answer.effect.projectGoal;
      if (answer.effect?.location) nextState.location = answer.effect.location;
      nextState.requiredFeatures = uniq([...(nextState.requiredFeatures || []), ...((answer.effect && answer.effect.requiredFeatures) || [])]);
      nextState.optionalFeatures = uniq([...(nextState.optionalFeatures || []), ...((answer.effect && answer.effect.optionalFeatures) || [])]);
    }

    nextState.readinessForQuote = isReadyForQuote(nextState);
    nextState.followUpQuestions = getFollowUpQuestions(nextState.detectedIndustry, nextState);
    return nextState;
  }

  function isReadyForQuote(projectState) {
    return Boolean(
      projectState.detectedIndustry &&
      projectState.projectType &&
      Number(projectState.pagesEstimate) > 0 &&
      Array.isArray(projectState.requiredFeatures) &&
      projectState.requiredFeatures.length >= 2 &&
      projectState.projectGoal
    );
  }

  async function loadPricingConfig(pricingPath = DEFAULT_PRICING_PATH) {
    const response = await fetch(pricingPath, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Impossibile caricare il listino del preventivatore.");
    }

    return response.json();
  }

  function suggestFeatures(industry, projectState, pricingConfig) {
    const industryConfig = (pricingConfig.industries || []).find((item) => item.id === industry);
    const recommended = industryConfig ? industryConfig.recommendedFeatureIds || [] : [];
    const requiredFeatures = uniq([...(projectState.requiredFeatures || []), ...recommended.slice(0, 3)]);
    const optionalFeatures = uniq([...(projectState.optionalFeatures || []), ...recommended.slice(3)]);

    return {
      requiredFeatures,
      optionalFeatures
    };
  }

  function pickPackage(projectState, pricingConfig) {
    const pages = Number(projectState.pagesEstimate || 0);

    if (projectState.detectedIndustry === "startup" || projectState.detectedIndustry === "tech-company" || pages >= 8) {
      return pricingConfig.packages.find((pkg) => pkg.id === "business") || pricingConfig.packages[0];
    }

    if (pages <= 3) {
      return pricingConfig.packages.find((pkg) => pkg.id === "starter") || pricingConfig.packages[0];
    }

    return pricingConfig.packages.find((pkg) => pkg.id === "professional") || pricingConfig.packages[0];
  }

  function getPagePrice(pagesEstimate, pricingConfig) {
    const pageOption = (pricingConfig.pagePricing?.types || []).find((item) => Number(item.pageCount) === Number(pagesEstimate));
    return pageOption ? Number(pageOption.price || 0) : 0;
  }

  function getFeatureLineItems(featureIds, pricingConfig) {
    return uniq(featureIds).map((featureId) => {
      const feature = (pricingConfig.features || []).find((item) => item.id === featureId);
      if (!feature) return null;
      return {
        id: feature.id,
        name: feature.name,
        price: Number(feature.price || 0)
      };
    }).filter(Boolean);
  }

  function roundForQuote(value, step) {
    const rounding = Number(step || 1);
    return Math.round(value / rounding) * rounding;
  }

  function calculateQuote(projectState, pricingConfig) {
    const selectedPackage = pickPackage(projectState, pricingConfig);
    const suggested = suggestFeatures(projectState.detectedIndustry, projectState, pricingConfig);
    const featureIds = uniq([...(suggested.requiredFeatures || []), ...(suggested.optionalFeatures || [])]);
    const featureLineItems = getFeatureLineItems(featureIds, pricingConfig);
    const pagesPrice = getPagePrice(projectState.pagesEstimate, pricingConfig);
    const featuresTotal = featureLineItems.reduce((sum, item) => sum + item.price, 0);
    const subtotal = Number(selectedPackage.basePrice || 0) + pagesPrice + featuresTotal;
    const roundTo = pricingConfig.quoteRules?.roundToNearest || 10;
    const minTotal = roundForQuote(subtotal, roundTo);
    const maxTotal = roundForQuote(subtotal * 1.18, roundTo);
    const estimatedRange = `${pricingConfig.meta.currencySymbol}${minTotal} - ${pricingConfig.meta.currencySymbol}${maxTotal}`;

    return {
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      pagesEstimate: projectState.pagesEstimate,
      requiredFeatureNames: featureLineItems.map((item) => item.name),
      lineItems: [
        { label: `Pacchetto ${selectedPackage.name}`, amount: Number(selectedPackage.basePrice || 0) },
        { label: `Struttura ${projectState.pagesEstimate} pagine`, amount: pagesPrice },
        ...featureLineItems.map((item) => ({ label: item.name, amount: item.price }))
      ],
      subtotal,
      estimatedRange,
      disclaimer: pricingConfig.quoteRules?.disclaimer || "",
      requiredFeatures: suggested.requiredFeatures,
      optionalFeatures: suggested.optionalFeatures
    };
  }

  function generateAISummary(projectState, quote) {
    const featureNames = quote.requiredFeatureNames;

    return [
      `Analisi progetto WebInbound`,
      `Settore individuato: ${humanizeIndustry(projectState.detectedIndustry)}.`,
      `Tipologia progetto: ${projectState.projectType}.`,
      `Obiettivo principale: ${projectState.projectGoal}.`,
      `Dimensione consigliata: circa ${projectState.pagesEstimate} pagine.`,
      `Funzionalita prioritarie: ${featureNames.join(", ")}.`,
      `Stima iniziale: ${quote.estimatedRange}.`
    ].join(" ");
  }

  function renderQuoteSummary(projectState, quote, aiSummary, root) {
    if (!root) return;

    const summaryCard = root.querySelector("[data-role='quote-summary']");
    const lineItems = quote.lineItems.map((item) => {
      return `<li><span>${item.label}</span><strong>${formatCurrency(item.amount)}</strong></li>`;
    }).join("");

    summaryCard.innerHTML = `
      <div class="wb-quote-kicker">Analisi completata</div>
      <h3>Riepilogo progetto</h3>
      <p class="wb-quote-intro">${aiSummary}</p>
      <div class="wb-quote-grid">
        <div class="wb-quote-block">
          <span>Settore</span>
          <strong>${humanizeIndustry(projectState.detectedIndustry)}</strong>
        </div>
        <div class="wb-quote-block">
          <span>Tipologia</span>
          <strong>${projectState.projectType}</strong>
        </div>
        <div class="wb-quote-block">
          <span>Pagine</span>
          <strong>${projectState.pagesEstimate}</strong>
        </div>
        <div class="wb-quote-block">
          <span>Stima iniziale</span>
          <strong>${quote.estimatedRange}</strong>
        </div>
      </div>
      <ul class="wb-quote-list">${lineItems}</ul>
      <p class="wb-quote-disclaimer">${quote.disclaimer}</p>
    `;

    summaryCard.hidden = false;
  }

  function saveLeadDraft(projectState, quote, aiSummary) {
    const draft = {
      source: "preventivatore-ai",
      mode: "Preventivatore intelligente",
      package: quote.packageName,
      industry: humanizeIndustry(projectState.detectedIndustry),
      projectType: projectState.projectType,
      pages: projectState.pagesEstimate,
      features: quote.requiredFeatureNames,
      optionalFeatures: quote.optionalFeatures,
      estimatedPrice: quote.estimatedRange,
      aiSummary,
      notes: projectState.initialDescription,
      detectedIndustry: projectState.detectedIndustry,
      pagesEstimate: projectState.pagesEstimate,
      requiredFeatures: quote.requiredFeatures,
      estimatedRange: quote.estimatedRange,
      initialDescription: projectState.initialDescription
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

    return draft;
  }

  function redirectToContacts(draft, contactsPath = CONTACTS_PATH) {
    const params = new URLSearchParams({
      source: "preventivatore-ai",
      detectedIndustry: draft.detectedIndustry || "",
      projectType: draft.projectType || "",
      pagesEstimate: String(draft.pagesEstimate || ""),
      requiredFeatures: Array.isArray(draft.requiredFeatures) ? draft.requiredFeatures.join(", ") : "",
      estimatedRange: draft.estimatedRange || "",
      aiSummary: draft.aiSummary || "",
      initialDescription: draft.initialDescription || ""
    });

    window.location.href = `${contactsPath}?${params.toString()}`;
  }

  function resetProjectFlow(root) {
    if (!root) return;
    root.dataset.ready = "false";
    const textarea = root.querySelector("[data-role='initial-description']");
    const questionDeck = root.querySelector("[data-role='question-deck']");
    const progress = root.querySelector("[data-role='progress']");
    const summaryCard = root.querySelector("[data-role='quote-summary']");
    const generateButton = root.querySelector("[data-role='generate-quote']");
    const contactButton = root.querySelector("[data-role='contact-cta']");

    if (textarea) textarea.value = "";
    if (questionDeck) questionDeck.innerHTML = "";
    if (progress) progress.style.width = "0%";
    if (summaryCard) {
      summaryCard.hidden = true;
      summaryCard.innerHTML = "";
    }
    if (generateButton) generateButton.disabled = true;
    if (contactButton) contactButton.hidden = true;
  }

  function inferGoal(description) {
    const text = normalizeText(description);
    if (text.includes("contatti") || text.includes("preventiv") || text.includes("lead")) {
      return "generare contatti";
    }
    if (text.includes("credibil")) {
      return "aumentare credibilita online";
    }
    if (text.includes("demo") || text.includes("prenot")) {
      return "ottenere richieste mirate";
    }
    return "migliorare presenza online e generare contatti";
  }

  function inferProjectType(industry, description) {
    const text = normalizeText(description);
    if (text.includes("landing")) return "Landing page";
    if (text.includes("ecommerce") || text.includes("shop")) return "Sito e-commerce";

    const map = {
      restaurant: "Sito per ristorante",
      hotel: "Sito hotel / B&B",
      construction: "Sito impresa edile",
      gym: "Sito palestra / fitness",
      "professional-studio": "Sito studio professionale",
      "local-shop": "Sito negozio locale",
      startup: "Sito corporate startup",
      "tech-company": "Sito corporate tech",
      "local-business": "Sito web professionale"
    };

    return map[industry] || "Sito web professionale";
  }

  function inferPagesEstimate(description) {
    const text = normalizeText(description);
    const match = text.match(/(\d+)\s*(pagine|pagine circa|page)/);
    if (match) return Number(match[1]);
    if (text.includes("landing") || text.includes("monopagina")) return 3;
    if (text.includes("ecommerce") || text.includes("hotel") || text.includes("startup") || text.includes("software")) return 8;
    return 0;
  }

  function inferLocation(description) {
    const text = normalizeText(description);
    const marker = ["roma", "milano", "torino", "napoli", "bologna", "venezia", "firenze"];
    return marker.find((city) => text.includes(city)) || "";
  }

  function humanizeIndustry(industry) {
    const labels = {
      restaurant: "Ristorante",
      hotel: "Hotel / B&B",
      construction: "Impresa edile",
      gym: "Palestra o fitness",
      "professional-studio": "Studio professionale",
      "local-shop": "Negozio locale",
      startup: "Startup",
      "tech-company": "Azienda tech",
      "local-business": "Azienda / attivita locale"
    };

    return labels[industry] || "Azienda / attivita locale";
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  class PreventivatoreAIApp {
    constructor(root) {
      this.root = root;
      this.state = getBaseState();
      this.quote = null;
      this.summary = "";
      this.pricingPath = root.dataset.pricingPath || DEFAULT_PRICING_PATH;
      this.contactsPath = root.dataset.contactsPath || CONTACTS_PATH;
    }

    async init() {
      this.cacheElements();
      this.bindEvents();
      this.state.pricingConfig = await loadPricingConfig(this.pricingPath);
      this.renderQuestions();
    }

    cacheElements() {
      this.textarea = this.root.querySelector("[data-role='initial-description']");
      this.startButton = this.root.querySelector("[data-role='start-analysis']");
      this.generateButton = this.root.querySelector("[data-role='generate-quote']");
      this.contactButton = this.root.querySelector("[data-role='contact-cta']");
      this.resetButton = this.root.querySelector("[data-role='reset-flow']");
      this.questionDeck = this.root.querySelector("[data-role='question-deck']");
      this.summaryCard = this.root.querySelector("[data-role='quote-summary']");
      this.progressBar = this.root.querySelector("[data-role='progress']");
      this.status = this.root.querySelector("[data-role='analysis-status']");
      this.insight = this.root.querySelector("[data-role='analysis-insight']");
    }

    bindEvents() {
      this.startButton?.addEventListener("click", () => this.handleInitialAnalysis());
      this.generateButton?.addEventListener("click", () => this.handleGenerateQuote());
      this.contactButton?.addEventListener("click", () => {
        const draft = saveLeadDraft(this.state, this.quote, this.summary);
        redirectToContacts(draft, this.contactsPath);
      });
      this.resetButton?.addEventListener("click", () => {
        this.state = getBaseState();
        this.state.pricingConfig = this.state.pricingConfig || null;
        this.quote = null;
        this.summary = "";
        resetProjectFlow(this.root);
        this.renderQuestions();
        this.setStatus("Pronto per una nuova analisi progetto.");
      });

      this.root.querySelectorAll(".wb-ai-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          if (this.textarea) {
            this.textarea.value = chip.textContent.trim();
            this.handleInitialAnalysis();
          }
        });
      });
    }

    handleInitialAnalysis() {
      const description = this.textarea?.value.trim() || "";
      if (!description) {
        this.setStatus("Inserisci una descrizione del progetto per avviare l'analisi.");
        return;
      }

      this.state = updateProjectState({ ...this.state, pricingConfig: this.state.pricingConfig }, { initialDescription: description });
      const suggested = suggestFeatures(this.state.detectedIndustry, this.state, this.state.pricingConfig);
      this.state.requiredFeatures = suggested.requiredFeatures;
      this.state.optionalFeatures = suggested.optionalFeatures;
      this.state.readinessForQuote = isReadyForQuote(this.state);
      this.renderQuestions();
      this.syncProgress();
      this.syncButtons();
      this.setStatus(`Settore individuato: ${humanizeIndustry(this.state.detectedIndustry)}.`);
      this.setInsight(`Il sistema ha preparato una configurazione iniziale orientata a ${this.state.projectGoal || "generare contatti e migliorare la credibilita online"}.`);
    }

    answerQuestion(question, option) {
      this.state = updateProjectState(this.state, {
        questionId: question.id,
        value: option.value,
        effect: option.effect || {}
      });
      const suggested = suggestFeatures(this.state.detectedIndustry, this.state, this.state.pricingConfig);
      this.state.requiredFeatures = suggested.requiredFeatures;
      this.state.optionalFeatures = suggested.optionalFeatures;
      this.state.readinessForQuote = isReadyForQuote(this.state);
      this.renderQuestions();
      this.syncProgress();
      this.syncButtons();
      this.setInsight("I dati raccolti sono stati aggiornati e la configurazione si sta consolidando.");
    }

    handleGenerateQuote() {
      if (!this.state.readinessForQuote) {
        this.setStatus("Servono ancora alcuni dati essenziali prima di generare il preventivo.");
        return;
      }

      this.quote = calculateQuote(this.state, this.state.pricingConfig);
      this.state.estimatedRange = this.quote.estimatedRange;
      this.summary = generateAISummary(this.state, this.quote);
      this.state.aiSummary = this.summary;
      renderQuoteSummary(this.state, this.quote, this.summary, this.root);
      this.contactButton.hidden = false;
      this.setStatus("Preventivo iniziale pronto. Puoi procedere con l'invio della richiesta.");
      this.setInsight("Il riepilogo finale e stato strutturato come una lettura progettuale premium, pronto per il passaggio alla pagina contatti.");
    }

    renderQuestions() {
      if (!this.questionDeck) return;
      const questions = this.state.followUpQuestions || [];

      if (!questions.length) {
        this.questionDeck.innerHTML = `
          <div class="wb-ai-empty">
            <strong>Dati essenziali quasi completi</strong>
            <p>Il sistema ha raccolto le informazioni necessarie per avvicinarsi alla stima iniziale.</p>
          </div>
        `;
        return;
      }

      this.questionDeck.innerHTML = questions.map((question) => {
        const options = question.options.map((option) => {
          return `<button type="button" class="wb-ai-option" data-question-id="${question.id}" data-option-value="${option.value}">${option.label}</button>`;
        }).join("");

        return `
          <article class="wb-ai-question-card" data-question-card="${question.id}">
            <div class="wb-ai-question-top">
              <span>Passaggio mirato</span>
              <strong>${question.prompt}</strong>
            </div>
            <div class="wb-ai-option-grid">${options}</div>
          </article>
        `;
      }).join("");

      this.questionDeck.querySelectorAll(".wb-ai-option").forEach((button) => {
        button.addEventListener("click", () => {
          const question = questions.find((item) => item.id === button.dataset.questionId);
          const option = question.options.find((item) => String(item.value) === String(button.dataset.optionValue));
          this.answerQuestion(question, option);
        });
      });
    }

    syncProgress() {
      if (!this.progressBar) return;
      const checks = [
        this.state.initialDescription,
        this.state.detectedIndustry,
        this.state.projectType,
        this.state.pagesEstimate,
        this.state.projectGoal,
        (this.state.requiredFeatures || []).length >= 2
      ];
      const done = checks.filter(Boolean).length;
      const progress = Math.round((done / checks.length) * 100);
      this.progressBar.style.width = `${progress}%`;
    }

    syncButtons() {
      if (this.generateButton) {
        this.generateButton.disabled = !this.state.readinessForQuote;
      }
    }

    setStatus(message) {
      if (this.status) this.status.textContent = message;
    }

    setInsight(message) {
      if (this.insight) this.insight.textContent = message;
    }
  }

  function initPreventivatoreAI(rootSelector = "[data-preventivatore-ai]") {
    document.querySelectorAll(rootSelector).forEach(async (root) => {
      const app = new PreventivatoreAIApp(root);
      try {
        await app.init();
      } catch (error) {
        const status = root.querySelector("[data-role='analysis-status']");
        if (status) {
          status.textContent = error instanceof Error ? error.message : "Errore durante il caricamento del preventivatore.";
        }
      }
    });
  }

  window.detectIndustry = detectIndustry;
  window.getFollowUpQuestions = getFollowUpQuestions;
  window.updateProjectState = updateProjectState;
  window.isReadyForQuote = isReadyForQuote;
  window.loadPricingConfig = loadPricingConfig;
  window.suggestFeatures = suggestFeatures;
  window.calculateQuote = calculateQuote;
  window.generateAISummary = generateAISummary;
  window.renderQuoteSummary = renderQuoteSummary;
  window.saveLeadDraft = saveLeadDraft;
  window.redirectToContacts = redirectToContacts;
  window.resetProjectFlow = resetProjectFlow;
  window.initPreventivatoreAI = initPreventivatoreAI;

  document.addEventListener("DOMContentLoaded", () => {
    initPreventivatoreAI();
  });
})();
