---
pubDatetime: 2026-09-30T21:30:00+09:00
title: "Control Child Size Changes Who Gets Asked for the Size"
lang: en
translationKey: ugui-layout-group
featured: false
draft: false
tags:
  - Unity
  - C#
  - UI
  - UGUI
  - Layout
description: "The Inspector walkthrough of Layout Group is accurate. What's missing is why children collapse to 0 when you tick Control Child Size. That checkbox makes the group read sizes from layout element properties instead of the Rect Transform, and a bare RectTransform answers 0."
---

I clipped this while placing UI by hand and finding it **inconvenient to redo
coordinates just to handle different screen sizes** — I was looking for another
way. It's a 2023 write-up that walks through Unity's three layout groups
property by property, with screenshots of each horizontal/vertical option
toggled on and off.

**The Inspector walkthrough is accurate.** What the three types are, that only
one fits on an object, that a child's position locks — all correct. The
per-property screenshots match the real behavior too.

One spot snags. The post says that ticking `Control Child Size` makes children
disappear, and then **defers the reason.**

> *(There are other ways to make use of Control Child Size, involving
> combinations with other components, and I'll add that content once I've
> learned it.)*

The part it defers is the heart of the component. **That checkbox isn't a
switch for controlling a child's size — it's a switch for who gets asked what
the size is.**

## Table of Contents

## The Inspector Walkthrough Is Accurate

Start with what's right. The clipping defines a layout group like this.

> A layout group is **a component for managing the placement of child UI
> objects all at once.**

Correct. And so is the claim that only one fits.

> Also, **an object can only contain one layout group component.**

That isn't a coincidence, it's a declared constraint. All three types inherit
from an abstract class called `LayoutGroup`, and that class carries
`DisallowMultipleComponent`.

```csharp
[DisallowMultipleComponent]
[ExecuteAlways]
[RequireComponent(typeof(RectTransform))]
public abstract class LayoutGroup : UIBehaviour, ILayoutElement, ILayoutGroup
{
```

`DisallowMultipleComponent` blocks duplicates **relative to the class it's
declared on.** So even though `HorizontalLayoutGroup` and `GridLayoutGroup` are
different classes, both inherit `LayoutGroup`, and they won't sit on the same
object together. If you want horizontal and grid at once, **you need one more
object, nested.**

The three types, laid out:

| Component | Child placement | Child size | As children grow |
| --- | --- | --- | --- |
| Horizontal Layout Group | One row, across | Can differ per child | The row gets longer |
| Vertical Layout Group | One column, down | Can differ per child | The column gets longer |
| Grid Layout Group | A grid | All identical via `Cell Size` | Wrapping kicks in |

One small thing. The clipping's intro has the English names swapped — "수평
레이아웃 그룹(Vertical Layout Group), 수직 레이아웃 그룹(Horizontal Layout
Group)", that is, *horizontal* labeled Vertical and *vertical* labeled
Horizontal. The body text and the screenshots use the right ones so it doesn't
hurt the read, but a first-timer who picks a component off that one line picks
the wrong one.

## The Child's Position Locks Because of Driven Properties

The clipping writes:

> When a layout group component is added, the child objects of that object
> **cannot have their anchors or x, y coordinates modified** in the Rect
> Transform.

Correct. But stopping at "because the layout group manages them" can't explain
**why Width is still editable.** With `Control Child Size` off, the child's
Width field stays open. The same component manages both, yet one field locks
and the other doesn't.

The reason is `DrivenRectTransformTracker`. When a layout group places a child,
it registers **only the fields it actually overwrites** with the tracker.
Registered fields grey out in the Inspector. There are two code paths for
placing a child; the one that also sets a size looks like this.

```csharp
protected void SetChildAlongAxisWithScale(RectTransform rect, int axis, float pos, float size, float scaleFactor)
{
    if (rect == null)
        return;

    m_Tracker.Add(this, rect,
        DrivenTransformProperties.Anchors |
        (axis == 0 ?
            (DrivenTransformProperties.AnchoredPositionX | DrivenTransformProperties.SizeDeltaX) :
            (DrivenTransformProperties.AnchoredPositionY | DrivenTransformProperties.SizeDeltaY)
        )
    );
    // ...
}
```

