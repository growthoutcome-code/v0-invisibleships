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

def main():
    failures, notes = [], []
    for path, sym, multi in CHARTS:
        src = (ROOT / path).read_text(encoding="utf-8")
        b = body(src, sym)
        if not b:
            failures.append(f"{sym}: not found in {path} — the registry is stale")
            continue

        clicks = bool(re.search(r"onClick|onOpen|onPick|__govOpenMilestone", b))
        modal = bool(re.search(r"Dialog|setOpen|onPick|onOpen", b))
        target = bool(re.search(r"r=\{?1[1-9]|r=\{?[2-9]\d|MobileBars", b))
        phone = bool(re.search(r"MobileBars", b)) or not multi

        if sym in EXEMPT:
            notes.append(f"  exempt  {sym:<16} {EXEMPT[sym]}")
            continue
        if not clicks: failures.append(f"{sym}: no click path — hover is not an interaction (rule 1)")
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
