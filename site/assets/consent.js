/* webtitan.cz – souhlas s cookies: nahrávání návštěv v PostHogu a měření konverzí pro Sklik (měřicí kód Seznamu, SEM)
 * a Google Ads.
 *
 * Dokud v CONFIG není nic zapnuté (replay ani žádné ID), nedělá nic: žádná lišta, nic se nenačítá.
 * Jinak se ukáže lišta „Povolit / Jen nezbytné“ a kódy Seznamu a Googlu se načtou AŽ po souhlasu – bez něj neodchází
 * nic. Nahrávání návštěv zapíná assets/analytics.js podle window.wtConsent a události „wt:consent“.
 * Volba platí rok, změnit jde přes „Nastavení cookies“ v patičce.
 *
 * Formuláře po úspěšném odeslání volají window.wtConversion("lead" | "check"):
 *   lead  = poptávka, žádost o hovor / zavolání,  check = bezplatná kontrola webu / posouzení procesu.
 * Hodnoty jsou odhad, kolik vám taková poptávka průměrně přinese – podle nich se reklama učí, kam posílat peníze.
 */
(() => {
  "use strict";

  const CONFIG = {
    // PostHog session replay – nahrávání průchodu webem (assets/analytics.js), jen se souhlasem
    replay: true,
    // Sklik → Nástroje → Měřicí kód Seznamu (SEM) → ID, např. "123456"
    semId: "",
    // Google Ads → Cíle → Konverze: ID účtu "AW-123456789" a štítky konverzí ("AW-123456789/AbC-dEfGhI")
    gadsId: "AW-966280527",
    gadsLead: "",
    gadsCheck: "", // prázdné = použije se gadsLead
    value: { lead: 1000, check: 300 } // Kč
  };

  const KEY = "wt7-consent";
  // 2 = souhlas zahrnuje i nahrávání návštěv. Starší uložená volba (jen reklama) neplatí a lišta se zeptá znovu.
  const VERSION = 2;
  const YEAR = 365 * 864e5;
  const enabled = !!(CONFIG.replay || CONFIG.semId || CONFIG.gadsId);
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  let granted = false;
  let semReady = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Až po souhlasu: nahrávání v PostHogu, kód Seznamu (SEM) a Google tag
  function startTracking() {
    if (granted) return;
    granted = true;
    if (CONFIG.replay) {
      window.wtConsent = true;
      window.dispatchEvent(new CustomEvent("wt:consent"));
    }
    const all = { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", functionality_storage: "granted", analytics_storage: "granted" };
    if (CONFIG.semId) {
      semReady = loadScript("https://l.seznam.cz/sul.js?id=" + encodeURIComponent(CONFIG.semId)).then(() => {
        if (typeof window.SEM !== "function") throw new Error("SEM missing");
        window.SEM("updateConsent", { consent_mode: all });
        window.SEM("track", "PageView");
      }).catch(() => { semReady = null; });
    }
    if (CONFIG.gadsId) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag("consent", "default", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "denied" });
      window.gtag("js", new Date());
      window.gtag("config", CONFIG.gadsId);
      loadScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CONFIG.gadsId)).catch(() => {});
    }
  }

  // Konverze po odeslaném formuláři – jen se souhlasem (bez něj se kódy vůbec nenačetly)
  window.wtConversion = function (kind) {
    if (!enabled || !granted) return;
    const value = CONFIG.value[kind] ?? CONFIG.value.lead;
    if (semReady) semReady.then(() => window.SEM("track", "Lead", { currency: "CZK", value })).catch(() => {});
    const sendTo = kind === "check" ? (CONFIG.gadsCheck || CONFIG.gadsLead) : CONFIG.gadsLead;
    if (CONFIG.gadsId && sendTo && window.gtag) window.gtag("event", "conversion", { send_to: sendTo, value, currency: "CZK" });
  };

  if (!enabled) return;

  // ---------- lišta ----------
  const css = `
  .ck { position: fixed; left: 16px; bottom: 16px; z-index: 90; width: min(440px, calc(100% - 32px)); padding: 20px 20px 18px;
    border-radius: 22px; background: #faf6ef; color: #1b342c; border: 1px solid #e0d5c3;
    box-shadow: 0 2px 4px rgba(31, 61, 52, .05), 0 30px 60px -24px rgba(31, 61, 52, .45); font: 15px/1.5 Manrope, "Manrope Fallback", system-ui, sans-serif; }
  .ck[hidden] { display: none; }
  .ck b { display: block; font-size: 16px; font-weight: 800; margin-bottom: 4px; }
  .ck p { margin: 0 0 14px; color: #4d5a52; }
  .ck p a { color: #1f3d34; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
  .ck-btns { display: flex; gap: 10px; flex-wrap: wrap; }
  .ck-btns button { flex: 1 1 140px; min-height: 46px; border-radius: 999px; font: inherit; font-weight: 800; cursor: pointer; border: 1px solid #1f3d34; }
  .ck-yes { background: #1f3d34; color: #fff; }
  .ck-no { background: #fff; color: #1f3d34; }
  .ck-btns button:focus-visible, .ck-open:focus-visible { outline: 3px solid #c4400f; outline-offset: 2px; }
  .ck-open { background: none; border: 0; padding: 0; min-height: 44px; font: inherit; color: inherit; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
  @media (max-width: 600px) { .ck { left: 10px; right: 10px; bottom: 10px; width: auto; } }`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const box = document.createElement("div");
  box.className = "ck";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-labelledby", "ck-t");
  box.hidden = true;
  box.innerHTML = '<b id="ck-t">Cookies pro měření webu a reklamy</b>'
    + '<p>Web funguje i&nbsp;bez nich. Se souhlasem nahraji, jak web procházíte (bez toho, co píšete do formulářů), abych viděl, '
    + 'kde se lidé zasekávají, a&nbsp;použiji cookies Seznamu (Sklik) a&nbsp;Googlu (Ads), abych věděl, které reklamy přivádějí '
    + 'poptávky. <a href="/ochrana-osobnich-udaju.html#h-cookies">Podrobnosti</a></p>'
    + '<div class="ck-btns"><button type="button" class="ck-no">Jen nezbytné</button><button type="button" class="ck-yes">Povolit</button></div>';

  function decide(ok) {
    store.set({ ok, v: VERSION, ts: Date.now() });
    box.hidden = true;
    if (ok) startTracking();
    // odvolání souhlasu: už načtené kódy z paměti nevyhodíme – stačí nové načtení stránky
    // (analytics.js pak poběží bez souhlasu a smaže, co si PostHog uložil)
    else if (granted) location.reload();
  }
  box.querySelector(".ck-yes").addEventListener("click", () => decide(true));
  box.querySelector(".ck-no").addEventListener("click", () => decide(false));

  function init() {
    document.body.appendChild(box);
    // „Nastavení cookies“ v patičce (odvolání nebo změna souhlasu)
    const foot = document.querySelector(".foot-contact") || document.querySelector("footer");
    if (foot) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ck-open";
      b.textContent = "Nastavení cookies";
      b.addEventListener("click", () => { box.hidden = false; box.querySelector(".ck-yes").focus(); });
      foot.appendChild(b);
    }
    const saved = store.get();
    if (saved && saved.v === VERSION && Date.now() - saved.ts < YEAR) {
      if (saved.ok) startTracking();
    } else {
      box.hidden = false;
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
