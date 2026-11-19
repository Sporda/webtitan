/* webtitan.cz – poptávky: společné funkce formulářů pro celý web a formulář na podstránkách.
 *
 * 1. Odkud návštěvník přišel (vyhledávač, Sklik / Google Ads, odkaz, kampaň s utm_*). Drží se jen po dobu
 *    návštěvy v sessionStorage (po zavření panelu zmizí) a posílá se s formulářem, aby u poptávky v CRM bylo
 *    vidět, co ji přineslo.
 * 2. window.wtLead – společné funkce formulářů (odeslání na /api/contact.php, chyby polí, záložní odeslání e-mailem,
 *    měření, okno při odchodu, formulář „posouzení / kontrola zdarma“). Používá je i úvodní stránka (src/scripts/home.js);
 *    tenhle soubor se načítá s defer, takže je home.js volá až při použití.
 * 3. Formulář „Zavolejte mi / Napsat poptávku“ přímo na podstránce (#poptat). Odkazy href="#poptat" s data-mode
 *    (call | form) na něj skočí a přepnou ho.
 * 4. Okno při odchodu na podstránkách (dialog.wtx, vykreslí ho Sub.astro / ExitDialog.astro): nejvýš jednou za 7 dní,
 *    ne 30 dní po odeslaném formuláři, ?exit=1 ho ukáže hned (na vyzkoušení).
 */
