---
id: IS-CRIME-REG-DATA-QUALITY
title: Crime — How much the numbers can be trusted
collection: data
doc_type: register
section: crime
geography: United States (unless a row says otherwise)
generated_by: scripts/build_corpus_md.py
entry_count: 21
word_count: 2791
author: Sean C. Harris
copyright: © 2026 Sean C. Harris. All Rights Reserved.
---
# How much the numbers can be trusted

*Independent research compiled from public records for informational purposes only. Not legal, medical, or investment advice. Evidence tiers: **A** documented, **B** corroborated, **C** claimed — B and C may not be quoted as established fact. Causes are reported as attributed, never asserted. This dataset does not corroborate, and is not corroborated by, any other dataset in this corpus. See `meta/IS_META_terms.md`.*

Where the counting is the problem, the counting is the finding. Every entry names an issue with a measure and what it does to any conclusion drawn from it.

**21 entries.**

### US crime is measured by three systems that disagree
[A] US — Bureau of Justice Statistics · The Nation's Two Crime Measures, 2015-2024 <https://bjs.ojp.gov/library/publications/nations-two-crime-measures-2015-2024>

Police-recorded crime (FBI UCR/NIBRS), crimes people report experiencing when surveyed (BJS National Crime Victimization Survey), and homicide deaths recorded on death certificates (CDC/NCHS vital statistics) are three different counts of three different things. All are correct. None is 'the' crime rate.

*Effect:* A question as simple as 'is crime rising?' has more than one defensible answer depending on which system is cited, and the systems have recently pointed in opposite directions.

### The 2021 NIBRS transition broke comparability
[A] US — Bureau of Justice Statistics · NIBRS Estimation Program <https://bjs.ojp.gov/nibrs-estimation-program>

The FBI retired its Summary Reporting System in favour of NIBRS for 2021. Agency participation collapsed: NIBRS covered 65.7% of the US population in 2021, against 96.2% in 2025. Major departments including the NYPD, LAPD and San Francisco PD did not submit 2021 data. The FBI's own language is that 'traditional methodologies could not be applied', and that the 2021 estimated trends are 'not considered statistically significant'.

*Effect:* Comparisons that span 2021 — including most 'crime since the pandemic' reporting — often compare two different collection systems rather than two years of crime.

### FBI figures are revised, and the vintage changes the answer
[A] US — FBI UCR · Crime in the United States 2019 - Clearances <https://ucr.fbi.gov/crime-in-the-u.s/2019/crime-in-the-u.s.-2019/topic-pages/clearances>

The same year carries different values depending on which annual report it is read from. 2019 murders were first published as 16,425 and revised to 16,669 — and the FBI's own headline '+29.4% in 2020' is calculated against the revised base. 2020 has both a 21,570 SRS-based estimate and a 22,000 NIBRS-based estimate for the same year. The 2024 rate was published as 5.0 and revised to 5.1.

*Effect:* Mixing vintages on one chart produces changes that are artefacts of publication rather than of crime. Every row in this dataset records its vintage for that reason.

### FBI and CDC homicide counts do not match, and should not
[A] US — NCHS / CDC · Curtin SC. Trends in Death Rates for Leading Methods of Injury: United States, 2003-2023. NCHS Data Brief No. 526, March 2025. DOI 10.15620/cdc/174582 <https://www.cdc.gov/nchs/data/databriefs/db526.pdf>

The FBI counts murder and nonnegligent manslaughter as offences known to police. CDC/NCHS counts deaths certified as homicide, including those the FBI classifies as justifiable and those never cleared as an offence. The CDC rate is also age-adjusted; the FBI rate is crude.

*Effect:* The two series run in parallel with a persistent gap. Neither is an error in the other. Quoting one as a correction of the other is the error.

### Clearance is not conviction, and the series is sparse
[A] US — Annual Review of Criminology (peer-reviewed) · Cook PJ, Mancik A. The Sixty-Year Trajectory of Homicide Clearance Rates. Annu Rev Criminol 7:59-83, 2024. DOI 10.1146/annurev-criminol-022422-122744 <https://static1.squarespace.com/static/5b7ea2794cde7a79e7c00582/t/65c120d169e0d131b5e53387/1707155666076/cook-mancik-2024-the-sixty-year-trajectory-of-homicide-clearance-rates-toward-a-better-understanding-of-the-great.pdf>

