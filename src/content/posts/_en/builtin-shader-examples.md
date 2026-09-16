---
pubDatetime: 2026-09-16T20:00:00+09:00
title: "Thirteen Built-In Shader Examples: The Further Down the List, the Less Ports to URP"
lang: en
translationKey: builtin-shader-examples
featured: false
draft: false
tags:
  - Unity
  - Shader
  - URP
  - Graphics
  - Rendering
description: "Unity's thirteen official HLSL shader examples are all Built-In only. The first few port to URP by renaming things; from lighting onward it's a rewrite. I mapped them one by one — and found a line I got wrong in the previous post."
---

The previous post was about how Unity's custom shader docs **fork into URP and
Built-In**. This clipping is the **Built-In branch** of that fork: thirteen
hand-written HLSL examples in a single table.

That's why I clipped it — **to compare it against URP.** They're written by
Unity so the quality is dependable, and they climb in order from a single color
up through shadows and fog, which makes them good material to compare against.

The problem is that they're **all Built-In only.** So there's really just one
question worth asking: **how many of them port to URP?**

## Table of contents

## First, a line I got wrong last time

Something caught me the moment I opened this page. The example code starts like
this:

```hlsl
Shader "Unlit/SingleColor"
{
    Properties
    {
        _Color ("Main Color", Color) = (1,1,1,1)
    }
    SubShader
    {
        Pass
        {
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"
            ...
```

**It's a Built-In example, and it uses `HLSLPROGRAM`.** In the previous post,
laying out the differences between Built-In and URP, I put "Built-In uses
`CGPROGRAM`, URP uses `HLSLPROGRAM`" in a table. **That was wrong.** I checked
all thirteen examples: every one uses `HLSLPROGRAM` / `ENDHLSL`.

The correct distinction is in the ShaderLab code blocks reference.

| Block | What the manual says |
|---|---|
| `HLSLPROGRAM` · `HLSLINCLUDE` | **Compatible with all render pipelines** |
| `CGPROGRAM` · `CGINCLUDE` | **Compatible only with the Built-In Render Pipeline** |

So `HLSLPROGRAM` isn't a URP marker — it's **the one that works in both** — and
`CGPROGRAM` is the Built-In-only one. The manual also recommends the HLSL
variants unless you're writing surface shaders.

And there's a less-known trap attached to this.

> If you use `CGPROGRAM`, Unity includes **several of Unity's built-in shader
> include files by default**, enabling you to use built-in variables and
> functions.

> Shaders that use `CGPROGRAM` **might not work if you change the keyword to
> `HLSLPROGRAM`.**

Which means old examples break not because of the keyword itself but because of
**what the keyword was dragging in behind it.** Swap `CGPROGRAM` for
`HLSLPROGRAM` and the automatic includes disappear, so you have to write the
`#include` lines yourself. I've marked up that line in the previous post.

## All thirteen are Built-In only

Here's the list. Pipeline dependence grows as you go down.

| # | Example | What it does |
|---|---|---|
| 1 | Single color | Outputs one color |
| 2 | Checkerboard pattern | A checkerboard |
| 3 | Simple unlit | An unlit texture |
| 4 | Mesh normals | Normals as colors |
| 5 | Reflections | Sky reflection |
| 6 | Normal map texture | Reflections via a texture |
| 7 | Tri-planar texturing | Projection on three axes |
| 8 | Simple diffuse lighting | Simple diffuse lighting |
| 9 | Ambient light | Ambient |
| 10 | Shadow casting | Casting shadows |
| 11 | Receiving shadows | Receiving shadows |
| 12 | Fog | Fog |
| 13 | Visualizing vertex data | Vertex data visualization |

The page's first sentence pins the scope:

> This section contains example source code for hand-coded custom shaders that
> are **compatible with the Built-in Render Pipeline**.

So if you opened this in a URP project, you can read it but you **can't paste
it.** Where it sticks and where it stops is below.

## The top half — renaming is enough

Examples 1–4 and 13 **only do coordinate transforms and texture sampling.** The
only thing the pipeline supplies is matrices, so renaming is all it takes.

