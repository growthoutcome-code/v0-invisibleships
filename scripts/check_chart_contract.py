#!/usr/bin/env python3
"""Every chart mark must be reachable, and must lead to a source.

THE CONTRACT (Sean, 2026-08-27)
-------------------------------
    1. A mark opens a modal on click. Hover alone is not an interaction — a
       phone has no hover, and half this audience is on a phone.
    2. The tap target is at least 11px. The visible mark may stay small; an
       invisible circle carries the touch.
    3. The modal names a SOURCE, with its evidence tier where the data has one.
       Figures and method are not a citation.
    4. A multi-series chart has a phone view that is not the chart. Six to
       fourteen lines cannot be told apart in 330px at any padding, and a chart
       that is legible but unreadable is worse than one that is neither, because
       nobody reports it.
    5. (added 2026-08-28) A transparent overlay that covers the plot must be
       clickable itself. fill="transparent" RECEIVES pointer events — unlike
       fill="none" — so an overlay drawn for hover sits on top of everything
       below it and eats every click. This is invisible in source review and
       invisible on a desktop, where hover still works.

WHY RULE 5 EXISTS, AND WHAT IT SAYS ABOUT RULES 1 AND 2
------------------------------------------------------
Sean reported on 28 August that the suicide chart's lines could not be clicked.
They could not. MultiLineChart had correct per-series hit paths — transparent
stroke, 14px, onClick, exactly what rule 2 asks for — and a bank of
fill="transparent" hover columns rendered AFTER them, covering the whole plot.
Every click in the plot area hit a column and stopped. The only reachable
targets left were the legend and the right-edge labels, both outside the plot.

This script passed every run. Rule 1 was satisfied because `onClick` appears
somewhere in the component; it never asked whether the click was on a MARK or on
a button in the toolbar. Rule 2 was satisfied because `MobileBars` appears in the
body — a phone-view symbol standing in for a tap target on a desktop plot, which
is nonsense. Both checks tested for the presence of a handler, not for the
reachability of a mark.

That is the same mistake made once already in this repository, in the static
chart inventory of 27 August, which reported the ICE detention chart as having no
click because it looked for onClick on an SVG mark and the binding was on the
legend. Reading source is not a substitute for opening the page. These rules
narrow the gap; they do not close it.

Why this is a script and not a document: the site shipped eight Government Cloud
briefs that no page linked to for three weeks, and a chart with clipped axis
labels the day after it was written. Written-down rules decay silently. A rule
that fails the build does not.

    python3 scripts/check_chart_contract.py
    python3 scripts/check_chart_contract.py --check
"""
import sys, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Every chart, and what it owes. `exempt` carries a REASON, never a shrug —
# an exemption without an argument is a defect with paperwork.
CHARTS = [
    # component file,                    symbol,            multi-series
    ("components/ResearchCharts.tsx",    "EvidenceSpan",    False),
    ("components/ResearchCharts.tsx",    "BarRows",         False),
    ("components/HealthSignals.tsx",     "MultiLineChart",  True),
    ("components/HealthSignals.tsx",     "LineChart",       False),
    ("components/CrimeSignals.tsx",      "LaneChart",       True),
    ("components/CrimeSignals.tsx",      "TwoSeriesChart",  True),
    ("components/IntlLineChart.tsx",     "IntlLineChart",   True),
    ("components/DetentionChart.tsx",    "DetentionChart",  True),
]

EXEMPT = {
    # symbol: reason. Read these before adding one.
    "BarRows": "Already a list. It IS the phone view; there is no plot to replace.",
    "LineChart": "Single series — the overdose curve. A ranked list would be one row "
                 "with nothing to compare, and the shape (a 26.2% fall in 2024) is the "
                 "entire finding. It keeps its plot at every width.",
}