A homicide is 'cleared' when closed by arrest or by exceptional means — which includes cases where the suspect died or could not be extradited. It is not a conviction rate and not a 'solve rate', though it is reported as both. A continuous year-by-year national series could not be assembled from fetchable sources; what is recorded here is selected years.

*Effect:* The long decline from 93% in 1962 to the low 50s in 2022 is well documented, but the intervening shape is reconstructed from scattered years, not a published annual series.

### Only about half of violent victimisations reach police records
[A] US — Bureau of Justice Statistics · Criminal Victimization, 2024 <https://bjs.ojp.gov/document/cv24.pdf>

Approximately 48% of violent victimisations were reported to police in 2024. Police-recorded crime can therefore fall while victimisation rises, with no contradiction between the two.

*Effect:* Police-recorded series measure reported crime and the propensity to report, combined. They cannot separate the two.

### The 2021 NCVS baseline was collected under pandemic conditions
[B] US — Bureau of Justice Statistics · Criminal Victimization, 2024 <https://bjs.ojp.gov/document/cv24.pdf>

NCVS violent victimisation reads 16.5 per 1,000 in 2021 and 23.5 in 2022. Some of that step is likely collection: 2020 and 2021 fieldwork was disrupted, and the survey's own documentation cautions on comparability across that period.

*Effect:* A 2021-to-2024 percentage change overstates the rise by an unknown amount. This dataset does not publish that percentage as a headline for that reason.

### Two recent FBI counts could not be verified
[A] US — FBI · FBI Releases 2022 Crime in the Nation Statistics <https://www.fbi.gov/news/press-releases/fbi-releases-2022-crime-in-the-nation-statistics>

Murder counts for 2022 and 2023 are absent here. The FBI's 2022 release publishes only a percentage change; the 2023 release and the 2023 CDE summary were unreachable when this dataset was assembled. The 2025 count is secondary — the FBI published the rate (4.1) but not the count.

*Effect:* The count series has two gaps. The rate series, which is what the charts use, is complete.

### 2026 figures are partial-year and city-sample, not national
[A] US — Council on Criminal Justice · Crime Trends in U.S. Cities: Mid-Year 2026 Update (2026-07-22) <https://counciloncj.org/crime-trends-in-u-s-cities-mid-year-2026-update/>

There is no national 2026 crime statistic yet — the FBI publishes annually and released final 2025 data on 14 August 2026. What exists for 2026 is a 36-city half-year comparison and a 566-agency index covering about 119 million people, roughly a third of the country. Both are samples of larger urban agencies, which are not representative of national crime.

*Effect:* 2026 figures are shown as a stated percentage change over a stated period and sample, never as a point on the annual chart. A partial year plotted on an annual series reads as a completed year and would be wrong.

### Two federal arrest series exist, and they disagree
[A] US — FBI CIUS 1997 T29 · FBI CIUS 1997 T29 <https://ucr.fbi.gov/crime-in-the-u.s/1997/97sec4.pdf>

The FBI's CIUS/CDE arrest estimates and BJS's 'Arrest in the United States, 1980-2009' series use different estimation weights: the FBI series puts the 1997 peak at 15.28 million, the BJS series at roughly 11.6 million. Both are official. National data gaps exist at 2016 and 2021.

*Effect:* Any chart must stay inside ONE series; mixing them manufactures changes that are artefacts of methodology. The arrests chart here uses the FBI series throughout and draws the 2016/2021 gaps as gaps.

### Criminal arrests and immigration arrests are different counting systems
[B] US — The Journalist's Resource (Harvard Shorenstein) · How to make sense of ICE arrest data — administrative vs criminal arrests <https://journalistsresource.org/home/how-to-make-sense-of-ice-arrest-data/>

FBI arrest estimates count criminal arrests reported by police agencies. ICE's 'administrative arrest' is an arrest for a CIVIL violation of immigration law — OHSS's own definition — adjudicated by an immigration judge, not a criminal court, and it never enters the FBI series. The FBI series also ends at 2024, before the 2025-26 surge.

