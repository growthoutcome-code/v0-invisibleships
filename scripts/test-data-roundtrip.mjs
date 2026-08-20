// Verifies the Data sub-tab round-trip keeps the GovCloud report drawn.
import { chromium } from "playwright-core";

const BASE = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();
const fail = (m) => { console.error("FAIL:", m); process.exitCode = 1; };

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
    const chart = h.findIndex((n) => n.textContent.includes("Suicide rate, 2000"));
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
  rateExplained: document.body.textContent.includes("roughly 52,000 deaths"),
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
if (stageA.covidMarkers < 5) fail(`covid markers: ${stageA.covidMarkers}, expected all 5 now the chart reaches 2025`);
if (!stageA.modalOpen) fail("series modal did not open");
if (!stageA.modalHasMethod || !stageA.modalHasCaveat || !stageA.modalHasSource) fail("series modal incomplete");
if (stageA.modalRows < 22) fail(`series modal year rows: ${stageA.modalRows}`);
if (!stageA.crossLink) fail("timeline cross-link missing");
if (!stageA.palestineCaveat) fail("Israel/Palestine caveat missing");

// The change view's headline must also name what is being measured
await page.getByRole("tab", { name: /^Public Health$/i }).click();
await page.waitForTimeout(1400);
const cv = await page.evaluate(async () => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Change over period");
  b?.click();
  await new Promise((r) => setTimeout(r, 700));
  const h = document.querySelector("figcaption span");
  return { headline: h?.textContent || "", namesMetric: /suicide/i.test(h?.textContent || "") };
});
console.log("change-view headline:", JSON.stringify(cv));
if (!cv.namesMetric) fail("change-view headline does not say what it measures");

await browser.close();
console.log(process.exitCode ? "RESULT: FAIL" : "RESULT: PASS");
