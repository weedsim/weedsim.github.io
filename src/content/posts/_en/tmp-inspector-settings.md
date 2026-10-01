---
pubDatetime: 2026-10-01T19:30:00+09:00
title: "Override Tags Doesn't Ignore Tags"
lang: en
translationKey: tmp-inspector-settings
featured: false
draft: false
tags:
  - Unity
  - C#
  - UI
  - UGUI
  - TextMeshPro
description: "A walkthrough of the TextMeshPro Inspector where four fields point at the wrong thing. Override Tags only ignores color tags, Text Wrapping Mode has no Overflow value, Extra Settings holds neither outline nor shadow, and Text Style isn't Font Style."
---

I clipped this while looking into how to use **TextMeshPro, which is said to
give better quality and let you use a wider range of fonts**, instead of the
legacy UI. It's a 2025 write-up that numbers the items visible in one Inspector
screenshot and explains them top to bottom.

The list of field names and values is mostly right. The note that `Font Asset`
holds an SDF texture is right, so are the four `Spacing Options`, and so is the
fact that `Alignment` has nine directions.

But **four fields point at the wrong thing.** Not misread names — the thing a
field does was written down as the thing the field next to it does.

| What the clipping says | What it is |
| --- | --- |
| Override Tags: ignores tags | Ignores only tags that change color |
| Text Wrapping Mode: Normal / Overflow | Wrapping and Overflow are separate fields |
| Extra Settings: outline, shadow, border | Those are the material |
| Text Style: combining Bold, Italic | That's Font Style |

These aren't four independent slips. **The TextMeshPro Inspector is three
different assets' settings stacked into one panel**, and reading it as a flat
one-line list produces exactly this.

## Table of Contents

## The Field Names and Values Are Mostly Right

Start with what's right. The `Font Asset` description is accurate.

> This font is a Font Asset specific to TextMeshPro, and it contains an SDF
> (Signed Distance Field) texture.

Correct. And this is where it parts ways with the legacy UI `Text`. Here's how
the docs describe an SDF atlas.

> SDF font assets contain **contour distance information.** In font atlases, this
> information looks like grayscale gradients running from the middle of each
> glyph to a point past its edge.

Instead of baking the glyph shape into pixels, it stores **the distance to the
contour**, and the shader redraws the contour from that distance. So where a
bitmap font goes rough or blurry with camera distance and transformation, SDF
produces **a smooth edge regardless of distance.** That's the substance behind
"better quality."

Holding distance information gives one more thing. **Outlines and shadows can be
made in the shader from the distance value** — the material's `Outline` and
`Underlay`, which come up later.

The four `Spacing Options` are right too. The docs list the same four.

| Inspector | Doc description |
| --- | --- |
| Character | "Sets spacing between characters." |
| Word | "Sets spacing between words." |
| Line | "Sets spacing between lines." |
| Paragraph | "Sets spacing between paragraphs (explicit line breaks)." |

The parenthetical on `Paragraph` matters, and the clipping doesn't have it. **A
paragraph is a chunk separated by an explicit line break** (`\n` or `<br>`).
A line produced by word wrapping is `Line`; a line produced by pressing Enter is
`Paragraph`. Raise both and you'll be hunting for why the gap doubled.

`Alignment` is right as well. Though more useful than "there are nine" is that
**horizontal and vertical are separate.** Horizontal is Left / Center / Right /
Justified / Flush / Geometry Center; vertical is Top / Middle / Bottom /
Baseline / Midline / Capline. The clipping mixes horizontal and vertical into one
line — "left align, center align, right align, top align, and so on."

The `Font Style` list is only partial. The clipping names four — B, I, U, S.
The Inspector has seven.

| Button | Meaning |
| --- | --- |
| B / I / U / S | Bold / Italic / Underline / Strikethrough |
| ab | All lowercase |
| AB | All uppercase |
| SC | Small caps |

And the combination rule is in the docs.

> Enable standard text styling options. You can use these options in any
> combination, **except for the casing options (lowercase, uppercase, and small
> caps), which are mutually exclusive.**

B and I turn on together; ab and AB don't.

## Override Tags Only Ignores Color Tags

Here's the clipping's description.

> **Override Tags**: Sets whether to ignore TextMeshPro's tags (for example `<b>`
> for bold).

