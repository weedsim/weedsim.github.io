---
pubDatetime: 2026-10-02T16:00:00+09:00
title: "Bounciness and Friction Belong to a Pair, Not to an Object"
lang: en
translationKey: rigidbody-physics-material
featured: false
draft: false
tags:
  - Unity
  - Rigidbody
  - Physics
  - C#
description: "A 2020 learning log that turns Rigidbody and Physics Material dials and films the result. The observations are good, but two puzzles are left open. Both resolve in the same place: bounciness and friction aren't one object's values, they're made by the two colliders in contact together."
---

I clipped this while working on a game project and wanting to **apply physics —
gravity, collisions — with a Rigidbody**, looking for how to do it. It's a 2020
learning log titled "Game Development Day 5," and it **changes values by hand and
films the result** for gravity, collisions, bounciness and friction. Exactly the
kind of thing I was after.

And there are **two places where the author writes that they don't get it.**

> But watching it, the ball doesn't keep bouncing to the same height — it climbs.
>
> Huh... is it because the floor's bounciness gets combined too?

> This time I set the friction to 0 ... The box got pushed by the ball and then
> stopped.
>
> Here I set friction to 0 and set the combine method to Minimum.
>
> And now the box keeps sliding, like it's on ice.

The second is the strange one. **Friction was set to 0 and only the combine mode
changed, yet the result differs.** Averaging zero or taking the minimum of zero
should both be zero, and it isn't.

Both resolve in the same place. **That value isn't a property of one object.** The
two colliders in contact each supply a value, and those two are combined into a
value for the pair. Look only at the side you set to 0 and the arithmetic doesn't
add up.

## Table of Contents

## The Observations Are Good, and Three Things Are Wrong

What's well put first. The sentence about what collision is based on is accurate.

> So you shouldn't think of the object as the basis for collision — you have to
> think of the Collider!

And the way it's proved is good. Two balls get Sphere Collider radii of 0.5 and 1,
both are dropped, and the one with radius 1 is shown **floating above the ground.**
The ball you see and the region that collides are different things. There aren't
many better explanations than that for a beginner.

The explanation of fall speed is right too.

> But a larger mass doesn't make the fall faster
>
> because in free fall there's a constant value called gravitational acceleration

Right, and why it's right sits in one word in the Physics settings docs.

> **Gravity:** Use the x, y and z axes to set the amount of gravity applied to all
> Rigidbody components. ... Gravity is defined in world units per **seconds
> squared.**

Not "distance per second" but "distance per second squared." It's an acceleration,
so there's nowhere for mass to enter. Mass matters **when a force is applied**,
which is why the post's "mass is related to force but doesn't affect fall speed"
is also accurate.

Three things are wrong.

**First, adding a Rigidbody doesn't bring a Collider.** The post writes this.

> When you add a Rigid body, there's **something that always gets added to the
> Inspector along with it** — that's the Collider

It doesn't come along. `Rigidbody` carries no attribute requiring a Collider. The
docs put it this way — a Rigidbody responds to collisions **"if the right Collider
component is also present."** Present and it responds; absent and it doesn't.

Why the author saw it that way is guessable. A primitive made with
`GameObject > 3D Object > Sphere` **already has a Collider.** Add a Rigidbody to
that and the two appear together. The order is backwards.

Where this actually bites is **when you bring in a mesh of your own.** Drag in an
FBX, attach only a Rigidbody, and there's no Collider — so **it falls straight
through the floor.** Gravity applies; there's no surface to stop on.

**Second, the names changed.** Follow the 2020 post today and the code won't
compile.

| At the time of the post | Now |
| --- | --- |
| `PhysicMaterial` | `PhysicsMaterial` |
| `Rigidbody.drag` | `Rigidbody.linearDamping` |
| `Rigidbody.angularDrag` | `Rigidbody.angularDamping` |
| `Rigidbody.velocity` | `Rigidbody.linearVelocity` |

```csharp
// Written following the 2020 post. This no longer compiles.
PhysicMaterial bounce = new PhysicMaterial("Bounce");
_rigidbody.drag = 0.5f;
_rigidbody.angularDrag = 0.05f;
_rigidbody.velocity = Vector3.up * 5f;
```

```csharp
// The current names. The meaning is the same as above.
PhysicsMaterial bounce = new PhysicsMaterial("Bounce");
_rigidbody.linearDamping = 0.5f;
_rigidbody.angularDamping = 0.05f;
_rigidbody.linearVelocity = Vector3.up * 5f;
```

