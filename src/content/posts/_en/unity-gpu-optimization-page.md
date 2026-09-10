---
pubDatetime: 2026-09-10T22:30:00+09:00
title: "I Wondered What a Wave Front Was — It Was a Wavefront"
lang: en
translationKey: unity-gpu-optimization-page
featured: false
draft: false
tags:
  - Unity
  - Graphics
  - Rendering
  - Optimization
  - GPU
description: "I checked the Korean machine translation of Unity's GPU optimization how-to against the English original. Terms split within a single document, and the Frame Debugger note isn't a translation problem — the original says it too."
---

Having learned Unity has a thing called GPU instancing, I went looking to study
it and ended up saving Unity's own "Manage GPU usage for PC and console games"
[page](https://unity.com/kr/how-to/gpu-optimization) — the Korean version.
Instancing sits there as one item in the draw call batching section, alongside
overdraw, culling, dynamic resolution, LOD and wavefront occupancy, all on one
page.

Reading it, though, I stopped at "**파도 전선 점유율**" — literally "ocean wave
front occupancy." Wondering what that meant, I checked the original: it's
**wavefront**. Then I looked at the top of the page again, and the document had
already warned me.

## Table of contents

## The page warned me first

Before the body, there's this paragraph:

> This web page is **provided as a machine translation** to aid understanding.
> No accuracy or reliability is guaranteed for machine-translated content. If
> you have any doubt about the accuracy of the translated content, please
> **refer to the official English original.**

So I put the original alongside it. The findings split three ways: **problems
the translation created**, **things the original says that way too**, and
**things both are behind on.**

## Wave front, ingredient, depth

Starting with the translation. What stood out:

| Original | This page (Korean) | Standard rendering |
| --- | --- | --- |
| wavefront | **파도 전선** (ocean wave front) / 웨이브프론트 | 웨이브프론트 |
| Material | **재료** (raw ingredient) / 재질 | 머티리얼, 재질 |
| depth of field | **심도** (just "depth") | 피사계 심도 |
| geometry shader | **기하학** (mathematics) / 지오메트리 | 지오메트리 셰이더 |
| async compute | **비동기 계산** / 비동기 컴퓨트 | 비동기 컴퓨트 |
| Book of the Dead | **죽은 자의 책** (translated) | Book of the Dead |

The point is the two spellings in the middle column. **They split within one
document.** The wavefront section alone shows it: the heading reads "Aim for
good **웨이브프론트** occupancy" while the image caption directly above it reads
"good **파도 전선** occupancy vs. bad." Inside a single paragraph you get
"vertex shader 파도 전선" and "low 웨이브프론트 occupancy" side by side.

Same in the geometry shader section. The heading says "Replace **지오메트리**
shaders with compute shaders" and the first line of the body starts with
"**기하학** and vertex shaders."

**The problem isn't readability, it's that you can't search.** "파도 전선
occupancy" returns nothing. To dig into the concept you eventually need the
English word, and this translation doesn't give it to you.

`Book of the Dead` is a Unity demo title — a proper noun — rendered as "죽은
자의 책." Find that demo and you'll need to work back to the original name.

`depth of field` becoming "심도" blurs the meaning outright. It's a valid
shortening of the Korean term, but written as "fullscreen effects like bloom
and 심도," it doesn't read as the name of a post-processing effect at all.

## The Frame Debugger note isn't the translation's fault

This is the one I assumed was a mistranslation and changed my mind about after
reading the original.

The Korean:

> **Note**: The Frame Debugger **does not display individual draw calls or
> state changes.** Only native **GPU Profilers** can give detailed draw call and
> timing information, but the Frame Debugger can still be very useful for
> debugging pipeline or batching issues.

The English original is identical.

> The Frame Debugger does not show individual draw calls or state changes.

**The translation is faithful. The original says it.** But two paragraphs
earlier in the same section sits this:

> One of the main advantages of the Frame Debugger is that you can **associate
> draw calls with specific GameObjects in the scene.**

Being able to associate draw calls with specific objects, and not displaying
individual draw calls, **sit side by side in one section.** Unity's manual
takes the first one's side.

> ...pause the application on a particular frame and display the **list of
> rendering events** that constitute the frame. ... **step through each event**
> and display the graphical state of the scene at that point.

Show the list of rendering events that make up a frame and let you walk them one
at a time. That's the whole description of what the Frame Debugger does.

The intent is guessable. The following sentence goes on to say only native GPU
profilers give timing, so it probably meant **"you can't see per-draw-call GPU
timings."** But read as written, there's no reason to open the Frame Debugger at
all. **A case of suspecting the translation, checking the original, and finding
the same thing** — this time consulting the original wasn't the answer.

## Where this page stands in time

The page carries no publication date. The links say it instead.

- The SRP Batcher explanation links to `blogs.unity3d.com/2019/02/28/...`.
- URP doc links point at `com.unity.render-pipelines.universal@10.5` and
  `@10.3`. URP 10.x is the Unity 2020.3 LTS line.
- Some links carry
  `utm_content=optimize-game-performance-2020-lts-ebook`.

It reads as **a 2020 LTS-era ebook moved onto a web page.** That explains the
character of the content, too. The individual items still hold — but **what
Unity 6 added is missing entirely.**

## Two things Unity 6 added that aren't here

The batching section lists four things: SRP Batcher, GPU instancing, static
batching, dynamic batching. Unity 6 puts another layer on top.

| Feature | What it does | Requires |
| --- | --- | --- |
| GPU Resident Drawer | automatic GPU instancing via `BatchRendererGroup` | Forward+, SRP Batcher on, compute-shader-capable API |
| GPU Occlusion Culling | culling on the GPU instead of the CPU | Render Graph, GPU Resident Drawer |

**The GPU Resident Drawer**, in the manual's words, "automatically uses the
`BatchRendererGroup` API to draw GameObjects with GPU instancing, which reduces
the number of draw calls and frees CPU processing time." No per-material Enable
Instancing checkbox pass; the engine groups them. Enabling it means setting
BatchRendererGroup Variants to Keep All in Project Settings, turning on SRP
Batcher in the URP Asset, setting GPU Resident Drawer to Instanced Drawing, and
setting the renderer's Rendering Path to Forward+. The manual also notes build
times get longer.

I wrote that part up separately in
[the GPU instancing shader post](/en/posts/gpu-instancing-shader/).

**GPU occlusion culling** contradicts the page's framing head-on. The page pins
occlusion culling down as **"a baked process,"** with data baked during the
build and loaded from disk into RAM at scene load. Unity 6:

> GPU occlusion culling means Unity uses the **GPU instead of the CPU** to
> exclude objects from camera rendering when they're occluded behind other
> objects.

It uses depth textures from the current and previous frames rather than baked
data. Judging by bounding-sphere approximation against a downsampled depth
buffer means **thin, elongated objects are less likely to register as
occluded**, and in scenes with little occlusion it can be slower because of
setup overhead — both in the manual. The page's advice to "profile whether
moving work from GPU to CPU actually helps" becomes, in Unity 6, **a question
that includes the opposite direction as an option.**

## What still holds

What aged is the two layers above; the items themselves mostly stand. This one
in particular is still a common trap.

```csharp
// Breaks the batch — the material is cloned and you get a reference to the copy
var mat = _renderer.material;

// Reads the shared material — keeps the batch
var sharedMat = _renderer.sharedMaterial;
```

The moment you touch `Renderer.material` the material is duplicated and the
batch that object belonged to breaks. Wanting to change a color from script and
collapsing your batching is exactly this.

The dynamic batching criteria hold too — don't turn it on unless you have
enough low-poly meshes, **no more than 300 vertices each and 900 total vertex
attributes.** The original leads with the negative: "Do *not* use this
unless..."

Setting per-layer cull distances via `Camera.layerCullDistances`, the ordering
where layer culling runs before frustum culling, the note that each camera costs
CPU time whether or not it renders anything, dynamic resolution and LOD,
allocating post-processing a static share of the frame budget — all still valid.

## Wrapping up

- The page **declares itself a machine translation and points you at the
  original.** Doing that comparison paid off.
- **Terminology splits within a single document.** wavefront as both "파도 전선"
  and "웨이브프론트", Material as both "재료" and "재질", geometry shader as both
  "기하학" and "지오메트리". **The problem is blocked search, not readability.**
- **The Frame Debugger note isn't the translation's fault.** The English says
  "does not show individual draw calls," and **both two paragraphs earlier in
  the same section and Unity's manual say otherwise.**
- URP 10.x links, a 2019 blog post and a `2020-lts-ebook` parameter place **when
  this document is from.**
- **Unity 6's GPU Resident Drawer and GPU occlusion culling are missing
  entirely.** Describing occlusion culling as only "a baked process" is half the
  picture now.
- **`sharedMaterial` over `Renderer.material`**, dynamic batching's 300/900,
  per-layer cull distances, dynamic resolution and LOD all still hold.

Keeping the original alongside a document that admits it's machine-translated
clearly pays. What I took away this time, though, was the reverse. The sentence
that read strangest was in the original too. **Suspecting the translation and
suspecting the content are separate jobs.** The first is settled by the
original; the second by the manual.

What I got out of coming here to learn GPU instancing runs the same way. The
instancing this page teaches goes **as far as ticking Enable Instancing on a
material**, and that's still correct. What isn't here is that **another layer
went on top of it.** Opening an overview page to study one feature is a good
start — **which point in time the overview is from** was the part I had to check
separately.

## References

- [Manage GPU usage for PC and console games — Unity](https://unity.com/how-to/gpu-optimization)
- [PC 및 콘솔 게임을 위한 GPU 사용 관리 — Unity (Korean machine translation)](https://unity.com/kr/how-to/gpu-optimization)
- [Frame Debugger — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/FrameDebugger.html)
- [Enable the GPU Resident Drawer in URP — Unity Manual](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/gpu-resident-drawer.html)
- [Enable GPU occlusion culling in URP — Unity Manual](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/gpu-culling.html)
- [Making a shader that supports GPU instancing](/en/posts/gpu-instancing-shader/)
