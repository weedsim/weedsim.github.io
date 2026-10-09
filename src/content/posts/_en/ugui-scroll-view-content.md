---
pubDatetime: 2026-10-09T18:30:00+09:00
title: "What Decides Which Way Content Grows Is the Pivot, Not the Anchor"
lang: en
translationKey: ugui-scroll-view-content
featured: false
draft: false
tags:
  - Unity
  - C#
  - UI
  - UGUI
  - Layout
  - Scroll
description: "A tutorial on filling a Scroll View with Layout components. Follow it and you get a working one. But the axis it tells you to anchor is the axis the Content Size Fitter takes over, and the Pivot that decides the direction is never mentioned."
---

**I was building an inventory as a Scroll View** when I went looking and
clipped this tutorial. It's one part of a series written against 2021.3 LTS,
walking through — in screenshots and tables — removing the scrollbars and
attaching a `Horizontal Layout Group` and a `Content Size Fitter` to `Content`
to make a horizontal or vertical scroll. Follow it and you really do get one.
It's well written as introductory material.

Checking it against the docs turned up a few places where **the values are
right but the explanation is missing.** And one place where the setting it
tells you to make is overridden by another setting.

The biggest is the instruction about `Content`. The tutorial says this, in my
translation from the Korean:

> Set Anchor X and Y to Min = 0, Max = 1.

> Set the Content Size Fitter's Horizontal Fit property to Preferred Size.

Those two lines fight over the same axis. uGUI's Auto Layout page states what
happens to that axis.

> a Content Size Fitter which has the Horizontal Fit property set to Minimum
> or Preferred will drive the width of the Rect Transform on the same Game
> Object.

> The width will appear as read-only

And the property that actually decides **which direction** `Content` grows
never appears in the tutorial at all. It's the `Pivot`.

Five things checked out. **The axis the Content Size Fitter takes over becomes
driven and isn't even saved to the Scene**, **the direction of growth is
decided by the Pivot**, **setting a scrollbar reference to None and expanding
the Viewport are different settings**, **what actually clips the content isn't
in the tutorial**, and **the vertical section's "what's different" list
repeats the horizontal section's value.**

And one more, pointed at the goal. **An inventory isn't a single-axis list,
it's a grid, and the uGUI manual has a named recipe for that combination.** The
tutorial's single-axis recipe doesn't reach it.

This blog has
[Control Child Size changes who gets asked for the size](/en/posts/ugui-layout-group/).
That one was about **a layout group taking over its children's size and
position.** This post is one level up — **who takes the size away from the
`Content` that carries the layout group**, and how that meshes with the Scroll
View's structure. It doesn't hand anything off, though. Every explanation and
code sample it needs is reproduced here in full.

Checked on **2026-10-09** against uGUI **2.7.0**.

## Table of contents

## The axis the Content Size Fitter takes over becomes driven

First, what a `Content Size Fitter` is. The documentation's opening sentence
names it.

> The Content Size Fitter functions as a layout controller that controls the
> size of its own layout element.

**A layout controller.** It controls its own size. `Horizontal Fit` has
**four** values.

> Do not drive the width based on the layout element.

> Drive the width based on the minimum width of the layout element.

> Drive the width based on the preferred width of the layout element.

> Ensures that the width of the layout element stays within the minimum and
> maximum bounds.

That's `Unconstrained`, `Min Size`, `Preferred Size`, `Clamped` in order. The
word to read the descriptions by is **drive**. Two of them do and two don't.

| Value | Does it drive that axis? |
| --- | --- |
| `Unconstrained` | No ("Do not drive") |
| `Min Size` | **Yes** |
| `Preferred Size` | **Yes** |
| `Clamped` | No — it only bounds the size |

The `Preferred Size` the tutorial specifies is one of the driving ones. And
`Clamped` is a value I read properly for the first time writing this: it's the
only option that **puts a floor and a ceiling on the size without taking the
size over.** It fits places where a list item needs to be "neither too small
nor too large."

What happens to a driven axis is on the Auto Layout page.

> The width will appear as read-only

> those sizes and positions should not be manually edited at the same time
> through the Inspector or Scene View.

> Such changed values would just get reset by the layout controller on the
> next layout calculation anyway.

**It turns read-only in the inspector, and changing it by hand gets reset on
the next layout calculation.** There's one more line.

> the values of driven properties are not saved as part of the Scene

