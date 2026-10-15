---
pubDatetime: 2026-10-15T17:40:00+09:00
title: "The Page Says 2023, and What You Get Is the 2020 LTS Edition"
lang: en
translationKey: console-pc-optimization
featured: false
draft: false
tags:
  - Unity
  - Optimization
  - Memory
  - Sound
  - Physics
  - C#
description: "A landing page clipped while studying optimization, after it occurred to me that using high-quality models might make the game unplayable on a low-spec PC. The page is dated October 19, 2023, but the cover of the PDF behind Read now says '2020 LTS edition'. I picked four sections to see where that gap shows in the body."
---

**This started from a worry that came with using better-quality models.** It
runs fine on my machine, but it occurred to me that playing on a low-spec PC
might not work. So while studying optimization I clipped this page.

What I clipped is **a landing page for an e-book**. Unity introduces it as
having gathered "over 80 actionable tips and advice on how you can optimize
your games for PC and console", with a form below. The body isn't on the page.

The landing page records one date — **October 19, 2023**. The English original
page says the same, **"Oct 19, 2023"**.

But that page has one more link besides the form: **`Read now`**. Click it and
a PDF opens directly, and **the cover carries a different date.**

> Optimize your game performance for consoles and PC
>
> 2020 LTS edition
>
> UNITY FOR GAMES E-BOOK
>
> © 2021 Unity Technologies
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

**The cover says "2020 LTS edition" and the copyright line says 2021.** The
landing page records that nowhere. Neither the Korean page nor the English one
contains the string "2020 LTS".

So this post looks at **how that gap shows in the body**. Checking over 80 items
isn't possible, so I picked four from **the sections an earlier post didn't
cover** — physics timestep, GC, Memory Profiler, and audio.

## Table of contents

## It's the e-book an earlier post inferred from a URL parameter

First I have to record that this document isn't new to me. In
[What I Thought Was a Wave Front Turned Out to Be a wavefront](/en/posts/unity-gpu-optimization-page/)
I took apart Unity's GPU optimization **web page**, and that post inferred where
the page stood in time **from a URL parameter** — some links carried
`utm_content=optimize-game-performance-2020-lts-ebook`. It said there that the
page "looks like a 2020-LTS-era e-book moved onto a web page".

**This clipping is that e-book itself.** Not an inference — it's on the cover.
And the parameter's string
(`optimize-game-performance-2020-lts-ebook`) is split across the PDF's filename
(`OptimizeGamePerformance_eBook_Final.pdf`) and the cover's
`2020 LTS edition`.

| What the earlier post saw | What I confirmed this time |
|---|---|
| `2020-lts-ebook` in the web page's link parameter | **`2020 LTS edition`** on the PDF cover |
| URP doc links at `@10.5`, `@10.3` | the copyright line is **© 2021** |
| "looks like an e-book moved onto a web page" (inference) | opened the e-book itself |

What that post covered is **the GPU, batching and culling sections**, where it
went as far as recording that Unity 6's GPU Resident Drawer and GPU occlusion
culling are missing. **This post doesn't revisit those sections.** The four
below are the side it didn't touch.

## In the physics timestep section the "smaller value" is a larger value

The physics section states the default and then explains adjusting it right
after, and the two numbers don't line up.

> the default value of 0.02 seconds (20 ms) is equivalent to 50 fps, or 50 Hz.
>
> Using a smaller value (like 0.1 s) sacrifices some physics simulation
> accuracy
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

**0.1 is larger than 0.02.** A document that wrote the default as `0.02` calls
`0.1` a "smaller value" two lines later. The direction is written backwards.

The content itself is right if you invert it. Make the timestep **larger** and
physics runs less often, which cuts cost and loses accuracy. But the document
calls that "a smaller value", so a reader goes and **lowers** the number.
Lowering it makes physics run more often, which **increases cost** — you read an
optimization document and walk the opposite way.

The mobile example line doesn't add up either.