The path that doesn't set a size leaves `SizeDelta` out.

```csharp
protected void SetChildAlongAxisWithScale(RectTransform rect, int axis, float pos, float scaleFactor)
{
    if (rect == null)
        return;

    m_Tracker.Add(this, rect,
        DrivenTransformProperties.Anchors |
        (axis == 0 ? DrivenTransformProperties.AnchoredPositionX : DrivenTransformProperties.AnchoredPositionY));
    // ...
}
```

Both paths register `Anchors` and `AnchoredPosition`. That's why **anchors and
position always lock.** `SizeDelta` is registered only when `Control Child Size`
is on, which is why **Width/Height locks and unlocks with that checkbox.**

| Control Child Size | Locked fields | Fields left open |
| --- | --- | --- |
| Off | Anchors, Pos X, Pos Y | Width, Height |
| Width only | Anchors, Pos X, Pos Y, Width | Height |
| Both | Anchors, Pos X, Pos Y, Width, Height | (none) |

Writing into a locked field gets reverted on the next layout pass. **A greyed
field doesn't mean "don't touch" — it means "whatever you write here is about
to be erased."**

## Control Child Size Changes Who Gets Asked for the Size

This is the spot the clipping defers. The symptom is recorded precisely.

> With no other settings, ticking Width or Height on Control Child Size makes
> **that value turn to 0 and vanish**, and when used together with Child Force
> Expand (covered below) it gets set to fill all the remaining space.

The observation is right. But "it becomes 0" and "it fills the space when you
also tick Child Force Expand" look like two separate facts, and in reality
**they come out of the same single sentence.**

That sentence is the official docs' description of `childControlWidth`.

> Returns true if the Layout Group controls the widths of its children.
> **Returns false if children control their own widths.**

How you read it matters. This isn't "the layout group sets the size / doesn't
set the size" — it's **"the size comes from the layout group / the size comes
from the child."** The source makes it obvious at a glance.

```csharp
private void GetChildSizes(RectTransform child, int axis, bool controlSize, bool childForceExpand,
    out float min, out float max, out float preferred, out float flexible)
{
    if (!controlSize)
    {
        min = child.sizeDelta[axis];
        max = min;
        preferred = min;
        flexible = 0;
    }
    else
    {
        min = LayoutUtility.GetMinSize(child, axis);
        max = LayoutUtility.GetMaxSize(child, axis);
        preferred = LayoutUtility.GetPreferredSize(child, axis);
        flexible = LayoutUtility.GetFlexibleSize(child, axis);
    }

    if (childForceExpand)
        flexible = Mathf.Max(flexible, 1);
}
```

With `controlSize` off, min and preferred are both `child.sizeDelta` — **the
value the child has written in its Inspector.** With it on, `LayoutUtility` goes
and **asks the layout element components attached to the child.**

So the reason a child becomes 0 is one sentence. The auto layout docs say it
outright.

> Any Game Object with a Rect Transform on it can function as a layout element.
> **They will by default have minimum, preferred, and flexible sizes of 0.**

An empty object with nothing but a Rect Transform answers 0 to everything. From
there the allocation rule just runs.

> **First minimum sizes are allocated.** If there is sufficient available space,
> preferred sizes are allocated. If there is additional available space,
> flexible size is allocated.

Minimum 0, preferred 0, flexible multiplier 0. The result is 0. **That's not a
bug, it's an honest answer.** The child doesn't know how to state a size, and
you asked it for one.

| | Control Child Size off | Control Child Size on |
| --- | --- | --- |
| Who gets asked | The child's Rect Transform | The child's layout element properties |
| Bare RectTransform | The Inspector's Width value | 0 |
| Image (with a sprite) | The Inspector's Width value | The sprite's size |
| Text | The Inspector's Width value | The size that fits the text |
| Layout Element | The Inspector's Width value | The Preferred Width written there |

