---
pubDatetime: 2026-09-15T19:00:00+09:00
title: "Unity's Code Optimization Page Is a Table of Contents of Tables of Contents"
lang: en
translationKey: unity-code-optimization
featured: false
draft: false
tags:
  - Unity
  - Optimization
  - C#
  - Memory
  - Multithreading
description: "Unity's Code optimization manual page is five links and nothing else. Four of those five are tables of contents too. Here is what's left after descending to the leaves — only the parts that actually change code."
---

Studying Unity, optimization keeps coming up and I had no idea where to start,
so I clipped the manual's **Code optimization** page. With a title like that, it
looked like the entry point. Opening it again, **there is nothing to read.** One
paragraph and five links.

So I followed the links down. **Four of the five were tables of contents too.**
The sentences that actually change your code are two clicks away, sometimes
three.

This post is the result of that descent. Instead of summarizing the index, I
kept only **the leaves that actually made me move my hands.** The GPU-side
optimization docs have the same structure, and I covered those separately in
[I Wondered What a Wave Front Was](/en/posts/unity-gpu-optimization-page/). This
one is CPU and memory.

## Table of contents

## The page itself is five lines

This is the entire page — one paragraph and one table.

> Considering performance in all the code you write helps your project scale
> without bottlenecks. There are several ways you can improve performance,
> including avoiding bad practices, profiling your code, implementing
> appropriate design patterns, and using techniques like asynchronous
> programming to split work across multiple threads of execution.

| Topic | Description |
|---|---|
| Unity programming best practices | Key issues and best practices when writing code for Unity applications |
| Asynchronous programming | `async`/`await` and Unity's own `Awaitable` class |
| Job system | Use multi-core CPUs and parallelize your algorithms |
| Optimizing your code for managed memory | Approaches for optimizing code to work with managed memory |
| Using unmanaged API for transform operations | The `TransformHandle` API as an alternative to `Transform` |

When I clipped it, that table looked like a checklist. Looking again, it's a
**directory listing**.

Also worth noting: the URL I clipped in December 2025 is the same URL, but it
now serves the **Unity 6.6 (6000.6)** manual. An unversioned
`docs.unity3d.com/Manual/` link always points at the latest, which makes it a
poor thing to file away long-term.

## One level down, still a table of contents

I clicked all five. Here's what they turned out to be:

| Child page | What it actually is |
|---|---|
| Unity programming best practices | **Actual content.** Eight sections |
| Asynchronous programming | Table of contents |
| Job system | Table of contents (6 rows) |
| Optimizing your code for managed memory | Table of contents (3 rows) |
| Using unmanaged API for transform operations | Landing page |

**One of five is prose.** The rest are more tables. Click the managed memory
page and you get three more — Reference type management, Pooling and reusing
objects, Optimizing arrays. One more click after that is where sentences like
"use `StringBuilder`" live.

This isn't a complaint about the documentation's structure. The point is that
**clipping an index page means you saved nothing at the moment you clipped it.**
What follows is what I got by going all the way down.

## Find 1 — Unity APIs hand you a fresh array every time

This is on the **Optimizing arrays** page. Even if you already knew it, the
scale is easy to misjudge.

> Unity APIs that return arrays create fresh copies on each access. Repeated
> accesses within tight loops create CPU performance hotspots. Repeated accesses
> expand the managed heap.

The manual's example is `Mesh.vertices`. Use `mesh.vertices[i]` four times
inside a loop and you get **four array copies per iteration**. On a mesh with
10,000 vertices, that's 10,000 × 4.

The fix goes in stages:

```csharp
// Worst — four copies per iteration
for (int i = 0; i < mesh.vertices.Length; i++)
{
    total += mesh.vertices[i].x + mesh.vertices[i].y + mesh.vertices[i].z;
}

// Better — one copy
Vector3[] vertices = mesh.vertices;
for (int i = 0; i < vertices.Length; i++)
{
    total += vertices[i].x + vertices[i].y + vertices[i].z;
}

// Best — zero copies, the list is reused
mesh.GetVertices(_vertices);
```

The manual supplies a replacement table directly:

| Allocating | Non-allocating |
|---|---|
| `Physics.RaycastAll` | `Physics.RaycastNonAlloc` |
| `Animator.parameters` | `Animator.parameterCount` + `Animator.GetParameter` |
| `Renderer.sharedMaterials` | `Renderer.GetSharedMaterials` |
| `Input.touches.Length` | `Input.touchCount` + `Input.GetTouch(i)` |

The rule is in the names. **A `Get` prefix that takes a collection as an
argument** is the version that fills your buffer; the one that looks like a
property is the one handing you a copy.

There's a size threshold too. **Past 10,000 elements**, the manual says to use
`NativeArray` from `Unity.Collections`, to avoid GC pressure and heap
fragmentation.

## Find 2 — `Awaitable` differs from `Task` in three places

The comparison lives on an introduction page two clicks under **Asynchronous
programming**. I had been treating `Awaitable` as simply "Unity's Task," and all
three differences bite in practice.

**First, allocation.**

> `Awaitable` instances are pooled to limit allocations.