> use 0.035 seconds for 30ps on mobile.
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

`30ps` looks like a typo for `30fps`, and `0.035` seconds is about 28.6 times a
second. To hit 30 it's `0.0333…`. Whether the document took a rounded value or
meant something else isn't written.

**I could not confirm the `0.02` default itself in the current docs.** The
`Time.fixedDeltaTime` page **doesn't state a default**. It records a different
caution instead.

> Note: To support high-precision simulation and prevent time drift in
> long-running games, Unity uses a more complex internal representation for
> time steps.
>
> When you set Time.fixedDeltaTime, the value is quantized to align with the
> internal high-resolution grid.
>
> — [Time.fixedDeltaTime](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Time-fixedDeltaTime.html)

**The value you set isn't stored as given.** It gets quantized to an internal
grid, and read back as a float it **can differ by one unit of least precision**,
the same page says. That explanation didn't exist at the e-book's time. The
project settings page likewise writes `Fixed Timestep` only as "A frame rate
independent interval that dictates when physics calculations and FixedUpdate
events are performed." and **states no default**.

What the neighbouring field in that same settings page
(`Maximum Allowed Timestep`) actually caps is pinned down separately in
[Unload(false) Doesn't Unload the Instances](/en/posts/unite-seoul-2025-optimization/).

## Incremental GC isn't something to tell people to turn on any more

The GC section's description of the collector still holds. The e-book writes
**"Unity uses the Boehm-Demers-Weiser garbage collector"**, and the current
manual names the same collector with the shorter name.

> Unity uses the Boehm garbage collector for both the Mono and IL2CPP.
>
> — [Garbage collection — Unity manual](https://docs.unity3d.com/6000.1/Documentation/Manual/dotnet-garbage-collection.html)

**The same collector five years later.** The problem is the next item. The
e-book writes incremental collection as **a tip to adopt**.

> Use the Incremental Garbage Collector to split the GC workload
>
> Incremental GC can temporarily help mitigate garbage collection issues
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

**"Use"** — telling you to use it presumes an act of turning it on. The current
manual writes that same spot like this.

> Enabled by default.
>
> This is the default garbage collection behavior in Unity.
>
> The web platform doesn't support incremental garbage collection.
>
> — [Garbage collection modes — Unity manual](https://docs.unity3d.com/6000.1/Documentation/Manual/performance-incremental-garbage-collection.html)

**It's already on.** So this tip became an item with nothing to do, and what
needs explaining instead is **how to turn it off**. The same page records where
that lives — the **`Incremental GC`** setting under
`Project Settings > Player > Configuration`. The mode names are sorted into
three now: `Incremental`, `Non-incremental` (stop-the-world), and `Manual`.

And an exception got added: **the web platform doesn't support incremental
collection.** That's a sentence that couldn't have existed in an e-book written
for consoles and PC.

| Item | E-book (2020 LTS) | Current manual |
|---|---|---|
| collector | "Boehm-Demers-Weiser garbage collector" | "Boehm garbage collector for both the Mono and IL2CPP" |
| incremental | **"Use the Incremental Garbage Collector"** | **"Enabled by default."** |
| direction of the text | how to turn it on | **how to turn it off** (`Project Settings > Player`) |
| mode names | none | `Incremental` / `Non-incremental` / `Manual` |
| platform exception | none | "The web platform doesn't support incremental" |

The line the e-book writes just below is still valid — **"the best long-term
course of action is to locate and stop frequent allocations that trigger
garbage collection."** On by default or not, reducing allocations hasn't
changed. Where those "frequent allocations" come from on the Unity API side is
written up in
[Unity's Code Optimization Page Is a Table of Contents of Tables of Contents](/en/posts/unity-code-optimization/)
— the APIs that return a freshly built array are that list.

## The Memory Profiler isn't a Preview package any more

The profiling section introduces the tools and records their status along the
way.

> This separate add-on (available as a Preview package in the Package Manager)
>
> can take a snapshot of your memory to help you identify problems like
> fragmentation and memory leaks.
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

**"Preview package".** The Unity 6.6 manual page for that same package writes it
differently.

> Package version 1.1.12 is released for Unity Editor version 6000.6.
>
> — [Memory Profiler — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/com.unity.memoryprofiler.html)

**`1.1.12`, and `released`.** That page uses neither `preview` nor
`experimental`. The package moved from 0.x preview to 1.x proper, and **the
e-book's status label is stuck before that point.**

The reason this isn't trivial is that a status label **reads as grounds for
whether to use something**. You end up deciding "it's Preview, so not in
production" on the basis of a sentence from the 2020 LTS era. It's a released
package now.

The other tool descriptions in that section are still valid. **"The Profile
Analyzer is available via Unity's Package Manager."** holds, and so do the
Deep Profiling lines — **"Deep Profiling is resource-intensive and uses a lot of
memory."** and **"Use Call Stacks instead of Deep Profiling whenever
possible."** are sentences with no reason to change.

| Tool | Status the e-book records | Now |
|---|---|---|
| Memory Profiler | **"available as a Preview package"** | **`1.1.12` released** (6000.6) |
| Profile Analyzer | "available via Unity's Package Manager" | unchanged |
| Deep Profiling | "resource-intensive and uses a lot of memory" | unchanged |
| Heap Explorer | "a third-party Memory Profiler" | still third-party by nature |

## Two numbers in the audio section are still exactly the same

Counting only what changed tilts the post. The audio section is the side where
**the numbers crossed five years intact.** The e-book writes streaming's
overhead as a number.

> Streaming has a 200 KB overhead, so it is only suitable for sufficiently
> large AudioClips.
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

The current AudioClip importer doc writes the same number.

> Streaming clips have an overhead of approximately 200KB, even without loaded
> audio data.
>
> — [Audio Clip — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AudioClip.html)

**`200KB`, unchanged.** The ADPCM ratio matches too — the e-book writes **"a
fixed 3.5:1 compression ratio"** and the manual writes **"The compression ratio
is 3.5 times smaller than PCM"**.

There is, though, a place where the e-book says something **the docs don't**:
the recommended sample rate.

> For PC/console platforms, 44100Hz is ideal. 48000Hz is usually unnecessary.
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

**The current AudioClip doc doesn't specify a recommended sample rate.** So this
number isn't a documented rule but **a recommendation from the e-book's
authors**. That distinction matters — a number from the docs and a number a
person recommended must not be cited with the same weight.

And that field now has three options.

> Preserve Sample Rate: Choose this setting to keep the sample rate unmodified
> (default).
>
> Optimize Sample Rate: Optimize the sample rate automatically according to the
> highest frequency content analyzed.
>
> — [Audio Clip — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AudioClip.html)

**`Optimize Sample Rate` appeared.** It analyses the content and matches
automatically. Where the e-book wrote "use this value per platform", there's now
**one more option that doesn't pick a value at all.** The default is
`Preserve Sample Rate`.

The setting the e-book covers in one line, "Check Load in Background.", is tied
to actual APIs — `Preload Audio Data` and `LoadAudioData`, and where
`loadInBackground` splits synchronous from asynchronous — and that's pinned down
from the doc sentences in
[What You Can Stop Is Only "the Currently Set Clip"](/en/posts/audiosource-play-oneshot/).

| Audio item | E-book | Current docs |
|---|---|---|
| streaming overhead | "200 KB overhead" | **"approximately 200KB"** — unchanged |
| ADPCM ratio | "fixed 3.5:1" | "3.5 times smaller than PCM" — unchanged |
| `Force To Mono` | turn on if stereo isn't needed | "mix multi-channel audio down to a mono track" |
| `Load In Background` | check it | "prevents stalls on the main thread" |
| recommended sample rate | "44100Hz is ideal" | **the docs don't state one** |
| sample rate modes | a field where you pick a value | `Preserve` (default) / `Optimize` / `Override` |

## Where and why you'd use it

This e-book is **still worth reading.** Most of its 80-plus items haven't
changed direction, and in places like the audio section even the numbers are
intact. What you need in order to use it is **a reading order** — look at the
cover's `2020 LTS edition` first, then open the current docs once for every
sentence that carries a number or a status label.

On the side I was worried about to begin with — **whether it won't run on low
specs** — the place this e-book answers is the profiling section. Before
reducing a model's polygon count you have to see **where the time is going now**,
and the e-book splits that judgement by **which marker the time sits in**.

> If the render thread spends time in Camera.Render, your application is
> CPU-bound
>
> If the render thread spends time in Gfx.PresentFrame, your application is
> GPU-bound
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

**Separate which side it is before assuming a heavy model is the cause.** It's
also hard to treat a heavy model as GPU-only — draw calls and batching land on
the CPU, and that's the section the earlier post covered.

### A working example

The first yardstick the e-book sets up is **the frame budget**. Those numbers
are arithmetic, so they still hold.

> An application targeting 30 fps should always take less than 33.33 ms per
> frame
>
> a target of 60 fps leaves 16.66 ms per frame.
>
> We recommend that you use frame time in milliseconds instead.
>
> — [Optimize your game performance for consoles and PC (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)

A component that computes the budget in ms and **counts only the frames that
exceed it**. It reads the target frame rate at runtime rather than hardcoding it.

```csharp file="Scripts/Diagnostics/FrameBudgetWatcher.cs"
using Unity.Profiling;
using UnityEngine;

public class FrameBudgetWatcher : MonoBehaviour
{
    private const float MillisecondsPerSecond = 1000f;

    [Header("Budget")]
    [Tooltip("Target used when targetFrameRate is -1. The e-book's are 30 and 60")]
    [Min(1)]
    [SerializeField]
    private int _fallbackTargetFps = 60;

    [Header("Reporting")]
    [Tooltip("How many seconds between summaries")]
    [Min(1f)]
    [SerializeField]
    private float _reportInterval = 5f;

    [Tooltip("On logs one line per frame that exceeds the budget")]
    [SerializeField]
    private bool _logEveryOverrun;

    // The docs say Begin and End carry ConditionalAttribute and are compiled
    // away in Release builds.
    private static readonly ProfilerMarker Marker =
        new ProfilerMarker("FrameBudgetWatcher.Tick");

    private float _budgetMs;
    private float _elapsed;
    private int _frames;
    private int _overruns;
    private float _worstMs;

    private void Start()
    {
        _budgetMs = MillisecondsPerSecond / ResolveTargetFps();
        Debug.Log($"frame budget {_budgetMs:F2} ms", this);
    }

    private int ResolveTargetFps()
    {
        // The docs say it "Accepts an integer > 0, or special value -1
        // (default)". -1 means no target was set.
        int target = Application.targetFrameRate;
        if (target > 0) { return target; }

        // The docs say targetFrameRate is ignored when vSyncCount isn't 0.
        // In that case the display sets the real ceiling, so don't assert it
        // here — use the Inspector value.
        return _fallbackTargetFps;
    }

    private void Update()
    {
        using (Marker.Auto())
        {
            // Use elapsed real time, unaffected by timeScale.
            float frameMs = Time.unscaledDeltaTime * MillisecondsPerSecond;

            _frames++;
            _elapsed += Time.unscaledDeltaTime;

            if (frameMs > _worstMs) { _worstMs = frameMs; }

            if (frameMs > _budgetMs)
            {
                _overruns++;

                if (_logEveryOverrun)
                {
                    Debug.Log($"over budget {frameMs:F2} ms", this);
                }
            }

            if (_elapsed >= _reportInterval) { Report(); }
        }
    }

    private void Report()
    {
        float ratio = _frames > 0 ? (float)_overruns / _frames : 0f;

        Debug.Log(
            $"{_overruns} of {_frames} frames over ({ratio:P1}), " +
            $"worst {_worstMs:F2} ms / budget {_budgetMs:F2} ms", this);

        _elapsed = 0f;
        _frames = 0;
        _overruns = 0;
        _worstMs = 0f;
    }
}
```

Three things worth pointing out.

**One — the target isn't hardcoded.** The docs state the default.

> Accepts an integer > 0, or special value -1 (default).
>
> — [Application.targetFrameRate](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application-targetFrameRate.html)

**The default is `-1`.** Read `targetFrameRate` in a project where nothing set
it and you get `-1`, and you can't compute a budget from that. So it falls back
to the Inspector value. The same page also says **`targetFrameRate` is ignored
when `vSyncCount` isn't 0**, so the real ceiling isn't asserted in code.

**Two — both statements about `ProfilerMarker`'s cost are right.** The e-book
writes **"Each ProfilerMarker adds a tiny bit of overhead (about 10ns,
depending on the platform)"**, while the current docs record a different angle.

> Methods Begin and End are marked with ConditionalAttribute. They are
> conditionally compiled away and thus have zero overhead in non-Development
> (Release) builds.
>
> — [ProfilerMarker](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Unity.Profiling.ProfilerMarker.html)

**In a Release build the cost is zero.** The e-book's 10ns is about the state
where profiling is on, and the two sentences don't conflict. But read only the
e-book and go "I should ration markers" and you miss that they disappear in
Release.

**Three — it uses `Time.unscaledDeltaTime`.** A budget has to be wall-clock. On
a slowed-down screen with `timeScale` at 0.5, `deltaTime` halves while the real
time the frame took doesn't.

### How to choose

| What you want | What to use | The sentence behind it |
|---|---|---|
| set a frame budget | read it converted to ms | "use frame time in milliseconds instead" |
| a 30 fps target | `33.33 ms` | "should always take less than 33.33 ms per frame" |
| a 60 fps target | `16.66 ms` | "a target of 60 fps leaves 16.66 ms per frame" |
| decide CPU- or GPU-bound | where the render thread sits | "Gfx.PresentFrame, your application is GPU-bound" |
| instrument a code block | `ProfilerMarker` | "the most efficient way of profiling your code" |
| a memory snapshot | Memory Profiler, **a released package** | "Package version 1.1.12 is released" |
| incremental GC | **there's nothing to set** | "Enabled by default." |
| judging a streaming clip | whether it's comfortably over 200KB | "overhead of approximately 200KB" |
| not wanting to think about sample rate | `Optimize Sample Rate` | "automatically according to the highest frequency content" |

Here's the order I'd read the e-book in.

1. **Look at the cover first.** It's `2020 LTS edition`. The landing page's
   2023 is a posting date, not an edition.
2. **Stop at every status label.** Words like `Preview` and `experimental` are
   a five-year-old state. Open the package page and check today's version.
3. **When a number appears, separate its source.** A number in the docs (200KB,
   3.5:1) and the authors' recommendation (44100Hz) carry different weight.
4. **For any tip starting with "Use ~", check the default.** Some, like
   incremental GC, are already on.

### Where not to use it

- **Reading the landing page's 2023 as the edition.** The cover is
  `2020 LTS edition` and the copyright line is 2021.
- **Following the physics section's "smaller value (like 0.1 s)" as written.**
  It's larger than the `0.02` default. The direction is backwards.
- **Assuming a value set on `Time.fixedDeltaTime` is stored as given.** The docs
  say it's **quantized** to an internal grid and can differ by one bit when read
  back as a float.
- **Deciding "it's Preview, so no" from this e-book's sentence.** The Memory
  Profiler is `1.1.12 released`.
- **Going off to turn incremental GC on.** It's already the default. The job is
  deciding whether to turn it off.
- **Assuming incremental GC in a web build.** The docs say it isn't supported.
- **Citing 44100Hz as "a value the docs set".** The current AudioClip doc states
  no recommended sample rate.
- **Measuring a frame budget with `deltaTime`.** `timeScale` mixes in.
- **Looking for the GPU, batching and culling sections in this post.** The
  earlier post already covered those from the web-page edition.

## Summary

- The landing page is dated **October 19, 2023**, and the PDF fetched via
  `Read now` has **`2020 LTS edition`** on its cover with a **© 2021**
  copyright line. Neither page records the edition.
- This e-book is the document that
  [What I Thought Was a Wave Front Turned Out to Be a wavefront](/en/posts/unity-gpu-optimization-page/)
  **inferred from a URL parameter.** This time it's confirmed by the cover.
- The physics section writes the default as `0.02` and two lines later calls
  **`0.1` a "smaller value".** The direction is backwards. The mobile example's
  `30ps` looks like a typo, and `0.035` seconds is about 28.6 Hz.
- **The `0.02` default itself I could not confirm in the current docs.** Neither
  `Time.fixedDeltaTime` nor the Time settings page states a default. A
  **quantization** caution was added instead.
- The GC collector is unchanged — **"Boehm garbage collector for both the Mono
  and IL2CPP"**. But incremental collection is **"Enabled by default."**, so the
  e-book's "Use the Incremental Garbage Collector" became **a tip with nothing
  to do.** Mode names, the place to turn it off (`Project Settings > Player`),
  and a **web platform exception** are all new.
- The Memory Profiler is **not a "Preview package" but `1.1.12` released.** A
  status label reads as grounds for whether to use something, so it's the first
  place to check.
- The audio section's numbers are intact — streaming **`200KB`**, ADPCM
  **`3.5:1`**. By contrast the **recommended sample rate (`44100Hz`) isn't in
  the current docs** and is an authors' recommendation, and the sample rate
  field gained **`Optimize Sample Rate`**.
- The frame budget numbers (`33.33 ms` / `16.66 ms`) hold as arithmetic. But
  `Application.targetFrameRate`'s **default is `-1`** and `vSyncCount` takes
  precedence, so the target must not be asserted in code.
- For `ProfilerMarker`, the e-book's "10ns" and the current docs' **"zero
  overhead in non-Development (Release) builds"** don't conflict. Both are worth
  writing down.

---

### References

- [콘솔 및 PC 게임 성능 최적화 — Unity (Korean landing page)](https://unity.com/kr/resources/optimize-your-console-and-pc-game-performance)
- [Optimize your console and PC game performance — Unity (English landing page)](https://unity.com/resources/optimize-your-console-and-pc-game-performance)
- [Optimize your game performance for consoles and PC — 2020 LTS edition (PDF)](https://cdn.bfldr.com/S5BC9Y64/at/j52w7wk3xnmp9nkhpwqz6w/OptimizeGamePerformance_eBook_Final.pdf)
- [Time.fixedDeltaTime — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Time-fixedDeltaTime.html)
- [Time settings — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/class-TimeManager.html)
- [Garbage collection — Unity manual](https://docs.unity3d.com/6000.1/Documentation/Manual/dotnet-garbage-collection.html)
- [Garbage collection modes — Unity manual](https://docs.unity3d.com/6000.1/Documentation/Manual/performance-incremental-garbage-collection.html)
- [Memory Profiler — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/com.unity.memoryprofiler.html)
- [Audio Clip — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AudioClip.html)
- [Application.targetFrameRate — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application-targetFrameRate.html)
- [ProfilerMarker — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Unity.Profiling.ProfilerMarker.html)

The clipping is Unity's Korean landing page
[콘솔 및 PC 게임 성능 최적화](https://unity.com/kr/resources/optimize-your-console-and-pc-game-performance),
in Korean. What got clipped is only the intro paragraphs and the related-resource
cards; there's no body. So this post **opened the PDF directly through the same
page's `Read now` link**, read the body, and checked four sections against the
current docs. **I did not fill in the form** — it wasn't needed to get the body.
That fact is itself the first thing I confirmed on this page.
