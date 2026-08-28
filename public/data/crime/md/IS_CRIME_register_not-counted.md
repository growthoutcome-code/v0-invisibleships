---
id: IS-CRIME-REG-NOT-COUNTED
title: Crime — What nobody counts
collection: data
doc_type: register
section: crime
geography: United States (unless a row says otherwise)
generated_by: scripts/build_corpus_md.py
entry_count: 12
word_count: 2281
author: Sean C. Harris
copyright: © 2026 Sean C. Harris. All Rights Reserved.
---
# What nobody counts

*Independent research compiled from public records for informational purposes only. Not legal, medical, or investment advice. Evidence tiers: **A** documented, **B** corroborated, **C** claimed — B and C may not be quoted as established fact. Causes are reported as attributed, never asserted. This dataset does not corroborate, and is not corroborated by, any other dataset in this corpus. See `meta/IS_META_terms.md`.*

The kinds of harm this research is most concerned with are the ones with no national statistic. That is not a gap in the research — it is the finding.

**12 entries.**

### Harassment, as a crime
[A] **No national count exists** — FBI CJIS · NIBRS User Manual 2025.0 (offence code definitions) <https://le.fbi.gov/file-repository/ucr/nibrs-user-manual-2025.pdf>

Harassment is not a NIBRS offense. The FBI's NIBRS User Manual lists eleven Group B offence codes and none of them is harassment; harassment charges fall into 90Z, 'All Other Offenses' — an undifferentiated bucket shared with everything else that has no code of its own. Nothing counts it separately.

*Who would have to count it:* FBI Criminal Justice Information Services, via a NIBRS offence code that does not exist.

### Stalking, as a crime
[A] **No national count exists** — FBI CJIS · NIBRS User Manual 2025.0 (offence code definitions) <https://le.fbi.gov/file-repository/ucr/nibrs-user-manual-2025.pdf>

NIBRS has no stalking code either. The manual states that Intimidation 'includes stalking', so every police-reported stalking figure in the national data is invisible inside offence 13C, mixed with one-off threats. There is no way to recover a stalking count from the published national series.

*Who would have to count it:* FBI CJIS. A separate code would be required.

### Harassment victimisation prevalence
[A] **Measured once, in 2006, then abandoned** — Bureau of Justice Statistics · Stalking Victimization, 2019 (Supplemental Victimization Survey) <https://bjs.ojp.gov/library/publications/stalking-victimization-2019>

The 2006 Supplemental Victimization Survey counted 2,432,930 harassment victims — people who experienced stalking-type conduct without reporting fear. The 2016 and 2019 waves dropped the category entirely. No federal statistical agency has produced a national harassment prevalence estimate in twenty years.

*Who would have to count it:* Bureau of Justice Statistics, via the Supplemental Victimization Survey.

### Stalking victimisation, since 2019
[A] **Two comparable points, then nothing** — Bureau of Justice Statistics · Stalking Victimization, 2019 (Supplemental Victimization Survey) <https://bjs.ojp.gov/library/publications/stalking-victimization-2019>

The Supplemental Victimization Survey has run three times: 2006, 2016 and 2019. BJS states that 2016 and 2019 estimates cannot be compared with 2006 — the age floor moved from 18 to 16 and the instrument was rewritten. That leaves two comparable points, 1.5% of people aged 16+ in 2016 and 1.3% in 2019, and no wave since. Note that 2006 and 2019 both yield roughly 3.4 million victims; that coincidence is not a flat trend and must not be drawn as one.

*Who would have to count it:* Bureau of Justice Statistics. The survey has not been fielded since 2019.

### Character defamation
[A] **Not a crime, and not counted as one** — Administrative Office of the US Courts · Federal Judicial Caseload Statistics, Table C-2 (Nature of Suit) <https://www.uscourts.gov/statistics-reports/caseload-statistics-data-tables>

Defamation is a civil tort in essentially every US jurisdiction. Criminal libel survives in a handful of states and is rarely charged; no body compiles national prosecution counts. The nearest sourceable series is federal civil filings under Nature of Suit 320 — but that category is 'Assault, Libel & Slander' combined, so defamation cannot be separated out, and it excludes the state courts where most defamation is litigated.

*Who would have to count it:* No federal body collects it. State court administrators would each have to, and do not.

### Online harassment, after 2020
[B] **One private survey, discontinued** — Pew Research Center · The State of Online Harassment (Jan 2021, fielded Sept 2020) <https://www.pewresearch.org/internet/2021/01/13/the-state-of-online-harassment/>

