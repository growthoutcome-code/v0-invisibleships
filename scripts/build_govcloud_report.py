#!/usr/bin/env python3
"""Turn the standalone Government Cloud dashboard into a native site component.

Reads   report-src/gov-cloud-dashboard.html      (the delivered artifact, untouched,
                                                 deliberately OUTSIDE public/ so the
                                                 unstyled standalone is not served)
Writes  components/GovCloudReport.tsx             (markup + scoped CSS, ~11 KB)
        public/reports/gov-cloud-report.js        (the drawing script, ~182 KB)

Why this works cleanly: the report's script contains ZERO hardcoded colours — every
colour resolves through a CSS custom property — so restyling it to the site's
monochrome language is a pure token remap. The drawing code is never edited.

What the transform does:
  1. Scopes every CSS selector under `.gov-report` so the report's stylesheet and
     globals.css cannot reach each other (what the iframe used to do structurally).
  2. Rebinds :root vars to the site's design tokens; maps the report's dark theme
     off `html.dark`, which is how ThemeToggle drives the rest of the site.
  3. Replaces the 5-hue series palette with a validated grayscale ramp.
  4. Drops the report's page background and its 1180px cap so it sits directly on
     the site surface at full container width.
  5. Rebinds fonts to the site's display/sans/serif stacks.

Re-run this whenever the dashboard is regenerated.
"""
import re, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "report-src", "gov-cloud-dashboard.html")
OUT_TSX = os.path.join(ROOT, "components", "GovCloudReport.tsx")
OUT_JS = os.path.join(ROOT, "public", "reports", "gov-cloud-report.js")

# Grayscale categorical ramp. Derived by binary search on CIE L* and checked for
# contrast against each surface; see the session notes. Slots 1-3 clear 3:1 in both
# modes. Slots 4-5 sit below it by necessity — five greys cannot all be high
# contrast on one surface — so they are only safe where position or a label carries
# identity too (timeline lanes, labelled bars), never as fill-only identity.
SERIES_LIGHT = ["#1f1f1f", "#4f4f4f", "#878787", "#b6b6b6", "#dddddd", "#6b6b6b"]  # slot 6: timeline lane F — identity carried by position+label, like slots 4-5
SERIES_DARK  = ["#f1f1f1", "#b6b6b6", "#878787", "#595959", "#343434", "#a3a3a3"]

LIGHT_VARS = f"""
  --surface-1: transparent;
  --surface-2: rgb(var(--panel));
  --text-primary: rgb(var(--foreground));
  --text-secondary: rgb(var(--muted));
  --text-muted: rgb(var(--muted));
  --grid: rgb(var(--edge));
  --warn: rgb(var(--foreground));
  --heat: var(--foreground);
  --series-1: {SERIES_LIGHT[0]}; --series-2: {SERIES_LIGHT[1]}; --series-3: {SERIES_LIGHT[2]};
  --series-4: {SERIES_LIGHT[3]}; --series-5: {SERIES_LIGHT[4]}; --series-6: {SERIES_LIGHT[5]};
"""

DARK_VARS = f"""
  --surface-1: transparent;
  --surface-2: rgb(var(--panel));
  --text-primary: rgb(var(--foreground));
  --text-secondary: rgb(var(--muted));
  --text-muted: rgb(var(--muted));
  --grid: rgb(var(--edge));
  --warn: rgb(var(--foreground));
  --heat: var(--foreground);
  --series-1: {SERIES_DARK[0]}; --series-2: {SERIES_DARK[1]}; --series-3: {SERIES_DARK[2]};
  --series-4: {SERIES_DARK[3]}; --series-5: {SERIES_DARK[4]}; --series-6: {SERIES_DARK[5]};
"""

