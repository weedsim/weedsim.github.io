---
pubDatetime: 2026-09-16T19:00:00+09:00
title: "The Table on Unity's Custom Shaders Page Is a Fork, Not an Index"
lang: en
translationKey: unity-custom-shaders
featured: false
draft: false
tags:
  - Unity
  - Shader
  - URP
  - Graphics
  - Optimization
description: "Unity's Custom shaders page has a separate row for URP and for the Built-In pipeline. That split is usually why shader code you find online won't even compile. Here's what actually differs on each branch, plus what's under the Troubleshooting row nobody clicks."
---

While working with a URP glitch package I figured I'd have to touch the shaders
directly, so I clipped Unity's **Custom shaders** manual page. It's one table
with six rows.

Opening it again, something in the table stands out: **two rows do the same
job.**

> Custom shaders in the Universal Render Pipeline (URP)
> Custom shaders in the Built-In Render Pipeline

"Writing shaders in URP" and "writing shaders in Built-In" are separate entries.
An index has no reason to split like that. **The split means the two roads
differ**, and that's usually why shader code you find online won't even compile.

I ran into the same thing hunting for glitch effects — a lot of what turns up in
search is from the Built-In era and doesn't drop in. The package that started
this is its own story, in
[Three Forks Later, an Official Version](/en/posts/urp-glitch-package/); this
post is about confirming the fork and then, while I was there, descending under
the row nobody clicks (Troubleshooting).

## Table of contents

## The table has a URP row and a Built-In row

The original table has six rows:

| Page | Description |
|---|---|
| Writing custom shaders | Creating shaders with Shader Graph, or HLSL and ShaderLab |
| Optimize shaders | Runtime performance, especially on mobile with limited GPU |
| **Custom shaders in URP** | Writing HLSL and ShaderLab code in URP |
| **Custom shaders in the Built-In Render Pipeline** | Writing HLSL, ShaderLab, and **Surface Shaders** in Built-In |
| Troubleshooting shaders | Common issues like hitches and stalls, or large build sizes |
| Shader languages reference | Reference for ShaderLab and HLSL |

Put rows three and four side by side and the difference shows. **Only the
Built-In row mentions Surface Shaders.** The URP row doesn't.

To check that wasn't incidental, I opened the Surface Shaders page.

## Surface Shaders are Built-In only

The first sentence already carries a condition:

> **In the Built-in Render Pipeline**, Surface Shaders are a streamlined way of
> writing shaders that interact with lighting.

And the compatibility table is explicit:

| Pipeline | Surface Shaders | Shader Graph |
|---|---|---|
| URP | **No** | Yes |
| HDRP | **No** | Yes |
| Custom SRP | **No** | **No** |
| Built-In | Yes | Yes |

Reading both columns together makes the picture clear:

- **Surface Shaders exist only in Built-In.** URP, HDRP, and custom SRP are all
  "No." For custom lighting in URP and HDRP, the manual says to **instead** use
  Shader Graph or modify the pipeline's own shader code.
- **Shader Graph, conversely, works in Built-In too.** I had it filed away as
  "URP/HDRP only" from when it was SRP-exclusive, but the current table says
  "Yes" for Built-In. **Custom SRP is the only "No"** here.

When a shader from a blog or the Asset Store renders pink in URP, this is the
first suspect. Code starting with `#pragma surface surf Standard` **does not run
in URP at all.** It isn't a syntax error; it's a different pipeline.

## What a URP shader must have

So what does a URP shader look like? The manual's minimal example:

```hlsl
Shader "Example/URPUnlitShaderBasic"
{
    Properties
    { }

    SubShader
    {
        Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" }

        Pass
        {
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            struct Attributes
            {
                float4 positionOS   : POSITION;
            };

            struct Varyings
            {
                float4 positionHCS  : SV_POSITION;
            };

            Varyings vert(Attributes IN)
            {
                Varyings OUT;
                OUT.positionHCS = TransformObjectToHClip(IN.positionOS.xyz);
                return OUT;
            }

            half4 frag() : SV_Target
            {
                half4 customColor = half4(0.5, 0, 0, 1);
                return customColor;
            }
            ENDHLSL
        }
    }
}
```