That `Image` and `Text` hold an answer is in the docs.

> **The Image and Text components are two examples of components that provide
> layout element properties.** They change the preferred width and height to
> match the sprite or text content.

But `Image`'s answer comes from the sprite. Empty means 0.

```csharp
public virtual float preferredWidth
{
    get
    {
        if (activeSprite == null)
            return 0;
        if (type == Type.Sliced || type == Type.Tiled)
            return Sprites.DataUtility.GetMinSize(activeSprite).x / pixelsPerUnit;
        return activeSprite.rect.size.x / pixelsPerUnit;
    }
}
```

An object made with `GameObject > UI > Image` has an empty Source Image. **If a
child still vanishes after you added an Image, the sprite is the missing
piece.**

So the "other component" the clipping deferred is **`Layout Element`**. Attach
it to the child, fill in the values, and the answer that comes back isn't 0.

> **Preferred Width:** Specifies the preferred width of this layout element
> before allocating additional available width.

When more than one component on an object can answer — say an `Image` and a
`Layout Element` together — priority decides.

> **Layout Priority:** The layout priority for this component. If a GameObject
> has more than one component with layout properties (for example, an Image
> component and a LayoutElement component), **the layout system uses the
> property values from the component with the highest Layout Priority.**

`Layout Element` is declared with `m_LayoutPriority = 1`, and `Image`'s
`layoutPriority` is `{ get { return 0; } }`. So with both attached,
`Layout Element` wins. To flip that, lower the priority number.

## Child Force Expand Isn't an Even Split, It's flexible = 1

The clipping explains `Child Force Expand` this way.

> **Child Force Expand** decides whether leftover space gets **divided into n
> equal parts.**

And again.

> When there are few child objects and space is left over, it **divides the
> space into n equal parts regardless of the Spacing value.**

The screen it observed does look that way. But that's **an even split only at
default values.** What the checkbox actually does is the last two lines of the
`GetChildSizes` above.

```csharp
if (childForceExpand)
    flexible = Mathf.Max(flexible, 1);
```

What divides the leftover is that `flexible` value, and the docs define what it
means.

> **Flexible Width:** Defines the relative amount of additional available width
> this layout element takes up compared to its siblings.

A relative amount, not an even division. The placement code shows it directly.

```csharp
float surplusSpace = size - GetTotalPreferredSize(axis);

if (surplusSpace > 0)
{
    if (GetTotalFlexibleSize(axis) == 0)
        pos = GetStartOffset(axis, GetTotalPreferredSize(axis) - (axis == 0 ? padding.horizontal : padding.vertical));
    else if (GetTotalFlexibleSize(axis) > 0)
        itemFlexibleMultiplier = surplusSpace / GetTotalFlexibleSize(axis);
}
// ...
float childSize = Mathf.Lerp(min, preferred, minMaxLerp);
childSize += flexible * itemFlexibleMultiplier;
```

It divides the leftover by the sum of `flexible` to get a multiplier, then hands
each child **its own `flexible` times that.** If three children are all at the
default 0, `Child Force Expand` raises all three to 1, so 1:1:1 — an even split.
But attach a `Layout Element` to just the middle child and give it Flexible
Width 3, and you get **1:3:1**.

The `Mathf.Max` matters here. `Child Force Expand` **can only raise.** If you
lowered a Flexible Width to 0.5 with a `Layout Element`, the checkbox pushes it
back to 1. To keep one specific child from stretching, turn the checkbox off and
set `flexible` per child instead.

"Regardless of the Spacing value" is worth one more layer too. `Spacing` isn't
ignored. The last line of the loop is this.

```csharp
pos += childSize * scaleFactor + spacing;
```

The surplus is added to **the slot the child occupies (`childSize`)**, and
`spacing` is added on top of that. With `Control Child Size` off, the child
itself doesn't grow — only the slot does — so **it looks like the gaps widened.**
What actually widened is the slots, and `Spacing` is still sitting between them.