# Typography rebind: the report shipped a generic system stack. Headings take the
# site display face, prose takes the reading serif, everything functional (tables,
# legends, axis labels) takes the site sans at its existing functional size.
TYPE_RULES = """
/* --- container: no inner shell -------------------------------------------
   The report shipped as a standalone page, so it carried its own 1180px
   centred wrapper with page padding. Inside the site it must add nothing:
   the site's <main> already sets the width and gutters. */
.gov-report .wrap { max-width: none !important; margin: 0 !important; padding: 0 !important; }
.gov-report { background: none !important; }
.gov-report .card, .gov-report .tile, .gov-report .track { background: none !important; }
.gov-report .dt th { background: none !important; }

/* --- type: the site's faces and scale ------------------------------------ */
.gov-report { font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif; font-size: 15px; }
.gov-report h1, .gov-report h2, .gov-report .tile .n {
  font-family: var(--font-display), var(--font-sans), sans-serif;
  font-weight: 600; letter-spacing: -0.01em;
}
/* The page already renders an <h1> ("Data") in the TitleBand, so the report's own
   title is demoted — one h1 per page. */
/* Header consolidation: the page's TitleBand already renders "Data" as the h1,
   and DataView no longer prints a standfirst, so the report's own long title is
   hidden and its stats subline becomes the single header line. */
.gov-report h1 { display: none; }
.gov-report .sub { margin: 0 0 20px; }
/* The control row is empty except on Timeline/Capabilities, where it holds the
   domain and category selects; collapse its spacing so it leaves no gap. */
.gov-report .bar { margin: 0; gap: 12px; }
.gov-report .bar:not(:has(> span:not(.hidden))) { margin: 0; min-height: 0; }
.gov-report h2 { font-size: 21px; margin: 40px 0 14px; }
.gov-report .tile .n { font-size: 34px; }
/* Prose takes the site's reading serif at the site's body size. Tables, legends
   and axis labels stay functional sizes in the site sans — 22px would break the
   dense registers and the heatmap. */
.gov-report .sub, .gov-report .note, .gov-report .callout {
  font-family: var(--font-serif), Georgia, serif; font-size: 22px; line-height: 1.5;
}
.gov-report .callout { border-left: 2px solid rgb(var(--edge)); background: none !important; }
/* Axis and series labels shipped at 10-12px, sized for a dense standalone page.
   At the site's scale they were unreadable, so every label class steps up. */
.gov-report .dt { font-size: 15px; }

/* loading shimmer: script-drawn containers are empty until the report JS has
   loaded and rendered (~1-4s). Give empty containers their final footprint and
   a subtle pulse so nothing pops in; the :empty selector self-clears the
   instant content is drawn. Static under prefers-reduced-motion. */
.gov-report .tiles:empty, .gov-report #tlsvg:empty, .gov-report .hbars:empty,
.gov-report #heat:empty, .gov-report #tline:empty, .gov-report #rcbars:empty {
  display: block; background: rgb(var(--panel)); border-radius: 12px;
  animation: gr-pulse 1.6s ease-in-out infinite;
}
.gov-report .tiles:empty { min-height: 92px; }
.gov-report #tlsvg:empty { min-height: 420px; }
.gov-report #heat:empty { min-height: 320px; }
.gov-report .hbars:empty, .gov-report #tline:empty, .gov-report #rcbars:empty { min-height: 160px; }
@keyframes gr-pulse { 0%,100% { opacity: 1 } 50% { opacity: .45 } }
@media (prefers-reduced-motion: reduce) {
  .gov-report .tiles:empty, .gov-report #tlsvg:empty, .gov-report .hbars:empty,
  .gov-report #heat:empty, .gov-report #tline:empty, .gov-report #rcbars:empty { animation: none; }
}
.gov-report .legend, .gov-report .foot, .gov-report .pill,
.gov-report .tile .l { font-size: 14px; }
.gov-report .hrow, .gov-report .tllab, .gov-report .tlval { font-size: 15px; }
.gov-report .hm th, .gov-report .hm td { font-size: 14px; }
.gov-report .hm th { font-weight: 600; padding: 4px 6px; }
/* Timeline + bar-chart text drawn inside SVG carries its own font-size attribute,
   which CSS must override explicitly to win. */
.gov-report svg text { font-size: 14px !important; }

/* --- vertical rhythm -----------------------------------------------------
   The report was laid out tight for a dense standalone page (5-8px paddings,
   6-24px margins). On the site it needs room to breathe, so every structural
   element gets vertical space. Applies to all six sub-pages. */
.gov-report .tabs { gap: 18px; margin: 0 0 28px; padding: 0 0 8px; }
.gov-report .bar { margin: 0 0 8px; }
.gov-report .tiles { gap: 34px 28px; margin: 0 0 52px; }
.gov-report h2 { margin: 56px 0 20px; }
.gov-report .card { margin: 0 0 16px; }
.gov-report .legend { gap: 22px; margin: 0 0 22px; }
.gov-report .note { margin: 0 0 20px; }
.gov-report .callout { margin: 32px 0; padding: 18px 0 18px 20px; }
.gov-report .dt th, .gov-report .dt td { padding: 14px 12px; }
.gov-report .hbars { gap: 14px; }
.gov-report .hrow { grid-template-columns: 190px 1fr 80px; gap: 14px; }
.gov-report .track { height: 22px; }
.gov-report .hm td { height: 38px; }
.gov-report .hm th { padding: 8px 6px; }
.gov-report .tl { height: 210px; padding: 16px 4px 0; gap: 14px; }
.gov-report .foot { margin-top: 48px; }

/* --- click modal ---------------------------------------------------------
   Hover gives a quick read; clicking a cell opens this, which is where the
   evidence lives — every deployment with its source, opening in a new tab. */
#gov-modal { position: fixed; inset: 0; z-index: 80; display: none; }
#gov-modal.on { display: block; }
#gov-modal .gm-back { position: absolute; inset: 0; background: rgb(var(--foreground) / 0.55); }
#gov-modal .gm-panel {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: min(760px, calc(100vw - 48px)); max-height: calc(100vh - 96px); overflow-y: auto;
  background: rgb(var(--background)); color: rgb(var(--foreground));
  border: 2px solid rgb(var(--foreground)); padding: 36px 40px 40px;
}
#gov-modal .gm-x {
  position: absolute; top: 18px; right: 20px; background: none; border: none;
  font-family: var(--font-sans), sans-serif; font-size: 14px; text-transform: uppercase;
  letter-spacing: .06em; color: rgb(var(--muted)); cursor: pointer;
}
#gov-modal .gm-x:hover { color: rgb(var(--foreground)); }
#gov-modal h3 {
  font-family: var(--font-display), sans-serif; font-size: 30px; font-weight: 600;
  margin: 0 0 6px; letter-spacing: -0.01em;
}
#gov-modal .gm-count, #gov-modal .gm-load {
  font-family: var(--font-serif), Georgia, serif; font-size: 20px; color: rgb(var(--muted)); margin: 0 0 26px;
}
#gov-modal .gm-list { list-style: none; margin: 0; padding: 0; }
#gov-modal .gm-list li {
  display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px 18px;
  padding: 16px 0; border-bottom: 1px solid rgb(var(--edge));
}
#gov-modal .gm-v { font-family: var(--font-sans), sans-serif; font-size: 18px; font-weight: 600; }
#gov-modal .gm-meta { font-family: var(--font-sans), sans-serif; font-size: 15px; color: rgb(var(--muted)); }
#gov-modal .gm-src {
  margin-left: auto; font-family: var(--font-sans), sans-serif; font-size: 15px;
  color: rgb(var(--foreground)); text-decoration: underline; text-underline-offset: 3px;
  display: inline-flex; align-items: baseline; gap: 10px;
}
#gov-modal .gm-tier {
  font-size: 13px; letter-spacing: .04em; text-transform: uppercase;
  color: rgb(var(--muted)); text-decoration: none;
}

/* --- hover layer ---------------------------------------------------------
   The report relied on native title="" tooltips, which the browser renders at a
   fixed ~12px and which cannot carry markup. #tip existed but was never filled.
   The enhancement script below moves each title into data-tip (suppressing the
   native bubble) and renders it here at the site's body size — roughly double. */
/* The report's showTip() sets style.opacity — so this must NOT use display:none,
   or opacity can never reveal it. That mismatch is what hid the hover entirely. */
.gov-report #tip {
  position: fixed; z-index: 60; opacity: 0; pointer-events: none;
  transition: opacity .12s ease;
  max-width: 520px; padding: 14px 18px;
  background: rgb(var(--background)); color: rgb(var(--foreground));
  border: 1px solid rgb(var(--edge));
  font-family: var(--font-serif), Georgia, serif; font-size: 22px; line-height: 1.4;
  box-shadow: 0 2px 18px rgb(var(--foreground) / 0.12);
}

.gov-report #tip .src { display: block; margin-top: 10px; font-family: var(--font-sans), sans-serif;
  font-size: 15px; color: rgb(var(--muted)); }
.gov-report svg rect, .gov-report .tlbar { shape-rendering: crispEdges; }

/* --- flat, borderless, square: match the site ----------------------------
   The report shipped as cards — 1px borders and 8-12px radii. The site is
   borderless with every radius forced to 0 in tailwind.config, so strip both. */
.gov-report .tile, .gov-report .card { border: none !important; }
/* Borderless, but the metric tiles still need to read as blocks — so they keep a
   theme-aware surface (--panel: #f5f5f5 light / #151515 dark) and their padding.
   Charts sit flush with no card padding. */
/* Stat tiles carry no data in their background, so under the stark B/W rule they
   carry no background at all — the number and its label do the work. Only marks
   whose fill ENCODES a value keep one (heatmap cells, bar fills). */
.gov-report .tile { background: none !important; padding: 0 !important; }
.gov-report .card { background: none !important; padding: 0 !important; }
.gov-report .track { background: rgb(var(--foreground) / 0.10) !important; }
.gov-report .card { overflow-x: auto; overflow-y: visible; }

.gov-report * { border-radius: 0 !important; }
.gov-report button.ctl, .gov-report select, .gov-report .pill, .gov-report #tip {
  border: 1px solid rgb(var(--edge)) !important;
}
.gov-report .callout { border: none !important; border-left: 2px solid rgb(var(--edge)) !important; }

/* --- adoption heatmap ---------------------------------------------------
   Cells are painted rgba(ink, 0.18-1.0) by count, so the fill IS the data and the
   gradation must survive intact — an earlier uniform ink overlay crushed that
   range to 0.63-1.0 and every cell looked alike. Nothing is overlaid now.

   Digit contrast is handled per-cell in the enhancement script instead: it reads
   each cell's alpha and picks surface-on-ink or ink-on-surface, so numbers stay
   legible at both ends of the ramp in both themes. */
.gov-report .hm { width: 100%; table-layout: fixed; }
.gov-report .hm td {
  width: auto; height: 38px;
  font-weight: 700; font-variant-numeric: tabular-nums;
  cursor: pointer;
}
.gov-report .hm td:not(.z):hover { outline: 2px solid rgb(var(--foreground)); outline-offset: -2px; }
.gov-report .hm td.z { cursor: default; }
/* Crosshair: hovering a cell marks its row and column headers, so the value can
   never be misattributed to the wrong domain — the failure mode when 21 columns
   share one grid. */
.gov-report .hm th.xh {
  color: rgb(var(--background)) !important;
  background: rgb(var(--foreground)) !important;
}
.gov-report .hm td.xh-cell { outline: 2px solid rgb(var(--foreground)); outline-offset: -2px; }

/* --- adoption grid: mobile alternative -----------------------------------
   A 21-column x 28-row matrix cannot be made legible on a phone by scaling —
   it needs a different form. Below 900px the grid is replaced by a stacked
   list: one block per geography, its domains ranked by count, each row a
   tappable bar that opens the same detail modal. Same data, same interaction,
   linear instead of tabular. */
.gov-report .hmm { display: none; }
@media (max-width: 900px) {
  .gov-report .hm { display: none; }
  .gov-report .hmm { display: block; }
}
.gov-report .hmm-geo {
  display: flex; align-items: baseline; justify-content: space-between; gap: 16px;
  margin: 32px 0 12px; padding-bottom: 8px;
  border-bottom: 1px solid rgb(var(--edge));
}
.gov-report .hmm-geo b { font-family: var(--font-display), sans-serif; font-size: 19px; font-weight: 600; }
.gov-report .hmm-geo span { font-size: 15px; color: rgb(var(--muted)); }
.gov-report .hmm ul { list-style: none; margin: 0; padding: 0; }
.gov-report .hmm li { margin: 0 0 8px; }
.gov-report .hmm button {
  width: 100%; display: grid; grid-template-columns: 1fr auto; align-items: center;
  gap: 12px; background: none; border: none; padding: 10px 0; cursor: pointer;
  font-family: var(--font-sans), sans-serif; font-size: 16px; text-align: left;
  color: rgb(var(--foreground));
}
.gov-report .hmm .hmm-bar { grid-column: 1 / -1; height: 10px; }
.gov-report .hmm .hmm-n { font-weight: 700; font-variant-numeric: tabular-nums; }
/* 21 domain columns in a fixed-layout table give ~50px each — nowhere near
   enough for labels like "defence-intel", which previously overflowed into their
   neighbours and made the whole grid unreadable. Rotate the column headers so the
   full name is legible and the columns can stay narrow. */
.gov-report .hm thead th {
  writing-mode: vertical-rl; transform: rotate(180deg);
  height: 165px; vertical-align: bottom; text-align: left;
  white-space: nowrap; padding: 6px 2px; font-size: 14px;
  color: rgb(var(--foreground));
}
.gov-report .hm thead th:first-child { writing-mode: horizontal-tb; transform: none; width: 108px; }
.gov-report .hm tbody th {
  writing-mode: horizontal-tb; transform: none; text-align: left;
  font-size: 14px; padding: 0 10px 0 0; white-space: nowrap;
  color: rgb(var(--foreground));
}
"""