Compared with a Built-In example, ~~**three things differ**~~ **two things
differ** — and that's where porting an old tutorial breaks.

| | Built-In | URP |
|---|---|---|
| Pipeline tag | none | `"RenderPipeline" = "UniversalPipeline"` |
| ~~Block~~ | ~~`CGPROGRAM` … `ENDCG`~~ | ~~`HLSLPROGRAM` … `ENDHLSL`~~ |
| Include | `UnityCG.cginc` | `.../ShaderLibrary/Core.hlsl` |

> **Correction (2026-09-16)**
>
> The struck-through row is **wrong**. Writing the next post, I checked all
> thirteen of Unity's current Built-In shader examples, and **every one uses
> `HLSLPROGRAM` / `ENDHLSL`**. It is not true that Built-In uses `CGPROGRAM`.
>
> The ShaderLab code blocks reference puts it this way: `HLSLPROGRAM` and
> `HLSLINCLUDE` are **compatible with all render pipelines**, while `CGPROGRAM`
> and `CGINCLUDE` are **compatible only with the Built-In Render Pipeline**. So
> `HLSLPROGRAM` isn't a URP marker — it's **the one that works in both** — and
> `CGPROGRAM` is the Built-In-only one. I had the direction backwards.
>
> And the real catch wasn't the keyword but what sits behind it. The manual says
> that with `CGPROGRAM`, Unity **includes several built-in shader include files
> by default**, and warns that **swapping the keyword to `HLSLPROGRAM` alone can
> stop a shader from working**. What breaks old code isn't the block keyword —
> it's **the automatic includes that keyword was dragging along.**
>
> So the table above really holds **two** differences: the `RenderPipeline` tag
> and the include. The details are in
> [Thirteen Built-In Shader Examples](/en/posts/builtin-shader-examples/).

**The `RenderPipeline` tag** is what makes URP recognize the SubShader as its
own. Without it, URP won't use it.

**`UnityCG.cginc` is not URP's shader library.** Built-In function names like
`UnityObjectToClipPos` become `TransformObjectToHClip` in URP. You aren't
renaming a few similar-looking functions — **the headers coming in are
different.**

The variable-name suffixes are worth noticing too. `positionOS` (Object Space),
`positionHCS` (Homogeneous Clip Space) — URP's shader library follows a
convention of **writing the coordinate space into the name.** It isn't a rule,
but every official example does it, so matching it makes later reading easier.

## The row nobody clicks — Troubleshooting

The fifth row reads "hitches and stalls, or large build sizes." It's the one you
don't care about when you're starting out, and **the one you eventually end up
at.** Descending, it forks four ways.

| Page | Content |
|---|---|
| Error and loading shaders | The special shaders Unity uses when it can't use regular ones |
| Fixing hitches or stalls | Stalls from Unity loading or compiling shaders while a scene runs |
| Reducing the size or number of shaders | Cutting compiled shader count and shader memory use |
| Debugging shaders | Compiling with debug symbols and analyzing |

### Variants multiply

The second and third share a root: **shader variants.** The manual states the
rule in one line.

> The number of shader variants that Unity compiles for a shader program is the
> **product of the keyword sets**; that is to say, Unity compiles one variant
> for every combination that includes one element from each set.

Its example is concrete. Three colors (RED/GREEN/BLUE) and four quality levels
(LOW/MEDIUM/HIGH/ULTRA) gives 3 × 4 = **12**. That sounds harmless until the
next sentence:

> If the shader has ten such sets of keywords, this results in **1024 variants**.

And the phenomenon has a name — **combinatorial explosion.** A large share of
long build times and bloated build sizes comes from this.

### `multi_compile` versus `shader_feature`

There are two directives for producing variants, and **exactly one sentence
separates them.**

| Directive | What the manual says |
|---|---|
| `#pragma shader_feature` | Compiles variants for keyword combinations that **materials in your build use**, and removes the rest |
| `#pragma multi_compile` | Compiles variants **regardless** of whether materials in your build use them |
| `#pragma dynamic_branch` | Keeps the branching **inside a single compiled program** |

