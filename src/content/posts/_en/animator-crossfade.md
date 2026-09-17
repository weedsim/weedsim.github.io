---
pubDatetime: 2026-09-17T22:00:00+09:00
title: "CrossFade's 0.3f: On One Side It's 0.3 Seconds, on the Other It Isn't"
lang: en
translationKey: animator-crossfade
featured: false
draft: false
tags:
  - Unity
  - Animator
  - Animation
  - C#
description: "I checked a CrossFade explanation written in 2014. It's correct. But the component you'd actually use today has a method by the same name, and the second argument is in a different unit."
---

Looking for a way to smooth animation transitions from script, I landed on
`CrossFade` and clipped an explanation that was short and clear. Reopening it,
it's from **June 2014** — twelve years ago.

> The CrossFade function takes two arguments.
> The first is the name of the animation clip to change to.
> The second is the time it takes to fade out to the other animation clip.

Something caught me immediately. The example starts with `Animation anim;`.
**That's `Animation`, not `Animator`.** And in Unity today, character animation
almost always goes through `Animator`.

So I checked. **Both components have a method by that name**, and the second
argument is **in a different unit.**

## Table of contents

## The API that 2014 post describes is `Animation`

First, is the original correct? It is.

```csharp
public void CrossFade(string animation,
                      float fadeLength = 0.3F,
                      PlayMode mode = PlayMode.StopSameLayer);
```

The docs describe `fadeLength` like this:

> The duration of the crossfade **in seconds**. Negative values are clamped to
> 0 seconds.

That's exactly what the original's "time it takes to fade out" means. The `0.3f`
in its example is even **the method's own default value.** A 2014 post that is
still not wrong.

The problem is elsewhere. This is a method on the **`Animation` component**, and
`Animation` predates Mecanim. Pulling clips out as properties, as in the
original's `anim.runForward.name`, is from that era too.

## Three docs pages say three different things

Looking up where `Animation` stands today, I found **three official pages with
three different postures.**

| Page | What it says |
|---|---|
| Manual — Legacy Animation component | "This component is **retained in Unity for backwards compatibility.**" / "**For new projects, use the Animator component.**" |
| Manual — Legacy Animation system | "Legacy is still available because it is **easier to use and provides better performance** for simpler animations." |
| Scripting Reference — `Animation` | **No** legacy marking at all |

Same company, same moment in time: one says don't use it for new projects, one
lists the reasons it was kept, and one says nothing.

**Reading only the Scripting Reference, there's no way to tell this is the older
system.** The `Animation.CrossFade` page carries no pointer to `Animator`
either. Since search usually drops you straight onto an API page, that's a
genuinely confusing arrangement.

The reading that holds up: **new character animation goes on `Animator`, and
`Animation` is for maintaining what was already built with it.** That's what the
manual's component page says most plainly.

## `0.3f` changes meaning

Here's the crux. `Animator` has a `CrossFade` too.

```csharp
public void CrossFade(string stateName,
                      float normalizedTransitionDuration,
                      int layer = -1,
                      float normalizedTimeOffset = float.NegativeInfinity,
                      float normalizedTransitionTime = 0.0f);
```

The second parameter has a different name. Not `fadeLength` but
**`normalizedTransitionDuration`**. The description differs by one word:

> The duration of the transition (**normalized**).

The class description says the same: it "creates a crossfade from the current
state to any other state **using normalized times**."

So porting the 2014 post straight onto `Animator` gives you this:

```csharp
// The 2014 post — Animation component. 0.3f is 0.3 seconds.
_animation.CrossFade("Run", 0.3f);

// The same number on Animator — not 0.3 seconds.
_animator.CrossFade("Run", 0.3f);
```

**It compiles, it runs, and a fade happens on screen.** Its length just isn't
0.3 seconds — it's a fraction of a state's duration. A two-second clip gives
0.6 seconds; a half-second clip gives 0.15. **Transition speed varies per clip
while the number stays 0.3f, which makes it hard to trace.**

One more thing worth flagging. The API docs say "normalized" and **never say
normalized to what.** The animator transition inspector docs do state the basis:

> If the **Fixed Duration** box is not checked, the transition time is
> interpreted as a fraction of the normalized time of the **source state**.

That's a description of inspector transitions, not of the `CrossFade` API. So
**reading the API alone, you can't learn the exact basis.**

You don't need to. Unity ships a seconds-based version separately.

```csharp
public void CrossFadeInFixedTime(string stateName,
                                 float fixedTransitionDuration,
                                 int layer = -1,
                                 float fixedTimeOffset = 0.0f,
                                 float normalizedTransitionTime = 0.0f);
```

> The duration of the transition (**in seconds**).

Its class description is "creates a crossfade ... **using times in seconds**."
The three methods side by side:

| Method | Second argument | Unit |
|---|---|---|
| `Animation.CrossFade` | `fadeLength` | **Seconds** |
| `Animator.CrossFade` | `normalizedTransitionDuration` | **Normalized** |
| `Animator.CrossFadeInFixedTime` | `fixedTransitionDuration` | **Seconds** |

**When you carry a number over from old code or an old post, the match is
`CrossFadeInFixedTime`.** That's the one whose meaning lines up with
`Animation.CrossFade(name, 0.3f)`.

