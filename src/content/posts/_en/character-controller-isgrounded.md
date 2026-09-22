---
pubDatetime: 2026-09-22T14:00:00+09:00
title: "isGrounded Isn't a Sensor — It's a Record of the Last Move"
lang: en
translationKey: character-controller-isgrounded
featured: false
draft: false
tags:
  - Unity
  - CharacterController
  - Physics
  - C#
description: "I checked a post about replacing a misbehaving isGrounded with a raycast against the current docs. The symptom and the fix are both real, but the docs put the cause somewhere else — and one number in the fix is far more generous than intended."
---

I hit a situation where `CharacterController.isGrounded` stopped working
properly on non-flat terrain like slopes. Looking for a way around it, I found
**someone's record of the same symptom** and clipped it. It's short, but it
preserves the order things happened in, which makes it worth reading.

> While working on the project I confirmed that the Character Controller's
> isGrounded property wasn't working properly.

> One method I found by searching was setting the Character Controller's Min
> Move Distance to 0. The detection got much better than before, but on bumpy
> downhill slopes it still didn't work properly.

**The symptom is identical.** The fix works, too. But before just taking the
workaround, I wanted to know the cause, so I compared against the current docs —
and **the cause is somewhere else**, while one number in the final fix is **far
more generous than intended.**

## Table of contents

## The symptom is real; the cause is in the docs

Look up `isGrounded` in the Scripting Reference and the first line reads:

> Was the CharacterController touching the ground **during the last move**?

And the description nails it down again:

> Indicates whether the CharacterController was touching the ground **during the
> most recent call** to `CharacterController.Move` or
> `CharacterController.SimpleMove`.

**It isn't a sensor that answers about now.** It's a **record** of what the last
`Move` call ran into. That the name reads in the present tense is half the
problem.

Which puts code like this out of step:

```csharp
// isGrounded describes the previous frame's Move, not the one below
if (controller.isGrounded && Input.GetButtonDown("Jump"))
{
    moveDirection.y = jumpForce;
}

moveDirection.y -= gravity * Time.deltaTime;
controller.Move(moveDirection * Time.deltaTime);
```

That's the original's structure. **A frame sits between reading `isGrounded` and
the `Move` that produced it.** In that gap gravity is added once more, and the
character may already be slightly airborne.

`Move`'s own nature compounds it. From the docs:

> **`CharacterController.Move` does not use gravity.**

Since you add gravity yourself every frame, **on a downhill the character can't
keep up with the surface and lifts slightly each frame.** That's the situation
behind "on bumpy downhill slopes it still didn't work properly." `isGrounded`
isn't broken — **that frame's `Move` genuinely didn't touch the ground.**

## Min Move Distance 0 isn't a fix, it's the default

The first method the original found by searching. In the docs, this is **less a
discovery than a restoration.**

> If the character tries to move less than this distance, **it will not move at
> all.** This can be used to reduce jitter.

> **In most situations this value should be left at 0.**

The docs say to leave it at 0 outright. So **the problem was that it wasn't 0**,
and setting it to 0 returned it to the normal setting.

Why it affects ground detection is in that same sentence. When the value isn't
zero, **small movements are dropped entirely.** If the last few millimetres of
settling onto the ground fall under that threshold, `Move` does nothing — and so
no contact with the ground gets recorded.

"The detection got much better than before" is an accurate observation. **Part of
the cause was removed**, and what remained — the downhill case — is the frame lag
from the previous section.

## What a 1.5-metre ray actually permits

Here's the final fix:

```csharp
private bool IsGroundedUsingRay()
{
    if (controller.isGrounded) return true;

    var ray = new Ray(this.transform.position + Vector3.up * 0.1f, Vector3.down);
    var maxDistance = 1.5f;

    Debug.DrawRay(transform.position + Vector3.up * 0.1f, Vector3.down * maxDistance, Color.red);

    return Physics.Raycast(ray, maxDistance, _fieldLayer);
}
```

The structure is good. If `isGrounded` is `true` it returns without casting, so
the cost is low, and it passes an explicit layer mask. `Physics.Raycast` defaults
to `DefaultRaycastLayers`, so leaving it out catches more than you meant — the
default-value difference covered in
[the OverlapSphere post](/en/posts/physics-overlapsphere/) applies here too.

But **run the numbers and the detection range is large.**

The ray starts **0.1 m above** `transform.position` and travels **1.5 m** down,
so its lowest reach is **1.4 m below the pivot.** A `CharacterController`'s pivot
usually sits at the feet, which means this function **counts anything within
1.4 m below your feet as "grounded."**

