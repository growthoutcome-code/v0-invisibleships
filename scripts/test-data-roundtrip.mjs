// Verifies the Data sub-tab round-trip keeps the GovCloud report drawn.
import { existsSync, readFileSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.TEST_BASE || "http://localhost:3100";

// The browser path used to be hardcoded to /opt/pw-browsers/chromium, which is
// the container this suite was written in and exists nowhere else — so the
// script could never run on a normal machine. Now: an explicit override wins,
// then that container path if it happens to exist, and otherwise Playwright
// resolves its own install (~/Library/Caches/ms-playwright on macOS), which is
// where `npx playwright install chromium` puts it.
const CONTAINER_CHROMIUM = "/opt/pw-browsers/chromium";
const executablePath = process.env.PW_CHROMIUM
  || (existsSync(CONTAINER_CHROMIUM) ? CONTAINER_CHROMIUM : undefined);

let browser;
try {
  browser = await chromium.launch(executablePath ? { executablePath } : {});
} catch (e) {
  console.error("FAIL: could not launch Chromium.", e.message);
  console.error("      Install it with:  npx playwright install chromium");
  console.error("      Or point at an existing binary:  PW_CHROMIUM=/path/to/chrome node scripts/test-data-roundtrip.mjs");
  process.exit(1);
}
const page = await browser.newPage();
const fail = (m) => { console.error("FAIL:", m); process.exitCode = 1; };

// Wait for the server rather than assuming it is up. `next start &` returns
// immediately and takes a second or so to listen, so running this straight
// after it raced and died with ERR_CONNECTION_REFUSED. Polling here means the
// caller does not have to remember a sleep.
{
  const deadline = Date.now() + 45000;
  let up = false, lastErr;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(BASE + "/data", { method: "HEAD" });
      if (r.ok || r.status === 405) { up = true; break; }
      lastErr = `HTTP ${r.status}`;
    } catch (e) { lastErr = e.message; }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!up) {
    console.error(`FAIL: no server at ${BASE} after 45s (${lastErr}).`);
    console.error(`      Start one first:  npx next start -p 3100 &`);
    console.error(`      Or point elsewhere:  TEST_BASE=http://localhost:3000 node scripts/test-data-roundtrip.mjs`);
    await browser.close();
    process.exit(1);
  }
}

await page.goto(BASE + "/data", { waitUntil: "networkidle" });

// Gate: 4 steps
await page.getByRole("button", { name: /18 or older/i }).click();
// terms: scroll the scrollable box to bottom, then agree
await page.waitForTimeout(400);
await page.evaluate(() => document.querySelectorAll("div,section").forEach((el) => { if (el.scrollHeight > el.clientHeight + 20) el.scrollTop = el.scrollHeight; }));
await page.waitForTimeout(400);
await page.getByRole("button", { name: /I understand and agree/i }).click();
await page.getByRole("button", { name: /^Continue$/i }).click();
await page.getByRole("button", { name: /Enter the Archive/i }).click();
await page.waitForTimeout(800);

// to Data via SPA nav
await page.getByRole("button", { name: /^Data$/i }).first().click().catch(async () => {
  await page.locator("text=DATA").first().click();
});
// wait for report script to draw
await page.waitForFunction(() => (document.getElementById("a_tiles")?.innerHTML.length || 0) > 100, null, { timeout: 20000 });
const t0 = await page.evaluate(() => document.getElementById("a_tiles").innerHTML.length);
console.log("initial tiles:", t0);

// round trip
await page.getByRole("tab", { name: /^Public Health$/i }).click();
await page.waitForTimeout(1200);
const health = await page.evaluate(() => document.body.textContent.includes("Has suicide increased"));
console.log("health tab renders:", health);
if (!health) fail("health tab content missing");
const hiddenTiles = await page.evaluate(() => document.getElementById("a_tiles")?.innerHTML.length ?? -1);
console.log("tiles while on health tab (hidden):", hiddenTiles);

await page.getByRole("tab", { name: /Government Cloud/i }).click();
await page.waitForTimeout(800);
const t1 = await page.evaluate(() => document.getElementById("a_tiles").innerHTML.length);
const heat = await page.evaluate(() => document.getElementById("heat")?.innerHTML.length ?? 0);
console.log("tiles after round-trip:", t1, "| heat:", heat);
if (t1 < 100 || heat < 1000) fail("report wiped after round-trip");

// top-level Timeline sub-tab: verify Health lane exists
await page.getByRole("tab", { name: /^Timeline$/i }).click();
await page.waitForTimeout(600);
const laneF = await page.evaluate(() => {
  const svg = document.querySelector("#tlsvg svg");
  if (!svg) return { svg: false };
  const labels = [...svg.querySelectorAll("text")].map((t) => t.textContent);
  const healthDots = [...svg.querySelectorAll("circle")].filter((c) => +c.getAttribute("cy") > 420).length;
  return { svg: true, hasHealthLabel: labels.includes("Health"), healthDots };
});
console.log("timeline:", JSON.stringify(laneF));
if (!laneF.hasHealthLabel) fail("Health lane label missing on timeline");

// second round-trip for good measure
await page.getByRole("tab", { name: /^Public Health$/i }).click();
await page.waitForTimeout(700);
await page.getByRole("tab", { name: /Government Cloud/i }).click();
await page.waitForTimeout(500);
const t2 = await page.evaluate(() => document.getElementById("a_tiles").innerHTML.length);
console.log("tiles after second round-trip:", t2);
if (t2 < 100) fail("report wiped after second round-trip");

// Pagination: registers show max 5 with journal-style pager; sources paginate too
await page.getByRole("tab", { name: /^Public Health$/i }).click();
await page.waitForTimeout(1200);
const pag = await page.evaluate(() => {
  const sections = [...document.querySelectorAll("section")];
  const bySec = (txt) => sections.find((s) => s.querySelector("h2")?.textContent.includes(txt));
  const count = (s) => s ? [...s.querySelectorAll("ul > li, ol > li")].filter((li) => !li.closest("nav")).length : -1;
  const hasPager = (s) => !!s?.querySelector("nav");
  return {
    trends: { n: count(bySec("What the series show")), pager: hasPager(bySec("What the series show")) },
    claims: { n: count(bySec("Causes, as attributed")), pager: hasPager(bySec("Causes, as attributed")) },
    dq: { n: count(bySec("How much the numbers")), pager: hasPager(bySec("How much the numbers")) },
    overlaps: { n: count(bySec("Overlaps with the Government Cloud")), pager: hasPager(bySec("Overlaps with the Government Cloud")) },
    milestones: { n: count(bySec("Dated milestones")), pager: hasPager(bySec("Dated milestones")) },
    sources: { n: count(bySec("Sources")), pager: hasPager(bySec("Sources")) },
  };
});
console.log("pagination:", JSON.stringify(pag));
for (const [k, v] of Object.entries(pag)) {
  const max = k === "sources" ? 25 : 5;
  if (v.n > max || v.n < 1) fail(`${k}: ${v.n} items on page (max ${max})`);
  if (!v.pager) fail(`${k}: pager missing`);
}
// page 2 of trends shows different items
const first1 = await page.evaluate(() => [...document.querySelectorAll("section")].find((s) => s.querySelector("h2")?.textContent.includes("What the series show"))?.querySelector("li")?.textContent.slice(0, 60));
await page.evaluate(() => {
  const sec = [...document.querySelectorAll("section")].find((s) => s.querySelector("h2")?.textContent.includes("What the series show"));
  [...sec.querySelectorAll("nav a, nav button")].find((b) => b.textContent.trim() === "2")?.click();
});
await page.waitForTimeout(400);
const first2 = await page.evaluate(() => [...document.querySelectorAll("section")].find((s) => s.querySelector("h2")?.textContent.includes("What the series show"))?.querySelector("li")?.textContent.slice(0, 60));
console.log("trends page flip changed content:", first1 !== first2);
if (first1 === first2) fail("trends pager did not change page");

// Disclaimer tiering + timeline narrative + Legislation rename
await page.getByRole("tab", { name: /^Timeline$/i }).click();
await page.waitForTimeout(800);
const tl = await page.evaluate(() => ({
  narrative: document.body.textContent.includes("Three things this timeline shows"),
  hub: document.body.textContent.includes("Where to go next"),
  notice: document.body.textContent.includes("About this data"),
  legislation: document.getElementById("t_tiles")?.textContent.includes("Legislation"),
  noLaw: !document.getElementById("t_tiles")?.textContent.includes("Law"),
  disclaimerLink: [...document.querySelectorAll("button")].some((b) => /full disclaimer/i.test(b.textContent)),
  scopeNote: /Scope:.*international.*Crime track is United States only/s.test(document.body.textContent),
}));
console.log("timeline copy:", JSON.stringify(tl));
for (const k of Object.keys(tl)) if (!tl[k]) fail("timeline." + k);

await page.getByRole("button", { name: /Open Public Health/i }).click();
await page.waitForTimeout(1000);
const hs = await page.evaluate(() => ({
  verdictRenamed: document.body.textContent.includes("Has suicide increased by ~30%?"),
  intlChart: document.body.textContent.includes("Fourteen lines, one way of counting"),
  intlLabels: (() => {
    const want = ["United States","Russia","South Korea","Japan","France","India","Germany","Australia","Canada","China","UK","Israel","West Bank & Gaza","World"];
    const found = want.map((c) => [...document.querySelectorAll("svg text")].find((t) => t.textContent.startsWith(c + " ")));
    if (found.some((t) => !t)) return false;
    // every label must sit inside the drawing area with a finite y
    return found.every((t) => { const y = t.getBBox?.().y; return Number.isFinite(y) && y > 0 && y < 460; });
  })(),
  intlLabelsDistinct: (() => {
    const ys = [...document.querySelectorAll("svg text")]
      .filter((t) => /^(United States|Russia|South Korea|Japan|France|India|Germany|Australia|Canada|China|UK|Israel|West Bank & Gaza|World) /.test(t.textContent))
      .map((t) => Math.round(t.getBBox?.().y ?? -1));
    return new Set(ys).size === ys.length && ys.length === 14;
  })(),
  chartBeforeVerdict: (() => {
    const h = [...document.querySelectorAll("h2,figcaption")];
    const chart = h.findIndex((n) => /^Suicide rates?, 2000/.test(n.textContent));
    const verdict = h.findIndex((n) => n.textContent.includes("Has suicide increased"));
    return chart > -1 && verdict > -1 && chart < verdict;
  })(),
  onlyOneSuicideChart: [...document.querySelectorAll("figcaption")]
    .filter((n) => /suicide rate/i.test(n.textContent)).length === 1,
  chartSummary: document.body.textContent.includes("What the chart shows"),
  changeToggle: [...document.querySelectorAll("button")].some((b) => /Change over period/.test(b.textContent)),
  changeTable: (() => {
    const t = [...document.querySelectorAll("table")].find((x) => /Change in suicide rate by country/.test(x.querySelector("caption")?.textContent || ""));
    return !!t && t.querySelectorAll("tbody tr").length === 14;
  })(),
  usRowShows40: (() => {
    const t = [...document.querySelectorAll("table")].find((x) => /Change in suicide rate by country/.test(x.querySelector("caption")?.textContent || ""));
    const row = t && [...t.querySelectorAll("tbody tr")].find((r) => r.textContent.startsWith("United States"));
    return !!row && /\+40%/.test(row.textContent);
  })(),
  reconciles: document.body.textContent.includes("Why 40% here"),
  headlineNamesMetric: (() => {
    const h = document.querySelector("figcaption span");
    return !!h && /suicide/i.test(h.textContent);
  })(),
  rateExplained: /roughly (32|52),000 deaths/.test(document.body.textContent),
  windowToggle: [...document.querySelectorAll("button")].some((b) => /pandemic/i.test(b.textContent)),
  covidMarker: [...document.querySelectorAll("svg text")].some((t) => t.textContent === "COVID-19"),
  explains2021: document.body.textContent.includes("The dotted ends: what happens after 2021"),
  causesLink: [...document.querySelectorAll("a")].some((a) => /Causes, as attributed/.test(a.textContent)),
  reproducible: document.body.textContent.includes("None of this is privileged information"),
  provenanceModal: [...document.querySelectorAll("button")].some((b) => /How this research was gathered/.test(b.textContent)),
  crisisKept: document.body.textContent.includes("988"),
  longNoteGone: !document.body.textContent.includes("Public health statistics compiled with AI assistance"),
  link: [...document.querySelectorAll("button")].some((b) => /full disclaimer/i.test(b.textContent)),
}));
console.log("health disclaimer:", JSON.stringify(hs));
for (const k of Object.keys(hs)) if (!hs[k]) fail("health." + k);

// Summary sits between the chart and the hub; disclaimer opens as a modal
await page.getByRole("tab", { name: /^Timeline$/i }).click();
await page.waitForTimeout(900);
const order = await page.evaluate(() => {
  const y = (t) => { const el = [...document.querySelectorAll("h2,h3")].find((n) => n.textContent.includes(t)); return el ? el.getBoundingClientRect().top + window.scrollY : -1; };
  const chart = document.querySelector("#tlsvg");
  return { chart: chart ? chart.getBoundingClientRect().top + window.scrollY : -1, summary: y("Three things this timeline shows"), hub: y("Where to go next") };
});
console.log("order:", JSON.stringify(order));
if (!(order.chart < order.summary && order.summary < order.hub)) fail("timeline order chart→summary→hub");

