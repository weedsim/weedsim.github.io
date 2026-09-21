---
pubDatetime: 2026-09-21T20:20:00+09:00
title: "With IK Pass Off, All Six IK Functions Are Silent"
lang: en
translationKey: animator-members
featured: false
draft: false
tags:
  - Unity
  - Animator
  - Animation
  - C#
description: "I checked a 2021 set of study notes on Animator's properties and functions against the current docs. The descriptions are accurate; what's missing is the conditions that make those switches do nothing. Three places had that shape."
---

A 2021 post I clipped while looking for a way to drive IK from code. It
collects `Animator`'s properties and functions, and for something that labels
itself "notes on only what I learned while studying," **the writing is careful**:
signatures included, every argument explained — and six IK functions among them.

Four days ago, writing [the CrossFade post](/en/posts/animator-crossfade/), I
flagged a unit problem in a 2014 source. **The answer was already in this
clipping.** I'll get that out of the way first.

Then the main thing. These notes record **the switches you turn on** well, but
**the conditions that render those switches inert** are missing in three places.
All three have the same shape — you call the code and nothing happens — and
**the IK I came for was one of them.**

## Table of contents

## The answer to four days ago was here

The notes explain `CrossFade`'s second argument this way:

> Second argument: the delay time (the fade time it takes to change to the next
> animation). **At 0.1f, 10% of the animation being switched to is spent
> smoothly connecting the animations.**

**It correctly understands this as a ratio.** That contrasts with the 2014 source
calling the same slot "the time it takes to fade out," which reads as seconds.
Seven years apart on the same method name, and the later one is the accurate one.

One gap remains, though. These notes say **"10% of the animation being switched
to"** — basing it on the **destination** state. The animator transition inspector
docs use the opposite basis:

> If the **Fixed Duration** box is not checked, the transition time is
> interpreted as a fraction of the normalized time of the **source state**.

That's the description of inspector transitions, and the `CrossFade` API page
only says "normalized" without naming a basis. So **"it's a ratio" is settled,
and "a ratio of what" can't be settled from the API docs.** Which is still why
`CrossFadeInFixedTime` is the answer when you need seconds.

The notes' second example is worth a look too:

```csharp
anim.CrossFade("ATTACK", 0.1f, -1, 0f); // layer -1, replays (returns to 0 seconds)
```

The fourth argument, `0f`, is **spelled out deliberately.** As the earlier post
established, `CrossFade`'s overloads have different `normalizedTimeOffset`
defaults — `float.NegativeInfinity` for the string version, `0.0f` for the hash
version. Call it with a string and want zero, and **you really do have to write
it.** Omit it and the default differs.

## What the six IK functions assume

The longest section in these notes is IK, and it's what I came for.
`SetIKPositionWeight`, `SetIKRotationWeight`, `SetLookAtWeight`,
`SetIKPosition`, `SetIKRotation`, `SetLookAtPosition` — six of them, with
signatures. The descriptions are right.

What's missing is **where you call them** and **what has to be switched on.**

The `OnAnimatorIK` docs nail down the second:

> The Animator Controller layer you want to process IK on must have the **IK
> Pass option enabled.**

And on the first, they say:

> **Callback** for setting up animation IK (inverse kinematics). This callback
> can be used to set the positions of the IK goals and their respective weights.

The individual pages, like `SetIKPositionWeight`, carry **no** sentence saying
"call this only here." But the `OnAnimatorIK` docs' example calls four of the
functions inside that callback, and the description itself is "callback for
setting up IK." So to be precise: **the docs don't forbid it elsewhere — they're
written assuming that place.**

What actually bites in practice is **IK Pass.** It isn't code; it's a checkbox in
the animator controller's layer settings. With it off, you can call all six
functions and **nothing happens, with no exception and no warning.** No amount of
staring at the code shows you why.

Reading the list and calling `SetIKPosition` from `Update` is the natural first
attempt, and that attempt fails quietly.