It gives `<b>` as the example, and **`<b>` has nothing to do with this
checkbox.** The docs put it in one line.

> **Override Tags:** Enable this option to **ignore any rich text tags that change
> text color.**

Only the ones that change color. `<color=red>`, `<#ff0000>`, `<gradient>` and
friends. `<b>`, `<i>`, `<size>` and `<align>` still apply with it ticked.

Where you'd use it is clear. **Displaying a string a server or a user supplied
verbatim**, when you want to block color but keep formatting. If you want to stop
someone putting `<color=#000000>` in a nickname to vanish against a dark
background while still allowing `<b>`, this is the field.

Conversely, **if you want every tag shown as literal text, this isn't the
field.** That one is `Rich Text`, and it lives inside the `Extra Settings` we'll
get to.

> **Rich Text:** Toggle rich text tag support.

In code they're two properties with two different names. No room to confuse them.

```csharp
using TMPro;
using UnityEngine;

public class ChatLabel : MonoBehaviour
{
    [Header("References")]
    [SerializeField, Tooltip("Label showing one line of chat")]
    private TextMeshProUGUI _label;

    /// <summary>A user-supplied string. Block color tricks, keep formatting.</summary>
    public void ShowUserMessage(string message)
    {
        _label.richText = true;          // <b> and <size> still apply.
        _label.overrideColorTags = true; // Only <color>, <#hex>, <gradient> are ignored.
        _label.text = message;
    }

    /// <summary>Show tags as literal text. For a log window.</summary>
    public void ShowRaw(string message)
    {
        _label.richText = false;         // Every tag shows as text.
        _label.text = message;
    }
}
```

The `Vertex Color` description in the same Color group is off in one place too.

> **Vertex Color** ... This color is applied **additively** on top of the
> Material's color.

What the docs describe isn't addition, it's multiplication. It's stated on the
`Color Gradient` side.

> TextMesh Pro **multiplies** gradient colors with the text's main vertex color
> (**Main Settings > Vertex Color** in the TextMesh Pro Inspector).

Multiplication has a place where it actually bites. The clipping's screenshot has
`Vertex Color` set to **black** with `Color Gradient` off. Turn the gradient on in
that state and **nothing shows.** Any color multiplied by black is black. The docs
name that case directly.

> if the main vertex color is black, the gradient colors disappear entirely

If you're going to use a gradient, `Vertex Color` at **white** is the default
that makes sense. That's what lets the gradient colors come through as they are.

How the material's Face Color combines with the vertex color I couldn't find in
the docs. Only that the gradient and the vertex color multiply.

## Text Wrapping Mode Has No Value Called Overflow

The clipping writes this.

> **Text Wrapping Mode** — Sets how text is handled when it exceeds the
> container: **Normal**: text wraps automatically. **Overflow**: text renders
> beyond the container.

Two things merged into one. The Inspector has **two fields.**

> **Wrapping:** **Enable** or **Disable** word wrapping.
>
> **Overflow:** Specify what happens when the text doesn't fit inside the display
> area.

The wrapping mode has four values and `Overflow` is not among them.

| `TextWrappingModes` | Meaning |
| --- | --- |
| Normal | Wrap at word boundaries |
| NoWrap | Don't wrap |
| PreserveWhitespace | Wrap while preserving whitespace |
| PreserveWhitespaceNoWrap | Preserve whitespace without wrapping |

`Overflow` is its own separate field, with seven values.

| `Overflow` | Doc description |
| --- | --- |
| Overflow | "Extends the text beyond the bounds of the display area, but still wraps it if **Wrapping** is enabled." |
| Ellipsis | "Cuts off the text and inserts an ellipsis (…)..." |
| Masking | "Like **Overflow**, but the shader hides everything outside of the display area." |
| Truncate | "Cuts off the text when it no longer fits." |
| Scroll Rect | "A legacy mode that's similar to **Masking**." |
| Page | "Cuts the text into several pages that each fit inside the display area." |
| Linked | "Extends the text into another TextMesh Pro GameObject that you select." |

The first row states the relationship between the two fields outright. Choose
`Overflow` and **wrapping still happens if `Wrapping` is enabled.** What spills
past the area is the vertical direction. That's why you can't think of them as
one. There are four × seven combinations, and the ones you reach for often — like
`NoWrap` + `Ellipsis` (one line, cut with a …) — only come out by picking each
side separately.

