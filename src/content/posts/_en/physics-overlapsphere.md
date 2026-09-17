---
pubDatetime: 2026-09-17T23:00:00+09:00
title: "OverlapSphere Doesn't Ignore the Ignore Raycast Layer"
lang: en
translationKey: physics-overlapsphere
featured: false
draft: false
tags:
  - Unity
  - Physics
  - C#
  - Optimization
description: "Same Physics class, different default layer masks for Raycast and OverlapSphere. An object you parked on Ignore Raycast to keep it out of queries still shows up in OverlapSphere."
---

I first looked this up to add enemy detection, then opened it again later for
melee hit detection. It's a page I keep coming back to, so I clipped this 2019
post about it. It explains `Physics.OverlapSphere`, and the gist is clear:

> A function that builds a virtual sphere from a center and a radius and returns
> the colliders that fall inside the radius you want to extract.

That's correct. But this function has **two of its four arguments hidden behind
defaults**, and those defaults differ from the `Physics.Raycast` sitting right
next to it.

It also allocates a new array on every call, which is what had me looking into
the `NonAlloc` variant in the first place. I used that variant in an example a
few days ago while writing up
[Unity's code optimization docs](/en/posts/unity-code-optimization/), and the
things I skipped over then are here.

## Table of contents

## What the 2019 post gets right, and where it's loose

The original is mostly accurate. Against the official docs:

| The original | The docs |
|---|---|
| "returns the colliders" | "Returns an **array** with all colliders touching or inside the sphere" |
| "can detect only specific layers" | "A Layer mask defines which layers of colliders to **include** in the query" |
| "very useful when you need instant detection" | — |

Notably, the original goes out of its way to stress that the layer mask means
**"detecting specific layers, not ignoring them."** That matches the docs'
"defines which layers to include," and it's a real point of confusion for anyone
used to treating masks as exclusions in `Raycast`.

One place is loose:

> Layers use bitwise notation, so I used `1 << 10`, meaning **the 10th layer**

`1 << 10` is **layer index 10.** Layers count from 0, so it's off by one from a
"10th" counted from 1. Unity's built-in layers occupy 0–7 and user layers start
at 8, which makes index 10 the **third** layer a user created.

More important than whether the number is right is that **this notation is
fragile.** Reorder the layers, or have someone insert one in the middle, and
`1 << 10` silently points somewhere else. There's a form that uses names.

```csharp
// Fragile — silently points elsewhere if layer order changes
int mask = 1 << 10;

// By name — follows the layer wherever it moves
int mask = LayerMask.GetMask("Enemy");
```

The docs describe `LayerMask.GetMask` as: "Given a set of layer names as defined
by either a Builtin or a User Layer in the Tags and Layers manager, **returns the
equivalent layer mask** for all of them." It's a `params` form, so several names
at once.

## The default layer mask differs from `Raycast`

This is the part that made me write the post. Look at the declaration:

```csharp
public static Collider[] OverlapSphere(Vector3 position,
                                       float radius,
                                       int layerMask = AllLayers,
                                       QueryTriggerInteraction queryTriggerInteraction
                                           = QueryTriggerInteraction.UseGlobal);
```

`layerMask` defaults to **`AllLayers`**. But `Raycast`, in the same `Physics`
class, reads:

```csharp
int layerMask = DefaultRaycastLayers,
```

Two different constants. The docs describe `DefaultRaycastLayers` as:

> all layers **except for the ignore raycast layer**.

Which gives:

| Function | Default `layerMask` | The Ignore Raycast layer is |
|---|---|---|
| `Physics.Raycast` | `DefaultRaycastLayers` | **excluded** |
| `Physics.OverlapSphere` | `AllLayers` | **included** |
| `Physics.OverlapSphereNonAlloc` | `AllLayers` | **included** |

It's easy to assume that **parking something on "Ignore Raycast" keeps it out of
physics queries**, but that only holds for the `Raycast` family. The name is
Ignore **Raycast**, so strictly speaking it's doing what it says — it's just that
in practice people use it as "the layer queries skip," and that expectation
breaks.

A collider that exists for visuals, or one parked there to dodge click
detection, **still turns up in a proximity search.** If you left the mask out,
anyway.

The lesson is simple: **don't omit `layerMask` on `OverlapSphere`.**

## Triggers are included by default too

The fourth argument hides behind a default as well.
`QueryTriggerInteraction.UseGlobal` means "follow the project setting," and that
setting is Physics' **Queries Hit Triggers**. The manual is explicit:

> Enable this option if you want physics hit tests (such as Raycasts, SphereCasts
> and SphereTests) to **return a hit when they intersect with a Collider marked
> as a Trigger**. Individual raycasts can override this behavior. **By default,
> this setting is enabled.**

So **in the default state, triggers come back in the results.** Pickup radii and
event volumes built as triggers get mixed into your "nearby enemies."

If layers already filter them out it usually doesn't matter, but where triggers
and solid colliders share a layer, spelling it out is better.

```csharp
Physics.OverlapSphere(center, radius, mask, QueryTriggerInteraction.Ignore);
```

One more thing. The docs say **nothing about the order of the results.** Don't
assume they're sorted nearest-first. Finding the closest is on you.

## Where and why you'd use this

The original's example is a good one — "switching nearby allied monsters into
attack posture when one of them is attacked." It's for detection that sweeps
around a point **in one shot**: melee range, explosion damage, aggro propagation,
finding interactable objects.

### Melee hit detection — the simple version

This is the first shape you reach for. Called once, on a specific frame of the
attack animation.

```csharp
using UnityEngine;

/// <summary>
/// Called once during an attack animation to damage targets in range.
/// </summary>
public class MeleeAttack : MonoBehaviour
{
    [Header("Attack")]
    [SerializeField, Tooltip("Center of the test — usually a weapon or hand bone")]
    private Transform _origin;

    [SerializeField, Range(0.1f, 5f), Tooltip("Test radius in meters")]
    private float _radius = 1.5f;

    [SerializeField, Range(1f, 999f), Tooltip("Damage dealt")]
    private float _damage = 10f;

    [SerializeField, Tooltip("Layer names to test against")]
    private string[] _targetLayers = { "Enemy" };

    private int _mask;

    private void Awake()
    {
        _mask = LayerMask.GetMask(_targetLayers);
    }

    /// <summary>Called from an animation event.</summary>
    public void Strike()
    {
        Collider[] hits = Physics.OverlapSphere(
            _origin.position, _radius, _mask, QueryTriggerInteraction.Ignore);

        foreach (Collider hit in hits)
        {
            if (hit.TryGetComponent(out IDamageable target))
            {
                target.TakeDamage(_damage);
            }
        }
    }
}
```

This works fine. The mask and trigger handling are spelled out, so the traps
above are avoided. **If it only fires on an attack, you can stop here.**

The problem is call frequency. The docs state it outright for `OverlapSphere` —
**"Allocates memory"** — and point to `Physics.OverlapSphereNonAlloc` as the
alternative.

### The same code with NonAlloc

Three things change: the buffer moves to a field, the return value means
something else, and the iteration changes.

```csharp
public class MeleeAttack : MonoBehaviour
{
    private const int BUFFER_SIZE = 16;

    // ... the same serialized fields as above ...

    // 1) Allocate the result buffer once and reuse it.
    private readonly Collider[] _hits = new Collider[BUFFER_SIZE];

    private int _mask;

    public void Strike()
    {
        // 2) The return value isn't an array — it's how many landed in the buffer.
        int count = Physics.OverlapSphereNonAlloc(
            _origin.position, _radius, _hits, _mask, QueryTriggerInteraction.Ignore);

        if (count == _hits.Length)
        {
            Debug.LogWarning(
                $"[{nameof(MeleeAttack)}] The {BUFFER_SIZE}-slot buffer filled up. " +
                "Results may have been truncated.", this);
        }

        // 3) Don't use foreach. Only go as far as count.
        for (int i = 0; i < count; i++)
        {
            if (_hits[i].TryGetComponent(out IDamageable target))
            {
                target.TakeDamage(_damage);
            }
        }
    }
}
```

The third point is **where the port most often goes wrong.**

```csharp
// Wrong — walks the whole buffer
foreach (Collider hit in _hits) { ... }

// Right — walks only what this call filled
for (int i = 0; i < count; i++) { ... }
```

Because the buffer is reused, **everything past `count` still holds references
from the previous call.** A `foreach` hits enemies that have already left the
radius. It compiles, and it mostly works, so the symptom only shows up after
enemies have clustered and dispersed.

The two side by side:

| | `OverlapSphere` | `OverlapSphereNonAlloc` |
|---|---|---|
| Getting results | Returns a `Collider[]` | **Fills the buffer you pass in** |
| Return value | The array | **A count (`int`)** |
| Allocation | **A new array per call** | None |
| Iteration | `foreach` is fine | **`for` up to `count`** |
| When results overflow | All of them come back | **Silently truncated** |

That last row is what `NonAlloc` charges you. The docs put it this way:

> **Does not attempt to grow the buffer** if it runs out of space. **The length
> of the buffer is returned** when the buffer is full.

The return value is "the amount of colliders stored into the results buffer." So
**when the return value equals the buffer length, you can't tell whether it
filled exactly or overflowed.** Hence the warning in the code above.

In that earlier optimization post I used an example with a `MAX_HITS = 32`
buffer, and this is exactly where that number gets dangerous. In a wide radius or
a crowded fight, once 32 slots fill, the rest behave as though they don't exist.
Two ways out — **size for the worst case** (the buffer is allocated once, so 32 →
64 costs almost nothing) or **detect the full case and report it.**

### Enemy detection — the repeated call

Melee fires occasionally; detection runs on a schedule. That's where `NonAlloc`
actually earns its keep.

```csharp
using UnityEngine;

/// <summary>
/// Periodically sweeps for enemies in range and picks the closest.
/// </summary>
[RequireComponent(typeof(Rigidbody))]
public class EnemyProbe : MonoBehaviour
{
    private const int BUFFER_SIZE = 32;

    [Header("Probe")]
    [SerializeField, Range(1f, 50f), Tooltip("Detection radius in meters")]
    private float _radius = 10f;

    [SerializeField, Tooltip("Layer names to detect")]
    private string[] _targetLayers = { "Enemy" };

    private readonly Collider[] _hits = new Collider[BUFFER_SIZE];

    private int _mask;
    private Rigidbody _rigidbody;

    private void Awake()
    {
        _rigidbody = GetComponent<Rigidbody>();
        // Build the mask from names so it follows layer reordering.
        _mask = LayerMask.GetMask(_targetLayers);
    }

    public Transform FindNearest()
    {
        int count = Physics.OverlapSphereNonAlloc(
            transform.position, _radius, _hits, _mask, QueryTriggerInteraction.Ignore);

        Transform best = null;
        float bestSqr = float.MaxValue;
        Vector3 origin = transform.position;

        for (int i = 0; i < count; i++)
        {
            Collider hit = _hits[i];

            // Exclude self. A child collider points at the same rigidbody.
            if (hit.attachedRigidbody == _rigidbody)
            {
                continue;
            }

            // The docs guarantee no ordering, so pick it yourself.
            float sqr = (hit.transform.position - origin).sqrMagnitude;
            if (sqr < bestSqr)
            {
                bestSqr = sqr;
                best = hit.transform;
            }
        }

        return best;
    }
}
```

Two things to add:

- **Self is identified via `attachedRigidbody`.** When the collider sits on a
  child object, `hit.transform` isn't you — but `attachedRigidbody` is.
- **The nearest one is picked by hand.** The docs make no promise about return
  order.

### Where not to use it

- **Calling it every frame.** The docs warn about allocation on `OverlapSphere`.
  If you need per-frame, that's the `NonAlloc` version, and even then an interval
  is usually better.
- **Movement limits.** Checking whether something is inside a radius and stopping
  it from leaving are different problems. The latter belongs with physics
  constraints, covered in
  [What FreezePositionY Freezes Is World Y](/en/posts/rigidbody-constraints/).
- **Assuming nearest-first ordering.** The docs guarantee nothing about order.

One more. If you have to run many of these tests in a very crowded area, there's
**`OverlapSphereCommand`** — described as a "struct used to setup an overlap
sphere command to be performed asynchronously during a job," with `ScheduleBatch`
running many at once. There are places where that fits better than a `for` loop
of individual calls.

## Summary

- **The 2019 post's explanation is correct.** Its emphasis that the layer mask
  selects rather than excludes matches the docs.
- **`1 << 10` is index 10, off by one from a "10th" counted from 1.** More
  importantly, that notation breaks when layers get reordered. Use
  **`LayerMask.GetMask("Enemy")`**.
- **The default mask differs from `Raycast`.** `Raycast` uses
  `DefaultRaycastLayers` so the Ignore Raycast layer drops out, but
  **`OverlapSphere` uses `AllLayers`, so it stays in.** Don't omit the mask.
- **Triggers are included by default.** Queries Hit Triggers is on by default.
  Spell out `QueryTriggerInteraction.Ignore` when you need to.
- **Return order isn't guaranteed.** Don't assume nearest-first.
- **Don't leave a `foreach` behind when porting to `NonAlloc`.** The buffer is
  reused, so references from the previous call sit past `count`. Always stop at
  `count`.
- **`NonAlloc` truncates silently.** When the return equals the buffer length you
  can't tell whether it was cut. Size generously, or catch the full case with a
  warning.

Two of four arguments defaulted makes this look like a three-line call, and
**those defaults differing from `Raycast`** turned out to be the function's real
trap. The shorter an API lets you be, the more worth checking what fills the
parts you left out.

---

### References

- [Physics.OverlapSphere — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Physics.OverlapSphere.html)
- [Physics.OverlapSphereNonAlloc](https://docs.unity3d.com/ScriptReference/Physics.OverlapSphereNonAlloc.html)
- [Physics.DefaultRaycastLayers](https://docs.unity3d.com/ScriptReference/Physics.DefaultRaycastLayers.html)
- [Physics.Raycast](https://docs.unity3d.com/ScriptReference/Physics.Raycast.html)
- [LayerMask.GetMask](https://docs.unity3d.com/ScriptReference/LayerMask.GetMask.html)
- [Physics settings — Queries Hit Triggers](https://docs.unity3d.com/Manual/class-PhysicsManager.html)
- [OverlapSphereCommand](https://docs.unity3d.com/ScriptReference/OverlapSphereCommand.html)

The source this post started from is [dbxxrud — \[Unity 3D\] Physics.OverlapSphere](https://a-game-developer0724.tistory.com/54)
(2019-11-02). Its explanation was checked against the current docs; the defaults
and buffer behavior were confirmed separately in the Scripting Reference.