## There's a function that overrides `applyRootMotion`

The notes list one property, `applyRootMotion`:

> Set it to `true` and root motion is turned on.

Correct. The docs' summary is "Should root motion be applied?" But a condition is
attached:

> `applyRootMotion` **has no effect** when a script implements
> **`MonoBehaviour.OnAnimatorMove`**.

Same shape again. **If the property is `true` and the character doesn't move,
the first thing to check is whether an `OnAnimatorMove` exists somewhere on the
object.** The Inspector checkbox is still ticked, so staring at it won't help.

It's common to implement `OnAnimatorMove` to take manual control of root motion
and then forget about it. From that moment on, `applyRootMotion` is display only.

## `SetTrigger` is listed; `ResetTrigger` isn't

The notes sort the parameter functions into two groups — `SetFloat`, `SetBool`,
`SetInteger`, `SetTrigger`, then `GetFloat`, `GetBool`, `GetInteger`. They even
caught `SetFloat`'s damping overload.

```csharp
SetFloat("Horizontal Move", moveInput.x * animationSpeedPercent, 0.05f, Time.deltaTime);
```

Which matches the declaration:

```csharp
public void SetFloat(string name, float value, float dampTime, float deltaTime);
```

But `ResetTrigger` is absent from the `Set` group. And triggers **behave
differently from the other parameters.** The docs:

> Unlike `bool`s which have the same `true`/`false` option, `Trigger`s have a
> `true` option which **automatically returns back to `false`**.

"Automatically returns" is stated; **when it returns isn't.** Instead, Unity ships
`ResetTrigger` and describes its purpose:

> Use this to reset a Trigger parameter in an Animator Controller that **could
> still be active.**

**"Could still be active"** is the operative phrase. A trigger you fired that no
transition consumed sticks around and goes off later, **at a moment you didn't
intend** — a dodge input pressed mid-attack firing the instant the attack ends.

The docs' own example resets competing triggers before setting a new one. With
only `SetTrigger` in the list, you never see the pair.

## Where and why you'd use this

All three items converge on **"the code is right and nothing happens."** So in
practice it's worth keeping the preconditions next to the code.

### The minimum shape that actually turns IK on

```csharp
using UnityEngine;

/// <summary>
/// Pins the right hand to a target and turns the gaze toward it.
/// Requires IK Pass to be enabled on the animator layer.
/// </summary>
[RequireComponent(typeof(Animator))]
public class HandIK : MonoBehaviour
{
    [Header("Target")]
    [SerializeField, Tooltip("Where the hand goes. Leave empty to apply no IK")]
    private Transform _target;

    [Header("Weights")]
    [SerializeField, Range(0f, 1f), Tooltip("Closer to 1 applies IK more strongly")]
    private float _positionWeight = 1f;

    [SerializeField, Range(0f, 1f), Tooltip("Look-at weight")]
    private float _lookWeight = 0.8f;

    private Animator _animator;

    private void Awake()
    {
        _animator = GetComponent<Animator>();
    }

    // IK functions belong in this callback. layerIndex is the IK Pass layer.
    private void OnAnimatorIK(int layerIndex)
    {
        if (_target == null)
        {
            // Drop the weights to 0 to fall back to the original animation.
            _animator.SetIKPositionWeight(AvatarIKGoal.RightHand, 0f);
            _animator.SetLookAtWeight(0f);
            return;
        }

        _animator.SetIKPositionWeight(AvatarIKGoal.RightHand, _positionWeight);
        _animator.SetIKPosition(AvatarIKGoal.RightHand, _target.position);

        _animator.SetLookAtWeight(_lookWeight);
        _animator.SetLookAtPosition(_target.position);
    }
}
```

A few intentions:

- **The precondition is written into the summary and a comment.** IK Pass is a
  setting invisible from the code, so whoever reads this component next should
  check it first.