The Inspector labels changed with them. The field the post calls "(Linear) Drag"
is now **Linear Damping**. The meaning of the value is unchanged — only the name
moved.

**Third, there is no field called `Gravity` in the Inspector.** The post's list
has "Gravity: gravity," but the actual field is `Use Gravity` and it's a checkbox.
The magnitude of gravity lives in the Physics settings, not on the object. The
body text correctly says "when Use Gravity is checked," so it looks like a slip in
the list.

## Bounciness and Friction Are a Pair's Values, Not an Object's

This is where the second puzzle resolves. The docs' first sentence is the whole of
it.

> When two colliders are in contact, the physics system uses the surface
> properties of **each collider** to calculate the **total friction and bounce
> between the two surfaces.**

Each collider has a value, and the physics system makes a value **"between the two
surfaces"** out of them. There are four calculation modes and all four take two
values.

| Combine | Doc description | With 0 and 0.6 |
| --- | --- | --- |
| Maximum | "Use the largest of the two values." | 0.6 |
| Multiply | "Use the product of one value multiplied by the other." | 0 |
| Minimum | "Use the smallest of the two values." | 0 |
| Average | "Use the mean average of the two values; that is, the sum of both values, divided by two." | 0.3 |

Now the author's screen is computable. The post set the ball's physics material
friction to 0 and changed only the combine mode. **It never touched the floor's
value.** A newly created physics material has a friction default of 0.6, and a
floor with no material assigned still has a value.

> **Default Material:** Set a reference to the default **Physics Material** to use
> if none has been assigned to an individual **Collider**.

Assign no material to a collider and the default material is used. **"No material"
and "no friction" are different things.**

| What the author set | What was actually used | What they saw |
| --- | --- | --- |
| Ball 0, mode Average | (0 + 0.6) / 2 = **0.3** | Box pushed, then stopped |
| Ball 0, mode Minimum | min(0, 0.6) = **0** | Keeps sliding like ice |

It wasn't an average of zero — it was **an average of 0 and 0.6.** So "I set
friction to 0 and the box still stops" isn't a contradiction. The real friction
was 0.3.

The same reason explains another of the post's observations.

> But when the ball and the floor collided, Minimum and Multiply were both 0

Whether it's the floor or the ball, **if one side is 0** then Minimum is 0 and
Multiply is 0 too. The ball's bounciness was set to 1, so the zero side is the
floor. That is, **the floor's bounciness was 0** — a fact this one line reveals.
The author's guess, "is it because the floor's bounciness gets combined too," was
right; they just couldn't find a way to check.

## Neither Side Gets to Pick the Combine Mode Alone

One more layer here. When the two colliders' materials carry **different Combine
modes**, whose wins?

> Unity takes **priority** into consideration when the colliders in a collider
> pair have Physic Material assets with different combine settings.

And the docs' table is ordered by priority — "The properties in the table are in
priority order."

| Priority | Combine |
| --- | --- |
| 1 (highest) | Maximum |
| 2 | Multiply |
| 3 | Minimum |
| 4 (lowest) | Average |

**Even if I set Average, if the other side is Maximum then Maximum applies.** It
isn't only the resulting value that the pair decides — the calculation mode is
decided by the pair too.

How that shows up in practice. You make a floor material set to Average and lay it
across the whole scene, then one day someone builds a "bouncy ball" and sets the
ball's material to Maximum. On every floor that ball touches, **the floor's
Average setting is ignored.** Fixing the floor changes nothing; you have to find
the ball.

That the default is Average reads differently alongside this table. Average is
**the lowest-priority value as the default.** So if nobody touches anything it
goes to Average, and the moment one side picks something else it gets pulled that
way. A default that quietly yields.

| Ball's setting | Floor's setting | What applies |
| --- | --- | --- |
| Average | Average | Average |
| Average | Maximum | **Maximum** |
| Minimum | Average | **Minimum** |
| Minimum | Multiply | **Multiply** |
| Maximum | Multiply | **Maximum** |

## Set It to 1 and Nothing Takes Energy Out

The first puzzle. Bounciness 1 with Bounce Combine set to Maximum, and **the ball
climbed higher each bounce.**

Two things overlap.