# Appended to the drawing script. Replaces native title="" tooltips with a real
# hover layer at the site's body size. Runs after render() so every generated mark
# already exists; new marks are handled too, since the listener is delegated.
ENHANCE_JS = """
;(function(){
  var host = document.querySelector('.gov-report');
  if (!host) return;
  var tip = document.getElementById('tip');

  /* ---- 1. heatmap gradation ---------------------------------------------
     The report paints cells rgba(ink, 0.18-1.0), which in light mode leaves the
     low-count end almost white — and its digits are white, so they vanished.

     Fix the band rather than the type: each cell's alpha is remapped onto an
     explicit 13-step grayscale ramp chosen so the LIGHTEST step still carries
     inverted digits (3.74:1 light / 3.88:1 dark on bold text, rising to 21:1).
     The gradation stays visible across the whole range and the numbers stay
     white — no black type, no flattening overlay.

     Ramps are precomputed from CIE L* (55->0 light, 45->100 dark) so the steps
     are perceptually even rather than evenly spaced in sRGB. */
  var RAMP_L = ['#848484','#777777','#6c6c6c','#616161','#565656','#4b4b4b','#404040','#363636','#2c2c2c','#232323','#191919','#0f0f0f','#000000'];
  var RAMP_D = ['#6a6a6a','#757575','#828282','#8e8e8e','#9a9a9a','#a6a6a6','#b2b2b2','#bfbfbf','#cbcbcb','#d8d8d8','#e5e5e5','#f2f2f2','#ffffff'];

  function maxCount(){
    var mx = 0;
    host.querySelectorAll('.hm td:not(.z)').forEach(function(td){
      var n = parseFloat(td.textContent) || 0; if (n > mx) mx = n;
    });
    return mx;
  }

  function inkCells(){
    var dark = document.documentElement.classList.contains('dark');
    var ramp = dark ? RAMP_D : RAMP_L;
    host.querySelectorAll('.hm td:not(.z)').forEach(function(td){
      if (!td.dataset.alpha) {
        // Accept the original rgba(...,A) form or the rewritten rgb(... / A) one,
        // and fall back to count-over-max so the ramp paints regardless.
        var st = td.getAttribute('style') || '';
        var m = st.match(/--heat\)\s*[,/]\s*([0-9.]+)/);
        if (m) { td.dataset.alpha = m[1]; }
        else {
          var n = parseFloat(td.textContent) || 0;
          td.dataset.alpha = String(Math.min(1, 0.18 + 0.82 * (n / (maxCount() || 1))));
        }
      }
      var a = parseFloat(td.dataset.alpha);
      var t = Math.max(0, Math.min(1, (a - 0.18) / 0.82));
      td.style.background = ramp[Math.round(t * (ramp.length - 1))];
      td.style.color = dark ? '#000' : '#fff';
    });
  }
  /* Re-ink when the site theme flips — the two ramps are separate, not inverses. */
  new MutationObserver(function(){ inkCells(); buildMobile(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  /* ---- 2. source data (lazy) ------------------------------------------
     The report's inlined DATA carries no source URLs, so resolve them from the
     published dataset: deployments -> source_id -> sources.url. */
  var db = null, loading = null;
  function loadDb(){
    if (db) return Promise.resolve(db);
    if (loading) return loading;
    loading = Promise.all([
      fetch('/data/tables/deployments.json').then(function(r){ return r.json(); }),
      fetch('/data/tables/sources.json').then(function(r){ return r.json(); }),
      fetch('/data/tables/vendors.json').then(function(r){ return r.json(); }).catch(function(){ return []; })
    ]).then(function(res){
      var byId = {}; res[1].forEach(function(s){ byId[s.id] = s; });
      var vn = {}; (res[2]||[]).forEach(function(v){ vn[v.id] = v.name || v.id; });
      db = { deployments: res[0], sources: byId, vendors: vn };
      return db;
    }).catch(function(){ db = { deployments: [], sources: {}, vendors: {} }; return db; });
    return loading;
  }

  /* ---- 3. modal on click ----------------------------------------------- */
  var modal = document.createElement('div');
  modal.id = 'gov-modal';
  modal.innerHTML = '<div class="gm-back"></div><div class="gm-panel" role="dialog" aria-modal="true">'
    + '<button class="gm-x" aria-label="Close">Close</button><div class="gm-body"></div></div>';
  document.body.appendChild(modal);
  var body = modal.querySelector('.gm-body');
  function closeModal(){ modal.classList.remove('on'); }
  modal.querySelector('.gm-back').addEventListener('click', closeModal);
  modal.querySelector('.gm-x').addEventListener('click', closeModal);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal(); });

  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }

  function openCell(g, d, count, label){
    body.innerHTML = '<h3>' + esc(label || g) + ' &middot; ' + esc(d) + '</h3>'
      + '<p class="gm-count">' + esc(count) + ' deployment' + (count == 1 ? '' : 's') + '</p>'
      + '<p class="gm-load">Loading sources&hellip;</p>';
    modal.classList.add('on');
    loadDb().then(function(x){
      var rows = x.deployments.filter(function(r){ return r.geography_id === g && r.domain_id === d; });
      var html = '<h3>' + esc(label || g) + ' &middot; ' + esc(d) + '</h3>'
        + '<p class="gm-count">' + rows.length + ' deployment' + (rows.length === 1 ? '' : 's') + '</p>';
      if (!rows.length) { html += '<p class="gm-load">No linked records in the published dataset.</p>'; }
      html += '<ul class="gm-list">';
      rows.forEach(function(r){
        var src = x.sources[r.source_id];
        var vend = x.vendors[r.vendor_id] || r.vendor_id || r.vendor || '';
        html += '<li><span class="gm-v">' + esc(vend || 'â€”') + '</span>'
          + '<span class="gm-meta">' + esc(r.status || '') + (r.adoption_stage ? ' &middot; ' + esc(r.adoption_stage) : '') + '</span>';
        if (src) {
          html += '<a class="gm-src" href="' + esc(src.url) + '" target="_blank" rel="noreferrer noopener">'
            + esc(src.publisher || src.title || 'source') + ' &#8599;'
            + '<span class="gm-tier">Tier ' + esc(src.evidence_tier) + '</span></a>';
        }
        html += '</li>';
      });
      html += '</ul>';
      body.innerHTML = html;
    });
  }

  /* ---- 4. bind heatmap cells ------------------------------------------- */
  function bind(){
    inkCells();
    buildMobile();
    host.querySelectorAll('.hm td:not(.z)').forEach(function(td){
      if (td.dataset.bound) return;
      td.dataset.bound = '1';
      td.setAttribute('tabindex', '0');
      // Self-describing coordinates, so the cell is unambiguous even without the
      // header row in view.
      var rowTh = td.closest('tr') ? td.closest('tr').querySelector('th') : null;
      td.setAttribute('aria-label',
        (rowTh ? rowTh.textContent.trim() : td.dataset.g) + ' / ' + td.dataset.d + ': ' + td.textContent.trim());
      td.addEventListener('click', function(){
        var row = td.closest('tr'), th = row ? row.querySelector('th') : null;
        openCell(td.dataset.g, td.dataset.d, td.textContent.trim(), th ? th.textContent.trim() : td.dataset.g);
      });
      td.addEventListener('keydown', function(e){ if (e.key === 'Enter') td.click(); });

      td.addEventListener('mouseenter', function(){
        var row = td.closest('tr');
        var idx = Array.prototype.indexOf.call(row.children, td);
        var head = host.querySelector('.hm thead tr');
        if (head && head.children[idx]) head.children[idx].classList.add('xh');
        var rh = row.querySelector('th'); if (rh) rh.classList.add('xh');
        td.classList.add('xh-cell');
      });
      td.addEventListener('mouseleave', function(){
        host.querySelectorAll('.hm th.xh').forEach(function(el){ el.classList.remove('xh'); });
        td.classList.remove('xh-cell');
      });
    });
  }

  /* ---- mobile alternative to the grid ---------------------------------
     Built from the rendered table so it can't drift from it: same counts, same
     geo/domain ids, same modal on tap. Rebuilt whenever the grid redraws. */
  function buildMobile(){
    var table = host.querySelector('.hm');
    if (!table) return;
    var heads = Array.prototype.slice.call(table.querySelectorAll('thead th'))
      .map(function(th){ return th.textContent.trim(); });
    var dark = document.documentElement.classList.contains('dark');
    var ramp = dark ? RAMP_D : RAMP_L;

    var wrap = host.querySelector('.hmm');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'hmm';
      table.parentNode.insertBefore(wrap, table.nextSibling);
    }

    var html = '';
    Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function(tr){
      var geo = tr.querySelector('th');
      var cells = Array.prototype.slice.call(tr.querySelectorAll('td:not(.z)'))
        .map(function(td){
          return { d: td.dataset.d, g: td.dataset.g,
                   n: parseFloat(td.textContent) || 0,
                   a: parseFloat(td.dataset.alpha || '0.18') };
        })
        .filter(function(c){ return c.n > 0; })
        .sort(function(a, b){ return b.n - a.n; });
      if (!cells.length) return;
      var total = cells.reduce(function(s, c){ return s + c.n; }, 0);
      var mx = cells[0].n;
      html += '<div class="hmm-geo"><b>' + (geo ? geo.textContent.trim() : '') + '</b>'
            + '<span>' + total + ' deployment' + (total === 1 ? '' : 's') + '</span></div><ul>';
      cells.forEach(function(c){
        var step = ramp[Math.round(Math.max(0, Math.min(1, (c.a - 0.18) / 0.82)) * (ramp.length - 1))];
        html += '<li><button type="button" data-g="' + c.g + '" data-d="' + c.d + '" data-n="' + c.n + '">'
              + '<span>' + c.d + '</span><span class="hmm-n">' + c.n + '</span>'
              + '<span class="hmm-bar" style="background:' + step + ';width:'
              + Math.max(4, Math.round(100 * c.n / mx)) + '%"></span>'
              + '</button></li>';
      });
      html += '</ul>';
    });
    wrap.innerHTML = html;

    wrap.querySelectorAll('button').forEach(function(b){
      b.addEventListener('click', function(){
        var geoLabel = b.closest('ul').previousElementSibling;
        openCell(b.dataset.g, b.dataset.d, b.dataset.n,
                 geoLabel ? geoLabel.querySelector('b').textContent.trim() : b.dataset.g);
      });
    });
  }

  /* The report renders once on load; observe in case a filter redraws it. */
  var heat = document.getElementById('heat');
  if (heat) {
    bind();
    new MutationObserver(bind).observe(heat, { childList: true, subtree: true });
  }

  /* Keep the tooltip on screen — showTip clamps to a 300px width assumption. */
  host.addEventListener('mousemove', function(e){
    if (!tip || parseFloat(getComputedStyle(tip).opacity) === 0) return;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var x = e.clientX + 16, y = e.clientY + 16;
    if (x + w > innerWidth - 12)  x = e.clientX - w - 16;
    if (y + h > innerHeight - 12) y = e.clientY - h - 16;
    tip.style.left = Math.max(8, x) + 'px';
    tip.style.top  = Math.max(8, y) + 'px';
  });
})();
"""