- **No target means weights go to 0.** The docs describe the weight as "0 = at
  the original animation before IK, 1 = at the goal." Returning early without
  that leaves the previous frame's weight in place.
- **The comparison is `_target == null`.** `Transform` is a Unity object, so it
  has to go through the `==` overload. `?.` doesn't belong here.
- **`[Range(0f, 1f)]` is on the weights.** That only guards the Inspector,
  though; guarding values assigned from code takes separate work, as covered in
  [the attributes post](/en/posts/unity-attributes/).

### Firing triggers safely

Clear out the competing triggers **before** firing.

```csharp
private static readonly int ATTACK = Animator.StringToHash("Attack");
private static readonly int DODGE = Animator.StringToHash("Dodge");

public void Attack()
{
    // Lower the opposing trigger in case it's still pending.
    _animator.ResetTrigger(DODGE);
    _animator.SetTrigger(ATTACK);
}

public void Dodge()
{
    _animator.ResetTrigger(ATTACK);
    _animator.SetTrigger(DODGE);
}
```

**Precomputing the hashes isn't habit, it has a reason.** The string overloads
hash on every call. It's the same kind of tidying as pulling `[Range]`'s bounds
into `const`s on the attributes side.

### Where not to use it

- **Calling IK functions from `Update`.** The docs don't forbid it, but that
  isn't the place the API was written for. `OnAnimatorIK` is.
- **Trusting `applyRootMotion` alone.** An `OnAnimatorMove` on the same object
  nullifies it.
- **Using `SetTrigger` without its pair.** An unconsumed trigger persists.
- **Using `Play` as a substitute for a transition.** The notes describe it
  accurately — `Play` changes "abruptly." Blending means the `CrossFade` family.

## Summary

- **The 2021 notes correctly read `CrossFade`'s second argument as a ratio.**
  But "10% of the animation being switched to" bases it on the destination state,
  while the transition docs use the **source** state. The API docs can't settle
  it.
- **The six IK functions assume IK Pass on the layer.** With it off they're
  silent — no exception, no warning. The place to call them is `OnAnimatorIK`.
- **`applyRootMotion` has no effect when `OnAnimatorMove` is implemented.** The
  Inspector checkbox stays ticked, so the cause isn't visible there.
- **An unconsumed trigger persists.** That's why Unity has `ResetTrigger` for
  triggers that "could still be active." Lower competing triggers before firing.
- **`SetFloat` has a damping overload.** Exactly as the notes caught it:
  `(name, value, dampTime, deltaTime)`.

The weakness of list-shaped material shows here. **Write a function on one line
and what it does survives; what has to be in place for it to do that doesn't.**
These notes are unusually careful and it still happened, so the takeaway is that
preconditions are something you look up separately when reading a list.

---

### References

- [MonoBehaviour.OnAnimatorIK — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/MonoBehaviour.OnAnimatorIK.html)
- [Animator.SetIKPositionWeight](https://docs.unity3d.com/ScriptReference/Animator.SetIKPositionWeight.html)
- [Animator.applyRootMotion](https://docs.unity3d.com/ScriptReference/Animator-applyRootMotion.html)
- [Animator.SetTrigger](https://docs.unity3d.com/ScriptReference/Animator.SetTrigger.html)
- [Animator.ResetTrigger](https://docs.unity3d.com/ScriptReference/Animator.ResetTrigger.html)
- [Animator.SetFloat](https://docs.unity3d.com/ScriptReference/Animator.SetFloat.html)
- [Animator.Play](https://docs.unity3d.com/ScriptReference/Animator.Play.html)
- [Animation transitions — Fixed Duration](https://docs.unity3d.com/Manual/class-Transition.html)

The source this post started from is [공부하는 식빵맘 — Animation components and their properties/functions](https://ansohxxn.github.io/unitydocs/anim/)
(2021-01-17). I followed its structure and checked each item against the current
Scripting Reference.
