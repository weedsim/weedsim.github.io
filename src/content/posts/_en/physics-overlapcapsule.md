---
pubDatetime: 2026-09-23T18:00:00+09:00
title: "OverlapCapsule's point0 and point1 Are Not the Capsule's Ends"
lang: en
translationKey: physics-overlapcapsule
featured: false
draft: false
tags:
  - Unity
  - Physics
  - C#
  - Optimization
description: "The docs call point0 'the center of the sphere at the start of the capsule.' That's the center of the end cap, not the tip. Read it as the tip and your capsule grows by twice the radius."
---

I clipped this while looking at `Physics.OverlapSphere` and **browsing around
for what else the Overlap family had.** The clipping answers that in its first
line.

> The Overlap functions are OverlapBox, OverlapSphere, and OverlapCapsule.

Three of them — and this 2019 post covers what to put in `OverlapCapsule`'s
`point0` and `point1`. The author says he got stuck in the same place.

> **I was wondering how to supply the two parameters point0 and point1 to the
> OverlapCapsule function. Googling didn't turn up much on how to use it, so I
> tried it myself.**

It's a post written from actually trying it, so the example is concrete and it
works. But **its one-line conclusion contradicts the documentation.** The gap
is exactly `radius` wide, so the larger the radius, the further intent drifts
from reality.

## Table of Contents

## What the 2019 Post Gets Right

Start with what's correct. It copies the signature over, and it matches today's
docs.

```csharp
public static Collider[] OverlapCapsule(
    Vector3 point0,
    Vector3 point1,
    float radius,
    int layerMask = AllLayers,
    QueryTriggerInteraction queryTriggerInteraction = QueryTriggerInteraction.UseGlobal);
```

It's right that the Overlap family is `OverlapBox` · `OverlapSphere` ·
`OverlapCapsule`, and right that **the order of the two points doesn't
matter**. The example passes `OverlapCapsule(pos2, pos1, radius)` — top first —
and since a capsule is the shape joining two spheres, either order gives the
same volume.

The problem is the line after that.

## `point0` and `point1` Are Not the Capsule's Ends

The post's conclusion:

> **What it comes down to is the topmost position and the bottommost position
> of the capsule.**

The documentation says:

> **point0** — The center of the sphere at the `start` of the capsule.

> **point1** — The center of the sphere at the `end` of the capsule.

**"The center of the sphere", not "the end of the capsule."** A capsule joins
two spheres and keeps those spheres on its ends. So the real capsule extends
**`radius` further outward** past `point0`, and the same past `point1`.

This is consistent with how Unity treats capsules elsewhere. The
`CapsuleCollider.height` docs say the same thing from the other side.

> The height is the actual height **including the half-spheres at each end.**

So in Unity, "capsule height" includes the caps, and `point0`/`point1` are
those caps' **centers**. They're two different reference points, offset from
each other by `radius`.

## So How Much Bigger Is the Real Capsule

As a formula:

```
actual total height = |point1 - point0| + 2 × radius
```

Plug in the original's example. `radius = 5f`, and the two points sit at
`Tr.position.y` ± `ConstHeight`.

| | Intended | Actual capsule |
|---|---|---|
| Distance between points | `2 × ConstHeight` | `2 × ConstHeight` |
| Total height | `2 × ConstHeight` | **`2 × ConstHeight + 10`** |
| With `ConstHeight = 1` | 2 | **12** |
| With `ConstHeight = 5` | 10 | **20** |

When `ConstHeight` is smaller than the radius, **the capsule is essentially two
spheres.** At `ConstHeight = 1` the intended height is 2 and the real one is
12 — six times over. Use that for enemy detection and you get "why is it
catching things behind me?"

It runs the other way too. Feed `|point1 - point0|` the height you want and
you always overshoot by `2 × radius`. **If you want an exact height, the
distance between the points has to be `height - 2 × radius`.**

If the two points are equal (`point0 == point1`), the spheres coincide and you
get **just a sphere** — the same test `OverlapSphere` performs. It's the same
reason you can't build a capsule shorter than `2 × radius`.