| Control Child Size | Child Force Expand | Result |
| --- | --- | --- |
| Off | Off | Children keep their size, leftover piles toward `Child Alignment` |
| Off | On | Children keep their size, slots grow so gaps widen |
| On | Off | Children stop at preferred size, leftover stays leftover |
| On | On | Children stretch to fill leftover by `flexible` ratio |

## Grid's Flexible Is Computed Two Different Ways

The clipping explains the grid's `Constraint` like this.

> With the default value Flexible, it places by Start Corner and Start Axis, and
> **when the next object to place would fall outside the layout group's area, it
> automatically breaks to a new column or row.**

As far as placement goes, that's accurate. The code that decides the actual
column count is exactly that.

```csharp
if (cellSize.x + spacing.x <= 0)
    cellCountX = int.MaxValue;
else
    cellCountX = Mathf.Max(1, Mathf.FloorToInt((width - padding.horizontal +
                 spacing.x + 0.001f) / (cellSize.x + spacing.x)));
```

Take its own width, subtract the padding, divide by one cell plus one gap.
Narrow the width and columns drop and wrapping appears.

What's missing is **the answer the grid gives when something asks "how much do
you need?"** That question arrives when you attach a `Content Size Fitter`, or
when you make the grid a child of another layout group with `Control Child Size`
on. The code that runs then is completely different.

```csharp
else
{
    totalMax = LayoutUtility.DefaultMaxSize;
    totalMin = padding.horizontal + cellWidthWithSpacing - spacing.x;

    float squareRootOfChildren = Mathf.Sqrt(rectChildren.Count);
    int preferredColumnCount = Mathf.CeilToInt(squareRootOfChildren);

    totalPreferred = padding.horizontal + cellWidthWithSpacing *
                    preferredColumnCount - spacing.x;
}
```

Under `Flexible`, the grid's **minimum width is one column** and its **preferred
width is the ceiling of the square root of the child count, in columns.** Ten
children means a preferred width of 4 columns; twenty means 5. It's a value
aiming at roughly a square.

Which produces this. Put a `Content Size Fitter` with Horizontal Fit =
`Preferred Size` on a `Flexible` grid and **you get something close to a square
regardless of how many columns you wanted.** If you wanted 6 columns, the right
answer is `Fixed Column Count` at 6. There, minimum and preferred are both
exactly 6 columns wide.

```csharp
if (m_Constraint == Constraint.FixedColumnCount)
{
    totalMin = totalMax = totalPreferred = padding.horizontal +
              cellWidthWithSpacing * m_ConstraintCount - spacing.x;
}
```

| Constraint | What sets the actual column count | The width it asks for |
| --- | --- | --- |
| Flexible | Its own Rect's width | Min 1 column, preferred `ceil(√count)` columns |
| Fixed Column Count | `Constraint Count` | Exactly `Constraint Count` columns |
| Fixed Row Count | count ÷ `Constraint Count` (rounded up) | That computed column count |

The clipping's warning that "with the Fixed settings, child objects may fall
outside the layout area" is explained here too. Fixed pins the column count, so
it won't wrap even when the width falls short. If overflow bothers you, **widen
it**, or attach a `Content Size Fitter` so **the grid actually gets the width it
asked for.**

## Where and Why You'd Use It

### A Ranking List That Stacks Vertically

In [the post on taking a name through an InputField](/posts/ugui-inputfield-name-entry/),
the name entry window was built by placing a background image and a button by
hand. With two or three items that's fine. Build a ranking board out of those
names and the item count is decided at runtime, so there are no coordinates to
place by hand.

The hierarchy goes like this.

```
RankingPanel            (Image)
└─ Content              (Vertical Layout Group, Content Size Fitter)
   ├─ RankingRow(Clone) (Horizontal Layout Group)
   ├─ RankingRow(Clone)
   └─ ...
```

`Content`'s settings:

| Property | Value | Why |
| --- | --- | --- |
| Padding | 16 / 16 / 12 / 12 | Margin from the panel edge |
| Spacing | 8 | Gap between rows |
| Child Alignment | Upper Center | Fill from the top even with few items |
| Control Child Width | On | Match row width to the panel width |
| Control Child Height | On | Let each row ask for its own height |
| Child Force Expand Width | On | Rows take up the leftover width |
| Child Force Expand Height | **Off** | Rows must not stretch vertically |

Turning `Child Force Expand Height` off is the key. Leave it on and, with three
items, a single row stretches to a third of the panel height. Off, each row uses
only the height it asked for, and the leftover sits below per `Child Alignment`.

The row prefab (`RankingRow`) gets a `Layout Element` with Preferred Height 48.
Without it, row height becomes 0 the moment `Control Child Height` is ticked —
for exactly the reason above.

Inside the row is a horizontal layout group.

| Child | Layout Element | Why |
| --- | --- | --- |
| RankText | Preferred Width 48, Flexible Width 0 | The rank column is fixed |
| NameText | Flexible Width 1 | The name eats the leftover width |
| ScoreText | Preferred Width 96, Flexible Width 0 | The score column is fixed |

`Child Force Expand Width` **must be off here.** Turn it on and
`Mathf.Max(flexible, 1)` raises rank and score to 1 as well, splitting the three
columns 1:1:1.

The code that fills it looks like this.

```csharp
using System;
using UnityEngine;

[Serializable]
public struct RankingEntry
{
    public string Name;
    public int Score;
}
```

```csharp
using UnityEngine;
using UnityEngine.UI;

public class RankingBoard : MonoBehaviour
{
    private const int MAX_ROW_COUNT = 50;

    [Header("References")]
    [SerializeField, Tooltip("The object carrying the Vertical Layout Group")]
    private RectTransform _content;

    [SerializeField, Tooltip("Row prefab. Give it a Preferred Height via Layout Element")]
    private RankingRow _rowPrefab;

    public void Rebuild(RankingEntry[] entries)
    {
        if (_content == null || _rowPrefab == null)
        {
            Debug.LogError("RankingBoard has an empty reference. Check the Inspector.");
            return;
        }

        for (int i = _content.childCount - 1; i >= 0; i--)
        {
            Destroy(_content.GetChild(i).gameObject);
        }

        int count = Mathf.Min(entries.Length, MAX_ROW_COUNT);
        for (int i = 0; i < count; i++)
        {
            // No coordinates. The layout group overwrites Anchors and AnchoredPosition.
            RankingRow row = Instantiate(_rowPrefab, _content);
            row.Bind(i + 1, entries[i].Name, entries[i].Score);
        }
    }
}
```

```csharp
using TMPro;
using UnityEngine;

public class RankingRow : MonoBehaviour
{
    [Header("Labels")]
    [SerializeField] private TMP_Text _rankLabel;
    [SerializeField] private TMP_Text _nameLabel;
    [SerializeField] private TMP_Text _scoreLabel;

    public void Bind(int rank, string playerName, int score)
    {
        _rankLabel.text = rank.ToString();
        _nameLabel.text = playerName;
        _scoreLabel.text = score.ToString("N0");
    }
}
```

The point is that there's no line setting coordinates after `Instantiate`. One
would be wiped on the next layout pass anyway.

### Filling It at Runtime and Reading the Size Right After

Call the code above and read `_content.rect.height` **in the same frame** and
you get the old value. Layout isn't computed immediately.

> **MarkLayoutForRebuild:** Mark the given RectTransform as needing it's layout
> to be recalculated during the **next layout pass**.

If you need to scroll to the bottom, or need the total height of the list you
just built right now, you can force one pass.

```csharp
using UnityEngine;
using UnityEngine.UI;

public class RankingBoardScroller : MonoBehaviour
{
    [Header("References")]
    [SerializeField] private RankingBoard _board;
    [SerializeField] private RectTransform _content;
    [SerializeField] private ScrollRect _scrollRect;

    public void ShowAndScrollToBottom(RankingEntry[] entries)
    {
        _board.Rebuild(entries);

        // Without this line, the height below is the pre-Rebuild value.
        LayoutRebuilder.ForceRebuildLayoutImmediate(_content);

        float height = _content.rect.height;
        Debug.Log($"Total list height: {height}");

        _scrollRect.verticalNormalizedPosition = 0f;
    }
}
```

