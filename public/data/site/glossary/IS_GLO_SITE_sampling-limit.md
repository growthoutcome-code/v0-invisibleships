---
id: IS-GLO-SITE-SAMPLING-LIMIT
title: Glossary — sampling limit
collection: glossary
doc_type: term
provenance: site-authored
slug: sampling-limit
categories: [glossary, reference]
word_count: 407
author: Sean C. Harris
copyright: © 2026 Sean C. Harris. All Rights Reserved.
---
# sampling limit

*Site-authored. This term was written for invisibleships.com to explain the work; it is not extracted from the source document series, and it carries no source-document id for that reason. Terms drawn from the primary record are in `glossary/` and do carry one.*


also “Nyquist limit”, “codec low-pass”

The ceiling on what a recording can contain, and the reason a recording can be silent about the very thing it was made to capture.

Two separate ceilings apply. The first is arithmetic: a recorder can only represent frequencies below half its sampling rate, so the 44.1 kHz that Android guarantees on every device cannot hold anything above 22.05 kHz, whatever microphone is attached. The second is the compression: lossy formats discard high frequencies deliberately, because most listeners cannot hear them and the bits are better spent elsewhere.

Documented real-world example: Fraunhofer’s AAC encoder — the format behind most phone voice recordings — low-passes at 17,000 Hz at 96 kbps mono, and as low as 13,050 Hz at its lower quality settings. [The Mosquito](/glossary/mosquito-device) emits at roughly 17.4 kHz. A phone recording of a Mosquito can therefore contain nothing at all, with no error, no warning, and a file that plays back as silence. LAME’s MP3 encoder cuts between 16,538 and 19,205 Hz depending on quality; Opus never codes above 20 kHz. Knowles characterises the MEMS microphones used in phones only to 20 kHz, with an uneven response approaching it.

What this means in practice: an uncompressed WAV or PCM recording preserves what the microphone captured; a compressed one may not. And an ultrasonic carrier such as the roughly 40 kHz used by a [parametric array](/glossary/parametric-array) is beyond every ordinary phone, requiring sampling above 120 kHz — dedicated 192 kHz or 250 kHz ultrasonic microphones sell for about £140 to £250.

A failed recording is not evidence that nothing happened. It may only be evidence that the equipment was not built to hear it.

Related terms: [the Mosquito](/glossary/mosquito-device), [parametric array](/glossary/parametric-array), [presbycusis](/glossary/presbycusis), [contact microphone](/glossary/contact-microphone)

Sources: [LAME — HydrogenAudio](https://wiki.hydrogenaudio.org/index.php/LAME); [Fraunhofer FDK AAC — HydrogenAudio](https://wiki.hydrogenaudio.org/index.php?title=Fraunhofer_FDK_AAC); [RFC 6716: Definition of the Opus Audio Codec](https://www.rfc-editor.org/rfc/rfc6716.html); [Frequency response and latency of MEMS microphones — Knowles](https://www.knowles.com/docs/default-source/default-document-library/frequency-response-and-latency-of-mems-microphones---theory-and-practice.pdf?sfvrsn=4)