def scope_css(css: str) -> str:
    """Prefix every selector with .gov-report; rebind :root and body rules."""
    out = []
    # Drop the prefers-color-scheme block entirely — the site drives theme explicitly
    # via html.dark, and leaving it in would let the OS override the toggle.
    css = re.sub(r'@media\(prefers-color-scheme:dark\)\{:root:not\(\[data-theme="light"\]\)\{[^}]*\}\}', "", css)

    for block in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
        sel, body = block.group(1).strip(), block.group(2).strip()
        if not sel:
            continue
        if sel.startswith("@"):
            out.append(f"{sel}{{{body}}}")
            continue
        if sel == ":root":
            out.append(f".gov-report{{{LIGHT_VARS}}}")
            continue
        if sel == ':root[data-theme="dark"]':
            out.append(f"html.dark .gov-report{{{DARK_VARS}}}")
            continue
        if sel == "body":
            # Keep layout declarations, drop background and page margin.
            keep = [d for d in body.split(";")
                    if d.strip() and not d.strip().startswith(("background", "margin", "color"))]
            out.append(".gov-report{" + ";".join(keep) + "}")
            continue
        parts = [f".gov-report {p.strip()}" if p.strip() != "*" else ".gov-report *"
                 for p in sel.split(",")]
        out.append(f"{', '.join(parts)}{{{body}}}")

    scoped = "\n".join(out)
    # Full container width: the report capped itself at 1180px for standalone viewing.
    scoped = scoped.replace("max-width:1180px", "max-width:none")
    return scoped + "\n" + TYPE_RULES