| What Built-In uses | URP equivalent |
|---|---|
| `appdata_base` | An `Attributes` struct you declare yourself |
| `UnityObjectToClipPos(v.vertex)` | `TransformObjectToHClip(IN.positionOS.xyz)` |
| `UnityObjectToWorldNormal(v.normal)` | `GetVertexNormalInputs(IN.normalOS).normalWS` |
| `sampler2D _MainTex;` + `tex2D(...)` | `TEXTURE2D`·`SAMPLER` + `SAMPLE_TEXTURE2D(...)` |
| `fixed4` | `half4` |
| `#include "UnityCG.cginc"` | `#include ".../ShaderLibrary/Core.hlsl"` |

Add the **`RenderPipeline` tag** and you're done.

`appdata_base` not existing in URP feels inconvenient at first, but it's
actually better. The Built-In unlit example takes `appdata_base` and uses only
`texcoord`, while the struct also carries normals and other UVs. **Declaring it
yourself passes only what you use.**

`fixed` is the old low-precision type. The optimization docs say to use `half`
for **every variable except world and texture coordinates**, so switch it while
you're porting.

## From lighting on, it's a rewrite

The character changes at example 8, because that's where the shader starts using
**data the pipeline hands it.** Here's the Built-In diffuse example:

```hlsl
Pass
{
    Tags {"LightMode"="ForwardBase"}

    HLSLPROGRAM
    #pragma vertex vert
    #pragma fragment frag
    #include "UnityCG.cginc"
    #include "UnityLightingCommon.cginc"
    ...
    half3 worldNormal = UnityObjectToWorldNormal(v.normal);
    half nl = max(0, dot(worldNormal, _WorldSpaceLightPos0.xyz));
    o.diff = nl * _LightColor0;
```

URP has **neither `_WorldSpaceLightPos0` nor `_LightColor0`**, and `ForwardBase`
isn't a URP pass tag either. The mapping:

| Built-In | URP |
|---|---|
| `Tags {"LightMode"="ForwardBase"}` | `Tags {"LightMode"="UniversalForward"}` |
| `#include "UnityLightingCommon.cginc"` | `#include ".../ShaderLibrary/Lighting.hlsl"` |
| `_WorldSpaceLightPos0.xyz` | `GetMainLight().direction` |
| `_LightColor0` | `GetMainLight().color` |
| Computing `nl * _LightColor0` by hand | `LightingLambert(lightColor, lightDir, normalWS)` |
| `ShadeSH9(half4(worldNormal,1))` | `SampleSH(normalWS)` |
| `UNITY_SAMPLE_TEXCUBE(unity_SpecCube0, ...)` + `DecodeHDR(...)` | `GlossyEnvironmentReflection(...)` |

In the URP manual's own words, `GetMainLight()` **"returns the main light in the
scene"** and `LightingLambert` **"returns the diffuse lighting for the surface
normal, calculated using the Lambert model."** So **reading variables and doing
the math yourself becomes calling a function and receiving the result.**

This isn't a substitution because **the structure differs.** Built-In exposes a
few globals and leaves the math to the shader. URP wraps the light in a `Light`
struct and gives it to you through functions. There's no line-for-line mapping;
the calculation has to be rewritten.

Reflections are the same story. The Built-In example samples the cubemap and
does the HDR decode by hand. URP's `GlossyEnvironmentReflection` **"samples
reflection probes if the object is within a reflection probe volume, and samples
the skybox otherwise,"** handling probe blending too. One function replaces the
whole example.

## Shadows and fog — entirely different macros

Examples 10–12 port the worst. **The macro names are from another world.**

Here's the Built-In shadow caster pass:

```hlsl
Pass
{
    Tags {"LightMode"="ShadowCaster"}

    HLSLPROGRAM
    #pragma vertex vert
    #pragma fragment frag
    #pragma multi_compile_shadowcaster
    #include "UnityCG.cginc"

    struct v2f {
        V2F_SHADOW_CASTER;
    };

    v2f vert(appdata_base v)
    {
        v2f o;
        TRANSFER_SHADOW_CASTER_NORMALOFFSET(o)
        return o;
    }

    float4 frag(v2f i) : SV_Target
    {
        SHADOW_CASTER_FRAGMENT(i)
    }
    ENDHLSL
}
```