**It isn't even saved to the Scene.** So in a horizontal scroll, the
instruction to stretch `Content`'s Anchor X to Min=0, Max=1 — since the
`Content Size Fitter` takes over that axis's width — leaves no trace in the
result. It isn't a wrong setting; it's **a void one.**

Put another way, each axis has a different owner.

| Axis | In a horizontal scroll | Who decides |
| --- | --- | --- |
| Width (X) | the axis the children extend along | `Content Size Fitter`'s `Horizontal Fit` |
| Height (Y) | the axis that must match the Viewport | Anchor stretch (Min=0 Max=1 means something here) |

For a vertical scroll, X and Y swap. The tutorial telling you to set both axes
to Min=0 Max=1 at once is **writing down one meaningful axis and one void axis
together.** Since a working result comes out, it doesn't look like a flawed
procedure.

## The direction of growth is decided by the Pivot

So when the `Content Size Fitter` grows the width from 1000 to 2000, **which
way** does it grow? The tutorial has no answer; the documentation does.

> the resizing is around the pivot.

> This means that the direction of the resizing can be controlled using the
> pivot.

It even gives a concrete case.

> when the pivot is in the upper left corner, the Content Size Fitter will
> expand the Rect Transform down and to the right.

**Pivot in the upper left means it grows right and down.** Why that matters in
a Scroll View shows up immediately.

- **A horizontal list** has to start at the left and stack rightward → Pivot X
  of **0**
- **A vertical list** has to start at the top and stack downward → Pivot Y of
  **1**

Leave the pivot at center (0.5, 0.5) and `Content` grows both ways from its
middle. Every time an item is added, the items already there **get pushed
left.** In the Scene view it can look like "they're created left to right in
order", but that's what it looks like while `Content` is smaller than the
Viewport. The moment it overflows, it drifts.

The tutorial's horizontal screenshots showing a correct result mean that
project's `Content` pivot was already the right value. **Whether that's the
default or something the author set, I did not verify** — I couldn't find the
prefab's default in the documentation. Either way the conclusion is the same.
**The value the docs call the one that "controls the direction" appears nowhere
in the procedure.** In a project where the pivot is right, nothing goes wrong;
in one where it's wrong, there's no clue why.

## Widths first, heights afterwards

The Auto Layout page nails down the order.

> As can be seen from the above, the auto layout system evaluates widths first
> and then evaluates heights afterwards.

> Thus, calculated heights may depend on widths, but calculated widths can
> never depend on heights.

**Heights may depend on widths, but widths can never depend on heights.** That
one line makes horizontal and vertical lists asymmetric.

- **In a vertical list**, items whose height depends on their width — wrapping
  text being the obvious case — work. The width is settled first, and the
  height is computed from it.
- **In a horizontal list**, items whose width depends on their height do not
  work. The height isn't known yet when the width is computed.

So the tutorial's claim that horizontal and vertical are the same but for the
axis is **true of the setup procedure and not true of the behavior.** The
moment you use variable-size items, the horizontal side hits a wall first.

## An inventory isn't a single axis, it's a grid

What the tutorial uses is `Horizontal Layout Group` and
`Vertical Layout Group` — components that line items up in a row. An inventory
is **a grid, not a row**, and there's a component for that.

> The Grid Layout Group component places its child layout elements in a grid.

And this component has a property that meshes directly with the last two
sections: `Constraint`. Its description is short but states its purpose.

> Constraint the grid to a fixed number of rows or columns to aid the auto
> layout system.

**"to aid the auto layout system"** — you fix the row or column count in order
to **help** the layout system. The "widths first, heights afterwards" from the
previous section is why that's needed. With the column count fixed, the row
count falls out of the width, and the height falls out of the row count. With
the column count floating, that chain breaks.

What happens if you pick `Flexible` is written down too.

> The grid will attempt to make the row and column count approximately the
> same.

It **tries to keep rows and columns about equal.** Awkward for an inventory:
four items make a 2×2, nine make a 3×3. **The column count changes with the
item count.** The manual states the cost of that choice.

> will have no control over the specific number of rows and columns

So the manual gives the inventory combination **a name of its own**: "Fixed
width and flexible height", described like this.

> where the grid expands vertically as more elements are added

The three settings it lists, carried over as written:

| Item | The value the docs give |
| --- | --- |
| Grid Layout Group `Constraint` | "Fixed Column Count" |
| Content Size Fitter `Horizontal Fit` | "Preferred Size or Unconstrained" |
| Content Size Fitter `Vertical Fit` | "Preferred Size" |

And one condition is attached.

> If unconstrained Horizontal Fit is used, it's up to you to give the grid a
> width that is big enough

> to fit the specified column count of cells.

Leave `Horizontal Fit` at `Unconstrained` — that is, let the Anchor stretch fit
the width to the Viewport — and **it's on you to guarantee the width holds the
column count.** Cell size × columns + spacing overflowing the Viewport width
overflows.

Read alongside the last two sections, every setting on an inventory `Content`
is now determined.

| Axis | Who decides | Value |
| --- | --- | --- |
| Width (X) | Anchor stretch | Min X=0, Max X=1 / `Horizontal Fit` = `Unconstrained` |
| Height (Y) | `Content Size Fitter` | `Vertical Fit` = `Preferred Size` |
| Direction of growth | `Pivot` | Y = **1** (top down) |
| Position of the first cell | `Start Corner` | "The corner where the first element is located." → Upper Left |
| Fill order | `Start Axis` | "Horizontal will fill an entire row before a new row is started." |

Which is where the tutorial's both-axes Anchor instruction turns out to be
**half right for an inventory.** The width Anchor means something (because the
Fit is `Unconstrained`), and the height Anchor is eaten by `Vertical Fit`.

## Setting a scrollbar to None and expanding the Viewport are different settings

The tutorial's first table is the procedure for removing the scrollbars. Four
rows — set the ScrollRect's `Horizontal Scrollbar`/`Vertical Scrollbar` to
None, set the Viewport's Left/Top/Right/Bottom to 0, disable the two scrollbar
objects.

The first row the documentation backs. Here is the scrollbar reference
description.

> Optional reference to a horizontal scrollbar element.

**Optional.** It's a field you're allowed to leave empty. But the second row —
zeroing the Viewport's offsets by hand — **has a dedicated setting of its
own.** Each scrollbar has a `Visibility`, described like this.

> Whether the scrollbar should automatically be hidden when it isn't needed,
> and optionally expand the viewport as well.

And about one of its options it says this.

> the viewport is automatically expanded when the scrollbars are hidden

**The Viewport is expanded automatically when the scrollbars hide.** What the
tutorial does by hand is this setting's documented behavior.

The difference between the two shows up in practice.

| Approach | Scrollbars | When there are few items |
| --- | --- | --- |
| Reference None + object disabled | gone permanently | no change |
| `Auto Hide And Expand Viewport` | appear only when needed | Viewport takes the scrollbar's space |

If you mean **never to use scrollbars at all**, the tutorial's approach is
simple and clear. But if the goal was **"hide the scrollbars"**, there's no
reason to break the reference. Break it and you have to plug it back in before
you can bring a scrollbar back.

For reference, `Content` and `Viewport` are **references** in the docs too.

> This is a reference to the Rect Transform of the UI element to be scrolled,
> for example a large image.

> Reference to the viewport Rect Transform that is the parent of the content
> Rect Transform.

They're inspector fields, not hierarchy rules. "Content is a child of the
Viewport object" describes how the prefab is shaped; how the ScrollRect finds
those two is by reference.

Worth adding that the API reference words the same property slightly
differently.

> The content that can be scrolled. It should be a child of the GameObject
> with ScrollRect on it.

The manual says the Viewport is Content's parent; the API says Content is a
child of the GameObject carrying the ScrollRect. Since the Viewport is itself a
child of that object, Content is a **descendant**, not a direct child. Knowing
the prefab's shape both read as the same thing, but when you build it by hand
the manual's wording is the accurate one.

## What does the clipping isn't in the tutorial

The core behavior of a Scroll View is that only the Viewport area shows and
the rest doesn't. The tutorial explains that at length — Content keeps growing
but what you see is Viewport-sized. Correct. But **which component does the
hiding isn't written down.** In the documentation it is.

> Usually a Scroll Rect is combined with a Mask in order to create a scroll
> view, where only the scrollable content inside the Scroll Rect is visible.

> The viewport has a Mask component.

`ScrollRect` **does not clip.** It handles dragging and the scroll position;
what clips is the mask on the Viewport. The two are bundled together, so while
you use the prefab you never need to separate them — and **it only surfaces
when you build one yourself.** With no mask on the Viewport, Content shows
right past the Scroll View's edge. Scrolling still works. So the symptom isn't
"scrolling is broken", it's "everything is visible."