The manual contrasts this with `Task`, which allocates on every call to a
Task-returning method, increasing memory use and GC workload. If you call an
async method every frame, that difference accumulates directly.

**Second, no reuse.**

> It's never safe to `await` more than once on an `Awaitable` instance. Doing so
> can result in **undefined behavior** such as an exception or a deadlock.

That's the price of pooling. A `Task` can be awaited repeatedly and returns the
same result; an `Awaitable` cannot. The pattern of holding one in a field and
awaiting it from several places does not transfer.

**Third, when it resumes.**

> The continuation runs **synchronously** when completion is triggered, meaning
> code resumes immediately in the same frame.

`Task` continuations go through a synchronization context or the thread pool and
pick up latency; `Awaitable` resumes in the same frame. In the earlier
[Sentis workflow post](/en/posts/sentis-workflow/) I awaited
`ReadbackAndCloneAsync()`, and this sentence is why that doesn't cost a frame.

There's a coroutine comparison as well. `Awaitable` is usually more efficient,
**especially where the iterator returns non-null values**, but the manual notes
that advantage **diminishes when you run many of them concurrently.**

## Find 3 — `TransformHandle`, the unmanaged Transform

The fifth item was the one I hadn't seen before: there is an alternative to the
`Transform` API.

> `TransformHandle` is an **unmanaged struct**, which makes it fully compatible
> with the Burst compiler.

`Transform` is a managed object, so Burst-compiled code can't touch it.
`TransformHandle` is what lifts that restriction. There are two ways to get one:

```csharp
// From a GameObject
TransformHandle handle = gameObject.transformHandle;

// From a Transform component
TransformHandle handle = transform.GetTransformHandle();
```

**Being a struct changes how you use it.** To modify a property you have to
assign it to a local variable first, which the manual states explicitly:

```csharp
// Modifying a property — copy to a local, then change it
TransformHandle handle = transformHandle;
handle.position = handle.position + Vector3.one;

// Methods can be called directly
transformHandle.SetPositionAndRotation(Vector3.zero, Quaternion.identity);
```

Validity checking differs too. **You use `IsValid()`, not a null check.**

```csharp
if (root.parent.IsValid())
{
    // it has a parent
}
```

There's **one easy misreading** here. Burst compatibility does not mean you can
use it in jobs.

> The struct **isn't thread-safe** and throws a safety exception if you access it
> from a job that implements an interface such as `IJobParallelForTransform`.

Burst compatibility is limited to **"Burst-compiled code that runs on the main
thread."** For transforms in parallel jobs, the manual directs you to
`TransformAccessArray`, which you build from a `NativeArray<TransformHandle>`.

**Check your version.** The `TransformHandle` scripting reference page is a
**404 on 6000.2** and exists from 6000.3 onward. On a 6000.2 project this API
isn't there yet.

## Where and why you'd use this

All three findings say the same thing: **what gets newly allocated in code that
runs every frame.** Here's where that actually lands.

### Auditing code that runs every frame

This is the shape I end up fixing most often — an allocating API, string
concatenation, and a `GetComponent` inside a loop, all in one method.

```csharp
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Periodically sweeps for nearby enemies and picks the closest one.
/// </summary>
public class TargetScanner : MonoBehaviour
{
    private const int MAX_HITS = 32;
    private const float SCAN_INTERVAL = 0.2f;

    [Header("Scan")]
    [SerializeField, Range(1f, 50f), Tooltip("Detection radius in meters")]
    private float _radius = 12f;

    [SerializeField, Tooltip("Layer mask containing only enemies")]
    private LayerMask _targetMask;

    private readonly Collider[] _hits = new Collider[MAX_HITS];
    private readonly List<Transform> _candidates = new List<Transform>(MAX_HITS);

    private Transform _closest;
    private float _nextScanTime;

    public Transform Closest => _closest;

    private void Update()
    {
        if (Time.time < _nextScanTime)
        {
            return;
        }

        _nextScanTime = Time.time + SCAN_INTERVAL;
        Scan();
    }

    private void Scan()
    {
        // The result array is reused. OverlapSphere would allocate a new one each time.
        int count = Physics.OverlapSphereNonAlloc(
            transform.position, _radius, _hits, _targetMask);

        _candidates.Clear();
        for (int i = 0; i < count; i++)
        {
            _candidates.Add(_hits[i].transform);
        }

        _closest = FindClosest(_candidates, transform.position);
    }

    private static Transform FindClosest(List<Transform> candidates, Vector3 origin)
    {
        Transform best = null;
        float bestSqr = float.MaxValue;

        // LINQ's OrderBy(...).First() would allocate for the sort.
        for (int i = 0; i < candidates.Count; i++)
        {
            float sqr = (candidates[i].position - origin).sqrMagnitude;
            if (sqr < bestSqr)
            {
                bestSqr = sqr;
                best = candidates[i];
            }
        }

        return best;
    }
}
```

Four rules from the manual are in there:

- **Keep the result array and list in fields and reuse them.** A non-allocating
  API is one where you supply the container.
- **Don't run `Update` in full every frame.** The manual says to "minimize the
  number of active `Update` functions" and offers a centralized update manager or
  a customized player loop. Here I just used an interval.
