---
pubDatetime: 2026-10-07T15:30:00+09:00
title: "1 << -1 Isn't an Error, It's Layer 31"
lang: en
translationKey: overlapsphere-layermask
featured: false
draft: false
tags:
  - Unity
  - Physics
  - C#
  - Optimization
description: "A 2022 post on scanning the surroundings with OverlapSphere. Fetching the layer by name is the right move, but the value then gets shifted by hand. When NameToLayer returns -1, that expression points at layer 31 instead of throwing."
---

I clipped this **while looking for how to activate a trap object placed on the
map when the player comes near.** I wanted to judge it **by radius** rather than
bolting another trigger collider onto every trap. So I added this 2022 post to
the material I'd gathered while writing
[the post on OverlapSphere's defaults](/posts/physics-overlapsphere/).

That earlier post pointed out the function's two hidden arguments and ended on
**"use a name instead of a hardcoded `1 << 10`."** What it left behind was
**building the mask yourself.** A trap that should only see the player ends up
needing a mask, so I picked that thread back up.

This post follows the advice. Rather than writing the layer number as a literal,
it fetches it with `LayerMask.NameToLayer("Cube")`. **It's the name-based route.**
But the value it fetches gets shifted by hand.

```csharp
LayerMask cubeLayer;

void Start()
{
    cubeLayer = LayerMask.NameToLayer("Cube");
}

void Update()
{
    int layerMask = (1 << cubeLayer);
    // ...
}
```

That combination — a name, with the shift still there — **has a failure mode of
its own.** What `NameToLayer` returns is written in the docs.

> Given a layer name, returns the layer index as defined by either a Builtin or
> a User Layer in the Tags and Layers manager. **Returns -1 if not found.**

**Not found means -1.** Which makes it `1 << -1`, and that expression doesn't
blow up.

## Table of contents

## `1 << -1` Isn't an Error, It's Layer 31

The C# docs state how the shift count is computed.

> If the type of `x` is `int` or `uint`, the **low-order *five* bits** of the
> right-hand operand define the shift count. That is, the shift count is
> computed from `count & 0x1F` (or `count & 0b_1_1111`).

**Only the low five bits of the right operand are used.** So a negative number
isn't an exception. The docs even attach an example.

> ```csharp
> int count = -31;
> int c = 0b_0001;
> Console.WriteLine($"{c} << {count} is {c << count}");
> // Output:
> // 1 << -31 is 2
> ```

`-1 & 0x1F` is **31**. So `1 << -1` is `1 << 31`, and in an `int` that value is
`int.MinValue` with the sign bit set. Read as a layer mask, it points at **layer
31 alone.**

| Expression | Computation | What the mask points at |
| --- | --- | --- |
| `1 << 6` (Cube at 6) | `0x00000040` | Layer 6 only |
| `1 << -1` | `-1 & 0x1F = 31` → `1 << 31` | **Layer 31 only** |
| `~(1 << -1)` | `~int.MinValue = int.MaxValue` | **Everything but layer 31** |

Why 31 is a quiet spot is in the docs too. The `LayerMask` class description
lays out the layer makeup — of 32 layers, **the first 8 are built-in and 24 are
user-controllable.** So **31 is the last user layer slot**, and in a fresh
project it's empty.

### The Symptom Inverts Between Include and Exclude

The clipping uses the mask in two forms. When the layer name is wrong, the two
diverge.

```csharp
// Include — "detect only Cube"
int layerMask = (1 << cubeLayer);

// Exclude — "detect everything but Cube"
int layerMask = ~(1 << cubeLayer);
```

With the right name both do what you meant. With a wrong name — a typo, or a
layer not created yet — this happens.

| | Name correct | Name wrong |
| --- | --- | --- |
| `1 << cubeLayer` | Cube is detected | **Nothing is detected** (layer 31 is empty) |
| `~(1 << cubeLayer)` | Cube is excluded | **Everything is detected** — only 31 is excluded, and it's empty |

**The bottom row is the dangerous one.** The include form surfaces immediately as
"why isn't anything detected," while the exclude form **looks almost exactly like
the intended result.** The only difference is that Cube isn't excluded, and miss
that one thing and the mask stays wrong indefinitely.

**The clipping's final code is the exclude form.** One mismatched layer name and
it ends on the side where the symptom is hidden.

### `GetMask` Removes That Step

`-1` becomes a problem **because I'm the one doing the shift.** Skip the shift and
the spot disappears. `LayerMask.GetMask`'s declaration and description:

```csharp
public static int GetMask(params string[] layerNames);
```

> Given a set of layer names as defined by either a Builtin or a User Layer in
> the Tags and Layers manager, returns **the equivalent layer mask** for all of
> them.

**Names in, mask out.** No index in between. It's `params`, so several go in at
once, and exclusion is `~` on the result.

```csharp
// Include — one step from names to mask
int includeMask = LayerMask.GetMask("Cube");

// Several at once
int enemiesMask = LayerMask.GetMask("Enemy", "Boss");

// Exclude — invert the mask
int excludeMask = ~LayerMask.GetMask("Cube");
```

Lining up the three ways to write it:

| How it's written | What breaks it | Does it surface |
| --- | --- | --- |
| `1 << 6` | Reordering layers makes it point elsewhere | Quietly |
| `1 << NameToLayer("Cube")` | A wrong name points at 31 | Quietly (especially in the exclude form) |
| `LayerMask.GetMask("Cube")` | — | There is no shift step |

The first row is what [the earlier post](/posts/physics-overlapsphere/) covered.
The second row is this post's, and the point is that **using a name doesn't by
itself make it safe.**

To be straight about it, **what `GetMask` does with a name that doesn't exist
isn't in the docs.** What the docs guarantee stops at "returns the equivalent
layer mask for the given names." The certain difference is that **there's no path
for `-1` to leak into a shift**, and that's the reason to pick this spot.

## A Layer Index Is Sitting in a `LayerMask`

There's another layer in the same code: the variable's type.

```csharp
LayerMask cubeLayer;

void Start()
{
    cubeLayer = LayerMask.NameToLayer("Cube");
}
```

What `NameToLayer` returns is an **index.** That went into a `LayerMask`-typed
variable. But an index isn't what `LayerMask` holds. From the `value` property:

> Converts a **layer mask** value to an integer value.

**A mask.** The reason it compiles is the implicit conversion.

> Implicitly converts an integer to a LayerMask.

Put an `int` in and it becomes a `LayerMask`; pull it back out as `int` and the
same value comes back. So `(1 << cubeLayer)` computes what was intended,
numerically. **It works, and only the type lies.**

The problem is passing that variable somewhere else. Being `LayerMask`-typed, it
slots straight into a place that takes a mask.

```csharp
// With Cube on layer 6, cubeLayer's content is 6.

// As intended — raises bit 6
Physics.OverlapSphere(pos, radius, 1 << cubeLayer);

// Compiles. But mask 6 is layers 1 and 2.
Physics.OverlapSphere(pos, radius, cubeLayer);
```

**Mask `6` is `110` in binary, pointing at layer 1 (TransparentFX) and layer 2
(Ignore Raycast).** Nothing to do with Cube. Both calls compile identically and
both are equally quiet.

If you're holding an index, the type should be `int` as well. That's what tells a
reader "a shift is needed here."

```csharp
// The type shows that an index is being held
private int _cubeLayerIndex;

// A mask is being held — pass it straight through, no shift
private LayerMask _cubeMask;
```

Use `GetMask` and only the bottom one is left from the start.

## Excluding Yourself by Name Excludes Others Too

How the clipping excludes itself:

```csharp
foreach (Collider col in colliders)
{
    if (col.name == "Sphere" /* 자기 자신은 제외 */) continue;

    changeMaterial(col.gameObject, detectedMat);
}
```

Read it alongside the test scene the post builds and the problem shows. The post
says to **attach the script to a "purple Sphere" and place a Cube, Capsule and
Sphere around it.** Which means **the scene has two spheres**: the purple one at
the center of detection, and a Sphere that's a detection target.

`col.name == "Sphere"` skips **everything with that name.** If the target sphere
is just called `Sphere`, it drops out too. It didn't exclude itself — it
**excluded every object with the same name.**

Whether something is yourself is a question of reference, not name.

```csharp
foreach (Collider col in colliders)
{
    // Same Transform means it's my collider.
    if (col.transform == transform)
    {
        continue;
    }

    // For a structure with colliders on children, this one.
    if (col.transform.IsChildOf(transform))
    {
        continue;
    }

    // ...
}
```

And `name` is expensive for this spot. In
[the post on object pooling](/posts/unity-object-pooling/) I confirmed that
`GameObject.name` builds a fresh managed string from the native one on every
access — and **here that access sits inside an `Update` loop.** A string per
detected collider, every frame. A reference comparison allocates nothing.

## Detection Without Release

The clipping's `Update` swaps the material of each detected collider.

```csharp
void changeMaterial(GameObject go, Material changeMat)
{
    Renderer rd = go.GetComponent<MeshRenderer>();
    Material[] mat = rd.sharedMaterials;
    mat[0] = changeMat;
    rd.materials = mat;
}
```

**There's no code to put it back.** Enter the radius and it turns red; leave and
it stays. That's exactly what the post describes — "as the Radius grows, farther
objects change to DetectedMat (Red)" — and shrinking the radius doesn't bring the
color back.

**As a demo for sweeping the radius, that's enough.** But anywhere "scan the
surroundings" is actually used needs both entering and leaving. For a trap it has
to **turn on when the player nears and off when they move away**, and with this
code a trap that turned on never turns off. It means building your own equivalent
of a trigger's `OnTriggerEnter`/`OnTriggerExit`, and the way to do that is
**looking at the difference between frames.**

```csharp
using System.Collections.Generic;
using UnityEngine;

[RequireComponent(typeof(Collider))]
public class ProximityTracker : MonoBehaviour
{
    private const int BUFFER_SIZE = 32;

    [Header("Detection")]
    [SerializeField, Range(0.1f, 20f), Tooltip("Scan radius")]
    private float _radius = 3f;

    [SerializeField, Tooltip("Layers to scan. Chosen in the Inspector")]
    private LayerMask _targetMask;

    private readonly Collider[] _buffer = new Collider[BUFFER_SIZE];
    private readonly HashSet<Collider> _current = new HashSet<Collider>();
    private readonly HashSet<Collider> _previous = new HashSet<Collider>();

    private void FixedUpdate()
    {
        _current.Clear();

        // NonAlloc reuses the buffer. The return value is how many were filled.
        int count = Physics.OverlapSphereNonAlloc(
            transform.position, _radius, _buffer, _targetMask);

        for (int i = 0; i < count; i++)
        {
            Collider col = _buffer[i];

            // Skip myself by reference, not by name.
            if (col.transform == transform || col.transform.IsChildOf(transform))
            {
                continue;
            }

            _current.Add(col);

            // Absent last frame means 'entered'.
            if (!_previous.Contains(col))
            {
                OnEntered(col);
            }
        }

        foreach (Collider col in _previous)
        {
            // A destroyed collider may be in here. A Unity object, so == null.
            if (col == null)
            {
                continue;
            }

            // Absent this frame means 'exited'.
            if (!_current.Contains(col))
            {
                OnExited(col);
            }
        }

        // Carry current over as next frame's baseline.
        _previous.Clear();
        _previous.UnionWith(_current);
    }

    private void OnEntered(Collider col)
    {
        Debug.Log($"entered {col.name}", col);
    }

    private void OnExited(Collider col)
    {
        Debug.Log($"exited {col.name}", col);
    }

    private void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.green;

        // Wire, not solid. It's only useful if you can see inside.
        Gizmos.DrawWireSphere(transform.position, _radius);
    }
}
```

There's a reason the loop over `_previous` checks `col == null` first. A collider
held in the set can be destroyed in the meantime, and a Unity object keeps its
managed reference after being destroyed. **That's also why it's `== null` and not
`?.`.**

Putting it in `FixedUpdate` rather than `Update` is deliberate too. A physics
query reads physics state, so matching the physics step keeps the result stable.

The material-swapping side deserves its own note. In
[the post on what a shader is](/posts/what-is-a-shader/) we saw the docs' line
that reading `Renderer.material` clones the material and **cleaning it up is your
responsibility.** The clipping's shape — reassigning the material array every
frame — sits close to that boundary. Change it once on enter and once on exit and
that call drops to zero per frame.

## Items That Checked Out

More didn't snag than did. Here's what I verified.

| The clipping's claim | Verified |
| --- | --- |
| `OnDrawGizmosSelected` draws gizmos only when selected | Correct. The docs say "Gizmos are drawn only when the object is selected" |
| You're detected yourself, so exclusion handling is needed | Correct |
| Detecting every frame affects performance | Correct |
| A layerMask judges layers as bits | Correct |
| `~` excludes a specific layer | Correct |

On `OnDrawGizmosSelected`, the docs even reach for the same example.

> For example an explosion script could draw a sphere showing the explosion
> radius.

**Drawing an explosion radius as a sphere** is the textbook use of this callback.
The same spot the clipping used it for a scan radius.

"Detecting every frame affects performance, so in practice use it when an event or
collision occurs" is an accurate point too. But when it does have to run in
`Update`, **the allocation snags before the call count does.** `OverlapSphere`
builds a new array per call, while `OverlapSphereNonAlloc` fills the buffer I
hand it. That comparison is in [the earlier post](/posts/physics-overlapsphere/)
with the code side by side, and the same function shows up as an example in
[the Unity code optimization doc](/posts/unity-code-optimization/).

The capsule-shaped function that does the same job is in
[the post on OverlapCapsule](/posts/physics-overlapcapsule/). Everything about
building the mask applies there unchanged.

## Where and Why You'd Use It

### Pick the Mask in the Inspector

There's one more option, better than building a mask in code from a name or a
number. Make it a `LayerMask` with `[SerializeField]` and **the Inspector draws
you a layer dropdown.**

```csharp
[SerializeField, Tooltip("Layers to scan")]
private LayerMask _targetMask;
```

What makes this good is that **the string leaves the code.** Rename the layer and
there's nothing to fix, and there's no place to misspell. The path that produces
the `-1` problem above doesn't exist at all.

The three options, summarized:

| Method | Layer name in code | When it's wrong |
| --- | --- | --- |
| `[SerializeField] LayerMask` | No | You can't pick one, so there's nothing to get wrong |
| `LayerMask.GetMask("Cube")` | Yes | There's no shift step |
| `1 << NameToLayer("Cube")` | Yes | Points at layer 31 |

Use the second row only when the mask has to be composed in code; the first row is
the default.

### Hand the Scan Result Out as an Event

The `ProximityTracker` above ends enter and exit at `Debug.Log`. In practice
something else has to react at that moment. To avoid wiring the scanner and the
reactor together by direct reference, hand it out as an event.

```csharp
using System;
using UnityEngine;

public class ProximityEvents : MonoBehaviour
{
    // event blocks outside invocation and = null assignment.
    public event Action<Collider> Entered;
    public event Action<Collider> Exited;

    public void RaiseEntered(Collider col)
    {
        // Null when there are no subscribers. A delegate, so use ?.
        Entered?.Invoke(col);
    }

    public void RaiseExited(Collider col)
    {
        Exited?.Invoke(col);
    }
}
```

Why `?.Invoke()` and `event` is in
[the post on registering events with Action](/posts/csharp-action-events/). The
subscribing side pairs registration and teardown in `OnEnable`/`OnDisable` —
especially if the scan targets are objects coming out of and going back into a
pool.

### Where Not to Use It

- **`1 << LayerMask.NameToLayer(...)`.** A wrong name points at layer 31 with no
  exception. Use `GetMask` or an Inspector `LayerMask`.
- **Holding a layer index in a `LayerMask`.** The implicit conversion makes it
  compile. If it's an index, the type should be `int`.
- **Testing only the exclude mask (`~`) and moving on.** Even a wrong name looks
  normal. Running the include form once surfaces it immediately.
- **Filtering yourself out by name.** Everything with that name drops out. Check
  `col.transform == transform`.
- **Reading `name` inside an `Update` loop.** A string is built on every access.
- **Handling only entry and leaving exit out.** State only moves one way. You need
  the frame-to-frame difference to get both.
- **Drawing a scan radius with `Gizmos.DrawSphere`.** Solid means you can't see
  inside. For a radius, it's `DrawWireSphere`.

## Wrapping Up

- **`1 << -1` isn't an exception.** The C# docs say the shift count is computed
  from `count & 0x1F`. `-1` becomes 31, and `1 << 31` is the mask pointing at
  **layer 31**.
- **`NameToLayer` returns -1 when it can't find one.** It's in the docs, and when
  that value leaks into a shift you get the result above.
- **The exclude form hides the symptom.** `~(1 << -1)` is everything but 31, which
  looks almost identical to the intended result. The clipping's final code is that
  form.
- **31 is the last user layer.** The docs put the first 8 of 32 as built-in. It's
  empty in a fresh project, so it stays quiet.
- **`GetMask` removes the shift step.** Names go straight to a mask. What it does
  with a nonexistent name isn't documented, but the disappearance of the `-1` path
  is certain.
- **Holding an index in a `LayerMask` makes the type lie.** It compiles via the
  implicit conversion and passes straight into a mask parameter. Index 6, read as
  a mask, is layers 1 and 2.
- **Excluding yourself by name excludes everything with that name.** This post's
  scene has two spheres. Compare by reference.
- **Detection without release.** Fine as a demo, but using both enter and exit
  requires looking at the difference between frames.

---

### References

- [Physics.OverlapSphere — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Physics.OverlapSphere.html) ·
  [Physics.OverlapSphereNonAlloc](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Physics.OverlapSphereNonAlloc.html)
- [LayerMask — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/LayerMask.html) ·
  [LayerMask.NameToLayer](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/LayerMask.NameToLayer.html) ·
  [LayerMask.GetMask](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/LayerMask.GetMask.html)
- [Bitwise and shift operators — C# reference](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/bitwise-and-shift-operators)
- [MonoBehaviour.OnDrawGizmosSelected — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/MonoBehaviour.OnDrawGizmosSelected.html) ·
  [Gizmos.DrawWireSphere](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Gizmos.DrawWireSphere.html)
- [Transform.IsChildOf — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Transform.IsChildOf.html)

The starting point for this post was
[피로물든딸기 — 유니티 - OverlapSphere로 주변 콜라이더 탐색하기](https://bloodstrawberry.tistory.com/877)
(2022-07-21). [The earlier post](/posts/physics-overlapsphere/) on the same
function looked at the default arguments; this one cross-checked **building the
mask yourself** against the Unity Scripting Reference and the C# operator docs.