## The vertical section's "what's different" repeats the same value

The vertical scroll section opens with "almost identical; here's what's
different" and lists four items. This is the first of them, in my translation:

> Set the Scroll View object to **Width = 1000 / Height = 300**.

That's the **same** as the horizontal section's value. The horizontal
section's table also says `Width = 1000 / Height = 300`. It's listed as a
difference and it isn't different.

The value itself doesn't suit a vertical list either. 1000×300 is a box that's
wide and short. Put a list that stacks downward inside it and one or two items
show at a time while space goes spare left and right. The vertical section's
screenshot shows exactly that state.

**This reads as a copy-paste slip.** The other three items (uncheck
Horizontal, `Vertical Layout Group`, `Vertical Fit = Preferred Size`) are
accurate. For a vertical list, raising the Height and cutting the Width is the
right move.

## Leave Movement Type alone and the list bounces

What the tutorial touches on the ScrollRect is the `Horizontal`/`Vertical`
checkboxes and the scrollbar references. Everything else stays at its default,
and one of those defaults is felt immediately: `Movement Type`.

> Unrestricted, Elastic or Clamped. Use Elastic or Clamped to force the
> content to remain within the bounds of the Scroll Rect.

Three values, and about `Elastic` it says this.

> Elastic mode bounces the content when it reaches the edge of the Scroll Rect

**It bounces at the edge.** Natural for a mobile list, grating for a short
list in a settings screen. The amount of bounce is its own field.

> This is the amount of bounce used in the elasticity mode.

That's `Elasticity`. And the gliding that continues after you let go is a
setting too.

> When Inertia is set the content will continue to move when the pointer is
> released after a drag.

> When Inertia is set the deceleration rate determines how quickly the
> contents stop moving.

`Inertia` and `Deceleration Rate`. Mouse wheel sensitivity as well.

> The sensitivity to scroll wheel and track pad scroll events.

The tutorial not mentioning these four is a reasonable omission for
introductory material. Still worth noting that the answer to "I built it and
it feels wrong" is entirely in those four. To stop dead at the edge,
`Clamped`; to kill the glide, turn `Inertia` off.

## Where and why you'd use it

### A working example

The tutorial's structure kept, with the points above guaranteed in code. It
sets the values that are easy to miss in the inspector (the pivot, the per-axis
Fit) once at runtime.

```csharp file="Scripts/UI/ScrollListBuilder.cs"
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(ScrollRect))]
public class ScrollListBuilder : MonoBehaviour
{
    private const float Spacing = 10f;

    [Header("References")]
    [Tooltip("Goes on Content. Left empty, it's taken from ScrollRect.content.")]
    [SerializeField]
    private RectTransform _content;

    [Tooltip("Item prefab. Safer if it carries a Layout Element.")]
    [SerializeField]
    private RectTransform _itemPrefab;

    [Header("Direction")]
    [Tooltip("On for a horizontal list, off for a vertical one")]
    [SerializeField]
    private bool _isHorizontal = true;

    private ScrollRect _scrollRect;

    private void Awake()
    {
        if (!TryGetComponent(out _scrollRect))
        {
            Debug.LogError("There is no ScrollRect.", this);
            return;
        }

        if (_content == null)
        {
            _content = _scrollRect.content;
        }

        ConfigureContent();
    }

    // The two things the tutorial omits get set here — pivot and per-axis Fit.
    private void ConfigureContent()
    {
        if (_content == null)
        {
            Debug.LogError("Content is empty.", this);
            return;
        }

        // Docs: "the direction of the resizing can be controlled using
        // the pivot." Horizontal starts at the left (0), vertical at the top (1).
        _content.pivot = _isHorizontal
            ? new Vector2(0f, 0.5f)
            : new Vector2(0.5f, 1f);

        ConfigureLayoutGroup();
        ConfigureFitter();

        _scrollRect.horizontal = _isHorizontal;
        _scrollRect.vertical = !_isHorizontal;
    }

    private void ConfigureLayoutGroup()
    {
        // Keep only the group that matches the axis. Both attached and they
        // overwrite each other.
        HorizontalOrVerticalLayoutGroup group = _isHorizontal
            ? GetOrAdd<HorizontalLayoutGroup>()
            : (HorizontalOrVerticalLayoutGroup)GetOrAdd<VerticalLayoutGroup>();

        group.spacing = Spacing;
        group.childAlignment = TextAnchor.MiddleCenter;
    }

    private void ConfigureFitter()
    {
        ContentSizeFitter fitter = GetOrAdd<ContentSizeFitter>();

        // Preferred only on the growing axis; Unconstrained on the other.
        // The Unconstrained axis is handled by the Anchor stretch.
        fitter.horizontalFit = _isHorizontal
            ? ContentSizeFitter.FitMode.PreferredSize
            : ContentSizeFitter.FitMode.Unconstrained;

        fitter.verticalFit = _isHorizontal
            ? ContentSizeFitter.FitMode.Unconstrained
            : ContentSizeFitter.FitMode.PreferredSize;
    }

    public void Build(int itemCount)
    {
        if (_content == null || _itemPrefab == null)
        {
            Debug.LogError("A reference is empty.", this);
            return;
        }

        for (int i = _content.childCount - 1; i >= 0; i--)
        {
            Destroy(_content.GetChild(i).gameObject);
        }

        for (int i = 0; i < itemCount; i++)
        {
            Instantiate(_itemPrefab, _content);
        }

        // Layout runs once at the end of the frame. To read the size now, or
        // to set the scroll position, it has to be forced.
        LayoutRebuilder.ForceRebuildLayoutImmediate(_content);

        ScrollToStart();
    }

    private void ScrollToStart()
    {
        if (_isHorizontal)
        {
            _scrollRect.horizontalNormalizedPosition = 0f;
        }
        else
        {
            // For vertical, 1 is the top. Not 0.
            _scrollRect.verticalNormalizedPosition = 1f;
        }
    }

    private T GetOrAdd<T>() where T : Component
    {
        if (_content.TryGetComponent(out T existing))
        {
            return existing;
        }

        return _content.gameObject.AddComponent<T>();
    }
}
```