`multi_compile` buys you **the ability to flip keywords from script at runtime**,
at the cost of compiling everything. The manual's example is eight sets of three
keywords — **over 6,000** variants.

The line to draw: **a checkbox on the material means `shader_feature`; something
you change from code at runtime means `multi_compile`.** Reach for
`multi_compile` by habit and every unused combination ships in the build.

`dynamic_branch` is a different animal. It doesn't add variants; it turns
keywords into **uniform integers of 0 or 1** sent to the GPU per draw call. You
trade variant count for branch cost inside the shader.

### URP strips some of this for you

On URP, part of this is handled without you touching anything.

> If you disable features in the URP Asset, URP automatically excludes
> ("strips") the related shader variants.

The manual's example is **Cast Shadows** on directional lights: turn it off and
the related shadow variants leave the build. Which means **the checkboxes in the
URP Asset are your build size.** Leave features on that you don't use and they
ship.

### Stalls are a compile-time problem

The hitching side has a slightly different cause: the **first time** a variant is
used, compiling the shader and its PSO stalls the game.

A **PSO (pipeline state object)** is compiled shader code bundled with its
related GPU state. The fix is to build them ahead of time.

> Compile shaders and create PSOs **before they're first needed**, so that the
> graphics driver caches them to disk.

The APIs split by graphics API:

| Target | API |
|---|---|
| DirectX 12 · Metal · Vulkan | `GraphicsStateCollection.BeginTrace` / `EndTrace` / `SendToEditor`, `WarmUp`, `WarmUpProgressively` |
| Everything else | `Experimental.Rendering.ShaderWarmup`, `Shader.WarmupAllShaders`, `ShaderVariantCollection.WarmUp` |

The manual does note that **"some of the APIs are experimental and not ready for
production use."** The `Experimental` sitting right in the namespace says the
same thing. Check your target platforms and Unity version before wiring this in.

## Where and why you'd use this

All of the above tends to meet in one place: **an effect that changes material
values from code.** A hit flash, an item highlight, a dissolve.

### The shader side — exposing properties and a keyword

The minimal example above, with two properties and one keyword added.

```hlsl
Shader "Example/URPHighlight"
{
    Properties
    {
        _BaseMap("Base Map", 2D) = "white" {}
        _BaseColor("Base Color", Color) = (1, 1, 1, 1)
        _HighlightColor("Highlight Color", Color) = (1, 1, 0, 1)
        _HighlightAmount("Highlight Amount", Range(0, 1)) = 0
        [Toggle(_RIM_ON)] _RimEnabled("Enable Rim", Float) = 0
    }

    SubShader
    {
        Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" }

        Pass
        {
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            // Only ever toggled on the material, so shader_feature.
            // If it had to be flipped from code at runtime, it would be multi_compile.
            #pragma shader_feature_local_fragment _RIM_ON

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            struct Attributes
            {
                float4 positionOS   : POSITION;
                float3 normalOS     : NORMAL;
                float2 uv           : TEXCOORD0;
            };

            struct Varyings
            {
                float4 positionHCS  : SV_POSITION;
                float2 uv           : TEXCOORD0;
                half3  normalWS     : TEXCOORD1;
                float3 positionWS   : TEXCOORD2;
            };

            TEXTURE2D(_BaseMap);
            SAMPLER(sampler_BaseMap);

            // Material properties go in this block for SRP Batcher compatibility.
            CBUFFER_START(UnityPerMaterial)
                float4 _BaseMap_ST;
                half4  _BaseColor;
                half4  _HighlightColor;
                half   _HighlightAmount;
            CBUFFER_END

            Varyings vert(Attributes IN)
            {
                Varyings OUT;
                VertexPositionInputs positions = GetVertexPositionInputs(IN.positionOS.xyz);
                VertexNormalInputs   normals   = GetVertexNormalInputs(IN.normalOS);
                OUT.positionHCS = positions.positionCS;
                OUT.positionWS  = positions.positionWS;
                OUT.normalWS    = half3(normals.normalWS);
                OUT.uv          = TRANSFORM_TEX(IN.uv, _BaseMap);
                return OUT;
            }

            half4 frag(Varyings IN) : SV_Target
            {
                half4 albedo = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, IN.uv) * _BaseColor;

            #ifdef _RIM_ON
                half3 viewDirWS = half3(GetWorldSpaceNormalizeViewDir(IN.positionWS));
                half  rim = half(1.0) - saturate(dot(normalize(IN.normalWS), viewDirWS));
                albedo.rgb += _HighlightColor.rgb * rim * _HighlightAmount;
            #else
                albedo.rgb = lerp(albedo.rgb, _HighlightColor.rgb, _HighlightAmount);
            #endif

                return albedo;
            }
            ENDHLSL
        }
    }
}
```

