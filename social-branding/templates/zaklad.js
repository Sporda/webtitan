// Společný kód šablon: načtení textů, typografie, vložení helmy a ikon, vlnité linky a kontrola pro render.mjs.
//
// Texty: render.mjs je předá v window.DATA (z obsah.json). Při ručním náhledu v prohlížeči si je šablona sama
// najde v obsah.json podle ?p=<id>, např. prispevek-text.html?p=post-04. Co v datech chybí, doplní VYCHOZI ze šablony.

// Znaky, které obsahují písma z webu (stejné jako unicode-range v zaklad.css). Jiný znak = náhradní písmo = chyba.
const ROZSAHY = "0020-007E 00A0 00A7 00A9 00AB 00B0 00B7 00BB 00C1 00C4 00C9 00CD 00D3-00D4 00D6-00D7 00DA 00DC-00DD 00E1 00E4 00E9 00ED 00F3-00F4 00F6 00FA 00FC-00FD 2013-2014 2018-201A 201C-201E 2022 2026 2039-203A 20AC 2122 2191 2193 2212 010C-010F 011A-011B 0139-013A 013D-013E 0147-0148 0154-0155 0158-0159 0160-0161 0164-0165 016E-016F 017D-017E"
  .split(" ").map((r) => r.split("-").map((h) => parseInt(h, 16))).map(([a, b]) => [a, b ?? a]);
const podporovany = (ch) => { const c = ch.codePointAt(0); return c === 10 || ROZSAHY.some(([a, b]) => c >= a && c <= b); };

let hotovoResolve;
window.pripraveno = new Promise((r) => (hotovoResolve = r));

/** Data šablony: window.DATA (render.mjs) → obsah.json?p= (náhled v prohlížeči) → výchozí hodnoty šablony. */
export async function nacti(vychozi = {}) {
  let data = window.DATA;
  const p = new URLSearchParams(location.search).get("p");
  if (!data && p) {
    const obsah = await (await fetch("obsah.json")).json();
    data = obsah.vystupy.find((v) => v.id === p)?.data;
  }
  return { ...vychozi, ...(data ?? {}) };
}

/** Česká typografie a jednoduché značky: *text* = oranžové zvýraznění, **text** = tučně, nový řádek = <br>.
 *  Za jednopísmenné předložky a spojky (v, k, s, z, a, i, o, u) dá nezlomitelnou mezeru, mezi číslo a jednotku
 *  a do data taky. */
export function typo(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/(?<=^|[\s(„])([ksvzaiouKSVZAIOU])\s+/g, "$1\u00a0")
    .replace(/(\d)\s+(?=\d{3}\b)/g, "$1\u00a0")
    .replace(/(\d\.)\s+(?=\d)/g, "$1\u00a0")                         // datum \u201e31. 3. 2028\u201c
    .replace(/(\d)\s+(Kč|%|px|m²|km|dní|týdn)/g, "$1\u00a0$2")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

/** Vyplní všechny [data-t="klic"] textem z dat. Pole (odrážky) vyplní šablona sama. */
export function vypln(data, koren = document) {
  for (const el of koren.querySelectorAll("[data-t]")) {
    const v = data[el.dataset.t];
    el.innerHTML = Array.isArray(v) ? "" : typo(v);
  }
}

/** Vloží helmu (helma.svg) do všech .helma a sadu ikon (ikony.svg) do stránky. */
export async function vlozGrafiku() {
  const [helma, ikony] = await Promise.all(["helma.svg", "ikony.svg"].map((f) => fetch(f).then((r) => r.text())));
  for (const el of document.querySelectorAll(".helma")) el.innerHTML = helma;
  const sada = document.createElement("div");
  sada.style.display = "none";
  sada.innerHTML = ikony;
  document.body.prepend(sada);
}

/** <svg class="ikona"><use href="#i-…"/></svg> */
export const ikona = (id) => `<svg class="ikona" aria-hidden="true"><use href="#i-${id}"/></svg>`;

/**
 * Svazek vlnitých linek s jednou oranžovou (motiv z bannerů Firmy.cz).
 * y(x) = střed svazku, rozevreni(x) = šířka svazku v px. Souřadnice jsou v px plátna.
 */
export function vlny(svg, { w, h, n = 15, akcent = Math.floor(n / 2) + 2, y, rozevreni, vlneni = 18, sila = 1, linka = 1.6, akcentSira = 3, od = -60, do: doX }) {
  const NS = "http://www.w3.org/2000/svg";
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  doX ??= w + 60;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), s = t - 0.5;
    let d = "";
    for (let x = od; x <= doX; x += 6) {
      const yy = y(x) + vlneni * Math.sin((x / w) * Math.PI * 5.1 + 1.7 + s * 1.4) + s * rozevreni(x);
      d += `${d ? "L" : "M"}${x},${yy.toFixed(1)}`;
    }
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    if (i === akcent) {
      p.setAttribute("class", "akcent");
      p.setAttribute("stroke-width", akcentSira);
      p.style.opacity = 0.9;
      p.style.filter = `drop-shadow(0 0 ${akcentSira * 2.5}px rgba(255, 107, 61, .75))`;
    } else {
      p.setAttribute("class", "linka");
      p.setAttribute("stroke-width", linka);
      p.style.opacity = ((0.07 + 0.17 * (1 - Math.abs(s) * 2)) * sila).toFixed(3);
    }
    svg.append(p);
  }
}

/**
 * Konec vykreslení: počká na písma a obrázky a předá render.mjs kontrolní údaje –
 * obdélníky důležitých prvků ([data-dulezite]), znaky mimo písma a načtená písma.
 */
export async function hotovo() {
  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => (i.onload = i.onerror = r)))));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const text = document.body.innerText;
  const mimo = [...new Set([...text].filter((ch) => !/\s/.test(ch) && !podporovany(ch)))];
  const prvky = [...document.querySelectorAll("[data-dulezite]")].filter((el) => el.getClientRects().length);
  const jmeno = (el) => el.dataset.dulezite || el.dataset.t || el.className;
  const dulezite = prvky.map((el) => {
    const r = el.getBoundingClientRect();
    return { co: jmeno(el), x: r.x, y: r.y, w: r.width, h: r.height };
  });
  // Důležité prvky se nesmí překrývat (kromě vnořených).
  const prekryvy = [];
  prvky.forEach((a, i) => prvky.slice(i + 1).forEach((b) => {
    if (a.contains(b) || b.contains(a)) return;
    const p = a.getBoundingClientRect(), q = b.getBoundingClientRect();
    const sx = Math.min(p.right, q.right) - Math.max(p.left, q.left), sy = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
    if (sx > 1 && sy > 1) prekryvy.push(`${jmeno(a)} × ${jmeno(b)}`);
  }));
  // Písmo každého textu musí být opravdu načtené (jinak by se tiše vykreslilo náhradní).
  const nenactene = new Set();
  for (const el of document.querySelectorAll("body *")) {
    const vlastni = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
    if (!vlastni || !el.getClientRects().length) continue;
    const cs = getComputedStyle(el);
    const pismo = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
    if (!document.fonts.check(`${cs.fontWeight} 40px "${pismo}"`, vlastni) || ![...document.fonts].some((f) => f.family.replace(/"/g, "") === pismo && f.status === "loaded")) nenactene.add(pismo);
  }
  const obrazky = [...document.images].filter((i) => !i.naturalWidth).map((i) => i.getAttribute("src"));
  hotovoResolve({
    text: text.trim(),
    mimo,
    dulezite,
    prekryvy,
    chybiObrazky: obrazky,
    nenactene: [...nenactene],
    fonty: [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, "")),
  });
}