*Effect:* A reader can see 'sweeping arrests' in agency announcements while the national criminal-arrest chart declines, with no contradiction: the two numbers count different legal events in different systems, on different clocks.

### The US burglary series changes basis in 2020
[A] US — FBI Crime Data Explorer · UCR Summary of Reported Crimes in the Nation, 2024 (NIBRS-based national estimates) <https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf>

The FBI's Summary Reporting System produced a national burglary rate through 2019 and was then retired. Figures from 2020 onward are NIBRS-based national ESTIMATES, built from agencies covering 75.5% of the country and 87.2% of the population in 2024. They are not a continuation of the SRS run.

*Effect:* The 2000-2024 fall is real in both halves — 53% under the SRS and 26% under the estimates — but a single percentage across the break would be quoting two different measurements as one. The chart draws the break rather than joining it.

### Fewer burglaries are reported to police than a decade ago
[A] US — Bureau of Justice Statistics · Criminal Victimization, 2024 (NCVS) — Tables 2 and 4 <https://bjs.ojp.gov/document/cv24.pdf>

The share of burglary victimisations that victims say they reported to police fell from 58.8% in 2010 to 40.7% in 2024 — 18.1 percentage points. The NCVS asks households directly, so it sees incidents police never record.

*Effect:* Any police-recorded burglary decline is measuring two things at once: fewer break-ins, and fewer break-ins being reported. The survey and police series both fall, which is why the direction survives — but the SIZE of the police-recorded fall is overstated by an unknown margin.

### UNODC has withdrawn burglary as a retrievable indicator
[A] International — UNODC · UNODC data portal — burglary is no longer offered as a retrievable indicator (checked 2026-08-21) <https://dataunodc.un.org/>

UNODC's data portal no longer offers burglary under any property-crime theme: the dashboard URLs redirect to a portal with no such theme, and the legacy CTS_Burglary spreadsheet returns 404. Checked 2026-08-21. The only surviving route to the same collection is Eurostat's crim_off_cat table, which publishes the joint Eurostat–UNODC data — and covers Europe only.

*Effect:* There is no longer a global burglary series to compare against. This is the second live citation on this site to disappear from its publisher's own portal, and it is the argument for archiving every source at the moment it is read.

### A shared ICCS code is not a shared definition
[A] International — Eurostat (joint Eurostat–UNODC data collection) · crim_off_cat — police-recorded offences, ICCS05012 'Burglary of private residential premises', per 100 000 inhabitants <https://ec.europa.eu/eurostat/databrowser/view/crim_off_cat/default/table?lang=en>

Eurostat's metadata for the residential-burglary code records that Germany's national correspondence table to ICCS section 05 is INCOMPLETE, and that for France 'there is no correspondence between French and this ICCS classification' at all. Sweden's national category includes cellar and attic storage; Germany's does not.

*Effect:* Countries filed under one code are not necessarily counting one thing. France is excluded from the international chart on the publisher's own statement. Sweden's 3.4-to-1 rate against Germany should be read as evidence about the code rather than about either country.

### The prison series ends before the years it is asked about
[A] US — Bureau of Justice Statistics · BJS forthcoming publications — 'Prisoners in 2024 – Statistical Tables' listed for Q3 2026, unpublished as of 22 Aug 2026 <https://bjs.ojp.gov/library/publications/forthcoming>

BJS's most recent Prisoners release covers 2023 and was published in September 2025. 'Prisoners in 2024 – Statistical Tables' is listed on BJS's forthcoming page for Q3 2026 and does not exist as of 22 August 2026; the direct URL returns 404. There is no preliminary prisons release for 2024 either, though BJS did publish one for jails.

*Effect:* This is the second national series in this section to stop just short of the period in question — criminal arrests end at 2024, imprisonment at 2023. A reader asking whether the enforcement of 2025 and 2026 shows up in the prison population cannot be answered from federal statistics, and the honest response is that the record is not there yet rather than that nothing happened.

### BJS declares its own 2022 and 2023 correctional totals non-comparable
[A] US — Bureau of Justice Statistics · Correctional Populations in the United States, 2023 – Statistical Tables (Sept 2025, NCJ 310413) <https://bjs.ojp.gov/document/cpus23st.pdf>