(() => {
  "use strict";

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^[0-9+()\/.\- ]{6,40}$/;
  const WEEK = 7 * 864e5;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let submitted = false;

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
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

  // ---------- 2. společné funkce formulářů ----------
  // měření (PostHog / GTM jsou volitelné)
  function track(name, props) {
    props = props || {};
    try { window.posthog?.capture?.(name, props); } catch (e) { /* ignore */ }
    try { window.dataLayer?.push?.(Object.assign({ event: name }, props)); } catch (e) { /* ignore */ }
  }
  // POST /api/contact.php → 200 {"ok":true} = úspěch; jiný stav nebo chyba sítě vyhodí chybu se status a data
  async function sendLead(source, form, p) {
    const hp = form ? form.querySelector('input[name="website"]') : null;
    const body = {
      source,
      name: String(p.name || ""),
      email: String(p.email || ""),
      phone: String(p.phone || ""),
      message: String(p.message || ""),
      website: hp ? hp.value : "",
      page: location.pathname,
      src: sess.get()
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
  // Po chybě: 429 = ukázat „zkuste za chvíli“, 400 s fields = zvýraznit pole, která server odmítl.
  // map = { name: prvek nebo jeho id, … }; vrací { rate, field } (field = první zvýrazněné pole).
  function sendIssue(failBox, err, map) {
    const rate = !!(err && err.status === 429);
    const rateMsg = failBox ? $(".rate-msg", failBox) : null;
    if (rateMsg) rateMsg.hidden = !rate;
    let field = null;
    const fields = err && err.status === 400 && err.data && err.data.fields;
    if (fields && typeof fields === "object") {
      Object.keys(fields).forEach(k => {
        const el = typeof map[k] === "string" ? document.getElementById(map[k]) : map[k];
        if (!el) return;
        setErr(el, typeof fields[k] === "string" && fields[k] ? fields[k] : "Zkontrolujte prosím toto pole.");
        field = field || el;
      });
    }
    return { rate, field };
  }
  // Odkaz „Odeslat e-mailem“: adresa zůstává z HTML (data/site.ts), doplní se předmět a předvyplněný text.
  function setMailto(a, subject, body) {
    if (!a) return;
    a.href = a.href.split("?")[0] + "?subject=" + encodeURIComponent(subject)
      + "&body=" + encodeURIComponent(body.length > 1800 ? body.slice(0, 1800) + "\n…" : body);
  }
  // tlačítko odeslání: „Odesílám…“ s točícím se kolečkem, pak zpět původní text
  function busy(btn, on, text) {
    const lbl = $(".lbl", btn);
    btn.disabled = on;
    btn.classList.toggle("is-loading", on);
    if (lbl && text) lbl.textContent = text;
  }
  const clearOnInput = inputs => inputs.filter(Boolean).forEach(i => i.addEventListener("input", () => {
    if (i.getAttribute("aria-invalid") === "true") setErr(i, "");
  }));
  // odeslaný formulář: 30 dní žádné okno při odchodu, na podstránce zmizí mobilní lišta
  function markSubmitted() {
    submitted = true;
    store.set("wt7-submitted", Date.now());
    updateBar();
  }

  // Formulář „kontrola webu / posouzení procesu zdarma“ (pole url nebo text, email). o = {
  //   kind: "web" | "app", source: zdroj pro contact.php, origin: text „Zdroj: …“ do zprávy,
  //   cls: { fields, done, fail, mailto } – třídy částí formuláře, props: data navíc k měření, onDone() }
  const validUrl = u => /^(https?:\/\/)?[^\s/.]+(\.[^\s/.]+)+(\/\S*)?$/i.test(u.trim());
  function leadMagnet(form, o) {
    const url = $("[name=url]", form);
    const text = $("[name=text]", form);
    const email = $("[name=email]", form);
    const btn = $("button[type=submit]", form);
    const fields = $("." + o.cls.fields, form);
    const ok = $("." + o.cls.done, form);
    const failBox = $("." + o.cls.fail, form);
    const web = o.kind === "web";
    clearOnInput([url, text, email]);
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (url) setErr(url, validUrl(url.value) ? "" : "Zadejte prosím adresu webu, např. www.vasefirma.cz.");
      if (text) setErr(text, text.value.trim().length >= 10 ? "" : "Napište prosím aspoň pár slov nebo vložte odkaz.");
      setErr(email, EMAIL_RE.test(email.value.trim()) ? "" : "Zadejte prosím platný e-mail.");
      const bad = [url, text, email].filter(Boolean).find(i => i.getAttribute("aria-invalid") === "true");
      if (bad) { bad.focus(); return; }
      const mail = email.value.trim();
      // začátek zprávy čte _mail.php (potvrzení zákazníkovi) – neměnit
      const message = web
        ? "Žádost o bezplatnou kontrolu webu: " + url.value.trim() + "\nE-mail: " + mail + "\nZdroj: " + o.origin
        : "Žádost o bezplatné posouzení procesu:\n\n" + text.value.trim() + "\n\nE-mail: " + mail + "\nZdroj: " + o.origin;
      const lblText = $(".lbl", btn).textContent;
      busy(btn, true, "Odesílám…");
      failBox.hidden = true;
      try {
        await sendLead(o.source, form, { name: web ? "Kontrola webu" : "Posouzení procesu", email: mail, phone: "", message });
        track("leadmagnet_submit", Object.assign({ status: "ok" }, o.props));
        markSubmitted();
        window.wtConversion?.("check"); // Sklik / Google Ads – jen se souhlasem (assets/consent.js)
        if (o.onDone) o.onDone();
        fields.hidden = true;
        ok.hidden = false;
        ok.focus({ preventScroll: true });
      } catch (err) {
        track("leadmagnet_submit", Object.assign({ status: "error" }, o.props));
        setMailto($("." + o.cls.mailto, failBox), web ? "Bezplatná kontrola webu" : "Bezplatné posouzení procesu", message);
        failBox.hidden = false;
        sendIssue(failBox, err, { email, message: text || url });
      } finally {
        busy(btn, false, lblText);
      }
    });
  }

  // Okno při odchodu – společná pravidla pro úvodní stránku i podstránky.
  //   počítač: myš odjede horním okrajem (k panelům, adresnímu řádku, zavření), nejdřív 8 s po načtení;
  //   telefon: rychlé švihnutí nahoru o víc než půl obrazovky po přečtení aspoň třetiny stránky, nebo návrat
  //   do panelu po víc než 15 s jinde (nejdřív 15 s po načtení); okno vyjede zespodu (.sheet).
  // Nejvýš jednou za 7 dní, ne 30 dní po odeslaném formuláři; ?exit=1 ho ukáže hned (nic si nepamatuje).
  const exitForced = () => new URLSearchParams(location.search).has("exit");
  const exitBlocked = () => {
    const sent = store.get("wt7-submitted");
    const last = store.get("wt7-exit");
    return !!((sent && Date.now() - sent < 30 * 864e5) || (last && Date.now() - last < WEEK));
  };
  // o.paused() = stránka okno teď nechce (formulář na obrazovce…), o.prepare() = těsně před otevřením (popisek okna),
  // o.onShow(trigger, desktop) = po otevření (fokus, měření), o.onClose()
  function exitIntent(dlg, o) {
    const force = exitForced();
    // Když se okno v téhle návštěvě stejně ukázat nemůže, nic se nesleduje.
    if (!dlg || typeof dlg.showModal !== "function" || (!force && exitBlocked())) return;
    const desktop = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    const t0 = Date.now();
    const watch = new AbortController(); // po zobrazení okna se sledování vypne
    let shown = false;
    const allowed = minMs => {
      if (shown || dlg.open) return false;
      if (force) return true;
      if (submitted || o.paused()) return false;
      if (Date.now() - t0 < minMs) return false;
      return !exitBlocked();
    };
    function show(trigger) {
      shown = true;
      watch.abort();
      if (!force) store.set("wt7-exit", Date.now());
      dlg.classList.toggle("sheet", !desktop.matches);
      if (o.prepare) o.prepare();
      dlg.showModal();
      o.onShow(trigger, desktop.matches);
    }
    document.addEventListener("mouseout", e => {
      if (e.relatedTarget || e.clientY > 8 || !desktop.matches) return;
      if (allowed(8000)) show("mouse");
    }, { signal: watch.signal });
    let lastY = window.scrollY;
    let upFrom = null;
    let deepest = 0;
    // výška stránky se čte po změně rozvržení (ResizeObserver), ne při každém posunu – to by vynutilo přepočet
    let docH = document.documentElement.scrollHeight;
    const ro = new ResizeObserver(() => { docH = document.documentElement.scrollHeight; });
    ro.observe(document.body);
    watch.signal.addEventListener("abort", () => ro.disconnect());
    window.addEventListener("scroll", () => {
      if (desktop.matches) return;
      const y = window.scrollY;
      const now = performance.now();
      deepest = Math.max(deepest, (y + window.innerHeight) / docH);
      if (y >= lastY) upFrom = null;
      else if (!upFrom || now - upFrom.t > 600) upFrom = { y: lastY, t: now };
      lastY = y;
      if (upFrom && upFrom.y - y > window.innerHeight * 0.55 && deepest > 0.33 && y > 400 && allowed(15000)) show("scroll_up");
    }, { passive: true, signal: watch.signal });
    let hiddenAt = 0;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { hiddenAt = Date.now(); return; }
      if (!desktop.matches && hiddenAt && Date.now() - hiddenAt > 15000 && allowed(15000)) show("return");
    }, { signal: watch.signal });
    if (force) setTimeout(() => { if (allowed(0)) show("test"); }, 700);
    dlg.addEventListener("close", () => { if (o.onClose) o.onClose(); });
    // zavření: klik mimo okno nebo na [data-close] (ne na odkaz, který otevírá kontaktní formulář)
    dlg.addEventListener("click", e => {
      if (e.target === dlg || (e.target.closest("[data-close]") && !e.target.closest("[data-open]"))) dlg.close();
    });
  }

  window.wtLead = { store, track, sendLead, setErr, sendIssue, setMailto, busy, clearOnInput, markSubmitted, leadMagnet, exitIntent, EMAIL_RE };

  // kliknutí na výzvy (data-cta) – na všech stránkách, kde se tenhle soubor načítá
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-cta]");
    if (el) track("cta_click", { location: el.dataset.cta, page: location.pathname });
  });

  // ---------- 3. formulář na podstránce ----------
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
        window.wtConversion?.("lead"); // Sklik / Google Ads – jen se souhlasem (assets/consent.js)
        $("[data-done=title]", done).textContent = mode === "call" ? "Díky! Zavolám vám." : "Díky! Poptávka dorazila.";
        $("[data-done=text]", done).textContent = mode === "call"
          ? "Ozvu se do 24 hodin (v pracovní dny)" + (when !== "Kdykoli" ? ", nejlépe " + when.toLowerCase() : "") + ". Kdybych se nedovolal, zkusím to znovu."
          : "Ozvu se vám osobně do 24 hodin (v pracovní dny) – e-mailem, nebo zavolám, pokud jste nechali číslo.";
        form.hidden = true;
        tabBar.hidden = true;
        done.hidden = false;
        $("[data-done=title]", done).focus({ preventScroll: true });
      } catch (err) {
        track(event, { status: "error", form: "page", topic });
        const contact = "\n\n" + name + (phone ? "\nTelefon: " + phone : "") + (mode === "form" && email ? "\nE-mail: " + email : "");
        setMailto($(".lb-mailto", failBox), mode === "call" ? "Prosím o zavolání" : "Poptávka z webu – " + topic, message + contact);
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
        window.wtArrive?.(card); // po dojezdu formulář krátce zvýrazní okraj (assets/motion.js)
        const target = done.hidden ? tabs.find(t => t.getAttribute("aria-selected") === "true") : $("[data-done=title]", done);
        if (target) target.focus({ preventScroll: true });
      }
    };
  })();

  document.addEventListener("click", e => {
    const a = e.target.closest('a[href="#poptat"]');
    if (!a || !lead) return;
    e.preventDefault();
    const dlg = a.closest("dialog");
    if (dlg && dlg.open) dlg.close();
    lead.open(a.dataset.mode || "call");
  });

  // mobilní lišta s tlačítkem (podstránky): vysune se až pod úvodem stránky (tam jsou vlastní tlačítka) a schová se,
  // když je na obrazovce formulář, je otevřené okno nebo je poptávka odeslaná
  const bar = $(".mbar");
  const heroCard = $(".sp-hero .intro");
  let heroIn = !!heroCard;
  let leadIn = false;
  let dlgOpen = false;
  function updateBar() {
    if (bar) bar.classList.toggle("on", !(heroIn || leadIn || dlgOpen || submitted));
  }
  if (heroCard) {
    new IntersectionObserver(([e]) => { heroIn = e.isIntersecting; updateBar(); }, { rootMargin: "0px 0px -35% 0px" }).observe(heroCard);
  }
  if (lead && lead.el) {
    new IntersectionObserver(([e]) => { leadIn = e.isIntersecting; updateBar(); }, { threshold: 0 }).observe(lead.el);
  }
  updateBar();

  // ---------- jemné objevení karet pod prvním zobrazením (podstránky a články) ----------
  // Jen to, co při načtení není vidět (nic neblikne a nic nezdrží vykreslení), text článků zůstává v klidu.
  // Co je vidět hned, pozná první odpověď IntersectionObserveru – bez měření každé karty při načtení.
  // (Úvodní stránka má třídy .rv rovnou v HTML a objevování řeší home.js.)
  (function reveal() {
    if (!lead || reduce || location.hash || typeof IntersectionObserver !== "function") return;
    const els = $$("main .sec .card, main .sec details, main .sec .head");
    if (!els.length) return;
    const seen = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!seen.has(e.target)) {
          seen.add(e.target);
          // horní hrana v prvním zobrazení → nechat být (i když je vidět jen kousek)
          if (e.boundingClientRect.top <= window.innerHeight) { io.unobserve(e.target); return; }
          const sibs = Array.from(e.target.parentElement.children).filter(c => els.includes(c));
          const i = sibs.indexOf(e.target);
          if (i > 0) e.target.style.setProperty("--d", Math.min(i, 4) * 70 + "ms");
          e.target.classList.add("rv");
          return;
        }
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: .08 });
    els.forEach(el => io.observe(el));
  })();

  // ---------- 4. okno při odchodu (podstránky a články) ----------
  const xdlg = $("dialog.wtx");
  if (!xdlg) return;
  const xform = $("form", xdlg);
  const kind = xdlg.dataset.kind === "web" ? "web" : "app";
  leadMagnet(xform, {
    kind,
    source: "exit",
    origin: "vyskakovací okno (" + location.pathname + ")",
    cls: { fields: "wtx-fields", done: "wtx-done", fail: "lb-fail", mailto: "lb-mailto" },
    props: { source: "exit", kind, page: location.pathname }
  });
  exitIntent(xdlg, {
    paused: () => leadIn,
    onShow(trigger, desktop) {
      if (desktop) {
        const field = $(kind === "app" ? "#wtx-text" : "#wtx-url", xdlg);
        if (field) field.focus();
      }
      dlgOpen = true;
      updateBar();
      track("exit_intent_shown", { trigger, segment: kind, page: location.pathname });
    },
    onClose() { dlgOpen = false; updateBar(); }
  });
})();