Pew Research's repeated online-harassment survey (2014, 2017, 2020) is the only national measurement of its kind, and it is a private survey rather than an official statistic. It recorded 35% of US adults reporting any online harassment in 2014 and 41% in both 2017 and 2020. There has been no wave since September 2020.

*Who would have to count it:* No federal agency measures it. Pew is not obliged to continue.

### Missing persons, internationally
[A] **No comparable basis exists — verified, not assumed** — INTERPOL · Yellow Notices — the only international missing-persons instrument <https://www.interpol.int/en/How-we-work/Notices/Yellow-Notices>

Countries count missing people in units that cannot be reconciled: the United States counts NCIC records entered (533,936 in 2024 — one person can generate several), Canada counts individuals by the year they were last seen (68,349), the UK counts incidents (roughly 262,000 in 2020/21, against ~128,000 individuals), and Australia publishes only 'about 50,000 reports' with no reference year. Converting any of these to per-capita rates would fake a comparability that does not exist. The only international instrument is Interpol's Yellow Notice — 3,345 issued in 2024 — which counts notices, not missing people, and Interpol publishes no cross-country statistics.

*Who would have to count it:* No body does. UNODC and Interpol publish no cross-country missing-persons series; each national count sits with a different agency on a different unit.

### Home invasion, as an offence
[A] **Not an offence category — in the US, Canada, or Australia nationally** — Australian Bureau of Statistics · ANZSOC 2023, group 061 — 'home invasion' appears only as an INCLUSION TERM under 0611 Aggravated burglary of a dwelling and 0612 Non-aggravated burglary of a dwelling <https://www.abs.gov.au/statistics/classifications/australian-and-new-zealand-standard-offence-classification-anzsoc/2023/06/061>

The question 'have home invasions risen?' cannot be answered from official statistics anywhere we could check, because no national body counts them — and in Australia and New Zealand the classification says why in as many words. ANZSOC 2023, the offence classification both countries use, lists 'home invasion' only as an INCLUSION TERM: 'home invasion with an aggravating factor' sits inside 0611 aggravated burglary of a dwelling, and 'home invasion, where there is no aggravating factor' inside 0612. It is defined INTO burglary by the classification authority itself, so it can never surface as an output category. The United States works the same way by a different route: NIBRS records burglary with a location code, a count of premises entered and a force indicator, and has no data element for whether the dwelling was occupied. Michigan is the sharpest case — 'home invasion' is the literal statutory name of its burglary offence, in three degrees, and its state reporting manual still codes every one of them as 22001, 22002 or 22003 burglary. A state can prosecute thousands of home invasions a year and publish a count of none. Statistics Canada is the most explicit of all: because there is no agreed-upon definition, home invasion is difficult to measure and is not captured directly by the Uniform Crime Reporting Survey — so StatCan reports robberies in private residences as a stand-in (865 in 2002, about 5 per 100,000). Bill C-15A made home invasion an aggravating factor at SENTENCING in 2002, creating a legal category and no statistical one. The single jurisdiction we found publishing home-invasion figures is the state of Victoria, and there the 2018 count is split across two unrelated offence families: 105 offences filed under aggravated burglary and 87 under serious assault, which never reach any burglary total. Re-checked 21 August 2026: that 2018 figure, published in March 2019, is still the most recent published anywhere we could find — seven years stale, and Victoria's own current offence classification no longer lists home invasion at all.

*Who would have to count it:* FBI CJIS in the US, via a NIBRS data element that does not exist — occupancy is not recorded, so the count could not be produced from the returns even in principle; Statistics Canada, which states it cannot; the ABS, whose classification defines home invasion into burglary by design.

### Prison capacity, since 2016
[A] **Measured, published, then discontinued** — Bureau of Justice Statistics · Prisoners in 2016 (Jan 2018, NCJ 251149), Table 16 — the LAST prison capacity table BJS published <https://bjs.ojp.gov/content/pub/pdf/p16.pdf>

'Is the prison system overcrowded?' has a federal answer only up to 2016. Table 16 of Prisoners in 2016 put the United States at 114.0% of its lowest reported capacity, with 26 states at or above 100% — Alabama 175.7%, Illinois 164.1%, Nebraska 157.8%, Delaware 154.8%. Prisoners in 2019 contains no capacity table. Neither does any edition since. The nearest surviving federal measurement is the 2019 facilities census, which found 292 confinement facilities operating over capacity, holding 36.0% of all prisoners — and the next census is still forthcoming. Even the 2016 table came with a trap worth keeping: states report up to three capacity measures and many report only one, so Alabama was at 175.7% of DESIGN capacity and 90.7% of OPERATIONAL capacity in the same row. The same state, the same year, opposite answers.

