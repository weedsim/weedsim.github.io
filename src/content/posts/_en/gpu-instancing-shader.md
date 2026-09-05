---
pubDatetime: 2026-09-05T14:00:00+09:00
title: "GPU Instancing Shaders: The Korean Manual Is Missing an A"
lang: en
translationKey: gpu-instancing-shader
featured: false
draft: false
tags:
  - Unity
  - Shader
  - Graphics
  - GPU
  - Rendering
  - Optimization
description: "Revisiting Unity's 2021.3 manual page on adding GPU instancing to custom shaders. The Korean localisation has three macro typos, and the render pipeline compatibility table has changed since."
---

While looking into GPU instancing on a game project, I clipped
[Unity's manual page](https://docs.unity3d.com/kr/2021.3/Manual/gpu-instancing-shader.html)
on adding instancing support to a custom shader. It tabulates the macros you
need and attaches surface-shader and vertex/fragment examples — a good page to
keep as reference.

Two things stand out about it being the **2021.3 Korean** documentation,
though. One is that **three macro names have typos** — copy them and they fail
silently — and the other is that **the render pipeline compatibility table
reads differently today.**

## Table of contents

## What GPU instancing reduces

When you draw the same mesh with the same material many times, instead of one
draw call per object it draws **many instances in a single draw call.** Scenes
full of repeated objects — trees, grass, projectiles, crowds of enemies — get
their CPU-side draw call load cut.

By default only the **transform** varies per instance. To vary colour or
anything else you have to add a **per-instance property** to the shader
yourself, which is what this page covers.

## The macros the shader needs

The flow the page lays out has four steps: **declare → set up → transfer →
access.**

| Macro | Role |
| --- | --- |
| `#pragma multi_compile_instancing` | Generates the instancing variant. Required for vertex/fragment shaders, optional for surface shaders |
| `UNITY_VERTEX_INPUT_INSTANCE_ID` | Defines the instance ID in the input/output structure |
| `UNITY_INSTANCING_BUFFER_START/END(name)` | Start and end of the per-instance constant buffer |
| `UNITY_DEFINE_INSTANCED_PROP(type, name)` | Declares a per-instance property inside the buffer |
| `UNITY_SETUP_INSTANCE_ID(v)` | Gives shader functions access to the instance ID. **First thing** in the vertex shader |
| `UNITY_TRANSFER_INSTANCE_ID(v, o)` | Copies the ID from the input structure to the output structure |
| `UNITY_ACCESS_INSTANCED_PROP(name, prop)` | Reads a per-instance property |

There's an important distinction the page makes here. **A custom shader needs
the instance ID even if it has no per-instance data**, because the world matrix
depends on it. Surface shaders set it up automatically, but **vertex/fragment
shaders need `UNITY_SETUP_INSTANCE_ID` written by hand.** If you turn
instancing on and every object appears stacked at the origin, that's usually
what's missing.

## Three typos in the Korean manual

This is what prompted the write-up. The macro descriptions on the Korean page
read:

> 이 매크로를 사용하려면 **INSTNCING_ON** 셰이더 키워드를 활성화하십시오.

> 이 매크로를 **UNITY_INSTNCING_BUFFER_END** 와 함께 사용하여 ...

> 이 매크로를 **UNITY_INSTNCING_BUFFER_START** 와 함께 사용하여 ...

All three read **`INSTN` where it should be `INSTA`** — the A is missing. The
same sentences in the English documentation:

> Defines an instance ID in the vertex shader input/output structure. To use
> this macro, enable the **INSTANCING_ON** shader keyword.

> Declares the start of a per-instance constant buffer named `bufferName`. Use
> this macro with **UNITY_INSTANCING_BUFFER_END** to wrap declarations of the
> properties that you want to be unique to each instance.

The buffer macros are the lesser problem: write
`UNITY_INSTNCING_BUFFER_START` and it doesn't compile, so it surfaces at once.
The **keyword** is the dangerous one.

```hlsl
#ifdef INSTNCING_ON
    // this block will never compile in
    uint id = v.instanceID;
#endif
```

`#ifdef` doesn't error on an undefined name — it **just skips the block.** It
compiles, there's no warning, and the code that uses the instance ID vanishes
while the shader still runs. Only the picture is wrong. Transcribe it from the
page and you'll spend a while finding that.

The page's own code examples spell everything correctly, so **trust the example
code over the table** — or better, keep the English page open alongside.

## The compatibility table is different now

The table in the clipping:

| Feature | Built-in | URP | HDRP | Custom SRP |
| --- | --- | --- | --- | --- |
| Custom GPU-instanced shaders | Supported | Not supported | Not supported | Not supported |

Which reads as "impossible on URP." Unity 6's wording is different.

> GPU instancing is compatible with all Unity render pipelines, with the
> following limitations

And it spells out what the limitation is.

> If you use the Universal Render Pipeline (URP) or High Definition Render
> Pipeline (HDRP), GPU instancing works with custom shaders only if you disable
> the Scriptable Render Pipeline (SRP) Batcher.

**Not "it doesn't work" but "it works if you disable the SRP Batcher."** The
page title has also become `Creating custom shaders that support GPU instancing
in the Built-In Render Pipeline`, so the built-in-only scope is now stated in
the title.

## The real trade-off is with the SRP Batcher

Which leaves you with a decision on URP. There's already a warning in the
clipping:

> **Important**: MaterialPropertyBlocks break SRP Batcher compatibility.

Put the two together and the picture forms.

- **GPU instancing** — same mesh, same material, one draw call. Per-instance
  variation comes from `MaterialPropertyBlock`.
- **SRP Batcher** — batches across different materials as long as the shader
  variant matches, by keeping constant buffers on the GPU. Use a
  `MaterialPropertyBlock` on an object and it drops out of that batching.

So the moment you attach a `MaterialPropertyBlock` to vary colour per instance,
**you give up the SRP Batcher's benefit.** That's the same statement as the URP
note above, from the other side.

As a rule of thumb, instancing wins only when **there are a great many of the
same mesh**; otherwise leaving the SRP Batcher on is better. Which one actually
wins is a profiler question.

## Unity 6 has a route that doesn't need hand-writing

One more thing to check before following this page: Unity 6's **GPU Resident
Drawer**.

> The GPU Resident Drawer automatically uses the `BatchRendererGroup` API to
> draw GameObjects with GPU instancing, which reduces the number of draw calls
> and frees CPU processing time.

**Automatically.** The conditions to enable it are fixed:

- Rendering path set to **Forward+**
- Project Settings > Graphics: **BatchRendererGroup Variants** set to `Keep All`
- URP Asset: **SRP Batcher** enabled, **GPU Resident Drawer** set to
  `Instanced Drawing`
- Graphics APIs and platforms that support compute shaders, excluding OpenGL ES

There are limits. It applies only to **GameObjects with a Mesh Renderer
component**; otherwise Unity falls back to normal rendering. And there's a build
cost.

> Build times are longer because Unity compiles all the `BatchRendererGroup`
> shader variants into your build.

If you're drawing from script, `Graphics.RenderMeshInstanced` is the API the
documentation names as supporting instancing. Where the clipping mentions
`Graphics.DrawMeshInstancedIndirect`, look at the `RenderMesh*` family first.

## Only the first pass is instanced in multi-pass shaders

The page passes over this quietly, but it bites in practice.

> If a multi-pass shader has more than two passes, Unity instances only the
> first pass.

Later passes render per object, forcing a material change. And in the built-in
render pipeline's forward path this ties directly to lighting.

> Unity can't efficiently instance objects affected by multiple lights. Unity
> can only effectively use instancing for the base pass, not additional passes.

Meaning **instancing objects lit by several lights won't cut as much as you
expect.** If you added instancing and draw calls didn't drop the way you
thought, this is worth checking first.

## Summary

- GPU instancing draws the same mesh with the same material in one draw call.
  Only the transform varies by default; colour and the like need per-instance
  properties added by hand.
- A custom shader needs **the instance ID even without per-instance data.**
  Surface shaders handle it; vertex/fragment shaders need
  `UNITY_SETUP_INSTANCE_ID` written explicitly.
- **Three macro names in the Korean manual are missing an A**:
  `INSTNCING_ON`, `UNITY_INSTNCING_BUFFER_START/END`. `#ifdef INSTNCING_ON` in
  particular skips the block with no error, which makes it hard to trace. Trust
  the example code over the table, and read the English page.
- The 2021.3 table's "URP not supported" no longer holds. Unity 6's docs say
  it's **compatible with all pipelines, with the SRP Batcher disabled on
  URP/HDRP**.
- `MaterialPropertyBlock` breaks SRP Batcher compatibility. Instancing and the
  SRP Batcher can't both be had, so decide with the profiler.
- On Unity 6 the **GPU Resident Drawer** gets you there without hand-written
  shaders. Forward+ and `BatchRendererGroup Variants: Keep All` are the
  conditions; it applies to Mesh Renderers only and lengthens build times.
- Multi-pass shaders instance **only the first pass**. In built-in forward,
  objects lit by several lights won't improve as much as expected.

## References

- [GPU instancing shader reference for the Built-In Render Pipeline — Unity](https://docs.unity3d.com/6000.2/Documentation/Manual/gpu-instancing-birp-shader-modifications.html)
- [Introduction to GPU instancing — Unity](https://docs.unity3d.com/6000.5/Documentation/Manual/GPUInstancing.html)
- [Creating custom shaders that support GPU instancing in the Built-In Render Pipeline — Unity](https://docs.unity3d.com/6000.0/Documentation/Manual/gpu-instancing-shader.html)
- [Enable the GPU Resident Drawer in URP — Unity](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/gpu-resident-drawer.html)
- Original (Korean): [GPU 인스턴싱을 지원하는 셰이더 생성 (2021.3)](https://docs.unity3d.com/kr/2021.3/Manual/gpu-instancing-shader.html)
