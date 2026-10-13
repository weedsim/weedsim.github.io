---
pubDatetime: 2026-10-13T14:30:00+09:00
title: "What Decides Draw Order Is Three Things, Not Two"
lang: en
translationKey: sorting-layer-order
featured: false
draft: false
tags:
  - Unity
  - 2D
  - Rendering
  - Camera
  - C#
description: "A learning diary I landed on while trying to find out what the Tag and Layer fields at the top of the Inspector actually do. It explains 2D draw order with Sorting Layer and Order in Layer. Both are right, but the docs call those two the higher-priority criteria and put one more underneath. And getting a layer name wrong quietly lands you in Default."
---

It started somewhere slightly different. I was trying to find out **what the
`Tag` and `Layer` fields at the top of the Inspector each do**, and while
looking I landed on a post about layers and clipped it. It's a learning diary
that explains 2D draw order with `Sorting Layer` and `Order in Layer`. It's
from 2023 and it's short. The observations are accurate — a layer higher up the
list is drawn first and therefore sits behind, within one layer a lower
`Order in Layer` is further back, and the reason for having both is management
once you're past a few thousand objects.

Nothing in it is wrong. But **it stops there.** When the docs talk about those
two, they use this phrasing.

> This is used for sorting Renderer components when other, higher priority,
> criterias fail to distinguish the render order.

Meaning there's something else, used **"when other, higher priority, criterias
fail to distinguish the render order"**. So there aren't two criteria, there's a
third — and **you get to choose it.** Why two sprites on the same layer with the
same `Order in Layer` come out one way sometimes and the other way other times
is decided right there.

And there's a trap in the comparison the clipping opens with.

> You can think of it as a concept similar to Photoshop's layers.

It's a good comparison for getting the idea. But Unity has **another thing
called `Layer`**, and the two do different jobs.

This blog has a post on that other `Layer`:
[1 << -1 Isn't an Error, It's Layer 31](/en/posts/overlapsphere-layermask/).
That one covered **filtering physics queries with a `LayerMask`**. This one
looks at **deciding draw order**. Since the names are so close, that's where I
start.

I verified six things. **The docs call the criteria a priority order and put a
third one underneath**, **`Layer` and `Sorting Layer` differ from their
definitions up**, **the docs flatly say a layer's `id` is not the order**,
**getting the name wrong quietly lands you in Default**, **`Order in Layer` has
a range**, and **the problem of a multi-sprite character drawing interleaved
has a component of its own.**

Checked on **2026-10-13**, against Unity **6.6**.

## Table of contents

## There are three criteria, not two, and the third is a setting

Here's the description of the property behind `Order in Layer`.

> Renderer's order within a sorting layer.

**"Within a sorting layer"** — the order *inside* a layer. That one phrase
carries the nesting: the layer comes first, and this value is used inside it.
The layer has a value of its own too.

> This is the relative value that indicates the sort order of this layer
> relative to the other layers.

That's `SortingLayer.value`. Those are the two the clipping explains. But the
description of the property that sets the third criterion's axis has this
sentence.

> This is used for sorting Renderer components when other, higher priority,
> criterias fail to distinguish the render order.

**"Higher priority, criterias"** — there are criteria of higher priority, and
something else is used when they can't tell the order. That something is
**distance**. A camera setting decides how it's measured.

> By default, perspective Cameras sort objects based on distance from Camera
> position to the object pivot; and orthographic Cameras sort based on distance
> along the view direction.

**The default behavior differs by projection.** A perspective camera sorts by
distance from the camera position to the object pivot; an orthographic one by
distance along the view direction. A 2D project uses an orthographic camera by
default, so **distance along the view direction — Z** becomes the third
criterion. If the same layer and same `Order in Layer` give you an order you
didn't expect, that's where to look.

And the docs leave a piece of advice for 2D.

