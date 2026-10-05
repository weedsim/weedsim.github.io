---
pubDatetime: 2026-10-05T18:05:00+09:00
title: "An Outline Is Duplicated Vertices, Not a Shader"
lang: en
translationKey: ugui-outline-component
featured: false
draft: false
tags:
  - Unity
  - C#
  - UI
  - UGUI
description: "I clipped the Outline component doc and it's the Unity 5.3 edition. Yet the wording is nearly identical to the current page. It wasn't updated — which is why Use Graphic Alpha's description still contradicts the property's own name."
---

I clipped this **while looking for how to put an outline on text.** Earlier I
[went through the TextMeshPro Inspector](/posts/tmp-inspector-settings/) and
settled the text design, and what snagged next was **drawing a thick border
around the glyphs.** A component literally named `Outline` shows up right in the
Add Component menu, so that's where I started looking. Unity's manual page for it
is this clipping.

To put the conclusion first: **this component is the worst fit for "thick."**
Why that is becomes the content of this post.

The page is short. Two sentences of description, three properties. But the URL in
`source` reads `docs.unity3d.com/kr/530/`. **It's the Unity 5.3 edition — a
version from late 2015.**

Usually at that point "it's different now" becomes the body of the post. Not this
time. Open the current page and **the sentences are nearly the same.** For ten
years this page has stayed put.

So what snagged then still snags. It's the last of the three properties.

> **Use Graphic Alpha** — 효과 컬러에 그래픽 컬러를 중첩(multiply)시킵니다.
>
> (Multiplies the color of the graphic onto the color of the effect.)

It says it multiplies the color. Yet the property's name is `Use Graphic
**Alpha**`. And the API reference describes the same property this way:

> Should the shadow inherit the **alpha** from the graphic?

**The name and the API say alpha; the manual says color.** And there's one more
thing: that sentence doesn't belong to the `Outline` page alone.

## Table of contents

## Ten Years Old and the Wording Barely Moved

Let's settle the edition question first. The clipping's description sentence:

> Outline 컴포넌트는 텍스트와 이미지같은 그래픽 컴포넌트에 간단한 외곽선 효과를
> 추가합니다. 그래픽 컴포넌트와 동일한 게임 오브젝트에 있어야 합니다.
>
> (The Outline component adds a simple outline effect to graphic components such
> as Text or Image. It must be on the same GameObject as the graphic component.)

The current English page:

> The Outline component adds a simple outline effect to graphic components such
> as Text or Image. It must be on the same GameObject as the graphic component.

**Sentence for sentence, they correspond.** The properties table matches too.

| Property | Clipping (5.3 Korean) | Current English |
| --- | --- | --- |
| Effect Color | 외곽선 컬러입니다 | The color of the outline |
| Effect Distance | 외곽선 효과의 수평 및 수직 거리입니다 | The distance of the outline effect horizontally and vertically |
| Use Graphic Alpha | 효과 컬러에 그래픽 컬러를 중첩(multiply)시킵니다 | Multiplies the color of the graphic onto the color of the effect |

**The translation is accurate.** I've covered mistranslations in the Korean manual
a few times on this blog; this isn't one of those. The Korean carried the English
across correctly, and **the sentence it carried is the problem.** That's a
different place to look than when hunting mistranslations.

What changed isn't the wording but **where the page lives.** The clipping's URL is
the engine manual (`docs.unity3d.com/kr/530/Manual/`), while the same page today
sits at `docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/`. UGUI moved from
being built into the engine to **being a package.** Opening the old path redirects
into the package docs.

The menu path for adding the component changed as well. An attribute carries it.

| Package version | `AddComponentMenu` |
| --- | --- |
| `com.unity.ugui@1.0` | `"UI/Effects/Outline"` |
| `com.unity.ugui@2.0` | `"UI (Canvas)/Effects/Outline"` |

**`UI` became `UI (Canvas)`.** That's the consequence of UI Toolkit arriving and
canvas-based UI needing to be named apart. Follow a 2015 write-up to
**Add Component > UI > Effects** and that item isn't there.

## Outline's Properties All Belong to Shadow

Open the API reference and one declaration line explains the whole page.

```csharp
[AddComponentMenu("UI (Canvas)/Effects/Outline", 81)]
public class Outline : Shadow, IMeshModifier
```

**`Outline` inherits from `Shadow`.** The full inheritance chain:

```text
object → Object → Component → Behaviour → MonoBehaviour
       → UIBehaviour → BaseMeshEffect → Shadow → Outline