The docs say to use this one sparingly.

> **ForceRebuildLayoutImmediate:** Forces an immediate rebuild of the layout
> element and child layout elements affected by the calculations.

The immediate computation is expensive because auto layout runs four passes.

> 1. The minimum, preferred, and flexible **widths** of layout elements are
>    calculated... This is performed in **bottom-up** order
> 2. The effective widths of layout elements are calculated and set... This is
>    performed in **top-down** order
> 3. The minimum, preferred, and flexible **heights** of layout elements are
>    calculated... bottom-up
> 4. The effective heights of layout elements are calculated and set...
>    top-down

And the order is fixed.

> the auto layout system evaluates **widths first and then evaluates heights
> afterwards.**

That order is also why stacking a `Content Size Fitter` on a layout group gives
odd results. The height stage runs after width is already settled, so **a layout
whose width depends on its height** — text that wraps to more lines and thus
grows taller, say — doesn't settle in one go and lands a frame late.

### Where Not to Use It

**A HUD with fixed coordinates.** UI at a fixed spot — health bar top left,
minimap top right — belongs on anchors. Add a layout group and `Anchors` and
`AnchoredPosition` lock, so you lose the way to place it at all.

**Text that changes every frame.** Put a score or a countdown that updates every
frame inside a layout group with `Control Child Size` on, and a layout rebuild
runs every time the character count changes. Pinning the width with a
`Layout Element`, or pulling it out of the group and anchoring it, is cheaper.

**Deeply nested layout groups.** A layout group inside a layout group with a
`Content Size Fitter` inside that multiplies the four passes above by the depth.
Two or three levels is workable; past that, check first whether one level can be
replaced by a `Layout Element`.

**A grid with varying cell sizes.** `Grid Layout Group` makes every child the
same size via `Cell Size`. If items need different sizes, stack horizontal
layout groups vertically instead, or write dedicated placement code.

## Wrapping Up

A child becoming 0 when you tick `Control Child Size` isn't surprising behavior.
**You changed who gets asked for the size, and the new respondent answered 0.**
One function, `GetChildSizes`, is the whole story — `child.sizeDelta` when it's
off, `LayoutUtility` when it's on.

The "other component" the clipping deferred is `Layout Element`. Attach it to
the child and fill in Preferred Width/Height, and the answer that comes back
isn't 0. If an `Image` or `Text` is already there, that one answers with the
sprite size or the text size, and when both are present the higher Layout
Priority wins.

The remaining properties get explained from the same spot. `Child Force Expand`
doesn't split leftover space evenly — it raises the floor of `flexible` to 1,
and the distribution follows the `flexible` ratio. The grid's `Flexible` decides
columns from its own width when placing, but offers `ceil(√count)` columns as
its preferred width when asked for a size.

---

### References

- [Auto Layout — uGUI Manual](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/UIAutoLayout.html)
- [Horizontal Layout Group — uGUI Manual](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-HorizontalLayoutGroup.html)
- [Grid Layout Group — uGUI Manual](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-GridLayoutGroup.html)
- [Layout Element — uGUI Manual](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-LayoutElement.html)
- [HorizontalOrVerticalLayoutGroup — uGUI API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.HorizontalOrVerticalLayoutGroup.html)
- [LayoutRebuilder — uGUI API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.LayoutRebuilder.html)
- [uGUI source — Unity-Technologies/uGUI](https://github.com/Unity-Technologies/uGUI)

The starting point for this post was [sam0308 — \[Unity\]\[UI\] 레이아웃 그룹(Layout Group)](https://sam0308.tistory.com/41)
(2023-03-31). I followed its property-by-property Inspector walkthrough and
checked the `Control Child Size` behavior it deferred against the current uGUI
manual and package source.
