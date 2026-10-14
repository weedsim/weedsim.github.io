---
pubDatetime: 2026-10-14T21:30:00+09:00
title: "What Puts It in the Inspector Isn't Exposed, It's Show In Inspector"
lang: en
translationKey: shadergraph-exposed
featured: false
draft: false
tags:
  - Unity
  - Shader
  - Graphics
  - URP
  - Rendering
  - Editor
description: "Unity's own getting-started doc, clipped while studying shaders. Except the URL says 10.8 and what ships with the current Editor is 17.6. The property options table rotted the most in between — Exposed kept its name and changed its meaning, and Show In Inspector took over exposing the property."
---

**I clipped this while studying shaders.** And what I clipped isn't a blog post
but **Unity's own documentation** — the "First Shader Graph" page of the Shader
Graph package manual, in its Korean localization at that. I assumed official
docs would leave no gap to check against. It was the opposite.

The version is baked into the URL —
`docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/First-Shader-Graph.html`.

**That's `@10.8`.** The Shader Graph package the Unity 6.6 manual points at is
**17.6**. Seven majors apart. And this isn't a case of happening to grab one
page whose translation lagged — as confirmed below, **the Korean package docs
themselves stop at 10.8.** Search in Korean for a Shader Graph introduction and
you arrive at this version structurally.

The tutorial's procedure is mostly still alive. Create a graph, create a node,
connect it to Base Color, save, create a material. The order hasn't changed.
**What rotted most is the property options table at the very end.** Of its seven
rows, one kept its name and changed meaning, two moved to another page, and one
disappeared.

That one row is `Exposed`.

## Table of contents

## The Korean package docs stop at 10.8

First this has to be confirmed as something other than "only this page's
translation lagged". I opened a few URLs the same way.

| URL | Result |
|---|---|
| `/kr/Packages/com.unity.shadergraph@10.8/manual/index.html` | opens, in Korean |
| `/kr/Packages/com.unity.shadergraph@11.0/manual/index.html` | doesn't open |
| `/kr/Packages/com.unity.shadergraph@12.0/manual/index.html` | doesn't open |
| `/kr/Packages/com.unity.shadergraph@17.0/manual/index.html` | doesn't open |
| `/kr/Packages/com.unity.shadergraph@17.6/manual/index.html` | doesn't open |
| `/Packages/com.unity.shadergraph@11.0/manual/index.html` (English) | opens |

The last row is the control. **The English 11.0 opens.** So it isn't that the
version 11.0 doesn't exist; it's that the `/kr/` path doesn't exist from that
version on. The Korean 10.8 page still opens perfectly well — its first heading
is "셰이더 그래프 소개" (Shader Graph introduction) and its first sentence reads
like this.

