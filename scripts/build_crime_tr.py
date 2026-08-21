#!/usr/bin/env python3
"""
Transnational repression — the W11 register for the Crime page.

Sean's ask (2026-08-21): a section under Crime that says what TR is and how it
is measured, if at all. The honest answer is that the US government defines and
prosecutes it but publishes no statistics; the only systematic count is a
private one (Freedom House), which itself says reported incidents are a small
fraction of what occurs. That measurement gap is presented as a finding, the
same way the rest of the section treats uncounted categories.

All quotes and figures fetched from the cited sources on 2026-08-21.
Idempotent: rewrites crime_transnational.json and appends sources each run.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public/data/crime/tables"

TR = {
    "what_it_is": {
        "definition": (
            "When foreign governments reach beyond their borders to intimidate, silence, "
            "coerce, harass, or harm members of their diaspora and exile communities in "
            "the United States, that is transnational repression."
        ),
        "definition_source": "FBI Counterintelligence Division (quoted verbatim)",
        "philadelphia_definition": (
            "A foreign nation breaching national borders by physical or digital means to "
            "silence, coerce, or threaten exiles, dissidents, and members of religious or "
            "ethnic minority communities."
        ),
        "philadelphia_note": "FBI Philadelphia field office awareness release, 2025-03-13.",
        "tactics": [
            "Stalking and harassment",
            "Online disinformation campaigns",
            "Intimidation or threats",
            "Coercing victims to return to their country",
            "Threatening or detaining family members abroad",
            "Abusive legal practices — lawsuits, asset freezes, passport withholding",
            "Cyberhacking",
            "Assault",
            "Attempted kidnapping and murder",
        ],
        "tactics_note": (
            "The FBI's own tactic list. It is quoted here because it matters for this "
            "site: it is the US government stating that organised stalking, harassment "
            "and surveillance of individuals on US soil, directed by state actors, is a "
            "real and prosecuted category of crime."
        ),
        "named_states": "The FBI's page references Iran, the People's Republic of China, India and Russia.",
        "tier": "A",
        "source_id": "tr_fbi_program",
    },
    "how_it_is_measured": [
        {
            "who": "FBI / US government",
            "what": (
                "Defines TR, runs a dedicated task force, maintains field-office awareness "
                "programs (including Philadelphia's), and prosecutes cases. Publishes NO "
                "statistics: no annual count of TR incidents, investigations, or victims "
                "exists in any FBI or DOJ statistical series."
            ),
            "status": "Defined and prosecuted, not counted",
            "tier": "A",
            "source_id": "tr_fbi_program",
        },
        {
            "who": "Freedom House (private research organisation)",
            "what": (
                "The only systematic count in existence: a database of direct, PHYSICAL "
                "incidents — assassinations, assaults, detentions, unlawful deportations — "
                "recording 1,375 incidents by 54 governments across 107 host countries "
                "from 2014 through 2025 (126 in 2025; China, Vietnam and Russia the top "
                "perpetrators that year). By design it EXCLUDES the digital and "
                "harassment tactics on the FBI's own list, and Freedom House states that "
                "reported incidents 'likely represent only a small fraction of the total "
                "number of cases that occur.'"
            ),
            "status": "Counted narrowly, by a private body",
            "tier": "B",
            "source_id": "tr_fh_2025",
        },
        {
            "who": "Federal courts",
            "what": (
                "Prosecutions are the hardest record. Examples: 34 officers of a PRC "
                "national-police unit charged in the Eastern District of New York with "
                "perpetrating a transnational repression scheme targeting US residents; "
                "five individuals indicted for a scheme to silence PRC critics in the US; "
                "seven state-linked hackers charged with targeting critics of China. "
                "Cases establish that the tactics are real and chargeable — they are not "
                "a count of how often they occur."
            ),
            "status": "Adjudicated cases, not a statistic",
            "tier": "A",
            "source_id": "tr_edny_34",
        },
    ],
    "the_gap": (
        "So the measurement answer is: barely. The category most like this site's core "
        "subject — organised, deniable, state-directed harassment of individuals — is "
        "defined by the FBI, prosecuted in federal court, and counted by nobody in "
        "government. The one systematic dataset is private, counts only physical "
        "incidents, and describes itself as a small fraction of the whole. A person "
        "targeted by the tactics on the FBI's own list appears in no national statistic "
        "unless their case ends in an indictment."
    ),
    "discipline_note": (
        "What this register does not do: it does not connect any of these cases or "
        "counts to the journal, the Government Cloud record, or any individual's "
        "experience. TR's documented existence establishes that such tactics are used; "
        "it does not establish who uses them in any uncharged case."
    ),
}

SOURCES = [
    {"source_id": "tr_fbi_program",
     "url": "https://www.fbi.gov/investigate/counterintelligence/transnational-repression",
     "publisher": "FBI", "title": "Transnational Repression (counterintelligence program page)",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "tr_fbi_phila",
     "url": "https://www.fbi.gov/contact-us/field-offices/philadelphia/news/fbi-philadelphia-brings-awareness-to-transnational-repression",
     "publisher": "FBI Philadelphia", "title": "FBI Philadelphia Brings Awareness to Transnational Repression (2025-03-13)",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "tr_fh_2025",
     "url": "https://freedomhouse.org/article/authoritarian-collaboration-fueled-transnational-repression-2025",
     "publisher": "Freedom House", "title": "Tracking Transnational Repression in 2025 (published 2026-04-16)",
     "evidence_tier": "B", "accessed": "2026-08-21", "archived_url": None},
    {"source_id": "tr_edny_34",
     "url": "https://www.fbi.gov/contact-us/field-offices/newyork/news/thirty-four-officers-of-peoples-republic-of-china-national-police-charged-with-perpetrating-transnational-repression-scheme-targeting-us-residents",
     "publisher": "DOJ / EDNY", "title": "34 PRC National Police Officers Charged with Perpetrating Transnational Repression Scheme Targeting U.S. Residents",
     "evidence_tier": "A", "accessed": "2026-08-21", "archived_url": None},
]


def main():
    (OUT / "crime_transnational.json").write_text(json.dumps(TR, indent=2) + "\n")
    sources = json.loads((OUT / "crime_sources.json").read_text())
    have = {s["source_id"] for s in sources}
    added = [s for s in SOURCES if s["source_id"] not in have]
    sources.extend(added)
    (OUT / "crime_sources.json").write_text(json.dumps(sources, indent=2) + "\n")
    print(f"transnational register written | sources +{len(added)} (total {len(sources)})")


if __name__ == "__main__":
    main()