Three decisions here come from the manual:

- **`shader_feature` was the choice.** This toggle is only ever set on the
  material, so with no runtime control needed, it's better that unused
  combinations drop out of the build. The `_local` suffix scopes the keyword to
  this shader and `_fragment` marks it as affecting only the fragment stage; the
  manual says `_vertex`/`_fragment`/`_hull`/`_domain`/`_geometry`/`_raytracing`
  and `_local` **can be combined**.
- **Coordinate transforms use URP's built-in methods.**
  `GetVertexPositionInputs`, `GetVertexNormalInputs`, and
  `GetWorldSpaceNormalizeViewDir` are all in URP's documented list of built-in
  shader methods.
- **`half` is the default, with `float` for `positionWS` and `uv`.** That's the
  optimization page's rule, and those two are exactly its stated exceptions.
  Casts like `half(1.0)` rather than the `1.0h` suffix — also its rule.

### The C# side — setting values without cloning the material

Two things to watch when driving shader properties from code.

```csharp
using UnityEngine;

/// <summary>
/// Briefly raises the material's highlight value on hit, then eases it back.
/// </summary>
[RequireComponent(typeof(Renderer))]
public class HitFlash : MonoBehaviour
{
    private const float FLASH_DURATION = 0.15f;

    // Cache the ID so the string isn't hashed every call.
    private static readonly int HIGHLIGHT_AMOUNT_ID = Shader.PropertyToID("_HighlightAmount");

    [Header("Flash")]
    [SerializeField, Range(0f, 1f), Tooltip("Highlight strength at the moment of impact")]
    private float _peak = 1f;

    private Renderer _renderer;
    private MaterialPropertyBlock _propertyBlock;
    private float _flashEndTime;

    private void Awake()
    {
        _renderer = GetComponent<Renderer>();
        _propertyBlock = new MaterialPropertyBlock();
    }

    public void Flash()
    {
        _flashEndTime = Time.time + FLASH_DURATION;
        enabled = true;
    }

    private void Update()
    {
        float remaining = _flashEndTime - Time.time;
        float amount = remaining <= 0f
            ? 0f
            : _peak * (remaining / FLASH_DURATION);

        // Touching renderer.material creates a copy of the material.
        // A property block overrides the value for this renderer without that copy.
        _renderer.GetPropertyBlock(_propertyBlock);
        _propertyBlock.SetFloat(HIGHLIGHT_AMOUNT_ID, amount);
        _renderer.SetPropertyBlock(_propertyBlock);

        if (remaining <= 0f)
        {
            enabled = false;
        }
    }
}
```

Two notes:

- **`Shader.PropertyToID` caches the ID.** Pass the string every frame and it
  gets hashed every frame. Same reason you use `Animator.StringToHash` for
  animator parameters.
- **`MaterialPropertyBlock` instead of `renderer.material`.** The Scripting
  Reference says of `Renderer.material`: **"This function automatically
  instantiates the materials and makes them unique to this renderer"** and
  **"It is your responsibility to destroy the materials when the game object is
  being destroyed."** A hundred enemies means a hundred material copies, and
  cleaning them up is on me. The manual doesn't recommend property blocks as the
  alternative, but after those two sentences there's no reason to clone a
  material to change one value.

The component also switching itself off with `enabled = false` is deliberate —
`Update` isn't called on a disabled component.

### Where not to use any of it