def main():
    html = open(SRC, encoding="utf-8").read()
    css = re.findall(r"<style[^>]*>(.*?)</style>", html, re.S)[0]
    js = re.findall(r"<script[^>]*>(.*?)</script>", html, re.S)[0]
    body = re.search(r"<body[^>]*>(.*)</body>", html, re.S).group(1)
    markup = re.sub(r"<script[^>]*>.*?</script>", "", body, flags=re.S).strip()

    # The report carried its own light/dark switch. The site's ThemeToggle already
    # owns theme (and the report's dark rules are rebound to html.dark), so the
    # control is redundant — and its handler wrote data-theme, which now matches
    # nothing. Remove the button AND the listener; leaving the listener with the
    # button gone would throw on a null element and stop render() ever running.
    btn = '<button class="ctl" id="themeBtn">Toggle theme</button>'
    assert btn in markup, "theme button markup not found — did the report change?"
    markup = markup.replace(btn, "")

    handler = ("document.getElementById('themeBtn').onclick=()=>{const r=document.documentElement;"
               "r.dataset.theme=(r.dataset.theme==='dark'?'light':'dark')};")
    assert handler in js, "theme button handler not found — did the report change?"
    js = js.replace(handler, "")

    # Tier C is included by default (let includeC=true). Assert it, so a future
    # regeneration that flips the default fails loudly instead of silently hiding
    # 52 Tier C sources.
    assert "includeC=true" in js, "Tier C is no longer included by default"

    # The heatmap emits inline `rgba(var(--heat),A)`. Valid when --heat was a
    # comma-separated triplet (42,120,214); rebound to the site's --foreground it
    # becomes `rgba(0 0 0, A)`, and space-separated values inside rgba() are INVALID
    # — the browser drops the declaration and every cell renders with no background.
    # Rewrite to the modern slash form, which accepts a space-separated triplet.
    old_fill = "background:rgba(var(--heat),${a})"
    assert old_fill in js, "heatmap fill expression not found — did the report change?"
    js = js.replace(old_fill, "background:rgb(var(--heat) / ${a})")

    # Tier C is always in. The toggle and its handler both go — removing the button
    # alone would leave the listener throwing on a null element and render() would
    # never run. The "hover for detail" hint goes with it, leaving the control row
    # empty on every tab except Timeline (domain filter) and Capabilities
    # (category filter), where it still holds those selects.
    tier_btn = '<button class="ctl on" id="tierBtn">Including Tier C</button>'
    assert tier_btn in markup, "tier button markup not found — did the report change?"
    markup = markup.replace(tier_btn, "")

    tier_handler = ("document.getElementById('tierBtn').onclick=function(){includeC=!includeC;"
                    "this.textContent=includeC?'Including Tier C':'Excluding Tier C';"
                    "this.classList.toggle('on',includeC);render()};")
    assert tier_handler in js, "tier button handler not found — did the report change?"
    js = js.replace(tier_handler, "")

    hint = '<span style="color:var(--text-muted);font-size:12px">Hover any mark for detail.</span>'
    if hint in markup:
        markup = markup.replace(hint, "")

    open(OUT_JS, "w", encoding="utf-8").write(js + ENHANCE_JS)

    scoped = scope_css(css)
    tsx = '''"use client";
// GENERATED by scripts/build_govcloud_report.py — do not edit by hand.
// Source: report-src/gov-cloud-dashboard.html
//
// The report renders natively in the page (no iframe). Its CSS is scoped under
// .gov-report so it cannot collide with globals.css in either direction, its
// palette is rebound to the site's monochrome tokens, and its drawing script is
// loaded from /reports/gov-cloud-report.js on mount — innerHTML never executes
// scripts, so it has to be injected deliberately.
import { useEffect } from "react";

const CSS = `%%CSS%%`;
const MARKUP = `%%MARKUP%%`;
const SCRIPT_ID = "gov-cloud-report-script";

export default function GovCloudReport() {
  useEffect(() => {
    // React 18 StrictMode mounts effects twice in dev. An earlier version removed
    // the <script> on cleanup, which aborted the in-flight fetch before it ran and
    // left the report blank. So: never remove it, and key off its presence in the
    // DOM rather than a ref, which also survives navigating away and back.
    if (document.getElementById(SCRIPT_ID)) return;
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = "/reports/gov-cloud-report.js";
    s.async = false;
    document.body.appendChild(s);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="gov-report w-full" dangerouslySetInnerHTML={{ __html: MARKUP }} />
    </>
  );
}
'''
    esc = lambda t: t.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
    tsx = tsx.replace("%%CSS%%", esc(scoped)).replace("%%MARKUP%%", esc(markup))
    open(OUT_TSX, "w", encoding="utf-8").write(tsx)

    print(f"markup {len(markup):>7,} chars -> components/GovCloudReport.tsx")
    print(f"css    {len(scoped):>7,} chars (scoped, monochrome)")
    print(f"js     {len(js):>7,} chars -> public/reports/gov-cloud-report.js")


if __name__ == "__main__":
    main()