Maximum first. Per the table above it uses **the larger of the two values.** If the
ball is 1 then the pair's bounciness is 1 even when the floor is 0. So the
author's suspicion, "is it because the floor's bounciness gets combined too," **is
not the case here** — under Maximum the floor's value doesn't enter the result.
Where that guess was right was the Minimum and Multiply side.

Then the number 1. Here's the docs' description.

> **bounciness:** How bouncy is the surface? A value of 0 will not bounce. A value
> of 1 will bounce **without any loss of energy.**

No loss. It's been left in a state where **nothing reduces anything.** If each
collision sends out exactly the speed that came in, the height holds. So if it
grew rather than held, speed is being added somewhere and **there's nothing to
shave it off.**

The docs name two places speed can be added.

> **Default Contact Offset:** Set the distance the collision detection system uses
> to generate collision contacts. ... This is set to 0.01 by default.

> **Default Max Depenetration Velocity:** Define the default value for the maximum
> depenetration velocity (**the velocity that the solver can set to a body while
> trying to pull it out of overlap** with the other bodies).

Physics advances one fixed step at a time. If the ball sinks slightly into the
floor within a step, the solver pulls it out and **gives it speed.** With
bounciness below 1 that surplus gets shaved off at the next collision; at 1 it
isn't shaved, it stays. What stays accumulates, and the height climbs.

That said, **I couldn't find a sentence in Unity's docs saying "bounciness 1 adds
energy."** The above is an inference stitched from three quotes. One conclusion is
certain though — **1 is a boundary, not a ceiling.** Set it below 1 and a little
drains at every collision, and that "little" is what keeps the simulation stable.
The difference between 0.9 and 1 isn't 10% — it's **the difference between
converging and diverging.**

The opposite observation is explained too. With Average the post writes that "the
height it bounces back to halves each time," and that ball eventually stops.
Bounciness isn't the only reason it stops.

> **Bounce Threshold:** Set a velocity value. **If two colliding objects have a
> relative velocity below this value, they do not bounce off each other.** This
> value also reduces jitter, so it is not recommended to set it to a very low
> value.

Drop below that velocity and **bouncing switches off entirely.** At bounciness 0.5
it isn't bouncing infinitely smaller — at some line it simply stops. And the docs
give the reason: it's a jitter-reducing device, so don't push it too low.

## It Isn't Weight, It's How the Solver Classifies It

The post's last experiment. A box set up two ways with a ball rolled into it — a
box with no Rigidbody, and a box with a Rigidbody and Is Kinematic on. The push
differed, and the author guesses this.

> I think **adding a Rigid body gave the box weight**, and that's what made the
> difference in the result

**It isn't weight.** Look at the `isKinematic` docs and there's nowhere for mass to
enter.

> Controls whether physics affects the rigidbody. ... **Forces, collisions or
> joints will not affect the rigidbody anymore.**

Neither forces nor collisions move this body. Whatever the mass, the result is the
same. And it still pushes the other side.

> kinematic bodies ... **affect the motion of other rigidbodies through collisions
> or joints**

The box with no Rigidbody at all is the same. The docs call that a **static
collider.**

> **Static colliders:** The GameObject has a collider but no Rigidbody.

And both of them collide with the moving ball and send messages. Pulling two rows
out of the docs' matrix:

| One side | Other side | Result |
| --- | --- | --- |
| Static collider | Dynamic (Rigidbody) | Collides, messages sent |
| Kinematic | Dynamic (Rigidbody) | Collides, messages sent |
| Static collider | Kinematic | **No collision message sent** |
| Static collider | Static collider | **No collision message sent** |
| Kinematic | Kinematic | **No collision message sent** |

So it's clear that the "difference in how far it got pushed" the author saw didn't
come from mass. But **what it did come from can't be determined from the post
alone.** Whether the two boxes' collider sizes and centers, the ball's speed and
the materials were the same isn't verifiable from the footage. The post says "I
kept the size, distance and the ball's weight the same," but there's no mention of
physics materials — and as the previous section showed, **materials combine as a
pair, so changing the box's material changes the result.**

The difference actually worth memorizing is the bottom three rows. **If both are
static or both are kinematic, no collision message arrives.** Make two doors
kinematic and try to detect them hitting each other, and `OnCollisionEnter` never
fires once. That trips people up more often than weight does.

## Where and Why You'd Use It

### A Single Bouncing Ball

Say you want a ball that keeps bouncing to **a constant height** off the floor. Why
setting bounciness to 1 won't do it is above. The setup goes like this.