> If you're making a 2D game with a perspective Camera, you might want to use
> TransparencySortMode.Orthographic sort mode so that objects are sorted based
> on distance along the Camera's view.

**Change the sort mode when you're making 2D with a perspective camera.** There
are four modes.

| Value | What the docs say |
| --- | --- |
| Default | "Default transparency sorting mode." |
| Perspective | "Perspective transparency sorting mode." |
| Orthographic | "Orthographic transparency sorting mode." |
| CustomAxis | "Sort objects based on distance along a custom axis." |

That last value is the answer for an isometric game. The docs give you the axis
too.

> This is a useful technique in 2.5D games or isometric games where the
> SpriteRenderers need to be sorted along the vertical screen axis.

> For this specific use case, set the TransparencySortMode to
> TransparencySortMode.CustomAxis and set the axis to (0.0f, 1.0f, 0.0f).

**Set the axis to `(0, 1, 0)` and lower Y comes out in front.** You get the
behavior of a character drawing in front as it walks down the screen from one
camera setting, instead of rewriting `Order in Layer` every frame.

## Three of the four fields in that window are called Layer

Go looking for `Sorting Layer` and the window you arrive at is
`Tags and Layers`. Here's how the manual introduces it.

> The Tags and Layers settings (main menu: Edit > Project Settings, then select
> the Tags and Layers category) allows you to set up Tags, Sorting Layers and
> Layers

But the page has **four** sections — Tags, Sorting Layers, Layers, and
**Rendering Layers.** Three of them have "Layer" in the name and they all do
different jobs. Put the definitions side by side.

| Field | How the docs define it |
| --- | --- |
| Tags | "Tags are marker values that you can use to identify objects in your project." |
| Sorting Layers | "Defines the overlay order of Sprites in the 2D system." |
| Layers | "Groups objects that share particular characteristics, primarily to restrict operations such as raycasting or rendering so they only apply to the relevant group of objects." |
| Rendering Layers | "Use Rendering Layers to configure which lights or decals affect which GameObjects." |

**Only `Sorting Layer` decides draw order.** `Layer` **restricts the targets**
of operations like raycasting and rendering, `Rendering Layer` decides **which
lights and decals affect which objects**, and `Tag` is **a marker for
identifying objects**. Change a `Sorting Layer` and physics query results stay
the same; change a `Layer` and draw order stays the same.

`Rendering Layers` comes with a condition.

> Lists the names of Rendering Layers if your project uses the Universal Render
> Pipeline (URP) or the High Definition Render Pipeline (HDRP).

> The Built-In Rendering Pipeline doesn't support Rendering Layers.