In code it's two properties as well. That common one-line-with-an-ellipsis combo
looks like this.

```csharp
using TMPro;
using UnityEngine;

public class NicknameLabel : MonoBehaviour
{
    [Header("References")]
    [SerializeField] private TextMeshProUGUI _label;

    private void Awake()
    {
        // Two fields. You don't set one of them to Overflow; you pick each.
        _label.textWrappingMode = TextWrappingModes.NoWrap;
        _label.overflowMode = TextOverflowModes.Ellipsis;
    }

    public void Show(string nickname)
    {
        _label.text = nickname;
    }
}
```

There's interference the other way too. The docs add a line — some overflow modes
override the wrapping setting. `Truncate` cuts whether `Wrapping` is on or off.

## Extra Settings Holds Neither Outline Nor Shadow

The clipping's last item.

> **Extra Settings** — Open the extra settings to control advanced effects such
> as text **outline, shadow and border.**

None of the three. Outline, shadow and bevel are **material (shader)**
properties. Here are the Distance Field shader's property group names and
descriptions.

| Shader property group | Doc description |
| --- | --- |
| Face | "Controls the text's overall appearance." |
| Outline | "Adds a colored and/or textured outline to the text." |
| Underlay | "Adds a second rendering of the text underneath the original rendering, for example to add a drop shadow." |
| Lighting | "Simulates local directional lighting on the text." |
| Glow | "Adds a smooth outline to the text in order to simulate glow." |

Outline is `Outline`, shadow is `Underlay`, and the raised-border look is
`Lighting`'s bevel. All of them live in the **material section lower down the
Inspector**, a different asset from `Extra Settings`.

Here's what's actually inside `Extra Settings`.

| Item | Doc description |
| --- | --- |
| Margins | "Adjusts distance between text and container boundaries." |
| Geometry Sorting | "Normal or Reverse quad rendering order." |
| Rich Text | "Toggle rich text tag support." |
| Raycast Target | "Makes the object a raycast target." |
| Parse Escape Characters | "Interprets backslash-escaped characters as special characters." |
| Visible Descender | "Controls text reveal direction (bottom-up or top-down)." |
| Sprite Asset | "Asset reference for sprites." |
| Kerning | "Toggles kerning; defined in Font Asset." |
| Extra Padding | "Adds padding to character sprites to prevent clipping." |

Not effects — **behavior settings.** And this list holds the two fields you reach
for most often in practice.

`Raycast Target` defaults to on. A label laid over a button swallowing the click
so the button doesn't press is this. **If the text has no reason to receive
clicks, turn it off.**

`Extra Padding` adds space around glyphs to prevent clipping. When you've pushed
an outline or shadow large in the material, the glyph edges get cut at the quad
boundary — that's when you tick this. **You turn the effect on in the material,
and stop that effect being clipped here** — one symptom split across two assets.

## Text Style Isn't Font Style

The clipping puts `Text Style` at the top and describes it this way.

> **Normal**: Sets the text style. It defaults to Normal, and you can **combine
> styles such as Bold and Italic.**

But the field that combines Bold and Italic shows up three lines later as
`Font Style`. It isn't the same thing described twice — **the first one is
something else.**

`Text Style` picks **an entry from a style sheet.** A style sheet is a separate
TMP asset, and a single style defined in it is, in the docs' words, this.

> a text style ... can include **opening and closing rich text tags, as well as
> leading and trailing text.**

An opening tag, a closing tag, and **even the text that goes before and after**,
stored as one bundle. Put font weight, size and color under a style named `H1`,
and in the text you write this.

```
<style="H1">Equipment Upgrade</style>
```

Or pick `H1` from the Inspector's `Text Style` dropdown and it applies **to that
whole text object.** It looks like it overlaps with `Font Style`'s B button, but
it's a different kind of thing.

| | Font Style | Text Style |
| --- | --- | --- |
| Stored where | This component | A separate style sheet asset |
| Changing it affects | Only this object | Everything using that style |
| What it can do | Weight, italic, underline, casing | A bundle of rich text tags + leading/trailing text |
| Available as a tag | `<b>`, `<i>` and so on, each | `<style="name">`, one tag |