Three separate problems land in the same two years. BJS states that 2022 and 2023 cannot be compared with earlier years for the total correctional population, community supervision or probation. The 2023 Annual Probation Survey added 285 agencies supervising misdemeanour probation only, about 120,000 people. And California's post-release community supervision counts have not been updated since 2018, which drives much of the parole fall from 878,700 (2019) to 680,400 (2023).

*Effect:* The widest line on the incarceration chart is broken after 2021 for this reason. Read as a continuous series it would show correctional control falling and then recovering; in truth part of the recovery is 120,000 people who were always there and are now counted, and part of the earlier fall is a state that stopped reporting.

### Prison capacity stopped being published in 2016
[A] US — Bureau of Justice Statistics · Prisoners in 2016 (Jan 2018, NCJ 251149), Table 16 — the LAST prison capacity table BJS published <https://bjs.ojp.gov/content/pub/pdf/p16.pdf>

Table 16 of Prisoners in 2016 is the last national prison capacity table BJS published. Prisoners in 2019 and every edition since contain none. Where it did exist it was ambiguous by construction: states report design, rated and operational capacity, many report only some, and BJS published population against both the lowest and the highest reported measure.

*Effect:* 'Is the prison system overcrowded' cannot be answered from current federal data at all, and where it could be answered the answer depended on which capacity measure was chosen — Alabama was simultaneously at 175.7% of design capacity and 90.7% of operational capacity in 2016.

### The world incarceration ranking mixes eight years of reference dates
[A] International — Institute for Crime & Justice Policy Research · World Prison Population List — 'The information does not relate to the same date' <https://www.prisonstudies.org/sites/default/files/publications/wppl_10.pdf>

The World Prison Brief's rate ranking presents countries in a single ordered list with no reference-date column. Retrieved individually, the dates run from 31 December 2018 (China) to 3 August 2026 (Turkey). Cuba is ranked second in the world on a January 2020 figure and Turkmenistan third on a 2021 estimate. WPB's own World Prison Population List states that the information does not relate to the same date.

*Effect:* Any bar chart built from that page silently compares 2018 with 2026. This section therefore publishes the figures as a dated table where every row carries its own date, and no international incarceration chart — the same decision already taken for drug deaths and missing persons.

### Removing the interviewer does not produce agreement
[A] US — CDC, Youth Risk Behavior Survey · YRBS Data Summary & Trends Report 2013–2023 — anonymous, in-school, unchanged wording <https://www.cdc.gov/yrbs/dstr/pdf/YRBS-2023-Data-Summary-Trend-Report.pdf>

Three anonymous or self-administered instruments measured young Americans over the same years and moved in three directions. Adolescent major depressive episode in NSDUH, answered to a machine, fell from 20.8% (2021) to 15.4% (2024). Persistent sadness or hopelessness in the Youth Risk Behavior Survey, anonymous and in-school, sat at 40–42%. Frequent suicidal ideation among young people using Mental Health America's anonymous online screening rose from 48% to 51%.

*Effect:* Anonymity is often treated as the fix for stigma on sensitive questions. These three instruments are all anonymous or self-administered and they disagree, so anonymity is not sufficient on its own — sampling, recruitment and question wording still dominate. Any single 'anonymous index' cited as the true picture should be read against this.

### A rise in reports is not a rise in events
[A] International — Office of the Director of National Intelligence · 2022 Annual Report on UAP — attributes the increase partly to 'reduced stigma surrounding UAP reporting' <https://archive.dni.gov/files/ODNI/documents/assessments/Unclassified-2022-Annual-Report-UAP.pdf>

The federal UAP office's report counts rose from 247 to 757 and then fell to 319. Its own publications attribute the rise to reporting rather than to phenomena: ODNI records it as 'partially due to reduced stigma surrounding UAP reporting', and AARO records that the FAA began forwarding reports weekly, which it calls 'a significant increase from the previous reporting period'. The reporting periods are also 18, 8, 13 and 12 months long, and each count mixes in-period events with back-reports of older ones.

*Effect:* This is the clearest case on the site of a curve that measures an institution rather than the world. It is drawn because it is the only official count of anomalous reports that exists — and it is labelled as intake, with the publisher's own explanation attached, rather than presented as a rate.