| Where | Value | Why |
| --- | --- | --- |
| Ball material Bounciness | 0.8 | 1 is a boundary. Stay below it |
| Ball material Bounce Combine | Maximum | Whatever the floor is, the ball decides |
| Floor material Bounciness | 0 | Under Maximum it doesn't enter the result |
| Physics setting Bounce Threshold | Leave at default | Lowering it brings jitter |

Setting Bounce Combine to Maximum is the point. Per the priority table above, **the
ball's side beats the floor's side.** With twenty kinds of floor you only have to
look at the one ball.

If the height has to hold, don't lean on bounciness — top it up in code.

```csharp
using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class ConstantBouncer : MonoBehaviour
{
    private const float TARGET_SPEED = 6f;
    private const float SPEED_TOLERANCE = 0.2f;

    [Header("Bounce")]
    [SerializeField, Range(0f, 1f), Tooltip("Trust this over the material's Bounciness")]
    private float _bounciness = 0.8f;

    private Rigidbody _rigidbody;

    private void Awake()
    {
        // A Rigidbody doesn't bring a Collider. Check that both are there.
        _rigidbody = GetComponent<Rigidbody>();

        if (!TryGetComponent(out Collider _))
        {
            Debug.LogError($"{name} has no Collider. A Rigidbody alone falls through the floor.");
        }
    }

    private void OnCollisionEnter(Collision collision)
    {
        // Re-establish the target speed along the contact normal.
        // This tops up what the material's bounciness shaved off, so it doesn't diverge.
        Vector3 normal = collision.GetContact(0).normal;
        float incoming = _rigidbody.linearVelocity.magnitude;

        if (incoming < TARGET_SPEED - SPEED_TOLERANCE)
        {
            _rigidbody.linearVelocity = normal * TARGET_SPEED;
        }
    }
}
```

Writing `linearVelocity` is the rename from the earlier section. Copy the 2020
post's code straight across and you get `velocity`, which no longer compiles.

Shaving to 0.8 and topping up in code is safer than leaving it at 1 and letting it
diverge. **When the shaving lives inside the solver and the adding lives inside my
code**, it's obvious where to look when things go odd.

### A Slippery Floor and a Non-Slippery One

Say you're making an ice zone. The common mistake is **setting only the ice
floor's friction to 0.** Per the arithmetic above, with the player's material at
0.6 and the floor at 0, Average gives 0.3. Not slippery.

You have to pick one of two.

| Approach | Setting | Watch out |
| --- | --- | --- |
| The floor decides | Ice material: friction 0, Friction Combine **Minimum** | Whatever the player's value, it becomes 0 |
| Match both sides | Lower the player's friction too | Non-ice floors get slippery as well |

The first is better. Minimum has higher priority than Average, so **even with the
player's material on Average, Minimum applies on the ice.** Build one floor and
you're done.

The opposite direction is the same trick. For a slope that must never be slipped
on, set that surface's material to friction 1 with Friction Combine **Maximum.**
Whatever climbs onto it, that surface wins.

```csharp
public static class TagNames
{
    public const string PLAYER = "Player";
}
```

```csharp
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Swaps the material only while inside the ice zone.
/// Swapping the material is easier to predict than touching the Rigidbody's damping.
/// </summary>
[RequireComponent(typeof(Collider))]
public class SlipperyZone : MonoBehaviour
{
    [Header("Materials")]
    [SerializeField, Tooltip("Make it friction 0 with Friction Combine set to Minimum")]
    private PhysicsMaterial _iceMaterial;

    // It has to be put back on exit. Remember each entering collider's original.
    private readonly Dictionary<Collider, PhysicsMaterial> _originals = new();

    private void OnTriggerEnter(Collider other)
    {
        if (!other.CompareTag(TagNames.PLAYER) || _originals.ContainsKey(other))
        {
            return;
        }

        // Docs: reading Collider.material duplicates a shared material.
        //       We only want to change which asset is referenced, so use sharedMaterial.
        _originals[other] = other.sharedMaterial;
        other.sharedMaterial = _iceMaterial;
    }

    private void OnTriggerExit(Collider other)
    {
        if (!_originals.TryGetValue(other, out PhysicsMaterial original))
        {
            return;
        }

        other.sharedMaterial = original;
        _originals.Remove(other);
    }
}
```

The reason for `sharedMaterial` is in the docs.

