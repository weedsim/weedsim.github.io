---
pubDatetime: 2026-09-29T19:00:00+09:00
title: "A One-Way Platform Is an Angle, Not a Direction"
lang: en
translationKey: unity-2d-one-way-platform
featured: false
draft: false
tags:
  - Unity
  - 2D
  - Physics
  - C#
description: "Finding PlatformEffector2D is the right answer. But what the component actually evaluates isn't 'did you come from above or below' — it's whether the contact normal falls inside an arc. Not knowing that angle is what snags you at the edges."
---

I clipped this while building a 2D platformer and looking for **how to handle
floating platforms.** The author got stuck in the same place — making floating
platforms for a 2D endless runner, stopping at "if the character jumps from
under the platform it should pass through and land on top," and writing up the
answer in 2023. The post records where it got stuck and how the search went,
which makes it good reading. That the same question comes out of two different
2D projects is itself what the author calls the genre's unwritten standard.

> At first I thought of this.
> 1\. Have the player cast downward and toggle the platform's collider on/off?
> 2\. Or have the platform do an overlap check and only turn the collider on
> when the player is above?

Both are workable, and setting them aside to **find the component the engine
already ships** is this post's achievement. `PlatformEffector2D` is the right
answer.

But what the post tells you stops at **turn on two checkboxes.** So when it
works fine and then snags oddly at an edge, or a character with two colliders
gets caught, there's nowhere obvious to look. **What this component actually
evaluates is an angle, not a direction** — and that angle is a value sitting in
the Inspector.

## Table of Contents

## Finding the Component Is the Right Call

Start with what's right. The setup procedure is accurate.

> Attach a collider to the platform first, check **Used By Effector** on the
> collider, then add this component. **Use One Way** has to be checked of
> course, but it's checked by default.

The class description in the Scripting Reference is short and says the same
thing.

> **Applies "platform" behaviour such as one-way collisions etc.**

And the observation in the conclusion holds up too.

> In my opinion the biggest difference between 2D and 3D in Unity is the physics
> simulation. … The collider components are separate for 2D, rigidbodies are
> separate, and even casting a ray goes through the Physics2D class separately.

That's a fair summary. I covered the 2D rigidbody side separately in
[the FreezePositionY post](/posts/rigidbody-constraints/).

One note: the documentation link the clipping gives is the **Unity 5.3 Korean
manual.** It's a 2015 document, so some of it doesn't match today's API. One
instance shows up below.

## One-Way Is an Angle, Not a Direction

This component's key property is `Surface Arc`, and it never appears in the
clipping. From the manual:

> **Surface Arc** — The angle of an arc **centered on the local 'up'** defines
> the surface which doesn't allow colliders to pass. **Anything outside of this
> arc is considered for one-way collision.**

The Scripting Reference agrees.

> **surfaceArc** — The angle of an arc that defines the surface of the platform
> **centered of the local 'up' of the effector.**

Read it and the criterion isn't "did it come from above or below." It's
**whether the contact normal falls inside that arc.** Which brings these
consequences:

- **The arc is anchored to the effector's local up.** Rotate the platform and
  the arc rotates with it. That's why sloped platforms just work.
- **Narrow the angle and less gets blocked.** The default 180° is the entire
  upper half. Narrow it and glancing contacts pass through.
- **Widen it and it becomes an ordinary wall.** Approaching 360°, it blocks from
  every direction.

Symptoms like "sometimes I don't land on the edge" come from here. Hit the
corner of a platform at an angle and **the normal falls outside the arc, so it's
treated as a pass-through.** That's not a bug, it's a setting.

| Desired behavior | Surface Arc |
|---|---|
| Standard one-way | 180° (upper half) |
| Catch reliably even at corners | Wider than 180° |
| Let glancing contacts through | Narrower than 180° |
| Effectively a normal collider | Close to 360° |

And the arc can be **rotated.** From the Scripting Reference:

> **rotationalOffset** — The rotational offset angle from the local 'up'.

For a one-way ceiling — punch through from below, can't come back down — set
this to 180. **The 5.3 manual page the clipping links doesn't have this
entry.** The current scripting API does.

## Two Checkboxes the Clipping Doesn't Mention

### `Use One Way Grouping`