const before = page.url();
await page.getByRole("button", { name: /Read the full disclaimer/i }).click();
await page.waitForTimeout(700);
const modal = await page.evaluate(() => {
  const d = [...document.querySelectorAll('[role="dialog"]')]
    .find((n) => n.textContent.includes("Terms of Use"));
  return {
    open: !!d,
    hasResearch: !!d?.textContent.includes("How the research data was gathered"),
    hasCritical: !!d?.textContent.includes("Critical Disclaimer"),
    hasGrades: !!d?.textContent.includes("What the evidence grades mean"),
  };
});
console.log("disclaimer modal:", JSON.stringify(modal), "url unchanged:", page.url() === before);
if (!modal.open) fail("disclaimer modal did not open");
if (!modal.hasResearch || !modal.hasCritical || !modal.hasGrades) fail("modal missing sections");
if (page.url() !== before) fail("navigated away instead of opening modal");
await page.keyboard.press("Escape");
await page.waitForTimeout(400);

// Phone width: labels must stay legible; the table carries the rest
const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
const pp = await phone.newPage();
await pp.goto(BASE + "/data", { waitUntil: "networkidle" });
await pp.getByRole("button", { name: /18 or older/i }).click();
await pp.waitForTimeout(400);
await pp.evaluate(() => document.querySelectorAll("div,section").forEach((e) => { if (e.scrollHeight > e.clientHeight + 20) e.scrollTop = e.scrollHeight; }));
await pp.waitForTimeout(400);
await pp.getByRole("button", { name: /I understand and agree/i }).click();
await pp.getByRole("button", { name: /^Continue$/i }).click();
await pp.getByRole("button", { name: /Enter the Archive/i }).click();
await pp.waitForTimeout(900);
await pp.goto(BASE + "/data", { waitUntil: "networkidle" });
await pp.waitForTimeout(1600);
await pp.getByRole("tab", { name: /^Public Health$/i }).click();
await pp.waitForTimeout(1800);
const mob = await pp.evaluate(() => {
  const svg = document.querySelector("svg[role=img]");
  const scale = svg ? svg.getBoundingClientRect().width / 760 : 0;
  const labels = [...document.querySelectorAll("svg text")].filter((t) => /^(United States|World) /.test(t.textContent));
  const px = labels.map((t) => parseFloat(getComputedStyle(t).fontSize) * scale);
  const tbl = [...document.querySelectorAll("table")].find((t) => /Change in suicide/.test(t.querySelector("caption")?.textContent || ""));
  return {
    minLabelPx: px.length ? Math.round(Math.min(...px) * 10) / 10 : 0,
    labelled: labels.length,
    noOverflow: svg ? svg.getBoundingClientRect().right <= window.innerWidth + 2 : false,
    tableRows: tbl ? tbl.querySelectorAll("tbody tr").length : 0,
  };
});
console.log("phone:", JSON.stringify(mob));
if (mob.minLabelPx < 9) fail(`phone chart labels ${mob.minLabelPx}px — illegible`);
if (mob.labelled < 2) fail("phone chart lost its US/world labels");
if (!mob.noOverflow) fail("phone chart overflows viewport");
if (mob.tableRows !== 14) fail("phone: change table missing rows");
await phone.close();

// Stage A: clickable series modal, COVID toggle, cross-link
await page.getByRole("tab", { name: /^Public Health$/i }).click();
await page.waitForTimeout(1500);
const stageA = await page.evaluate(async () => {
  const covidBox = [...document.querySelectorAll("input[type=checkbox]")]
    .find((b) => /COVID/i.test(b.closest("label")?.textContent || ""));
  covidBox?.click();
  await new Promise((r) => setTimeout(r, 500));
  const markers = [...document.querySelectorAll("svg text")]
    .filter((t) => /WHO notified|Pandemic declared|First vaccinations|Boosters begin|Emergency phase ends/.test(t.textContent)).length;
  covidBox?.click();
  // click the US line's end label
  const lbl = [...document.querySelectorAll("svg text")].find((t) => t.textContent.startsWith("United States"));
  lbl?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 700));
  const d = [...document.querySelectorAll('[role="dialog"]')].find((n) => /How this is measured/.test(n.textContent));
  const out = {
    covidMarkers: markers,
    modalOpen: !!d,
    modalHasMethod: !!d?.textContent.includes("WHO Global Health Estimates"),
    modalHasCaveat: !!d?.textContent.includes("What to know before quoting it"),
    modalHasSource: !!d?.querySelector('a[href*="worldbank"]'),
    modalRows: d ? d.querySelectorAll("tbody tr").length : 0,
    crossLink: [...document.querySelectorAll("button")].some((b) => /Open the master timeline/.test(b.textContent)),
    palestineCaveat: document.body.textContent.includes("two lowest lines need reading with care"),
  };
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  return out;
});
console.log("stageA:", JSON.stringify(stageA));

// Stage B: the chart must now read past 2021 with a marked national segment
const stageB = await page.evaluate(async () => {
  const svg = document.querySelector("svg[role=img]");
  const xLabels = [...svg.querySelectorAll("text")].map((t) => t.textContent.trim());
  const dotted = [...svg.querySelectorAll("path")].filter((p) => {
    const d = p.getAttribute("stroke-dasharray") || "";
    return d === "6 3" || d === "4 3";
  }).length;
  const lbl = [...svg.querySelectorAll("text")].find((t) => t.textContent.startsWith("United States"));
  lbl?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 700));
  const d = [...document.querySelectorAll('[role="dialog"]')].find((n) => /own statistics/.test(n.textContent));
  const out = {
    reaches2025: xLabels.includes("2025"),
    boundaryRule: xLabels.some((t) => /national statistics/.test(t)),
    dottedSegments: dotted,
    modalShowsRaw: !!d?.textContent.includes("As published"),
    modalShowsScale: !!d?.textContent.includes("so the line joins the WHO series at 2021"),
    modalUS2024: !!d?.textContent.includes("13.7"),
  };
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  return out;
});
console.log("stageB:", JSON.stringify(stageB));
if (!stageB.reaches2025) fail("chart does not reach 2025");
if (!stageB.boundaryRule) fail("2021 boundary rule missing");
if (stageB.dottedSegments < 5) fail(`national segments drawn: ${stageB.dottedSegments}, expected 5`);
if (!stageB.modalShowsRaw || !stageB.modalShowsScale) fail("modal does not disclose raw vs scaled");
if (!stageB.modalUS2024) fail("modal missing US 2024 figure");
// Only the pre-2021 markers can render while the chart ends at 2021; the
// booster and emergency-end markers appear once Stage B extends the range.
// COVID markers render only in the pandemic window since the checkbox was
// removed (Sean, 2026-08-21); the covidWin assertion below covers them.
if (!stageA.modalOpen) fail("series modal did not open");
if (!stageA.modalHasMethod || !stageA.modalHasCaveat || !stageA.modalHasSource) fail("series modal incomplete");
if (stageA.modalRows < 22) fail(`series modal year rows: ${stageA.modalRows}`);
if (!stageA.crossLink) fail("timeline cross-link missing");
if (!stageA.palestineCaveat) fail("Israel/Palestine caveat missing");

// The change view's headline must also name what is being measured
await page.getByRole("tab", { name: /^Public Health$/i }).click();
await page.waitForTimeout(1400);
const cv = await page.evaluate(async () => {
  const h = document.querySelector("figcaption span");
  const active = [...document.querySelectorAll("button")]
    .find((b) => /Change over period/.test(b.textContent))?.getAttribute("aria-pressed");
  return {
    headline: h?.textContent || "",
    namesMetric: /suicide/i.test(h?.textContent || ""),
    defaultsToChange: active === "true",
    // the hardcoded 40% must be gone: the figure is computed now
    headlineHasComputedPct: /\d+% while the world fell \d+%/.test(h?.textContent || ""),
  };
});
console.log("change-view headline:", JSON.stringify(cv));
if (!cv.namesMetric) fail("change-view headline does not say what it measures");
if (!cv.defaultsToChange) fail("chart does not default to the change view");
if (!cv.headlineHasComputedPct) fail("headline percentages not computed from data");

// Overdose chart: the fault being guarded against is a chart that opens at the
// 2022 peak and therefore shows only the decline. It must carry the rise too.
const od = await page.evaluate(() => {
  const figs = [...document.querySelectorAll("figure")];
  const fig = figs.find((f) => /overdose/i.test(f.querySelector("figcaption")?.textContent || ""));
  if (!fig) return { found: false };
  const cap = fig.querySelector("figcaption")?.textContent || "";
  const svg = fig.querySelector("svg[viewBox]");
  const pts = svg ? svg.querySelectorAll("circle").length / 2 : 0; // mark + hit target
  const xLabels = svg
    ? [...svg.querySelectorAll("text")].map((t) => t.textContent).filter((t) => /^(19|20)\d\d$/.test(t))
    : [];
  const years = xLabels.map(Number);
  // hollow point = provisional 2025, filled = final
  const hollow = svg
    ? [...svg.querySelectorAll("circle")].filter((c) => /background/.test(c.getAttribute("fill") || "")).length
    : 0;
  const section = fig.closest("section")?.textContent || "";
  return {
    found: true,
    caption: cap,
    points: pts,
    minYear: years.length ? Math.min(...years) : null,
    maxYear: years.length ? Math.max(...years) : null,
    hollow,
    // the copy must state the rise, not just the fall
    statesRise: /16,849/.test(section) && /107,941/.test(section),
    statesFall: /26\.2%/.test(section),
    // provisional-vs-final vintage caveat present
    vintageCaveat: /provisional/i.test(section) && /11\.9%/.test(section),
    despairFraming: /despair/i.test(section),
  };
});
console.log("overdose:", JSON.stringify(od));
if (!od.found) fail("overdose chart not found");
if (od.points < 25) fail(`overdose chart points: ${od.points}, expected the full 1999-2025 series`);
if (od.minYear === null || od.minYear > 2001) fail(`overdose chart starts at ${od.minYear}, expected ~1999`);
if (od.maxYear !== 2025) fail(`overdose chart ends at ${od.maxYear}, expected 2025`);
if (od.hollow < 1) fail("provisional 2025 point is not drawn hollow");
if (!od.statesRise) fail("overdose copy does not state the rise (1999 and 2022 figures)");
if (!od.statesFall) fail("overdose copy does not state the 2024 decline");
if (!od.vintageCaveat) fail("overdose copy missing the provisional-vs-final vintage caveat");

// Same phone-legibility guard the international chart has: the 720-wide viewBox
// scales to ~0.5x on a 390px screen, which silently halves every label.
await page.setViewportSize({ width: 390, height: 900 });
await page.waitForTimeout(1400);
const odPhone = await page.evaluate(() => {
  const f = [...document.querySelectorAll("figure")]
    .find((x) => /overdose deaths, 1999/.test(x.querySelector("figcaption")?.textContent || ""));
  if (!f) return { found: false };
  const svg = f.querySelector("svg[viewBox]");
  const r = svg.getBoundingClientRect();
  const scale = r.width / svg.viewBox.baseVal.width;
  const sizes = [...svg.querySelectorAll("text")].map((t) => +(t.getAttribute("font-size") || 11) * scale);
  return {
    found: true,
    minPx: +Math.min(...sizes).toFixed(1),
    labels: sizes.length,
    overflow: r.right > document.documentElement.clientWidth + 1,
  };
});
console.log("overdose phone:", JSON.stringify(odPhone));
if (!odPhone.found) fail("overdose chart missing at phone width");
if (odPhone.minPx < 9) fail(`overdose chart label paints at ${odPhone.minPx}px on a phone`);
if (odPhone.overflow) fail("overdose chart overflows the phone viewport");
await page.setViewportSize({ width: 1280, height: 900 });

// One reading measure across the site. Prose had drifted to 70/74/75/80/85ch
// and unconstrained; `.measure` is now the single token. This guards the drift
// coming back one ad-hoc max-w-[Nch] at a time.
const measures = await page.evaluate(() => {
  const main = document.querySelector("main");
  const w = [...main.querySelectorAll("p.measure.body-copy")]
    .filter((e) => e.getBoundingClientRect().width > 400)
    .map((e) => Math.round(e.getBoundingClientRect().width));
  // Resolve 80ch in the font that ACTUALLY loaded, rather than hardcoding a
  // pixel count. `ch` is font-relative: with the site's webfonts 80ch is about
  // 975px, and in an environment where Google Fonts is blocked the fallback
  // stack gives about 880px. A fixed range encodes whichever environment wrote
  // the test — this one did, and it failed on a machine where the fonts loaded
  // correctly. The probe inherits main's computed font, so it is right either way.
  // The probe must carry the SAME computed font as the paragraphs: `ch` scales
  // with font-size, and body-copy sets a larger one than main's default, so a
  // bare div reports a narrower 80ch than the prose actually uses.
  const sample = [...main.querySelectorAll("p.measure.body-copy")]
    .find((e) => e.getBoundingClientRect().width > 400);
  const probe = document.createElement("p");
  probe.className = sample ? sample.className : "measure body-copy";
  probe.style.cssText = "width:80ch;max-width:none;position:absolute;visibility:hidden;top:-9999px";
  (sample?.parentElement || main).appendChild(probe);
  const expected = Math.round(probe.getBoundingClientRect().width);
  probe.remove();
  return { widths: [...new Set(w)], n: w.length, expected };
});
console.log("measure:", JSON.stringify(measures));
if (measures.n === 0) fail("no .measure prose found on the Data section");
// The real guard: prose had drifted to 70/74/75/80/85ch and unconstrained.
// Uniformity is the property that matters and it is font-independent.
if (measures.widths.length > 1) fail(`prose measure is not uniform: ${measures.widths.join(", ")}`);
if (Math.abs(measures.widths[0] - measures.expected) > 8) {
  fail(`prose measure ${measures.widths[0]}px, but 80ch resolves to ${measures.expected}px here`);
}
const stray = await page.evaluate(() =>
  [...document.querySelectorAll('[class*="max-w-["]')]
    .map((e) => (e.className || "").toString().match(/max-w-\[\d+ch\]/g) || [])
    .flat().filter((c) => c !== "max-w-[46ch]"));
