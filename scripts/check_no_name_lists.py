#!/usr/bin/env python3
"""No lists of organizations or people anywhere in what the site publishes.

Sean, 30 Sep 2026: "I don't want us creating lists of organizations or lists of
names anywhere in the site ... these are accusations that surface in the greater
conversation. I am not prescribing these options, and so therefore I don't want
to surface them. However, I do want to support the searching of our site."

Why (Sean, same day): the site documents Zersetzung, and defamation and false
accusation are among its tactics. The names in the record were said TO the author and
are likely false in most cases; a list lifts them out of that context and reads as a
register of who is responsible, repeating the tactic. The site is not a campaign
against any organization (CLAUDE.md §1). Search still reads the full
text, so nothing is lost for a reader who looks something up.

Fails if the site data or the download carries a tag list of organizations or
people. Supabase is covered by the three-copies rule (data-rules §8).
"""
import json, sys, zipfile

errors = []
rels = json.load(open("public/corpus/rels.json", encoding="utf-8"))
LIST_KINDS = {"organization", "person", "people", "name"}
bad = [c["slug"] for c in rels["categories"] if c.get("kind") in LIST_KINDS or c["slug"].startswith("org-")]
if bad:
    errors.append(f"rels.json: {len(bad)} organization/person categories, e.g. {bad[:3]}")
z = zipfile.ZipFile("public/invisible-ships-corpus.zip")
for n in z.namelist():
    t = z.read(n)
    for field in (b"organizations_named", b"people_named", b"names_named"):
        if field in t:
            errors.append(f"download: {n} carries {field.decode()}")
            break
if errors:
    print("FAIL: a list of organizations or names is published (see scripts/check_no_name_lists.py)")
    for e in errors[:20]: print("  -", e)
    sys.exit(1)
print("no lists of organizations or names in the site data or the download")