| | Value |
|---|---|
| Ray origin | pivot + 0.1 m |
| Max distance | 1.5 m |
| Lowest reach | pivot − 1.4 m |

For a human-scale character of roughly 1.8 m, that's **jumping while up to
eight-tenths of your own height in the air.** Right after stepping off a cliff,
and for a while during the fall, it stays true.

The original really did solve its problem with that distance. But **the way it
solved it was by making the check generous**, and how generous is recorded in
the code only as `1.5f`.

One thing worth noting: this ray **ignores the character's own collider**, even
though it starts inside the capsule. The docs say why:

> Raycasts **will not detect Colliders for which the Raycast origin is inside the
> Collider.**

Whether that was intended or lucky I can't say, but it's why no self-exclusion
was needed.

## The problem with measuring ground at a single point

Shortening the distance leaves one problem. **A ray looks at one point.**

Say the character stands at the edge of a ledge with half the capsule over
nothing. A ray fired from the middle of the feet **passes through empty air.**
Visually they're standing; the check says airborne. Conversely, on a thin pillar
only the centre hits and it passes.

Ground is an area, so **measuring it as an area** fits better.
`Physics.SphereCast` is the tool.

> Casts a sphere of radius `radius` along `direction` for `maxDistance`. Useful
> when a regular raycast lacks precision, particularly for deciding whether an
> object of a given size can move through a space.

It comes with conditions, though. The docs attach two warnings:

> **`SphereCast` will not detect colliders for which the sphere overlaps the
> collider.**

> The hit normal **does not always represent the surface normal.** It frequently
> indicates the direction from the contact point toward the sphere's centre.

The first bites in practice. **Start the sphere at the feet and it already
overlaps the ground, so nothing is detected.** The origin has to be raised up
into the capsule. Because of the second, **don't use `SphereCast`'s normal for
slope checks.**

## Where and why you'd use this

That leaves three materials for a ground check — what `Move` returns, a sweep
query, and time.

### What `Move` already tells you

The original missed one thing. `Move` isn't `void`.

> `public CollisionFlags Move(Vector3 motion);`

> Returns a `CollisionFlags` that indicates the direction of a collision —
> `None`, `Sides`, `Above`, and `Below`.

**The method you're already calling hands back that frame's result.** It's the
cheapest way to dodge `isGrounded`'s one-frame lag.

```csharp
CollisionFlags flags = _controller.Move(_velocity * Time.deltaTime);

// This frame's result — not next frame's isGrounded.
bool touchedGround = (flags & CollisionFlags.Below) != 0;
```

### A footprint instead of a point

Using `SphereCast` means avoiding the overlap condition above. Sweep a sphere
slightly smaller than the capsule radius downward, **starting up inside the
capsule.**

```csharp
using UnityEngine;

/// <summary>
/// Checks a CharacterController's grounding across a footprint-sized area.
/// </summary>
[RequireComponent(typeof(CharacterController))]
public class GroundProbe : MonoBehaviour
{
    private const float SKIN_MARGIN = 0.05f;

    [Header("Probe")]
    [SerializeField, Range(0.01f, 0.5f), Tooltip("How far below the feet still counts as grounded")]
    private float _probeDistance = 0.15f;

    [SerializeField, Tooltip("Layers that count as ground")]
    private string[] _groundLayers = { "Ground" };

    [SerializeField, Range(0f, 89f), Tooltip("Slopes steeper than this don't count as ground")]
    private float _maxSlopeAngle = 45f;

    private CharacterController _controller;
    private int _mask;

    public bool IsGrounded { get; private set; }

    private void Awake()
    {
        _controller = GetComponent<CharacterController>();
        _mask = LayerMask.GetMask(_groundLayers);
    }

    public void Probe()
    {
        // Start the sphere above the capsule's base — an overlap isn't detected.
        float radius = _controller.radius - SKIN_MARGIN;
        Vector3 origin = transform.position
            + _controller.center
            - Vector3.up * (_controller.height * 0.5f - _controller.radius);

        float distance = _probeDistance + SKIN_MARGIN;

        if (!Physics.SphereCast(origin, radius, Vector3.down,
                out RaycastHit hit, distance, _mask, QueryTriggerInteraction.Ignore))
        {
            IsGrounded = false;
            return;
        }

        // SphereCast's normal may not be the surface normal. Confirm with a ray.
        if (Physics.Raycast(hit.point + Vector3.up * SKIN_MARGIN, Vector3.down,
                out RaycastHit surface, SKIN_MARGIN * 2f, _mask, QueryTriggerInteraction.Ignore))
        {
            IsGrounded = Vector3.Angle(surface.normal, Vector3.up) <= _maxSlopeAngle;
            return;
        }

        IsGrounded = true;
    }
}
```

