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
  intlChart: document.body.textContent.includes("Did it happen everywhere?"),
  intlLabels: (() => {
    const want = ["United States","South Korea","Japan","France","Germany","Australia","Canada","UK"];
    const found = want.map((c) => [...document.querySelectorAll("svg text")].find((t) => t.textContent.startsWith(c + " ")));
    if (found.some((t) => !t)) return false;
    // every label must sit inside the drawing area with a finite y
    return found.every((t) => { const y = t.getBBox?.().y; return Number.isFinite(y) && y > 0 && y < 400; });
  })(),
  intlLabelsDistinct: (() => {
    const ys = [...document.querySelectorAll("svg text")]
      .filter((t) => /^(United States|South Korea|Japan|France|Germany|Australia|Canada|UK) /.test(t.textContent))
      .map((t) => Math.round(t.getBBox?.().y ?? -1));
    return new Set(ys).size === ys.length && ys.length === 8;
  })(),
  chartBeforeVerdict: (() => {
    const h = [...document.querySelectorAll("h2,figcaption")];
    const chart = h.findIndex((n) => n.textContent.includes("suicide rate, 1999"));
    const verdict = h.findIndex((n) => n.textContent.includes("Has suicide increased"));
    return chart > -1 && verdict > -1 && chart < verdict;
  })(),
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

await browser.close();
console.log(process.exitCode ? "RESULT: FAIL" : "RESULT: PASS");