`V2F_SHADOW_CASTER`, `TRANSFER_SHADOW_CASTER_NORMALOFFSET`, and
`SHADOW_CASTER_FRAGMENT` are all macros from `UnityCG.cginc`. **URP doesn't have
them.** In URP you write a pass with `LightMode` set to `"ShadowCaster"`
yourself and apply bias with
`ApplyShadowBias(positionWS, normalWS, lightDirection)`.

**Receiving** shadows differs even more. The Built-In example uses three
`AutoLight.cginc` macros — `SHADOW_COORDS(1)`, `TRANSFER_SHADOW(o)`, and
`SHADOW_ATTENUATION(i)` — plus `#pragma multi_compile_fwdbase`. URP uses
functions.

| Built-In | URP |
|---|---|
| `SHADOW_COORDS(1)` (declares a struct member) | Declare a `float4 shadowCoord` yourself |
| `TRANSFER_SHADOW(o)` | `GetShadowCoord(vertexInputs)` or `TransformWorldToShadowCoord(positionWS)` |
| `SHADOW_ATTENUATION(i)` | `GetMainLight(shadowCoord).shadowAttenuation` or `MainLightRealtimeShadow(shadowCoord)` |
| `#pragma multi_compile_fwdbase` | `#pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE _MAIN_LIGHT_SHADOWS_SCREEN` |

Fog is a slightly different case. The Built-In example uses
`UNITY_FOG_COORDS(1)`, `UNITY_TRANSFER_FOG(o,o.position)`,
`UNITY_APPLY_FOG(i.fogCoord, color)`, and `#pragma multi_compile_fog`. URP does
have counterparts, but **its built-in shader methods documentation has no fog
section.** The documented categories are transforms, camera, lighting, indirect
lighting, and shadows. Fog alone is missing from the list.

Practically, that means **you have to open the package source and check.** It's
the only item on the porting list whose equivalent can't be found in the official
docs.

## Where and why you'd use this

To summarize: **how well things port declines in list order.**

| Examples | Porting to URP means |
|---|---|
| 1–4, 13 (color, pattern, unlit, normals, vertex data) | **Renaming** |
| 5–7 (reflections, normal map, tri-planar) | Renaming plus **collapsing** into reflection functions |
| 8–9 (diffuse, ambient) | **Rewrite** |
| 10–12 (shadows, fog) | **Rewrite**, and fog is outside the docs |

### The procedure for porting a Built-In example to URP

Having an order to follow keeps you from wandering.

1. **Add `"RenderPipeline" = "UniversalPipeline"` to the `SubShader` tags.**
   Without it URP won't use the shader at all.
2. **Swap the includes.** `UnityCG.cginc` → `Core.hlsl`, plus `Lighting.hlsl` if
   you use lighting.
3. **Replace `appdata_*` with a struct you declare.** Only the fields you use.
4. **Rename the functions.** `UnityObjectToClipPos` → `TransformObjectToHClip`,
   `UnityObjectToWorldNormal` → `GetVertexNormalInputs(...).normalWS`.
5. **Switch texture declarations to macros.** `sampler2D`/`tex2D` →
   `TEXTURE2D`/`SAMPLER`/`SAMPLE_TEXTURE2D`.
6. **Change `fixed` to `half`.**
7. **If it compiles here, it was one of examples 1–7.** If lighting or shadows
   are still outstanding, that's a rewrite rather than a substitution, so
   **starting over from a URP example is faster** than repairing the Built-In
   code.

Step 7 is the point. Porting anything past example 8 line by line just burns
time.

### Why these examples are still worth reading

Even on a URP project, this page earns its read, **because it shows what the
pipeline is doing on your behalf.**

What URP's one-line `GetMainLight()` conceals becomes clear once you've seen the
Built-In example read `_WorldSpaceLightPos0` and `_LightColor0` and run the `dot`
by hand. Same for `GlossyEnvironmentReflection` — the Built-In example's
`UNITY_SAMPLE_TEXCUBE` plus `DecodeHDR` is what lives inside it.

