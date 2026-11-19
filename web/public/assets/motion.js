/* WebTitan – pohyblivá část vrstvy mikrointerakcí (motion.css je zbytek). Načítá se na všech stránkách (defer).
 * Podle skillu design-taste-frontend (references/motion.md).
 *
 * - Stisk na dotyku: iOS Safari ukáže :active (stisk tlačítka) jen tehdy, když stránka poslouchá touchstart.
 * - Přepínače role="tablist" (.seg, .tabs, .lb-tabs): bílá tableta vybrané volby k nové volbě přejede (240 ms,
 *   jen transform), místo aby přeskočila. Výběr dál řídí stránka (aria-selected), tady se jen sleduje.
 * - window.wtArrive(el): po kliknutí na výzvu, která stránku posune k formuláři, formulář po dojezdu jednou krátce
 *   zvýrazní okraj – je vidět, kam klik vedl. Volá ho stránka (src/scripts/home.js openContact, lead.js open).
 * - html.m-ready po prvním vykreslení: od té chvíle se animuje výměna textu v úvodu (aplikace / web), ne při načtení.
 * Při omezení pohybu tableta jen skočí na místo a zvýraznění se nepouští.
 */
(() => {
  "use strict";
  const html = document.documentElement;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("touchstart", () => {}, { passive: true });
  requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add("m-ready")));

  // ---------- přepínač s ukazatelem ----------
  function indicator(list) {
    if (list.querySelector(":scope > .m-ind")) return;
    const ind = document.createElement("span");
    ind.className = "m-ind";
    ind.setAttribute("aria-hidden", "true");
    list.prepend(ind);
    list.classList.add("m-has-ind");
    let at = null;
    const set = (b, sx, sy) => {
      ind.style.setProperty("--x", b.x + "px");
      ind.style.setProperty("--y", b.y + "px");
      ind.style.setProperty("--w", b.w + "px");
      ind.style.setProperty("--h", b.h + "px");
      ind.style.setProperty("--sx", String(sx));
      ind.style.setProperty("--sy", String(sy));
    };
    const jump = on => ind.classList.toggle("is-jump", on);
    const place = instant => {
      const sel = list.querySelector(':scope > [role="tab"][aria-selected="true"]');
      const to = sel && { x: sel.offsetLeft, y: sel.offsetTop, w: sel.offsetWidth, h: sel.offsetHeight };
      if (!to || !to.w || !to.h) {           // skrytý přepínač: vybraná volba si nechá vlastní bílé pozadí
        list.classList.remove("is-placed");
        at = null;
        return;
      }
      if (instant || !at || reduced()) {
        jump(true); set(to, 1, 1); ind.getBoundingClientRect(); jump(false);
      } else if (at.x !== to.x || at.y !== to.y || at.w !== to.w) {
        // tableta převezme velikost nové volby hned, vyrazí zmenšená na velikost staré a cestou dorovná měřítko
        jump(true); set({ ...to, x: at.x, y: at.y }, at.w / to.w, at.h / to.h); ind.getBoundingClientRect(); jump(false);
        set(to, 1, 1);
      }
      at = to;
      list.classList.add("is-placed");
    };
    place(true);
    new MutationObserver(() => place(false)).observe(list, { subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
    new ResizeObserver(() => place(true)).observe(list);
    document.fonts && document.fonts.ready.then(() => place(true));
  }
  document.querySelectorAll('.seg[role="tablist"], .tabs[role="tablist"], .lb-tabs[role="tablist"]').forEach(indicator);

  // ---------- zvýraznění formuláře po dojezdu ----------
  window.wtArrive = el => {
    if (!el || reduced()) return;
    let fired = false;
    const flash = () => {
      if (fired) return;
      fired = true;
      removeEventListener("scrollend", flash);
      el.classList.remove("m-arrive");
      void el.offsetWidth;                    // znovu spustit animaci i při dalším kliknutí
      el.classList.add("m-arrive");
      setTimeout(() => el.classList.remove("m-arrive"), 1300);
    };
    // po dojezdu posunu (scrollend); když se stránka nepohnula (formulář už byl na místě), hned;
    // prohlížeč bez scrollend nejpozději za 1 s
    const y0 = scrollY;
    addEventListener("scrollend", flash, { once: true });
    setTimeout(() => { if (scrollY === y0) flash(); }, 120);
    setTimeout(flash, 1000);
  };
})();
