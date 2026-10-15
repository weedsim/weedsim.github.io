---
pubDatetime: 2026-10-15T18:30:00+09:00
title: "A Height Map Isn't Displacement, It's Parallax"
lang: en
translationKey: tessellation-displacement
featured: false
draft: false
tags:
  - Graphics
  - Rendering
  - Shader
  - GPU
  - Unity
description: "A beginner's explainer clipped after hearing tessellation come up in an interview and going to look up what it was. Pairing tessellation with displacement is exactly what Microsoft's docs do. But the field that looks like that pairing in Unity, the Standard Shader's Height Map, isn't displacement — the docs call it parallax mapping."
---

**I clipped this after tessellation came up in an interview.** In the room I
caught the word and moved on; afterwards, looking up what exactly it was, I
landed on this post.

What I clipped is an explainer written **for beginners**. It opens with two
cautions — the field is specialized, and it's a technology that develops in real
time, so some parts may be wrong. Given a post that states that up front,
hunting for its errors isn't the point.

**The big picture is set up correctly.** Objects are represented as triangles,
they're recognized by their vertices so a sphere looks faceted, and tessellation
subdivides the faces. And it nails the single most important line.

> Subdividing alone has little effect, so why is tessellation used?
>
> So the technique used together with tessellation is the displacement map.
>
> — [테셀레이션(tessellation) 란?](https://jhnambi.tistory.com/14)

**This pairing is right.** As confirmed below, Microsoft's Direct3D 11 docs
write the same pairing explicitly. The beginner's post didn't miss the core.

What's out of step is **the two words next to it** — what a normal map stores,
and what a bump map is. And one more appears once you come over to Unity:
**the field labelled "Height Map" in the Standard Shader is not displacement.**

## Table of contents

## What a normal map stores isn't brightness, it's direction

The post explains a normal map in one line.

> normal map: a method that gives a sense of depth by outputting the X part of
> an object brighter and the Y part darker
>
> — [테셀레이션(tessellation) 란?](https://jhnambi.tistory.com/14)

It's written as **a method of outputting brightness**. Unity's docs write what
gets stored differently.

> Normal maps are a special kind of texture that allow you to add surface
> detail such as bumps, grooves, and scratches to a model.
>
> each pixel, called a texel, represents a deviation in surface normal
> direction
>
> each pixel represents the difference in direction the surface should face
>
> — [Normal map (Bump mapping) — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/StandardShaderMaterialParameterNormalMap.html)

**What sits in each texel is "the difference in direction".** Not brightness. A
normal map is an RGB texture, and its three channels are read not as a color but
as **the components of a normal vector**.

Then where does the brightness difference come from? **It comes out as a
result.** The same page records the causality.

> would only be apparent due to the way lighting appears on the surface,
> because these modified normals are used in the lighting calculations
>
> — [Normal map (Bump mapping) — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/StandardShaderMaterialParameterNormalMap.html)

**The modified normals go into the lighting calculation, and that's why the
brightness looks different.** The post inverted that order, writing **the result
(brightness) as the stored content**. Explain the sense of depth as "because it
outputs brighter and darker" and there's no account of why the shading turns
along with the light when you move the light source.

| | What the post writes | What Unity's docs write |
|---|---|---|
| value in a texel | brighter / darker | "a deviation in surface normal direction" |
| texture kind | not stated | RGB texture (difference in direction) |
| status of the brightness difference | **the cause** | **the result** — "these modified normals are used in the lighting calculations" |
| geometry | not stated | "does not affect the actual polygonal nature of the mesh" |

That last row is this whole post's axis. The same page writes **"does not
affect the actual polygonal nature of the mesh, only how the lighting is
calculated on the surfaces."** and adds that viewing at a glancing angle
**"will reveal the true nature of the flat surface"**. That a normal map
**changes no shape on its own** holds in other shaders too, and the range
lilToon's normal map setting affects is written up in
[lilToon Parameters: A Reference Cross-Checked Against the Official Docs](/en/posts/liltoon-parameters/).

## A bump map isn't a technique, it's a category

The post lines up two techniques.

> There are 2 methods for a sense of depth closely related to tessellation.
> They are the bump map and the normal map.
>
> — [테셀레이션(tessellation) 란?](https://jhnambi.tistory.com/14)

**It stands the bump map and the normal map up as two.** Unity's docs don't
classify them that way.

> Normal maps and height maps are both kinds of bump map
>
> A height map is a simple black and white texture, where each pixel
> represents how much that point on the surface should appear to be raised
>
> Unity can also accept Height Maps for bump mapping, but they must be
> converted to Normal Maps on import in order to use them.
>
> — [Normal map (Bump mapping) — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/StandardShaderMaterialParameterNormalMap.html)

**Bump map is the upper category, and normal maps and height maps are the two
under it.** The post put the category and one of its members on the same line.
And the third sentence matters — Unity accepts height maps for bump mapping,
but they **have to be converted to normal maps on import** to be usable. Even a
map stored as brightness ends up **turned into direction** before it's used.

So the post's explanation of a normal map in terms of brightness is closer to
**calling a height map's storage format by the normal map's name**. The two
concepts sit under one umbrella called bump mapping, which is exactly where they
get mixed up.

| Term | Its place in Unity's docs | Storage format |
|---|---|---|
| Bump map | **the upper category** | — |
| Normal map | one kind of bump map | RGB, difference in direction |
| Height map | one kind of bump map | **"simple black and white texture"**, brighter is higher |
| import | — | a height map is **converted to a normal map** |

## A Height Map isn't displacement, it's parallax

Here's the gap that appears when you come over to Unity. The post quotes
displacement mapping like this.

> displacement mapping is a technique that forms hard-to-model undulations
> based on the light and dark of the image applied as a displacement map.
> Bright areas are modelled to protrude and dark areas to recede.
>
> — [테셀레이션(tessellation) 란?](https://jhnambi.tistory.com/14)

**"Bright areas protrude"** — an explanation in which the shape actually
changes. Take that explanation and open Unity's Standard Shader, and there's one
field that accepts a greyscale map where brighter is higher. It's named
**Height Map**. Its documentation opens like this.

> Height mapping (also known as parallax mapping) is a similar concept to
> normal mapping
>
> actually shifts the areas of the visible surface texture around, to achieve
> a kind of surface-level occlusion effect
>
> — [Height map — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/StandardShaderMaterialParameterHeightMap.html)

**It's parallax mapping.** What changes isn't geometry but **the position of the
visible texture**. So the same page pins the limit.

> the silhouette of the model will never be modified, because ultimately the
> effect is drawn onto the surface
>
> — [Height map — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/StandardShaderMaterialParameterHeightMap.html)

**The silhouette is never modified.** Because the effect is drawn onto the
surface. Which means: expect the displacement the post described — vertices
actually pushed up — and plug a map into the Standard Shader's Height Map, and
**the outline stays flat.** The inner texture gets convincing while the model's
edge is level.

The docs record the relationship between the two as well. Normal mapping changes
only the lighting, and height mapping goes one step further by shifting the
visible texture. And it says they're **usually used together**. There's a line
of caution about cost too — it's more complex and more performance-intensive
than normal mapping.

| Technique | What changes | Silhouette | Unity's field |
|---|---|---|---|
| Normal map | the lighting calculation | unchanged | Normal Map |
| Height map (parallax) | **the visible texture's position** | **"never be modified"** | Height Map |
| Displacement | **vertex positions** | changes | not in the Standard Shader |

**There is no field for the third row in the Standard Shader.** The displacement
the post talked about is a feature tied to tessellation, and that isn't a
checkbox on the Standard Shader — it requires **picking a different shader**.
The routes are below.

## Pairing tessellation with displacement is right

What the post writes as **starting from DirectX 11** is right too.

> From DirectX11 on, a module supporting tessellation came into use
>
> — [테셀레이션(tessellation) 란?](https://jhnambi.tistory.com/14)

Microsoft's docs list three stages and call them "new".

> The Direct3D 11 pipeline implements tessellation using three new pipeline
> stages:
>
> Hull-Shader Stage: A programmable shader stage that produces a geometry
> patch (and patch constants) that correspond to each input patch
>
> Tessellator Stage: A fixed function pipeline stage that creates a sampling
> pattern of the domain that represents the geometry patch
>
> Domain-Shader Stage: A programmable shader stage that calculates the vertex
> position that corresponds to each domain sample
>
> — [Tessellation Stages — Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3d11/direct3d-11-advanced-stages-tessellation)

**A fixed stage wedged between two programmable ones.** Where these three sit in
the pipeline is written out with stage numbers in
[The Graphics Pipeline in Order: From Vertex to Pixel](/en/posts/graphics-pipeline/).
What matters here is **why you use it**, and the same page names displacement
**by name**.

> tessellation implemented by hardware can generate an incredible amount of
> visual detail (including support for displacement mapping) without adding
> the visual detail to the model sizes
>
> The tessellation technique implemented in the Direct3D 11 pipeline also
> supports displacement mapping, which can produce stunning amounts of surface
> detail.
>
> — [Tessellation Stages — Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3d11/direct3d-11-advanced-stages-tessellation)

**The post's pairing is the docs' pairing.** "Tessellation means nothing alone
and only pays off combined with displacement" isn't something the beginner's
post invented — it's an item the people who introduced hardware tessellation
wrote down as a benefit.

The same page records three more benefits — **memory and bandwidth savings**,
**continuous or view-dependent LOD**, and **"performing expensive computations
at lower frequency"**. That follows from a structure where only the low-detail
model is sent and the detail is built on the GPU.

## Where you turn it on in Unity differs per pipeline

So where do you turn it on in Unity? **It differs per pipeline, and the
best-known route is the narrowest.**

In the Built-in pipeline it's a surface shader directive.

> Tessellation is indicated by tessellate:FunctionName modifier.
>
> Surface shaders can optionally compute phong tessellation to smooth model
> surface even without any displacement mapping.
>
> the shader is automatically compiled into the Shader Model 4.6 target
>
> Only triangle domain - no quads, no isoline tessellation.
>
> — [Tessellation Surface Shader examples in the Built-In Render Pipeline — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/SL-SurfaceShaderTessellation.html)

**One line, `tessellate:`.** And three constraints come attached — it's
automatically compiled to Shader Model **4.6**, so older targets drop out; only
the **triangle domain** is supported; and **being a surface shader at all** is a
constraint. The same page records it — **"The Universal Render Pipeline (URP)
doesn't support surface shaders"**, and the compatibility table lists HDRP and
Custom SRP as unsupported too. How to read that table is written up in
[The Table on Unity's Custom Shaders Page Is a Fork, Not an Index](/en/posts/unity-custom-shaders/),
and which built-in shader examples port to URP and which don't is counted in
[Thirteen Built-In Shader Examples: The Further Down the List, the Less Ports to URP](/en/posts/builtin-shader-examples/).

What catches you more is the notice on that same page — the Built-in Render
Pipeline is **deprecated** and supported through the Unity 6.7 LTS lifecycle.
Where I confirmed that notice is written up in
[What Puts It in the Inspector Isn't Exposed, It's Show In Inspector](/en/posts/shadergraph-exposed/).

HDRP has dedicated shaders and options.

> The Tessellation options control how Unity tessellates your Material's
> surface and smooths geometry.
>
> None: HDRP only uses the displacement map to tessellate the mesh.
>
> Phong: HDRP applies Phong tessellation to the mesh.
>
> Max Displacement: Maximun possible world displacement in meter for the
> Material.
>
> — [Tessellation — HDRP 14.0](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Tessellation.html)

**The `None` mode's description states this post's point outright** — "HDRP only
uses the displacement map to tessellate the mesh." The displacement map is the
input that drives tessellation. Its role differs from the Standard Shader's
Height Map. The same page says the Tessellation Factor is **only available in
the Lit Tessellation and Layered Lit Tessellation shaders**, and adds that in
Master Stacks it appears as an input. And **decal meshes don't support
tessellation.**

| Route | How you turn it on | Constraint |
|---|---|---|
| Built-in + surface shader | `tessellate:FunctionName` | SM 4.6, triangle domain only, **URP/HDRP unsupported** |
| Built-in itself | — | **deprecated** (supported through 6.7 LTS) |
| HDRP | Lit Tessellation / Layered Lit Tessellation | those shaders only, decal meshes excluded |
| HDRP Master Stack | Tessellation Factor exposed **as an input** | Max Displacement is Master Stack only |
| Standard Shader | **nowhere** | the Height Map is parallax |

## The cost is there just from turning it on

The post doesn't cover cost. Fair enough for a beginner's piece, but the first
sentence that catches you when you actually turn it on is in HDRP's docs.

> Enabling the Tessellation option have an extra GPU cost, even if the
> tessellationFactor is 0.0 or 1.0.
>
> To maintain good performance on the Xbox One or PlayStation 4, do not use
> values greater than 15.
>
> — [Tessellation — HDRP 14.0](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Tessellation.html)

**There's an extra cost even with the factor at 0 or 1.** "Leave it on and set
the value to 0 and it's free" isn't the case. And there's a number written down —
on Xbox One and PlayStation 4, **don't exceed 15**. The same page recommends
adding **one more LOD** using a shader without tessellation.

The Built-in side has its own cost material: a caution about distance-based
tessellation, and a culling variant function.

> Purely distance based tessellation is effective only when triangle sizes are
> quite similar.
>
> For performance reasons, call the UnityEdgeLengthBasedTessCull function
> instead, which performs patch frustum culling.
>
> — [Tessellation Surface Shader examples in the Built-In Render Pipeline — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/SL-SurfaceShaderTessellation.html)

**If triangle sizes aren't uniform, distance-based goes wrong** — small
triangles get over-subdivided and large ones under-subdivided. And there's a
separate function doing per-patch frustum culling, which the same page says
**makes the shader a bit more expensive** but saves GPU work on parts off
screen.

## Where and why you'd use it

Tessellation is for when you want to **send a low-resolution mesh and build the
detail on the GPU**. Terrain, and surfaces like brickwork or rock that need to
be bumpy **down to the silhouette**. If the silhouette can stay flat a normal
map is far cheaper, and if only the inner texture needs to be more convincing,
the Height Map (parallax) is in between. **Don't read the three as degrees of
the same effect** — what each changes is, respectively, the lighting, the
texture's position, and the vertices.

Thinking back to where I first heard the word, **this distinction is what sets
the depth of an answer.** "A technique that subdivides faces" is what one search
gets you, and the next question is "so why do that". Displacement has to come
out there, and following on with "how do you use it in Unity" takes you to
per-pipeline routes and cost. **All three layers are written in the docs.**

### A working example

Two things in this topic can be checked in code: that **a mesh's vertex count
has nothing to do with tessellation**, and **which texture fields the current
material actually has**. Both are in one component.

The property names aren't hardcoded. **I could not confirm the Standard
Shader's property names in the current docs**, so instead of guessing at names,
it **enumerates** the properties the shader holds.

```csharp file="Scripts/Graphics/SurfaceDetailProbe.cs"
using System.Text;
using UnityEngine;
using UnityEngine.Rendering;

[RequireComponent(typeof(Renderer))]
public class SurfaceDetailProbe : MonoBehaviour
{
    [Header("Reporting")]
    [Tooltip("On lists every texture property. Off lists only assigned ones")]
    [SerializeField]
    private bool _listEmptySlots;

    [Tooltip("Properties whose name contains one of these get marked")]
    [SerializeField]
    private string[] _highlight = { "Normal", "Bump", "Parallax", "Height" };

    private void Start()
    {
        Probe();
    }

    [ContextMenu("Check now")]
    private void Probe()
    {
        if (!TryGetComponent(out Renderer meshRenderer))
        {
            Debug.LogError("There is no Renderer attached.", this);
            return;
        }

        ReportMesh();

        // This only inspects, so read sharedMaterial. Reading material
        // creates an instance.
        Material material = meshRenderer.sharedMaterial;
        if (material == null)
        {
            Debug.LogWarning("The material is empty.", this);
            return;
        }

        ReportTextureProperties(material);
    }

    private void ReportMesh()
    {
        if (!TryGetComponent(out MeshFilter filter)) { return; }

        Mesh mesh = filter.sharedMesh;
        if (mesh == null) { return; }

        // The docs say only "Returns the number of vertices in the Mesh".
        // Tessellation happens on the GPU, so it isn't reflected here.
        Debug.Log(
            $"mesh has {mesh.vertexCount} vertices — tessellation isn't here",
            this);
    }

    private void ReportTextureProperties(Material material)
    {
        Shader shader = material.shader;
        if (shader == null) { return; }

        StringBuilder builder = new StringBuilder();
        builder.AppendLine($"shader: {shader.name}");

        // Enumerate what the shader holds instead of guessing names.
        int count = shader.GetPropertyCount();

        for (int i = 0; i < count; i++)
        {
            if (shader.GetPropertyType(i) != ShaderPropertyType.Texture)
            {
                continue;
            }

            string name = shader.GetPropertyName(i);
            Texture assigned = material.GetTexture(name);

            if (assigned == null && !_listEmptySlots) { continue; }

            string mark = IsHighlighted(name) ? " <-" : string.Empty;
            string value = assigned != null ? assigned.name : "(empty)";

            builder.AppendLine($"  {name} = {value}{mark}");
        }

        Debug.Log(builder.ToString(), this);
    }

    private bool IsHighlighted(string propertyName)
    {
        foreach (string piece in _highlight)
        {
            if (string.IsNullOrEmpty(piece)) { continue; }

            if (propertyName.Contains(piece)) { return true; }
        }

        return false;
    }
}
```

Three things worth pointing out.

**One — the vertex count doesn't show tessellation.** The docs write
`Mesh.vertexCount` only as **"Returns the number of vertices in the Mesh (Read
Only)."** Tessellation happens in the Tessellator stage, and the vertices that
stage creates aren't in the mesh asset. **"I turned tessellation on and the
vertex count didn't change" is normal.**

**Two — it enumerates properties.** The docs record all three —
`GetPropertyCount` is **"Returns the number of properties in this Shader."**,
`GetPropertyName(int)` returns the name, and `GetPropertyType(int)` returns a
`ShaderPropertyType`. Both are documented to **throw
`ArgumentOutOfRangeException` for a missing index**, so the loop is bounded by
`GetPropertyCount`. This way I can't get wrong **the names that differ per
shader** (Built-in, URP, HDRP and lilToon all differ).

**Three — `_highlight` is a marker, not a verdict.** Code can't know whether a
field with `Height` in its name is parallax or displacement. What that field
does is in **that shader's documentation**. So it only adds an arrow, and the
judgement is the person's.

### How to choose

| What you want | What to use | The sentence behind it |
|---|---|---|
| bumpy lighting only | Normal map | "only how the lighting is calculated on the surfaces" |
| inner texture with occlusion | Height map (parallax) | "shifts the areas of the visible surface texture around" |
| change the **silhouette** | tessellation + displacement | "also supports displacement mapping" |
| tessellation in Built-in | surface shader `tessellate:` | "Tessellation is indicated by tessellate:FunctionName" |
| smoothing without displacement | `tessphong:` (Phong) | "even without any displacement mapping" |
| in HDRP | Lit Tessellation / Layered Lit Tessellation | "only available in the Layered Lit Tessellation Shader and Lit Tessellation Shader" |
| picking a factor on console | 15 or lower | "do not use values greater than 15" |
| saving work off screen | `UnityEdgeLengthBasedTessCull` | "performs patch frustum culling" |
| an LOD without tessellation | add one more LOD | the docs recommend it |

Here's the order I'd decide in.

1. **Does the silhouette have to change?** If not, stop at the normal map. It's
   the cheapest.
2. **Do you only need inner occlusion?** The Height Map (parallax) is that
   slot. The silhouette doesn't change.
3. **If the silhouette must change, pick the shader first.** The Standard
   Shader has no such field. Go to the tessellation shader for your pipeline.
4. **Accept the cost before turning it on.** The docs say there's extra cost
   even with the factor at 0.

### Where not to use it

- **Understanding a normal map as "a map that outputs brighter and darker".**
  What's in a texel is **the difference in direction**. Brightness is the
  lighting calculation's result.
- **Standing bump map and normal map side by side as two techniques.** By the
  docs, bump map is the upper category.
- **Trying to use a height map directly for bump mapping.** Unity says it must
  be **converted to a normal map on import**.
- **Expecting displacement from the Standard Shader's Height Map.** The docs
  say **"the silhouette ... will never be modified"**.
- **Turning tessellation on and waiting for an effect.** The post got this
  right, and Microsoft's docs also write it paired with displacement.
- **Trying to turn tessellation on through a surface shader in URP.** The docs
  say URP doesn't support surface shaders.
- **Building a new project on Built-in plus surface shader tessellation.** The
  same page marks Built-in as deprecated.
- **Treating a factor of 0 as free.** "even if the tessellationFactor is 0.0 or
  1.0" there's extra cost.
- **Using distance-based only on a mesh with uneven triangle sizes.** The docs
  say it's effective only when the sizes are similar.
- **Counting tessellation results with `Mesh.vertexCount`.** What a GPU stage
  produces isn't in the mesh asset.

## Summary

- The post's **pairing of tessellation with displacement is right.** Microsoft's
  docs name **"also supports displacement mapping"** as a benefit of hardware
  tessellation. **DirectX 11** is right too — "three new pipeline stages".
- What sits in a normal map's texel is **"a deviation in surface normal
  direction"**, the **difference in direction**. The brightness difference is
  the **result** of **"these modified normals are used in the lighting
  calculations"**. The post inverted that order.
- **Bump map is the upper category** — "Normal maps and height maps are both
  kinds of bump map". A height map is a **"simple black and white texture"**, and
  Unity **converts it to a normal map** to use it.
- **The Standard Shader's Height Map is parallax mapping** — "Height mapping
  (also known as parallax mapping)". It shifts the visible texture, and
  **"the silhouette ... will never be modified"**. There is **no** field for
  displacement in the Standard Shader.
- Where you turn tessellation on in Unity differs per pipeline. Built-in is the
  surface shader **`tessellate:`** (SM 4.6, triangle domain only) and **URP and
  HDRP don't support surface shaders.** Built-in itself is **deprecated**.
- HDRP allows the Tessellation Factor **only in the Lit Tessellation and
  Layered Lit Tessellation** shaders, and exposes it as an input in Master
  Stacks. The `None` mode's description is **"HDRP only uses the displacement
  map to tessellate the mesh."**
- **The cost is there just from turning it on** — "even if the
  tessellationFactor is 0.0 or 1.0". It recommends **15 or lower** on console
  and **one more LOD** without tessellation.
- Distance-based tessellation is effective **only when triangle sizes are
  similar**, and **`UnityEdgeLengthBasedTessCull`** exists to save work off
  screen.
- **`Mesh.vertexCount` doesn't reflect tessellation.** Vertices a GPU stage
  creates aren't in the mesh asset.

---

### References

- [Normal map (Bump mapping) — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/StandardShaderMaterialParameterNormalMap.html)
- [Height map — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/StandardShaderMaterialParameterHeightMap.html)
- [Tessellation Surface Shader examples in the Built-In Render Pipeline — Unity 6.6 manual](https://docs.unity3d.com/6000.6/Documentation/Manual/SL-SurfaceShaderTessellation.html)
- [Tessellation — HDRP 14.0](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Tessellation.html)
- [Tessellation Stages — Microsoft Learn (Direct3D 11)](https://learn.microsoft.com/en-us/windows/win32/direct3d11/direct3d-11-advanced-stages-tessellation)
- [Mesh.vertexCount — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Mesh-vertexCount.html)
- [Shader.GetPropertyCount — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Shader.GetPropertyCount.html)
- [Shader.GetPropertyName — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Shader.GetPropertyName.html)
- [Shader.GetPropertyType — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Shader.GetPropertyType.html)
- [Rendering.ShaderPropertyType — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Rendering.ShaderPropertyType.html)

The clipping is jhnambi's Tistory post
[테셀레이션(tessellation) 란?](https://jhnambi.tistory.com/14) (2022-11-20), in
Korean; the quotes from it are my translations. It's written for beginners, and
it's a post that **attached its own caution that some parts may be wrong**. Out
of respect for that premise, instead of counting its errors this post **swapped
two terms for the docs' definitions** and added one more gap that appears on
coming over to Unity. The big picture of pairing tessellation with displacement
the post got right — and that's the most important item this post confirmed.
