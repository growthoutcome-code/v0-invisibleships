# Crime research inputs

The raw researched rows the crime builders read. Every figure in the Crime
section traces back through a builder to a row in one of these files, and each
row carries the source URL it was read from.

These lived in `/tmp` until 2026-08-22, which meant the pipeline could only be
rebuilt inside the container that did the original research — a rebuild anywhere
else died with `FileNotFoundError`. That is the opposite of what this site is
for, so they are committed here.

| File | Read by | Contents |
|---|---|---|
| `crime_rows.json` | `build_crime_tables.py` | Homicide, clearance, NCVS and 2026 YTD rows |
| `crime_srcs.json` | `build_crime_tables.py` | Source records for the above |
| `harass_rows.json` | `build_crime_lanes.py` | Harassment, missing-person, defamation and intimidation rows |
| `harass_srcs.json` | `build_crime_lanes.py` | Source records for the above |
| `intl/homicide_wb.json` | `build_crime_intl.py` | World Bank mirror of UNODC intentional homicide |
| `intl/drug_deaths.json` | `build_crime_intl.py` | Five national drug-death series, deliberately non-comparable |
| `intl/missing_persons.json` | `build_crime_intl.py` | Missing-person figures in each country's own unit |

The later builders — `build_crime_burglary.py`, `build_crime_incarceration.py`
and `build_crime_anomalies.py` — carry their data inline and need nothing here.

To rebuild everything:

```bash
for b in build_crime_tables build_crime_lanes build_crime_intl build_crime_tr \
         build_crime_milestones build_crime_burglary build_crime_incarceration \
         build_crime_anomalies; do python3 "scripts/$b.py"; done
```

Run it twice; the row counts must not change. `apply-*.sh` asserts exactly that.