## Deriving the Two Points from a `CapsuleCollider`

In practice you rarely type `point0`/`point1` by hand. You derive them from a
`CapsuleCollider` you already have, or from a character's dimensions. Putting
the relationship above into code:

```csharp
using UnityEngine;

public static class CapsuleGeometry
{
    /// <summary>
    /// Gets the two sphere centers to pass to OverlapCapsule from a CapsuleCollider.
    /// Assumes direction is the Y axis (the default) and uniform scale.
    /// </summary>
    public static void GetPoints(
        CapsuleCollider capsule, out Vector3 point0, out Vector3 point1)
    {
        Transform t = capsule.transform;
        Vector3 center = t.TransformPoint(capsule.center);

        // height includes both half-spheres. The distance between the sphere
        // centers is that minus the diameter, and it can't go negative.
        float halfSpan = Mathf.Max(0f, capsule.height * 0.5f - capsule.radius);

        Vector3 axis = t.up;
        point0 = center - axis * halfSpan;
        point1 = center + axis * halfSpan;
    }
}
```

The `Mathf.Max` is there because of the last sentence in the previous section.
If `height` is smaller than `2 × radius`, `halfSpan` goes negative and the two
points flip, which is meaningless. Clamping to 0 collapses them into a sphere,
and that's the geometrically correct answer.

## The Other Two Parameters Hide Behind Defaults

The original's example passes only three arguments.

```csharp
Collider[] colls = Physics.OverlapCapsule(pos2, pos1, radius);
```

The remaining two take their defaults, and in two places those defaults don't
match intuition.

**The layer mask defaults to `AllLayers`** — not `DefaultRaycastLayers`, which
is what `Physics.Raycast` uses. `DefaultRaycastLayers` excludes the `Ignore
Raycast` layer; `AllLayers` doesn't. **An object you parked on `Ignore Raycast`
to keep it out of queries still shows up in `OverlapCapsule`.** I dug into that
difference in [the OverlapSphere post](/posts/physics-overlapsphere/).

**Triggers are hit by default.** `QueryTriggerInteraction.UseGlobal` means
"follow the project setting," and that setting — Queries Hit Triggers — is
**enabled by default.**

> Enable this option if you want physics hit tests (such as Raycasts,
> SphereCasts and SphereTests) to **return a hit when they intersect with a
> Collider marked as a Trigger.**

Spelling both out looks like this.

```csharp
[SerializeField] private LayerMask _targetLayers;

Collider[] hits = Physics.OverlapCapsule(
    point0, point1, radius,
    _targetLayers,
    QueryTriggerInteraction.Ignore);
```

## NonAlloc Isn't "Accumulates Less Memory"

The original explains `NonAlloc` this way:

> OverlapCapsuleNonAlloc doesn't return the allocated colliders, it returns the
> number of collisions. So **memory accumulates less** than with
> OverlapCapsule, which puts less load on the game.

The direction is right. The docs are blunter.

> Same as `Physics.OverlapCapsule` but **does not allocate anything on the
> managed heap.**

Not "less" — **zero**. There's a condition attached, though, and that condition,
absent from the original, is what actually produces bugs. The
`OverlapSphereNonAlloc` docs state it plainly.

> **Does not attempt to grow the buffer if it runs out of space. The length of
> the buffer is returned when the buffer is full.**

**Colliders beyond the buffer are dropped silently.** No exception, no warning.
If the return value equals the buffer length, don't read that as "it fit
exactly" — read it as **"there may have been more."**

```csharp
private const int MAX_HITS = 16;
private readonly Collider[] _hits = new Collider[MAX_HITS];

private int ScanCapsule(Vector3 point0, Vector3 point1, float radius)
{
    int count = Physics.OverlapCapsuleNonAlloc(
        point0, point1, radius, _hits, _targetLayers, QueryTriggerInteraction.Ignore);

    // Full means possibly truncated. If the logic needs every hit, grow the buffer.
    if (count == MAX_HITS)
    {
        Debug.LogWarning($"OverlapCapsule filled the buffer ({MAX_HITS}); results may be truncated.");
    }

    return count;
}
```