**That field doesn't work on the built-in pipeline.** How the pipeline is
decided by an asset is written up in
[A Render Pipeline Is an Asset, and Built-In Is What's Left When the Field Is Empty](/en/posts/render-pipelines-overview/).

And Tag and Layer each carry **a constraint that is the other's opposite**.

> You can't rename tags, but can remove them with the minus (-) button at the
> bottom-right of the list.

> You can't add more Layers but you can rename them.

**A Tag can be added and can't be renamed. A Layer can be renamed and can't be
added.** Remember it backwards and both roads are closed. `Layer` also has
slots where editing itself is closed.

> Layers marked as Builtin Layer are default layers used by Unity and can't be
> edited while layers marked as User Layer can be customized.

The function for checking a `Tag` from code has two overloads.

> public bool CompareTag(string tag);

> public bool CompareTag(TagHandle tag);

> This overload of the method, which takes a TagHandle, can be faster than the
> overload which takes a string, particularly if the same TagHandle can be
> reused for many calls.

**Reusing a `TagHandle` can be faster if you compare the same tag many times**,
it says. But **there's no statement on that page that the string comparison
allocates memory.** It's a claim that gets repeated a lot; I couldn't verify it,
so this post stops at what the docs write.

Handling the `Layer` side as a bit mask, and the trap that comes out of it, is
written up in
[1 << -1 Isn't an Error, It's Layer 31](/en/posts/overlapsphere-layermask/).
This post doesn't touch that side.

## The list order is the value, and the id isn't that value

The clipping explains it by up and down in the list. The manual writes down
that gesture.

> To reorder layers, drag the handle on the left-hand side of each layer item.

**You change it by dragging.** Which means reordering the list changes the draw
order of the whole project. Insert one layer in the middle and everything below
it shifts.

There's one thing you **must not do** when handling this order from code. The
docs attach a warning directly to `SortingLayer.id`.

> This is the unique id assigned to the layer.

> It is not an ordered running value and it should not be used to compare with
> other layers to determine the sorting order.

**The `id` is not the order.** It says not to use it for comparison. There's
something else for that.

> Returns the final sorting layer value.

> To determine the sorting order between the various sorting layers, use this
> method to retrieve the final sorting value and use CompareTo to determine the
> order.

That's `SortingLayer.GetLayerValueFromID` and `GetLayerValueFromName`, and it
says to compare with `CompareTo`. There's a statement about the default layer
as well.

> There is always a default SortingLayer named "Default" which all sprites are
> added to initially.

> Layers can be ordered before or after the default layer.

**Default always exists, and other layers can sit before or after it.** So
there's no guarantee Default is at the back.

## Get the name wrong and it quietly goes to Default

Here three sentences interlock into one trap. First, the function that turns a
name into an id.

> Returns the id given the name.

> Will return 0 if an invalid name was given.

**An invalid name returns 0.** Not an exception. Next, the `Renderer`'s id
property.

> Unique ID of the Renderer's sorting layer.

> ID of the default sorting layer is always 0.

**Default's id is always 0.** And the validity check function is this.

> Returns true if the id provided is a valid layer id.

Stitch the three together and the conclusion follows. Typo a layer name and
`NameToID` gives you 0, that 0 is **Default's id**, and `IsValid(0)` returns
**true** because Default always exists. So **a typo passes as a valid
setting.** The sprite goes into Default rather than the layer you meant, with
no warning at all.

That conclusion stitches sentences from three pages together, and I couldn't
find a place where "a typo goes to Default" is written in one sentence. **What
I verified is each of the three sentences.** But if the conclusion holds, the
remedy is clear — **`IsValid` can't catch it, so you have to look the name up
in the list.** The docs hand you the list.

> Returns all the layers defined in this project.

That's `SortingLayer.layers`. The example below uses that approach.

## Order in Layer has a range

The clipping uses values like `-2` and `-1`. Negative is correct, and there's
an end to it.

> The lower the number you give it, the further back the GameObject appears.

> The higher the number, the closer the GameObject looks to the Camera.

> Note: The value must be between -32768 and 32767.

**Lower is further back, higher is closer, and the range is -32768 to 32767.**
Same as the clipping's "the lower the value, the further back it's drawn". It's
the range of a 16-bit signed integer, so code that multiplies a Y coordinate by
100 and uses it as the order can reach that end. If you're going that way, the
`CustomAxis` from the earlier section is the better place for it.

The docs write down a use case too.

> This is very effective when creating 2D scroller games, as you may want
> certain GameObjects on the same layer but certain parts to appear in front of
> others, for example, layering clouds and making them appear in front of the
> sky.

Same structure as the clipping's blue background and overgrown bushes.

## When characters draw interleaved

The clipping's management point — that matching up `Order in Layer` one object
at a time gets hard once there are thousands — is correct. But there's one case
that classifying by layer alone doesn't solve, and there's a component for it.

> A common use case for having a SortingGroup is to create complex 2D
> characters that are made up of multiple SpriteRenderers.

> When several clones of such a character overlap, their individual body parts
> might not be sorted properly resulting in a visual glitch where the the body
> parts interleave.

> For example, the hands of two characters might be sorted in front of their
> bodies, where you would expect one entire character to be drawn in front of
> the other character.

**Split the torso and hands into layers and, when two characters overlap, A's
hand goes in front of B's torso.** Because the layers are per body part rather
than per character. Here's what `SortingGroup` does.

> Adding a SortingGroup component to a GameObject will ensure that all
> Renderers within the GameObject's descendants will be sorted and rendered
> together.

> The descendants of the SortingGroup are sorted using the same SortingLayer
> and Renderer.sortingOrder.

> However, they are only sorted against other descendants of the SortingGroup
> and not with any renderers outside of it.

**Descendants only sort among themselves.** Which is what lets you reuse body
part layers across every character.

> This allows you to reuse the same SortingLayers (for example, "Hands",
> "Torso"...) to sort body parts while ensuring they never interleave with
> other clones of the character.

The group itself sorts against the renderers outside it by the same criteria.

> The SortingGroups, together with other renderers, are sorted using the
> SortingLayer and Renderer.sortingOrder.

They nest, too.

> Additionally, they can be nested within other SortingGroups.

> This is useful if you have branches of descendants that should not be mixed
> up i.e. the "Left Hand" vs the "Right Hand" hierarchy branches.

There's a switch for skipping the nesting.

> Ignores any parent SortingGroup and sorts this and its descendant Renderers
> against other Renderers at the root level.

That's `sortAtRoot`. And **there's a ceiling written down.**

> The maximum number of sorting groups and renderers is 4096.

The clipping's "thousands of objects" is near that number. In a project with
that many objects, it's worth reading this line first.

You can pick the **point** the distance is measured to, as well.

> Determines the position of the Sprite used for sorting the Renderer.

| Value | What the docs say |
| --- | --- |
| Center | "The center of the Sprite is used as the point for sorting the Renderer." |
| Pivot | "The pivot of the Sprite is used as the point for sorting the Renderer." |

That's `SpriteRenderer.spriteSortPoint`. For a character sprite whose pivot sits
at the feet, `Pivot` gives you what you meant. Given that the third criterion is
"distance", this is the field that decides **distance to what**.

## Where and why you'd use it

### A working example

This **looks the layer name up in the list** to validate it, and clamps the
order into range. Blocking the "a typo passes as valid" from the earlier section
is this code's purpose.

```csharp file="Scripts/Rendering/SortingAssigner.cs"
using UnityEngine;

[RequireComponent(typeof(Renderer))]
public class SortingAssigner : MonoBehaviour
{
    // The valid range the docs write down.
    private const int MIN_ORDER = -32768;
    private const int MAX_ORDER = 32767;

    [Header("Sorting")]
    [Tooltip("A Sorting Layer name registered in Tags and Layers")]
    [SerializeField]
    private string _sortingLayerName = "Default";

    [Tooltip("Order within the layer. Lower is further back")]
    [SerializeField]
    private int _sortingOrder;

    private Renderer _renderer;

    private void Awake()
    {
        if (!TryGetComponent(out _renderer))
        {
            Debug.LogError("There is no Renderer.", this);
        }
    }

    private void OnEnable()
    {
        Apply();
    }

    public void Apply()
    {
        if (_renderer == null)
        {
            return;
        }

        // IsValid can't catch a typo. NameToID gives 0, 0 is Default's id,
        // and Default is always valid. So look the name up in the list.
        if (!HasLayer(_sortingLayerName))
        {
            Debug.LogError(
                $"There is no '{_sortingLayerName}' Sorting Layer. Stopping "
                + "here so it doesn't land in Default.", this);
            return;
        }

        _renderer.sortingLayerName = _sortingLayerName;
        _renderer.sortingOrder =
            Mathf.Clamp(_sortingOrder, MIN_ORDER, MAX_ORDER);
    }

    private static bool HasLayer(string layerName)
    {
        if (string.IsNullOrEmpty(layerName))
        {
            return false;
        }

        foreach (SortingLayer layer in SortingLayer.layers)
        {
            if (layer.name == layerName)
            {
                return true;
            }
        }

        return false;
    }

    // Compares two layers' front-to-back from code. The docs say not to
    // compare by id, and they name the value and the method to use instead.
    public static int CompareLayers(string back, string front)
    {
        int backValue = SortingLayer.GetLayerValueFromName(back);
        int frontValue = SortingLayer.GetLayerValueFromName(front);
        return backValue.CompareTo(frontValue);
    }

    // The place to confirm with your own eyes that value, not id, is what to
    // look at.
    [ContextMenu("Log Sorting Layers")]
    private void LogLayers()
    {
        foreach (SortingLayer layer in SortingLayer.layers)
        {
            Debug.Log($"name={layer.name} id={layer.id} value={layer.value}",
                this);
        }
    }
}
```

There's a reason `_renderer` doesn't use `?.`. It's a `UnityEngine.Object`, and
a reference left empty in the Inspector can end up in a state that **looks like
null but isn't C#'s null**. So it uses `== null` / `!= null` comparisons. For a
plain C# object, `?.` is correct.

Assigning through `sortingLayerName` is deliberate too. Going through
`sortingLayerID` would mean passing via `NameToID`, and that function **returns
0 on a typo**. Since `HasLayer` already checked the name, handing the name
straight over is one step shorter.

There's one reason for `LogLayers`. That `id` and `value` are **different
numbers** is obvious the moment you print them, and easy to read past in the
docs' prose.

### How to choose

| Situation | What to use |
| --- | --- |
| Clear groups like background, terrain, characters | `Sorting Layer` |
| Front-to-back inside one group | `Order in Layer` (lower is further back) |
| Both are equal and the order wobbles | distance — the camera's sort mode and Z |
| Making 2D with a perspective camera | `TransparencySortMode.Orthographic` |
| Sorting by Y in isometric or 2.5D | `CustomAxis` + axis `(0, 1, 0)` |
| Changing the point distance is measured to | `SpriteRenderer.spriteSortPoint` |
| A character made of several sprites | `SortingGroup` |
| You need to ignore a parent group | `SortingGroup.sortAtRoot` |
| Comparing two layers from code | `GetLayerValueFromName` + `CompareTo` |
| Validating a layer name from code | look the name up in `SortingLayer.layers` |
| Filtering physics query targets | `Layer`, not `Sorting Layer` |
| Identifying an object | `Tag` (`CompareTag` from code) |
| Splitting which lights and decals reach what | `Rendering Layer` (URP/HDRP only) |

Here's the order to judge in.

- **Groups by layer, inside a group by the order value.** The clipping's
  conclusion is right. So is its point that managing a scene of thousands with
  the order value alone is inefficient.
- **If the order wobbles, look at the third criterion, not the two.** Same layer
  and same order value leaves distance, and how distance is measured is a camera
  setting.
- **Don't rewrite the order value every frame to sort by Y.** The docs write
  down `CustomAxis` and the axis value.
- **Validate the name first when handling layers from code.** `IsValid` won't
  catch a typo.

### Where not to use it

- **Comparing front-to-back with `SortingLayer.id`.** The docs wrote "It is not
  an ordered running value and it should not be used to compare". Comparison is
  `GetLayerValueFromName` + `CompareTo`.
- **Validating a layer name with `IsValid` alone.** A typo becomes 0 at
  `NameToID`, and 0 is Default's id. You have to look the name up in the list.
- **Assuming Default is at the back.** The docs wrote "Layers can be ordered
  before or after the default layer".
- **Multiplying a Y coordinate and putting it in `Order in Layer`.** The range
  is -32768 to 32767. On a large map you hit the end. `CustomAxis` is that spot.
- **Trying to filter physics queries with `Sorting Layer`.** That's `Layer`, and
  the docs define it as "primarily to restrict operations such as raycasting".
- **Trying to rename a Tag later.** The docs wrote "You can't rename tags". A
  `Layer`, in reverse, is "You can't add more Layers but you can rename them".
- **Using `Rendering Layer` on the built-in pipeline.** The docs wrote "doesn't
  support Rendering Layers".
- **Stacking a character on body part layers alone.** When two characters
  overlap, hands and torsos interleave. `SortingGroup` exists for that problem.
- **Using `SortingGroup` without limit.** "The maximum number of sorting groups
  and renderers is 4096".
- **Reordering the layer list lightly.** One drag changes the draw order of the
  whole project.

## Summary

- The clipping's two criteria are **right.** The layer decides the group and
  `Order in Layer` the front-to-back inside it — the property description is
  **"Renderer's order within a sorting layer"**.
- But the docs call those two **"other, higher priority, criterias"** and put a
  **third criterion** underneath, for when they can't tell the order. That
  criterion is distance.
- How distance is measured is a camera setting. **A perspective camera uses
  distance to the pivot, an orthographic one distance along the view
  direction**, by default, and there are four modes.
- **For isometric and 2.5D the docs directly recommend `CustomAxis` +
  `(0.0f, 1.0f, 0.0f)`**, instead of rewriting `Order in Layer` every frame.
- The `Tags and Layers` window has **four** sections and three of them carry
  "Layer". **Only `Sorting Layer` decides draw order** — `Layer` is "restrict
  operations such as raycasting or rendering", `Rendering Layer` is "which
  lights or decals affect which GameObjects", and `Tag` is "marker values ... to
  identify objects".
- **Tag's and Layer's constraints are each other's opposite.** A Tag can be
  added and not renamed; a Layer can be renamed and not added. `Rendering Layer`
  **isn't supported on the built-in pipeline.**
- **`SortingLayer.id` is not the order.** The docs say not to compare with it,
  and give `GetLayerValueFromName` + `CompareTo` instead.
- **A layer name typo quietly goes to Default.** `NameToID` gives 0, Default's
  id is 0, and `IsValid(0)` is true. That's a conclusion stitched from three
  sentences and I found no single sentence saying it. The remedy is to look the
  name up in `SortingLayer.layers`.
- `Order in Layer`'s range is **-32768 to 32767**. Multiplying coordinates into
  it reaches that end.
- The problem of a multi-sprite character drawing interleaved has
  **`SortingGroup`**. Descendants sort only among themselves, so body part
  layers are reusable per character, they nest, and **the ceiling is 4096**.
- You can pick the **point** distance is measured to — `spriteSortPoint`'s
  `Center` and `Pivot`.

---

### References

- [Tags and Layers — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/class-TagManager.html)
- [GameObject.CompareTag — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/GameObject.CompareTag.html)
- [SortingLayer — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/SortingLayer.html)
- [Renderer.sortingLayerID — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Renderer-sortingLayerID.html)
- [Renderer.sortingLayerName — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Renderer-sortingLayerName.html)
- [Renderer.sortingOrder — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Renderer-sortingOrder.html)
- [SortingGroup — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Rendering.SortingGroup.html)
- [SpriteRenderer.spriteSortPoint — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/SpriteRenderer-spriteSortPoint.html)
- [SpriteSortPoint — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/SpriteSortPoint.html)
- [Camera.transparencySortMode — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-transparencySortMode.html)
- [Camera.transparencySortAxis — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-transparencySortAxis.html)
- [TransparencySortMode — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/TransparencySortMode.html)

The starting point for this post was
[유니티 학습 일지 #3 | Sorting Layer 와 Order in Layer](https://bigchoiiistudio.tistory.com/5)
(bigchoiii, 2023-04-24), in Korean; the quotes from it are my translations. I
followed its explanation of the two criteria and of why both are used as
written, and checked each item against both the current Unity 6.6 manual and
the scripting reference. The third criterion and the `SortingGroup` side, which
aren't in the original, came from the scripting reference. Checked on
2026-10-13.