```

Which makes the reference's "Inherited Members" list the interesting part. Six
members come straight from `Shadow`.

| Inherited member | Kind |
| --- | --- |
| `effectColor` | property |
| `effectDistance` | property |
| `useGraphicAlpha` | property |
| `ApplyShadow(...)` | method |
| `ApplyShadowZeroAlloc(...)` | method |
| `OnValidate()` | method |

**All three properties the clipping lists are in there.** What `Outline` owns is a
constructor and one `ModifyMesh(VertexHelper)` override.

That changes how to read the docs. The fields visible in the `Outline` Inspector
**weren't designed for an outline.** They're fields built for a shadow being
reused, which is why the API reference's descriptions are all written in terms of
"shadow."

> **effectDistance** — How far is the shadow from the graphic.

It's a property of the `Outline` component and the description says "the shadow."
Not an error — **inheritance is why that description sits in that place.**

## So Two Pages Share a Description, and the Shared Line Is Wrong

Once you know about the inheritance there's a reason to put the two manual pages
side by side. Here's the first sentence of the `Shadow` page at the same package
version (`@2.0`):

> The **Shadow** component adds a simple **outline** effect to graphic
> components such as Text or Image.

**The Shadow page introduces itself as an outline effect.** It looks like the
`Outline` page's first sentence with only the component name swapped in.

And overlaying the properties tables gives this:

| Property | `Outline` page | `Shadow` page |
| --- | --- | --- |
| Effect Color | The color of the outline | The color of the shadow |
| Effect Distance | The distance of the outline effect horizontally and vertically | The offset of the shadow expressed as a vector |
| Use Graphic Alpha | Multiplies the color of the graphic onto the color of the effect | Multiplies the color of the graphic onto the color of the effect |

The top two rows were rewritten to fit each page, and **only the last row is
identical down to the character.** That one line is the one that contradicts both
the name and the API.

Summed up, there are three descriptions of the same property, and two point one
way.

| Source | What it says is multiplied |
| --- | --- |
| Property name (`useGraphicAlpha`) | alpha |
| API reference | alpha ("inherit the alpha from the graphic") |
| Both manual pages | color ("Multiplies the color of the graphic") |

**Two to one for alpha.** I couldn't read the component source, so I won't call
it settled, but the weight of evidence sits on one side. A property name is API
surface — change it and compatibility breaks. A manual sentence can change and
nothing breaks. **When the two disagree, the name is the more likely survivor.**

In practice, read it this way. When the graphic is semi-transparent but the
outline stays opaque and looks wrong, that's the box to turn on. A UI that fades a
graphic out while the outline refuses to go with it is the typical symptom.

### Effect Distance Is Described Differently on the Two Pages

The second row above isn't a throwaway either. It's the same inherited property
with two descriptions, and **the two carry different information.**

The `Outline` side says "horizontal and vertical **distance**." The `Shadow` side
says "**the offset expressed as a vector**." The actual type is `Vector2`, so
**negatives go in.** Read it only as a distance and you won't think to try one.

For a shadow that's decisive. `(2, -2)` is a bottom-right shadow and `(-2, 2)` a
top-left one. For an outline the sign appears not to change the result, but that's
because an outline **uses all the sign combinations.** That's the next section.

## An Outline Is Duplicated Vertices, Not a Shader

This is the most important part of the page, and the manual doesn't have a line
about it. A method description inherited from `Shadow` reveals the mechanism.

> **ApplyShadow** — **Duplicate vertices** from start to end and turn them into
> shadows with the given offset.

**It duplicates vertices.** And since the only code `Outline` owns is the
`ModifyMesh` override, the outline is **built out of that duplication.** The
parent class states its nature too.

> **BaseMeshEffect** — Base class for effects that modify the generated Mesh.

> **ModifyMesh(Mesh)** — called when the Graphic is populating the mesh.

**Not the shader stage but the mesh generation stage.** In
[the post on what a shader is](/posts/what-is-a-shader/) I settled on a shader
being a program that runs on the GPU. `Outline` never gets that far. It grows the
vertex list on the CPU and sends more triangles to the GPU.

Where the cost lands splits accordingly. In
[the post on the graphics pipeline](/posts/graphics-pipeline/) I noted that more
vertices means the vertex shader runs that many more times; here **the CPU is what
grows that vertex count before sending it.** One glyph of text is one quad, so it
scales directly with character count.

The attribute on the class is worth reading too.

```csharp
[ExecuteAlways]
public abstract class BaseMeshEffect : UIBehaviour, IMeshModifier
```

`[ExecuteAlways]`. That's why the effect shows without pressing play, and it's the
attribute the docs named as the recommended replacement for
`[ExecuteInEditMode]` in [the post on attributes](/posts/unity-attributes/). The
convenience of **what you see in the editor being what the build produces** comes
from here.

### How Many Copies Isn't in the Docs

To be straight about it, **the number of copies isn't documented.**
`ApplyShadow` only says it duplicates vertices, and how many times
`Outline.ModifyMesh` calls it isn't written in the API reference.

That's as far as the docs go. There is one inference that follows from the
structure, though. `effectDistance` is **a single `Vector2`**, and an outline is
visible on all sides. One offset copy only thickens one direction — that's
`Shadow`. Getting all sides out of one `Vector2` requires **sign combinations.**

| Offset | Corner it fills |
| --- | --- |
| `(+x, +y)` | top right |
| `(+x, -y)` | bottom right |
| `(-x, +y)` | top left |
| `(-x, -y)` | bottom left |

Four copies plus the original makes **five times.** That's an inference; what the
docs guarantee stops at "it duplicates." If you need the real number, toggling
`Outline` on and off and comparing vertex counts in the Profiler's UI module is
the accurate route.

What matters isn't the number but the **order of magnitude.** The fact that one
glyph becomes more than one quad doesn't change. That's where the burden of
putting `Outline` on text with many characters comes from.

## TMP's Outline Lives in the Material

There's a way to make the same effect at a different layer. As
[the post on the TextMeshPro Inspector](/posts/tmp-inspector-settings/) showed,
TMP's outline is **a material property, not a component.** The shader property
group is named `Outline` outright.

> **Outline** — Adds a colored and/or textured outline to the text.

That's possible because SDF font assets carry distance information.

> SDF font assets contain contour distance information.

**Knowing the distance to the contour lets the shader compute the outline.** No
need to grow vertices.

Side by side, the two split like this.

| | UGUI `Outline` component | TMP material's `Outline` |
| --- | --- | --- |
| Layer it lives in | Mesh generation (CPU) | Shader (GPU) |
| Vertex count | Grows | Unchanged |
| Scope | That one GameObject | **Everything using that material** |
| Target | Any `Graphic` — `Text`, `Image`, … | TMP text |

The last two rows are the trade. TMP's side is cheaper but **its scope is the
material.** Raise `Outline Width` on the material to give one heading an outline
and every text using that material changes with it. That's the spot the earlier
post flagged, and the fix is keeping separate material presets.

And **the `Outline` component attaches to `Image` too.** The TMP material route is
text only. If you need a border around a sprite, the options narrow again.

## Where and Why You'd Use It

### Outlining Only the Selected Row

Giving the selected item in a list a border. When the target is an `Image` and
there are few of them, `Outline` is the right place. Typing the field as `Shadow`
lets one piece of code handle both `Outline` and `Shadow` — the practical payoff
of the inheritance.

```csharp
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Graphic))]
public class SelectionOutline : MonoBehaviour
{
    private const float DEFAULT_THICKNESS = 2f;