There's a reason `_content`, `_itemPrefab` and `_scrollRect` don't use `?.`.
All are `UnityEngine.Object`, and a reference left empty in the inspector can
end up in a state that **looks like null without being C#'s null.** So the
comparison is `== null`. For a plain C# object `?.` is right.

Why `LayoutRebuilder.ForceRebuildLayoutImmediate` is needed, and when the
layout update actually runs, is written up in
[Control Child Size changes who gets asked for the size](/en/posts/ugui-layout-group/).
In short, the layout calculation runs at **the end of the frame** rather than
immediately, and reading the total size of a list you just built before that
gives you the previous value.

Worth noting that **1 is the top** for `verticalNormalizedPosition`. The API
reference defines only the 0 end.

> The vertical scroll position as a value between 0 and 1, with 0 being at the
> bottom.

> The horizontal scroll position as a value between 0 and 1, with 0 being at
> the left.

0 is the bottom and 0 is the left. So to push a freshly filled list to the top
you set **1**. Horizontal is 0.

### How to choose

| What you want | Where |
| --- | --- |
| An inventory that stacks in a grid | `Grid Layout Group` + `Constraint` = Fixed Column Count |
| The size of the axis items extend along | that axis's Fit on the `Content Size Fitter` |
| The size of the other axis | Anchor stretch (Fit at `Unconstrained`) |
| The **direction** of growth | `Content`'s **Pivot** |
| Spacing between items | the layout group's `Spacing` |
| Keeping content from showing outside the Viewport | the Viewport's **Mask** |
| Removing the scrollbars permanently | reference to None + objects disabled |
| Showing scrollbars only when needed | the scrollbar `Visibility` |
| No bounce at the edge | `Movement Type = Clamped` |
| No glide after letting go | `Inertia` off |

The rule for picking axes:

- **The axis the item count grows along** → the `Content Size Fitter` owns it.
  Don't touch that axis's Anchor. It's driven and isn't saved anyway.
- **The axis that must match the Viewport** → the Anchor stretch owns it. That
  axis's Fit is `Unconstrained`.
- **Setting both to Preferred Size** is almost always wrong in a Scroll View.
  Let Content grow freely both ways and its relationship to the Viewport is
  gone.

If you're going to use variable-size items, **consider vertical first.**
Widths are computed before heights, so items whose height depends on width
work in a vertical list and don't in a horizontal one.

### Where not to use it