- **No LINQ in runtime code.** The manual's phrasing is "avoid use of LINQ in
  runtime code," and especially in `Update`/`FixedUpdate`.
- **Compare distances with `sqrMagnitude`.** The square root is skippable here.

### When you create and destroy objects constantly

The **Pooling and reusing objects** page points at `UnityEngine.Pool`, naming
`ObjectPool<T>`, `PooledObject<T>`, and `CollectionPool<T>`.

What the manual emphasizes there isn't pooling itself but **resetting state**.

> It's important to reset this state when the object is returned to the pool, so
> that when it's retrieved again later, it starts in the same state as on its
> first use.

It then lists what to reset — **stopping coroutines, unsubscribing from events,
resetting physics states, clearing animations, and stopping particle systems.**
Most pooling bugs come out of that list. Miss the event unsubscribe in
particular and handlers stack up every time the object is reused.

The manual also states that `UnityEngine.Pool` is **not thread-safe and can only
be called safely from the main thread.**

### Where not to apply any of it

- **Anywhere you haven't profiled.** The page's own opening paragraph puts
  profiling right next to avoiding bad practices. Everything above is for after
  a spot has been confirmed as the bottleneck.
- **Code that isn't hot.** Reading `Mesh.vertices` once during initialization is
  fine. Every warning in these pages is qualified by **tight loops** and **every
  frame**.

## The things the manual explicitly forbids

**Unity programming best practices** is the one page of the five with actual
content. Collecting only the sentences that end in "don't":

| Don't | The reason the manual gives |
|---|---|
| `ReferenceEquals` for checking Unity objects | To exclude destroyed objects, use `if (obj == null)` |
| C# finalizers in runtime code | Run non-deterministically on a separate thread, and might not run at all |
| Strong references to large assets in static fields | They persist across scenes |
| Caching components across scene unloads | They can be destroyed |
| LINQ in runtime code | Allocations |
| Repeated string concatenation | Every intermediate string becomes garbage |
| `Task.Result` / `Task.Wait` on the main thread | Deadlocks |
| GameObjects, Transforms, Components from background threads | The core runtime is single-threaded |

That first row is exactly the convention I write to. A Unity object reports
"destroyed" as null through `UnityEngine.Object`'s `==` overload, and both
`ReferenceEquals` and `?.` bypass that overload. So **Unity objects get
`if (obj != null)`, and `?.` is reserved for plain C# objects.**

The string explanation is concrete too. Concatenating
`{ "A", "B", "C", "D", "E" }` produces `"A"`, `"AB"`, `"ABC"`, `"ABCD"`,
`"ABCDE"` — **five strings** when you needed the last one. The alternatives given
are `System.Text.StringBuilder` and, for UI, **splitting the score and its label
into separate text objects** so the concatenation never happens.

One line on boxing is worth quoting:

> Unity's garbage collector **isn't generational**, so it can't efficiently sweep
> out the small, frequent temporary allocations that boxing generates.

Meaning the .NET habit of assuming "small allocations get collected cheaply in
gen 0" doesn't hold here. Closures and the `params` modifier are called out for
the same reason in performance-sensitive code.

## Summary

- **Clipping an index page means you saved nothing.** Code optimization is five
  links, and four of them are indexes too.
- **Unity APIs that return arrays copy on every access.** Hoist it out of the
  loop, or switch to the `Get~(list)` form that fills a buffer. Past 10,000
  elements, `NativeArray`.
- **`Awaitable` is pooled, must never be awaited twice, and resumes in the same
  frame.** Port `Task` habits straight across and the second one breaks you.
- **`TransformHandle` is an unmanaged struct.** Copy to a local to modify, check
  with `IsValid()`. Burst compatibility is **main-thread only**, and parallel
  jobs need `TransformAccessArray`. Not present in 6000.2.
- **The first row of the forbidden list is `ReferenceEquals`.** Null checks on
  Unity objects have to go through `==`.
- **The GC isn't generational.** The small garbage from boxing, closures, and
  `params` doesn't get cleaned up cheaply.

Descending one level at a time left me with one thought: the upper pages of
optimization docs tell you **what to search for**, and the actual rules always
live in the leaves. I should have clipped a leaf, not the index.

---

### References

- [Code optimization — Unity Manual](https://docs.unity3d.com/Manual/scripting-optimization.html)
- [Unity programming best practices](https://docs.unity3d.com/Manual/programming-best-practices.html)
- [Optimizing arrays](https://docs.unity3d.com/Manual/performance-optimizing-arrays.html)
- [Reference type management](https://docs.unity3d.com/Manual/performance-reference-types.html)
- [Introduction to asynchronous programming with Awaitable](https://docs.unity3d.com/Manual/async-awaitable-introduction.html)
- [Introduction to TransformHandle API](https://docs.unity3d.com/Manual/class-TransformHandle.html)
- [Pooling and reusing objects](https://docs.unity3d.com/Manual/performance-reusable-code.html)

The clipping dates from December 2025; the quotations and code were re-checked
against the **Unity 6.6 (6000.6)** manual, current at the time of writing.
