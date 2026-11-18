(() => {
  "use strict";

  // Volná kapacita – např. "Volno na nové projekty od ledna 2027". Prázdné = štítek se nezobrazí.
  const VOLNA_KAPACITA = "";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const WEEK = 7 * 864e5;
  const APP_PRICE = 24950;
  let submitted = false;

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
  };

  // analytics hooks (PostHog / GTM are optional)
  function track(name, props) {
    props = props || {};
    try { window.posthog?.capture?.(name, props); } catch (e) { /* ignore */ }
    try { window.dataLayer?.push?.(Object.assign({ event: name }, props)); } catch (e) { /* ignore */ }
  }
  // Odeslání všech formulářů – jeden společný helper.
  // POST /api/contact.php → 200 {"ok":true} = úspěch; jiný stav nebo chyba sítě = záložní odeslání e-mailem.
  class SendError extends Error {
    constructor(status, data) { super("HTTP " + status); this.status = status; this.data = data || {}; }
  }
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
      // odkud návštěvník přišel (/assets/lead.js) – v e-mailu a v CRM pak vidím, co poptávku přineslo
      src: typeof window.wtSrc === "function" ? window.wtSrc() : null
    };
    let res;
    try {
      res = await fetch("/api/contact.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(body)
      });
    } catch (e) {
      throw new SendError(0);
    }
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (res.status === 200 && data && data.ok === true) return data;
    throw new SendError(res.status, data);
  }
  // Po chybě: 429 = ukázat „zkuste za chvíli“, 400 s fields = zvýraznit pole, která server odmítl.
  function sendIssue(failBox, err, fieldIds) {
    const rate = !!(err && err.status === 429);
    const rateMsg = failBox ? failBox.querySelector(".rate-msg") : null;
    if (rateMsg) rateMsg.hidden = !rate;
    let field = null;
    const fields = err && err.status === 400 && err.data && err.data.fields;
    if (fields && typeof fields === "object") {
      Object.keys(fields).forEach(k => {
        const el = fieldIds && fieldIds[k] ? document.getElementById(fieldIds[k]) : null;
        if (!el) return;
        setErr(el, typeof fields[k] === "string" && fields[k] ? fields[k] : "Zkontrolujte prosím toto pole.");
        field = field || el;
      });
    }
    return { rate, field };
  }
  const mailto = (subject, body) => "mailto:jan@webtitan.cz?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body.length > 1800 ? body.slice(0, 1800) + "\n…" : body);
  const kc = n => Math.round(n).toLocaleString("cs-CZ") + " Kč";

  function setErr(input, msg) {
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    const p = document.getElementById("e-" + input.id);
    if (p) p.textContent = msg;
  }
  function scrollToEl(el) {
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  function markSubmitted() {
    submitted = true;
    store.set("wt7-submitted", Date.now());
    ui.updateBar();
  }

  document.addEventListener("click", e => {
    const el = e.target.closest("[data-cta]");
    if (el) track("cta_click", { location: el.dataset.cta });
  });

  // ---------- capacity badge ----------
  if (VOLNA_KAPACITA.trim()) {
    $$("[data-capacity]").forEach(b => { b.textContent = VOLNA_KAPACITA.trim(); b.hidden = false; });
  }

  // ---------- mobile menu ----------
  const menu = $("#menu");
  const links = $("#links");
  menu.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(open));
    menu.textContent = open ? "✕" : "☰";
  });
  $$("a", links).forEach(a => a.addEventListener("click", () => {
    links.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
    menu.textContent = "☰";
  }));

  // ---------- reveal on scroll ----------
  // Sourozenci v mřížce (karty služeb, kroky, reference…) naskakují kousek po sobě, nejvýš ~0,3 s.
  $$(".rv").forEach(el => {
    const sibs = Array.from(el.parentElement.children).filter(c => c.classList.contains("rv"));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty("--d", Math.min(i, 4) * 70 + "ms");
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: .08 });
  $$(".rv").forEach(el => io.observe(el));

  // ---------- čísla v úvodu (20+, 23) krátce naběhnou, když jsou vidět ----------
  if (!reduce) {
    const nums = $$(".stat-top b").map(b => ({ b, m: b.textContent.match(/^(\d+)(\+?)$/) })).filter(x => x.m && +x.m[1] >= 5);
    // hned na nulu (bez JS a pro vyhledávače zůstává v HTML skutečné číslo)
    nums.forEach(({ b, m }) => { b.setAttribute("aria-label", m[0]); b.textContent = "0" + m[2]; });
    const run = ({ b, m }) => {
      const end = +m[1];
      const t0 = performance.now();
      const step = now => {
        const p = Math.min(1, (now - t0) / 900);
        b.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + m[2];
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const nio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        nio.unobserve(e.target);
        run(nums.find(x => x.b === e.target));
      });
    }, { threshold: .6 });
    nums.forEach(x => nio.observe(x.b));
  }

  // ---------- mobile sticky CTA ----------
  const ui = { dlgOpen: false, updateBar() {} };
  (function () {
    const bar = $("#mobile-cta");
    let heroIn = true, contactIn = false;
    ui.updateBar = () => {
      const show = !heroIn && !contactIn && !ui.dlgOpen;
      bar.classList.toggle("show", show);
      bar.setAttribute("aria-hidden", String(!show));
      $$("a", bar).forEach(a => { a.tabIndex = show ? 0 : -1; });
    };
    new IntersectionObserver(([e]) => { heroIn = e.isIntersecting; ui.updateBar(); }, { threshold: 0, rootMargin: "0px 0px -35% 0px" }).observe($("#hero"));
    new IntersectionObserver(([e]) => { contactIn = e.isIntersecting; ui.updateBar(); }, { threshold: 0 }).observe($("#kontakt"));
  })();

  // ---------- contact tabs ----------
  const tabs = (() => {
    const btns = [$("#tab-call"), $("#tab-form")];
    const panels = { call: $("#panel-call"), form: $("#panel-form") };
    let current = "call";
    function select(name, opts) {
      opts = opts || {};
      current = name;
      btns.forEach(b => {
        const on = b.id === "tab-" + name;
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
      });
      panels.call.hidden = name !== "call";
      panels.form.hidden = name !== "form";
      if (opts.focusTab) $("#tab-" + name).focus();
      if (!opts.silent) track("contact_tab", { tab: name });
    }
    btns.forEach((b, i) => {
      b.addEventListener("click", () => select(b.id === "tab-call" ? "call" : "form"));
      b.addEventListener("keydown", e => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
        e.preventDefault();
        const next = btns[(e.key === "Home") ? 0 : (e.key === "End") ? 1 : (i + 1) % 2];
        select(next.id === "tab-call" ? "call" : "form", { focusTab: true });
      });
    });
    return { select, get current() { return current; } };
  })();

  // ---------- Služby: klik na kartu ji přesune na hlavní pozici vlevo ----------
  // Jen na desktopu, kde jsou karty vedle sebe (na užším displeji jsou pod sebou a pořadí zůstává).
  // Kliknutá karta jde na hlavní pozici, ostatní se seřadí podle původního pořadí (široká pozice, pak dvě malé) –
  // nejdelší karta (aplikace) tak mimo hlavní pozici skončí vždy na široké. Karty se přesouvají i v DOM, aby
  // pořadí pro čtečky odpovídalo tomu, co je vidět. Obrázek služby ukazuje CSS jen u karty na hlavní pozici.
  (() => {
    const grid = $(".svc-grid");
    if (!grid) return;
    const desktop = window.matchMedia("(min-width: 1081px)");
    const ORDER = $$(".svc-swap", grid); // původní pořadí
    const SLOTS = ["svc-main", "svc-wide", "svc-small", "svc-small"];
    let running = null; // právě běžící animace prohození

    // Obrázky ostatních služeb (schované, jinak by se načetly až po kliknutí) stáhnout a rozbalit dopředu, jakmile se
    // sekce blíží k obrazovce – první prohození pak nečeká na síť a obrázek nenaskočí pozdě. Jen na desktopu:
    // na užším displeji se karty nepřehazují, data se šetří.
    let preloaded = false;
    const preload = () => {
      if (preloaded || !desktop.matches) return;
      preloaded = true;
      $$(".svc-shot img", grid).forEach(img => {
        img.loading = "eager";
        img.decode?.().catch(() => {});
      });
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => {
        if (es.some(e => e.isIntersecting)) { preload(); io.disconnect(); }
      }, { rootMargin: "900px 0px" });
      io.observe(grid);
    }
    grid.addEventListener("pointerenter", preload, { once: true });
    grid.addEventListener("focusin", preload, { once: true });

    function feature(card, focus) {
      if (card.classList.contains("svc-main") || !desktop.matches) return;
      const next = [card, ...ORDER.filter(c => c !== card)];
      const anchor = $(".svc-srv", grid); // karty správy zůstávají pod nimi
      const swap = () => {
        next.forEach((c, i) => {
          c.classList.remove(...SLOTS, "gb");
          c.classList.add(SLOTS[i]);
          if (i === 0) c.classList.add("gb");
          grid.insertBefore(c, anchor);
        });
        // tlačítko „Ukázka“ na hlavní pozici zmizí – focus přejde na název služby v téže kartě
        if (focus) $("h3 a", card)?.focus({ preventScroll: true });
      };
      const img = $(".svc-shot img", card);
      img.loading = "eager";
      const ready = Promise.race([
        img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
        new Promise(r => setTimeout(r, 350))
      ]);
      ready.then(() => {
        if (reduce || !document.startViewTransition) { swap(); return; }
        ORDER.forEach(c => { c.style.viewTransitionName = "svc-" + c.dataset.svc; c.style.viewTransitionClass = "svc"; });
        const vt = running = document.startViewTransition(swap);
        // rychlý druhý klik přeruší běžící animaci (AbortError) – prohození se provede tak jako tak
        vt.ready.catch(() => {});
        vt.finished.catch(() => {}).then(() => {
          if (running !== vt) return; // mezitím začala další animace, ta si názvy uklidí sama
          running = null;
          ORDER.forEach(c => { c.style.viewTransitionName = ""; c.style.viewTransitionClass = ""; });
        });
      });
      track("svc_feature", { service: card.dataset.svc });
    }

    grid.addEventListener("click", e => {
      const card = e.target.closest(".svc-swap");
      if (!card) return;
      // Odkazy v kartě (název služby, „Poptat …“) fungují normálně; tlačítko „Ukázka“ a zbytek karty přepínají.
      if (e.target.closest("a") || (e.target.closest("button") && !e.target.closest(".svc-peek"))) return;
      if (window.getSelection && String(window.getSelection()).length) return; // označování textu není klik
      feature(card, !!e.target.closest(".svc-peek"));
    });
  })();

  // ---------- segment switch (app / web) ----------
  const seg = (() => {
    const btns = $$("[data-seg-btn]");
    const LABEL = { app: "aplikace a systémy", web: "weby a e-shopy" };
    let value = "app";
    function apply(v, opts) {
      opts = opts || {};
      value = v === "web" ? "web" : "app";
      btns.forEach(b => {
        const on = b.dataset.segBtn === value;
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
      });
      $("#hero-copy").setAttribute("aria-labelledby", "seg-" + value);
      $$("[data-only]").forEach(el => { el.hidden = el.dataset.only !== value; });
      $$("[data-rel]").forEach(el => { el.classList.toggle("is-match", el.dataset.rel.split(" ").includes(value)); });
      $("#seg-hint-label").textContent = LABEL[value];
      const topic = $('input[name="bk_topic"][value="' + (value === "app" ? "Aplikace na míru" : "Web") + '"]');
      if (topic && !opts.keepTopic) topic.checked = true;
      store.set("wt7-seg", value);
      if (!opts.silent) track("segment_switch", { segment: value });
    }
    btns.forEach((b, i) => {
      b.addEventListener("click", () => apply(b.dataset.segBtn));
      b.addEventListener("keydown", e => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const next = btns[(i + 1) % btns.length];
        apply(next.dataset.segBtn);
        next.focus();
      });
    });
    const saved = store.get("wt7-seg");
    apply(saved === "web" ? "web" : "app", { silent: true });
    return { get value() { return value; } };
  })();

  // ---------- call booking ----------
  const booking = (() => {
    const WD = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
    const WD_LONG = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];
    const form = $("#book-form");
    const done = $("#bk-done");
    const head = $("#bk-head");
    const fail = $("#bk-fail");
    const status = $("#bk-status");
    const daysBox = $("#book-days");
    // nejbližších 10 pracovních dní od zítřka (státní svátky se neřeší – Jan termín potvrdí)
    const days = [];
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    while (days.length < 10) {
      d.setDate(d.getDate() + 1);
      const wd = d.getDay();
      if (wd === 0 || wd === 6) continue;
      const iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      days.push({
        iso,
        short: WD[wd],
        date: d.getDate() + ". " + (d.getMonth() + 1) + ".",
        long: WD_LONG[wd] + " " + d.getDate() + ". " + (d.getMonth() + 1) + ". " + d.getFullYear()
      });
    }
    days.forEach(x => {
      const l = document.createElement("label");
      l.innerHTML = '<input type="radio" name="bk_day" value="' + x.iso + '"><span><b>' + x.short + '</b><small>' + x.date + '</small></span>';
      daysBox.appendChild(l);
    });
    // hero card: first 3 days
    const heroDays = $("#hero-days");
    const more = $(".hday.more", heroDays);
    days.slice(0, 3).forEach(x => {
      const a = document.createElement("a");
      a.href = "#kontakt";
      a.className = "hday";
      a.dataset.open = "call";
      a.dataset.day = x.iso;
      a.dataset.cta = "hero_day";
      a.setAttribute("aria-label", x.short + " " + x.date + " – domluvit hovor (" + x.long + ")");
      a.innerHTML = "<b>" + x.short + "</b> <small>" + x.date + "</small>";
      heroDays.insertBefore(a, more);
    });

    const dayObj = iso => days.find(x => x.iso === iso);
    const radio = n => form.querySelector('input[name="' + n + '"]:checked')?.value || "";
    const val = id => (document.getElementById(id)?.value || "").trim();

    function updateSel() {
      const day = dayObj(radio("bk_day"));
      const time = radio("bk_time");
      const sel = $("#bk-sel");
      if (day || time) {
        $("#bk-sel-t").textContent = (day ? day.long : "vyberte den") + (time ? " v " + time : " – vyberte čas");
        sel.hidden = false;
      } else {
        sel.hidden = true;
      }
      if (day) $("#e-bk-day").textContent = "";
      if (time) $("#e-bk-time").textContent = "";
    }
    function updatePhoneReq() {
      const phoneReq = radio("bk_mode") === "Telefonicky";
      $("#bk-phone-req").textContent = phoneReq ? "* (zavolám vám na něj)" : "(nepovinné)";
      if (!phoneReq) setErr($("#bk-phone"), "");
    }
    form.addEventListener("change", e => {
      if (e.target.name === "bk_day" || e.target.name === "bk_time") updateSel();
      if (e.target.name === "bk_mode") updatePhoneReq();
    });
    ["bk-name", "bk-email", "bk-phone"].forEach(id => {
      document.getElementById(id).addEventListener("input", e => {
        if (e.target.getAttribute("aria-invalid") === "true") setErr(e.target, "");
      });
    });

    function summary() {
      const day = dayObj(radio("bk_day"));
      return [
        "Žádost o 15min hovor z webu webtitan.cz",
        "",
        "Termín: " + (day ? day.long : "?") + " v " + radio("bk_time"),
        "Forma: " + radio("bk_mode"),
        "Téma: " + (radio("bk_topic") || "neuvedeno"),
        "Telefon: " + (val("bk-phone") || "neuvedeno"),
        "Zájem (přepínač na webu): " + (seg.value === "app" ? "aplikace / systém" : "web / e-shop"),
        "",
        "Poznámka:",
        val("bk-note") || "(bez poznámky)"
      ].join("\n");
    }

    form.addEventListener("submit", async e => {
      e.preventDefault();
      let first = null;
      if (!radio("bk_day")) { $("#e-bk-day").textContent = "Vyberte prosím den."; first = first || $('input[name="bk_day"]', form); }
      if (!radio("bk_time")) { $("#e-bk-time").textContent = "Vyberte prosím čas."; first = first || $('input[name="bk_time"]', form); }
      const name = $("#bk-name"), email = $("#bk-email"), phone = $("#bk-phone");
      setErr(name, name.value.trim().length < 2 ? "Napište prosím své jméno." : "");
      setErr(email, EMAIL_RE.test(email.value.trim()) ? "" : "Zadejte prosím platný e-mail – pošlu na něj potvrzení termínu.");
      const needPhone = radio("bk_mode") === "Telefonicky" && phone.value.replace(/\D/g, "").length < 9;
      setErr(phone, needPhone ? "Zadejte prosím telefon, ať vám můžu zavolat – nebo zvolte videohovor." : "");
      const badField = [name, email, phone].find(i => i.getAttribute("aria-invalid") === "true");
      first = first || badField;
      if (first) {
        status.className = "form-status err";
        status.textContent = "Zkontrolujte prosím zvýrazněná pole.";
        first.focus();
        return;
      }
      const btn = $("#bk-submit");
      const lbl = $(".lbl", btn);
      btn.disabled = true;
      btn.classList.add("is-loading");
      lbl.textContent = "Odesílám…";
      fail.hidden = true;
      status.className = "form-status";
      status.textContent = "Odesílám žádost o hovor…";
      const day = dayObj(radio("bk_day"));
      const time = radio("bk_time");
      const props = { day: radio("bk_day"), time, mode: radio("bk_mode"), segment: seg.value };
      try {
        await sendLead("hovor", form, { name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim(), message: summary() });
        track("call_request", Object.assign({ status: "ok" }, props));
        markSubmitted();
        window.wtConversion?.("lead"); // Sklik / Google Ads – jen se souhlasem (assets/consent.js)
        status.textContent = "";
        const firstName = name.value.trim().split(/\s+/)[0];
        $("#bk-done-t").textContent = "Díky, " + firstName + "! Žádost o hovor dorazila.";
        $("#bk-done-p").textContent = "Termín " + day.long + " v " + time + " vám potvrdím e-mailem do 24 hodin (v pracovní dny).";
        form.hidden = true;
        head.hidden = true;
        done.hidden = false;
        const card = $("#contact-card");
        if (card.getBoundingClientRect().top < 0) scrollToEl(card);
        $("#bk-done-t").focus({ preventScroll: true });
      } catch (err) {
        track("call_request", Object.assign({ status: "error" }, props));
        $("#bk-mailto").href = mailto("Žádost o 15min hovor – " + day.long + " " + time, summary() + "\n\nJméno: " + name.value.trim() + "\nE-mail: " + email.value.trim());
        fail.hidden = false;
        const issue = sendIssue(fail, err, { name: "bk-name", email: "bk-email", phone: "bk-phone", message: "bk-note" });
        status.className = "form-status err";
        status.textContent = issue.field ? "Zkontrolujte prosím zvýrazněná pole – nebo žádost pošlete e-mailem."
          : issue.rate ? "Zkuste to prosím za chvíli, nebo napište e-mailem."
          : "Žádost můžete poslat e-mailem – vše je předvyplněné.";
      } finally {
        btn.disabled = false;
        btn.classList.remove("is-loading");
        lbl.textContent = "Domluvit hovor";
      }
    });

    updatePhoneReq();
    return {
      pickDay(iso) {
        const r = $('input[name="bk_day"][value="' + iso + '"]', form);
        if (r) { r.checked = true; updateSel(); }
      },
      focusStart() {
        if (!done.hidden) { $("#bk-done-t").focus({ preventScroll: true }); return; }
        const checked = $('input[name="bk_day"]:checked', form);
        if (checked) {
          $("#bl-time").focus({ preventScroll: true });
        } else {
          $("#bk-title").focus({ preventScroll: true });
        }
      }
    };
  })();

  // ---------- multi-step inquiry form ----------
  const qf = (() => {
    const form = $("#contact-form");
    const head = $("#qf-head");
    const done = $("#qf-done");
    const steps = $$(".qf-step", form);
    const bar = $("#qf-bar");
    const count = $("#qf-count");
    const status = $("#form-status");
    const tiles = $$(".qf-tiles .qtile", form);
    const resume = $("#qf-resume");
    const fail = $("#qf-fail");
    const KEY = "wt7-inquiry";
    const UP = {
      "Web": ["up_web", "Máte už web?"],
      "E-shop": ["up_eshop", "Kolik produktů?"],
      "Aplikace na míru": ["up_app", "Co dnes používáte?"],
      "Mobilní aplikace": ["up_mob", "Pro koho je aplikace?"],
      "Správa serveru": ["up_srv", "Co spravovat?"]
    };
    const TEXT_IDS = ["qf-url", "qf-msg", "qf-name", "qf-email", "qf-phone"];
    let step = 1;
    let type = "";

    const val = id => (document.getElementById(id)?.value || "").trim();
    const radio = n => form.querySelector('input[name="' + n + '"]:checked')?.value || "";

    function save() {
      const data = { ts: Date.now(), step, type, radios: {}, fields: {}, call: $("#qf-call").checked };
      $$("input[type=radio]:checked", form).forEach(r => { data.radios[r.name] = r.value; });
      TEXT_IDS.forEach(id => { data.fields[id] = document.getElementById(id).value; });
      store.set(KEY, data);
    }
    function setType(t) {
      type = t;
      tiles.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.type === t)));
      $$(".qf-q[data-for]", form).forEach(q => { q.hidden = q.dataset.for !== t; });
      $("#qf-type-label").textContent = t || "–";
      $("#e-typ").textContent = "";
    }
    function go(n, opts) {
      opts = opts || {};
      step = n;
      steps.forEach(s => { s.hidden = Number(s.dataset.step) !== n; });
      bar.style.width = (n / 3 * 100).toFixed(2) + "%";
      count.textContent = "Krok " + n + " ze 3";
      status.textContent = "";
      status.className = "form-status";
      if (opts.focus !== false) $(".qf-title", steps[n - 1]).focus({ preventScroll: true });
      if (!opts.silent) track("form_step", { step: n, type: type || "neuvedeno" });
      save();
    }
    function summary() {
      const lines = ["Poptávka z webu webtitan.cz", "", "Typ: " + (type || "neuvedeno")];
      const up = UP[type];
      if (up && radio(up[0])) lines.push(up[1] + " " + radio(up[0]));
      lines.push("Termín: " + (radio("termin") || "neuvedeno"));
      lines.push("Rozpočet: " + (radio("rozpocet") || "neuvedeno"));
      lines.push("Současný web: " + (val("qf-url") || "neuvedeno"));
      lines.push("Telefon: " + (val("qf-phone") || "neuvedeno"));
      lines.push("Raději zavolat: " + ($("#qf-call").checked ? "ano" : "ne"));
      lines.push("", "Zpráva:", val("qf-msg") || "(bez zprávy)");
      return lines.join("\n");
    }
    function validate() {
      const name = $("#qf-name"), email = $("#qf-email"), phone = $("#qf-phone");
      setErr(name, name.value.trim().length < 2 ? "Napište prosím své jméno." : "");
      setErr(email, EMAIL_RE.test(email.value.trim()) ? "" : "Zadejte prosím platný e-mail, ať vám můžu odpovědět.");
      const needPhone = $("#qf-call").checked && phone.value.replace(/\D/g, "").length < 9;
      setErr(phone, needPhone ? "Zadejte prosím telefon, ať vám můžu zavolat." : "");
      return [name, email, phone].find(i => i.getAttribute("aria-invalid") === "true") || null;
    }
    function showForm() {
      done.hidden = true;
      form.hidden = false;
      head.hidden = false;
    }
    function showDone(name) {
      $("#qf-done-t").textContent = "Díky, " + name.split(/\s+/)[0] + "! Poptávka dorazila.";
      form.hidden = true;
      head.hidden = true;
      done.hidden = false;
      const card = $("#contact-card");
      if (card.getBoundingClientRect().top < 0) scrollToEl(card);
      $("#qf-done-t").focus({ preventScroll: true });
    }

    tiles.forEach(b => b.addEventListener("click", () => { setType(b.dataset.type); go(2); }));
    $$("[data-goto]", form).forEach(b => b.addEventListener("click", () => go(Number(b.dataset.goto))));
    form.addEventListener("input", save);
    form.addEventListener("change", save);
    ["qf-name", "qf-email", "qf-phone"].forEach(id => {
      document.getElementById(id).addEventListener("input", e => {
        if (e.target.getAttribute("aria-invalid") === "true") setErr(e.target, "");
      });
    });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (step === 1) {
        if (!type) { $("#e-typ").textContent = "Vyberte prosím jednu možnost."; return; }
        go(2);
        return;
      }
      if (step === 2) { go(3); return; }
      const bad = validate();
      if (bad) {
        status.className = "form-status err";
        status.textContent = "Zkontrolujte prosím zvýrazněná pole.";
        bad.focus();
        return;
      }
      const name = val("qf-name");
      const email = val("qf-email");
      const btn = $("#qf-submit");
      const lbl = $(".lbl", btn);
      btn.disabled = true;
      btn.classList.add("is-loading");
      lbl.textContent = "Odesílám…";
      fail.hidden = true;
      status.className = "form-status";
      status.textContent = "Odesílám poptávku…";
      try {
        await sendLead("poptavka", form, { name, email, phone: val("qf-phone"), message: summary() });
        track("form_submit", { status: "ok", type: type || "neuvedeno" });
        store.del(KEY);
        markSubmitted();
        window.wtConversion?.("lead");
        status.textContent = "";
        showDone(name);
      } catch (err) {
        track("form_submit", { status: "error", type: type || "neuvedeno" });
        $("#qf-mailto").href = mailto("Poptávka z webu – " + (type || "nezařazeno"), summary() + "\n\nJméno: " + name + "\nE-mail: " + email);
        fail.hidden = false;
        const issue = sendIssue(fail, err, { name: "qf-name", email: "qf-email", phone: "qf-phone", message: "qf-msg" });
        status.className = "form-status err";
        status.textContent = issue.field ? "Zkontrolujte prosím zvýrazněná pole – nebo poptávku pošlete e-mailem."
          : issue.rate ? "Zkuste to prosím za chvíli, nebo napište e-mailem."
          : "Poptávku můžete poslat e-mailem – vše je předvyplněné.";
      } finally {
        btn.disabled = false;
        btn.classList.remove("is-loading");
        lbl.textContent = "Odeslat poptávku";
      }
    });

    $("#qf-reset").addEventListener("click", () => {
      form.reset();
      setType("");
      store.del(KEY);
      resume.hidden = true;
      ["qf-name", "qf-email", "qf-phone"].forEach(id => setErr(document.getElementById(id), ""));
      go(1);
    });

    // restore a previously started inquiry
    let restored = false;
    (function restore() {
      const d = store.get(KEY);
      if (!d || !d.ts || Date.now() - d.ts > 30 * 864e5) return;
      const radios = d.radios || {};
      $$("input[type=radio]", form).forEach(r => { if (radios[r.name] === r.value) r.checked = true; });
      Object.keys(d.fields || {}).forEach(id => {
        const el = document.getElementById(id);
        if (el && typeof d.fields[id] === "string") el.value = d.fields[id];
      });
      $("#qf-call").checked = !!d.call;
      if (d.type) setType(d.type);
      const anyText = Object.values(d.fields || {}).some(v => v && String(v).trim());
      if (d.type || anyText) {
        const s = Math.min(Math.max(Number(d.step) || 1, 1), 3);
        go(d.type ? s : 1, { focus: false, silent: true });
        resume.hidden = false;
        restored = true;
      }
    })();

    return {
      get restored() { return restored; },
      get done() { return !done.hidden; },
      open(opts) {
        opts = opts || {};
        if (!done.hidden && (opts.type || opts.message)) { form.reset(); setType(""); showForm(); go(1, { focus: false, silent: true }); }
        if (opts.message) {
          const msg = $("#qf-msg");
          msg.value = opts.message + (msg.value.trim() ? "\n\n" + msg.value : "");
        }
        if (opts.type) {
          resume.hidden = true;
          setType(opts.type);
          go(2, { focus: false });
          $(".qf-title", steps[1]).focus({ preventScroll: true });
        } else if (!done.hidden) {
          $("#qf-done-t").focus({ preventScroll: true });
        } else {
          $(".qf-title", steps[step - 1]).focus({ preventScroll: true });
        }
      }
    };
  })();

  // ---------- open contact (call / form) from anywhere ----------
  function openContact(which, opts) {
    opts = opts || {};
    tabs.select(which, { silent: true });
    if (which === "call") {
      if (opts.day) booking.pickDay(opts.day);
      scrollToEl($("#contact-card"));
      booking.focusStart();
    } else {
      let type = opts.type;
      if (!type && opts.fromSeg && !qf.restored && seg.value === "app") type = "Aplikace na míru";
      scrollToEl($("#contact-card"));
      qf.open({ type, message: opts.message });
      if (type) track("quickpick_select", { type, location: opts.loc || "page" });
    }
    window.wtArrive?.($("#contact-card")); // po dojezdu formulář krátce zvýrazní okraj (assets/motion.js)
  }
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-open]");
    if (!el) return;
    e.preventDefault();
    const dlg = $("#exit-dlg");
    if (dlg.open && el.closest("#exit-dlg")) dlg.close();
    openContact(el.dataset.open, { day: el.dataset.day, type: el.dataset.type, loc: el.dataset.cta, fromSeg: !el.dataset.type });
  });

  // ---------- ROI calculator ----------
  (function () {
    const people = $("#roi-people"), hours = $("#roi-hours"), share = $("#roi-share"), rate = $("#roi-rate");
    const WEEKS = 4.33;
    let used = false;
    const plural = (n, one, few, many) => {
      if (n !== Math.floor(n)) return few;
      if (n === 1) return one;
      if (n >= 2 && n <= 4) return few;
      return many;
    };
    const fmt = (n, d) => n.toLocaleString("cs-CZ", { maximumFractionDigits: d || 0 });
    let last = {};
    function calc() {
      const p = Number(people.value) || 0;
      const h = Number(hours.value) || 0;
      const s = (Number(share.value) || 0) / 100;
      let r = Number(rate.value);
      if (!isFinite(r) || r < 0) r = 0;
      const monthHours = p * h * WEEKS;
      const month = monthHours * r;
      const saving = month * s;
      $("#roi-people-o").textContent = p + " " + plural(p, "člověk", "lidé", "lidí");
      $("#roi-hours-o").textContent = fmt(h, 1) + " h";
      $("#roi-share-o").textContent = Math.round(s * 100) + " %";
      $("#roi-month").textContent = kc(month);
      $("#roi-hours-month").textContent = fmt(monthHours, 0);
      $("#roi-year").textContent = kc(month * 12);
      $("#roi-save").textContent = kc(saving) + "/měs.";
      const pay = $("#roi-pay");
      if (saving <= 0) {
        pay.innerHTML = "Zadejte hodinové náklady – pak spočítám, za jak dlouho by se aplikace vrátila.";
      } else {
        const m = APP_PRICE / saving;
        let txt;
        if (m < 1) txt = "<b>méně než měsíc</b>";
        else if (m > 36) txt = "<b>víc než 3 roky</b> – v&nbsp;tom případě vám upřímně řeknu, jestli se to vyplatí";
        else {
          const v = Math.round(m * 10) / 10;
          txt = "<b>" + fmt(v, 1) + "&nbsp;" + plural(v, "měsíc", "měsíce", "měsíců") + "</b>";
        }
        pay.innerHTML = "Aplikace od 24&nbsp;950&nbsp;Kč by se při této úspoře vrátila zhruba za " + txt + ".";
      }
      last = { people: p, hours: h, share: Math.round(s * 100), rate: r, month: Math.round(month), saving: Math.round(saving) };
    }
    [people, hours, share, rate].forEach(i => i.addEventListener("input", () => {
      calc();
      if (!used) { used = true; track("calculator_use", { action: "input" }); }
    }));
    rate.addEventListener("blur", () => {
      const r = Number(rate.value);
      if (!isFinite(r) || r < 0 || rate.value === "") { rate.value = 350; calc(); }
    });
    $("#roi-cta").addEventListener("click", e => {
      e.preventDefault();
      track("calculator_use", Object.assign({ action: "cta" }, last));
      const msg = "Z kalkulačky na webu: " + last.people + " " + plural(last.people, "člověk", "lidé", "lidí") + " × " + fmt(last.hours, 1) + " h týdně × " + fmt(last.rate) + " Kč/h ≈ " + fmt(last.month) + " Kč měsíčně ruční práce (odhad úspory " + last.share + " % ≈ " + fmt(last.saving) + " Kč/měs.).";
      openContact("form", { type: "Aplikace na míru", message: msg, loc: "roi" });
    });
    calc();
  })();

  // ---------- lead magnets (web check / process review) ----------
  const validUrl = u => /^(https?:\/\/)?[^\s/.]+(\.[^\s/.]+)+(\/\S*)?$/i.test(u.trim());
  $$(".lm-form").forEach(f => {
    const kind = f.dataset.kind;
    const src = f.dataset.source;
    const url = $("[name=url]", f);
    const text = $("[name=text]", f);
    const email = $("[name=email]", f);
    const btn = $("button[type=submit]", f);
    const lbl = $(".lbl", btn);
    const lblText = lbl.textContent;
    const fields = $(".lm-fields", f);
    const ok = $(".lm-done", f);
    const failBox = $(".lm-fail", f);
    [url, text, email].filter(Boolean).forEach(i => i.addEventListener("input", () => {
      if (i.getAttribute("aria-invalid") === "true") setErr(i, "");
    }));
    f.addEventListener("submit", async e => {
      e.preventDefault();
      if (url) setErr(url, validUrl(url.value) ? "" : "Zadejte prosím adresu webu, např. www.vasefirma.cz.");
      if (text) setErr(text, text.value.trim().length >= 10 ? "" : "Napište prosím aspoň pár slov nebo vložte odkaz.");
      setErr(email, EMAIL_RE.test(email.value.trim()) ? "" : "Zadejte prosím platný e-mail.");
      const bad = [url, text, email].filter(Boolean).find(i => i.getAttribute("aria-invalid") === "true");
      if (bad) { bad.focus(); return; }
      const mail = email.value.trim();
      const srcLabel = src === "exit" ? "vyskakovací okno" : "sekce na webu";
      const message = kind === "web"
        ? "Žádost o bezplatnou kontrolu webu: " + url.value.trim() + "\nE-mail: " + mail + "\nZdroj: " + srcLabel
        : "Žádost o bezplatné posouzení procesu:\n\n" + text.value.trim() + "\n\nE-mail: " + mail + "\nZdroj: " + srcLabel;
      btn.disabled = true;
      btn.classList.add("is-loading");
      lbl.textContent = "Odesílám…";
      failBox.hidden = true;
      try {
        await sendLead(src === "exit" ? "exit" : "kontrola", f, { name: kind === "web" ? "Kontrola webu" : "Posouzení procesu", email: mail, phone: "", message });
        track("leadmagnet_submit", { status: "ok", source: src, kind });
        markSubmitted();
        window.wtConversion?.("check");
        const site = $(".lm-site", f);
        if (site && url) site.textContent = url.value.trim();
        fields.hidden = true;
        ok.hidden = false;
        ok.focus({ preventScroll: true });
      } catch (err) {
        track("leadmagnet_submit", { status: "error", source: src, kind });
        $(".lm-mailto", f).href = mailto(kind === "web" ? "Bezplatná kontrola webu" : "Bezplatné posouzení procesu", message);
        failBox.hidden = false;
        sendIssue(failBox, err, { email: email.id, message: (url || text).id });
      } finally {
        btn.disabled = false;
        btn.classList.remove("is-loading");
        lbl.textContent = lblText;
      }
    });
  });

  // ---------- exit-intent ----------
  // Desktop: the mouse leaves through the top edge (towards the tabs / address bar / close button).
  // Phones and tablets: a quick scroll back up after reading a good part of the page, or coming back
  // to the tab after a while away; shown as a sheet from the bottom. The offer follows the app / web switch.
  // At most once per 7 days, not for 30 days after a sent form, not while the contact section is on screen.
  // ?exit=1 shows it right away and ignores all of that (for testing; nothing is remembered).
  (function () {
    const dlg = $("#exit-dlg");
    if (!dlg || typeof dlg.showModal !== "function") return;
    const force = new URLSearchParams(location.search).has("exit");
    const desktop = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    const t0 = Date.now();
    let contactIn = false;
    let shown = false;
    new IntersectionObserver(([e]) => { contactIn = e.isIntersecting; }, { threshold: 0 }).observe($("#kontakt"));
    function allowed(minMs) {
      if (shown || dlg.open || ui.dlgOpen) return false;
      if (force) return true;
      if (submitted || contactIn) return false;
      if (Date.now() - t0 < minMs) return false;
      // po odeslaném formuláři 30 dní nic nenabízet – pak se může vrátit s novou zakázkou
      const sent = store.get("wt7-submitted");
      if (sent && Date.now() - sent < 30 * 864e5) return false;
      const last = store.get("wt7-exit");
      if (last && Date.now() - last < WEEK) return false;
      return true;
    }
    function show(trigger) {
      shown = true;
      if (!force) store.set("wt7-exit", Date.now());
      const app = seg.value === "app";
      dlg.setAttribute("aria-labelledby", app ? "exit-t-app" : "exit-t");
      dlg.classList.toggle("sheet", !desktop.matches);
      dlg.showModal();
      if (desktop.matches) {
        const field = $(app ? "#lm-text-x" : "#lm-url-x");
        if (field) field.focus();
      }
      ui.dlgOpen = true;
      ui.updateBar();
      track("exit_intent_shown", { trigger, segment: seg.value });
    }
    document.addEventListener("mouseout", e => {
      if (e.relatedTarget || e.clientY > 8 || !desktop.matches) return;
      if (allowed(8000)) show("mouse");
    });
    // phones: an upward flick of more than half a screen within ~0.6 s, after reading at least a third
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
      if (upFrom && upFrom.y - y > window.innerHeight * 0.55 && deepest > 0.33 && y > 400 && allowed(15000)) {
        show("scroll_up");
      }
    }, { passive: true });
    // phones: back in the tab after at least 15 s somewhere else
    let hiddenAt = 0;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { hiddenAt = Date.now(); return; }
      if (!desktop.matches && hiddenAt && Date.now() - hiddenAt > 15000 && allowed(15000)) show("return");
    });
    if (force) setTimeout(() => { if (allowed(0)) show("test"); }, 700);
    dlg.addEventListener("close", () => { ui.dlgOpen = false; ui.updateBar(); });
    dlg.addEventListener("click", e => {
      if (e.target === dlg || (e.target.closest("[data-close]") && !e.target.closest("[data-open]"))) dlg.close();
    });
  })();

  document.getElementById("year").textContent = new Date().getFullYear();
})();