## Where and why you'd use this

Transitions on an `Animator` usually run off parameters in the controller graph.
So when is `CrossFade` the right call? **When the transition is awkward to draw
in the graph.** A hit reaction that must interrupt from any state, or a state
count high enough that drawing every edge makes the graph unreadable.

### Driving a state change from code

```csharp
using UnityEngine;

/// <summary>
/// Cuts to the hit reaction immediately, from whatever state is playing.
/// </summary>
[RequireComponent(typeof(Animator))]
public class HitReaction : MonoBehaviour
{
    private const float FADE_SECONDS = 0.15f;
    private const int BASE_LAYER = 0;

    // Cache the state hash so the string isn't hashed on every call.
    private static readonly int HIT_STATE = Animator.StringToHash("Base Layer.Hit");

    [Header("Reaction")]
    [SerializeField, Range(0.02f, 1f), Tooltip("Transition time in seconds")]
    private float _fadeSeconds = FADE_SECONDS;

    private Animator _animator;

    private void Awake()
    {
        _animator = GetComponent<Animator>();
    }

    public void Play()
    {
        // The seconds version, not the normalized one.
        // Transition time stays put even when clip lengths change.
        _animator.CrossFadeInFixedTime(HIT_STATE, _fadeSeconds, BASE_LAYER);
    }
}
```

Three decisions here come from the docs:

- **`CrossFadeInFixedTime` was the choice.** This value is exposed in the
  Inspector in seconds, so the normalized version doesn't fit. If a designer
  types 0.15, it should be 0.15 seconds.
- **The state name includes the layer.** The docs say to include the parent
  layer in the state name, with `"Base Layer.Run"` as the example.
- **The hash is precomputed.** The docs' own guidance: using the `stateName`
  parameter calls `Animator.StringToHash` internally, so **if you call it often
  with the same name, precompute the hash and use `stateHashName`.** Same reason
  I [cached `Shader.PropertyToID`](/en/posts/unity-custom-shaders/) on the shader
  side.

If input drives the state change, the lifetime side of that is covered in
[Subscribing to InputAction Directly](/en/posts/input-action-subscribe/).

### What the string overload hides

Hash caching is known as a performance matter, but on `CrossFade` there's a
second place where **behavior changes.** The two overloads have different
defaults.

| Overload | `normalizedTimeOffset` default |
|---|---|
| `CrossFade(string, ...)` | `float.NegativeInfinity` |
| `CrossFade(int, ...)` | `0.0f` |

**Same parameter, different default.** Switch from the string version to the hash
version for performance, and if you were omitting the third and fourth
arguments, the default time-offset behavior changes along with it.

On `CrossFadeInFixedTime` both overloads use `fixedTimeOffset = 0.0f`. The
seconds version is less hazardous on this count too.

If your code cares about the offset, **pass it explicitly rather than omitting
it.** Then changing overloads changes nothing.

### Where not to use it

- **Transitions the graph expresses well.** Walk ↔ run, with clear conditions,
  reads better as parameters and transitions. Keep code-driven crossfades for
  what the graph can't hold.
- **Carrying a number from an old post into `Animator.CrossFade`.** As above,
  the unit differs.
- **The `Animation` component in a new project.** The manual's component page
  says to use `Animator` outright.

## Summary

- **The 2014 post isn't wrong.** `Animation.CrossFade`'s `fadeLength` is "in
  seconds" per the docs, and the example's `0.3f` is that method's default.
- **But it's an API of the Legacy system.** The manual says it's "retained for
  backwards compatibility" and that "for new projects, use the Animator
  component."
- **Three docs pages take three postures.** The manual's component page says
  don't, the manual's system page lists its merits, and the Scripting Reference
  has no legacy marking.
- **`Animator.CrossFade`'s second argument isn't seconds.** The name is
  `normalizedTransitionDuration` and the description says "normalized" — while
  **the API docs never say normalized to what.**
- **For seconds, use `CrossFadeInFixedTime`.** That's the one whose meaning
  matches when porting an old number.
- **Precompute state hashes.** Not only for performance: `CrossFade`'s two
  overloads have different `normalizedTimeOffset` defaults.

What makes an old post dangerous isn't being wrong — it's **being right about
something else.** The `0.3f` here is still a valid number, and it means
something different the moment you copy it across.

---

### References

- [Animation.CrossFade — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Animation.CrossFade.html)
- [Animator.CrossFade](https://docs.unity3d.com/ScriptReference/Animator.CrossFade.html)
- [Animator.CrossFadeInFixedTime](https://docs.unity3d.com/ScriptReference/Animator.CrossFadeInFixedTime.html)
- [Legacy Animation component — Unity Manual](https://docs.unity3d.com/Manual/class-Animation.html)
- [Legacy Animation system](https://docs.unity3d.com/6000.2/Documentation/Manual/Animations.html)
- [Animation transitions — Fixed Duration](https://docs.unity3d.com/Manual/class-Transition.html)

The source this post started from is [주누다 — \[Unity\] CrossFade](https://sharkmino.tistory.com/1426)
(2014-06-02). Its explanation matched the current docs for `Animation.CrossFade`;
the `Animator` differences were checked separately against the Scripting
Reference and the manual.