if (stray.length) fail(`ad-hoc ch widths still present: ${[...new Set(stray)].join(", ")} — use .measure`);

// ---- Crime sub-tab -------------------------------------------------------
// The section's point is that two official measures disagree, so the guard is
// that BOTH series render and neither is silently reconciled away.
await page.setViewportSize({ width: 1440, height: 1000 });
await page.getByRole("tab", { name: /^Crime$/i }).click();
await page.waitForTimeout(2500);
const crime = await page.evaluate(() => {
  const main = document.querySelector("main");
  const fig = [...main.querySelectorAll("figure")]
    .find((f) => /two official measures/i.test(f.querySelector("figcaption")?.textContent || ""));
  const svg = fig?.querySelector("svg[viewBox]");
  const drawn = svg ? [...svg.querySelectorAll("path")].filter((p) => p.getAttribute("stroke") !== "transparent") : [];
  const heads = [...main.querySelectorAll("h2, h3")].map((h) => h.textContent.trim());
  const txt = main.innerText;
  return {
    chart: !!svg,
    // count series GROUPS, not paths: each series now draws a solid path plus
    // a background-overdraw and a dotted path for every un-vetted stretch
    series: svg ? [...svg.querySelectorAll("g")].filter((g) => g.getAttribute("style")?.includes("cursor")).length : 0,
    // dotted must mean UN-VETTED (not Tier A), never series identity
    dotted: svg ? [...svg.querySelectorAll("path[stroke-dasharray]")].length : 0,
    identitySolid: svg ? [...svg.querySelectorAll("g[style*=cursor] > path:first-child")]
      .every((x) => !x.getAttribute("stroke-dasharray")) : false,
    labels: svg ? [...svg.querySelectorAll("text")].map((t) => t.textContent).filter((t) => /FBI|CDC/.test(t)) : [],
    verdict: heads.some((h) => /Is crime rising or falling/i.test(h)),
    notCounted: heads.some((h) => /What nobody counts/i.test(h)),
    lanes: [...main.querySelectorAll("figure figcaption")].some((f) => /Six kinds of harm/i.test(f.textContent)),
    sweeps: heads.some((h) => /Enforcement in sweeps/i.test(h)),
    clearance: heads.some((h) => /homicides are cleared/i.test(h)),
    dq: heads.some((h) => /numbers can be trusted/i.test(h)),
    // the three figures the section turns on
    spike2020: /29\.4%/.test(txt),
    low2025: /4\.1 per 100,000/.test(txt),
    ncvsGap: /23\.3 per 1,000/.test(txt) && /48%/.test(txt),
    crossLink: /procurement and legislation record/i.test(txt),
    noOverlay: !/\bcaused by\b/i.test(txt),
    // boolean, not the whole page: logging the text made the run unreadable
    legendExplained: /Dotted stretches are years that are\s+not Tier A/.test(txt.replace(/\n/g, " ")),
  };
});
console.log("crime:", JSON.stringify(crime));
if (!crime.chart) fail("crime landing chart missing");
if (crime.series !== 2) fail(`crime chart drew ${crime.series} series, expected 2 (FBI and CDC)`);
if (!crime.dotted) fail("no dotted stretches — un-vetted years must be dotted, as on the health charts");
if (!crime.identitySolid) fail("a series' main path is dashed; dashing must mean un-vetted, not series identity");
if (!crime.legendExplained) fail("dotted-line convention is not explained beneath the chart");
if (crime.labels.length < 2) fail("crime chart series are not labelled");
if (!crime.verdict) fail("crime verdict heading missing");
if (!crime.notCounted) fail("'What nobody counts' section missing");
// Chart-first layout (Sean, 2026-08-21): the lane chart must be the first
// section, with a tier-chipped themes block directly under it, ABOVE the
// "What nobody counts" register.
const layout = await page.evaluate(() => {
  const col = document.getElementById("crime-root");
  const fig = [...col.querySelectorAll("figure")].find((f) => /Six kinds of harm/i.test(f.querySelector("figcaption")?.textContent || ""));
  // themes render as h3 under each chart (h2 is reserved for sections, so the
  // sidebar does not list a chart's own explainer as a destination)
  const themesH = fig?.closest("section")?.querySelector("h3");
  const themeRows = themesH ? [...themesH.parentElement.querySelectorAll("li")] : [];
  const y = (el) => el ? el.getBoundingClientRect().top + window.scrollY : -1;
  return {
    chartY: y(fig), themesY: y(themesH),
    themeCount: themeRows.length,
    themesChipped: themeRows.length > 0 && themeRows.every((r) => r.querySelector("span[title]")),
    bridge: themeRows.some((r) => /nobody counts/i.test(r.textContent)),
  };
});
console.log("layout:", JSON.stringify(layout));
if (layout.chartY < 0) fail("lane chart missing");
if (!(layout.chartY < layout.themesY)) fail("the chart's plain-language block must sit under the chart");
if (layout.themeCount < 3) fail(`theme callouts: ${layout.themeCount}, expected 3+`);
if (!layout.themesChipped) fail("theme callouts missing tier chips");
if (!layout.bridge) fail("themes block missing the bridge line into 'What nobody counts'");
if (!crime.lanes) fail("indexed lane chart missing");
if (!crime.sweeps) fail("sweeps register missing");
if (!/Transnational repression/.test(await page.evaluate(() => document.querySelector("main").innerText))) fail("transnational repression section missing");
const trChk = await page.evaluate(() => {
  const t = document.querySelector("main").innerText;
  return {
    fbiDef: /reach beyond their borders to intimidate/.test(t),
    tactics: /Attempted kidnapping and murder/.test(t),
    fhCount: /1,375/.test(t),
    notCountedByGov: /Publishes NO\s+statistics|publishes no statistics/i.test(t.replace(/\n/g, " ")),
    discipline: /does not establish who uses them in any uncharged case/.test(t),
  };
});
console.log("tr:", JSON.stringify(trChk));
for (const [k, v] of Object.entries(trChk)) if (!v) fail("tr." + k);
if (!crime.clearance) fail("clearance section missing");
if (!crime.dq) fail("crime data-quality register missing");
if (!crime.spike2020) fail("2020 spike figure (29.4%) missing");
if (!crime.low2025) fail("2025 record-low rate (4.1 per 100,000) missing");
if (!crime.ncvsGap) fail("NCVS divergence figures missing — that gap is the section's finding");
if (!crime.crossLink) fail("crime -> timeline cross-link missing");

