---
pubDatetime: 2026-10-03T17:20:00+09:00
title: "The Definition Describes a Pixel Shader, Not a Shader"
lang: en
translationKey: what-is-a-shader
featured: false
draft: false
tags:
  - Unity
  - Shader
  - Graphics
  - GPU
  - Rendering
description: "A 2024 write-up on what a shader is. The transcription argument is accurate and even brings sources, but one sentence of the definition conflicts with the structure section two sections later. What's written there is a pixel shader, not a shader."
---

I clipped this **while applying a toon shader.** In
[the post on lilToon's parameters](/posts/liltoon-parameters/) I checked the
Inspector items one by one, and while handling them **"what exactly is a shader"**
kept sitting behind it. Knowing the parameters and knowing where those values go
are different things.

The original is a 2024 post, bundled briefly into four sections: definition,
transcription, structure, materials.

**This post reads differently from the other clippings.** It quotes the National
Institute of Korean Language's loanword transcription rules directly when
addressing the spelling question, and links Unity's official docs for the material
explanation. It's a post that brings sources.

So there's little that snags. But **one sentence of the definition conflicts with
what comes two sections later.**

> A **shader** is, in computer graphics, **a program that defines and processes the
> color, shading and lighting effects output to the screen.**

> A shader is broadly **composed of two parts**, a **vertex shader** and a **pixel
> shader**.

Read the two together and it says **the vertex shader processes color and
lighting.** It doesn't. The definition describes only the latter of the two.

## Table of Contents

## The Transcription Argument Is Accurate

What's well done first. The spelling question, which is also this post's title.

> According to the **loanword transcription rules** published by the National
> Institute of Korean Language, **word-final \[ʃ\] is written '시', \[ʃ\] before a
> consonant as '슈', and \[ʃ\] before a vowel as '샤', '섀', '셔', '셰', '쇼',
> '슈' or '시' depending on the vowel that follows**, which makes **셰이더** the
> correct transcription.

Look the rule up and it's exactly that. This is the sentence the Institute itself
quotes when answering the same question.

> Word-final \[ʃ\] is written '시' (e.g. flash → 플래시)
>
> \[ʃ\] before a consonant as '슈' (e.g. shrub → 슈러브)
>
> \[ʃ\] before a vowel is written '샤', '섀', '셔', '셰', '쇼', '슈' or '시'
> depending on the vowel that follows (e.g. shark → 샤크, shopping → 쇼핑)

`shader` is `/ˈʃeɪdər/`. The \[ʃ\] sits **before a vowel** and the vowel that
follows is \[eɪ\], so '셰' is what the third line's list selects. '셰' + '이' =
**셰이**.

Line up other words that came out of the same rule and the consistency shows.

| English | Position of \[ʃ\] | Transcription |
| --- | --- | --- |
| flash | Word-final | 플래시 |
| shrub | Before a consonant | 슈러브 |
| shark | Before a vowel \[ɑː\] | 샤크 |
| shopping | Before a vowel \[ɒ\] | 쇼핑 |
| shake | Before a vowel \[eɪ\] | 셰이크 |
| **shader** | Before a vowel \[eɪ\] | **셰이더** |

It's the same reason nobody writes a milkshake as '밀크쉐이크'. `shake` and
`shader` have the same first syllable.

And the post doesn't stop at the rule. **It goes on to check which way the official
docs and recently published books are settling.** Looking at the norm and the
actual usage together is a rare virtue in a post like this.

## Material Isn't a "Similar Reason" to Shader

A parenthetical line in the materials section.

> (Material is also written 머티리얼, 메터리얼 and so on, but **for a reason
> similar to shader** I'll write 머티리얼)

**It isn't a similar reason.** The reason 셰이더 is 셰이더 is the \[ʃ\] rule, and
`material` **has no \[ʃ\] sound.** It's `/məˈtɪəriəl/`. The rule quoted in the
previous section has nowhere to apply in this word.

Where `material`'s transcription splits is somewhere else. The first syllable is
\[mə\], and the competing '메터리얼' is **the result of reading the spelling
(`ma-te-`) rather than the pronunciation.** The loanword rules transcribe **by
pronunciation, not spelling**, so the reason the two split has nothing to do with
\[ʃ\].

| | 셰이더 vs 쉐이더 | 머티리얼 vs 메터리얼 |
| --- | --- | --- |
| The sound that splits | \[ʃ\] | \[ə\] |
| The rule that applies | The fricative \[ʃ\] item | Vowel transcription |
| Cause of the mixing | The customary '쉐' | Reading the spelling |

The conclusion is the same — **머티리얼 is correct.** It just **isn't correct for
the same reason.** Because this is a post that quoted the rule precisely, that
parenthetical reads as a spot that leaned on its own precision. Whether 머티리얼 is
listed in the official examples glossary I couldn't confirm.

## The Definition Describes a Pixel Shader

The conflict from the opening. The definition section and the structure section,
set down again.

> A shader is ... **a program that defines and processes the color, shading and
> lighting effects output to the screen.** It decides what value to give each
> pixel on screen ...

> A shader is broadly **composed of two parts**, a **vertex shader** and a **pixel
> shader**.

The definition says "decides what value to give each pixel on screen," and the
vertex shader description two sections later reads like this.

> **computes vertex positions and passes the texture coordinates corresponding to
> each vertex**

**No color, no shading, no lighting.** Positions and coordinates. The definition
describes the latter of the two.

Unity's current docs scope it to a far narrower single sentence.

> **A program that runs on the GPU**

That's all of it. What it computes doesn't enter the definition. What enters that
slot is **which stage it runs at**, and each stage does something different.

| Shader | What it takes | What it puts out |
| --- | --- | --- |
| Vertex | One vertex | A transformed position + attributes to interpolate |
| Fragment / pixel | Interpolated attributes | One candidate color |
| Compute | Arbitrary buffers | Arbitrary buffers |

The last row breaks the definition most clearly. **A compute shader outputs nothing
to the screen.** The post sets compute shaders aside as "advanced material for
later," and that one is a counterexample to "a program that processes the color
output to the screen."

"Composed of two parts" also diverges from Unity's terminology. The docs describe a
Shader object as **a container.**

> A Shader object is a Unity-specific way of working with shader programs; **it is
> a wrapper for shader programs** and other information.

> **It lets you define multiple shader programs in the same file**, and tell Unity
> how to use them.

Not "one made of two" but **"one that holds many."** That's why there can be
several Passes, and why SubShaders can diverge by hardware.

> SubShaders let you separate your Shader object into parts that are compatible
> with different hardware, render pipelines, and runtime settings.

Using pixel and fragment as the same word is another place to go a layer deeper,
and [the post on the graphics pipeline](/posts/graphics-pipeline/) already covered
it — a fragment is a pixel candidate, and several fragments can appear for one
pixel slot. So it isn't "computes the final color of each pixel" but **puts out a
candidate color, and the next stage decides the final pixel.**

## Post-Processing Has a Vertex Shader Too

The last sentence of the pixel shader section.

> **Unlike the vertex shader**, because it computes with color values, it's also
> used in post-process effects and in 2D environments.

"Unlike the vertex shader" is wrong. **Post-processing and 2D have vertex shaders
too.** They can't not.

A valid usage rule in the Vulkan specification pins it down.

> If the pipeline requires pre-rasterization shader state the `stage` member of
> one element of `pStages` **must** be `VK_SHADER_STAGE_VERTEX_BIT` or
> `VK_SHADER_STAGE_MESH_BIT_EXT`

A pipeline that rasterizes **must have either a vertex shader or a mesh shader.**
You cannot create a graphics pipeline with neither. (The mesh shader side is that
new path from [the earlier post](/posts/graphics-pipeline/).)

So what does post-processing's vertex shader do. **It transforms four or fewer
vertices of one screen-covering triangle (or quad).** It's invisible because it
does almost nothing, not because it isn't there.

2D is the same. A sprite is a quad, and a quad is four vertices. Something has to
take those four to screen coordinates.

| | Vertex count | What the vertex shader does |
| --- | --- | --- |
| 3D character | Tens of thousands | Skinning, transform, passing normals |
| 2D sprite | 4 | Transform, passing UVs |
| Post-processing | 3–4 | Generating fullscreen coordinates |

What the post meant was probably **"the case where the pixel shader is the center
of the work."** That's right. When writing a post-process shader, what you touch is
almost all on the fragment side. But write it as "unlike the vertex shader" and
**it reads as saying there isn't one.** And believing that, there's no explanation
for why a `Vert` function is sitting there when you write a post-process shader in
Shader Graph or HLSL.

## The Unity Doc It Cites Is Version 4.6

The materials section cites Unity's official docs. **Bringing the source is this
post's strength, and the version that link points at is the problem.**

> `https://docs.unity3d.com/460/Documentation/Manual/Materials.html`

The `460` in the URL is **Unity 4.6.** A 2014 edition, cited by a 2024 post. That
page's sentences read like this.

> There is a close relationship between Materials and Shaders in Unity.
> **Shaders contain code that defines what kind of properties and assets to use.
> Materials allow you to adjust properties and assign assets.**

> A Shader is implemented through a Material

What the post rendered as "a shader contains code that defines the properties and
kinds to use / a material lets you adjust those properties and assign textures,
colors and so on" is this sentence. **The translation is accurate.** The current
docs just draw the line differently.

> **Material** — An asset that defines how a surface should be rendered.

> **A material contains a reference to a Shader object.** If that Shader object
> defines material properties, then the material can also contain data such as
> colors or references to textures.

The difference is **direction.** The 4.6 edition says "A Shader is implemented
**through** a Material" — it reads as a shader being realized by way of a material.
The current edition says "A material **contains a reference to** a Shader object" —
the material points at the shader.

| | Unity 4.6 (the post's citation) | Current docs |
| --- | --- | --- |
| Definition of a material | The thing that lets you adjust properties | An asset defining how a surface is rendered |
| Their relationship | A shader is implemented through a material | A material **references** a shader |
| Direction of the reference | Ambiguous | Material → shader, one way |
| Property data | "you can assign" | Only if the shader defines properties |

The last two rows get used in practice. **That the reference is one-way is what
makes "one shader, many materials" possible.** Change the shader and every material
referencing it changes; change a material and only that one changes. That's what
the post's recipe analogy points at, and the 4.6 sentence doesn't show the
direction.

> A shader is the recipe for making the dish, and a material decides the
> ingredients and tools (textures, values) used when running the recipe.

The analogy is good. Add one layer and it follows that **changing the recipe
changes every dish made from it.**

## Where and Why You'd Use It

### One Shader, Many Materials

The shape of actually using that one-way reference. Say you're building an enemy
hit flash. One shader, only the color differs.

```
Assets/
  Shaders/
    Flashable.shader          ← one shader
  Materials/
    Enemy_Grunt.mat           ← _FlashColor = white
    Enemy_Archer.mat          ← _FlashColor = yellow
    Enemy_Brute.mat           ← _FlashColor = red
```

Fix the shader's flash logic and **all three change.** Want only the color changed
and you touch one material. The docs' "A material contains a reference to a Shader
object" guarantees that result.

When changing values in code, don't use the name as a string.

```csharp
using UnityEngine;

[RequireComponent(typeof(Renderer))]
public class HitFlash : MonoBehaviour
{
    private const float FLASH_DURATION = 0.12f;

    // Cache the ID instead of the string. Don't re-hash on every call.
    private static readonly int FLASH_AMOUNT_ID = Shader.PropertyToID("_FlashAmount");

    [Header("Flash")]
    [SerializeField, Range(0f, 1f), Tooltip("Flash strength at the moment of a hit")]
    private float _flashAmount = 1f;

    private Renderer _renderer;
    private float _remaining;

    private void Awake()
    {
        _renderer = GetComponent<Renderer>();
    }

    public void Flash()
    {
        _remaining = FLASH_DURATION;
    }

    private void Update()
    {
        if (_remaining <= 0f)
        {
            return;
        }

        _remaining -= Time.deltaTime;
        float t = Mathf.Clamp01(_remaining / FLASH_DURATION);

        // Renderer.material makes a material unique to this renderer. See the note below.
        _renderer.material.SetFloat(FLASH_AMOUNT_ID, _flashAmount * t);
    }
}
```

The reason to use `Shader.PropertyToID` is simple. `SetFloat("_FlashAmount", ...)`
works too, but turning that string into an integer ID happens **on every call.**
Get the ID once as a `static readonly` and that work disappears.

### `Renderer.material` Clones the Material

There's a note attached to the code above. What happens the moment you read
`_renderer.material` is written in the docs.

> Modifying `material` will change the material for this object only. If the
> material is used by any other renderers, **this will clone the shared material**
> and start using it from now on.

> This function automatically instantiates the materials and makes them unique to
> this renderer. **It is your responsibility to destroy the materials when the
> game object is being destroyed.**

**A clone appears, and cleaning it up is my responsibility.** With 100 enemies you
get 100 materials. And different materials split batching — you'd be raising the
draw calls to 100 to add one flash.

[The post on physics materials](/posts/rigidbody-physics-material/) had the same
trap on `Collider.material`. There too it clones the moment you read it. **Unity's
`material` properties share the same nature across different kinds.**

The reflexive answer here is `MaterialPropertyBlock`. The docs' stated purpose is
exactly this case.

> draw multiple objects with the same material, but slightly different
> properties. For example, if you want to slightly change the color of each mesh
> drawn.

```csharp
using UnityEngine;

[RequireComponent(typeof(Renderer))]
public class HitFlashNoClone : MonoBehaviour
{
    private const float FLASH_DURATION = 0.12f;

    private static readonly int FLASH_AMOUNT_ID = Shader.PropertyToID("_FlashAmount");

    [Header("Flash")]
    [SerializeField, Range(0f, 1f)] private float _flashAmount = 1f;

    private Renderer _renderer;
    private MaterialPropertyBlock _properties;
    private float _remaining;

    private void Awake()
    {
        _renderer = GetComponent<Renderer>();

        // Docs: create one block and reuse it. Don't new it every time.
        _properties = new MaterialPropertyBlock();
    }

    public void Flash()
    {
        _remaining = FLASH_DURATION;
    }

    private void Update()
    {
        if (_remaining <= 0f)
        {
            return;
        }

        _remaining -= Time.deltaTime;
        float t = Mathf.Clamp01(_remaining / FLASH_DURATION);

        _properties.SetFloat(FLASH_AMOUNT_ID, _flashAmount * t);
        _renderer.SetPropertyBlock(_properties);
    }
}
```

`material` is never read, so no clone appears. **But this answer depends on the
pipeline.** The same doc carries a warning.

> this is **not compatible with SRP Batcher**. Using this in the Universal Render
> Pipeline (URP), High Definition Render Pipeline (HDRP) or a custom render
> pipeline based on the Scriptable Render Pipeline (SRP) **will likely result in a
> drop in performance.**

**In URP the means used to avoid cloning is the slower one.** And the reason is in
the SRP Batcher's premise. That doc's advice runs the opposite way.

> use as few shader variants as possible. **You can still use as many different
> materials with the same shader as you want.**

> All material content now persists in GPU memory

What the SRP Batcher batches by is **shader variants, not materials.** So **having
several materials that use the same shader is fine** — that's the shape this
batcher assumes. Per-material values live in a GPU-side constant buffer, and
`MaterialPropertyBlock` breaks that premise.

| Pipeline | How to give per-object values | What to avoid |
| --- | --- | --- |
| Built-in | `MaterialPropertyBlock` | Multiplying materials by cloning via `material` |
| URP / HDRP | Separate materials (same shader) | `MaterialPropertyBlock` |

**The answer inverts.** In
[the post on render pipelines](/posts/render-pipelines-overview/) we saw that
built-in is "not something you choose but what's left when you assign nothing," and
whether that slot is empty changes **even the direction of optimization** here.

If you want three enemies to flash in different colors in URP, the three materials
from the previous section are the answer as they stand. Rather than going to
`MaterialPropertyBlock` to avoid cloning, **don't read `material` at all and make
three materials as assets to plug in.**

### Where Not to Use It

**Memorizing the definition as "a program that decides pixel colors."** This post's
definition has that shape, and it stops explaining when you meet a compute shader.
Unity's one line stays useful longer — **"A program that runs on the GPU."** What
it does is decided by **which stage it plugs into.**

**Believing a post-process shader has no vertex shader.** The Vulkan spec forbids
it. That's why there's a `Vert` function in a Shader Graph fullscreen pass or an
HLSL template, and having nothing to touch there isn't the same as it not being
there.

**Reading `Renderer.material` and forgetting the cleanup.** The docs say "It is
your responsibility to destroy the materials." If you need per-object values, look
at the pipeline first — built-in means `MaterialPropertyBlock`, URP and HDRP mean
separate materials as assets. If every object takes the same value,
`sharedMaterial`.

**Grabbing shader code without checking the render pipeline.** The split seen in
[the post on the custom shaders doc](/posts/unity-custom-shaders/). Shader code off
the internet failing to even compile is usually the built-in versus URP difference,
and knowing "what a shader is" and **using a shader that runs in my project** are
different problems.

## Wrapping Up

This is a post that brings sources. It hangs the transcription argument on the
National Institute of Korean Language's rules and the material explanation on
Unity's docs. The process by which `shader`'s \[ʃ\] before a vowel becomes '셰' is
right by the rule too — the same place `shake` becomes '셰이크'.

Three things snag. **The definition describes only the pixel shader.** "The color,
shading and lighting output to the screen" isn't what the vertex shader two
sections later does, and the compute shader the post deferred doesn't even output to
the screen. Unity's definition is one line —
**"A program that runs on the GPU."**

**"Unlike the vertex shader, it's used in post-processing and 2D" is wrong.** The
Vulkan spec **requires** a vertex shader or a mesh shader in a pipeline that
rasterizes. Post-processing's vertex shader does the small job of transforming three
vertices, and small isn't the same as absent.

**The grounds for the material transcription differ from the shader's.** `material`
has no \[ʃ\], so the previous section's rule has nowhere to apply. The conclusion is
the same and only the grounds differ, but because this post quoted the rule
precisely, that parenthetical stands out more.

And the Unity doc it cites is **version 4.6.** The translation is accurate, but the
current docs draw the line differently — they write the direction, that a material
**references** a shader. That one direction explains "one shader, many materials,"
and it's the place the post's recipe analogy was pointing at.

---

### References

- [Loanword transcription rules — National Institute of Korean Language](https://kornorms.korean.go.kr/regltn/regltnView.do?regltn_code=0003)
- [Shader objects — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/shader-objects.html)
- [Materials introduction — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/materials-introduction.html)
- [Renderer.material — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Renderer-material.html)
- [MaterialPropertyBlock — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/MaterialPropertyBlock.html)
- [SRP Batcher — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/SRPBatcher.html)
- [VkGraphicsPipelineCreateInfo — Vulkan Specification](https://docs.vulkan.org/refpages/latest/refpages/source/VkGraphicsPipelineCreateInfo.html)
- [Materials and Shaders — Unity 4.6 Manual (the edition the post cites)](https://docs.unity3d.com/460/Documentation/Manual/Materials.html)

The starting point for this post was [SuHong — 셰이더? 쉐이더? Shader 란 무엇인가](https://suhonglog.tistory.com/140)
(2024-11-17). I re-checked the transcription argument against the National Institute
of Korean Language's rules, and compared the scope of the definition and structure
explanations against the current Unity docs and the Vulkan specification.