That's the reason to use `Text Style`. When a heading style is used in fifty
places and the color has to change, `Font Style` means fixing fifty. A style
sheet means fixing one.

## Three Assets Are Stacked in One Panel

The four errors didn't arise separately. The TMP Inspector runs **three different
assets' settings together in one scroll**, and the clipping read it top to bottom
as a flat one-line list. That loses which asset a given field writes to.

| Layer | Stored where | What a change affects | Representative fields |
| --- | --- | --- | --- |
| Text component | That GameObject | This object only | Font Size, Alignment, Wrapping, Override Tags, Extra Settings |
| Material | A `.mat` asset | Every text using that material | Face, Outline, Underlay, Glow |
| Font asset | An `.asset` asset | Every text using that font | Atlas, Sampling Point Size, Padding, Fallback, kerning table |

What this table actually does is **tell you what you're breaking right now.**

Changing `Font Size` to 74 is this one object. Picking a different
`Material Preset` swaps the material, and a different material splits batching.
And raising `Outline Width` in the material section lower down the Inspector is —
**raising the outline on every text sharing that material at once.** To give one
spot an outline you have to create a new material preset.

The `Kerning` field is a good example. The checkbox in `Extra Settings` is a
component setting, but the docs add a parenthetical — "defined in Font Asset."
**Whether it's on is decided by the component; what gets pulled and by how much
is decided by the font asset's Glyph Adjustment Table.** One feature spanning two
layers.

## Where and Why You'd Use It

### A Single Score Display

Build a score label that updates every frame. The Inspector side first.

| Field | Value | Why |
| --- | --- | --- |
| Font Size | Fixed | Auto Size off. Covered below |
| Wrapping | Disable | Numbers have no reason to wrap |
| Overflow | Overflow | Don't cut as digit count grows |
| Alignment | Right / Middle | It grows leftward as digits increase |
| Raycast Target | Off | A scoreboard has no reason to eat clicks |
| Rich Text | Off | No tags used means no tag parsing |

The code goes like this.

```csharp
using TMPro;
using UnityEngine;

public class ScoreLabel : MonoBehaviour
{
    private const string SCORE_FORMAT = "{0:0}";

    [Header("References")]
    [SerializeField, Tooltip("TextMeshProUGUI that shows the score")]
    private TextMeshProUGUI _label;

    private int _lastShownScore = -1;

    private void Awake()
    {
        if (_label == null)
        {
            Debug.LogError($"{name}'s _label is empty. Check the Inspector.");
        }
    }

    public void Show(int score)
    {
        // Don't touch it if the value didn't change. Assigning text rebuilds the mesh.
        if (score == _lastShownScore)
        {
            return;
        }

        _lastShownScore = score;
        _label.SetText(SCORE_FORMAT, score);
    }
}
```

The reason for passing a format string to `SetText` is to avoid the path that
builds one `string` and assigns it. Here's the overload the docs provide.

> **SetText(string, float)** — "Formatted string containing a pattern and a value
> representing the text to be rendered."

There are overloads taking up to seven `float` arguments, plus ones taking a
`StringBuilder` and a `char[]`. That said, **I couldn't find a sentence in the
docs saying these overloads don't allocate.** Checking with the Profiler is the
sure way.

Filtering out identical values with `_lastShownScore` is the saving you can count
on. Assigning `text` rebuilds the mesh whether the value changed or not.

### Putting It Inside a Layout Group

In [the post on layout groups](/posts/ugui-layout-group/) we saw that ticking
`Control Child Size` makes the layout group read the child's **layout element
properties.** A bare RectTransform answers 0 there, which is why the child
vanishes.

A TMP text doesn't answer 0. `TextMeshProUGUI`'s class declaration carries
`ILayoutElement`.

```csharp
public class TextMeshProUGUI : TMP_Text, ICanvasElement, IClippable,
    IMaskable, IMaterialModifier, ILayoutElement
```

So when asked, it answers with a size that fits the glyphs.

> **preferredWidth:** Computed preferred width of the text object.
>
> **preferredHeight:** Computed preferred height of the text object.

The abstract base `TMP_Text` has no `ILayoutElement`; the concrete classes
`TextMeshProUGUI` and `TextMeshPro` each carry it. Holding one as `TMP_Text` in
code still reaches the layout properties, but what the layout system looks at is
the actual type on the component.