Where things get inserted as a vertex becomes a pixel is laid out in
[The Graphics Pipeline](/en/posts/graphics-pipeline/), and the starting point for
writing a shader fresh on the URP side is
[The Table on Unity's Custom Shaders Page Is a Fork](/en/posts/unity-custom-shaders/).

### What not to port

- **Surface shaders.** Every example on this page is hand-written HLSL so it
  doesn't come up here, but other corners of the Built-In docs have
  `#pragma surface`. That has no URP equivalent.
- **`UsePass "Legacy Shaders/VertexLit/SHADOWCASTER"`.** That's the last line of
  the receiving-shadows example — syntax for pulling in a legacy Built-In shader
  by name. URP doesn't have that shader.
- **Porting with `fixed` left in place.** It may compile, but the optimization
  docs recommend `half`.

## The examples disagree with each other

Going through all thirteen to port them, I noticed the examples don't quite
agree. The same operation is written differently from page to page.

**Clip space transforms come in two forms.**

```hlsl
// Single color example
return mul(UNITY_MATRIX_MVP, vertex);

// Simple diffuse lighting example
o.vertex = UnityObjectToClipPos(v.vertex);
```

Same transform: one multiplies the matrix directly, the other calls a helper.
Both are live in the current docs.

**The reflections example uses a name that isn't in the list.**

```hlsl
float3 worldPos = mul(_Object2World, vertex).xyz;
```

That's `_Object2World`, and **the current built-in shader variables reference
doesn't carry that name.** What that page lists is `unity_ObjectToWorld` and
`unity_WorldToObject`. Only the example uses the older spelling.

Neither case means "this example is broken" — both will still compile. But
**copying an example verbatim leaves you using a different name from the
manual's own reference page.** While you're porting, match the reference.

## Summary

- **`HLSLPROGRAM` works in every pipeline; `CGPROGRAM` is the Built-In-only
  one.** I had that backwards in the previous post and have marked it up. The
  actual trap is that `CGPROGRAM` **pulls in includes automatically**, which is
  why swapping the keyword alone can break a shader.
- **All thirteen examples are Built-In only.** The page's first sentence says so.
- **Examples 1–4 and 13 port by renaming.** Swap `appdata_base`,
  `UnityObjectToClipPos`, `sampler2D`/`tex2D`, and `fixed`, then add the
  `RenderPipeline` tag.
- **From example 8 (lighting) on, it's a rewrite.** Built-In exposes globals;
  URP hands you functions like `GetMainLight()`. Different structure, no
  line-for-line mapping.
- **Examples 10–12 (shadows, fog) use an entirely different macro system.** And
  **fog has no section at all** in URP's built-in shader methods docs.
- **The examples disagree with each other.** `UNITY_MATRIX_MVP` and
  `UnityObjectToClipPos` are mixed, and the reflections example's
  `_Object2World` isn't in the current variables reference.

Trying to convert these thirteen for URP is mostly wasted effort. As material
showing **what the pipeline is doing for you**, though, they still hold value.
What the single line `GetMainLight()` hides is spread out right here.

---

### References

- [HLSL shader examples in the Built-in Render Pipeline — Unity Manual 6000.2](https://docs.unity3d.com/6000.2/Documentation/Manual/built-in-shader-examples.html)
- [Shader code blocks in ShaderLab reference](https://docs.unity3d.com/6000.4/Documentation/Manual/shader-shaderlab-code-blocks.html)
- [Simple diffuse lighting shader example](https://docs.unity3d.com/6000.2/Documentation/Manual/built-in-shader-examples-simple-diffuse-lighting.html)
- [Shadow casting shader example](https://docs.unity3d.com/6000.2/Documentation/Manual/built-in-shader-examples-shadow-casting.html)
- [Receiving shadows shader example](https://docs.unity3d.com/6000.2/Documentation/Manual/built-in-shader-examples-receive-shadows.html)
- [Use lighting in a custom URP shader](https://docs.unity3d.com/6000.2/Documentation/Manual/urp/use-built-in-shader-methods-lighting.html)
- [Use shadows in a custom URP shader](https://docs.unity3d.com/6000.2/Documentation/Manual/urp/use-built-in-shader-methods-shadows.html)
- [Use indirect lighting in a custom URP shader](https://docs.unity3d.com/6000.2/Documentation/Manual/urp/use-built-in-shader-methods-indirect-lighting.html)
- [Built-in shader variables reference](https://docs.unity3d.com/6000.2/Documentation/Manual/SL-UnityShaderVariables.html)

The clipping dates from December 2025. Its source link is **pinned to 6000.2**,
so the example code is quoted from that version. Only the ShaderLab code blocks
reference has no page at that version, so 6000.4 was used for it.