    [Header("Outline")]
    // Outline inherits Shadow, so it fits in a Shadow-typed field.
    [SerializeField, Tooltip("The Outline component on this GameObject")]
    private Shadow _effect;

    [SerializeField, Tooltip("Border color when selected")]
    private Color _selectedColor = Color.white;

    [SerializeField, Range(0f, 8f), Tooltip("Border thickness")]
    private float _thickness = DEFAULT_THICKNESS;

    private void Awake()
    {
        // Outline must be on the same GameObject as the graphic. The docs require it.
        if (_effect == null && !TryGetComponent(out _effect))
        {
            return;
        }

        _effect.effectColor = _selectedColor;

        // It's a Vector2. An offset, not a distance, so it carries a sign.
        _effect.effectDistance = new Vector2(_thickness, _thickness);

        // Let the border fade along with a semi-transparent graphic.
        _effect.useGraphicAlpha = true;
    }

    public void SetSelected(bool selected)
    {
        if (_effect == null)
        {
            return;
        }

        // Disable the component and ModifyMesh stops running, so the copies go away.
        _effect.enabled = selected;
    }
}
```

Disabling via `enabled` in `SetSelected` is the point. Hide it by taking the
color's alpha to zero and **the vertices stay.** Vertices you can't see still cost.

### Counting the Effects Piled on a Canvas

The problem is usually not one of them but **how many have piled up.** When
several people build prefabs, you end up in a state where every text has an
`Outline`. Since `BaseMeshEffect` is a public abstract class, you can sweep them
at once.

```csharp
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class MeshEffectAudit : MonoBehaviour
{
    private const int WARN_THRESHOLD = 10;

    [Header("Scope")]
    [SerializeField, Tooltip("Root to inspect. Empty means everything under this object")]
    private Transform _root;

    private void Start()
    {
        Transform scope = _root != null ? _root : transform;

        // Include inactive objects. Many panels sit off until they're shown.
        BaseMeshEffect[] effects = scope.GetComponentsInChildren<BaseMeshEffect>(true);
        Dictionary<string, int> counts = new Dictionary<string, int>();

        foreach (BaseMeshEffect effect in effects)
        {
            // Outline is a child of Shadow, so GetType() is what separates them.
            string typeName = effect.GetType().Name;
            counts.TryGetValue(typeName, out int count);
            counts[typeName] = count + 1;

            if (effect is Outline)
            {
                Debug.Log($"outline on {effect.name}", effect);
            }
        }

        foreach (KeyValuePair<string, int> pair in counts)
        {
            if (pair.Value >= WARN_THRESHOLD)
            {
                Debug.LogWarning($"{pair.Key} x{pair.Value} — vertex duplication is accumulating");
                continue;
            }

            Debug.Log($"{pair.Key} x{pair.Value}");
        }
    }
}
```

There's a reason `effect is Outline` and `GetType().Name` are both used.
`Outline` is a child of `Shadow`, so **`effect is Shadow` is true for `Outline`
as well.** Separating them by count requires looking at the type name. Not knowing
the inheritance chain makes the counting code wrong.

### Where Not to Use It

- **Text with many characters.** Vertices grow in proportion to character count.
  Log windows, dialogue boxes and body copy belong on the TMP material route.
- **Hiding it by setting alpha to zero.** `ModifyMesh` still runs and the vertices
  remain. If you're hiding it, disable the component.
- **Putting it on a different GameObject from the graphic.** The docs say it must
  be on the same one. Attach it to a child and nothing happens.
- **Reading `Effect Distance` as a distance only.** It's a `Vector2` and
  negatives go in. Used as a `Shadow`, the sign is the direction.
- **Separating `Outline` from `Shadow` with `is Shadow`.** They're in an
  inheritance relationship, so both are true.
- **Stacking several on one graphic to get thickness.** The duplication compounds.
  If you need thickness, go to the shader-based route.

## Wrapping Up

- **The clipping is the 5.3 edition but its sentences nearly match the current
  page.** The translation is accurate too. What snags in this post isn't the
  translation but **the original itself.**
- **`Use Graphic Alpha`'s description contradicts the name and the API.** The
  manual says it multiplies the color; the property name and the API reference say
  alpha. Two to one.
- **That sentence is character-identical on the `Outline` and `Shadow` pages.**
  The other rows were rewritten per page and only that one is shared — and the
  shared one is the one that disagrees.
- **The `Shadow` page introduces itself as an "outline effect."** A trace of the
  two pages splitting boilerplate.
- **`Outline` inherits from `Shadow`.** All three properties and all three methods
  are inherited; what it owns is one `ModifyMesh` override. That's why the API
  descriptions are written as "the shadow."
- **An outline is duplicated vertices, not a shader.** `ApplyShadow` says
  "Duplicate vertices," and `BaseMeshEffect` is for "effects that modify the
  generated Mesh." The cost lands not on GPU math but on **the vertex count the
  CPU sends.**
- **The number of copies isn't in the docs.** Four can be inferred from the sign
  combinations, but if you need the exact figure, measure it in the Profiler.
- **TMP's outline lives in the material.** SDF carries the contour distance, so the
  shader computes it. Cheaper, but **scoped to the material**, and unusable on an
  `Image`.

---

### References

- [Outline — UGUI package manual](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/script-Outline.html) ·
  [Shadow](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/script-Shadow.html) ·
  [UI Effect Components](https://docs.unity3d.com/Packages/com.unity.ugui@1.0/manual/comp-UIEffects.html)
- [Outline — UGUI API reference](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/api/UnityEngine.UI.Outline.html) ·
  [Shadow](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/api/UnityEngine.UI.Shadow.html) ·
  [BaseMeshEffect](https://docs.unity3d.com/Packages/com.unity.ugui@1.0/api/UnityEngine.UI.BaseMeshEffect.html)
- [Distance Field shader — TextMesh Pro manual](https://docs.unity3d.com/Packages/com.unity.ugui@3.0/manual/TextMeshPro/ShadersDistanceField.html)
- [Signed Distance Field font assets — TextMesh Pro manual](https://docs.unity3d.com/Packages/com.unity.textmeshpro@4.0/manual/FontAssetsSDF.html)
- [아웃라인 — Unity 5.3 Korean manual (the clipping's edition)](https://docs.unity3d.com/kr/530/Manual/script-Outline.html)

Earlier posts in the same UGUI cluster:
[layout groups](/posts/ugui-layout-group/) and
[InputField](/posts/ugui-inputfield-name-entry/). The starting point for this post
was the outline page of the Unity 5.3 Korean manual; I cross-checked its
description and properties table against the current UGUI package manual and API
reference.
