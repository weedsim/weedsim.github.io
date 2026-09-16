---
pubDatetime: 2026-09-16T21:00:00+09:00
title: "A Render Pipeline Is an Asset, and Built-In Is What's Left When the Field Is Empty"
lang: en
translationKey: render-pipelines-overview
featured: false
draft: false
tags:
  - Unity
  - Rendering
  - Graphics
  - URP
  - GPU
description: "I read Unity's introduction to render pipelines. I had it filed as picking one of three, but following the docs it turns out Built-In isn't something you pick — it's what remains when you've assigned nothing."
---

The last three posts kept circling **the URP / Built-In fork**. The shader docs
split in two, examples run on only one side, the macro names differ. Every time,
I waved it off with "different pipeline" — without ever pinning down **what a
pipeline actually is.**

That's the moment I clipped this. Following the shader docs downward, I got
curious about **the pipeline itself** and climbed a level up. It's Unity's
**Introduction to render pipelines**, and unlike the previous ones it's a page
with actual prose rather than a table of links.

One thing changed after reading it. **Thinking of Built-In as something you
"pick"** was wrong.

## Table of contents

## A graphics pipeline and a render pipeline are different things

The names need sorting out first. I wrote
[The Graphics Pipeline](/en/posts/graphics-pipeline/) a while back, and that was
about **what happens inside the GPU as a vertex becomes a pixel** — vertex
shader, rasterizer, fragment shader.

The render pipeline in this document is **one level up.** The glossary defines
it as:

> **A series of operations** that take the contents of a Scene, and displays
> them on a screen. Unity lets you choose from pre-built render pipelines, or
> write your own.

"Or write your own" is the difference. **The graphics pipeline inside the GPU
isn't mine to change; the render pipeline the engine runs each frame is.** The
relationship:

| Layer | What it does | Can I touch it |
|---|---|---|
| Render pipeline | What to draw each frame, and in what order | **Yes, in C#** (SRP) |
| └ Graphics pipeline | How one draw call goes from vertices to pixels | Only via shader code |

It's not strange that the two names get confused. Both are "pipeline," and both
glossary entries open with something like "a series of operations."

As an aside, this clipping lost its glossary links entirely, so the first
sentence was saved as **"A takes the objects in a and displays them
on-screen."** — a sentence with no subject and no object. That's a scraping
problem rather than a documentation one, and other clippings from the same day
kept their glossary text. It's a good reason to reopen the original before
relying on something you clipped.

## Three steps — culling, rendering, post-processing

The manual lays out what a render pipeline does in three steps.

| Step | What the manual says |
|---|---|
| 1. Culling | Decides which objects from the scene to display |
| 2. Rendering | Draws the objects **with their correct lighting into pixel buffers** |
| 3. Post-processing | Modifies the pixel buffers to generate the final output frame |

And one more line:

> A render pipeline repeats these steps each time Unity generates a new frame.

Unpacking each a little:

**Culling** is removing what isn't visible. The manual names two kinds —
**frustum culling** for what's outside the view, and **occlusion culling** for
what's hidden behind something else. Not drawing what doesn't need drawing is
the cheapest optimization there is, which is why this step is first.

**Rendering** is where the graphics pipeline above runs. "With their correct
lighting" matters here. How lighting is computed — forward or deferred, how many
lights an object can receive — differs per pipeline, and **that's why shaders are
pipeline-bound.** A URP shader can call `GetMainLight()` because URP decided to
hand the data over that way.

**Post-processing** works on the finished pixel buffers. The manual's examples
are color grading and bloom. Screen effects like glitch usually attach here too.

## Built-In isn't a choice, it's the default

This is the part that made me write the post.

The manual says Unity "provides three prebuilt render pipelines" — URP, HDRP,
Built-In. Which reads like picking one of three. But look up **the rule that
decides which one actually runs** and the picture is different.

> For each quality level in the Quality settings window, Unity uses the Render
> Pipeline Asset assigned to **Render Pipeline Asset**. If the property is
> unassigned, Unity uses the Render Pipeline Asset assigned to **Default Render
> Pipeline Asset** in the Graphics settings window instead.

> **If both Render Pipeline Asset and Default Render Pipeline aren't set, Unity
> uses the Built-In Render Pipeline.**

So the order is:

| Priority | Where Unity looks |
|---|---|
| 1 | The quality level's `Render Pipeline Asset` |
| 2 | Graphics settings' `Default Render Pipeline Asset` |
| 3 | **Both empty → Built-In** |

**Built-In has no asset.** URP and HDRP are switched on by assigning a
`RenderPipelineAsset` that exists as a file in your project; Built-In is what
remains when that field is empty. Less "one of three" than **two assets and one
fallback.**

The Built-In page's own wording leans this way too:

