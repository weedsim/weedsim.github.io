---
pubDatetime: 2026-09-06T14:00:00+09:00
title: "Character Encodings: Unicode Is Not Two Bytes"
lang: en
translationKey: character-encodings
featured: false
draft: false
tags:
  - Encoding
  - Unicode
  - UTF-8
  - Hangul
  - C#
description: "Revisiting a write-up covering ISO 8859-1 through EUC-KR, CP949 and UTF-8. Three widespread misconceptions corrected against the official specs and bytes I measured myself, plus how to trace mojibake back to its cause."
---

While building a game in Unity I noticed that Korean comments in a C# script
were coming out garbled in the editor. Looking for the cause and the fix, I
clipped a [write-up](https://velog.io/@mirrorkyh/iso-8859-1%EC%97%90-%EB%8C%80%ED%95%B4)
covering character encodings from ISO 8859-1 through EUC-KR, CP949 and UTF-8.
Having the whole lineage on one page is good for getting the overview.

It does, however, carry **three widespread misconceptions** intact. None of
them is unique to this post — they recur across Korean-language material — and
two of them turn into real bugs. I've gone through each against the official
specifications and bytes I measured myself.

## Table of contents

## The lineage the original lays out

Starting with what's right. The shape of the history is accurate.

- **ISO 8859-1** — one byte, 256 values, extending ASCII to cover Western
  European languages, with 191 graphic characters. It can't hold East Asian
  scripts.
- **EUC-KR** — the Korean encoding used on Unix-family systems. ASCII
  compatible, Hangul in 2 bytes.
- **CP949 / MS 949** — the Korean encoding used on Windows.
- **UTF-8** — Unicode's variable-length encoding. The first 128 characters
  match ASCII.

It also correctly identifies why "ASCII compatible" matters and why UTF-8
became the international default. The details are where it goes wrong.

## Correction 1: Unicode is not two bytes

The original states:

> Unicode is a code table that maps every character in the world to 2 bytes.

**It isn't.** Quoting the official Unicode FAQ directly:

> In its first version, from 1991 to 1995, Unicode was a 16-bit encoding, but
> starting with Unicode 2.0 (July, 1996), the Unicode Standard has encoded
> characters in the range U+0000..U+10FFFF, which amounts to a **21-bit code
> space**.

**That stopped being true in 1996.** It was 16-bit for its first year or two;
since then the space is U+0000 to U+10FFFF — **21 bits**. Two bytes doesn't
hold it.

This misconception turns into real bugs because "one character = two bytes"
gets baked into code.

- **Emoji and some CJK characters live outside the BMP.** In UTF-16 those are
  represented as a **surrogate pair** — two 16-bit units.
- C#'s `string.Length` and Java's `String.length()` count **UTF-16 code
  units**, not characters. A single emoji reports a length of 2.
- So slicing with `substring` can cut through the middle of a surrogate pair
  and break the character. Nickname length limits and chat truncation are where
  this shows up.

"Unicode is a 21-bit code space, and there's no guarantee a character fits in
two bytes" is the safer thing to remember.

## Correction 2: UTF-16 is not a variant of UTF-8

The original states:

> Think of UTF-16 as a variant of UTF-8 that stores in 16-bit units.

**They're siblings, not parent and child.** The Unicode FAQ places UTF-8,
UTF-16 and UTF-32 side by side and defines each as:

> an algorithmic mapping from every Unicode code point to a unique byte
> sequence

All three are **different ways of turning the same code point table into
bytes**, and none derives from another. What differs is the base unit: 8 bits,
16 bits, 32 bits.

The distinction matters because thinking of it as "a variant of UTF-8" leads
to **assuming UTF-16 is ASCII compatible too.** It isn't. In UTF-16, `A` is
`41 00` (little endian) — two bytes with a null in them, which breaks C strings
and any parser that assumes ASCII.

## Correction 3: EUC-KR and CP949 are a superset relationship

The original states:

> MS 949 differs from EUC-KR, so there is no complete compatibility between the
> two encodings. In particular, MS 949 represents Hangul according to syllable
> and jamo composition rules, using a different scheme from EUC-KR.

It isn't "a different scheme." **CP949 is a superset that extends EUC-KR.**

> It is an extension of Wansung Code (KS C 5601:1987, encoded as EUC-KR) to
> include all 11172 non-partial Hangul syllables.

The numbers are the point:

- **EUC-KR (KS X 1001)** — codes for only **2,350** precomposed Hangul
  syllables.
- **CP949** — all **11,172** modern Hangul syllables.

Those 2,350 were chosen as "the common ones," which leaves the other 8,822 as
the problem. Printing the actual bytes shows what happens:

| Character | EUC-KR | CP949 | UTF-8 |
| --- | --- | --- | --- |
| 가 | `b0a1` (2B) | `b0a1` (2B) | `eab080` (3B) |
| 한 | `c7d1` (2B) | `c7d1` (2B) | `ed959c` (3B) |
| 똠 | `a4d4a4a8a4c7a4b1` (**8B**) | `8c63` (2B) | `eb98a0` (3B) |
| 뷁 | `a4d4a4b2a4cea4aa` (**8B**) | `94ee` (2B) | `ebb781` (3B) |

For a character inside the 2,350 like 가 or 한, the two encodings produce
**byte-for-byte identical output**. 똠, having no two-byte code in EUC-KR,
falls back to an **8-byte composed form** starting with `a4d4`. CP949 assigns
it a 2-byte code in an extended range instead.

That's also where the one-directional compatibility comes from:

```text
"똠방각하" saved as CP949: 8c63 b9e6 b0a2 c7cf
Those bytes read as EUC-KR: �c방각하
```

The last three characters survive; only the first breaks. **EUC-KR data reads
fine as CP949, but not the reverse.** That's what was behind certain names
breaking in 1990s Korean software.

## "UTF-16 is smaller for Korean" is half true

The original states:

> Korean takes 3 bytes in UTF-8 but only 2 in UTF-16, so there's a size
> advantage.

**Per character, that's correct.** The problem is that real text isn't purely
Korean. Measuring `"한글 Hangul 123"`:

| Encoding | Size |
| --- | --- |
| CP949 / EUC-KR | 15 bytes |
| UTF-8 | 17 bytes |
| UTF-16 | 26 bytes |
| UTF-32 | 52 bytes |

**UTF-16 comes out larger than UTF-8.** UTF-8 handles ASCII in one byte where
UTF-16 stretches it to two. Spaces, digits, Latin letters, and the tags and
punctuation of code or markup quickly outweigh the one byte saved per Hangul
character.

The original does back off later with "you can't really call it a significant
size advantage" — this is why. **Unless the text is pure Korean prose, UTF-8 is
usually smaller.**

## Tracing mojibake back to its cause

Not in the original, but this is the part you actually need in practice. The
shape of the garbling narrows down where things went wrong.

| Saved as | Read as | Result |
| --- | --- | --- |
| CP949 | UTF-8 | **error** (`invalid continuation byte`) |
| UTF-8 | CP949 | `�븳湲� �뀒�뒪�듃` |
| UTF-8 | ISO 8859-1 | `íê¸ íì¤í¸` |
| CP949 | EUC-KR | partial breakage (`�c방각하`) |

How to read it:

- **Hangul turning into different Hangul** → UTF-8 being read as CP949. The
  most common case in a Korean environment.
- **Runs of Latin characters like `Ã`, `¬`, `í`** → UTF-8 being read as ISO
  8859-1 or Windows-1252. Turns up when Western libraries are in the path.
- **Only a few characters broken** → CP949 data being read as EUC-KR.
- **An exception instead of garbling** → legacy-encoded data being read as
  UTF-8.

That last asymmetry is useful. **UTF-8 is self-validating.** Its byte sequence
rules are strict, so interpreting arbitrary bytes as UTF-8 usually trips a
violation and throws. CP949 and Latin-1, by contrast, will interpret almost any
byte combination as *something*, producing **silently corrupted text**.

Which gives a practical rule: **an exception is the good outcome.** Silent
corruption is far harder to find.

## When Korean comments break in Unity

This is the situation that sent me looking. Korean comments in a C# script were
garbled in the Unity editor. Applying the table above narrows it down.

The C# compiler's default behaviour is documented:

> The compiler first attempts to interpret all source files as UTF-8. If your
> source code files are in an encoding other than UTF-8 and use characters
> other than 7-bit ASCII characters, use the **CodePage** option to specify
> which code page should be used.

**Source files are assumed to be UTF-8.** But editors and tools on a Korean
Windows setup sometimes save as CP949, and the moment Hangul goes in, those
become bytes that break UTF-8's rules.

Reproducing it: `// 플레이어 이동 속도` saved as CP949 and read as UTF-8 comes
out as:

```text
// �÷��̾� �̵� �ӵ�
```

And a UTF-8 file read as CP949 comes out as:

```text
// �뵆�젅�씠�뼱 �씠�룞 �냽�룄
```

**Which of the two shapes you see tells you the direction.** The first means
the file is CP949 being read as UTF-8; the second means the file is UTF-8 and
the reader is assuming CP949.

The fix is re-saving as UTF-8, and there are three places to check.

1. **The existing file's encoding** — use "save with encoding" in your editor
   to switch it to UTF-8. One trap here: **saving while it already looks
   garbled bakes the garbling in.** Open it in the original encoding (CP949),
   confirm the text displays correctly, and only then save as UTF-8.
2. **The default encoding for new files** — set your editor's default to UTF-8,
   or the same thing happens on the next script.
3. **Whether to add a BOM** — UTF-8 doesn't require one, but the three bytes
   `EF BB BF` act as a marker saying "this is UTF-8" and stop code page
   guessing. If Korean comments keep breaking on Windows, adding it is often
   the fastest fix. Some tools dislike BOMs, though, so it isn't automatic.

On a team project it's worth preventing recurrence rather than relying on
individual editor settings. `.editorconfig` can pin it:

```editorconfig
[*.cs]
charset = utf-8
```

## Where this bites in C#

One more thing for this blog's context: `Encoding.Default` **returns different
things depending on the runtime.**

- **.NET Framework** — "Returns the encoding that corresponds to the system's
  active code page." On Korean Windows, that's CP949.
- **.NET Core / .NET 5 and later** — "Always returns a `UTF8Encoding` object."

So the same `File.ReadAllText(path)` line **behaves differently by runtime.**
Code that reads a CP949 file produced by a legacy tool works on .NET Framework
and breaks when moved to .NET Core.

The fix is simple: **state the encoding.**

```csharp
// don't guess
var text = File.ReadAllText(path, Encoding.UTF8);

// for a legacy file, name the code page
var legacy = File.ReadAllText(path, Encoding.GetEncoding(949));
```

Note that using `GetEncoding(949)` on .NET Core requires registering
`CodePagesEncodingProvider` first, since the built-in encoding set was reduced.

## Summary

- **Unicode is not two bytes.** Since Unicode 2.0 in 1996 it's U+0000..U+10FFFF
  — a 21-bit space. "One character = two bytes" breaks on surrogate pairs.
- **UTF-16 is not a variant of UTF-8.** All three are siblings mapping the same
  code points to bytes, differing only in unit size. UTF-16 is not ASCII
  compatible.
- **CP949 is a superset of EUC-KR** — not "a different scheme" but an extension
  from 2,350 to 11,172 syllables. Overlapping characters are byte-identical,
  and compatibility runs one way only.
- Hangul outside EUC-KR's 2,350 falls back to an **8-byte composed form**.
  CP949 holds the same character in 2 bytes.
- **UTF-16 being smaller for Korean is a per-character claim.** In real text,
  ASCII usually makes UTF-8 smaller.
- The shape of the garbling narrows the cause. **UTF-8 throws because it's
  self-validating; legacy encodings corrupt silently.**
- Korean comments breaking in Unity means **the C# compiler assumes UTF-8 while
  the file was saved as CP949.** Re-save as UTF-8 — but **saving while it looks
  garbled bakes it in**, so open it in the original encoding first.
- C#'s `Encoding.Default` is the system code page on .NET Framework and UTF-8
  on .NET Core and later. **State the encoding explicitly.**

## References

- [UTF-8, UTF-16, UTF-32 & BOM FAQ — Unicode](https://www.unicode.org/faq/utf_bom.html)
- [Unified Hangul Code — Wikipedia](https://en.wikipedia.org/wiki/Unified_Hangul_Code)
- [KS X 1001 — Wikipedia](https://en.wikipedia.org/wiki/KS_X_1001)
- [Encoding.Default — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/api/system.text.encoding.default)
- [C# compiler options: CodePage — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-options/advanced)
- Original (Korean): [iso 8859-1, EUC-KR, MS 949, UTF-8](https://velog.io/@mirrorkyh/iso-8859-1%EC%97%90-%EB%8C%80%ED%95%B4)
