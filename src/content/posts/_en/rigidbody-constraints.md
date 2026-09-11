---
pubDatetime: 2026-09-11T18:00:00+09:00
title: "What FreezePositionY Freezes Is World Y"
lang: en
translationKey: rigidbody-constraints
featured: false
draft: false
tags:
  - Unity
  - Rigidbody
  - Physics
  - C#
description: "I checked a write-up on RigidbodyConstraints against the manual. Four enum members are missing, there's nothing about which axis it freezes relative to, and the bitwise explanation is wrong in two places."
---

While studying Rigidbody I saved a
[write-up](https://coding-shop.tistory.com/318) covering Unity's
`RigidbodyConstraints`. It lists six options and attaches examples of combining
them with `|` — short enough to skim.

I checked it against the manual. **Four enum members are missing**, and one of
them collapses the write-up's example from three lines to one. Something more
important is missing too: when it says "freezes rotation on the X axis,"
**there's nothing about which X that is.**

One more thing, separate from the write-up. A list of options and some `|`
examples doesn't let you picture **where or why you'd actually use this.** So
four places it genuinely comes up, with code, come first — the corrections
follow.

## Table of contents

## The four that aren't in the list

The write-up covers six members: `FreezeRotationX/Y/Z` and
`FreezePositionX/Y/Z`. It mentions `None` in one line under "extra info."

The actual enum has **ten**. The other four:

| Member | The manual's definition |
| --- | --- |
| `None` | "No constraints." |
| `FreezePosition` | "Freeze motion along all axes. Equivalent of `FreezePositionX \| FreezePositionY \| FreezePositionZ`." |
| `FreezeRotation` | "Freeze rotation along all axes. Equivalent of `FreezeRotationX \| FreezeRotationY \| FreezeRotationZ`." |
| `FreezeAll` | "Freeze rotation and motion along all axes. Equivalent of `FreezePosition \| FreezeRotation`." |

**The combination the manual spells out as "Equivalent of" is exactly what the
write-up's example writes by hand.** Its second example:

```csharp
// The write-up: freeze rotation on X, Y and Z
rigid.constraints = RigidbodyConstraints.FreezeRotationX
                  | RigidbodyConstraints.FreezeRotationY
                  | RigidbodyConstraints.FreezeRotationZ;

// Same thing
rigid.constraints = RigidbodyConstraints.FreezeRotation;
```

It's the same as ticking all three Freeze Rotation boxes in the Inspector's
Constraints row. Since that's the most common setup for keeping a character
upright, **the member people reach for most is the one missing from the list.**

## Where and why you'd use it

The moment you need constraints is usually one moment: **you want physics to
drive something, but there's an axis where physics doing whatever it likes is a
problem.** Compute everything yourself and collision response disappears; hand
everything over and it rolls off in directions you didn't want. Constraints draw
the line between those.

### 1. Keeping a character from falling over

The most common case. Put a Rigidbody on a capsule collider and walk it around,
and the character topples the moment it hits a wall or steps onto a slope.
Reasonable behavior from physics' point of view; a bug from the game's.

**Goal** — keep collision response and gravity, but let only my script decide
rotation.

```csharp
using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class PlayerBody : MonoBehaviour
{
    [Header("Movement")]
    [SerializeField, Range(1f, 20f), Tooltip("Turn speed in degrees per second")]
    private float _turnSpeed = 360f;

    private Rigidbody _rigidbody;

    private void Awake()
    {
        _rigidbody = GetComponent<Rigidbody>();

        // Stop physics from laying the character down. Movement stays with physics
        _rigidbody.constraints = RigidbodyConstraints.FreezeRotation;
    }

    // I do the turning. Constraints only bind the simulation, so this isn't blocked
    public void TurnTowards(Vector3 direction)
    {
        if (direction.sqrMagnitude < 0.001f) return;

        Quaternion target = Quaternion.LookRotation(direction, Vector3.up);
        transform.rotation = Quaternion.RotateTowards(
            transform.rotation, target, _turnSpeed * Time.deltaTime);
    }
}
```

One `FreezeRotation` locks all three axes. And **assigning to
`transform.rotation` still works** — because, as covered further down,
constraints bind only the simulation. That combination is what makes a character
that gets pushed around by physics without ever falling over.

### 2. Building 2.5D out of 3D physics

A use the manual names directly.

> The constraints can be combined using bitwise OR operations **for cases like
> 2D game development.**

A 3D scene with 3D models and 3D physics where gameplay happens on one plane.
You pin it so nothing leaks into depth (Z).

**Goal** — keep 3D assets and lighting while keeping the judgement as simple as
2D.

```csharp
// Play stays on the X-Y plane. Block depth movement and tipping out of screen
_rigidbody.constraints = RigidbodyConstraints.FreezePositionZ
                       | RigidbodyConstraints.FreezeRotationX
                       | RigidbodyConstraints.FreezeRotationY;
```

Rotation around the axis facing the camera (Z) is left open — a topple animation
or a rolling crate needs it. If nothing should rotate at all,
`FreezePositionZ | FreezeRotation` does it.

For what it's worth, if you're going 2D from the start, `Rigidbody2D` has its
own `RigidbodyConstraints2D`. It has six members, and there `FreezeRotation` is
defined as "Freeze rotation **along the Z-axis**." In 2D there's only one
rotation axis, so it isn't split per axis.

### 3. Objects you pick up and put down

Puzzles and simulations where you carry something. Physics mustn't interfere
while it's held, and it has to fall properly the moment you let go.

**Goal** — pause physics only while held, then put things back as they were.

```csharp
public class Grabbable : MonoBehaviour
{
    private Rigidbody _rigidbody;
    private RigidbodyConstraints _originalConstraints;
    private bool _isHeld;

    private void Awake()
    {
        _rigidbody = GetComponent<Rigidbody>();

        // Remember the original. This object may already carry other constraints
        _originalConstraints = _rigidbody.constraints;
    }

    public void Grab(Transform holder)
    {
        if (_isHeld) return;

        _isHeld = true;
        _rigidbody.constraints = RigidbodyConstraints.FreezeAll;
        transform.SetParent(holder);
    }

    public void Release()
    {
        if (!_isHeld) return;

        _isHeld = false;
        transform.SetParent(null);

        // Don't reset to None. Restore what was there before
        _rigidbody.constraints = _originalConstraints;
    }
}
```

The point is that `Release()` doesn't assign `RigidbodyConstraints.None`. If the
object had something like `FreezePositionY` on it to begin with, letting go would
silently clear it. **Code that turns something off has to remember the state
before it turned it on.**

### 4. Things that rotate on one axis only

Doors, levers, rotating platforms.

**Goal** — hold position and allow rotation on exactly one axis.

```csharp
// Pinned in place, Y rotation only
_rigidbody.constraints = RigidbodyConstraints.FreezePosition
                       | RigidbodyConstraints.FreezeRotationX
                       | RigidbodyConstraints.FreezeRotationZ;
```

This one is **the boundary**, though. If what a door needs isn't just limited
rotation but an angle range of "between 0 and 90 degrees," a hinge position, or
a spring, constraints can't do it. That's `HingeJoint` territory. **Constraints
lock an axis entirely or leave it open** — there's no in-between value. The
moment you cross that line, switching to a joint is the right move.

### Where not to use them

- **When you want to limit a range of angle or distance.** Constraints are on or
  off. That's a joint's job.
- **When you want to pin to the object's local axes.** The next section explains
  why that doesn't work.
- **When you aren't using physics at all.** If everything moves by script,
  `isKinematic` is simpler. Freezing every constraint and going kinematic are
  different things.

## Which axis — position is world, rotation is inertia space

Every description in the write-up reads "freezes rotation on the X axis."
**There's nothing about what that axis is relative to.** The manual states it in
one sentence on the `Rigidbody.constraints` page.

> Note that position constraints are applied in **World space**, and rotation
> constraints are applied in the **inertia space** (relative to
> `Rigidbody.inertiaTensorRotation`).

| Constraint | Reference space |
| --- | --- |
| Position (`FreezePosition*`) | **world space** |
| Rotation (`FreezeRotation*`) | **inertia space** (relative to `inertiaTensorRotation`) |

**They differ.** And neither is the object's local axes.

The position side bites first in practice. Rotate an object 45 degrees and apply
`FreezePositionY`, and what freezes is **the world's Y axis, not the direction
that object considers up.** Using it to pin an object sliding on a tilted
platform to "its own up and down" won't do what you meant. To pin to local axes,
you're in joint territory (`ConfigurableJoint`).

The rotation side is subtler. Neither local nor world but **the inertia tensor's
orientation**, so an asymmetric collider setup can put it somewhere other than
the axis you pictured. Most of the time — a character with a single capsule
collider, say — you won't notice. But **when a symptom like "why does only Z
rotate slightly" shows up, this is the place to suspect.**

Without that one sentence, "freezes" reads as local. That's the default
intuition.

## Two things wrong about the bitwise explanation

**First,** this line under "extra info":

> To use several options together, use the **| or &** operator.

**`&` can't combine them.** `|` turns bits on; `&` filters them. There are no
overlapping bits between `FreezeRotationX` and `FreezeRotationY`, so `&` gives
`None`. The write-up's own code shows this:

```csharp
rigid.constraints |= RigidbodyConstraints.FreezeRotationX;   // add
rigid.constraints &= ~RigidbodyConstraints.FreezeRotationY;  // remove
```

Where `&` appears, it's **removal**, and paired with `~` at that. The summary
line and the example say different things. Split three ways:

- combine — `|`
- remove — `&= ~`
- test whether it's set — `&` followed by `!= 0`, or `HasFlag`

**Second,** the separate item labeled "using a bit mask":

```csharp
int mask = (int)RigidbodyConstraints.FreezeRotationX | (int)RigidbodyConstraints.FreezeRotationY;
rigid.constraints = (RigidbodyConstraints)mask;
```

**This is exactly the same code as the example above it.** In C#, `|` between
enum values already performs a bitwise OR. Casting down to `int` and back does
nothing. Standing it up as a separate technique makes readers think **it's for
some different situation.** It's the same thing written longer.

## The line that won't compile

Only the "keeping existing constraints" block uses a different variable name.

```csharp
// The write-up
rigidbody.constraints |= RigidbodyConstraints.FreezeRotationX;
```

Every other example uses `rigid`; this one says `rigidbody`. It reads two ways
and **neither compiles.**

If it's meant to continue from the earlier examples, the name is wrong. If it's
meant to be the `rigidbody` shortcut property `MonoBehaviour` used to provide,
**that's gone.** The current Unity Scripting API has no `Component.rigidbody`
page (404). It's still in the Unity 5.x docs, which places when it was cleaned
up.

Written for today:

```csharp
[SerializeField]
private Rigidbody _rigidbody;

private void Awake()
{
    if (_rigidbody == null && TryGetComponent(out Rigidbody body))
    {
        _rigidbody = body;
    }
}

private void FreezeHorizontalDrift()
{
    _rigidbody.constraints |= RigidbodyConstraints.FreezePositionX;
}
```

The write-up's `Rigidbody rigid = GetComponent<Rigidbody>();` works, but it's not
a call to make somewhere that runs every frame, so grabbing the reference in
`Awake` is the better habit.

## Constraints bind the simulation only

Under "how to use it," the write-up lists "pinning objects: keeping an object
from moving from a particular position." True, with a defined scope. The first
sentence of the `Rigidbody.constraints` manual:

> Controls which degrees of freedom are allowed for **the simulation** of this
> Rigidbody.

**It constrains the simulation.** It stops physics from pushing the object
around; it doesn't stop a script assigning to `transform.position`. Set
`FreezeAll` and write the transform directly and the object moves. That's where
what "pinned" leads you to expect parts ways with the actual scope.

There's another property of the same kind that the write-up doesn't mention:
`Rigidbody.freezeRotation`.

> Controls whether **physics** will change the rotation of the object.

A `bool` switch that blocks all rotation, overlapping in purpose with
`FreezeRotation`. The manual introduces it for first-person games where you
drive rotation from the mouse directly. Knowing both exist keeps you from
getting confused reading existing code.

## What's still useful

**The pattern for toggling while preserving existing constraints** is the most
practical part of the write-up. Fix the variable name and it's usable as is.

```csharp
// Add one while keeping whatever is already set
_rigidbody.constraints |= RigidbodyConstraints.FreezeRotationX;

// Release just one
_rigidbody.constraints &= ~RigidbodyConstraints.FreezeRotationY;

// Release everything
_rigidbody.constraints = RigidbodyConstraints.None;
```

Separating assignment (`=`) from addition (`|=`) is good too. Overwrite with `=`
while another system has already set constraints and that system's setup
silently disappears — and surprisingly few write-ups split that difference into
examples.

**The list of applications** is sound as well. Limiting character rotation,
pinning objects, puzzles built on restricted movement — those are where
constraints actually go.

## Wrapping up

- Four places they come up: **a character that won't fall over**
  (`FreezeRotation`), **2.5D built from 3D**, **pick up and put down** (restore
  the original value), and **single-axis rotators**. The moment you need an angle
  range, it's a joint.
- The enum has **ten** members. `FreezePosition`, `FreezeRotation` and
  `FreezeAll` — which the write-up skips — are defined in the manual as
  "Equivalent of", and **the write-up's three-line OR is one line of
  `FreezeRotation`.**
- **Position constraints are world space; rotation constraints are inertia
  space** (relative to `inertiaTensorRotation`). Neither is the object's local
  axes. For local axes, look at joints.
- **`&` can't combine constraints.** Combine with `|`, remove with `&= ~`, test
  with `&` and a comparison.
- **The "using a bit mask" example is the same code as the one above it.** The
  `int` casts do nothing.
- The `rigidbody.constraints` line **won't compile.** Either the variable name is
  wrong or it refers to the removed `Component.rigidbody`.
- **Constraints bind the simulation.** They don't stop direct `transform` writes.
  There's also `Rigidbody.freezeRotation` for rotation alone.
- The `|=` and `&= ~` pattern for toggling while keeping existing constraints
  holds up.

What's easy to miss when writing up an enum is **the combination members.**
Listing the individual values is straightforward; a member like `FreezeRotation`
that pre-packs several bits is easy to skip past while scanning. And in practice
that's usually the one you reach for.

And **"which axis" is information the enum name can never give you.** Nothing in
the name `FreezePositionY` says world or local. The more self-evident a name
looks, the more it's a place to check the documentation once more.

## References

- [RigidbodyConstraints — Unity Scripting API](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/RigidbodyConstraints.html)
- [Rigidbody.constraints — Unity Scripting API](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Rigidbody-constraints.html)
- [Rigidbody.freezeRotation — Unity Scripting API](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Rigidbody-freezeRotation.html)
- Source: [RigidbodyConstraints: controlling rotation and position](https://coding-shop.tistory.com/318)
