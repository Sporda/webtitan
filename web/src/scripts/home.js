(() => {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  // Společné funkce formulářů (odeslání, chyby polí, záložní e-mail, měření, okno při odchodu, posouzení zdarma) jsou
  // v /assets/lead.js jako window.wtLead. Ten se načítá s defer, tedy až po tomhle skriptu – proto se volají až při
  // použití (odeslání, kliknutí), nebo přes onLead() po jeho načtení, ne hned při načtení stránky.
  const L = () => window.wtLead;
  const onLead = fn => (window.wtLead ? fn() : document.addEventListener("DOMContentLoaded", fn));
  const track = (name, props) => L()?.track(name, props);
  const setErr = (input, msg) => L().setErr(input, msg);
  const emailOk = v => L().EMAIL_RE.test(v.trim());

  // localStorage už při načtení stránky (obnovení přepínače a rozpracované poptávky), kdy lead.js ještě neběží
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
  };

  // Formátování čísel: formátovače se vytvoří jednou (kalkulačka přepočítává při každém posunu jezdce).
  const NUM = [new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }), new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 })];
  const kc = n => NUM[0].format(Math.round(n)) +" Kč";

  function scrollToEl(el) {
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  // kliknutí na výzvy (data-cta) měří lead.js na všech stránkách

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
    // Sleduje se, dokud se opravdu nestáhnou – tablet na výšku (bez přehazování) se může otočit na šířku.
    let preloaded = false;
    let near = false;
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
        near = es.some(e => e.isIntersecting);
        if (near) preload();
        if (preloaded) io.disconnect();
      }, { rootMargin: "900px 0px" });
      io.observe(grid);
    }
    desktop.addEventListener("change", () => { if (near) preload(); });
    grid.addEventListener("pointerenter", preload);
    grid.addEventListener("focusin", preload);

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
    onLead(() => L().clearOnInput(["bk-name", "bk-email", "bk-phone"].map(id => document.getElementById(id))));

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
      setErr(email, emailOk(email.value) ? "" : "Zadejte prosím platný e-mail – pošlu na něj potvrzení termínu.");
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
      L().busy(btn, true, "Odesílám…");
      fail.hidden = true;
      status.className = "form-status";
      status.textContent = "Odesílám žádost o hovor…";
      const day = dayObj(radio("bk_day"));
      const time = radio("bk_time");
      const props = { day: radio("bk_day"), time, mode: radio("bk_mode"), segment: seg.value };
      try {
        await L().sendLead("hovor", form, { name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim(), message: summary() });
        track("call_request", Object.assign({ status: "ok" }, props));
        L().markSubmitted();
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
        L().setMailto($("#bk-mailto"), "Žádost o 15min hovor – " + day.long + " " + time, summary() + "\n\nJméno: " + name.value.trim() + "\nE-mail: " + email.value.trim());
        fail.hidden = false;
        const issue = L().sendIssue(fail, err, { name: "bk-name", email: "bk-email", phone: "bk-phone", message: "bk-note" });
        status.className = "form-status err";
        status.textContent = issue.field ? "Zkontrolujte prosím zvýrazněná pole – nebo žádost pošlete e-mailem."
          : issue.rate ? "Zkuste to prosím za chvíli, nebo napište e-mailem."
          : "Žádost můžete poslat e-mailem – vše je předvyplněné.";
      } finally {
        L().busy(btn, false, "Domluvit hovor");
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
      // po odeslání už nic neukládat – přesun fokusu na poděkování vyvolá „change“ u posledního pole
      // a odeslaná poptávka by se jinak znovu uložila jako rozpracovaná
      if (!done.hidden) return;
      const data = { ts: Date.now(), step, type, radios: {}, fields: {}, call: $("#qf-call").checked };
      $$("input[type=radio]:checked", form).forEach(r => { data.radios[r.name] = r.value; });
      TEXT_IDS.forEach(id => { data.fields[id] = document.getElementById(id).value; });
      store.set(KEY, data);
    }
    // Při psaní se ukládá chvíli po poslední změně (ne při každé klávese), při odchodu ze stránky hned.
    let saveT = 0;
    const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(() => { saveT = 0; save(); }, 400); };
    const forget = () => { clearTimeout(saveT); saveT = 0; store.del(KEY); };
    window.addEventListener("pagehide", () => { if (saveT) { clearTimeout(saveT); saveT = 0; save(); } });
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
      setErr(email, emailOk(email.value) ? "" : "Zadejte prosím platný e-mail, ať vám můžu odpovědět.");
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
    form.addEventListener("input", saveSoon);
    form.addEventListener("change", saveSoon);
    onLead(() => L().clearOnInput(["qf-name", "qf-email", "qf-phone"].map(id => document.getElementById(id))));

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
      L().busy(btn, true, "Odesílám…");
      fail.hidden = true;
      status.className = "form-status";
      status.textContent = "Odesílám poptávku…";
      try {
        await L().sendLead("poptavka", form, { name, email, phone: val("qf-phone"), message: summary() });
        track("form_submit", { status: "ok", type: type || "neuvedeno" });
        forget();
        L().markSubmitted();
        window.wtConversion?.("lead");
        status.textContent = "";
        showDone(name);
      } catch (err) {
        track("form_submit", { status: "error", type: type || "neuvedeno" });
        L().setMailto($("#qf-mailto"), "Poptávka z webu – " + (type || "nezařazeno"), summary() + "\n\nJméno: " + name + "\nE-mail: " + email);
        fail.hidden = false;
        const issue = L().sendIssue(fail, err, { name: "qf-name", email: "qf-email", phone: "qf-phone", message: "qf-msg" });
        status.className = "form-status err";
        status.textContent = issue.field ? "Zkontrolujte prosím zvýrazněná pole – nebo poptávku pošlete e-mailem."
          : issue.rate ? "Zkuste to prosím za chvíli, nebo napište e-mailem."
          : "Poptávku můžete poslat e-mailem – vše je předvyplněné.";
      } finally {
        L().busy(btn, false, "Odeslat poptávku");
      }
    });

    $("#qf-reset").addEventListener("click", () => {
      form.reset();
      setType("");
      forget();
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
    const fmt = (n, d) => NUM[d ? 1 : 0].format(n);
    const out = {
      people: $("#roi-people-o"), hours: $("#roi-hours-o"), share: $("#roi-share-o"), month: $("#roi-month"),
      monthHours: $("#roi-hours-month"), year: $("#roi-year"), save: $("#roi-save"), pay: $("#roi-pay")
    };
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
      out.people.textContent = p + " " + plural(p, "člověk", "lidé", "lidí");
      out.hours.textContent = fmt(h, 1) + " h";
      out.share.textContent = Math.round(s * 100) + " %";
      out.month.textContent = kc(month);
      out.monthHours.textContent = fmt(monthHours, 0);
      out.year.textContent = kc(month * 12);
      out.save.textContent = kc(saving) + "/měs.";
      const pay = out.pay;
      if (saving <= 0) {
        pay.innerHTML = "Zadejte hodinové náklady – pak spočítám, za jak dlouho by se aplikace vrátila.";
      } else {
        const m = Number(pay.dataset.price) / saving;
        let txt;
        if (m < 1) txt = "<b>méně než měsíc</b>";
        else if (m > 36) txt = "<b>víc než 3 roky</b> – v&nbsp;tom případě vám upřímně řeknu, jestli se to vyplatí";
        else {
          const v = Math.round(m * 10) / 10;
          txt = "<b>" + fmt(v, 1) + "&nbsp;" + plural(v, "měsíc", "měsíce", "měsíců") + "</b>";
        }
        // cena aplikace z data/sluzby.ts (data-price / data-price-html na #roi-pay)
        pay.innerHTML = "Aplikace od " + pay.dataset.priceHtml + " by se při této úspoře vrátila zhruba za " + txt + ".";
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

  // ---------- posouzení / kontrola zdarma (sekce #kontrola a okno při odchodu) – odeslání řeší lead.js ----------
  onLead(() => $$(".lm-form").forEach(f => {
    const kind = f.dataset.kind;
    const src = f.dataset.source;
    L().leadMagnet(f, {
      kind,
      source: src === "exit" ? "exit" : "kontrola",
      origin: src === "exit" ? "vyskakovací okno" : "sekce na webu",
      cls: { fields: "lm-fields", done: "lm-done", fail: "lm-fail", mailto: "lm-mailto" },
      props: { source: src, kind },
      onDone() {
        const site = $(".lm-site", f);
        const url = $("[name=url]", f);
        if (site && url) site.textContent = url.value.trim();
        ui.updateBar();
      }
    });
  }));

  // ---------- okno při odchodu – kdy se ukáže, řeší lead.js (wtLead.exitIntent) ----------
  // Nabídka se řídí přepínačem aplikace / web; okno se neukáže, když je na obrazovce kontaktní sekce.
  onLead(() => {
    const dlg = $("#exit-dlg");
    let contactIn = false;
    new IntersectionObserver(([e]) => { contactIn = e.isIntersecting; }, { threshold: 0 }).observe($("#kontakt"));
    L().exitIntent(dlg, {
      paused: () => contactIn,
      prepare() { dlg.setAttribute("aria-labelledby", seg.value === "app" ? "exit-t-app" : "exit-t"); },
      onShow(trigger, desktop) {
        if (desktop) {
          const field = $(seg.value === "app" ? "#lm-text-x" : "#lm-url-x");
          if (field) field.focus();
        }
        ui.dlgOpen = true;
        ui.updateBar();
        track("exit_intent_shown", { trigger, segment: seg.value });
      },
      onClose() { ui.dlgOpen = false; ui.updateBar(); }
    });
  });
})();
