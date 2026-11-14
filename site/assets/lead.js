/* webtitan.cz – poptávky mimo úvodní stránku.
 *
 * 1. Odkud návštěvník přišel (vyhledávač, Sklik / Google Ads, odkaz, kampaň s utm_*). Drží se jen po dobu
 *    návštěvy v sessionStorage (po zavření panelu zmizí) a posílá se s formulářem, aby u poptávky v CRM bylo
 *    vidět, co ji přineslo. window.wtSrc() používá i úvodní stránka.
 * 2. Formulář „Zavolejte mi / Napsat poptávku“ přímo na stránce (#poptat). Odkazy href="#poptat" s data-mode
 *    (call | form) na něj skočí a přepnou ho.
 * 3. Okno při odchodu, když má <script> atribut data-offer="app|web" – stejná pravidla jako na úvodní stránce:
 *    nejvýš jednou za 7 dní, nikdy po odeslaném formuláři, ?exit=1 ho ukáže hned (na vyzkoušení).
 */
(() => {
  "use strict";

  const script = document.currentScript;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^[0-9+()\/.\- ]{6,40}$/;
  const WEEK = 7 * 864e5;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let submitted = false;

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  // ---------- 1. odkud návštěvník přišel ----------
  const SRC_KEY = "wt7-src";
  const sess = {
    get() { try { return JSON.parse(sessionStorage.getItem(SRC_KEY)); } catch (e) { return null; } },
    set(v) { try { sessionStorage.setItem(SRC_KEY, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  (function capture() {
    const q = new URLSearchParams(location.search);
    const touch = {};
    ["source", "medium", "campaign", "term", "content"].forEach(k => {
      const v = (q.get("utm_" + k) || "").trim();
      if (v) touch[k] = v.slice(0, 100);
    });
    const click = ["gclid", "gbraid", "wbraid"].some(k => q.has(k)) ? "google"
      : q.has("sznclid") ? "sklik"
      : q.has("msclkid") ? "bing"
      : q.has("fbclid") ? "facebook" : "";
    if (click) touch.click = click;
    try {
      const r = document.referrer ? new URL(document.referrer) : null;
      if (r && r.hostname && r.hostname !== location.hostname) touch.ref = r.hostname.slice(0, 100);
    } catch (e) { /* unusable referrer */ }
    const prev = sess.get();
    const pages = (prev && Number(prev.pages) > 0 ? Number(prev.pages) : 0) + 1;
    if (!prev || Object.keys(touch).length) {
      // první stránka návštěvy, nebo nový příchod z venku (reklama, vyhledávač) – ten platí
      touch.land = location.pathname.slice(0, 200);
      touch.pages = pages;
      sess.set(touch);
    } else {
      prev.pages = pages;
      sess.set(prev);
    }
  })();
  window.wtSrc = () => sess.get();

  // ---------- společné ----------
  function track(name, props) {
    props = props || {};
    try { window.posthog?.capture?.(name, props); } catch (e) { /* ignore */ }
    try { window.dataLayer?.push?.(Object.assign({ event: name }, props)); } catch (e) { /* ignore */ }
  }
  async function sendLead(source, form, p) {
    const hp = form.querySelector('input[name="website"]');
    const body = {
      source,
      name: String(p.name || ""),
      email: String(p.email || ""),
      phone: String(p.phone || ""),
      message: String(p.message || ""),
      website: hp ? hp.value : "",
      page: location.pathname,
      src: window.wtSrc()
    };
    let res;
    try {
      res = await fetch("/api/contact.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(body)
      });
    } catch (e) {
      throw Object.assign(new Error("network"), { status: 0, data: {} });
    }
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (res.status === 200 && data && data.ok === true) return data;
    throw Object.assign(new Error("HTTP " + res.status), { status: res.status, data: data || {} });
  }
  function setErr(input, msg) {
    if (!input) return;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    const p = document.getElementById("e-" + input.id);
    if (p) p.textContent = msg;
  }
  // 429 = „zkuste za chvíli“, 400 s fields = zvýraznit pole, která server odmítl
  function sendIssue(failBox, err, map) {
    const rateMsg = $(".rate-msg", failBox);
    if (rateMsg) rateMsg.hidden = !(err && err.status === 429);
    const fields = err && err.status === 400 && err.data && err.data.fields;
    if (fields && typeof fields === "object") {
      Object.keys(fields).forEach(k => {
        if (map[k]) setErr(map[k], typeof fields[k] === "string" && fields[k] ? fields[k] : "Zkontrolujte prosím toto pole.");
      });
    }
  }
  const mailto = (subject, body) => "mailto:kontakt@webtitan.cz?subject=" + encodeURIComponent(subject)
    + "&body=" + encodeURIComponent(body.length > 1800 ? body.slice(0, 1800) + "\n…" : body);
  function busy(btn, on, text) {
    const lbl = $(".lbl", btn);
    btn.disabled = on;
    btn.classList.toggle("is-loading", on);
    if (lbl && text) lbl.textContent = text;
  }
  function markSubmitted() {
    submitted = true;
    store.set("wt7-submitted", Date.now());
  }
  const clearOnInput = inputs => inputs.filter(Boolean).forEach(i => i.addEventListener("input", () => {
    if (i.getAttribute("aria-invalid") === "true") setErr(i, "");
  }));

  // ---------- 2. formulář na stránce ----------
  const lead = (() => {
    const form = $("#lb-form");
    if (!form) return null;
    const card = form.closest(".lb-card");
    const tabBar = $(".lb-tabs", card);
    const tabs = $$("[role=tab]", tabBar);
    const done = $(".lb-done", card);
    const failBox = $(".lb-fail", form);
    const btn = $("button[type=submit]", form);
    const topic = form.dataset.topic || "Zatím nevím";
    const f = { name: $("#lb-name"), phone: $("#lb-phone"), email: $("#lb-email"), message: $("#lb-msg") };
    let mode = "call";

    function setMode(m, opts) {
      mode = m === "form" ? "form" : "call";
      form.dataset.mode = mode;
      tabs.forEach(t => {
        const on = t.dataset.mode === mode;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      form.setAttribute("aria-labelledby", "lb-tab-" + mode);
      $$("[data-for]", card).forEach(el => { el.hidden = el.dataset.for !== mode; });
      $(".lbl", btn).textContent = mode === "call" ? "Zavolejte mi" : "Odeslat poptávku";
      Object.values(f).forEach(i => setErr(i, ""));
      failBox.hidden = true;
      if (opts && opts.track) track("contact_tab", { tab: mode, form: "page" });
    }
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => setMode(t.dataset.mode, { track: true }));
      t.addEventListener("keydown", e => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
        e.preventDefault();
        const next = tabs[e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + 1) % tabs.length];
        setMode(next.dataset.mode, { track: true });
        next.focus();
      });
    });
    clearOnInput(Object.values(f));

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const name = f.name.value.trim();
      const phone = f.phone.value.trim();
      const email = f.email.value.trim();
      const note = f.message.value.trim();
      const phoneOk = PHONE_RE.test(phone) && phone.replace(/\D/g, "").length >= 9;
      setErr(f.name, name.length >= 2 ? "" : "Vyplňte prosím jméno.");
      if (mode === "call") {
        setErr(f.phone, phoneOk ? "" : phone ? "Zkontrolujte prosím telefon." : "Vyplňte prosím telefon, ať vám můžu zavolat.");
        setErr(f.email, "");
        setErr(f.message, "");
      } else {
        setErr(f.email, EMAIL_RE.test(email) ? "" : "Zadejte prosím platný e-mail.");
        setErr(f.phone, !phone || phoneOk ? "" : "Zkontrolujte prosím telefon.");
        setErr(f.message, note.length >= 10 ? "" : "Napište prosím aspoň pár slov, co potřebujete.");
      }
      const bad = [f.name, f.email, f.phone, f.message].find(i => !i.closest("[hidden]") && i.getAttribute("aria-invalid") === "true");
      if (bad) { bad.focus(); return; }

      const when = (form.querySelector('input[name="when"]:checked') || {}).value || "Kdykoli";
      const message = mode === "call"
        ? "Typ: " + topic + "\nZavolat: " + when.toLowerCase() + "\n\n" + (note || "Prosím o zavolání.")
        : "Typ: " + topic + "\n\n" + note;
      const lblText = $(".lbl", btn).textContent;
      busy(btn, true, "Odesílám…");
      failBox.hidden = true;
      const event = mode === "call" ? "call_request" : "form_submit";
      try {
        await sendLead(mode === "call" ? "zavolat" : "poptavka", form, { name, email: mode === "call" ? "" : email, phone, message });
        track(event, { status: "ok", form: "page", topic });
        markSubmitted();
        $("[data-done=title]", done).textContent = mode === "call" ? "Díky! Zavolám vám." : "Díky! Poptávka dorazila.";
        $("[data-done=text]", done).textContent = mode === "call"
          ? "Ozvu se do 24 hodin (v pracovní dny)" + (when !== "Kdykoli" ? ", nejlépe " + when.toLowerCase() : "") + ". Kdybych se nedovolal, zkusím to znovu."
          : "Ozvu se vám osobně do 24 hodin (v pracovní dny) – e-mailem, nebo zavolám, pokud jste nechali číslo.";
        form.hidden = true;
        tabBar.hidden = true;
        done.hidden = false;
        $("[data-done=title]", done).focus({ preventScroll: true });
        updateBar();
      } catch (err) {
        track(event, { status: "error", form: "page", topic });
        const contact = "\n\n" + name + (phone ? "\nTelefon: " + phone : "") + (mode === "form" && email ? "\nE-mail: " + email : "");
        $(".lb-mailto", failBox).href = mailto(mode === "call" ? "Prosím o zavolání" : "Poptávka z webu – " + topic, message + contact);
        failBox.hidden = false;
        sendIssue(failBox, err, f);
      } finally {
        busy(btn, false, lblText);
      }
    });

    return {
      el: $("#poptat"),
      open(m) {
        if (done.hidden) setMode(m);
        card.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        const target = done.hidden ? tabs.find(t => t.getAttribute("aria-selected") === "true") : $("[data-done=title]", done);
        if (target) target.focus({ preventScroll: true });
      }
    };
  })();

  // Úvodní stránka (bez #lb-form) si kliknutí měří sama – tady jen podstránky a články.
  if (lead) {
    document.addEventListener("click", e => {
      const el = e.target.closest("[data-cta]");
      if (el) track("cta_click", { location: el.dataset.cta, page: location.pathname });
    });
  }
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href="#poptat"]');
    if (!a || !lead) return;
    e.preventDefault();
    const dlg = a.closest("dialog");
    if (dlg && dlg.open) dlg.close();
    lead.open(a.dataset.mode || "call");
  });

  // mobilní lišta s tlačítkem: schovat, když je formulář na obrazovce nebo je otevřené okno
  const bar = $(".mbar");
  let leadIn = false;
  let dlgOpen = false;
  function updateBar() {
    if (bar) bar.classList.toggle("off", leadIn || dlgOpen || submitted);
  }
  if (lead && lead.el) {
    new IntersectionObserver(([e]) => { leadIn = e.isIntersecting; updateBar(); }, { threshold: 0 }).observe(lead.el);
  }

  // ---------- 3. okno při odchodu ----------
  const offer = script && script.dataset.offer;
  if (!offer || typeof HTMLDialogElement !== "function") return;
  const app = offer !== "web";
  const dlg = document.createElement("dialog");
  dlg.className = "wtx";
  dlg.setAttribute("aria-labelledby", "wtx-t");
  dlg.innerHTML = `
  <div class="wtx-in">
    <button type="button" class="wtx-x" data-close aria-label="Zavřít">✕</button>
    <span class="kicker gt">Než odejdete</span>
    <h2 id="wtx-t">${app ? "Vyplatí se vám aplikace? Řeknu vám to zdarma" : "Chcete zdarma zkontrolovat svůj web?"}</h2>
    <form class="wtx-body" novalidate>
      <p>${app
        ? "Popište v&nbsp;pár větách, jak dnes pracujete, nebo vložte odkaz na tabulku. Do 2 pracovních dnů vám napíšu, jestli a&nbsp;jak se to dá zjednodušit a&nbsp;kolik by to zhruba stálo."
        : "Pošlete mi odkaz a&nbsp;do 2 pracovních dnů vám zdarma pošlu 5 konkrétních věcí, které vám berou poptávky."}</p>
      <div class="hp" aria-hidden="true"><label for="hp-wtx">Nevyplňujte</label><input type="text" id="hp-wtx" name="website" value="" tabindex="-1" autocomplete="off" aria-hidden="true"></div>
      <div class="wtx-fields">
        ${app
          ? `<div class="fld full"><label for="wtx-text">Co dnes řešíte? *</label><textarea id="wtx-text" name="text" rows="3" placeholder="Např. zakázky vedeme v Excelu a každý pátek je ručně přepisujeme do plánu…" aria-describedby="e-wtx-text"></textarea><p class="err-msg" id="e-wtx-text"></p></div>`
          : `<div class="fld"><label for="wtx-url">Adresa vašeho webu *</label><input id="wtx-url" name="url" type="text" inputmode="url" autocomplete="url" placeholder="www.vasefirma.cz" aria-describedby="e-wtx-url"><p class="err-msg" id="e-wtx-url"></p></div>`}
        <div class="fld"><label for="wtx-email">Kam vám pošlu ${app ? "posouzení" : "tipy"}? *</label><input id="wtx-email" name="email" type="email" autocomplete="email" placeholder="jan@firma.cz" aria-describedby="e-wtx-email"><p class="err-msg" id="e-wtx-email"></p></div>
        <button class="btn btn-grad" type="submit" data-cta="exit_lm_${app ? "app" : "web"}"><span class="lbl">${app ? "Chci posouzení zdarma" : "Chci kontrolu zdarma"}</span> <span class="arr">→</span></button>
        <p class="wtx-note">Zdarma, bez závazku a&nbsp;bez obchodních telefonátů.</p>
        <p class="consent">Odesláním souhlasíte se zpracováním údajů pro vyřízení poptávky – <a href="/ochrana-osobnich-udaju.html">zásady ochrany osobních údajů</a>.</p>
      </div>
      <div class="wtx-done" hidden tabindex="-1">
        <span class="lb-ok sm"><svg aria-hidden="true"><use href="#i-check"/></svg></span>
        <div><b>Díky, mám to u&nbsp;sebe.</b><p>${app
          ? "Do 2 pracovních dnů vám napíšu, jestli a&nbsp;jak se dá váš proces zjednodušit."
          : "Do 2 pracovních dnů vám pošlu tipy, co na webu zlepšit."}</p></div>
      </div>
      <div class="lb-fail" hidden>
        <b>Odeslání se nepovedlo.</b>
        <p class="rate-msg" hidden>Zkuste to prosím za chvíli, nebo napište e-mailem.</p>
        <p>Pošlete mi to prosím e-mailem – text jsem vám připravil.</p>
        <a class="btn btn-grad lb-mailto" href="mailto:kontakt@webtitan.cz">Odeslat e-mailem <span class="arr">→</span></a>
        <small>nebo napište na <a href="mailto:kontakt@webtitan.cz">kontakt@webtitan.cz</a></small>
      </div>
    </form>
    ${lead ? `<p class="wtx-alt"><a href="#poptat" data-mode="call" data-cta="exit_call">Raději mi zavolejte <span class="arr" aria-hidden="true">→</span></a></p>` : ""}
  </div>`;
  document.body.appendChild(dlg);

  // odeslání nabídky z okna
  (function () {
    const form = $("form", dlg);
    const text = $("#wtx-text", dlg);
    const url = $("#wtx-url", dlg);
    const email = $("#wtx-email", dlg);
    const btn = $("button[type=submit]", form);
    const fields = $(".wtx-fields", form);
    const ok = $(".wtx-done", form);
    const failBox = $(".lb-fail", form);
    const validUrl = u => /^(https?:\/\/)?[^\s/.]+(\.[^\s/.]+)+(\/\S*)?$/i.test(u.trim());
    clearOnInput([text, url, email]);
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (url) setErr(url, validUrl(url.value) ? "" : "Zadejte prosím adresu webu, např. www.vasefirma.cz.");
      if (text) setErr(text, text.value.trim().length >= 10 ? "" : "Napište prosím aspoň pár slov nebo vložte odkaz.");
      setErr(email, EMAIL_RE.test(email.value.trim()) ? "" : "Zadejte prosím platný e-mail.");
      const bad = [url, text, email].filter(Boolean).find(i => i.getAttribute("aria-invalid") === "true");
      if (bad) { bad.focus(); return; }
      const mail = email.value.trim();
      const message = app
        ? "Žádost o bezplatné posouzení procesu:\n\n" + text.value.trim() + "\n\nE-mail: " + mail + "\nZdroj: vyskakovací okno (" + location.pathname + ")"
        : "Žádost o bezplatnou kontrolu webu: " + url.value.trim() + "\nE-mail: " + mail + "\nZdroj: vyskakovací okno (" + location.pathname + ")";
      const lblText = $(".lbl", btn).textContent;
      busy(btn, true, "Odesílám…");
      failBox.hidden = true;
      try {
        await sendLead("exit", form, { name: app ? "Posouzení procesu" : "Kontrola webu", email: mail, phone: "", message });
        track("leadmagnet_submit", { status: "ok", source: "exit", kind: app ? "app" : "web", page: location.pathname });
        markSubmitted();
        fields.hidden = true;
        ok.hidden = false;
        ok.focus({ preventScroll: true });
      } catch (err) {
        track("leadmagnet_submit", { status: "error", source: "exit", kind: app ? "app" : "web", page: location.pathname });
        $(".lb-mailto", failBox).href = mailto(app ? "Bezplatné posouzení procesu" : "Bezplatná kontrola webu", message);
        failBox.hidden = false;
        sendIssue(failBox, err, { email, message: text || url });
      } finally {
        busy(btn, false, lblText);
      }
    });
  })();

  // kdy okno ukázat
  const force = new URLSearchParams(location.search).has("exit");
  const desktop = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
  const t0 = Date.now();
  let shown = false;
  function allowed(minMs) {
    if (shown || dlg.open) return false;
    if (force) return true;
    if (submitted || leadIn) return false;
    if (Date.now() - t0 < minMs) return false;
    if (store.get("wt7-submitted")) return false;
    const last = store.get("wt7-exit");
    if (last && Date.now() - last < WEEK) return false;
    return true;
  }
  function show(trigger) {
    shown = true;
    if (!force) store.set("wt7-exit", Date.now());
    dlg.classList.toggle("sheet", !desktop.matches);
    dlg.showModal();
    if (desktop.matches) {
      const field = $(app ? "#wtx-text" : "#wtx-url", dlg);
      if (field) field.focus();
    }
    dlgOpen = true;
    updateBar();
    track("exit_intent_shown", { trigger, segment: app ? "app" : "web", page: location.pathname });
  }
  // počítač: myš odjede horním okrajem (k panelům, adresnímu řádku, zavření)
  document.addEventListener("mouseout", e => {
    if (e.relatedTarget || e.clientY > 8 || !desktop.matches) return;
    if (allowed(8000)) show("mouse");
  });
  // telefon: rychlé švihnutí nahoru o víc než půl obrazovky po přečtení aspoň třetiny stránky
  let lastY = window.scrollY;
  let upFrom = null;
  let deepest = 0;
  window.addEventListener("scroll", () => {
    if (desktop.matches) return;
    const y = window.scrollY;
    const now = performance.now();
    deepest = Math.max(deepest, (y + window.innerHeight) / document.documentElement.scrollHeight);
    if (y >= lastY) upFrom = null;
    else if (!upFrom || now - upFrom.t > 600) upFrom = { y: lastY, t: now };
    lastY = y;
    if (upFrom && upFrom.y - y > window.innerHeight * 0.55 && deepest > 0.33 && y > 400 && allowed(15000)) show("scroll_up");
  }, { passive: true });
  // telefon: návrat do panelu po víc než 15 s jinde
  let hiddenAt = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (!desktop.matches && hiddenAt && Date.now() - hiddenAt > 15000 && allowed(15000)) show("return");
  });
  if (force) setTimeout(() => { if (allowed(0)) show("test"); }, 700);
  dlg.addEventListener("close", () => { dlgOpen = false; updateBar(); });
  dlg.addEventListener("click", e => {
    if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
  });
})();
