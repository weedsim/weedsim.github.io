---
pubDatetime: 2026-09-04T15:00:00+09:00
title: "Revisiting the DeepVoice AI Asset: It Isn't \"Completely Standalone\""
lang: en
translationKey: deepvoice-unity-asset
featured: false
draft: false
tags:
  - Unity
  - AI
  - TTS
  - Sound
  - Asset Store
description: "A review I clipped while looking for a TTS asset that runs locally — except its conclusion that the asset 'works completely standalone' isn't true, and four pieces of evidence against it were already in the review. Plus what actually does run locally."
---

I was on a project that needed **TTS running locally** — voice generated on the
device without going through a server — so the first job was finding out
whether an asset for that existed. That's how I came across a Korean
[review of DeepVoice AI - Text To Voice](https://mentum.tistory.com/778) on the
Unity Asset Store, and the description read like it ran locally, so I clipped
it.

The review itself is thorough: the author used the asset and attached the
resulting audio. The problem was the exact sentence that made me save it.

> 하지만 예상과 다르게 DeepVoiceAI는 외부 연결 없이 완전히 독립적으로
> 유니티 에디터에서 음성을 생성하는 솔루션이다.
>
> (Contrary to expectations, DeepVoiceAI generates voice completely
> standalone inside the Unity Editor, with no external connection.)

**This isn't true.** The asset is server-based, so it never fit what I was
looking for in the first place. And the interesting part is that **four pieces
of evidence against it were already in the same article.**

## Table of contents

## What the asset is

A text-to-speech asset by AiKodex that turns dialogue text into audio files
inside the Unity Editor. The review's summary of its features:

- 95+ voice models
- Cutting, joining, and volume/pitch adjustment of the generated audio
- Works in both edit mode and play mode in the editor
- 8–15 seconds per generation

The review is from April 2024, and things have moved since. The original asset
is now at **v2.1.5** (updated 2026-03-18, $80), and a higher tier,
**DeepVoice Pro** (v3.0.7, updated 2026-04-22, $99.99), has since shipped. Two
years have passed since the review noted "the developers say it's still early
days," and both products are still being updated.

## "Completely standalone, with no external connection"

How the review reached that conclusion is understandable — the asset listing
says:

> No sign up, no API key, no recurring payments, no subscription, no
> additional costs

Read that and "so it runs locally" is an easy leap. But what the line actually
claims is that **there's no account, key or subscription for you to manage** —
not that no external server is involved. The publisher's own words are
unambiguous:

> Since it is server-based, the mobile devices will have the same generation
> time as on a PC.

And in the same thread, on requirements:

> This tool requires the Editor Coroutines package from the package manager and
> an active internet connection.

The official documentation paints the same picture. When generation fails, the
guidance is to check your internet connection, and the text refers to **remote
servers** and **the API**.

So this is **not a local inference tool but an editor client for a server-side
TTS service.** Only the billing is unusual: what would normally be a
subscription or metered plan is instead **folded into the one-time asset
purchase**, with the invoice number acting as the API key.

### The answer was already in the review

What makes this interesting is that the review **wrote down four signs of a
server-based design** and still concluded the opposite.

1. **Entering and verifying an invoice number** — "once the log says the
   invoice has been confirmed, you're done." Verified against what, if it only
   runs locally?
2. **A usage quota that resets periodically** — 60,000 characters a month,
   resetting on the 1st, per the review. **A quota can only be counted on a
   server.** A local tool has neither the reason nor the means to meter you.
3. **8–15 seconds per generation** — the shape of a network round trip.
4. **The EditorCoroutines dependency** — the package you use for long-running
   async work in the editor. You need it to await a web request there.

All four point the same way. One line of marketing copy outvoted four
observations.

### Why this matters

In my case that single line was the disqualifier: I needed local TTS, so
server-based means it isn't a candidate. Even without that requirement, a
server dependency changes a few things.

- **If the vendor takes the service down, the asset stops.** A one-time
  purchase looks like permanent ownership, but generation lives on someone
  else's server. A local inference tool wouldn't carry that risk.
- **It doesn't work offline or on a closed network.** That bites when you need
  to regenerate assets on a build machine or an internal network.
- **Your dialogue text leaves the building.** You're feeding story lines from
  an unreleased project into it, which some organisations will want to review.
- **You must commit the output into the project.** Don't assume you can
  regenerate whenever you like.

## The usage quota depends on when you read

The numbers differ by source.

- **The review (2024-04)** — 60,000 characters a month, resetting on the 1st
- **Current official docs** — "We use this to assign you the number of
  characters every fortnight"
- **The publisher's forum guidance** — 30,000 characters a month, issued as
  15,000 every 15 days, on the 1st and 15th

Rather than the review being wrong, **the policy appears to have changed.**
Either way these figures are time-sensitive, so check the current listing and
docs before buying. On a dialogue-heavy project this quota becomes the ceiling
on your throughput.

## Commercial use is allowed

Not covered in the review, though for a tool that produces shippable game
assets it's the first thing to check. The publisher answered it directly in the
[Unity Discussions thread](https://discussions.unity.com/t/generative-ai-deepvoice-text-to-voice/922948).

> Yes, this product can be used commercially. All the voices offered in the
> asset are in the open public domain or are based on fictitious characters.

That is, the models aren't trained on working voice actors but drawn from
public domain material or fictitious characters. This is usually the dividing
line when choosing a generative voice tool.

Three caveats before leaning on that answer, though.

- **It's dated July 2023.** The asset is now at v2.1.5 and DeepVoice Pro exists
  separately. There's no guarantee the model line-up or the terms are unchanged.
- **The real source is the terms file inside the asset, not the forum post.**
  The same answer says "We've included a terms of use and service within the
  asset." If you've bought it, that file takes precedence.
- **Voice provenance differs per model.** The answer says the Neural and
  Standard models are based on Amazon's TTS, but says nothing about where the
  **Multi model** — the one the review uses for Korean — comes from. If you
  plan to ship Korean dialogue commercially, that needs checking separately.

## Directing the performance from the text

The most practical part of the review: you shape delivery with markup in the
dialogue text itself.

**Hesitation** — a dash (`-`), em dash (`—`) or ellipsis (`…`) inserts a pause.
A line break does the same.

**Emotion** — wrapping the line in escaped quotes makes it read the
surrounding text as stage direction. The backslashes are required.

> \\" Really? \\" he said, confused.

There are two parameters. The official definitions:

> **Variability**: Sets a tone of the voice which allows for experimentation.
> Decreasing variability can make speech more expressive... However, it can
> also lead to instabilities.

> **Clarity**: High values boost overall voice clarity and target speaker
> similarity. Very high values can cause artifacts.

The review's summary — higher reads as narration, lower as acting — matches
those definitions. Both parameters apply only to the Mono and Multi models, and
Korean is available only on Multi, as the review states.

And its overall verdict still holds up as an observation:

> 나레이션 생성용으로는 수준급, 감정 대사는 많은 시도 필요.
>
> (Solid for narration; emotional dialogue takes many attempts.)

Generative tools produce different output every run even at identical settings.
Lines with an even tone, like narration, come out well; getting an emotional
line the way you want it means generating repeatedly and picking. Which means
**the work is measured in "generation time × number of attempts"** — and
multiplied against the quota above, that becomes the real constraint.

## So what actually runs locally?

Back to what I was originally after: offline TTS assets do exist. Two I
verified:

- **[Overtone - Realistic AI Offline Text to Speech](https://assetstore.unity.com/packages/tools/generative-ai/overtone-realistic-ai-offline-text-to-speech-tts-251304)**
  — its documentation opens with "Overtone is an offline Text-to-Speech asset
  for Unity," advertising 15+ languages and 900+ English voices. I couldn't
  confirm Korean support from the public documentation.
- **[Speech Generation System](https://assetstore.unity.com/packages/tools/audio/speech-generation-system-offline-text-to-speech-conversion-255039)**
  — named "Offline text-to-speech conversion," and **Korean is listed** among
  its languages. $19.99, v1.2.2 (2024-06-01), Windows and standalone, with a
  142 MB package size.

Worth noting that **package size is the signal here.** A tool that genuinely
infers locally has to ship model weights, so the package is heavy. Conversely,
if something offers hundreds of voices in a light package, those voices cannot
be on your machine. **That's exactly why DeepVoice can advertise 95+ voice
models and still be server-based.**

There's also the platform's built-in TTS. Android's `TextToSpeech`, iOS's
`AVSpeechSynthesizer` and Windows speech synthesis are already on the device,
and native plugins wrap them. Quality is below neural TTS, but the footprint is
near zero and it's fully offline. And if you want to build it yourself in
Unity, running an ONNX TTS model on Sentis (Inference Engine) is an option.

So the order of checks when picking local TTS: **(1) look at package size and
whether models are included, (2) confirm the languages you need, (3) check the
target platforms.** Those three are better evidence than the word "offline."

## Looking at this asset in 2026

The review closed with "the developers say it's still early days, so quality
should keep improving." Two years on, both products are still being updated, so
that expectation held.

The criteria have shifted since, though. In 2024, being able to generate right
inside the editor was itself the selling point; TTS is commonplace now. So the
remaining questions become:

- **Do you value the editor integration?** If you want to keep dialogue as text
  and drop audio clips straight out of the editor, that's where this asset's
  value sits. A general TTS service means a download-and-import step every time.
- **Listen to the Korean yourself.** The review notes English quality is better
  because there's more training data. If Korean dialogue is the point, that
  decides it.
- **Can you accept the server dependency?** As laid out above.

## Summary

- DeepVoice AI is **server-based TTS**. The review's "completely standalone
  with no external connection" isn't true; the publisher says "server-based"
  outright.
- "No sign up, no API key, no subscription" means **there's nothing for you to
  manage**, not that no server is involved. The invoice number acts as the API
  key.
- Four signs of a server design were already in the review: invoice
  verification, a usage quota, 8–15 second generation, and the EditorCoroutines
  dependency.
- A server dependency leaves you with vendor risk, no closed-network use,
  dialogue text leaving your org, and possibly no way to regenerate. Keep the
  output in the project.
- Quota figures differ by source. Check the current listing before buying.
- Commercial use is stated to be allowed, with voices described as public
  domain or fictitious characters.
- Solid for narration, many attempts for emotional lines — the review's verdict
  still stands.
- The commercial-use answer is from July 2023, and the real source is the terms
  file inside the asset. It says nothing about the provenance of the Multi
  model used for Korean.
- If you want genuinely local TTS, **package size is the most honest signal** —
  shipping the models makes it heavy.

## References

- [DeepVoice AI - Text To Voice — Unity Asset Store](https://assetstore.unity.com/packages/tools/generative-ai/deepvoice-ai-text-to-voice-251738)
- [DeepVoice Pro - Text To Voice — Unity Asset Store](https://assetstore.unity.com/packages/tools/generative-ai/deepvoice-pro-text-to-voice-314245)
- [\[Generative AI\] DeepVoice - Text To Voice — Unity Discussions](https://discussions.unity.com/t/generative-ai-deepvoice-text-to-voice/922948)
- [Overtone - Realistic AI Offline Text to Speech — Unity Asset Store](https://assetstore.unity.com/packages/tools/generative-ai/overtone-realistic-ai-offline-text-to-speech-tts-251304)
- [Speech Generation System — Unity Asset Store](https://assetstore.unity.com/packages/tools/audio/speech-generation-system-offline-text-to-speech-conversion-255039)
- Original review (Korean): [DeepVoice AI - Text To Voice / 생성형 AI 게임 성우](https://mentum.tistory.com/778)