// Round 2: lane-chart connected legend, arrests chart, accomplishments.
const r2 = await page.evaluate(() => {
  const main = document.querySelector("main");
  const t = main.innerText;
  const laneFig = [...main.querySelectorAll("figure")].find((f) => /Six kinds of harm/i.test(f.querySelector("figcaption")?.textContent || ""));
  // the legend is the FIRST list, above the svg; the per-lane summary list
  // below the plot also contains buttons and must not be counted here
  const laneLegend = laneFig ? [...(laneFig.querySelector("ul")?.querySelectorAll("button") || [])] : [];
  const arrestsFig = [...main.querySelectorAll("figure")].find((f) => /machine peaked in 1997/i.test(f.querySelector("figcaption")?.textContent || ""));
  const heads = [...main.querySelectorAll("h2, h3")].map((h) => h.textContent.trim());
  return {
    laneLegendEntries: laneLegend.length,
    laneLegendPressable: laneLegend.length > 0 && laneLegend.every((b) => b.hasAttribute("aria-pressed")),
    // the corner cluster must be gone: no lane-name text nodes inside the lane SVG
    noCornerLabels: laneFig ? ![...laneFig.querySelectorAll("svg text")].some((x) => /Missing persons|Defamation/.test(x.textContent)) : false,
    arrestsChart: !!arrestsFig?.querySelector("svg[viewBox]"),
    arrestsPeak: /15\.28|15,284/.test(t),
    arrestsFullRecord: /Show the full record \(1980/.test(t),
    accomplishments: heads.some((h) => /Law enforcement accomplishments/i.test(h)),
    accRescue: /180 trafficking\s+victims|rescued 180/.test(t.replace(/\n/g, " ")),
    accKinds: /OUTCOME/i.test(t) && /ACTIVITY/i.test(t) && /COMMITMENT/i.test(t),
    accDiscipline: /start of a process, not the end/.test(t),
  };
});
console.log("round2:", JSON.stringify(r2));
if (r2.laneLegendEntries !== 6) fail(`lane legend entries: ${r2.laneLegendEntries}, expected 6`);
if (!r2.laneLegendPressable) fail("lane legend entries are not interactive");
if (!r2.noCornerLabels) fail("lane chart still paints corner end-labels");
if (!r2.arrestsChart) fail("arrests chart missing");
if (!r2.arrestsPeak) fail("1997 arrests peak figure missing");
if (!r2.arrestsFullRecord) fail("arrests full-record toggle missing");
if (!r2.accomplishments) fail("accomplishments section missing");
if (!r2.accRescue) fail("World Cup rescue outcome missing from accomplishments");
if (!r2.accKinds) fail("outcome/activity/commitment kinds not marked");
if (!r2.accDiscipline) fail("accomplishments discipline line missing");

// Round 3 — break-ins and the offence nobody records (Sean, 2026-08-21:
// "have home invasions increased in the US and abroad?" / "are they documented
// or labelled as a burglary?").
//
// The guards worth having are the ones protecting the MEASUREMENT discipline,
// not the prose: a lane whose basis changed must be drawn as two runs, and its
// summary must state each half rather than quote one percentage across the break.
const burg = await page.evaluate(() => {
  const main = document.querySelector("main");
  const t = main.innerText.replace(/\n/g, " ");
  const laneFig = [...main.querySelectorAll("figure")]
    .find((f) => /Six kinds of harm/i.test(f.querySelector("figcaption")?.textContent || ""));
  const laneSvg = laneFig?.querySelector("svg[viewBox]");
  // a lane group's FIRST path is its main line; a declared basis change splits
  // it into two subpaths, so the d attribute carries two move commands
  const mainPaths = laneSvg
    ? [...laneSvg.querySelectorAll("g[style*=cursor] > path:first-child")]
        .map((x) => (x.getAttribute("d") || "").match(/M/g)?.length || 0)
    : [];
  const burgFig = [...main.querySelectorAll("figure")]
    .find((f) => /one code, five countries/i.test(f.querySelector("figcaption")?.textContent || ""));
  const burgLegend = burgFig ? [...(burgFig.querySelector("ul")?.querySelectorAll("button") || [])]
    .map((b) => b.textContent.trim()) : [];
  const burgSvg = burgFig?.querySelector("svg[viewBox]");
  return {
    splitLanes: mainPaths.filter((n) => n > 1).length,
    // the break is marked on the plot, not merely implied by the gap
    breakMarker: laneSvg ? [...laneSvg.querySelectorAll("line[stroke-dasharray='2 6']")].length : 0,
    // the summary row states both halves instead of one number across the break
    twoBasisSummary: /2000.2019: .53% \(SRS\)/.test(t) && /2020.2024: .26% \(NIBRS estimates\)/.test(t),
    intlChart: !!burgSvg,
    intlCountries: burgLegend.length,
    // France is excluded on the publisher's own statement — it must not be drawn
    franceAbsent: !burgLegend.some((n) => /France/i.test(n)),
    franceExplained: /no correspondence between the French classification/i.test(t),
    // the direct answer to the question, with the Canadian statement in it
    answerHeading: [...main.querySelectorAll("h3")].some((h) => /recorded as a home invasion/i.test(h.textContent)),
    statcan: /not captured directly by its national survey/i.test(t),
    victoriaSplit: /105 offences filed under aggravated burglary and 87 under serious assault/i.test(t),
    // the 2026-08-21 re-check: the classification's own words, the Michigan
    // law-vs-statistics case, and the one measurement of the occupied case
    anzsoc: /inclusion term/i.test(t),
    michigan: /Michigan/.test(t) && /statutory name/i.test(t),
    onsAtHome: /over half of domestic burglaries where the offender got inside/i.test(t),
    stale: /most recent published figure anywhere/i.test(t),
    // a paragraph drawing on five publishers must link all five, not one
    answerSources: (() => {
      const h = [...main.querySelectorAll("h3")].find((x) => /recorded as a home invasion/i.test(x.textContent));
      const p = h?.parentElement?.querySelector("p:last-of-type");
      return p ? p.querySelectorAll("a").length : 0;
    })(),
    // the register entry and the archiving argument
    nc08: /Home invasion, as an offence/i.test(t),
    unodcGone: /withdrawn burglary as a retrievable indicator/i.test(t),
    // the reporting-rate collapse is the caveat every burglary trend needs
    reporting: /40\.7%/.test(t) && /58\.8%/.test(t),
  };
});
console.log("burglary:", JSON.stringify(burg));
if (burg.splitLanes !== 1) fail(`lanes drawn with a basis break: ${burg.splitLanes}, expected exactly 1 (burglary)`);
if (!burg.breakMarker) fail("the burglary lane's basis change is not marked on the plot");
if (!burg.twoBasisSummary) fail("burglary summary quotes one percentage across a basis change");
if (!burg.intlChart) fail("international burglary chart missing");
if (burg.intlCountries !== 5) fail(`international burglary legend: ${burg.intlCountries}, expected 5`);
if (!burg.franceAbsent) fail("France is drawn on a chart its own publisher says it does not belong on");
if (!burg.franceExplained) fail("France's exclusion is not explained");
if (!burg.answerHeading) fail("the home-invasion answer block is missing");
if (!burg.statcan) fail("Statistics Canada's own statement is missing from the answer");
if (!burg.victoriaSplit) fail("the Victoria split-across-two-offence-families case is missing");
if (!burg.anzsoc) fail("ANZSOC's 'inclusion term' wording is missing — it is the mechanism, not a flourish");
if (!burg.michigan) fail("the Michigan law-vs-statistics case is missing");
if (!burg.onsAtHome) fail("the ONS occupied-burglary share is missing");
if (!burg.stale) fail("the recency re-check is not stated — a seven-year-old figure must say so");
if (burg.answerSources < 4) fail(`answer cites ${burg.answerSources} sources, expected 5 (one per publisher)`);
if (!burg.nc08) fail("nc08 (home invasion) missing from the register");
if (!burg.unodcGone) fail("UNODC's withdrawal of the burglary indicator is not recorded");
if (!burg.reporting) fail("the burglary reporting-rate collapse (58.8% -> 40.7%) is missing");

// Round 4 — incarceration (Sean, 2026-08-22: can the penal system show a rise
// or decline that arrests could not?).
//
// The guards protect the same discipline as the burglary lane: a series whose
// publisher declares it non-comparable must be BROKEN, not drawn through; a
// dated international table must never become a chart; and the section's rule
// is chart first, plain-language block underneath.
const inc = await page.evaluate(() => {
  const main = document.querySelector("main");
  const t = main.innerText.replace(/\n/g, " ");
  const heads = [...main.querySelectorAll("h2, h3")].map((h) => h.textContent.trim());
  const fig = [...main.querySelectorAll("figure")]
    .find((f) => /the US penal system/i.test(f.querySelector("figcaption")?.textContent || ""));
  const svg = fig?.querySelector("svg[viewBox]");
  const legend = fig ? [...(fig.querySelector("ul")?.querySelectorAll("button") || [])]
    .map((b) => b.textContent.trim()) : [];
  const mainPaths = svg
    ? [...svg.querySelectorAll("g[style*=cursor] > path:first-child")]
        .map((x) => (x.getAttribute("d") || "").match(/M/g)?.length || 0)
    : [];
  const y = (el) => el ? el.getBoundingClientRect().top + window.scrollY : -1;
  const section = fig?.closest("section");
  const themesH = section?.querySelector("h3");
  const themeRows = themesH ? [...themesH.parentElement.querySelectorAll("li")] : [];
  const arrestsFig = [...main.querySelectorAll("figure")]
    .find((f) => /machine peaked in 1997/i.test(f.querySelector("figcaption")?.textContent || ""));
  const detFig = [...main.querySelectorAll("figure")]
    .find((f) => /Where a sweep goes/i.test(f.querySelector("figcaption")?.textContent || ""));
  return {
    chart: !!svg,
    measures: legend.length,
    // the widest line must break where BJS says its own figures stop comparing
    splitSeries: mainPaths.filter((n) => n > 1).length,
    breakMarker: svg ? [...svg.querySelectorAll("line[stroke-dasharray='2 6']")].length : 0,
    // shares the section window, so it must NOT declare the opt-out
    sharedWindow: fig ? !fig.hasAttribute("data-own-window") : false,
    // y axis must be legible at this scale, not a raw 7300000
    axisMillions: svg ? [...svg.querySelectorAll("text")]
      .some((x) => /^\d+\.\d+M$/.test(x.textContent)) : false,
    // chart first, plain-language block under it (Sean's standing rule)
    chartAboveThemes: y(fig) > 0 && y(fig) < y(themesH),
    themeCount: themeRows.length,
    themesChipped: themeRows.length > 0 && themeRows.every((r) => r.querySelector("span[title]")),
    // the pointer is section-level now (one per page, not one per chart)
    disclaimer: [...document.getElementById("crime-root").querySelectorAll("button")]
      .some((b) => /full disclaimer/i.test(b.textContent)),
    // ordering: arrests -> incarceration -> ICE detention
    order: y(arrestsFig) < y(fig) && y(fig) < y(detFig),
    // the findings themselves
    peak: /1,615,487/.test(t),
    trough: /1,205,087/.test(t),
    risingAgain: /2\.1% in 2022 and 2\.0% in 2023/.test(t),
    seriesEnds: /forthcoming/i.test(t) && /2024 or 2025/.test(t),
    jailComposition: /Seventy percent of people in American jails/i.test(t)
      && /convicted jail population fell 29%/i.test(t),
    capacityStopped: heads.some((h) => /nobody counts/i.test(h)) && /Prison capacity, since 2016/i.test(t),
    // international is a dated table, never a chart
    intlTable: heads.some((h) => /Incarceration internationally/i.test(h)),
    intlNoChart: (() => {
      // Now an h3 sub-block under "Who is held" rather than its own section, so
      // closest("section") would climb to the parent and find that chart. Scope
      // to the block itself: from its heading to the end of its container.
      const h = [...main.querySelectorAll("h2, h3")]
        .find((x) => /Incarceration internationally/i.test(x.textContent));
      if (!h) return false;
      const block = h.parentElement;
      return block.querySelectorAll("svg[viewBox]").length === 0;
    })(),
    intlDated: (t.match(/as at /g) || []).length >= 10,
    notTopJailer: /no longer the world's top jailer/i.test(t) || /It is fourth/i.test(t),
    chinaCaveat: /at least 2,340,000/.test(t),
    // the ICE figure the site could not support has gone
    noUnsourced73400: !/73,400/.test(t),
    iceInJails: /7,000 at midyear/i.test(t) || /ICE detainees inside the jail count/i.test(t),
  };
});
console.log("incarceration:", JSON.stringify(inc));
if (!inc.chart) fail("incarceration chart missing");
if (inc.measures !== 3) fail(`incarceration legend: ${inc.measures}, expected 3`);
if (inc.splitSeries !== 1) fail(`series drawn with a declared break: ${inc.splitSeries}, expected exactly 1`);
if (!inc.breakMarker) fail("the correctional-population basis break is not marked on the plot");
if (!inc.sharedWindow) fail("incarceration chart fits the shared window and must not declare data-own-window");
if (!inc.axisMillions) fail("y axis is not formatted in millions — '7300000' is not a legible label");
if (!inc.chartAboveThemes) fail("chart must sit ABOVE its plain-language block");
if (inc.themeCount < 4) fail(`incarceration themes: ${inc.themeCount}, expected 4+`);
if (!inc.themesChipped) fail("incarceration themes missing tier chips");
if (!inc.disclaimer) fail("the Crime section does not link the disclaimer");
if (!inc.order) fail("section order must be arrests -> incarceration -> ICE detention");
if (!inc.peak) fail("2009 prison peak (1,615,487) missing");
if (!inc.trough) fail("2021 prison trough (1,205,087) missing");
if (!inc.risingAgain) fail("the post-2021 rise is not stated");
if (!inc.seriesEnds) fail("the series ending before 2024 is not stated — that is the finding");
if (!inc.jailComposition) fail("the jail composition inversion is missing");
if (!inc.capacityStopped) fail("nc09 (prison capacity discontinued after 2016) missing");
if (!inc.intlTable) fail("international incarceration panel missing");
if (!inc.intlNoChart) fail("international incarceration must be a dated table, NOT a chart");
if (!inc.intlDated) fail("international rows must each carry their own reference date");
if (!inc.notTopJailer) fail("the US-is-fourth correction is missing");
if (!inc.chinaCaveat) fail("China's 'at least 2,340,000' caveat missing");
if (!inc.noUnsourced73400) fail("73,400 still appears — no source on the site supports that figure");
if (!inc.iceInJails) fail("ICE-detainees-inside-the-jail-count reconciliation missing");

// Deltas (Sean, 2026-08-22): both enforcement charts must offer levels vs
// year-over-year change. The rule that matters is the one about breaks — a
// percentage computed across a declared change of measurement, or across a
// publication gap, is not a change in the world and must not be drawn.
for (const [label, cap] of [["incarceration", /the US penal system/i], ["arrests", /machine peaked in 1997/i]]) {
  const before = await page.evaluate((capSrc) => {
    const re = new RegExp(capSrc, "i");
    const fig = [...document.querySelectorAll("main figure")]
      .find((f) => re.test(f.querySelector("figcaption")?.textContent || ""));
    const btns = fig ? [...fig.parentElement.querySelectorAll("button")]
      .filter((b) => /^(Levels|Year-over-year change)$/.test(b.textContent.trim())) : [];
    return { toggle: btns.length, pressed: btns.find((b) => b.getAttribute("aria-pressed") === "true")?.textContent.trim() };
  }, cap.source);
  if (before.toggle !== 2) fail(`${label}: levels/change toggle missing (found ${before.toggle} buttons)`);
  if (before.pressed !== "Levels") fail(`${label}: chart must open on Levels, opened on "${before.pressed}"`);

  if (before.toggle !== 2) {
    // Nothing further in this loop can mean anything without the chart, and
    // throwing here would abort the whole suite and hide every later check.
    console.log(`${label} change view: skipped, chart or toggle absent`);
    continue;
  }

  await page.evaluate((capSrc) => {
    const re = new RegExp(capSrc, "i");
    const fig = [...document.querySelectorAll("main figure")]
      .find((f) => re.test(f.querySelector("figcaption")?.textContent || ""));
    [...(fig?.parentElement?.querySelectorAll("button") || [])]
      .find((b) => b.textContent.trim() === "Year-over-year change")?.click();
  }, cap.source);
  await page.waitForTimeout(400);

  const after = await page.evaluate((capSrc) => {
    const re = new RegExp(capSrc, "i");
    const fig = [...document.querySelectorAll("main figure")]
      .find((f) => re.test(f.querySelector("figcaption")?.textContent || ""));
    const svg = fig?.querySelector("svg[viewBox]");
    const ticks = svg ? [...svg.querySelectorAll("text")].map((x) => x.textContent.trim()) : [];
    return {
      // the axis must now be signed percentages with zero on it
      pctTicks: ticks.filter((x) => /^[+−-]?\d+(\.\d+)?%$/.test(x)).length,
      hasZero: ticks.some((x) => /^0%?$/.test(x)),
      signed: ticks.some((x) => /^-|^−/.test(x)) || ticks.some((x) => /^\+/.test(x)),
      explained: /Showing year-over-year change/i.test(fig?.parentElement.innerText || ""),
      drawn: svg ? [...svg.querySelectorAll("path")].filter((x) => x.getAttribute("stroke") !== "transparent").length : 0,
    };
  }, cap.source);
  console.log(`${label} change view:`, JSON.stringify(after));
  if (after.pctTicks < 3) fail(`${label}: change view y-axis is not in percent (${after.pctTicks} pct ticks)`);
  if (!after.hasZero) fail(`${label}: change view must put zero on the axis, or a fall reads as a rise`);
  if (!after.explained) fail(`${label}: change view does not say what it is showing`);
  if (!after.drawn) fail(`${label}: change view drew nothing`);

  // back to levels so later assertions see the default chart
  await page.evaluate((capSrc) => {
    const re = new RegExp(capSrc, "i");
    const fig = [...document.querySelectorAll("main figure")]
      .find((f) => re.test(f.querySelector("figcaption")?.textContent || ""));
    [...(fig?.parentElement?.querySelectorAll("button") || [])]
      .find((b) => b.textContent.trim() === "Levels")?.click();
  }, cap.source);
  await page.waitForTimeout(300);
}

// The break rule, checked arithmetically rather than by eye. The correctional
// line declares a basis change after 2021, so differencing 2022 against 2021
// would fabricate a figure across two different measurements. Verified against
// the published chart doc and the drawn geometry: the change view must hold
// exactly one fewer point than consecutive-year differencing would give.
const brkRule = await page.evaluate(async () => {
  const doc = await (await fetch("/data/crime/charts/incarceration_over_time.json")).json();
  const s = doc.series.find((x) => x.break_after != null);
  if (!s) return { ok: false, why: "no series declares a break" };
  const years = s.points.map((p) => p.year);
  const naive = years.filter((y, i) => i > 0 && y - years[i - 1] === 1).length;
  const honest = years.filter((y, i) =>
    i > 0 && y - years[i - 1] === 1 && years[i - 1] !== s.break_after).length;
  return { ok: naive - honest === 1, naive, honest, breakAfter: s.break_after, name: s.name };
});
console.log("break rule:", JSON.stringify(brkRule));
if (!brkRule.ok) fail(`change view would difference across the declared break: ${JSON.stringify(brkRule)}`);

// Round 5 — reports of the unexplained (Sean, 2026-08-22), and the disclaimer
// consolidation. The rule being protected: the ABSENCES carry the same weight
// as the lines, and the caveat grammar lives in the disclaimer rather than
// being repeated under every chart.
const anom = await page.evaluate(() => {
  const main = document.querySelector("main");
  const t = main.innerText.replace(/\n/g, " ");
  const fig = [...main.querySelectorAll("figure")]
    .find((f) => /Reports of the unexplained/i.test(f.querySelector("figcaption")?.textContent || ""));
  const legend = fig ? [...(fig.querySelector("ul")?.querySelectorAll("button") || [])]
    .map((b) => b.textContent.trim()) : [];
  const sec = fig?.closest("section");
  const themesH = sec ? [...sec.querySelectorAll("h3")].find((h) => /What the chart shows/i.test(h.textContent)) : null;
  const rows = themesH ? [...themesH.parentElement.querySelectorAll("li")] : [];
  return {
    chart: !!fig?.querySelector("svg[viewBox]"),
    lanes: legend.length,
    themeCount: rows.length,
    // the three absences must be stated in the plain-language block itself
    saysHomeInvasionAbsent: rows.some((r) => /no country counts it as an offence/i.test(r.textContent)),
    saysNoUsSurvey: rows.some((r) => /No United States federal survey asks about hallucinations/i.test(r.textContent)),
    saysBeliefNotExperience: rows.some((r) => /BELIEF, not experience/i.test(r.textContent)),
    saysReportingNotEvents: rows.some((r) => /reporting system being built/i.test(r.textContent)),
    // and the chart must refuse to imply the lanes corroborate each other
    saysNoRelation: rows.some((r) => /Nothing here establishes a relationship/i.test(r.textContent)),
    nc11: /Anomalous EXPERIENCE, as opposed to belief/i.test(t),
    nc12: /Hallucinations, in the United States/i.test(t),
    pewMode: /not clear whether those earlier results can be directly compared/i.test(t)
      || /declared its own two readings incomparable/i.test(t)
      || /moved from telephone to an online panel/i.test(t),
  };
});
console.log("anomalies:", JSON.stringify(anom));
if (!anom.chart) fail("anomalies chart missing");
if (anom.lanes !== 4) fail(`anomalies legend: ${anom.lanes}, expected 4`);
if (anom.themeCount < 5) fail(`anomalies plain-language rows: ${anom.themeCount}, expected 5+`);
if (!anom.saysHomeInvasionAbsent) fail("the home-invasion absence is not stated in the plain-language block");
if (!anom.saysNoUsSurvey) fail("the missing US hallucination survey is not stated");
if (!anom.saysBeliefNotExperience) fail("the belief-vs-experience distinction is not stated");
if (!anom.saysReportingNotEvents) fail("the UAP lane is not labelled as reporting rather than events");
if (!anom.saysNoRelation) fail("the chart does not refuse the co-occurrence reading");
if (!anom.nc11) fail("nc11 (anomalous experience) missing from the register");
if (!anom.nc12) fail("nc12 (US hallucination survey) missing from the register");

// The disclaimer consolidation: the grammar lives there, and the section points
// to it once instead of repeating it under each chart.
const disc = await page.evaluate(() => {
  const t = document.querySelector("main").innerText.replace(/\n/g, " ");
  return {
    pointer: /How to read the charts/i.test(t),
    // A compact KEY at a chart is legitimate — a mark's meaning belongs beside
    // the mark. What was consolidated into the disclaimer is the REASONING, so
    // that is what must no longer appear under every chart.
    longCaveat: (t.match(/read from a published chart rather than stated in report text/gi) || []).length,
    grammarKeys: (t.match(/Dotted stretches are years that are\s+not Tier A/gi) || []).length,
  };
});
console.log("disclaimer pointer:", JSON.stringify(disc));
if (!disc.pointer) fail("the Crime section does not point at the disclaimer's chart-reading rules");

// Round 6 — chart-led page and the copy standard (Sean, 2026-08-22).
//
// "Do not begin the Data/Crime page with text. Use a chart." That is a
// structural property, so it gets a structural test: the first rendered thing
// inside crime-root must be a figure, and it must sit above every heading and
// paragraph on the page.
const opening = await page.evaluate(() => {
  const col = document.getElementById("crime-root");
  const y = (el) => el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
  const firstFig = col.querySelector("figure");
  // the earliest prose of any kind: heading, body paragraph, or the note line
  const prose = [...col.querySelectorAll("h1,h2,h3,p")]
    .filter((el) => el.textContent.trim().length > 40 && el.offsetParent !== null);
  const firstProse = prose.sort((a, b) => y(a) - y(b))[0];
  return {
    hasFigure: !!firstFig,
    figureY: y(firstFig),
    firstProseY: y(firstProse),
    firstProseText: firstProse ? firstProse.textContent.trim().slice(0, 70) : null,
    caption: firstFig?.querySelector("figcaption")?.textContent.trim().slice(0, 40) || null,
  };
});
console.log("opening:", JSON.stringify(opening));
if (!opening.hasFigure) fail("no chart in the crime column at all");
if (!(opening.figureY < opening.firstProseY)) {
  fail(`the page opens with text, not a chart — "${opening.firstProseText}" sits above the first figure`);
}
if (!/Six kinds of harm/i.test(opening.caption || "")) {
  fail(`the opening chart is "${opening.caption}", expected the six-lane harm chart`);
}

// Every plain-language statement stays short enough to repeat. Prose drifts one
// clause at a time; before this guard the longest ran to 90 words and carried
// three separate findings in one sentence.
const copy = await page.evaluate(async () => {
  const charts = ["harm_lanes_indexed", "homicide_two_measures", "homicide_international",
    "burglary_international", "arrests_over_time", "incarceration_over_time",
    "detention_capacity", "anomalies_indexed"];
  const out = [];
  for (const c of charts) {
    const doc = await (await fetch(`/data/crime/charts/${c}.json`)).json();
    for (const t of (doc.themes || [])) {
      out.push({ chart: c, words: t.statement.split(/\s+/).length, s: t.statement.slice(0, 60) });
    }
  }
  return out;
});
const over = copy.filter((x) => x.words > 35);
const longest = copy.reduce((a, b) => (b.words > a.words ? b : a), { words: 0 });
console.log("copy:", JSON.stringify({ statements: copy.length, longest: longest.words, over: over.length }));
if (copy.length < 40) fail(`only ${copy.length} plain-language statements found across the charts`);
if (over.length) {
  fail(`${over.length} statement(s) over 35 words — longest ${longest.words}w in ${longest.chart}: "${longest.s}…"`);
}

// The verdict must answer the question rather than restate the chart above it.
const verdictCopy = await page.evaluate(async () => {
  const v = await (await fetch("/data/crime/tables/crime_verdict.json")).json();
  const lanes = await (await fetch("/data/crime/charts/harm_lanes_indexed.json")).json();
  // the lane summaries' distinctive figures must NOT all reappear in the verdict
  const marks = ["quadrupled", "29.4%", "22-year high", "modern low"];
  return {
    claim: v.claim,
    restates: marks.filter((m) => v.summary.includes(m)).length,
    laneMarks: marks.filter((m) => lanes.themes.some((t) => t.statement.includes(m))).length,
  };
});
console.log("verdict:", JSON.stringify(verdictCopy));
if (verdictCopy.restates >= 3) {
  fail(`the verdict restates ${verdictCopy.restates} of the chart's own findings — it should answer the question, not repeat the lanes`);
}
if (disc.longCaveat > 0) fail(`the long caveat paragraph still appears ${disc.longCaveat} time(s); its reasoning belongs in the disclaimer, not under every chart`);


// Detention chart: three measures kept apart, and the section nav.
const det = await page.evaluate(() => {
  const main = document.querySelector("main");
  const t = main.innerText.replace(/\n/g, " ");
  const fig = [...main.querySelectorAll("figure")].find((f) => /funded ceiling/i.test(f.querySelector("figcaption")?.textContent || ""));
  const svg = fig?.querySelector("svg[viewBox]");
  const legend = fig ? [...(fig.querySelector("ul")?.querySelectorAll("button") || [])] : [];
  const paths = svg ? [...svg.querySelectorAll("path[stroke]:not([stroke=transparent])")] : [];
  const yrs = svg ? [...svg.querySelectorAll("text")].map((x) => x.textContent).filter((x) => /^\d{4}$/.test(x)).map(Number) : [];
  return {
    chart: !!svg,
    legend: legend.length,
    legendNamesMeasures: legend.map((b) => b.textContent.trim()),
    // ADP + funded beds are lines; single-day must be points only (2 line paths)
    linePaths: paths.length,
    ownWindow: yrs.length ? Math.min(...yrs) === 2019 : false,
    windowExplained: /uses its own 2019.2026 window/.test(t),
    measuresWarning: /three measures are not interchangeable/i.test(t),
    adpStops: /line STOPS at FY2024|stops at FY2024/.test(t),
    ceiling: /41,500/.test(t) && /45 billion/.test(t),
    noConviction: /70\.6%/.test(t) && /92% of FY2026/.test(t),
    localOvercrowding: /45 of 181 facilities/.test(t),
    accuracy: /constantly conflated in reporting/.test(t),
  };
});
console.log("detention:", JSON.stringify(det));
if (!det.chart) fail("detention chart missing");
if (det.legend !== 3) fail(`detention legend entries: ${det.legend}, expected 3`);
if (det.linePaths !== 2) fail(`detention drew ${det.linePaths} line paths; single-day must be POINTS only (expected 2 lines)`);
if (!det.ownWindow) fail("detention chart does not use its own 2019 window floor");
if (!det.windowExplained) fail("the window break is not explained on the page");
if (!det.measuresWarning) fail("the three-measures warning is missing");
if (!det.adpStops) fail("ADP publication stop not stated");
if (!det.ceiling) fail("funded-ceiling theme missing the 41,500 / $45B framing");
if (!det.noConviction) fail("no-criminal-conviction figures missing");
if (!det.localOvercrowding) fail("local-vs-national overcrowding theme missing");
if (!det.accuracy) fail("detention accuracy note missing");

// section nav: rail on wide, sheet on narrow, discovered from the DOM
const navWide = await page.evaluate(() => {
  const nav = document.querySelector("nav[aria-label='On this page']");
  const items = nav ? [...nav.querySelectorAll("button")] : [];
  return { present: !!nav, count: items.length, hasCurrent: items.some((b) => b.getAttribute("aria-current") === "true") };
});
navWide.geometry = await page.evaluate(() => {
  const nav = document.querySelector("nav[aria-label='On this page']");
  const col = document.getElementById("crime-root");
  if (!nav || !col) return { ok: false, reason: "missing nav or content column" };
  const n = nav.getBoundingClientRect(), c = col.getBoundingClientRect();
  // sidebar is LEFT of the content column and they must not overlap
  const overlap = n.right > c.left + 1;
  // no chart may exceed its column
  const wide = [...col.querySelectorAll("figure svg[viewBox]")]
    .map((f) => Math.round(f.getBoundingClientRect().width - c.width))
    .filter((d) => d > 1);
  return { ok: !overlap && !wide.length, overlap, widest: wide.sort((a, b) => b - a)[0] ?? 0,
           navRight: Math.round(n.right), colLeft: Math.round(c.left) };
});
console.log("section nav (wide):", JSON.stringify(navWide));
if (!navWide.geometry.ok) {
  fail(`layout: sidebar/content overlap=${navWide.geometry.overlap} (nav right ${navWide.geometry.navRight} vs col left ${navWide.geometry.colLeft}), widest chart overflow ${navWide.geometry.widest}px`);
}

// three acts, in order
const acts = await page.evaluate(() => {
  // the content column only: main.innerText includes the sidebar, and the
  // sidebar lists every heading — which would make every index meaningless
  const t = document.getElementById("crime-root").innerText;
  const idx = (re) => t.search(re);
  return {
    one: idx(/Act one . what is happening/i),
    two: idx(/Act two . what the state is doing/i),
    three: idx(/Act three . what cannot be known/i),
    verdictEarly: idx(/Is crime rising or falling/i),
    sourcesLate: idx(/^Sources$/m),
  };
});
console.log("acts:", JSON.stringify(acts));
// Sean, 2026-08-24: the three-act scaffolding is retired. Nine topic sections
// replace it, each owning a chart (round 9). These assertions now guard that
// the acts did not survive, and that the verdict is still in the opening.
if (acts.one >= 0 || acts.two >= 0 || acts.three >= 0) {
  fail("an act banner is still on the page — the reorganisation retired them");
}
if (acts.verdictEarly < 0) fail("the verdict heading is gone from the page");
if (acts.sourcesLate > 0 && acts.verdictEarly > acts.sourcesLate) {
  fail("the verdict has drifted below the sources register");
}

// every chart carries a plain-language block
const plain = await page.evaluate(() => {
  const figs = [...document.querySelectorAll("main figure")].filter((f) => f.offsetParent !== null);
  return figs.map((f) => {
    const cap = (f.querySelector("figcaption")?.textContent || "").slice(0, 34);
    const sec = f.closest("section");
    const has = !!sec && [...sec.querySelectorAll("h3")].some((h) => /What (the chart|this) shows/i.test(h.textContent));
    return { cap, has };
  });
});
console.log("plain-language blocks:", JSON.stringify(plain));
const missing = plain.filter((x) => !x.has).map((x) => x.cap);
if (missing.length) fail(`charts without a plain-language block: ${missing.join(" | ")}`);
if (!navWide.present) fail("section nav rail missing at desktop width");
if (navWide.count < 8) fail(`section nav lists ${navWide.count} sections, expected 8+`);
if (!navWide.hasCurrent) fail("section nav marks no current section");

// clicking a nav entry moves the viewport to that section
const beforeY = await page.evaluate(() => window.scrollY);
await page.evaluate(() => {
  const nav = document.querySelector("nav[aria-label='On this page']");
  const b = [...nav.querySelectorAll("button")].find((x) => /Sources/i.test(x.textContent));
  b?.click();
});
await page.waitForTimeout(900);
const afterY = await page.evaluate(() => window.scrollY);
if (afterY <= beforeY) fail("section nav click did not scroll to the section");
await page.evaluate(() => window.scrollTo({ top: 0 }));
await page.waitForTimeout(400);

// Arrests chart: legible y-axis (no raw 8-digit ticks), connected legend,
// dismissible accuracy note, themes with the criminal-vs-administrative
// reconciliation, and click-anywhere opens a modal.
const ar = await page.evaluate(() => {
  const main = document.querySelector("main");
  const t = main.innerText;
  const fig = [...main.querySelectorAll("figure")].find((f) => /machine peaked in 1997/i.test(f.querySelector("figcaption")?.textContent || ""));
  const ticks = fig ? [...fig.querySelectorAll("svg text")].map((x) => x.textContent) : [];
  const legend = fig ? [...(fig.querySelector("ul")?.querySelectorAll("button") || [])] : [];
  return {
    millionTicks: ticks.some((x) => /^\d+(\.\d+)?M$/.test(x)),
    noRawTicks: !ticks.some((x) => /^\d{7,}$/.test(x)),
    legend: legend.length,
    alert: /About the accuracy of these figures/.test(t),
    alertDismiss: !!document.querySelector("[role=note] button[aria-label=Dismiss]"),
    reconcile: /Civil immigration arrests are the near-floor line/i.test(t.replace(/\n/g, " "))
      && /322,093/.test(t) && /2.3% of criminal arrest volume/i.test(t.replace(/\n/g, " ")),
    courts: /33 federal defendants/i.test(t.replace(/\n/g, " ")) && /25 were cleared/i.test(t.replace(/\n/g, " ")),
    endsAt2024: /ends at FY2024 because no official/i.test(t.replace(/\n/g, " ")),
  };
});
ar.iceLine = await page.evaluate(() => /Civil immigration arrests \(ICE\)/.test(document.querySelector("main").innerText));
ar.funnel = await page.evaluate(() => {
  const t = document.querySelector("main").innerText.replace(/\n/g, " ");
  // assert the figures, not the sentence they sit in
  return /an arrest is an event, not a person/i.test(t)
    && /7\.9 million jail admissions/i.test(t)
    && /657,500/.test(t) && /69% not yet convicted/i.test(t);
});
// Rewritten 2026-08-22. The old assertion pinned the old answer — a trend plus
// "a record 73,400" — and so was quietly locking in the one ICE figure nothing
// on the site supported. The capacity research replaced the trend with the real
// answer: the federal government stopped counting.
ar.overcrowding = await page.evaluate(() => {
  const t = document.querySelector("main").innerText.replace(/\n/g, " ");
  return /stopped counting/i.test(t) && /114%/.test(t) && /26 states over 100%/i.test(t)
    && /73% of rated capacity/i.test(t);
});
console.log("arrests:", JSON.stringify(ar));
if (!ar.iceLine) fail("civil immigration (ICE) line missing from arrests chart");
if (!ar.funnel) fail("arrests-are-events funnel theme missing");
if (!ar.overcrowding) fail("overcrowding answer missing from themes");
if (!ar.millionTicks) fail("arrests y-axis lacks M-formatted ticks");
if (!ar.noRawTicks) fail("arrests y-axis still shows raw 7+ digit numbers");
if (ar.legend !== 3) fail(`arrests legend entries: ${ar.legend}, expected 3 (incl. civil immigration)`);
if (!ar.alert) fail("accuracy note missing");
if (!ar.alertDismiss) fail("accuracy note is not dismissible");
if (!ar.reconcile) fail("criminal-vs-administrative reconciliation missing from themes");
if (!ar.courts) fail("court-outcomes theme missing");
if (!ar.endsAt2024) fail("series-ends-2024 theme missing");

// modal columns are labelled and formatted (the bare "2024 7522824" fix)
const arLegendBtn = page.locator("main figure ul button", { hasText: "All arrests" }).first();
// tap-until-open: the first tap highlights unless focus is already set, in
// which case it opens the modal immediately — never click into the dialog
await arLegendBtn.click();
await page.waitForTimeout(400);
if (!(await page.evaluate(() => !!document.querySelector("[role=dialog]")))) {
  await arLegendBtn.click();
  await page.waitForTimeout(400);
}
const arModal = await page.evaluate(() => {
  const d = [...document.querySelectorAll("[role=dialog]")].find((x) => /Full record, year by year/.test(x.innerText));
  if (!d) return { open: false };
  const t = d.innerText;
  return {
    open: true,
    unitHeader: /criminal arrests per calendar year/i.test(t),
    formatted: /7,522,824/.test(t),
    noBare: !/7522824/.test(t.replace(/,/g, "").slice(0, 0) + (t.match(/\b\d{7,}\b/g) || []).join(" ")),
    peakNote: /PEAK/.test(t),
  };
});
console.log("arrests modal:", JSON.stringify(arModal));
if (!arModal.open) fail("arrests modal did not open from legend");
if (!arModal.unitHeader) fail("arrests modal missing unit header");
if (!arModal.formatted) fail("arrests modal numbers not thousands-formatted");
if (!arModal.peakNote) fail("arrests modal missing per-year note (PEAK)");
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

// dismiss works
await page.locator("[role=note]", { hasText: "two official federal criminal-arrest series" })
  .locator("button[aria-label=Dismiss]").first().click();
await page.waitForTimeout(300);
const alertGone = await page.evaluate(() => !/About the accuracy of these figures/.test(document.querySelector("main").innerText));
if (!alertGone) fail("accuracy note did not dismiss");

// clicking directly on the lane chart PLOT opens a modal (the overlay used to
// swallow these clicks) — click mid-plot on the five-lanes chart
const laneSvg = page.locator("main figure svg[viewBox]").first();
await laneSvg.scrollIntoViewIfNeeded();
const laneBox = await laneSvg.boundingBox();
await laneSvg.click({ position: { x: laneBox.width * 0.55, y: laneBox.height * 0.45 } });
await page.waitForTimeout(600);
const plotClickModal = await page.evaluate(() =>
  !![...document.querySelectorAll("[role=dialog]")].find((x) => /Counts:|Basis:/.test(x.innerText)));
console.log("plot-click modal:", plotClickModal);
if (!plotClickModal) fail("clicking the chart plot did not open a modal");
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

// lane legend hover dims the other lanes (real pointer)
await page.locator("main figure ul button", { hasText: "Homicide" }).first().hover();
await page.waitForTimeout(300);
const laneDim = await page.evaluate(() => {
  const fig = [...document.querySelectorAll("main figure")].find((f) => /Six kinds of harm/i.test(f.querySelector("figcaption")?.textContent || ""));
  const ops = [...fig.querySelectorAll("svg g[style*=cursor] > path[stroke]:not([stroke=transparent])")]
    .map((x) => +(x.getAttribute("opacity") || 1));
  return { dimmed: ops.filter((o) => o < 0.3).length, lit: ops.filter((o) => o >= 0.9).length };
});
console.log("lane dim:", JSON.stringify(laneDim));
if (laneDim.dimmed < 3) fail(`lane legend hover dims ${laneDim.dimmed}; expected most non-focused lanes dimmed`);
if (laneDim.lit < 1) fail("focused lane not lit");
await page.mouse.move(5, 5);

// International homicide: legend wired to lines, one honest chart, two
// honest non-charts, and the nc07 missing-persons entry.
const intl = await page.evaluate(() => {
  const main = document.querySelector("main");
  const t = main.innerText;
  const fig = [...main.querySelectorAll("figure")].find((f) => /US against the world/i.test(f.querySelector("figcaption")?.textContent || ""));
  const legend = fig ? [...fig.querySelectorAll("ul button")] : [];
  return {
    chart: !!fig?.querySelector("svg[viewBox]"),
    legendEntries: legend.length,
    legendPressable: legend.length > 0 && legend.every((b) => b.hasAttribute("aria-pressed")),
    drugPanel: /five ways of counting/i.test(t),
    drugNoChart: /cannot share an axis/i.test(t),
    japanAbsence: /not counted comparably/i.test(t),
    missingPanel: /no shared unit/i.test(t),
    yellowNotices: /3,345/.test(t),
    nc07: /Missing persons, internationally/.test(t),
  };
});
console.log("intl:", JSON.stringify(intl));
if (!intl.chart) fail("international homicide chart missing");
if (intl.legendEntries !== 13) fail(`intl legend entries: ${intl.legendEntries}, expected 13`);
if (!intl.legendPressable) fail("intl legend entries are not interactive buttons");
if (!intl.drugPanel || !intl.drugNoChart) fail("drug-deaths definition panel missing or unexplained");
if (!intl.japanAbsence) fail("Japan's verified absence not shown");
if (!intl.missingPanel || !intl.yellowNotices) fail("international missing-persons panel incomplete");
if (!intl.nc07) fail("nc07 international missing-persons entry absent from What nobody counts");

// Legend->line interactivity: hovering a legend entry dims the other lines.
// A real pointer hover: React's onMouseEnter is synthesized from native
// mouseover, so a dispatched MouseEvent("mouseenter") never reaches it.
await page.locator("main figure ul button", { hasText: "Japan" }).first().hover();
await page.waitForTimeout(300);
const dimCheck = await page.evaluate(() => {
  const fig = [...document.querySelectorAll("main figure")].find((f) => /US against the world/i.test(f.querySelector("figcaption")?.textContent || ""));
  const ops = [...fig.querySelectorAll("svg g[style*=cursor] path[stroke]:not([stroke=transparent])")]
    .map((p) => +(p.getAttribute("opacity") || 1));
  return { dimmedCount: ops.filter((o) => o < 0.3).length, litCount: ops.filter((o) => o >= 0.9).length };
});
await page.mouse.move(5, 5);
console.log("intl dim:", JSON.stringify(dimCheck));
if (dimCheck.dimmedCount < 10) fail(`legend hover dims ${dimCheck.dimmedCount} paths; expected most non-focused lines dimmed`);
if (dimCheck.litCount < 1) fail("focused line is not lit");

// COVID checkbox now zooms the axis to the pandemic window (Sean, 2026-08-21).
await page.getByRole("tab", { name: /^Public Health$/i }).click();
await page.waitForTimeout(1600);
const noCheckbox = await page.evaluate(() => !document.body.textContent.includes("Show COVID-19 timeline"));
console.log("covid checkbox removed:", noCheckbox);
if (!noCheckbox) fail("COVID checkbox should be removed");
await page.getByRole("button", { name: /2017–2021 \(pandemic\)/ }).click();
await page.waitForTimeout(700);
const covidWin = await page.evaluate(() => {
  const svgs = [...document.querySelectorAll("main figure svg")];
  const svg = svgs.find((x) => [...x.querySelectorAll("text")].some((t) => t.textContent === "2017"));
  if (!svg) return { found: false };
  const yrs = [...svg.querySelectorAll("text")].map((t) => t.textContent).filter((t) => /^(19|20)\d\d$/.test(t)).map(Number);
  const markers = [...svg.querySelectorAll("line[stroke-dasharray]")].length;
  return { found: true, min: Math.min(...yrs), markers };
});
console.log("covid window:", JSON.stringify(covidWin));
if (!covidWin.found || covidWin.min < 2017) fail("pandemic window did not zoom");
if (covidWin.markers < 3) fail("COVID markers should render automatically in the pandemic window");
await page.getByRole("button", { name: /2000–2021/ }).click();
await page.waitForTimeout(500);
await page.getByRole("tab", { name: /^Crime$/i }).click();
await page.waitForTimeout(1800);

// Series modal: method, caveats and the full year table.
await page.evaluate(() => {
  const g = [...document.querySelectorAll("main figure svg g")].find((x) => x.querySelector("path"));
  g?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
await page.waitForTimeout(700);
const crimeModal = await page.evaluate(() => {
  const d = [...document.querySelectorAll("[role=dialog]")].find((x) => /Basis:|Counts:/.test(x.innerText));
  return d ? { open: true, rows: d.querySelectorAll("tbody tr").length, caveats: d.querySelectorAll("li").length } : { open: false };
});
console.log("crime modal:", JSON.stringify(crimeModal));
if (!crimeModal.open) fail("crime series modal did not open");
if (crimeModal.rows < 10) fail(`crime modal year rows: ${crimeModal.rows}`);
if (!crimeModal.caveats) fail("crime series modal carries no method caveats");
await page.keyboard.press("Escape");

// The GovCloud report must survive a Crime round-trip like any other sub-tab.
await page.getByRole("tab", { name: /^Government Cloud$/i }).click();
await page.waitForTimeout(1500);
const afterCrime = await page.evaluate(() => document.getElementById("a_tiles")?.innerHTML.length || 0);
console.log("tiles after crime round-trip:", afterCrime);
if (afterCrime < 100) fail("GovCloud report was wiped by the Crime round-trip");

// Phone legibility on the crime chart.
await page.getByRole("tab", { name: /^Crime$/i }).click();
await page.waitForTimeout(1800);
await page.setViewportSize({ width: 390, height: 900 });
await page.waitForTimeout(1500);
const crimePhone = await page.evaluate(() => {
  const svg = document.querySelector("main figure svg[viewBox]");
  if (!svg) return { found: false };
  const r = svg.getBoundingClientRect();
  const sc = r.width / svg.viewBox.baseVal.width;
  const sizes = [...svg.querySelectorAll("text")].map((t) => +(t.getAttribute("font-size") || 11) * sc);
  return {
    found: true,
    minPx: +Math.min(...sizes).toFixed(1),
    overflow: r.right > document.documentElement.clientWidth + 1,
    key: /FBI . murder known to police/.test(document.querySelector("main").innerText),
  };
});
crimePhone.navBar = await page.evaluate(() => {
  const bar = [...document.querySelectorAll("button[aria-expanded]")]
    .find((b) => /On this page/i.test(b.textContent));
  if (!bar) return { present: false };
  bar.click();
  return { present: true };
});
await page.waitForTimeout(400);
crimePhone.navSheet = await page.evaluate(() => {
  const sheet = document.getElementById("section-nav-sheet");
  return sheet ? sheet.querySelectorAll("button").length : 0;
});
console.log("crime phone:", JSON.stringify(crimePhone));
if (!crimePhone.navBar?.present) fail("section nav bar missing at phone width");
if (!crimePhone.navSheet || crimePhone.navSheet < 8) fail(`phone nav sheet lists ${crimePhone.navSheet} sections, expected 8+`);
if (!crimePhone.found) fail("crime chart missing at phone width");
if (crimePhone.minPx < 9) fail(`crime chart label paints at ${crimePhone.minPx}px on a phone`);
if (crimePhone.overflow) fail("crime chart overflows the phone viewport");
if (!crimePhone.key) fail("crime chart drops end labels on phones without the text key");
await page.setViewportSize({ width: 1280, height: 900 });

// ---- one shared chart window ------------------------------------------------
// Charts had drifted to three x-axes (crime 1950-, overdose 1999-, suicide
// 2000-), so the same year sat in a different place on each. Every Data chart
// now draws DATA_WINDOW with the same tick years; this guards that.
const axes = {};
for (const tab of ["Public Health", "Crime"]) {
  await page.getByRole("tab", { name: new RegExp(`^${tab}$`, "i") }).click();
  await page.waitForTimeout(2400);
  axes[tab] = await page.evaluate(() =>
    [...document.querySelectorAll("main figure")]
      .filter((f) => f.offsetParent !== null)
      .filter((f) => !f.hasAttribute("data-own-window"))  // declared opt-outs
      .map((f) => {
        const svg = f.querySelector("svg[viewBox]");
        if (!svg) return null;
        // axis ticks only: marker labels are rotated, axis ticks are not
        const ticks = [...svg.querySelectorAll("text")]
          .filter((t) => !t.getAttribute("transform"))
          .map((t) => t.textContent)
          .filter((t) => /^(19|20)\d\d$/.test(t))
          .map(Number);
        return ticks.length ? { cap: (f.querySelector("figcaption")?.textContent || "").slice(0, 40), ticks } : null;
      })
      .filter(Boolean));
}
const charts = [...axes["Public Health"], ...axes["Crime"]];
console.log("chart axes:", JSON.stringify(charts.map((c) => ({ cap: c.cap, t: c.ticks.join(",") }))));
if (charts.length < 3) fail(`expected at least 3 charts to check alignment, saw ${charts.length}`);
const signature = charts[0].ticks.join(",");
for (const c of charts) {
  if (c.ticks.join(",") !== signature) {
    fail(`chart axes are not aligned: "${c.cap}" ticks ${c.ticks.join(",")} vs ${signature}`);
  }
}
if (Math.min(...charts[0].ticks) < 1999) fail("shared window starts before 1999");

// 2026 YTD must be present, and must NOT be a point on the annual chart.
await page.getByRole("tab", { name: /^Crime$/i }).click();
await page.waitForTimeout(2200);
const ytd = await page.evaluate(() => {
  const t = document.querySelector("main").innerText;
  const svg = document.querySelector("main figure svg[viewBox]");
  const ticks = svg ? [...svg.querySelectorAll("text")].map((x) => x.textContent) : [];
  return {
    block: /Where 2026 stands/.test(t),
    homicide: /-18%|−18%/.test(t),
    rose: /\+8%/.test(t) && /rose/i.test(t),
    independent: /18\.7/.test(t),
    fullRecordToggle: /Show the full record/.test(t),
    no2026OnChart: !ticks.includes("2026"),
  };
});
console.log("ytd:", JSON.stringify(ytd));
if (!ytd.block) fail("2026 year-to-date block missing");
if (!ytd.homicide) fail("2026 homicide YTD figure missing");
if (!ytd.rose) fail("the offences that ROSE in 2026 are not shown alongside those that fell");
if (!ytd.independent) fail("the independent 566-agency YTD corroboration is missing");
if (!ytd.fullRecordToggle) fail("full-record toggle missing — the pre-1999 crime record must stay reachable");
if (!ytd.no2026OnChart) fail("2026 is plotted on the annual chart; a partial year must not be a chart point");
await page.setViewportSize({ width: 1280, height: 900 });

// ---- Glossary uses the same SideNav (Sean, 2026-08-21) --------------------
await page.setViewportSize({ width: 1440, height: 1000 });
await page.getByRole("button", { name: /^Glossary$/i }).first().click().catch(() => {});
await page.waitForTimeout(2000);
const gl = await page.evaluate(() => {
  const nav = document.querySelector("nav[aria-label='Terms']");
  const items = nav ? [...nav.querySelectorAll("button")] : [];
  const grid = document.querySelector("main .lg\\:grid");
  const n = nav?.getBoundingClientRect(), g = grid?.getBoundingClientRect();
  return {
    present: !!nav,
    count: items.length,
    // same component: index mode marks the open term, not a scroll position
    left: n && g ? Math.round(n.left - g.left) : null,
    legacyGone: !document.querySelector("aside.w-52"),
  };
});
console.log("glossary nav:", JSON.stringify(gl));
if (!gl.present) fail("glossary is not using the shared SideNav");
if (gl.count < 10) fail(`glossary nav lists ${gl.count} terms`);
if (gl.left === null || gl.left > 40) fail("glossary nav is not the left grid column");
if (!gl.legacyGone) fail("the old GlossarySidebar markup is still present");

await page.setViewportSize({ width: 390, height: 900 });
await page.waitForTimeout(1200);
const glPhone = await page.evaluate(() => {
  const bar = [...document.querySelectorAll("button[aria-expanded]")].find((b) => /Terms/i.test(b.textContent));
  if (!bar) return { present: false };
  bar.click();
  return { present: true };
});
await page.waitForTimeout(500);
const glSheet = await page.evaluate(() => document.getElementById("section-nav-sheet")?.querySelectorAll("button").length || 0);
console.log("glossary phone nav:", JSON.stringify({ ...glPhone, items: glSheet }));
if (!glPhone.present) fail("glossary phone nav trigger missing");
if (glSheet < 10) fail("glossary phone sheet is empty");
await page.setViewportSize({ width: 1280, height: 900 });

// ---- Journal adopts the same SideNav (month index) -------------------------
await page.setViewportSize({ width: 1440, height: 1000 });
await page.getByRole("button", { name: /^Journal$/i }).first().click().catch(() => {});
await page.waitForTimeout(2000);
const jn = await page.evaluate(() => {
  const nav = document.querySelector("nav[aria-label='Months']");
  const items = nav ? [...nav.querySelectorAll("button")] : [];
  const grid = document.querySelector("main .lg\\:grid");
  const n = nav?.getBoundingClientRect(), g = grid?.getBoundingClientRect();
  return {
    present: !!nav,
    count: items.length,
    left: n && g ? Math.round(n.left - g.left) : null,
    labelled: items.slice(0, 2).map((b) => b.textContent.trim()),
    current: items.filter((b) => b.getAttribute("aria-current") === "true").length,
  };
});
console.log("journal nav:", JSON.stringify(jn));
if (!jn.present) fail("journal is not using the shared SideNav");
if (jn.count < 3) fail(`journal month index lists ${jn.count} months`);
if (jn.left === null || jn.left > 40) fail("journal nav is not the left grid column");
if (!/^[A-Z][a-z]+ \d{4}$/.test(jn.labelled[0] || "")) fail(`journal months not labelled as month+year: ${jn.labelled[0]}`);
if (jn.current !== 1) fail("journal nav marks no current month");

// picking a month pages the feed to that month
const jnPageBefore = await page.evaluate(() => document.querySelector("main")?.innerText.match(/page (\d+) of/)?.[1]);
await page.evaluate(() => {
  const nav = document.querySelector("nav[aria-label='Months']");
  const items = [...nav.querySelectorAll("button")];
  items[items.length - 1]?.click();
});
await page.waitForTimeout(900);
const jnPageAfter = await page.evaluate(() => document.querySelector("main")?.innerText.match(/page (\d+) of/)?.[1]);
console.log("journal month jump:", jnPageBefore, "->", jnPageAfter);
if (jnPageBefore === jnPageAfter) fail("picking a month did not move the feed");

// ---- the five Public Health concepts, and the charts that point at them ----
await page.setViewportSize({ width: 1440, height: 1000 });
await page.getByRole("button", { name: /^Concepts$/i }).first().click().catch(() => {});
await page.waitForTimeout(2000);
const con = await page.evaluate(() => {
  const want = ["us-rose-against-the-trend", "low-number-may-mean-low-counting",
                "prescribing-is-not-prevalence", "the-fentanyl-reversal",
                "co-occurrence-is-not-cause"];
  const t = document.querySelector("main").innerText;
  return {
    present: want.filter((id) => !!document.getElementById(id)),
    missing: want.filter((id) => !document.getElementById(id)),
    // the narrowed theme 3 must NOT assert that illness did not increase
    narrowed: /Prescribing is not a measure of illness/.test(t) && !/More prescriptions, not more illness/.test(t),
    // the counter-figure is shown, not hidden
    counterShown: /13\.5% to 17\.8%/.test(t),
    // theme 1 must not claim uniqueness
    notUnique: /South Korea rose further/.test(t),
    // rendered uppercase via CSS, so innerText reads DOCUMENTED / STRUCTURAL
    basisLabels: /DOCUMENTED/i.test(t) && /STRUCTURAL/i.test(t),
    conceptCount: document.querySelectorAll("main li[id]").length,
  };
});
console.log("concepts:", JSON.stringify(con));
if (con.missing.length) fail(`concepts missing from /concepts: ${con.missing.join(", ")}`);
if (!con.narrowed) fail("theme 3 is not the narrowed claim");
if (!con.counterShown) fail("the rising-diagnosis counter-figure is not shown to the reader");
if (!con.notUnique) fail("theme 1 still reads as a uniqueness claim");
if (!con.basisLabels) fail("concept basis labels missing");
if (con.conceptCount < 16) fail(`concepts page shows ${con.conceptCount}, expected 16`);

// Public Health charts link INTO the concepts
await page.getByRole("button", { name: /^Data$/i }).first().click().catch(() => {});
// The report must SURVIVE leaving the section and coming back — Data is now
// mounted-but-hidden once opened. This path (Data -> Concepts -> Data) left
// the timeline blank until the sticky mount was added.
await page.waitForTimeout(1500);
const survivedFullTrip = await page.evaluate(() => document.getElementById("a_tiles")?.innerHTML.length ?? -1);
console.log("tiles after Concepts -> Data:", survivedFullTrip);
if (survivedFullTrip < 100) fail("GovCloud report is blank after leaving the Data tab and returning");
await page.getByRole("tab", { name: /^Public Health$/i }).click();
await page.waitForTimeout(2200);
const links = await page.evaluate(() =>
  [...document.querySelectorAll('main a[href^="/concepts#"]')].map((a) => a.getAttribute("href")));
console.log("concept links from Public Health:", JSON.stringify(links));
if (links.length < 4) fail(`only ${links.length} concept links from the health page, expected 4+`);
for (const id of ["us-rose-against-the-trend", "the-fentanyl-reversal", "co-occurrence-is-not-cause"]) {
  if (!links.some((h) => h.endsWith(id))) fail(`no chart links to concept ${id}`);
}

// ---------------------------------------------------------------------------
// ROUND 9 — every sidebar entry owns a chart.
//
// This is the rule the reorganisation bought. "Charts first" had been true of
// the page and false of its structure: twenty sections, six of them with a
// chart. Now there are nine, and eight open on one. Method is the single
// declared exception, and it says so in its own copy.
//
// Asserting it here is the point of choosing this structure over a plain
// regroup — a standard the suite can hold does not drift back one section at a
// time, which is how every other guard on this page came to exist.
// ---------------------------------------------------------------------------
await page.getByRole("tab", { name: /^Crime$/i }).click();
await page.waitForTimeout(2500);
const shape = await page.evaluate(() => {
  const root = document.getElementById("crime-root");
  const secs = [...root.querySelectorAll("section")]
    .filter((s) => s.querySelector("h2"))
    .map((s) => ({
      label: s.querySelector("h2").textContent.trim(),
      figures: s.querySelectorAll("figure").length,
      // the plain-language block that must sit under every chart
      hasSummary: /What (the chart|this) shows/i.test(s.textContent || ""),
    }));
  return { count: secs.length, secs };
});
console.log("crime sections:", JSON.stringify(shape.secs.map((s) => `${s.label.slice(0, 26)}:${s.figures}`)));
if (shape.count > 10) fail(`${shape.count} sidebar entries — the reorganisation set the ceiling at 10`);
for (const s of shape.secs) {
  const isMethod = /^Method/i.test(s.label);
  if (!isMethod && s.figures < 1) fail(`section "${s.label}" is in the sidebar but owns no chart`);
  if (isMethod && s.figures > 0) fail("Method now has a chart — it is the declared chartless exception");
  if (!isMethod && !s.hasSummary) fail(`section "${s.label}" has a chart but no plain-language block under it`);
}

// The findings notice: one statement of the result, and it must point at the
// disclaimer rather than restate it.
const notice = await page.evaluate(() => {
  const n = [...document.querySelectorAll('#crime-root [role="note"]')]
    .find((e) => /What this section found/i.test(e.textContent || ""));
  if (!n) return null;
  return {
    words: (n.textContent || "").trim().split(/\s+/).length,
    disclaimer: [...n.querySelectorAll("a, button")].some((e) => /disclaimer/i.test(e.textContent || "")),
    dismissible: !!n.querySelector('button[aria-label="Dismiss"]'),
    saysNoOverallRise: /did not\s+rise overall/i.test(n.textContent || ""),
    saysLimit: /only as good as the records/i.test(n.textContent || ""),
  };
});
console.log("findings notice:", JSON.stringify(notice));
if (!notice) fail("the section-level findings notice is missing");
else {
  if (notice.words > 70) fail(`findings notice is ${notice.words} words — the short version was chosen`);
  if (!notice.disclaimer) fail("findings notice does not link to the disclaimer");
  if (!notice.dismissible) fail("findings notice cannot be dismissed");
  if (!notice.saysNoOverallRise) fail("findings notice no longer states the overall result");
  if (!notice.saysLimit) fail("findings notice dropped the accuracy limit");
}

// Overdose deaths stay, and are labelled for what they are.
const overdose = await page.evaluate(() => {
  const t = document.getElementById("crime-root").textContent || "";
  return {
    laneKept: /Overdose deaths quadrupled/i.test(t),
    notAnOffence: /health outcome, not an offence/i.test(t),
    pointsAtHealth: /Public Health carries the record|Public Health section carries/i.test(t),
  };
});
console.log("overdose:", JSON.stringify(overdose));
if (!overdose.laneKept) fail("the overdose lane was removed — Sean asked for it to stay");
if (!overdose.notAnOffence) fail("overdose deaths are not marked as a health outcome rather than an offence");

// ---------------------------------------------------------------------------
// ROUND 8 — the archive links.
//
// Publishers withdraw pages; three did during the crime section. Every source
// row carries an archived_url, and the guard is that whatever is IN the data
// actually reaches the page — a filled field that renders nowhere is the same
// as an empty one to a reader holding a dead link.
//
// Deliberately proportional: it asserts one link per archived row, so it passes
// at zero coverage (before the sweep has run) and tightens automatically as
// scripts/wayback_sweep.py fills the field.
// ---------------------------------------------------------------------------
await page.getByRole("tab", { name: /^Crime$/i }).click();
await page.waitForTimeout(2200);
const archive = await page.evaluate(async () => {
  const rows = await fetch("/data/crime/tables/crime_sources.json").then((r) => r.json());
  const archived = rows.filter((s) => (s.archived_url || "").trim());
  // The register is paged, so only compare against what is on the visible page.
  const shown = [...document.querySelectorAll("main li")]
    .map((li) => li.querySelector('a[href]:not([data-archived])'))
    .filter(Boolean).map((a) => a.getAttribute("href"));
  const shownArchived = archived.filter((s) => shown.includes(s.url));
  const links = [...document.querySelectorAll("main a[data-archived]")];
  return {
    inData: archived.length,
    ofWhichOnThisPage: shownArchived.length,
    linksRendered: links.length,
    predates: links.filter((a) => a.dataset.archived === "predates").length,
    dottedOnPredates: links.filter((a) => a.dataset.archived === "predates"
      && /decoration-dotted/.test(a.className)).length,
    allPointAtWayback: links.every((a) => /^https:\/\/web\.archive\.org\/web\/\d{14}\//.test(a.href)),
    sampleText: links.slice(0, 2).map((a) => a.textContent.trim()),
  };
});
console.log("archive links:", JSON.stringify(archive));
if (archive.linksRendered < archive.ofWhichOnThisPage) {
  fail(`${archive.ofWhichOnThisPage} sources on this page carry an archive url but only ${archive.linksRendered} rendered a link`);
}
if (archive.linksRendered && !archive.allPointAtWayback) {
  fail("an archive link does not resolve to a timestamped Wayback snapshot");
}
if (archive.predates !== archive.dottedOnPredates) {
  fail("a snapshot that predates access is not marked dotted — it reads as stronger evidence than it is");
}

// ---------------------------------------------------------------------------
// ROUND 8b — the export dialog describes the archive that actually ships.
//
// The old copy named "Government Cloud and Public Health Signals" and stopped
// there. Crime, Concepts and the research inputs had been in the zip for weeks
// by the time anyone noticed. A visitor read that sentence and under-counted
// what they were about to receive, which is a quiet way of hiding your own work.
//
// The dialog now renders from lib/corpus-summary.ts. build_corpus_index.py
// --check proves that file matches the zip; this proves the DIALOG matches the
// file, and that every research body in the download is named in it.
// ---------------------------------------------------------------------------
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const exportDialog = await page.evaluate(async () => {
  const btn = [...document.querySelectorAll("button")]
    .find((b) => /^\s*Export\s*$/i.test(b.textContent || ""));
  if (!btn) return { opened: false };
  btn.click();
  await new Promise((r) => setTimeout(r, 500));
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return { opened: false };
  const t = (dlg.textContent || "").replace(/\s+/g, " ");
  const num = (re) => { const m = t.match(re); return m ? Number(m[1].replace(/,/g, "")) : 0; };
  return {
    opened: true,
    files: num(/([\d,]+) files/),
    markdown: num(/([\d,]+) are Markdown/),
    // every research body must be named, not only the two the old copy knew
    names: {
      Journal: /Journal/i.test(t),
      References: /References/i.test(t),
      Crime: /Crime/i.test(t),
      "Public Health": /Public Health/i.test(t),
      "Government Cloud": /Government Cloud/i.test(t),
      Concepts: /Concepts/i.test(t),
      Glossary: /Glossary/i.test(t),
      "Research inputs": /Research inputs/i.test(t),
    },
    startHere: /START-HERE\.md/i.test(t),
    warnsNotAllAtOnce: /Do not try to upload all/i.test(t),
    saysCsv: /CSV/i.test(t),
    keepsCopyright: /copyright/i.test(t) && /Disclaimer/i.test(t),
    downloadHref: dlg.querySelector("a[download]")?.getAttribute("href") || "",
    width: Math.round(dlg.getBoundingClientRect().width),
  };
});
console.log("export dialog:", JSON.stringify(exportDialog));
if (!exportDialog.opened) fail("the Export dialog did not open");
else {
  const ts = readFileSync(new URL("../lib/corpus-summary.ts", import.meta.url), "utf8");
  const field = (k) => Number((ts.match(new RegExp(`${k}: (\\d+)`)) || [])[1] || 0);
  for (const k of ["files", "markdown"]) {
    if (exportDialog[k] !== field(k)) {
      fail(`export dialog says ${exportDialog[k]} ${k}, the corpus holds ${field(k)}`);
    }
  }
  for (const [k, v] of Object.entries(exportDialog.names)) {
    if (!v) fail(`export dialog never mentions ${k} — the download carries it and the copy hides it`);
  }
  if (!exportDialog.startHere) fail("export dialog does not point at START-HERE.md");
  if (!exportDialog.warnsNotAllAtOnce) fail("export dialog does not warn against uploading everything at once");
  if (!exportDialog.saysCsv) fail("export dialog does not mention the CSV row data");
  if (!exportDialog.keepsCopyright) fail("export dialog dropped the copyright and disclaimer notice");
  if (!/^\/api\/corpus/.test(exportDialog.downloadHref)) {
    fail("export dialog bypasses /api/corpus — the download would stop being counted");
  }
  if (exportDialog.width < 700) {
    fail(`export dialog is ${exportDialog.width}px wide — too narrow for the folder list`);
  }
}

// Sean, 2026-08-25: "I've got a really tall modal... I can't reach the button
// to download it." The shared DialogContent centres with -translate-y-1/2 and
// sets no max-height, so a long body grows off both edges of the window and
// takes the download button with it. The dialog is now height-bounded with its
// actions pinned — and the guard is geometric, not structural: on the SHORTEST
// window we support, the button's box must lie inside the viewport. A dialog
// whose primary action cannot be clicked has no working primary action.
for (const [w, h] of [[1440, 900], [1280, 700], [900, 600], [390, 740]]) {
  await page.setViewportSize({ width: w, height: h });
  const reach = await page.evaluate(async () => {
    document.querySelector('[role="dialog"]')
      ?.querySelector('button[aria-label], button')?.blur?.();
    const dlg = document.querySelector('[role="dialog"]');
    if (!dlg) return null;
    await new Promise((r) => setTimeout(r, 200));
    const a = dlg.querySelector("a[download]");
    if (!a) return { found: false };
    const r = a.getBoundingClientRect();
    const d = dlg.getBoundingClientRect();
    return {
      found: true,
      inViewport: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
      dialogFits: d.top >= 0 && d.bottom <= innerHeight,
      btnBottom: Math.round(r.bottom),
      viewportH: innerHeight,
      dialogW: Math.round(d.width),
    };
  });
  console.log(`export reach ${w}x${h}:`, JSON.stringify(reach));
  if (!reach?.found) { fail(`export dialog lost its download link at ${w}x${h}`); continue; }
  if (!reach.inViewport) {
    fail(`at ${w}x${h} the download button sits at y=${reach.btnBottom} in a ${reach.viewportH}px window — unreachable`);
  }
  if (!reach.dialogFits) {
    fail(`at ${w}x${h} the dialog itself overflows the window — it must bound its own height`);
  }
}
await page.setViewportSize({ width: 1440, height: 900 });

await browser.close();

// ---------------------------------------------------------------------------
// ROUND 7 — the corpus people actually download must match the data they see.
//
// 2026-08-23: the deployed zip carried the pre-rewrite verdict and six-theme
// summaries while the site served seven. The freshness guard existed and was
// correct; it simply wasn't run at the end. So it runs here, inside the one
// command we run before shipping, where forgetting is no longer possible.
// ---------------------------------------------------------------------------
const { execFileSync } = await import("node:child_process");
// fileURLToPath, NOT .pathname. On a path containing a space — Sean's repo lives
// under "Invisible Ships" — .pathname hands back "Invisible%20Ships", a
// directory that does not exist. execFileSync then fails to launch at all, with
// no stdout and no stderr, and every corpus check reported failure while
// actually never running. It passed here only because this container's path has
// no space in it.
const { fileURLToPath } = await import("node:url");
const REPO = fileURLToPath(new URL("..", import.meta.url));

// Three checks, because the corpus can be wrong in three different ways:
//   freshness    — the crime folder no longer matches the data the site serves
//   site content — concepts, site glossary, documents or research have drifted
//   completeness — a whole body of work in the repo reaches the download NOT AT
//                  ALL. This is the one that would have caught sixteen concepts
//                  going missing for a week after a revert deleted their
//                  exporter, and the ~19 glossary terms that never had one.
for (const [label, script, remedy] of [
  ["corpus freshness", "scripts/sync_corpus_crime.py",
   "python3 scripts/sync_corpus_crime.py"],
  // Government Cloud had no owner until 25 Aug: its briefs were dropped in once
  // and carried forward, which is how eight files shipped with no header and a
  // copyright naming nobody.
  ["government cloud", "scripts/sync_corpus_govcloud.py",
   "python3 scripts/sync_corpus_govcloud.py"],
  ["site content", "scripts/sync_corpus_site.py",
   "node scripts/export_concepts_md.mjs && node scripts/export_site_content_md.mjs && python3 scripts/sync_corpus_site.py"],
  ["corpus completeness", "scripts/build_corpus_index.py",
   "bash scripts/build_crime_all.sh"],
  // Fails only on LOSS, never on addition. Added 26 Aug alongside the Data and
  // Concepts merge, so that "nothing was deleted" is a test rather than a claim.
  ["content inventory", "scripts/check_content_inventory.py",
   "python3 scripts/check_content_inventory.py --update  (only if the removal was intended)"],
  // Added 27 Aug after an observation pass found a chart with clipped axis
  // labels the day after it was written, and two charts with no phone view at
  // all. Written-down rules decay; a rule that fails the build does not.
  ["chart contract", "scripts/check_chart_contract.py",
   "see the contract at the top of scripts/check_chart_contract.py"],
]) {
  try {
    const out = execFileSync("python3", [script, "--check"], {
      cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    console.log(`${label}:`, out.trim().split("\n").filter(Boolean).pop());
  } catch (e) {
    // A check that FAILS prints why. A check that never RAN prints nothing —
    // and silently reporting the second as the first sent Sean chasing a corpus
    // problem that did not exist. So: if there is no output, say that the
    // process did not run and show the reason it gave.
    const msg = [e.stdout, e.stderr].filter(Boolean).join("\n").trim();
    if (msg) {
      console.log(`${label}:\n` + msg);
      fail(`${label} check failed — run: ${remedy}`);
    } else {
      console.log(`${label}: produced no output — the check did not run`);
      console.log(`   cwd: ${REPO}`);
      console.log(`   ${e.message}`);
      fail(`${label} could not be run (see above) — this is a harness problem, not a corpus problem`);
    }
  }
}

console.log(process.exitCode ? "RESULT: FAIL" : "RESULT: PASS");