Tick `Auto Size` here and **two calculations running in opposite directions mesh
together.** Auto Size decides glyph size to fit the rect; `Control Child Size` or
a `Content Size Fitter` decides the rect to fit the glyph size. The docs describe
Auto Size's behavior this way.

> When this option is enabled, TextMesh Pro **lays out the text multiple times to
> find a good fit.** This is a resource intensive process, so **avoid auto-sizing
> dynamic text that changes frequently.**

If a phrase of unpredictable length has to go into a fixed-size slot, Auto Size
is right. The other way round — **if the slot has to grow to fit the glyphs,
turn Auto Size off** and go with a fixed `Font Size` plus a
`Content Size Fitter`. Tick both and you get a structure where each side changes
the other's input every frame.

### Where Not to Use It

**Auto Size on text that changes every frame.** It's the combination the docs
tell you to avoid outright. A remaining-time or FPS display changes glyphs every
frame, and with Auto Size on, layout runs several times per frame.

**Touching the material to change one spot.** Values in the material section go
to everything using that material. Raise `Outline Width` to give one heading an
outline and every text on that font gets one. Create a new `Material Preset` and
assign it to that object only.

**Ticking Override Tags to block every tag.** Only color tags are blocked. If
`<b>` and `<size>` also have to appear as literal text, turn off `Rich Text` in
`Extra Settings`.

**Touching Horizontal / Vertical Mapping on the default material.** The docs
attach a condition.

> **Horizontal Mapping:** Specify how textures map to text horizontally **when you
> use a shader that supports textures.**

On a default Distance Field material with no texture in Face, nothing on screen
changes however you set those two fields. The clipping only writes "textures are
mapped per character" — but **with no texture there's nothing to map.**

## Wrapping Up

The clipping's list is usable in itself. Field names and values are mostly right,
and it catches TMP's core, like `Font Asset` holding the SDF.

The four wrong fields all have **the neighboring field's job pasted onto them.**
`Override Tags` only ignores color tags, and the field that blocks every tag is
`Rich Text` in `Extra Settings`. Wrapping and overflow are separate fields, and
`Overflow` is not a value of the wrapping mode. `Extra Settings` has no effects,
only behavior settings — outline and shadow are the material's `Outline` and
`Underlay`. `Text Style` isn't `Font Style`; it's a style sheet entry.

All four slip in the same place. **Three assets are stacked in one panel, and it
was read as a flat one-line list.** Rather than memorizing field names, knowing
whether a field writes to the component, the material or the font asset is what
stays useful. That's what tells you **how many texts you're changing right now.**

---

### References

- [UI Text GameObjects — TextMesh Pro Manual](https://docs.unity3d.com/Packages/com.unity.textmeshpro@4.0/manual/TMPObjectUIText.html)
- [Signed Distance Field font assets — TextMesh Pro Manual](https://docs.unity3d.com/Packages/com.unity.textmeshpro@4.0/manual/FontAssetsSDF.html)
- [Style Sheets — TextMesh Pro Manual](https://docs.unity3d.com/Packages/com.unity.textmeshpro@4.0/manual/StyleSheets.html)
- [Color Gradients — TextMesh Pro Manual](https://docs.unity3d.com/Packages/com.unity.textmeshpro@4.0/manual/ColorGradients.html)
- [Distance Field shaders — TextMesh Pro Manual](https://docs.unity3d.com/Packages/com.unity.ugui@3.0/manual/TextMeshPro/ShadersDistanceField.html)
- [TextMeshProUGUI — TextMesh Pro API](https://docs.unity3d.com/Packages/com.unity.textmeshpro@4.0/api/TMPro.TextMeshProUGUI.html)
- [TMP_Text.SetText — TextMesh Pro API](https://docs.unity3d.com/Packages/com.unity.textmeshpro@3.0/api/TMPro.TMP_Text.SetText.html)
- [TextWrappingModes — TextMesh Pro API](https://docs.unity3d.com/Packages/com.unity.textmeshpro@4.0/api/TMPro.TextWrappingModes.html)

The starting point for this post was [곰빛 — Unity의 TextMeshPro 컴포넌트의 Inspector 설정](https://j2su0218.tistory.com/1511)
(2025-01-16). I followed its Inspector items one at a time, checking each field's
description against the current TextMesh Pro manual and API reference.