def body(text: str, symbol: str) -> str:
    """The source of one component, from its declaration to the next top-level one."""
    m = re.search(rf"^(?:export )?(?:default )?function {symbol}\b", text, re.M)
    if not m:
        return ""
    nxt = re.search(r"^(?:export )?(?:default )?function \w+", text[m.end():], re.M)
    return text[m.start(): m.end() + (nxt.start() if nxt else len(text))]

def strip_comments(text: str) -> str:
    """Blank the inside of {/* ... */} and /* ... */ while preserving line count.

    Every rule below scans for markup, and prose about markup is not markup.
    Rule 5's first run flagged the comment that documents rule 5, because it
    quotes fill="transparent" — a guard reading its own explanation as a defect.
    Newlines survive so reported line numbers still point at the real thing.
    """
    out, i, n = [], 0, len(text)
    while i < n:
        start = text.find("/*", i)
        if start < 0:
            out.append(text[i:])
            break
        end = text.find("*/", start + 2)
        if end < 0:
            out.append(text[i:])
            break
        end += 2
        out.append(text[i:start])
        out.append("".join(c if c == "\n" else " " for c in text[start:end]))
        i = end
    return "".join(out)


def main():
    failures, notes = [], []
    for path, sym, multi in CHARTS:
        src = (ROOT / path).read_text(encoding="utf-8")
        b = strip_comments(body(src, sym))
        if not b:
            failures.append(f"{sym}: not found in {path} — the registry is stale")
            continue

        # Rule 1, properly: a click on a MARK, not merely a click somewhere in
        # the component. A toolbar button is not an interaction with the data.
        # Every onClick is resolved back to the element it is attached to by
        # walking up to the nearest opening tag.
        clicked_tags = set()
        blines = b.splitlines()
        for i, ln in enumerate(blines):
            if "onClick" not in ln and "onOpen" not in ln:
                continue
            for j in range(i, max(-1, i - 10), -1):
                tag = re.search(r"<([a-zA-Z][\w.]*)", blines[j])
                if tag:
                    clicked_tags.add(tag.group(1))
                    break
        MARKS = {"path", "circle", "rect", "g", "line", "polyline", "text", "a"}
        clicks = bool(clicked_tags & MARKS) or "__govOpenMilestone" in b
        modal = bool(re.search(r"Dialog|setOpen|onPick|onOpen", b))
        target = bool(re.search(r"r=\{?1[1-9]|r=\{?[2-9]\d|MobileBars", b))
        phone = bool(re.search(r"MobileBars", b)) or not multi

        if sym in EXEMPT:
            notes.append(f"  exempt  {sym:<16} {EXEMPT[sym]}")
            continue
        # Rule 5: a transparent overlay is a click sink unless it is clickable.
        sinks = []
        for i, ln in enumerate(blines):
            if 'fill="transparent"' not in ln:
                continue
            window = "\n".join(blines[max(0, i - 6): i + 12])
            if "onClick" not in window:
                sinks.append(i + 1)

        if not clicks:
            failures.append(
                f"{sym}: no click on a mark — onClick was found only on {sorted(clicked_tags) or 'nothing'}; "
                "a toolbar button is not an interaction with the data (rule 1)"
            )
        if sinks:
            failures.append(
                f"{sym}: transparent overlay at line {sinks[0]} of the component has no onClick — "
                "fill=\"transparent\" receives pointer events and will swallow every click "
                "beneath it (rule 5)"
            )
        if not modal:  failures.append(f"{sym}: click leads to no modal (rule 1)")
        if not target: failures.append(f"{sym}: no >=11px tap target (rule 2)")
        if not phone:  failures.append(f"{sym}: multi-series with no phone view (rule 4)")

    for n in notes: print(n)
    if failures:
        print("\nFAIL: the chart contract is not met.\n")
        for f in failures: print("  " + f)
        print("\nSee the contract at the top of scripts/check_chart_contract.py. "
              "An exemption needs a reason in EXEMPT, not a deletion from CHARTS.")
        return 1
    print(f"chart contract: {len(CHARTS) - len(EXEMPT)} charts checked, all meet it "
          f"({len(EXEMPT)} exempt with reasons)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
