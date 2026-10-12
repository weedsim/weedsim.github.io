---
pubDatetime: 2026-10-12T21:00:00+09:00
title: "What a Mask Picks Is Body Parts; What Fills the Rest Is the Layer Below"
lang: en
translationKey: avatar-mask-layers
featured: false
draft: false
tags:
  - Unity
  - Animator
  - Animation
  - C#
description: "Clipped while looking for how to combine IK with an Avatar Mask so animation lands on the upper body only. It walks through making an Avatar Mask and plugging it into a layer. The procedure is right, but how far the mask's reach goes is missing. The body-part list differs between two pages, and the rule that holds the whole thing up lives in a tooltip, not the prose."
---

**I wanted to combine IK with an Avatar Mask so that animation lands on the
upper body only.** Looking for how to **split two animations across upper and
lower body** — aiming a gun while walking forward, the way the example puts it
— I clipped a post on making an Avatar Mask and plugging it into an Animator
layer. It's from 2022 and the procedure is short — make the asset with
`Create → Avatar Mask`, turn the parts you want green in the Inspector, and
plug it into `Mask` in the Animator Controller's layer settings. It still works
as written.

Here's how the post defines a mask.

> The definition (function) of an Avatar Mask is expressing animation partially.

That isn't wrong. But **how far the mask's reach goes is missing.** A mask
decides only *which body parts* it applies to. *How much* it applies is another
field, and *what happens to the remaining parts* is another rule again. And
that rule lives **in a glossary tooltip, not the manual's prose.**

This blog has three Animator posts. Two of them touch this one.
[What's Read-Only Isn't the Clip, It's the Animation Window's View](/en/posts/imported-clip-readonly/)
covered **putting a mask on a clip in the import settings**, and
[With IK Pass Off, All Six IK Functions Are Silent](/en/posts/animator-members/)
covered **the layer's IK Pass checkbox**. This one looks at **the mask asset
itself and the layer's `Mask` field**. That there are two places to hang a mask
is something the docs state outright, so that's where I start.

I verified five things. **There are two ways to define a mask and a rule for
which to pick**, **the body-part list differs between the manual and the
enum**, **the mask's benefits include memory and CPU**, **the layer's `Weight`
has no description on the layers page**, and **the rule that the layer below
fills the remaining parts is in a glossary tooltip.**

Checked on **2026-10-12**, against Unity **6.6**.

## Table of contents

## There are two ways to define a mask, and a rule for picking

Here's the post's impression on opening the Inspector.

> Honestly at first I thought it was an asset with nothing to adjust, but
> expand the arrows on Humanoid and Transform and a proper-looking model appears.

**It treats the two as "two foldouts to expand".** The manual writes them as
**options**.

> There are two ways to define which parts of your animation should be masked:

> By selecting from a Humanoid body map

> By choosing which bones to include or exclude from a Transform hierarchy

And there's a condition attached to which one you take.

> If your animation uses a Humanoid Avatar

> you can select or deselect portions of the simplified humanoid body diagram

> If your animation does not use a Humanoid Avatar

> you want more detailed control over which bones are masked

**Whether the animation uses a Humanoid Avatar** is the first fork, and even
when it does, **if you want finer bone-level control** you go the Transform
way. It isn't both expanded and both touched.

The Transform side has a setup step the post never mentions.

> Assign a reference to the Avatar whose transform you would like to mask.

> Click the **Import Skeleton** button.

> The hierarchy of the avatar appears in the inspector.

> You can check each bone in the hierarchy to use as your mask.

**You have to assign an Avatar and press `Import Skeleton` before the hierarchy
appears.** Until you press it the list is empty, so the post's "expand the
arrows and a model appears" is the Humanoid side's story. Not knowing about
that button leaves the Transform side looking permanently blank.

On the colors, the post and the docs say the same thing.

> click the Avatar diagram for that portion until it appears as green.

> To exclude animation, click the body portion until it appears red.

Same as the post's "touch it and it turns red -> not applied". Green is
include, red is exclude.

| | Humanoid | Transform |
| --- | --- | --- |
| The condition the docs write | "uses a Humanoid Avatar" | "does not use a Humanoid Avatar", or bone-level control |
| The unit you pick | portions of the body diagram | each bone in the hierarchy |
| Setup | none | an Avatar reference + `Import Skeleton` |
| How to read it from code | `GetHumanoidBodyPartActive` | `GetTransformActive` · `transformCount` |

## The list of body parts differs between two pages

Here's how the manual says the body diagram groups the parts.

> The body diagram groups body parts into these portions:

The list has eight — Head, Left Arm, Right Arm, Left Hand, Right Hand,
Left Leg, Right Leg, and "Root (denoted by the “shadow” under the feet)".

The scripting reference's `AvatarMaskBodyPart` has **fourteen**.

| enum member | What the docs say | On the manual's list? |
| --- | --- | --- |
| Root | "The Root." | yes |
| Body | "The Body." | **no** |
| Head | "The Head." | yes |
| LeftLeg · RightLeg | "The Left Leg." · "The Right Leg." | yes |
| LeftArm · RightArm | "The Left Arm." · "The Right Arm." | yes |
| LeftFingers · RightFingers | "Left Fingers." · "Right Fingers." | written as Hand |
| LeftFootIK · RightFootIK | "Left Foot IK." · "Right Foot IK." | only as the IK toggle |
| LeftHandIK · RightHandIK | "Left Hand IK." · "Right Hand IK." | only as the IK toggle |
| LastBodyPart | "Total number of body parts." | no (it's the count) |

**The difference that matters most is `Body`.** The manual's list of eight has
no torso and the enum does. And Hand and Fingers are named differently.

This is where two sentences in the post come apart. The author writes this.

> I made just the upper body, the way it'd show up in a shooting game.

And right after it, this.

> Then that layer is set to use only the arms when it plays the animation.

**Upper body and arms aren't the same selection.** And **neither of them is one
toggle.** Going by the manual's list, "upper body only" is turning on Head ·
Left Arm · Right Arm · Left Hand · Right Hand and turning off Left Leg ·
Right Leg · Root, while "arms only" is turning on Left Arm · Right Arm (plus
the Hands if needed). And what to do about the torso has no answer from the
docs alone, **because the enum has `Body` and the manual's list doesn't.** What
can be verified stops at the two lists differing.

Why this matters in practice: **whether an aiming pose turns from the waist or
only from the arms is decided by whether the torso is included.** If you can't
name that field, "why isn't the upper body turning" turns into guesswork. From
code you can name it — `AvatarMaskBodyPart.Body`.

## A mask's benefit isn't only what it shows

The definition in the post is about what gets shown. The manual adds another
benefit.

> A benefit of using Masks is that they tend to reduce memory overheads

> body parts that are not active do not need their associated animation curves.

> the unused curves need not be calculated during playback

**The curves go away entirely, and curves that don't exist don't get
calculated.** Memory and CPU are both written down. So a mask isn't just "a
staging device for showing part of a body" — it's also **a way to throw away
animation data you won't use.**

That sentence meshes with the import-settings post from earlier. The clip mask
page there wrote the same job with the word "discard". **There are two places
to hang one, and both of them throw things away.** The scripting reference puts
the two in one sentence.

> They can be used when importing animation or in an animator controller layer.

The class description covers the same range.

> AvatarMask is used to mask out humanoid body parts and transforms.

## Plugging it into a layer isn't the whole job

The post's last step is this.

> Open the settings on the Layer you want and put it in Mask.

Correct. Here's how that field is described.

> The Mask property is there to specify the mask used on this layer

> The mask specifies the body parts on which to apply the animation.

**"On which to apply" — which parts it applies to.** How much it applies isn't
in that sentence. Blending is a separate thing in the same layer settings.

> Select Override to use the animation on this layer, replacing the animation
> on previous layers.

> Select Additive to add the animation on this layer on top of the animation
> from previous layers.

`Override` **replaces previous layers** and `Additive` **adds on top of them.**
The adding side comes with a precondition.

> For additive blending to be successful, the animation on the additive layer
> must contain the same properties

It has to carry the same properties. Put an aiming upper-body layer on
`Additive` and let its properties diverge from the lower-body locomotion clip,
and there's nothing to add onto, so you don't get what you expected.

And **here there's a gap in the docs.** The layer Inspector has a `Weight`
field, but **the Animation Layers manual page has no description of it.** On
that page the word "weight" appears only in the `Sync`/`Timing` explanation.

> The Timing checkbox allows the animator to adjust how long each animation in
> synced layers takes, determined by the weight.

Where weight is documented is the scripting reference.

> public void SetLayerWeight(int layerIndex, float weight);

> Changes the weight of the layer at a specific index.

> If the specified layer does not exist, this method does nothing.

The valid range is in the parameter description.

> The new layer weight which is a value between 0 and 1.

**The valid range is between 0 and 1.** But **what the default is isn't written
on that page, and I couldn't verify it.** So I won't flatly declare that "I
plugged in the mask and nothing happens" is caused by a weight of 0. What I
verified is this — **a mask decides only the parts, the amount applied is a
separate value, and there's a separate API for reading and writing it.** The
read side exists too.

> Returns the weight of the layer at the specified index.

That's `GetLayerWeight`. If you're handling the ramp into and out of aiming
from code, those two are the handles.

You can also avoid naming the layer by number.

> Returns the index of the animation layer with the given name.

> The index of the specified layer. Returns -1 if the layer name is not found.

That's `GetLayerIndex`, and **it returns -1 when it can't find it.** Hard-coding
a layer index came up once before in
[CrossFade's 0.3f: On One Side It's 0.3 Seconds, on the Other It Isn't](/en/posts/animator-crossfade/).
Looking it up by name and checking for -1 survives a layer reshuffle.

## You don't need a separate lower-body layer

Here's how the post ends.

> It'd be better to make a separate lower-body layer and use two layers.

**Most of the time that advice isn't needed.** The reason is in the docs, in a
surprising place. Not in the Avatar Mask page's prose but in the **glossary
tooltip for "Animation Layer"**.

> The higher layers take precedence for the body parts they control.

**The higher layer takes precedence "for the body parts they control".** Flip
it around and the parts it doesn't control — the parts you left out of the mask
— are **carried straight through by the layer below.** If the base layer is
running full-body locomotion, putting one upper-body mask layer on top is the
whole job. There's no reason to make a new layer for the legs. It's the same
story as `Override` being described as "replacing the animation on previous
layers".

It isn't that a lower-body layer is never needed. **When you want to turn the
lower body on and off separately, or give it its own weight**, splitting the
layer is right. It's less that the post's advice is wrong and more that **the
reason is missing, which makes it read as a recommendation even where it isn't
needed.**

What's worth noting is **where** this rule sits. Layer precedence is the core
of what layers do, yet the phrase "take precedence" doesn't appear anywhere in
the Animation Layers page's prose. The page that explains layers isn't the one
holding the rule — a glossary tooltip is. It's a shape that makes it easy to
read the docs and still walk past this.

## There are two IK checkboxes and they aren't the same thing

There's IK on the mask side too.

> You can also toggle **Inverse Kinematics (IK)** for hands and feet, which
> determines whether or not to include IK curves in animation blending.

It decides **whether the hands' and feet's IK curves go into blending.** The
enum has four of its own — `LeftFootIK` · `RightFootIK` · `LeftHandIK` ·
`RightHandIK`.

**"Of its own" is the point.** In `AvatarMaskBodyPart` those four are **separate
entries** from `LeftArm`/`RightArm`, and the manual attaches them after the
body-part list with "You can **also** toggle". Meaning **turning on an arm does
not turn on that hand's IK goal with it.** To hold the aim with IK while
masking to the upper body, you have to look at **the arm part and the matching
`HandIK` entry together.** The reverse combination is possible too — leave the
arm out and keep only the IK goal, or keep the arm and drop the IK goal. That's
why the docs split them into separate entries.

This is **a different field** from the layer settings' `IK Pass` checkbox. That
one decides whether `OnAnimatorIK` gets called, and with it off the IK
functions all go silent —
[With IK Pass Off, All Six IK Functions Are Silent](/en/posts/animator-members/)
has that written up. For reference, **the Animation Layers manual page has no
`IK Pass` either.** Same situation as `Weight`.

So there are two fields with IK in the name, and one is about **whether curves
get blended** (the mask) while the other is about **whether a callback gets
called** (the layer). Turn on the callback with no curves to blend, or blend the
curves without turning on the callback, and neither gives you what you expected.

## Where and why you'd use it

### A working example

This handles the weight of an aiming upper-body layer. The two things missing
from the post's procedure — **finding the layer by name** and **the weight** —
are what the code takes care of.

```csharp file="Scripts/Character/AimLayerController.cs"
using UnityEngine;

[RequireComponent(typeof(Animator))]
public class AimLayerController : MonoBehaviour
{
    [Header("Layer")]
    [Tooltip("Name of the upper-body layer the mask sits on. No hard-coded index")]
    [SerializeField]
    private string _aimLayerName = "Aim";

    [Tooltip("Seconds for the weight to travel from 0 to 1")]
    [Min(0f)]
    [SerializeField]
    private float _blendDuration = 0.15f;

    [Header("Diagnostics")]
    [Tooltip("The mask on the layer. Logs which parts are on")]
    [SerializeField]
    private AvatarMask _aimMask;

    private Animator _animator;
    private int _aimLayerIndex = -1;
    private float _targetWeight;

    private void Awake()
    {
        if (!TryGetComponent(out _animator))
        {
            Debug.LogError("There is no Animator.", this);
            return;
        }

        // Look it up by name. The docs say -1 comes back if it isn't there.
        _aimLayerIndex = _animator.GetLayerIndex(_aimLayerName);

        if (_aimLayerIndex < 0)
        {
            Debug.LogError($"There is no '{_aimLayerName}' layer.", this);
            return;
        }

        _targetWeight = _animator.GetLayerWeight(_aimLayerIndex);
    }

    private void Update()
    {
        if (_aimLayerIndex < 0)
        {
            return;
        }

        float current = _animator.GetLayerWeight(_aimLayerIndex);

        if (Mathf.Approximately(current, _targetWeight))
        {
            return;
        }

        float step = _blendDuration <= 0f
            ? 1f
            : Time.deltaTime / _blendDuration;

        // The valid range the docs give is between 0 and 1.
        float next = Mathf.Clamp01(
            Mathf.MoveTowards(current, _targetWeight, step));

        _animator.SetLayerWeight(_aimLayerIndex, next);
    }

    // Called from the aim input. The mask decides only which parts, so how
    // much gets applied is held here.
    public void SetAiming(bool isAiming)
    {
        _targetWeight = isAiming ? 1f : 0f;
    }

    // The place to check by name what the mask actually has on. Instead of
    // hunting for the torso by eye, point at Body.
    [ContextMenu("Log mask state")]
    private void LogMaskState()
    {
        if (_aimMask == null)
        {
            Debug.LogWarning("The mask is empty.", this);
            return;
        }

        for (int i = 0; i < (int)AvatarMaskBodyPart.LastBodyPart; i++)
        {
            AvatarMaskBodyPart part = (AvatarMaskBodyPart)i;
            Debug.Log($"{part} = {_aimMask.GetHumanoidBodyPartActive(part)}",
                this);
        }

        Debug.Log($"transformCount = {_aimMask.transformCount}", this);
    }
}
```

There's a reason `_animator` and `_aimMask` don't use `?.`. Both are
`UnityEngine.Object`, and a reference left empty in the Inspector can end up in
a state that **looks like null but isn't C#'s null**. So they use `== null` /
`!= null` comparisons. For a plain C# object, `?.` is correct.

Ending the loop at `AvatarMaskBodyPart.LastBodyPart` is deliberate. The docs
call that member "Total number of body parts.", and `AvatarMask` **has no
property that returns the humanoid body-part count.** `transformCount` is the
count on the Transform side; the humanoid count comes from the enum.

There's one reason for the `[ContextMenu]` too. The mask Inspector's body
diagram has to be read by color, and **whether the torso is on is the field
that's hardest to read off that diagram.** Print it by name and you confirm it
with a value instead of a hunch.

### How to choose

| Situation | What to use |
| --- | --- |
| You have a Humanoid Avatar | the Humanoid body diagram |
| You don't have a Humanoid Avatar | the Transform hierarchy (Avatar ref + `Import Skeleton`) |
| Bone-level detail | the Transform hierarchy |
| The aim should turn from the waist | include `Body` (`AvatarMaskBodyPart.Body` in code) |
| Only the arms move | `LeftArm`/`RightArm` (+ Fingers) |
| Adding an upper-body layer | `Override` + a mask; the legs stay from the layer below |
| Adding a sway on top | `Additive` (needs the same properties as previous layers) |
| Turning aiming on and off | `SetLayerWeight` (between 0 and 1) |
| Naming a layer | `GetLayerIndex` + a `-1` check |
| Discarding the legs in the clip itself | Mask in the import settings |
| Blending the hand/foot IK curves | the mask's IK toggle |
| Using aim IK with an upper-body mask | turn on the arm part *and* the matching `HandIK` entry |
| Getting `OnAnimatorIK` called | the layer's `IK Pass` |

Here's the order to judge in.

- **Pick where to hang the mask first.** If that clip will always be used
  partially it's the import settings; if you'll turn it on and off by situation
  it's the layer. The former is written up in
  [What's Read-Only Isn't the Clip, It's the Animation Window's View](/en/posts/imported-clip-readonly/).
- **Settle the parts by name.** "Upper body" isn't a unit in the docs. Writing
  down the parts to enable as enum names up front means less flailing later.
- **Check the weight after plugging in the mask.** A mask decides only the
  parts. The amount applied is a separate value and is readable from code.
- **Leave the remaining parts to the layer below.** A higher layer takes
  precedence only for the parts it controls. Before making a new lower-body
  layer, check whether the base layer already drives the legs.

### Where not to use it

- **Trying to fill in both Humanoid and Transform.** The docs write them as
  options, and the condition is whether it "uses a Humanoid Avatar".
- **Reading an empty Transform list as a broken asset.** You assign an Avatar
  and press `Import Skeleton` before the hierarchy appears.
- **Looking for "upper body" as one toggle.** The manual's part list has eight
  and there's no upper-body unit in it. The torso is the enum's `Body`.
- **Plugging in a mask and not checking the weight.** A mask decides only "on
  which to apply". The amount is `SetLayerWeight`'s territory and the range is
  between 0 and 1.
- **Hard-coding a layer index.** `GetLayerIndex` exists, and it returns -1 when
  it can't find the layer.
- **Making a lower-body layer out of habit.** A higher layer takes precedence
  only for the parts it controls. If the base layer drives the whole body, one
  upper-body layer is the whole job.
- **Using `Additive` without checking properties.** The docs wrote the
  precondition: "must contain the same properties".
- **Treating the mask's IK toggle and the layer's `IK Pass` as the same thing.**
  One is whether curves get blended, the other is whether a callback gets
  called.
- **Assuming an arm being on means that hand's IK is on.** In the enum
  `LeftArm` and `LeftHandIK` are separate entries, and the manual writes them
  separately with "also toggle".

## Summary

- There are **two** ways to define a mask and the choice has a stated rule — if
  it "uses a Humanoid Avatar" it's the body diagram; if it doesn't, or you need
  bone-level control, it's the Transform hierarchy. The latter needs **an
  Avatar reference and `Import Skeleton`** first.
- Green is include, red is exclude. The docs write it as "until it appears as
  green" / "until it appears red".
- **The body-part list differs between two pages.** The manual's body-diagram
  list has eight and `AvatarMaskBodyPart` has fourteen. **The manual's list has
  no `Body`.**
- So the post's "upper body only" and "only the arms" are **not the same
  selection, and neither is one toggle.** Whether the torso is included is
  pointed at from code with `AvatarMaskBodyPart.Body`.
- The mask's benefits include **memory and CPU** — "body parts that are not
  active do not need their associated animation curves." / "the unused curves
  need not be calculated during playback". It's a staging device and a way to
  throw data away.
- A layer's `Mask` is **"the body parts on which to apply the animation"**. It
  decides only which parts.
- **`Weight` has no description on the Animation Layers page.** Where it is
  documented is `SetLayerWeight`/`GetLayerWeight`, and the range is **"a value
  between 0 and 1"**. The default isn't written down, so I couldn't verify it.
- **The layer below fills the rest** — "The higher layers take precedence for
  the body parts they control." That rule is in a **glossary tooltip**, not the
  Animation Layers prose. Which is why you usually don't need a separate
  lower-body layer.
- `Override` is "replacing the animation on previous layers", `Additive` is
  "add ... on top of", and the latter **presupposes the same properties**.
- There are two fields with IK in the name. The mask's toggle is about
  **whether IK curves go into blending**, the layer's `IK Pass` is about
  **whether the callback gets called**. The latter isn't on the Animation Layers
  page at all.
- And in the enum, **the four IK goals are separate entries from the limbs.**
  Turning on an arm doesn't bring that hand's IK goal with it, so if you're
  using aim IK with an upper-body mask, look at both entries.

---

### References

- [Avatar Mask — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AvatarMask.html)
- [Animation Layers — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/AnimationLayers.html)
- [Mask animation clips — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/AnimationMaskOnImportedClips.html)
- [AvatarMask — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AvatarMask.html)
- [AvatarMaskBodyPart — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AvatarMaskBodyPart.html)
- [AvatarMask.GetHumanoidBodyPartActive — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AvatarMask.GetHumanoidBodyPartActive.html)
- [AvatarMask.SetHumanoidBodyPartActive — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AvatarMask.SetHumanoidBodyPartActive.html)
- [Animator.SetLayerWeight — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Animator.SetLayerWeight.html)
- [Animator.GetLayerWeight — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Animator.GetLayerWeight.html)
- [Animator.GetLayerIndex — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Animator.GetLayerIndex.html)

The starting point for this post was
[유니티 아바타 마스크](https://alpaca-code.tistory.com/46)
(UniCoti, 2022-08-15), in Korean; the quotes from it are my translations. I
followed its procedure for making the asset and plugging it into a layer as
written and checked each item against both the current Unity 6.6 manual and the
scripting reference. Checked on 2026-10-12.