> Unity's Built-in Render Pipeline is Unity's **older** render pipeline. It's
> not based on the Scriptable Render Pipeline, but you can configure it by
> choosing between different rendering paths, and extend its functionality with
> command buffers and callbacks.

No "deprecated," no "legacy." It's still **Supported** in the current docs.
But "older" and "not based on the Scriptable Render Pipeline" place it.

This also explains why a URP shader needs the
`"RenderPipeline" = "UniversalPipeline"` tag, from the earlier posts. **The
pipeline is an assigned thing, so it can be named** — and Built-In has no name to
point at, so it gets no tag.

## What SRP sells isn't features, it's C#

So what is SRP? The definition is short.

> The Scriptable Render Pipeline is a **thin API layer that lets you schedule
> and configure rendering commands using C# scripts.**

It has two parts:

| Name | What the manual says |
|---|---|
| `RenderPipelineAsset` | **An asset in your Unity Project** that stores data about which Render Pipeline Instance to use, and how to configure it |
| Render Pipeline Instance | An instance of a class whose script inherits from `RenderPipeline` and overrides its `Render()` method |

So **the asset holds "which one to use" and the instance holds "how to draw."**
That structure is also why unchecking boxes on a URP Asset shrinks your build —
the shader variant stripping from the earlier post. The settings live in an
asset, so the build process can read them.

And here's the line on this page I found most striking:

> This level of customization is also possible in the Built-In Render Pipeline
> when you **purchase access to the Unity engine's source code** in C++.

Which means Built-In's "limited options for customization" is **not a technical
limit but an access one.** To change culling, rendering, or post-processing in
Built-In you buy the C++ source; in SRP you **just read the C# that ships in the
package.**

Viewing SRP as adding *readability* rather than new graphics features explains
why URP exists separately from Built-In despite targeting nearly the same
platforms.

## So which one do you pick

The Choose a render pipeline page states the target use cases:

| Pipeline | The stated target |
|---|---|
| URP | Projects needing rendering scalability across all platforms, **especially TBDR platforms and untethered VR** |
| HDRP | Projects needing **photorealism and high-fidelity** rendering on high-end platforms |
| Built-In | Projects needing rendering scalability across all platforms |

**URP and Built-In read almost identically** — both are "rendering scalability
across all platforms." So **the target isn't the difference**; the difference is
the extensibility from the previous section. The manual also calls URP "easier
to extend than the Built-In Render Pipeline."

Two constraints are unambiguous:

> **You can't use the Universal Render Pipeline and the High Definition Render
> Pipeline (HDRP) at the same time.**

HDRP is also platform-narrow. In the feature comparison, **Nintendo Switch, iOS,
and Android are all "No."** Ray tracing and DLSS, conversely, are HDRP-only.

One entry surprised me. **Multiple directional light shadows** show **"Yes" for
Built-In and "No" for both URP and HDRP.** The newer pipeline isn't always a
superset. Before migrating, check **which cell the features you use fall into.**

And the most important warning:

> **It can be very time-consuming to switch a project from one render pipeline
> to another**, especially if the project is far along in development.

Given that the previous three posts were about porting a single shader, that
tracks. Shaders, materials, post-processing volumes, and lighting settings are
all bound to the pipeline.

## Where and why you'd use this

You don't write code from this document as such. But **needing to check which
pipeline is active from code** does come up — when different pipelines need
different shaders or assets, or when a teammate opens a scene with the wrong
asset assigned.

### Checking which pipeline is active

```csharp
using UnityEngine;
using UnityEngine.Rendering;

/// <summary>
/// Checks the active render pipeline and warns when it isn't the expected one.
/// </summary>
public class RenderPipelineGuard : MonoBehaviour
{
    private const string EXPECTED_ASSET_NAME = "UniversalRP-HighQuality";

    [Header("Expectation")]
    [SerializeField, Tooltip("Leave empty to expect the Built-In Render Pipeline")]
    private RenderPipelineAsset _expectedAsset;

    private void Awake()
    {
        // Already resolved: quality settings first, then graphics settings. Null if both are empty.
        RenderPipelineAsset active = GraphicsSettings.currentRenderPipeline;

        if (active == null)
        {
            Debug.LogWarning(
                $"[{nameof(RenderPipelineGuard)}] The active pipeline is Built-In. " +
                $"No {EXPECTED_ASSET_NAME} asset is assigned.", this);
            return;
        }

        if (_expectedAsset != null && active != _expectedAsset)
        {
            Debug.LogWarning(
                $"[{nameof(RenderPipelineGuard)}] Expected: {_expectedAsset.name}, " +
                $"actual: {active.name}", this);
        }
    }
}
```

A few notes:

- **`GraphicsSettings.currentRenderPipeline` is the resolved answer.** The
  manual describes it as "the `RenderPipelineAsset` that defines the active
  render pipeline for the current quality level." No need to work out which of
  the two settings won — this one property covers it.