A few intentions:

- **The distance is 0.15 m.** The original's 1.5 m bought leniency with distance;
  where leniency is wanted, buying it **with time** (next section) is better.
- **The sphere starts above the capsule's base**, because of the documented
  overlap condition.
- **The slope check uses a separate ray.** The docs warn that `SphereCast`'s
  normal may not be the surface normal.
- **`QueryTriggerInteraction.Ignore` is spelled out.** Triggers are included by
  default, as confirmed in [the earlier post](/en/posts/physics-overlapsphere/).

### Buy leniency with time, not distance

From here it's my judgment rather than the docs. What the original wanted from
1.5 m was probably **"a jump still registers just after the feet leave the
ground."** But **buying that with distance makes the value depend on the
terrain.** With a cliff below, the full 1.4 m is permissive; with floor right
below, it means nothing.

Buying the same thing with time is terrain-independent.

```csharp
private const float COYOTE_TIME = 0.12f;

private float _lastGroundedTime;

private void Update()
{
    _probe.Probe();

    if (_probe.IsGrounded)
    {
        _lastGroundedTime = Time.time;
    }

    bool canJump = Time.time - _lastGroundedTime <= COYOTE_TIME;
}
```

The ground check itself stays **strict**, and all the leniency collects in one
place, `COYOTE_TIME`. Because the number means "how many seconds since the feet
left" rather than "how many metres below the feet," **the thing you tune against
is how it feels to play.**

### Where not to use it

- **Reading `isGrounded` as the current state.** It's a record of the last
  `Move`.
- **Leaving Min Move Distance at anything but 0.** The docs recommend 0.
- **Stretching the ground distance to tune jump feel.** The value then depends on
  terrain.
- **Slope checks from `SphereCast`'s normal.** It may not be the surface normal.
- **A `SphereCast` starting at the feet.** An overlap isn't detected.

Handing movement to physics instead is another option; the constraint side of
that is in
[What FreezePositionY Freezes Is World Y](/en/posts/rigidbody-constraints/).

## Summary

- **`isGrounded` means "was it touching during the last `Move`."** Not a sensor
  for now but a record of the previous call, one frame out of step with where you
  read it.
- **`Move` does not apply gravity.** Because you add it yourself, the character
  lifts slightly each frame on a downhill. That's the original's symptom.
- **Min Move Distance 0 is the docs' recommended default.** "In most situations
  this value should be left at 0." The problem was that it wasn't.
- **The original's ray counts up to 1.4 m below the feet as grounded.** It did
  solve the problem, but by making the check considerably more generous.
- **`Move`'s return value, `CollisionFlags.Below`, is this frame's answer.** It
  comes free from a method you already call.
- **An area beats a point, and `SphereCast` has two conditions**: an overlap
  isn't detected, and its normal may not be the surface normal.

Code that fixes a symptom and documentation that explains the cause sometimes
drift apart. The original observed the symptom accurately and reached a working
fix, but skipped the step of checking **what `isGrounded` actually measures.** Had
I simply taken that code, I'd have been using 1.5 without knowing where it came
from. Meeting the same symptom, the first thing to look at isn't the workaround —
it's **the one line saying what the value measures.**

---

### References

- [CharacterController.isGrounded — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/CharacterController-isGrounded.html)
- [CharacterController.Move](https://docs.unity3d.com/ScriptReference/CharacterController.Move.html)
- [CharacterController.minMoveDistance](https://docs.unity3d.com/ScriptReference/CharacterController-minMoveDistance.html)
- [CharacterController.skinWidth](https://docs.unity3d.com/ScriptReference/CharacterController-skinWidth.html)
- [Physics.Raycast](https://docs.unity3d.com/ScriptReference/Physics.Raycast.html)
- [Physics.SphereCast](https://docs.unity3d.com/ScriptReference/Physics.SphereCast.html)

The source this post started from is [rohyunsang — Unity CharacterController isGrounded 판정 개선](https://velog.io/@rohyunsang/Unity-CharacterController-isGrounded-%ED%8C%90%EC%A0%95-%EA%B0%9C%EC%84%A0).
I left its symptom and fix as they are and checked the cause and the numbers
against the current Scripting Reference.