*Who would have to count it:* Bureau of Justice Statistics, which collected it until 2016 and stopped. No federal body has published a national prison capacity series since.

### Incarceration, compared between countries
[A] **No shared reference date — the publisher says so itself** — Institute for Crime & Justice Policy Research · World Prison Population List — 'The information does not relate to the same date' <https://www.prisonstudies.org/sites/default/files/publications/wppl_10.pdf>

The World Prison Brief is the standard international source and it does not claim to be a same-date comparison. Its ranking page carries no date column at all, while the figures behind it run from December 2018 to August 2026; Cuba ranks second in the world on a January 2020 number. The World Prison Population List states it plainly: the information does not relate to the same date, and comparability is further compromised by different practice in different countries. Beneath the dates sit definitional gaps that no axis can absorb — China's figure counts sentenced prisoners in Ministry of Justice prisons only, against WPB's own estimate of 'at least 2,340,000'; Canada publishes an annual average where others publish a single day; France excludes 19,190 people on the prison register who are not in a cell. WPB's own two products disagree with each other, giving El Salvador 1,086 in the 14th edition and 1,659 in the live database for overlapping periods. The Council of Europe's SPACE I does it properly — one reference date, 31 January 2025, and a 100% response rate — and covers Europe only.

*Who would have to count it:* No one currently does, at global scale, on one date. UNODC's prison indicators are live but the legacy dataunodc.un.org/dp-prisons URLs now redirect to the site root; SPACE I is the model, and it is regional.

### Anomalous EXPERIENCE, as opposed to belief
[A] **Asked twice in thirty years, and the two readings have been declared incomparable** — Pew Research Center · Spiritual experiences (2023) — Pew states its telephone-era and online-era readings may not be comparable <https://www.pewresearch.org/religion/2023/12/07/spiritual-experiences/>

Polling organisations have asked Americans whether they BELIEVE in ghosts every few years since 1990. They have almost never asked whether they have SEEN one. Gallup's paranormal battery — the longest-running series of its kind — contains no personal-experience question at all, in thirty-five years. Pew is the one body that asked properly and repeatedly: the share of Americans reporting they had been in the presence of a ghost went from 9% in 1996 to 18% in 2009, and the share who had felt in touch with someone who had died from 18% to 29%. Pew has since closed that door itself. Its 2023 study moved from telephone to an online panel, and Pew states that because the earlier surveys were conducted by telephone 'it is not clear whether those earlier results can be directly compared with the new estimates'. The organisation best placed to say whether anomalous experience is becoming more common says it cannot. YouGov's two readings of a 13-item experience battery — 67% in October 2022, 60% in October 2025 — are the only recent repeat, and two points are not a trend.

*Who would have to count it:* Any of the major survey organisations, by adding an experience question to a belief battery they already run. Gallup has had the opportunity annually since 1990.

### Hallucinations, in the United States
[A] **No federal survey asks the question** — SAMHSA / NCBI · NSDUH instrument comparison — no hallucination or voice-hearing items in the questions asked of all respondents <https://www.ncbi.nlm.nih.gov/books/NBK390286/>

The instruments the National Survey on Drug Use and Health administers to every respondent are a psychological-distress scale, a functional-impairment scale, a depression module and suicidality items. None contains a hallucination or voice-hearing question. Psychosis appears only through clinical interviews in a validation subsample, which produces no published prevalence series. So the one real repeated measurement of psychotic experience in the English-speaking world is English: the Adult Psychiatric Morbidity Survey found 5.6% of adults screening positive in 2000, 5.9% in 2007 and 6.8% in 2014 — and then stopped reporting that figure as an outcome. The only large repeated instrument that scores hallucinations anonymously and annually is a private one, the Global Mind Project, whose respondents are recruited through Meta and Google advertising and whose only representativeness assessment was written by its own staff. It is recorded here as an existence proof, not as a population estimate.

*Who would have to count it:* SAMHSA, by adding an item to NSDUH's self-administered section — the part respondents answer to a machine rather than to an interviewer, which is where a stigmatised question belongs.