And **allocating the buffer fresh each frame defeats the point of `NonAlloc`.**
It has to be a `readonly` field built once and reused.

## Where and Why You'd Use It

There's a clear case where a capsule beats a sphere: **a detection volume
that's tall.** Growing a sphere's radius grows it in every direction, while a
capsule stretches along one axis only. A tall character's whole body, detection
that spans the top and bottom of a staircase, the reach of a long vertical
weapon.

### A Forward Melee Test with a Capsule

```csharp
using UnityEngine;

/// <summary>
/// Builds a tall capsule in front of the character and finds targets inside it.
/// </summary>
[RequireComponent(typeof(CapsuleCollider))]
public class CapsuleMeleeSensor : MonoBehaviour
{
    private const int MAX_HITS = 16;

    [Header("Range")]
    [SerializeField, Range(0.1f, 3f), Tooltip("Capsule radius (m)")]
    private float _radius = 0.6f;

    [SerializeField, Range(0.2f, 6f), Tooltip("Total capsule height including the caps (m)")]
    private float _height = 2f;

    [SerializeField, Range(0f, 5f), Tooltip("How far ahead of the character to push it (m)")]
    private float _forwardOffset = 1f;

    [Header("Filter")]
    [SerializeField] private LayerMask _targetLayers;

    private readonly Collider[] _hits = new Collider[MAX_HITS];
    private CapsuleCollider _body;

    private void Awake()
    {
        TryGetComponent(out _body);
    }

    /// <summary>Returns how many targets were found in range.</summary>
    public int Scan()
    {
        GetQueryPoints(out Vector3 point0, out Vector3 point1);

        int count = Physics.OverlapCapsuleNonAlloc(
            point0, point1, _radius, _hits, _targetLayers, QueryTriggerInteraction.Ignore);

        if (count == MAX_HITS)
        {
            Debug.LogWarning($"{name}: the capsule test filled the buffer; results may be truncated.");
        }

        for (int i = 0; i < count; i++)
        {
            // Skip ourselves. A capsule wrapping the body will always catch it.
            if (_hits[i].transform.root == transform.root) { continue; }

            if (_hits[i].TryGetComponent(out Damageable target))
            {
                target.ApplyHit();
            }
        }

        return count;
    }

    /// <summary>
    /// Gets the two sphere centers. _height includes the caps, so the distance
    /// between the centers is that minus the diameter.
    /// </summary>
    private void GetQueryPoints(out Vector3 point0, out Vector3 point1)
    {
        float halfSpan = Mathf.Max(0f, _height * 0.5f - _radius);

        Vector3 origin = transform.position
            + transform.forward * _forwardOffset
            + transform.up * (_height * 0.5f);

        point0 = origin - transform.up * halfSpan;
        point1 = origin + transform.up * halfSpan;
    }

    private void OnDrawGizmosSelected()
    {
        // Draw the two spheres separately. That is the volume actually tested.
        GetQueryPoints(out Vector3 point0, out Vector3 point1);
        Gizmos.color = Color.yellow;
        Gizmos.DrawWireSphere(point0, _radius);
        Gizmos.DrawWireSphere(point1, _radius);
    }
}
```

`OnDrawGizmosSelected` is in there on purpose, and it's this post's point.
**Draw the two spheres and you can see that the capsule reaches past the two
points.** What's confusing as arithmetic is obvious as a gizmo.

### What I Changed from the Original

The original's code:

```csharp
void Update()
    {

        //반경
    float radius = 5f;

        //캡슐의 맨아래 위치
        Vector3 pos1 = new Vector3(Tr.position.x, Tr.position.y-ConstHeight, Tr.position.z);
        //캡슐의 맨위 위치
        Vector3 pos2 = new Vector3(Tr.position.x, Tr.position.y + ConstHeight, Tr.position.z);

        Collider[] colls = Physics.OverlapCapsule(pos2, pos1, radius);

        for (int i = 0; i < colls.Length; i++)
        {

            _player = colls[i].GetComponent<Player_Script>();

            if(_player != null)
            {
               //...
            }
        }


    }
```

