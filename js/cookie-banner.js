(() => {
  const STORAGE_KEY = 'webinbound_cookie_consent_v1';
  const STYLE_ID = 'webinbound-cookie-banner-style';
  const ROOT_ID = 'webinbound-cookie-root';

  function getPathPrefix() {
    return window.location.pathname.includes('/pages/') ? '' : 'pages/';
  }

  function getLinks() {
    const prefix = getPathPrefix();
    return {
      privacy: `${prefix}privacy.html`,
      cookie: `${prefix}cookie.html`
    };
  }

  function readConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeConsent(consent) {
    const payload = {
      ...consent,
      technical: true,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      return;
    }

    window.dispatchEvent(new CustomEvent('webinbound:cookie-consent-updated', { detail: payload }));
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .wb-cookie-root{
        position:fixed;
        right:24px;
        bottom:24px;
        z-index:1200;
        width:min(420px, calc(100vw - 28px));
        pointer-events:none;
      }
      .wb-cookie-card,
      .wb-cookie-panel{
        pointer-events:auto;
        border-radius:24px;
        border:1px solid rgba(13,20,18,.08);
        background:rgba(255,255,255,.9);
        box-shadow:0 22px 70px rgba(10,20,18,.18);
        backdrop-filter:blur(20px) saturate(1.2);
        color:#0d1412;
      }
      .wb-cookie-card{
        padding:22px;
        display:none;
        transform:translateY(18px);
        opacity:0;
        transition:opacity .35s ease, transform .35s ease;
      }
      .wb-cookie-card.is-visible{
        display:block;
      }
      .wb-cookie-card.is-entered{
        opacity:1;
        transform:translateY(0);
      }
      .wb-cookie-badge{
        display:inline-flex;
        align-items:center;
        gap:8px;
        margin-bottom:12px;
        padding:8px 12px;
        border-radius:999px;
        background:rgba(22,176,91,.1);
        color:#0d6b36;
        font-size:11px;
        font-weight:800;
        letter-spacing:.08em;
        text-transform:uppercase;
      }
      .wb-cookie-title{
        margin:0 0 10px;
        font-size:1.18rem;
        line-height:1.1;
        letter-spacing:-.03em;
      }
      .wb-cookie-text{
        margin:0 0 16px;
        color:#4f615a;
        font-size:.97rem;
        line-height:1.58;
      }
      .wb-cookie-links{
        display:flex;
        flex-wrap:wrap;
        gap:14px;
        margin-bottom:18px;
      }
      .wb-cookie-links a{
        color:#0d6b36;
        font-weight:700;
        font-size:.92rem;
      }
      .wb-cookie-actions{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
      }
      .wb-cookie-actions .wb-cookie-manage{
        grid-column:1 / -1;
      }
      .wb-cookie-btn{
        appearance:none;
        border:none;
        cursor:pointer;
        border-radius:16px;
        padding:13px 16px;
        font:inherit;
        font-weight:700;
        transition:transform .22s ease, box-shadow .22s ease, background .22s ease, border-color .22s ease, opacity .22s ease;
      }
      .wb-cookie-btn:hover{
        transform:translateY(-1px);
      }
      .wb-cookie-btn-primary{
        color:#fff;
        background:linear-gradient(135deg,#16b05b,#1ace66);
        box-shadow:0 14px 30px rgba(22,176,91,.24);
      }
      .wb-cookie-btn-secondary{
        color:#0d1412;
        background:#fff;
        border:1px solid rgba(13,20,18,.08);
      }
      .wb-cookie-btn-ghost{
        color:#0d1412;
        background:rgba(244,247,244,.9);
        border:1px solid rgba(13,20,18,.06);
      }
      .wb-cookie-panel{
        position:fixed;
        inset:0;
        margin:auto;
        width:min(560px, calc(100vw - 28px));
        max-height:min(760px, calc(100vh - 28px));
        padding:26px;
        display:none;
        overflow:auto;
        z-index:1250;
      }
      .wb-cookie-panel.is-visible{
        display:block;
        animation:wbCookiePanelIn .3s ease forwards;
      }
      .wb-cookie-backdrop{
        position:fixed;
        inset:0;
        background:rgba(7,15,12,.38);
        backdrop-filter:blur(6px);
        display:none;
        z-index:1240;
      }
      .wb-cookie-backdrop.is-visible{
        display:block;
      }
      .wb-cookie-panel-head{
        display:flex;
        justify-content:space-between;
        gap:18px;
        margin-bottom:18px;
      }
      .wb-cookie-panel-head h3{
        margin:0 0 8px;
        font-size:1.35rem;
        letter-spacing:-.04em;
      }
      .wb-cookie-panel-head p{
        margin:0;
        color:#5a6b65;
        line-height:1.55;
      }
      .wb-cookie-close{
        width:42px;
        height:42px;
        flex:0 0 42px;
        border-radius:14px;
        border:1px solid rgba(13,20,18,.08);
        background:#fff;
        cursor:pointer;
        font-size:1.2rem;
      }
      .wb-cookie-categories{
        display:grid;
        gap:12px;
        margin-bottom:18px;
      }
      .wb-cookie-category{
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        gap:16px;
        align-items:start;
        padding:18px;
        border-radius:20px;
        background:#fbfcfb;
        border:1px solid rgba(13,20,18,.06);
      }
      .wb-cookie-category h4{
        margin:0 0 6px;
        font-size:1rem;
        letter-spacing:-.02em;
      }
      .wb-cookie-category p{
        margin:0;
        color:#5a6b65;
        font-size:.94rem;
        line-height:1.52;
      }
      .wb-cookie-toggle{
        position:relative;
        width:52px;
        height:32px;
        border-radius:999px;
        border:none;
        background:#d8e1dc;
        cursor:pointer;
        transition:background .22s ease;
      }
      .wb-cookie-toggle::after{
        content:"";
        position:absolute;
        top:4px;
        left:4px;
        width:24px;
        height:24px;
        border-radius:50%;
        background:#fff;
        box-shadow:0 4px 12px rgba(0,0,0,.12);
        transition:transform .22s ease;
      }
      .wb-cookie-toggle[aria-checked="true"]{
        background:#16b05b;
      }
      .wb-cookie-toggle[aria-checked="true"]::after{
        transform:translateX(20px);
      }
      .wb-cookie-toggle[disabled]{
        cursor:not-allowed;
        opacity:.75;
        background:#b9d7c5;
      }
      .wb-cookie-panel-actions{
        display:grid;
        grid-template-columns:1fr 1fr 1fr;
        gap:10px;
      }
      .wb-cookie-launcher{
        position:fixed;
        left:20px;
        bottom:20px;
        z-index:1190;
        display:inline-flex;
        align-items:center;
        gap:10px;
        border:none;
        border-radius:999px;
        padding:12px 16px;
        font:inherit;
        font-weight:700;
        color:#0d1412;
        background:rgba(255,255,255,.88);
        border:1px solid rgba(13,20,18,.08);
        box-shadow:0 12px 30px rgba(10,20,18,.12);
        backdrop-filter:blur(16px);
        cursor:pointer;
        transition:transform .22s ease, opacity .22s ease;
      }
      .wb-cookie-launcher:hover{
        transform:translateY(-1px);
      }
      .wb-cookie-launcher[hidden]{
        display:none;
      }
      @keyframes wbCookiePanelIn{
        from{opacity:0; transform:translateY(18px) scale(.98)}
        to{opacity:1; transform:translateY(0) scale(1)}
      }
      @media (max-width: 820px){
        .wb-cookie-root{
          right:14px;
          left:14px;
          bottom:14px;
          width:auto;
        }
        .wb-cookie-actions,
        .wb-cookie-panel-actions{
          grid-template-columns:1fr;
        }
        .wb-cookie-panel{
          inset:auto 14px 14px;
          width:auto;
          max-height:min(78vh, 680px);
          border-radius:24px;
        }
        .wb-cookie-launcher{
          left:14px;
          bottom:14px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createBanner() {
    const links = getLinks();
    const root = document.createElement('div');
    root.id = ROOT_ID;
    root.innerHTML = `
      <div class="wb-cookie-backdrop" data-cookie-backdrop></div>
      <div class="wb-cookie-root" aria-live="polite">
        <section class="wb-cookie-card" data-cookie-banner role="dialog" aria-labelledby="wb-cookie-title" aria-describedby="wb-cookie-text">
          <div class="wb-cookie-badge">Privacy first</div>
          <h2 class="wb-cookie-title" id="wb-cookie-title">Utilizziamo i cookie</h2>
          <p class="wb-cookie-text" id="wb-cookie-text">
            Utilizziamo cookie tecnici e strumenti di analisi per migliorare l’esperienza di navigazione e comprendere come viene utilizzato il sito.
            Puoi accettare tutti i cookie oppure gestire le tue preferenze.
          </p>
          <div class="wb-cookie-links">
            <a href="${links.privacy}">Privacy Policy</a>
            <a href="${links.cookie}">Cookie Policy</a>
          </div>
          <div class="wb-cookie-actions">
            <button type="button" class="wb-cookie-btn wb-cookie-btn-primary" data-cookie-accept>Accetta tutti</button>
            <button type="button" class="wb-cookie-btn wb-cookie-btn-secondary" data-cookie-reject>Rifiuta</button>
            <button type="button" class="wb-cookie-btn wb-cookie-btn-ghost wb-cookie-manage" data-cookie-manage>Gestisci preferenze</button>
          </div>
        </section>
      </div>
      <section class="wb-cookie-panel" data-cookie-panel role="dialog" aria-modal="true" aria-labelledby="wb-cookie-panel-title">
        <div class="wb-cookie-panel-head">
          <div>
            <div class="wb-cookie-badge">Preferenze cookie</div>
            <h3 id="wb-cookie-panel-title">Gestisci le preferenze</h3>
            <p>Puoi scegliere quali categorie attivare. I cookie tecnici restano sempre attivi perché necessari al funzionamento del sito.</p>
          </div>
          <button type="button" class="wb-cookie-close" aria-label="Chiudi preferenze cookie" data-cookie-close>×</button>
        </div>
        <div class="wb-cookie-categories">
          <div class="wb-cookie-category">
            <div>
              <h4>Cookie tecnici</h4>
              <p>Sempre attivi. Necessari per il funzionamento del sito, la sicurezza e la gestione delle preferenze.</p>
            </div>
            <button type="button" class="wb-cookie-toggle" aria-checked="true" disabled title="Sempre attivi"></button>
          </div>
          <div class="wb-cookie-category">
            <div>
              <h4>Cookie analitici</h4>
              <p>Utilizzati per analizzare il traffico del sito, comprendere le interazioni e migliorare contenuti e conversioni.</p>
            </div>
            <button type="button" class="wb-cookie-toggle" role="switch" aria-checked="false" data-cookie-toggle="analytics"></button>
          </div>
          <div class="wb-cookie-category">
            <div>
              <h4>Cookie di terze parti</h4>
              <p>Utilizzati da servizi esterni come strumenti embedded, piattaforme di supporto o integrazioni di marketing.</p>
            </div>
            <button type="button" class="wb-cookie-toggle" role="switch" aria-checked="false" data-cookie-toggle="thirdParty"></button>
          </div>
        </div>
        <div class="wb-cookie-panel-actions">
          <button type="button" class="wb-cookie-btn wb-cookie-btn-secondary" data-cookie-panel-reject>Rifiuta</button>
          <button type="button" class="wb-cookie-btn wb-cookie-btn-ghost" data-cookie-panel-save>Salva preferenze</button>
          <button type="button" class="wb-cookie-btn wb-cookie-btn-primary" data-cookie-panel-accept>Accetta tutti</button>
        </div>
      </section>
      <button type="button" class="wb-cookie-launcher" data-cookie-launcher hidden>Preferenze cookie</button>
    `;

    document.body.appendChild(root);
    return root;
  }

  function initCookieBanner() {
    ensureStyles();
    const root = createBanner();

    const banner = root.querySelector('[data-cookie-banner]');
    const panel = root.querySelector('[data-cookie-panel]');
    const backdrop = root.querySelector('[data-cookie-backdrop]');
    const launcher = root.querySelector('[data-cookie-launcher]');
    const analyticsToggle = root.querySelector('[data-cookie-toggle="analytics"]');
    const thirdPartyToggle = root.querySelector('[data-cookie-toggle="thirdParty"]');

    const state = {
      analytics: false,
      thirdParty: false
    };

    function syncToggles() {
      analyticsToggle.setAttribute('aria-checked', String(state.analytics));
      thirdPartyToggle.setAttribute('aria-checked', String(state.thirdParty));
    }

    function showBanner() {
      banner.classList.add('is-visible');
      requestAnimationFrame(() => banner.classList.add('is-entered'));
    }

    function hideBanner() {
      banner.classList.remove('is-entered');
      setTimeout(() => banner.classList.remove('is-visible'), 260);
    }

    function openPanel() {
      panel.classList.add('is-visible');
      backdrop.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
    }

    function closePanel() {
      panel.classList.remove('is-visible');
      backdrop.classList.remove('is-visible');
      document.body.style.overflow = '';
    }

    function applyConsent(consent) {
      writeConsent(consent);
      hideBanner();
      closePanel();
      launcher.hidden = false;
    }

    function loadExistingConsent() {
      const consent = readConsent();
      if (!consent) {
        showBanner();
        return;
      }

      state.analytics = Boolean(consent.analytics);
      state.thirdParty = Boolean(consent.thirdParty);
      syncToggles();
      launcher.hidden = false;
    }

    analyticsToggle.addEventListener('click', () => {
      state.analytics = !state.analytics;
      syncToggles();
    });

    thirdPartyToggle.addEventListener('click', () => {
      state.thirdParty = !state.thirdParty;
      syncToggles();
    });

    root.querySelector('[data-cookie-accept]').addEventListener('click', () => {
      state.analytics = true;
      state.thirdParty = true;
      syncToggles();
      applyConsent({ analytics: true, thirdParty: true, mode: 'accept_all' });
    });

    root.querySelector('[data-cookie-reject]').addEventListener('click', () => {
      state.analytics = false;
      state.thirdParty = false;
      syncToggles();
      applyConsent({ analytics: false, thirdParty: false, mode: 'technical_only' });
    });

    root.querySelector('[data-cookie-manage]').addEventListener('click', openPanel);
    root.querySelector('[data-cookie-close]').addEventListener('click', closePanel);
    root.querySelector('[data-cookie-panel-reject]').addEventListener('click', () => {
      state.analytics = false;
      state.thirdParty = false;
      syncToggles();
      applyConsent({ analytics: false, thirdParty: false, mode: 'technical_only' });
    });
    root.querySelector('[data-cookie-panel-save]').addEventListener('click', () => {
      applyConsent({
        analytics: state.analytics,
        thirdParty: state.thirdParty,
        mode: 'custom'
      });
    });
    root.querySelector('[data-cookie-panel-accept]').addEventListener('click', () => {
      state.analytics = true;
      state.thirdParty = true;
      syncToggles();
      applyConsent({ analytics: true, thirdParty: true, mode: 'accept_all' });
    });

    launcher.addEventListener('click', openPanel);
    backdrop.addEventListener('click', closePanel);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closePanel();
      }
    });

    window.WebInboundCookieConsent = {
      get() {
        return readConsent();
      },
      openPreferences() {
        openPanel();
      },
      reset() {
        localStorage.removeItem(STORAGE_KEY);
        launcher.hidden = true;
        showBanner();
      }
    };

    loadExistingConsent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieBanner, { once: true });
  } else {
    initCookieBanner();
  }
})();