This is the answer to a character with more than one collider **getting stuck.**
The manual spells out the use case.

> Ensures that all contacts disabled by the one-way behavior **act on all
> colliders.** This is useful when **using multiple colliders on the object
> passing through the platform** and they all need to act together as a group.

A character with separate body and foot colliders, or one carrying a weapon
hitbox, runs into this. **When one collider passes and another blocks**, the
character ends up half-embedded in the platform. It's one checkbox.

### `Use Collider Mask` / `Collider Mask`

The clipping's initial worry was "computation," and this is the way to narrow
what's involved without scripting.

> **Use Collider Mask** — Select this option to indicate the use of the Collider
> Mask property. If this isn't selected, **the global collision matrix** is
> chosen as the default for all colliders.

> **Collider Mask** — The mask used to select **specific layers** allowed to
> interact with the Effector.

You can make *this platform* respond only to the player layer without touching
the global collision matrix. That's where you go when enemies or projectiles
should just pass by.

The remaining three, for completeness:

| Property | Description |
|---|---|
| `Side Arc` | An arc defining the sides, centered on the Effector's local 'left' and 'right'. Normals within it are considered for the 'side' behaviors |
| `Use Side Friction` | Whether friction is used on the platform sides |
| `Use Side Bounce` | Whether bounce is used on the platform sides |

There's a reason turning side friction off is the common choice: it stops a
character that jumped into the platform's side from **hanging there instead of
sliding off.**

## Dropping Down With the Down Key — Docs Instead of a Video

The clipping stops here.

> If you want to implement the pattern common in platformers, **"press down to
> drop through,"** the video above should help.

The part handed off to a video is the one most often needed next. Written from
what's documented, it comes out like this.

The core is `Physics2D.IgnoreCollision`.

> `public static void IgnoreCollision(Collider2D collider1, Collider2D collider2, bool ignore = true);`

> Makes the collision detection system **ignore all collisions/triggers between
> `collider1` and `collider2`.**

And the caveat the docs attach matters.

> **It is not persistent.** This means that the ignore collision state will not
> be stored in the editor when saving a Scene.

On top of that, **deactivating either collider loses the ignore state, so you
have to reapply it.** In an endless runner using object pooling, that sentence
becomes a bug directly: the moment a platform is toggled off, the ignore is
gone.

```csharp
using System.Collections;
using UnityEngine;

/// <summary>
/// Drops through a one-way platform on the down key.
/// Attach to the player.
/// </summary>
[RequireComponent(typeof(Collider2D))]
public class OneWayDropper : MonoBehaviour
{
    private const float DROP_DURATION = 0.35f;

    [Header("Drop")]
    [SerializeField, Range(0.1f, 1f), Tooltip("How long collisions are ignored (seconds)")]
    private float _dropDuration = DROP_DURATION;

    [SerializeField, Tooltip("The layer the one-way platforms are on")]
    private LayerMask _platformLayers;

    private Collider2D _collider;
    private Collider2D _standingOn;
    private bool _isDropping;

    private void Awake()
    {
        TryGetComponent(out _collider);
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        // Remember the platform we're standing on. That's what we pass through.
        if (IsPlatform(collision.collider))
        {
            _standingOn = collision.collider;
        }
    }

    private void OnCollisionExit2D(Collision2D collision)
    {
        if (collision.collider == _standingOn)
        {
            _standingOn = null;
        }
    }

    /// <summary>Called from the input side.</summary>
    public void RequestDrop()
    {
        if (_isDropping || _standingOn == null)
        {
            return;
        }

        StartCoroutine(DropThrough(_standingOn));
    }

    private IEnumerator DropThrough(Collider2D platform)
    {
        _isDropping = true;

        Physics2D.IgnoreCollision(_collider, platform, true);

        yield return new WaitForSeconds(_dropDuration);

        // Docs: not persistent, and the state is lost if either side is deactivated.
        // So check it's still alive before restoring.
        if (platform != null)
        {
            Physics2D.IgnoreCollision(_collider, platform, false);
        }

        _isDropping = false;
    }

    private bool IsPlatform(Collider2D other)
    {
        return (_platformLayers.value & (1 << other.gameObject.layer)) != 0;
    }
}
```