- **Trying to set the Anchor or size of a Fit-driven axis in the inspector.**
  It turns read-only, changes get reset on the next calculation, and it isn't
  saved to the Scene.
- **Content left at the default pivot (0.5, 0.5).** It grows both ways as
  items are added, pushing the existing ones aside.
- **A hand-built Scroll View with no mask on the Viewport.** Scrolling works
  and everything shows. The symptom doesn't look like a scroll problem.
- **Items whose width depends on their height in a horizontal list.** The docs
  say "calculated widths can never depend on heights".
- **Stacking hundreds of items straight into a layout group plus Content Size
  Fitter.** As items grow, the update cost grows with them. Past that point you
  need a reuse (pooling) structure.
- **Breaking a scrollbar reference in order to "hide" it.** You'll have to plug
  it back in to bring it back. If hiding is the goal, `Visibility` is the
  field.

## Summary

- `Content Size Fitter` is a **layout controller**. An axis given
  `Preferred Size` is **driven**: read-only in the inspector, reset if changed
  by hand, and **not saved as part of the Scene.**
- `Fit` has **four** values. Only `Min Size` and `Preferred Size` drive;
  `Unconstrained` and `Clamped` don't. **`Clamped` is the only one that bounds
  the size without taking it over.**
- So of the tutorial's "Anchor X and Y to Min=0, Max=1", **the Fit-driven axis
  leaves no trace in the result.** Not a wrong setting — a void one.
- **The direction of growth is decided by the Pivot.** The docs say "the
  direction of the resizing can be controlled using the pivot", and the pivot
  appears nowhere in the tutorial. Horizontal is X=0, vertical is Y=1.
- Layout computes **widths first, heights afterwards.** "Heights may depend on
  widths, but widths can never depend on heights." Horizontal and vertical are
  symmetric in procedure and not in behavior.
- The scrollbar reference is **"Optional"**, so leaving it empty is fine. But
  expanding the Viewport by hand has a dedicated setting — **`Visibility`** —
  which expands the Viewport automatically when the scrollbars hide.
- What clips the content isn't the `ScrollRect` but **the Viewport's Mask.**
  The docs say "The viewport has a Mask component." Miss it when building by
  hand and it shows up as "everything is visible."
- The first line of the vertical section's "what's different" carries **the
  same `Width = 1000 / Height = 300` as the horizontal section.** It reads as a
  copy slip, and it isn't a ratio suited to a vertical list either.
- `Movement Type`, `Elasticity`, `Inertia` and `Scroll Sensitivity` all stay at
  their defaults. The answer to "it feels wrong" is in those four.
- **An inventory is a grid.** The manual has a combination named "Fixed width
  and flexible height": `Constraint` = Fixed Column Count, `Horizontal Fit` =
  Unconstrained, `Vertical Fit` = Preferred Size. `Flexible` tries to keep
  "the row and column count approximately the same", so the column count moves
  with the item count.

---

### References

- [Scroll Rect — uGUI manual](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-ScrollRect.html)
- [Content Size Fitter — uGUI manual](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-ContentSizeFitter.html)
- [Auto Layout — uGUI manual](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/UIAutoLayout.html)
- [Horizontal Layout Group — uGUI manual](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-HorizontalLayoutGroup.html)
- [Grid Layout Group — uGUI manual](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-GridLayoutGroup.html)
- [Layout Element — uGUI manual](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-LayoutElement.html)
- [LayoutRebuilder — uGUI API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.LayoutRebuilder.html)
- [ContentSizeFitter — uGUI API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.ContentSizeFitter.html)
- [ScrollRect — uGUI API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.ScrollRect.html)
- [ContentSizeFitter.FitMode — uGUI API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.ContentSizeFitter.FitMode.html)

The starting point for this post was
[\[유니티 기초\] UI 편 - Layout 컴포넌트를 이용한 Scroll View 항목 생성](https://ugames.tistory.com/entry/%EC%9C%A0%EB%8B%88%ED%8B%B0-%EA%B0%95%EC%9D%98-UI-%ED%8E%B8-Scroll-View-2-%EC%8B%A4%EC%82%AC%EC%9A%A9-%EC%98%88%EC%A0%9C)
(레오란다, 2022-12-05), in Korean. It's one part of a series written against
Unity 2021.3 LTS; the quotes from it are my translations. I followed its setup
procedure as written and checked each item against the current uGUI 2.7.0
manual and API reference. Checked on 2026-10-09.