- **`null` means Built-In.** That's the rule from the previous section showing
  through. Built-In has no asset, so there's no reference.
- **Comparing with `active == null` is correct.** `RenderPipelineAsset` is a
  `ScriptableObject`, hence a `UnityEngine.Object`, so the comparison has to go
  through the `==` overload. For the same reason, `?.` doesn't belong here.
- **Don't use `RenderPipelineManager.currentPipeline` in `Awake`.** The manual
  says it's **only updated after rendering one frame.** If you need the pipeline
  *instance*, read it after the first frame.

### Switching at runtime

You can swap the asset from code. There are two places to write to:

```csharp
// The global default
GraphicsSettings.defaultRenderPipeline = _targetAsset;

// The current quality level (this one wins)
QualitySettings.renderPipeline = _targetAsset;
```

Because of the precedence, **a leftover value in the quality settings means
changing the graphics settings does nothing.** That's the spot where you'll lose
time wondering why nothing happened.

The manual's warning, carried over:

> When you change the active render pipeline, you must ensure that **the assets
> and code in your project are compatible** with the new render pipeline;
> otherwise, you might experience errors or unintended visual effects.

Swapping quality presets (URP high ↔ low) is reasonable; swapping URP ↔ Built-In
at runtime effectively isn't. The shaders don't follow.

### What to check before choosing

Things the docs can answer at the moment you're deciding:

- **Whether your target platforms are "No" in HDRP's row.** If mobile or Switch
  is on the list, HDRP is out.
- **Which cell your current features fall into.** Some things, like multiple
  directional light shadows, exist **only in Built-In.**
- **URP and HDRP can't coexist.**
- **Price the switch against your development stage.** The manual qualifies its
  warning with "especially if the project is far along."

### Where not to apply this

- **Migrating to URP just because it's newer.** Its stated target reads almost
  the same as Built-In's. What you get from moving is mostly **extensibility**,
  not image quality.
- **Attaching a URP shader with no asset assigned.** In that case the active
  pipeline is Built-In, and a SubShader tagged
  `"RenderPipeline" = "UniversalPipeline"` goes unused. Before suspecting the
  shader, check the tag from
  [the fork post](/en/posts/unity-custom-shaders/) — it's faster.

## Summary

- **A graphics pipeline and a render pipeline sit on different layers.** The
  first is one draw call going from vertices to pixels; the second is the
  per-frame culling → rendering → post-processing loop.
- **Those three steps repeat every frame.** Culling comes first because not
  drawing is the cheapest thing you can do.
- **Built-In isn't picked, it's what's left.** Unity checks quality settings,
  then graphics settings, and **if both are empty** you get Built-In. That's also
  why URP shaders need a pipeline tag.
- **What SRP sells is access, not features.** The same level of customization is
  possible in Built-In — the manual says, **if you purchase access to the C++
  source code.**
- **URP and Built-In have nearly the same stated target.** The difference is
  extensibility, and some features, like **multiple directional light shadows**,
  exist only in Built-In.
- **From code, `GraphicsSettings.currentRenderPipeline` is all you need.** `null`
  means Built-In, and `RenderPipelineManager.currentPipeline` isn't populated
  until after the first frame.

The "different pipeline" I waved at across three posts now has an answer behind
it. **A pipeline is an asset assigned to the project, and that asset holds, in
C#, what gets drawn each frame and in what order.** Shaders being pipeline-bound
and migration being expensive both fall out of that.

---

### References

- [Introduction to render pipelines — Unity Manual 6000.1](https://docs.unity3d.com/6000.1/Documentation/Manual/render-pipelines-overview.html)
- [Choose a render pipeline](https://docs.unity3d.com/6000.1/Documentation/Manual/choose-a-render-pipeline.html)
- [Render pipeline feature comparison](https://docs.unity3d.com/6000.1/Documentation/Manual/render-pipelines-feature-comparison.html)
- [Change or detect the active render pipeline](https://docs.unity3d.com/6000.1/Documentation/Manual/srp-setting-render-pipeline-asset.html)
- [Scriptable Render Pipeline fundamentals](https://docs.unity3d.com/6000.1/Documentation/Manual/scriptable-render-pipeline-introduction.html)
- [Built-In Render Pipeline](https://docs.unity3d.com/6000.1/Documentation/Manual/built-in-render-pipeline.html)
- [GraphicsSettings.currentRenderPipeline — Scripting Reference](https://docs.unity3d.com/ScriptReference/Rendering.GraphicsSettings-currentRenderPipeline.html)

The clipping dates from December 2025. Its source link is **pinned to 6000.1**,
so the quotations follow that version. The shader clippings from the same day
pointed at 6000.2.