That `platform != null` check exists because of the docs' "not persistent"
sentence. Touching a platform that's been returned to the pool and deactivated
achieves nothing, and since it's a Unity object, **the check has to be
`!= null`, not `?.`.**

Rotating `rotationalOffset` to 180 is another route, but it applies to
**everyone standing on that platform.** In multiplayer, or when an enemy is up
there too, `IgnoreCollision` is the right one.

## Where and Why You'd Use It

`PlatformEffector2D` is the default for any 2D game that needs **platforms you
jump up onto.** It beats hand-rolling the "cast and toggle the collider" idea
the clipping started from — instead of a check every frame, **the physics engine
decides from the normal at contact time.**

### One Floating Platform, Configured

What to fill in the Inspector and why:

| Item | Value | Reason |
|---|---|---|
| Collider 2D → Used By Effector | Checked | Without it the effector never picks up the collider |
| Use One Way | Checked | The one-way behavior itself |
| Surface Arc | 180 (default) | Blocks the upper half |
| Use One Way Grouping | **Checked** | Required if the player has more than one collider |
| Use Collider Mask | As needed | When each platform should target its own layers |
| Use Side Friction | Off | Stops hanging on the side |

I'd make **leaving `Use One Way Grouping` on** the default. The symptom of not
having it is "it gets stuck sometimes," which is unusually hard to track down
later.

### When to Touch the Angle

- **Sloped platform** — rotate the platform and the arc follows. Nothing to do.
- **One-way ceiling** — set `rotationalOffset` to 180.
- **Keeps passing through at corners** — widen the Surface Arc.
- **Blocked on a diagonal jump** — narrow the Surface Arc.

Map symptoms to a single value and this component stops being "a checkbox that
either works or doesn't."

### Where Not to Use It

- **Adding the effector without checking `Used By Effector` on the collider.**
  Nothing happens.
- **Turning off `Use One Way Grouping` with a multi-collider player.** It ends
  up half-embedded.
- **Calling `IgnoreCollision` and never undoing it.** Not persistent, but it
  lasts the session.
- **Mixing object pooling with `IgnoreCollision` and ignoring deactivation.**
  One side going off loses the state.
- **Implementing drop-through by rotating `rotationalOffset` on every
  platform.** It applies to everyone on it.
- **Hand-rolling it with a cast every frame.** That's what the clipping set
  aside, and setting it aside was right.

## Wrapping Up

- **Finding the right component is accurate.** `PlatformEffector2D` is correct,
  and `Used By Effector` + `Use One Way` is the minimum setup.
- **The criterion is an angle, not a direction.** In the manual's words, **"the
  angle of an arc centered on the local 'up' defines the surface which doesn't
  allow colliders to pass"**, and **"anything outside of this arc is considered
  for one-way collision."**
- So **passing through at an edge isn't a bug, it's the Surface Arc value.**
- **`rotationalOffset` rotates the arc.** That's where a one-way ceiling comes
  from. The 5.3 manual the clipping links has no such entry.
- **`Use One Way Grouping` is the answer to "it gets stuck sometimes."** It makes
  multiple colliders on the passing object act together.
- **`Use Collider Mask` picks layers per platform** instead of the global
  collision matrix.
- **Drop-through can be written with `Physics2D.IgnoreCollision`.** But the docs
  say **"it is not persistent"**, and the state is lost when either side is
  deactivated. Pooling snags here.

It's a feature that ends in a checkbox, so posts about it tend to end at the
checkbox too. **But this component exposes eight values in the Inspector**, and
half of them map precisely onto "works fine, then occasionally weird" symptoms.
Knowing **where to look when it goes odd after you turn it on** lasts longer
than knowing how to turn it on.

---

### References

- [PlatformEffector2D — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/PlatformEffector2D.html)
- [Platform Effector 2D — Unity Manual](https://docs.unity3d.com/Manual/class-PlatformEffector2D.html)
- [Physics2D.IgnoreCollision — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Physics2D.IgnoreCollision.html)

The starting point for this post was [Oniboogie — \[Unity2D\] 공중 플랫폼(일방통행 플랫폼) 만들기](https://trialdeveloper.tistory.com/64)
(2023-01-25). I followed its path to the component as written, then checked what
that component actually evaluates against the current manual and Scripting
Reference. Quotes from it are my translations.