(The Korean comments are the author's; they read "radius", "bottommost position
of the capsule", "topmost position of the capsule".) What I changed, and why:

- **Corrected "topmost/bottommost position of the capsule" in the comments.**
  Those points are **the centers of the end caps**; the real capsule goes
  `radius` further.
- **Don't call it every frame in `Update`.** A melee test is needed on input.
  Detection that genuinely runs continuously should run on an interval.
- **`TryGetComponent` instead of `GetComponent`.** The original assigns the
  result to the `_player` field even on a miss, overwriting the previous
  frame's reference.
- **`OverlapCapsuleNonAlloc` with a reused buffer** instead of
  `OverlapCapsule`. No array allocated per frame.
- **Layer mask and trigger handling spelled out.** The defaults are `AllLayers`
  and triggers included.
- **Filter out self.** A capsule that wraps the body will always catch its own
  collider.

### Where Not to Use It

- **Passing the two ends of your intended height as `point0`/`point1`.** You
  overshoot by `2 × radius`.
- **Using `height` directly as the distance between the points.** Same reason.
  `height - 2 × radius` is the answer.
- **Calling it unconditionally in `Update`.** Call it when a test is needed.
- **Not checking `NonAlloc`'s return value.** A full buffer truncates silently.
- **Allocating the `NonAlloc` buffer inside the method.** That keeps the
  allocation you were avoiding.
- **Reaching for a capsule when you don't need one.** Equal points give a
  sphere, and `OverlapSphere` states that intent better.

## Wrapping Up

- **`point0` and `point1` are "sphere centers."** The docs' own words: the
  center of the sphere at the capsule's start / end — **not the capsule's
  ends.**
- **Actual total height is `|point1 - point0| + 2 × radius`.** For an exact
  height, the distance between the points must be `height - 2 × radius`.
- This is a consistent Unity convention. `CapsuleCollider.height` is documented
  as **"the actual height including the half-spheres at each end."**
- **Equal points give a sphere.** There's no capsule shorter than `2 × radius`.
- **Point order doesn't matter.** The original passing the top first is fine.
- **The layer mask defaults to `AllLayers`**, unlike `Raycast`'s
  `DefaultRaycastLayers`, so `Ignore Raycast` isn't filtered out.
- **Triggers are hit by default.** Queries Hit Triggers is on by default.
- **`NonAlloc` isn't "allocates less" — it "does not allocate anything on the
  managed heap."** In exchange it **won't grow the buffer, and silently drops
  the rest once it's full.**

The place the author got stuck — "the center of the sphere? I wondered what
that meant" — was exactly the right place. That wording really is unhelpful.
But **the conclusion he reached by experiment was "topmost and bottommost", and
that misses the documented meaning by `radius`.** With a small radius nobody
notices; at `5f`, like the original, the capsule is 10 units longer than
intended.

---

### References

- [Physics.OverlapCapsule — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Physics.OverlapCapsule.html)
- [Physics.OverlapCapsuleNonAlloc — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Physics.OverlapCapsuleNonAlloc.html)
- [Physics.OverlapSphereNonAlloc — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Physics.OverlapSphereNonAlloc.html)
- [CapsuleCollider.height — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/CapsuleCollider-height.html)
- [Physics.queriesHitTriggers — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Physics-queriesHitTriggers.html)
- [Physics Manager — Unity Manual](https://docs.unity3d.com/Manual/class-PhysicsManager.html)

The starting point for this post was [송호정 — \[Unity\] Physics.OverlapCapsule 함수 사용법](https://dallcom-forever2620.tistory.com/40)
(2019-09-19). I followed its example code and explanation as written, and
checked the meaning of `point0`/`point1` against the current Scripting
Reference. Quotes from it are my translations.