- **Writing HLSL for something Shader Graph handles.** The table says Yes for
  URP, HDRP, and Built-In. Hand-writing is better only when you have a specific
  reason (you want a readable diff in version control, or the graph can't express
  it).
- **Reaching for `multi_compile` by default.** If it won't change at runtime,
  it's `shader_feature`. The 6,000-variant example above is what the default
  costs.
- **`discard` and `ColorMask` on mobile.** The optimization page says to avoid
  both, directly.

## What the optimization page yields

That's the table's second row. It's short, but everything in it applies
immediately.

> Use `half` instead of `float` for **all variables except world space
> coordinates and texture coordinates**.

> Use **casts instead of suffixes**. For example, use `half(2.0)` instead of
> `2.0h`.

The reason for the second is that suffixes trigger unnecessary float conversions
that slow the shader down. The rest:

| Rule | Reason |
|---|---|
| Move calculations from fragment to the **vertex shader** | Cuts per-pixel cost |
| **Lookup textures** instead of `pow`/`log`/`sin` | Those calls are expensive |
| Use **Unity's HLSL functions** for `normalize`/`dot` | Don't roll your own |
| Avoid `discard` and `ColorMask` on mobile | — |
| **Don't write to the depth buffer** in fragment shaders | Preserves early depth testing |

That last one pays the most. A fragment shader writing depth forces the GPU to
give up **discarding occluded pixels before shading them**. The order in which a
vertex becomes a pixel is laid out in
[The Graphics Pipeline](/en/posts/graphics-pipeline/).

## Summary

- **The separate URP and Built-In rows are the page's key information.** It's a
  fork, not an index.
- **Surface Shaders are Built-In only.** URP, HDRP, and custom SRP are all "No."
  Code starting with `#pragma surface` won't run in URP.
- **Shader Graph does work in Built-In.** Custom SRP is the only place it
  doesn't.
- **A URP shader differs in ~~three~~ two ways** — the `RenderPipeline` tag and
  `Core.hlsl`. Code that includes `UnityCG.cginc` can't be pasted across.
  ~~`HLSLPROGRAM`~~ The program block is not one of the differences — see the
  correction in the body.
- **Variants are the product of the keyword sets.** Ten sets gives 1024; eight
  sets of three gives over 6,000. The manual's word for it is combinatorial
  explosion.
- **Anything you won't change at runtime is `shader_feature`.** `multi_compile`
  compiles everything, used or not. The URP Asset's checkboxes are your build
  size too.
- **`half` by default, `float` for world and texture coordinates.** Casts, not
  suffixes.

When I clipped it, this page read like "getting started with shaders." Rereading
it, it's a page that says **"first find out which pipeline you're in."** The
table isn't six rows; it's two branches tangled together and showing as six.

---

### References

- [Custom shaders — Unity Manual 6000.2](https://docs.unity3d.com/6000.2/Documentation/Manual/Shaders.html)
- [Surface Shaders](https://docs.unity3d.com/6000.2/Documentation/Manual/SL-SurfaceShaders.html)
- [Custom shaders in URP](https://docs.unity3d.com/6000.2/Documentation/Manual/urp/writing-custom-shaders-urp.html)
- [Shader variants](https://docs.unity3d.com/6000.2/Documentation/Manual/shader-variants.html)
- [How Unity compiles branching shaders](https://docs.unity3d.com/6000.2/Documentation/Manual/shader-conditionals-choose-a-type.html)
- [Prewarm shaders](https://docs.unity3d.com/6000.2/Documentation/Manual/shader-prewarm.html)
- [Transform positions in a custom URP shader — built-in shader methods](https://docs.unity3d.com/6000.1/Documentation/Manual/urp/use-built-in-shader-methods-transformations.html)
- [Optimize shaders](https://docs.unity3d.com/6000.2/Documentation/Manual/SL-ShaderPerformance.html)
- [Renderer.material — Scripting Reference](https://docs.unity3d.com/ScriptReference/Renderer-material.html)

The clipping dates from December 2025. Its source link is **pinned to 6000.2**,
so the quotations come from that version of the manual. A link with a version in
it is easy to check back against later.