> Shader Graph lets you build shaders visually.
>
> — [셰이더 그래프 소개 — Shader Graph 10.8 (Korean)](https://docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/index.html)

**That said, I found no document stating that Unity only translated through
10.8.** What I confirmed is just the six rows above. Click them yourself and you
should get the same results, and that's why this post takes 10.8 as its
baseline.

A page that **does** have a translation diverging from the English caught me
once before — a macro name was missing one letter. That record is in
[GPU Instancing Shaders: The Korean Manual Is Missing an A](/en/posts/gpu-instancing-shader/).
This one is a different kind. **It isn't a mistranslation but a frozen
version**, so instead of hunting for a wrong sentence you have to hunt for
**what changed in between**.

The current version is stated by the Unity 6.6 manual.

> The Shader Graph package adds a visual Shader editing tool to Unity.
>
> You can use this tool to create Shaders in a visual way instead of writing
> code.
>
> — [Shader Graph — Unity 6.6 manual (`com.unity.shadergraph@17.6`)](https://docs.unity3d.com/6000.6/Documentation/Manual/com.unity.shadergraph.html)

## What puts it in the Inspector isn't Exposed, it's Show In Inspector

The `Exposed` row of the 10.8 table reads like this.

> **Exposed** — Enabling this checkbox makes the property appear in the
> material's Inspector.
>
> — [첫 번째 셰이더 그래프 — Shader Graph 10.8 (Korean)](https://docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/First-Shader-Graph.html)

**A checkbox that makes it visible in the material Inspector.** Hold that
meaning and the name doesn't appear in the 17.6 tutorial. The option it tells
you to turn on in that same place is a different one.

> In the Blackboard, select Add (+), and then select Color.
>
> Make sure to activate the Show In Inspector option.
>
> — [First Shader Graph — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/First-Shader-Graph.html)

The description of `Show In Inspector` lives on the property types page.

> **Show In Inspector** — Displays the property in the material Inspector when
> enabled.
>
> — [Property Types — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Property-Types.html)

**10.8's `Exposed` description moved into this row verbatim.** Only the name
changed. So did the name `Exposed` disappear? No — it's still there, and **its
meaning is different.**

> **Exposed** — Enable this setting to make the property available for you to
> edit via the C# API.
>
> — [Blackboard — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Blackboard.html)

It's the setting that makes the property editable via the `C# API`, and the same
page says it is **enabled by default**. Memorize "turn Exposed on to show it in
the Inspector" from the 10.8 doc and in the current Editor you end up **staring
at an already-enabled checkbox that means something else, unable to find why it
isn't showing in the Inspector.**

| Option name | What 10.8 says it means | What 17.6 says it means |
|---|---|---|
| `Exposed` | "makes the property appear in the material's Inspector" | "available for you to edit via the C# API" |
| `Show In Inspector` | no such option | "Displays the property in the material Inspector" |
| `Reference` | "the name of the property as shown in C# scripts" | "the internal identifier used by the shader" |
| `Default` | "the property's default value" | `Default Value` — the initial value for new material instances |

`Reference` shifted subtly too. 10.8 called it **"the name of the property as
shown in C# scripts"**, and 17.6 calls it **"the internal identifier used by the
shader for this property"**. From the caller's side it's the same string, but
17.6 puts **shader-internal identifier** ahead of "a name for C#". So a
constraint came along with it.

> If the Reference Name contains any characters that HLSL does not support, the
> Editor replaces those characters with underscores.
>
> — [Blackboard — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Blackboard.html)

**Characters HLSL can't take get replaced with underscores by the Editor.** That
means a string you wrote down to use from C# may not survive intact, and it's a
sentence the 10.8 table doesn't have.

## The name Exposed disagrees even between two current pages

Here it gets one layer stranger. The two quotes above are **two different pages
inside the same 17.6 documentation.** And their option lists don't match.

| Page | What's in the list |
|---|---|
| `Blackboard` (17.6) | `Name` · `Reference` · `Default` · `Precision` · `Exposed` — five rows |
| `Property Types` (17.6) | `Name` · `Reference` · `Default Value` · `Precision` · `Scope` · `Show In Inspector` · `Promote to final Shader` · `Disable connector` · `Preview Value` · `Read Only` · `Custom Attributes` · `Use Custom Binding` |

The `Blackboard` page **doesn't have** `Show In Inspector` or `Scope`, and the
`Property Types` page **doesn't have** `Exposed`. Yet the tutorial says to turn
on `Show In Inspector`. Three pages are describing the same UI under two naming
schemes.

**Which one is the current Editor's label can't be settled from the docs
alone.** The docs write it differently from each other, and I'm not writing this
with that UI open. What's confirmed goes this far — **the tutorial body and the
property types page agree on `Show In Inspector`, and only the Blackboard page
still says `Exposed`.** Whether both names sit on one screen, or only one does,
has to be seen in the Editor.

The practical way to handle this is **not to memorize by name**. Make one
property, save, open the material Inspector, and check whether it shows. Whatever
the checkbox is called, that one round trip answers it.

## Mode moved pages, and Hybrid Instanced became one value of Scope

The other three rows of the 10.8 table didn't stay put either. `Mode` vanished
from "First Shader Graph" and went to the property types page. The content is
nearly the same, with one extra sentence attached.

> **Color** — Defines a Color value.
>
> **Default** — Allows to select a standard sRGB color.
>
> **HDR** — Allows to select an HDR color and sets its intensity from -10 to 10
> exposure stops.
>
> In versions prior to 10.0, Shader Graph didn't correct HDR colors for the
> project colorspace.
>
> — [Property Types — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Property-Types.html)

Neither the `-10 to 10 exposure stops` range nor the note that **HDR colors
weren't corrected for the project colorspace before 10.0** is in the 10.8 table.
The clipping being 10.8, it's a doc from after that fix landed — but the sentence
wasn't written down.

`Hybrid Instanced` moved further. 10.8 writes it like this.

> **Hybrid Instanced** — An experimental feature that lets this property be
> instanced when you use the Hybrid DOTS renderer.
>
> — [첫 번째 셰이더 그래프 — Shader Graph 10.8 (Korean)](https://docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/First-Shader-Graph.html)

17.6 has **no checkbox by that name.** Instead an enum called `Scope` appeared,
and it became one of the values.

> **Scope** — Specifies where and how the property is edited across materials.
>
> **Global** — Makes the property editable at a global level, through a C#
> script only, for all materials that use it.
>
> **Per Material** — Makes the property independently editable per material,
> either through a C# script, or in the Inspector UI
>
> **Hybrid Per Instance** — Has the same effect as Per Material, unless you're
> using DOTS instancing.
>
> — [Property Types — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Property-Types.html)

**One checkbox turned into a three-value choice.** And `Global`'s description
matters — "through a C# script only". The 10.8 table had no concept at all of a
property that applies globally across every material.

`Precision` got its values spelled out too.

> **Precision** — Sets the numeric precision for the property's data type.
>
> **Inherit** — Uses the precision defined by the graph or parent context.
>
> **Single** — Uses single-precision (float) for maximum accuracy.
>
> **Half** — Uses half-precision to reduce memory and improve performance.
>
> **Use Graph Precision** — Uses the precision mode set in the graph settings.
>
> — [Property Types — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Property-Types.html)

10.8 only wrote `Precision` as "the property's default precision" and handed off
to a separate doc via a link. The four values entering the table is 17.6.

| The seven rows of 10.8's table | In 17.6 |
|---|---|
| property button (right-click Rename/Delete) | becomes the `Name` row — rename by double-clicking the name |
| `Exposed` (Inspector exposure) | name stays, **meaning moves to the C# API** |
| `Reference` (the C# name) | description becomes **shader-internal identifier**, HLSL constraint added |
| `Default` | `Default Value` — the initial value for new material instances |
| `Mode` | **moved to the property types page**, HDR range and colorspace note added |
| `Precision` | four values (`Inherit`/`Single`/`Half`/`Use Graph Precision`) spelled out |
| `Hybrid Instanced` (experimental) | **absorbed as `Scope`'s `Hybrid Per Instance` value** |
| — | new options such as `Show In Inspector`, `Read Only`, `Custom Attributes` |

## The ways to create a node went from two to one

Things changed on the procedure side as well. 10.8 writes **two** ways to open
the Create Node menu — right-click and pick **Create Node** from the context
menu, or press the spacebar.

17.6 writes only the spacebar.

> Select the Shader Graph window's workspace and press the Spacebar.
>
> In the Input > Basic category, double-click on Color.
>
> Drag it to the Base Color block port of the Fragment section of the master
> stack.
>
> — [First Shader Graph — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/First-Shader-Graph.html)

**It isn't that right-click is gone, it's that the 17.6 tutorial doesn't write
that road.** In 17.6 right-click appears as the action for creating the asset in
the Project window. And three things got more specific — the node's location as
**`Input > Basic`**, the selection method as a **double-click** (10.8 said click,
or highlight and press Enter), and the connection target as **the Base Color
block of the Fragment section**.

The menu path for creating the asset differs too.

| Step | 10.8 | 17.6 |
|---|---|---|
| asset creation menu | **Create > Shaders** | **Create > Shader Graph > URP > Lit** |
| opening Create Node | right-click or spacebar | spacebar |
| finding the Color node | type "color" in the search box | search, then double-click in `Input > Basic` |
| connection target | the Base Color block of the fragment stack | the Base Color block port of the Fragment section |
| adding a property | Blackboard **Add (+)** | Blackboard **Add (+)** — same |

10.8 explains that "**Blank Shader Graph** creates a shader graph with no active
target or Block node selected" and uses **Universal > Lit** as its example.
The 17.6 tutorial has you press `Create > Shader Graph > URP > Lit` from the
start. **Instead of explaining the road of choosing a target in a blank graph,
the text moved toward having you press a preset with the pipeline baked in.**

## What didn't change — saving is still manual

Not everything changed. This sentence from 10.8 still holds.

> Shader graphs are currently not saved automatically.
>
> — [첫 번째 셰이더 그래프 — Shader Graph 10.8 (Korean)](https://docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/First-Shader-Graph.html)

17.6 writes the same two ways to save.

> Click the Save Asset button in the top left corner of the window.
>
> If Unity detects any unsaved changes, a dialog appears, and asks if you want
> to save those changes.
>
> — [First Shader Graph — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/First-Shader-Graph.html)

**The `Save Asset` button and the dialog on close.** Seven majors crossed and
this part is nearly identical down to the sentence structure. In a post counting
what changed, **counting what didn't change matters too** — otherwise it slides
into "nothing in the 10.8 doc can be trusted".

The procedure of creating a material and picking the shader from the Inspector's
`Shader` dropdown is unchanged as well. It's the part 10.8 calls "the same as
for a regular shader", and the case where a shader **doesn't show up** in that
dropdown is written up in
[The Lite Version Doesn't Show Up in the Shader List](/en/posts/liltoon-setup/).

## The additional-tutorial links all land on the blog's front page

Six blog links sit at the end of the 10.8 page. All on the
`blogs.unity3d.com` domain. I clicked two.

| Link in the clipping | Result |
|---|---|
| `blogs.unity3d.com/2018/10/05/art-that-moves-...` | **302 → `https://unity.com/blog`** |
| `blogs.unity3d.com/2018/02/27/introduction-to-shader-graph-...` | **302 → `https://unity.com/blog`** |

**They don't go to the article, they go to the blog listing's front page.** The
domain moved without keeping the individual article paths alive. It's the kind of
dead link that looks alive until you open it — a 200 comes back, not a 404.

The same place in 17.6 holds **four**. "Art That Moves: Creating Animated
Materials with Shader Graph", "Custom Lighting in Shader Graph: Expanding Your
Graphs in 2019", Shader Graph video tutorials, and the Shader Graph forum. Four
of 10.8's six dropped out of the list.

## Two docs write differently on whether it works in Built-in

One more thing I checked about this package. On **whether Shader Graph works in
the Built-in render pipeline**, two current doc pages write it differently.

The Shader Graph package introduction page counts only two.

> Currently, both the High Definition Rendering Pipeline and the Universal
> Rendering Pipeline support Shader Graph.
>
> — [Shader Graph — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/com.unity.shadergraph.html)

The render pipeline feature comparison table says "Yes" for all three.

> Shader Graph | Yes | Yes | Yes
>
> — [Render pipeline feature comparison — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/render-pipelines-feature-comparison.html)

The column headers are `Built-in Render Pipeline` · `URP` · `HDRP`, and in the
same table the Surface Shaders row is "Yes" for Built-in only, "No" for URP and
HDRP. So the comparison table says **Shader Graph works in Built-in**, and the
package introduction page **counts only URP and HDRP.**

In [The Table on Unity's Custom Shaders Page Is a Fork, Not an Index](/en/posts/unity-custom-shaders/)
I read that same compatibility table against 6000.2 and wrote that "Shader Graph
works in Built-in too". That table is **no longer in `Shaders.html` as of
6000.6.** It moved to `render-pipelines-feature-comparison.html`, and the values
in the moved table are the same. The page it moved to carries one new premise,
though.

> Important: The Built-In Render Pipeline is deprecated and will be made
> obsolete in a future release.
>
> — [Render pipeline feature comparison — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/render-pipelines-feature-comparison.html)

The same page adds that it **remains supported, bug fixes and maintenance
included, through the full Unity 6.7 LTS lifecycle**. So the answer "it works in
Built-in too" still holds, but **the reasons to build a new graph around
Built-in have shrunk.** What Built-in even is — the result of leaving the
pipeline asset field empty — is written up in
[A Render Pipeline Is an Asset, and Built-In Is What's Left When the Field Is Empty](/en/posts/render-pipelines-overview/).

## Where and why you'd use it

Shader Graph is the tool for making shaders without code, and the
**property** this post digs into is **the window for adjusting that shader from
outside, later.** Let an artist touch it in the material Inspector, change it
from C# at runtime, or both. Which one you want decides which option to turn on,
and that option's name differs between 10.8 and 17.6 — which is what this post
is about.

### A working example

The graph side is a picture and can't be carried into code. The side that can is
**the part that touches that property from C#**, and the string used there is
exactly the `Reference` name. Below is that round trip as one component.

```csharp file="Scripts/Rendering/ShaderGraphColorDriver.cs"
using UnityEngine;

[RequireComponent(typeof(Renderer))]
public class ShaderGraphColorDriver : MonoBehaviour
{
    private const float MinDuration = 0.01f;

    [Header("Property")]
    [Tooltip("The Blackboard Reference name, verbatim. URP Lit uses _BaseColor")]
    [SerializeField]
    private string _colorReference = "_BaseColor";

    [Header("Colors")]
    [Tooltip("Start color")]
    [SerializeField]
    private Color _from = Color.white;

    [Tooltip("End color")]
    [SerializeField]
    private Color _to = Color.red;

    [Tooltip("Seconds for one round trip")]
    [Min(MinDuration)]
    [SerializeField]
    private float _duration = 2f;

    [Header("Diagnostics")]
    [Tooltip("Warns once when the property can't be found")]
    [SerializeField]
    private bool _warnOnMissing = true;

    // The docs say it's "better to get the identifiers of the properties you
    // need just once". Don't pass a string every frame.
    private int _colorId;

    private Material _instanceMaterial;
    private bool _hasProperty;

    private void Awake()
    {
        if (!TryGetComponent(out Renderer meshRenderer))
        {
            Debug.LogError("There is no Renderer attached.", this);
            return;
        }

        // Reading material creates an instance. The docs say modifying
        // sharedMaterial also changes settings stored in the project.
        _instanceMaterial = meshRenderer.material;

        _colorId = Shader.PropertyToID(_colorReference);
        _hasProperty = _instanceMaterial.HasProperty(_colorId);

        if (!_hasProperty && _warnOnMissing)
        {
            // If Reference holds characters HLSL can't take, the Editor swaps
            // them for underscores. It may differ from what you typed.
            Debug.LogWarning(
                $"The material has no '{_colorReference}' property.", this);
        }
    }

    private void OnDestroy()
    {
        // The instance Renderer.material created is not cleaned up for you.
        if (_instanceMaterial != null)
        {
            Destroy(_instanceMaterial);
        }
    }

    private void Update()
    {
        if (!_hasProperty) { return; }

        float t = Mathf.PingPong(Time.time / _duration, 1f);

        // Use the nameID overload. The string overload exists, but for a
        // per-frame call the identifier is the right one.
        _instanceMaterial.SetColor(_colorId, Color.Lerp(_from, _to, t));
    }
}
```

Three things worth pointing out.

**One — `_colorReference` defaults to `_BaseColor`.** The docs write the
per-pipeline names out directly.

> Property name. For example, "_Color" in Built-in Render Pipeline,
> "_BaseColor" in URP.
>
> — [Material.SetColor](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Material.SetColor.html)

For a property made in Shader Graph, **the string written in the Blackboard's
`Reference` field** goes in this slot. Turning `Show In Inspector` off doesn't
block this road — that's exactly why Inspector exposure and C# access split into
separate options.

**Two — the ID is fetched once in `Awake`.** The docs give the reason.

> Using property identifiers is more efficient than passing strings to all
> material property functions.
>
> Each name of shader property (for example, _MainTex or _Color) is assigned an
> unique integer number in Unity, that stays the same for the whole game.
>
> The numbers will not be the same between different runs of the game or
> between machines, so do not store them or send them over network.
>
> — [Shader.PropertyToID](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Shader.PropertyToID.html)

**Fixed within one run, different between runs and between machines.** So
fetching it in `Awake` is right, and putting it in a save file or a network
packet is what the docs tell you not to do.

**Three — the material instance gets cleaned up by hand.** The
`Renderer.sharedMaterial` doc states why it tells you to use `material`.

> Modifying sharedMaterial will change the appearance of all objects using this
> material, and change material settings that are stored in the project too.
>
> It is not recommended to modify materials returned by sharedMaterial.
>
> — [Renderer.sharedMaterial](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Renderer-sharedMaterial.html)

Take it via `material` and an instance is created, and that instance's lifetime
is my responsibility. Which sentence in the docs records that responsibility is
pinned down in
[The Definition Describes a Pixel Shader, Not a Shader](/en/posts/what-is-a-shader/).

Finally, `SetColor` carries a colorspace rule. It's relevant when you set a
property's `Mode` to `HDR`.

> A material property is considered to be in gamma space if either of the
> following are true:
>
> The property is declared as a color and has the [HDR] attribute
>
> If this method's target property is in gamma space and the project is in
> linear space, value is converted to linear space before being stored.
>
> — [Material.SetColor](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Material.SetColor.html)

**A color property with `[HDR]` is treated as being in gamma space, and if the
project is linear the value you pass is converted to linear before storage.** If
a color picked in the Inspector looks different from one set via C#, look at this
conversion first. For reference, **what happens when you `SetColor` a property
that doesn't exist is something the docs don't say** — which is why the example
filters with `HasProperty` first.

### How to choose

| What you want | What to turn on (as of 17.6) | The sentence behind it |
|---|---|---|
| expose it in the material Inspector | `Show In Inspector` | "Displays the property in the material Inspector" |
| edit it via the C# API | `Exposed` (Blackboard page) | "available for you to edit via the C# API" |
| a separate value per material | `Scope` = `Per Material` | "independently editable per material" |
| one value for all (C# only) | `Scope` = `Global` | "through a C# script only" |
| DOTS instancing | `Scope` = `Hybrid Per Instance` | "unless you're using DOTS instancing" |
| make it uneditable in the Inspector | `Read Only` | "adding the PerRendererData attribute" |
| leave precision to the graph | `Precision` = `Use Graph Precision` | "the precision mode set in the graph settings" |
| change a color from C# | the `Reference` name + `Shader.PropertyToID` | "more efficient than passing strings" |

When choosing which doc to read, I'd go in this order.

1. **Look at the version in the URL first.** `@10.8` is seven majors from the
   current Editor. That's the only version the Korean package docs have.
2. **Open the current English page alongside it.** Drop the `/kr/` and change
   the version to `@17.6`. The procedure is easy to compare; the option names
   you absolutely have to compare.
3. **Confirm option names in the Editor.** Two current doc pages already write
   them differently. Making one property and round-tripping to the Inspector is
   faster.
4. **For the name you'll use from C#, look at the `Reference` field.** Not the
   display name, and it may have been turned into underscores by the HLSL
   constraint.

### Where not to use it

- **Memorizing the option names from the 10.8 doc.** `Exposed` kept only its
  name; the meaning moved to the C# API.
- **Hunting for `Exposed` because it isn't showing in the Inspector.** As of
  17.6 the thing doing that job is `Show In Inspector`.
- **Hunting for a `Hybrid Instanced` checkbox.** It got absorbed as one value
  of `Scope`.
- **Looking for `Mode` on the "First Shader Graph" page.** It moved to the
  property types page.
- **Hardcoding the string you typed into `Reference` as a C# constant.** The
  docs say the Editor swaps characters HLSL can't take for underscores.
- **Storing a `Shader.PropertyToID` result or sending it over the network.**
  The docs say it isn't the same between runs or machines.
- **Modifying `sharedMaterial` at runtime.** The docs say it also changes
  settings stored in the project.
- **Creating an instance with `Renderer.material` and not cleaning it up.** The
  lifetime is mine.
- **Calling `SetColor` on a property that doesn't exist.** The docs don't cover
  that case, so check with `HasProperty` first.
- **Trusting the clipping's `blogs.unity3d.com` links.** They 302 to the blog's
  front page rather than returning a 404.
- **Building a new graph around Built-in.** The comparison table says "Yes" but
  the same page marks Built-in as deprecated.

## Summary

- The clipping is **official documentation, and it's `@10.8`**, while the
  package Unity 6.6 points at is **17.6**.
- Through the `/kr/` path **only 10.8 opened.** 11.0, 12.0, 17.0 and 17.6
  didn't, and the English 11.0 did. I found no doc stating the translation scope.
- **`Exposed` kept only its name and changed meaning.** 10.8 says "makes the
  property appear in the material's Inspector"; 17.6 says **"available for you
  to edit via the C# API"**.
- Inspector exposure was taken over by **`Show In Inspector`** — "Displays the
  property in the material Inspector when enabled."
- **It disagrees even inside the current docs.** The Blackboard page has
  `Exposed` and no `Show In Inspector`; the property types page is the reverse.
  Which is the Editor's label **can't be settled from the docs.**
- `Reference` went from "the name shown in C# scripts" to **"the internal
  identifier used by the shader"**, and gained the constraint that unsupported
  HLSL characters become underscores.
- `Mode` **moved to the property types page**, and `Hybrid Instanced` was
  **absorbed into `Scope` as `Hybrid Per Instance`**. `Precision` got its four
  values spelled out.
- The asset creation path changed from **Create > Shaders to Create > Shader
  Graph > URP > Lit**, and the ways to open Create Node went **from two down to
  the spacebar alone**.
- **Saving is still manual.** The `Save Asset` button and the dialog on close,
  both unchanged.
- Of 10.8's six blog links, the two I clicked **302 to `unity.com/blog`**.
  It isn't a 404, so it's easy to pass over without noticing it's dead.
- On whether Shader Graph works in Built-in, **the package introduction page
  counts only URP and HDRP while the feature comparison table says "Yes" for
  all three.** That comparison table moved out of `Shaders.html`, and
  **Built-in is marked deprecated**.
- The string you use from C# is the `Reference` name, and URP Lit's base color
  is **`_BaseColor`**. Fetch the ID once in `Awake`, and **don't store it or
  send it.**

---

### References

- [첫 번째 셰이더 그래프 — Shader Graph 10.8 (Korean)](https://docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/First-Shader-Graph.html)
- [셰이더 그래프 소개 — Shader Graph 10.8 (Korean)](https://docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/index.html)
- [First Shader Graph — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/First-Shader-Graph.html)
- [Blackboard — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Blackboard.html)
- [Property Types — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Property-Types.html)
- [Get started with Shader Graph — Shader Graph 17.6](https://docs.unity3d.com/Packages/com.unity.shadergraph@17.6/manual/Getting-Started.html)
- [About Shader Graph — Shader Graph 11.0 (English control)](https://docs.unity3d.com/Packages/com.unity.shadergraph@11.0/manual/index.html)
- [Shader Graph — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/com.unity.shadergraph.html)
- [Custom shaders — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/Shaders.html)
- [Render pipeline feature comparison — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/render-pipelines-feature-comparison.html)
- [Material.SetColor — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Material.SetColor.html)
- [Shader.PropertyToID — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Shader.PropertyToID.html)
- [Renderer.sharedMaterial — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Renderer-sharedMaterial.html)

The clipping is the Korean localization of Unity's own
[첫 번째 셰이더 그래프 | Shader Graph | 10.8.0](https://docs.unity3d.com/kr/Packages/com.unity.shadergraph@10.8/manual/First-Shader-Graph.html),
and the quotes from it are my translations. I assumed official docs would leave
nothing to check against, but **the version baked into the URL was itself the
thing to check.** The procedure is alive and the saving is unchanged, while
almost every name and location in the property options table has moved. That the
Korean package docs stop at 10.8 is the last thing this post confirmed.