> **Collider.material:** The material used by the collider. **If material is shared
> by colliders, it will duplicate the material and assign it to the collider.**

The moment you read `material` the asset is duplicated. What we want here is **to
change which asset is referenced**, so no duplicate is needed. Conversely, if you
want to tweak this one collider's values, `material` is the right one.

> **Collider.sharedMaterial:** The shared physics material of this collider.
> **Modifying this material will change the surface properties of all colliders
> using the material.** In most cases you want to modify Collider.material
> instead.

That the material lives on the `Collider` matters. The post writes "you have to add
a Physics Material to the Rigid body," but the place the material field actually
appears is, as the post itself says in the next sentence, the **Collider.**

> Then a Material value gets added to the Collider section

### Where Not to Use It

**Building player movement out of friction.** Friction is computed after a contact
exists. It doesn't apply on frames spent in the air, and on a slope the normal
tilts and the result changes. Try to tune the feel of walking and stopping with
friction and **one value behaves differently on every piece of terrain.** Handle
movement by driving velocity directly, and use friction for local effects like a
"slippery zone."

**Bounciness 1.** Exactly as above. It's the value the docs describe as "without
any loss of energy," and with nothing shaving it off, it goes the accumulating way.

**Lowering Bounce Threshold to keep small bounces alive.** The docs talk you out of
it directly — "This value also reduces jitter, so it is not recommended to set it
to a very low value." Keep the tiny bounces and you keep the jitter too.

**Trying to detect a collision between two kinematics.** The matrix's last row. No
message arrives. Make one of them dynamic, or measure it yourself with a trigger
and a query like [`Physics.OverlapSphere`](/posts/physics-overlapsphere/).

**Using Is Kinematic to express "fixed."** For an obstacle that never moves, not
attaching a Rigidbody at all is cheaper — a static collider doesn't enter the
solver's dynamic set. Is Kinematic is a declaration that **"a script or an
animation moves this directly,"** and if nothing will move it there's no reason to
declare it. To lock only some axes,
[`RigidbodyConstraints`](/posts/rigidbody-constraints/) is the place.

## Wrapping Up

This post is a beginner's record of turning dials themselves and confirming the
result on screen. Showing with two radii that the collision region is the Collider
and not the object is still a good explanation, and the conclusion that mass
doesn't change fall speed is accurate.

The three wrong things are short. **A Rigidbody doesn't bring a Collider** — it was
already on the primitive, and on a mesh of your own the object falls through the
floor. And `PhysicMaterial`, `drag` and `velocity` have been renamed.

The two puzzles left open resolve in the same place. **Bounciness and friction
aren't one object's values.** In the docs' phrasing, the two colliders' values make
a value "between the two surfaces," which is why **averaging friction 0 with the
default 0.6 gives 0.3.** A collider with no material assigned still carries the
default material's values. And the pair decides the combine mode too — priority
runs Maximum > Multiply > Minimum > Average, and the default, Average, is the
lowest.

The diverging bounciness-1 case reads a little differently. Under Maximum the
floor's value never entered, and 1 is **the value with the shaving switched off.**
There's no way to undo the speed the solver gives while resolving overlap, so it
accumulates. Unity's docs don't describe that process directly, so it's an
inference — but the conclusion isn't. **1 is a boundary, not a ceiling.**

---

### References

- [Physics Material component reference — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/class-PhysicsMaterial.html)
- [How collider surface values combine — Unity Manual](https://docs.unity3d.com/6000.0/Documentation/Manual/collider-surfaces-combine.html)
- [Physics settings — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/class-PhysicsManager.html)
- [Colliders overview — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/CollidersOverview.html)
- [Interaction between collider types — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/collider-types-interaction.html)
- [Collider.material — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Collider-material.html)
- [Collider.sharedMaterial — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Collider-sharedMaterial.html)
- [Rigidbody — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Rigidbody.html)
- [Rigidbody.isKinematic — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Rigidbody-isKinematic.html)
- [PhysicsMaterial.bounciness — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/PhysicsMaterial-bounciness.html)

The starting point for this post was [뉴터 — \[게임 개발 5일차\] 유니티(unity) 물리엔진 적용하기(중력, 충돌, 탄성, 마찰), Rigid body!](https://m.blog.naver.com/haran3056/222033199454)
(2020-07-18). I checked the settings and observations the author ran themselves,
plus the two puzzles they left open, against the current Unity manual and
scripting reference.
