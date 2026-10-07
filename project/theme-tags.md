# Theme tags — journal and concepts

*Set 30 Sep 2026 (Sean: "I'll go with your suggested list … let's do both at the
same time, journal and concepts filter"). One vocabulary for both, so a reader who
filters the journal by a theme and then the concepts by the same theme is looking
at the same subject.*

## How a theme is assigned

- A theme is assigned by **reading** the document, not by keyword. Keyword lists
  were tried first and failed: "Speculation" matched 377 of 417 journal documents,
  so it narrowed nothing.
- Tag a theme when it is a **real part** of the document — a reader filtering by
  it would want to see this document. A passing word is not enough.
- A document can carry several themes, or none.
- Themes describe **what the text contains**, never whether it is true. Every
  statement in the journal is an external communication (the Critical
  Disclaimer); a "Death threats" tag says a threat is recorded, not that one was
  made by any named person.
- Each tag keeps a short evidence quote (the words in the document that justify
  it) in the tagging record, so any tag can be checked.

## The themes

| Slug | Label | Assign when the document… |
|---|---|---|
| `proposed-solutions` | Proposed solutions | proposes or discusses a remedy, fix, investigation, support, policy, safeguard or way out — the author's or in statements |
| `harassment` | Harassment | records ongoing harassment: insults, taunting, torment, slurs, smear or discrediting aimed at the author or others |
| `speculation` | Speculation | offers a substantive explanation or theory — who is behind it, why, how it works — presented as uncertain (the author's or in statements) |
| `technology` | Technology | discusses the technology involved: neurotech, BCI, EMF / directed energy, implants, AI, software, devices |
| `nanotechnology` | Nanotechnology | discusses nanotechnology itself: nanotech in the body or the community, nanoparticles, nanites, nanomaterial devices such as transparent BCIs (added 7 Oct 2026; a passing mention, such as naming a company or publication, is not enough) |
| `death-threats` | Death threats | records a threat to kill, or a statement that someone will die or be killed |
| `euthanization` | Euthanization | records pressure to accept euthanasia / euthanization, "euthanization lists", assisted suicide or "ushering" |
| `obedience-coercion` | Obedience & coercion | records demands to comply, obey, confess or submit, or other coercive pressure (beyond euthanasia itself) |
| `violence` | Violence | describes physical violence: attacks, executions, injuries, bodies (point-of-view scenes or statements) |
| `sexual-harassment` | Sexual harassment | records sexual comments, unwanted sexual content or sensations |
| `surveillance` | Surveillance & memory access | records being watched or listened to, shared point of view, access to memories or thoughts, loss of privacy |
| `terrorism` | Terrorism | discusses terrorism, terrorists or attacks framed as terror |
| `law-government` | Law enforcement & government | involves police, FBI, CIA, DEA, courts, officials or government bodies — mentioned, blamed or appealed to |
| `family-network` | Family & personal network | involves the author's family, friends, employers or personal and professional network |
| `health-effects` | Health & physical effects | records physical symptoms or effects: pain, nausea, sleep loss, sensations, medical matters |
| `rescue-announcements` | Rescue & public announcements | records promised rescue or help, public announcements, or calls for public acknowledgement |

## No organization or name lists

Organization tags (the organizations each document names) were built on 30 Sep 2026
and removed the same day from all three copies (Sean: "I don't want us creating lists
of organizations or lists of names anywhere in the site"). The site documents
Zersetzung, and defamation and false accusation are among its tactics: the names are
statements made to the author, likely false in most cases, and a list would present
them as findings, repeating the tactic. The site is not a campaign against any
organization. Search
still reads the full text. There is deliberately no "Accusations" filter either.
`scripts/check_no_name_lists.py` fails the build if such a list reappears.

## Where tags live

As categories (rows, not columns — no structural change), kind `theme`, in all
three copies: `rels.json` doc_categories, Supabase
`document_categories`, the download's `categories:` line and manifests. Concepts
carry the same theme slugs in `lib/concepts.ts` (`topics`) and in their download
files. Tags are published only after Sean spot-checks a sample.

## Nanotechnology (7 Oct 2026)

Added at Sean's request with the nanotech glossary terms. Six journal documents carry it, each with its evidence quote, in `scripts/data/theme_nanotechnology.json`; `scripts/apply_theme_nanotechnology.py` writes them to the site data and the download (`--check` in `npm run check`, `--sql` for Supabase). Concepts carry it in `lib/concepts.ts` topics.
