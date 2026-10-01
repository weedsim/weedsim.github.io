---
pubDatetime: 2026-10-01T17:00:00+09:00
title: "SetActive(false) Doesn't Pause a Coroutine, It Ends It"
lang: en
translationKey: unity-object-pooling
featured: false
draft: false
tags:
  - Unity
  - C#
  - Optimization
  - Memory
description: "The clipping's ObjectPool implementation uses the official API correctly. But OnGet and OnRelease are one line each. It does none of the six things the manual says to reset on release, and the coroutine SetActive(false) ended doesn't come back when you re-enable."
---

On an earlier game project I hit **frame spikes from creating and destroying far
too many objects.** On the next project I ran into the same situation again, and
I clipped this while looking for how to deal with it this time. It's a 2022
write-up, and it's short. Two paragraphs on why object pooling is needed, then
a whole `Pool` and `PoolManager` wrapping `UnityEngine.Pool`'s `ObjectPool<T>`.

**It's code put out there to be copied.** So this post goes through that code
line by line.

The way it uses the official API is correct. All four constructor callbacks are
filled in, and the one that destroys an instance when `maxSize` is exceeded is
wired up properly. What snags is that **`OnGet` and `OnRelease` are one line
each.**

```csharp
void OnGet(GameObject go)
{
    go.SetActive(true);
}
void OnRelease(GameObject go)
{
    go.SetActive(false);
}
```

The Unity manual describes those two spots as **where state gets reset.** It
even lists what to reset — and of the six items, this code does one. And that
one makes another of them **impossible to undo.**

## Table of Contents

## The Parts That Use the Official API Are Correct

Start with what's right. The line where the clipping creates the
`ObjectPool<T>`:

```csharp
_pool = new ObjectPool<GameObject>(OnCreate, OnGet, OnRelease, OnDestroy, maxSize:1000);
```

That matches the constructor signature.

```csharp
public ObjectPool(Func<T> createFunc, Action<T> actionOnGet = null,
    Action<T> actionOnRelease = null, Action<T> actionOnDestroy = null,
    bool collectionCheck = true, int defaultCapacity = 10, int maxSize = 10000)
```

The first four go by position and only `maxSize` is named. The `collectionCheck`
and `defaultCapacity` in between take their defaults.

Filling in `actionOnDestroy` is right too. The docs pin down what that callback
is for.

> **actionOnDestroy:** Called when the element could not be returned to the pool
> due to the pool reaching the maximum size.

And here's what `maxSize` says.

> The maximum size of the pool. When the pool reaches the max size then any
> further instances returned to the pool will be **ignored and can be garbage
> collected.**

"Garbage collected" is written for plain C# objects. A `GameObject` is a native
object, so dropping the reference doesn't make it go away. That's why
`actionOnDestroy` has to call `GameObject.Destroy` — and the clipping **does
that.**

```csharp
void OnDestroy(GameObject go)
{
    GameObject.Destroy(go);
}
```

Stripping `(Clone)` off the name in `OnCreate` is deliberate too.

```csharp
GameObject OnCreate()
{
    GameObject go = GameObject.Instantiate(_prefab);
    go.name = _prefab.name;
    return go;
}
```

An object made with `Instantiate` ends up named `Bullet(Clone)`. Since
`PoolManager` looks pools up by `go.name`, this puts the original name back.
There's a problem with that design itself, which comes later.

The explanation of why pooling is needed isn't overstated either. The manual
says the same thing.

> Object pooling reduces the overhead caused by repeatedly instantiating and
> destroying new object instances and limits the overall number of allocations
> and deallocations. This helps **minimize garbage collection (GC) overhead and
> reduce load on the CPU.**

## One SetActive Line Is the Whole State Reset

The manual starts from the fact that an object taken out of the pool changes
state while it's in use.

> Objects you retrieve from the pool can change their state during use... **It's
> important to reset this state when the object is returned to the pool**, so
> that when it's retrieved again later, it starts in the same state as on its
> first use.

Then it lists what you typically do on release.

| What the manual lists | The clipping's `OnRelease` |
| --- | --- |
| Stopping coroutines | — |
| Unsubscribing from events | — |
| Resetting physics states | — |
| Clearing animations | — |
| Stopping particle systems | — |
| Deactivating GameObjects | `SetActive(false)` |

One out of six. And `SetActive(false)` **also does the first row, whether you
want it to or not.** That's the problem. The `GameObject.SetActive` docs say
this.

> Deactivating a GameObject disables each component, including attached
> renderers, colliders, rigidbodies, and scripts. ... **Deactivating a GameObject
> also stops all coroutines attached to it.**

"Stops." Not "pauses." Re-enabling with `SetActive(true)` **does not resume a
stopped coroutine.** `OnEnable` is called again, but nothing anywhere revives a
coroutine that was cut off mid-way.

Here's how that shows up in practice. A common bullet script.

```csharp
using System.Collections;
using UnityEngine;

public class Bullet : MonoBehaviour
{
    private const float LIFETIME = 3f;

    [Header("Movement")]
    [SerializeField, Range(1f, 50f), Tooltip("Distance travelled per second")]
    private float _speed = 20f;

    private void OnEnable()
    {
        StartCoroutine(DespawnAfterLifetime());
    }

    private void Update()
    {
        transform.Translate(Vector3.forward * (_speed * Time.deltaTime));
    }

    private IEnumerator DespawnAfterLifetime()
    {
        yield return new WaitForSeconds(LIFETIME);
        // Say this returns to the pool here.
        gameObject.SetActive(false);
    }
}
```

This one restarts the coroutine in `OnEnable`, so it runs fine. The trouble
starts when the coroutine is started somewhere other than `OnEnable`.

```csharp
public void Fire(Vector3 direction)
{
    transform.forward = direction;
    StartCoroutine(DespawnAfterLifetime());   // Not OnEnable.
}
```

For a bullet that disappears on impact, a collision can return it before its
lifetime is up. At that moment `SetActive(false)` ends `DespawnAfterLifetime`.
Next time it's taken out, `Fire` runs again and starts a new coroutine, so it
still looks fine. **But if there's even one path where it gets returned without
being fired again**, that object is sitting in the pool with no lifetime timer.

That's why the manual puts "stopping coroutines" first on the list. Not because
it happens automatically so you can skip it, but because **the code has to own
both when it stops and when it starts again.** Who is responsible for undoing it
needs to be unambiguous.

The other five are the same. Two of them bite immediately.

| If you don't reset | Next time you take it out |
| --- | --- |
| `Rigidbody.linearVelocity` | It launches at last time's velocity |
| `transform.position` | It appears where it died last time |
| Event subscriptions | Handlers stack up and fire more than once |
| `ParticleSystem` | Last time's particles carry on the instant it appears |
| `TrailRenderer` | A line is drawn from the old position to the new one |

That last row is the most visible one. A pooled bullet that drags a long streak
across the screen is almost always a missing `TrailRenderer.Clear()`.

In [the post following Unity's code optimization docs down](/posts/unity-code-optimization/)
I saw this list once from the manual's side. There the list itself was the
point; this post looks at **how code that ignores the list actually breaks.**

## The Check That Prevents a Double Release Can't Be Trusted

The clipping's `PoolManager.Push` is this.

```csharp
public bool Push(GameObject go)
{
    if (_pools.ContainsKey(go.name) == false)
        return false;

    _pools[go.name].Push(go);
    return true;
}
```

**There's no code stopping the same object from coming in twice.** A bullet that
touches a wall and an enemy on the same frame, or a lifetime coroutine and a
collision handler both calling return, gets `Release`d twice.

`ObjectPool<T>` does have a mechanism for catching that: the constructor's
`collectionCheck`.

> **collectionCheck:** Collection checks are performed when an instance is
> returned back to the pool. An exception will be thrown if the instance is
> already in the pool. **Collection checks are only performed in the Editor.**

The default is `true` and the clipping doesn't touch it, so it's on. The problem
is that last sentence. **If it only runs in the Editor, then in a build the same
instance goes into the pool twice.** Two `Get()` calls after that, and two
different callers are each driving the same bullet. It's the kind of bug that
only breaks in a build.

Except the public source has no such "only in the Editor" **anywhere in the
code.** `Release` looks like this.

```csharp
public void Release(T element)
{
    if (m_CollectionCheck && (m_List.Count > 0 || m_FreshlyReleased != null))
    {
        if (ReferenceEquals(element, m_FreshlyReleased)) {
            throw new InvalidOperationException(
                "Trying to release an object that has already been released to the pool.");
        }
        for (int i = 0; i < m_List.Count; i++)
        {
            if (ReferenceEquals(element, m_List[i]))
                throw new InvalidOperationException(
                    "Trying to release an object that has already been released to the pool.");
        }
    }
    m_ActionOnRelease?.Invoke(element);
    if(m_FreshlyReleased == null)
    {
        m_FreshlyReleased = element;
    }
    else if (CountInactive < m_MaxSize)
    {
        m_List.Add(element);
    }
    else
    {
        CountAll--;
        m_ActionOnDestroy?.Invoke(element);
    }
}
```

`m_CollectionCheck` just takes the constructor argument as given, and there is
no `#if UNITY_EDITOR` anywhere in this class. **The docs say Editor-only and the
source shows no such condition.** Which one is right I could not confirm.

Not confirming it doesn't muddy the conclusion. Both cases are bad.

| If the docs are right | If the source is right |
| --- | --- |
| The check is off in a build | The check is on in a build |
| Two callers share one instance | A shipped build throws an exception |
| A bug appears that the Editor never showed | An exception the Editor should have caught reaches players |

**Either way, don't lean on the pool's check.** A double release has to be
prevented by the caller.

Reading `Release` turns up one more thing. There's a **one-slot cache** called
`m_FreshlyReleased`. The first item returned goes into that slot rather than the
list, and `Get()` looks at the slot before the list. Taking back out what you
just put in never touches the list. `CountInactive` counts that slot too.

```csharp
public int CountInactive { get { return m_List.Count + (m_FreshlyReleased != null ? 1 : 0); } }
```

## The Dictionary Key Builds a String on Every Pop

`PoolManager` looks pools up by **name.**

```csharp
Dictionary<string, Pool> _pools = new Dictionary<string, Pool>();

public GameObject Pop(GameObject prefab)
{
    if (_pools.ContainsKey(prefab.name) == false)
        CreatePool(prefab);

    return _pools[prefab.name].Pop();
}
```

`prefab.name` is called **twice** here. `Push` calls `go.name` twice as well.
And `name` isn't a field. Here's what `UnityEngine.Object`'s source shows.

```csharp
public string name
{
    get { return GetName(); }
    set { SetName(value); }
}

[FreeFunction("UnityEngineObjectBindings::GetName", HasExplicitThis = true)]
extern string GetName();

[FreeFunction("UnityEngineObjectBindings::SetName", HasExplicitThis = true)]
extern void SetName(string name);
```

A native function returns a `string`. That means moving a native-side string
into a managed-heap `System.String` happens on every call, and the result is a
new object. **I couldn't find Unity's docs stating this**, so treat it as
structure readable from the source rather than documented guaranteed behavior.
Checking whether the Profiler shows `GC.Alloc` on top of `GameObject.name` is
the sure way.

If the structure is that, the conclusion is simple. **A pool built to reduce
garbage makes two strings every time you take something out and two more every
time you put it back.** Fire 200 bullets a second and recover them all, and
that's 800 a second.

A string key has other problems. **Differently-named prefabs that share a name
share a pool.** With two prefabs both called `Bullet`, one for the player and
one for enemies, whichever pool is created first takes both prefabs' requests.
The enemy fires player bullets.

And if anyone renames an instance, `Push` quietly returns `false`. With even one
call site that ignores the return value, that object **stays active in the scene
forever.** The reason for adding pooling is gone.

Switching the key to the prefab **reference** removes all three at once. A
`GameObject` compares by reference equality, so it works as a dictionary key as
is.

## Cross a Scene and the Pool Is Holding Destroyed Objects

`Pool` and `PoolManager` are plain C# classes, not `MonoBehaviour`s. So where
you keep them decides their lifetime. Usually that's a manager singleton that
survives scene changes. Do that and **`PoolManager` survives while the
`GameObject`s the pool was holding are destroyed along with the scene.**

Because `OnCreate` calls only `Instantiate(_prefab)` and specifies no parent,
the objects it makes sit at the root of the current scene. Leave the scene and
they're all destroyed. All that's left in the pool's `m_List` are references to
destroyed objects.

The next `Pop()` hands one of those back, and `OnGet` calls
`go.SetActive(true)` — code touching a destroyed object. `UnityCsReference`
contains the message used at that point.

> The object of type '...' **has been destroyed but you are still trying to
> access it.** Your script should either check if it is null or you should not
> destroy the object.

The function that produces that message is named
`TryThrowEditorNullExceptionObject`. With `Editor` in the name there's a good
chance a build takes a different path, but I didn't confirm that far. As in
[the post on Fake Null](/posts/unity-fake-null/), Unity's "destroyed but the
reference is still there" state has places where the Editor and a build look
different.

There are two ways to prevent it, and **the clipping's code does neither.**

| Approach | What it does |
| --- | --- |
| `DontDestroyOnLoad` on a root | The pool's objects don't die with the scene |
| `Clear()` when the scene changes | The pool drops the references it held |

Why the first works is in the docs.

> If the target Object is a component or GameObject, **Unity also preserves all
> of the Transform's children.** Object.DontDestroyOnLoad only works for root
> GameObjects or components on root GameObjects.

Make one dedicated pool root, call `DontDestroyOnLoad` on it, and parent every
created object under it, and they survive a scene change. The condition that the
root **must be a top-level object** is attached to the same sentence.

The second is `Clear()`.

> **Clear:** Removes all pooled items. If the pool contains a destroy callback
> then it will be called for each item that is in the pool.

The clipping's `Pool` has no method exposing `Clear` outward. Its field is
declared as `IObjectPool<GameObject>`, and that interface has exactly four
members: `CountInactive`, `Clear`, `Get`, `Release`. `ObjectPool<T>`'s
`CountAll`, `CountActive` and `Dispose` can't be called through that field.

## Where and Why You'd Use It

### The Fixed Pool

Make a place on the prefab side for undoing state. It's an abstract class
deriving from `MonoBehaviour` rather than an interface because the docs don't
say whether `TryGetComponent` works with interface types. With a component type
it's certain.

```csharp
using UnityEngine;

public abstract class PooledObject : MonoBehaviour
{
    /// <summary>Right after being taken from the pool. Where coroutines restart.</summary>
    public virtual void OnSpawned() { }

    /// <summary>Just before returning to the pool. Called before SetActive(false).</summary>
    public virtual void OnDespawned() { }
}
```

The bullet becomes this. All six of the manual's items go into `OnDespawned`.

```csharp
using System.Collections;
using UnityEngine;

public class Bullet : PooledObject
{
    private const float LIFETIME = 3f;

    [Header("Movement")]
    [SerializeField, Range(1f, 50f), Tooltip("Distance travelled per second")]
    private float _speed = 20f;

    [Header("Effects")]
    [SerializeField] private TrailRenderer _trail;
    [SerializeField] private ParticleSystem _sparks;

    private Rigidbody _rigidbody;

    private void Awake()
    {
        // Don't look it up inside Update. Cache it once.
        if (!TryGetComponent(out _rigidbody))
        {
            Debug.LogError($"{name} has no Rigidbody.");
        }
    }

    public override void OnSpawned()
    {
        // A coroutine ended by SetActive(false) doesn't revive. Start it here.
        StartCoroutine(DespawnAfterLifetime());
    }

    public override void OnDespawned()
    {
        // 1. Stop coroutines — for the case of returning before the lifetime is up.
        StopAllCoroutines();

        // 2. Reset physics — without this it launches at last time's velocity.
        _rigidbody.linearVelocity = Vector3.zero;
        _rigidbody.angularVelocity = Vector3.zero;

        // 3. Stop particles — without this last time's particles carry on.
        _sparks.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);

        // 4. Clear the trail — without this a line is drawn from where it died.
        _trail.Clear();
    }

    private IEnumerator DespawnAfterLifetime()
    {
        yield return new WaitForSeconds(LIFETIME);
        PoolManager.Instance.Push(gameObject);
    }
}
```

The pool changes like this. It touches the name once in `Create`, exposes
`Clear`, and parents created objects under a dedicated root.

```csharp
using UnityEngine;
using UnityEngine.Pool;

public sealed class Pool
{
    private const int DEFAULT_CAPACITY = 16;
    private const int MAX_SIZE = 1000;

    private readonly GameObject _prefab;
    private readonly Transform _root;
    private readonly ObjectPool<GameObject> _pool;

    public Pool(GameObject prefab, Transform root)
    {
        _prefab = prefab;
        _root = root;

        _pool = new ObjectPool<GameObject>(
            createFunc: Create,
            actionOnGet: OnGet,
            actionOnRelease: OnRelease,
            actionOnDestroy: DestroyElement,
            collectionCheck: true,
            defaultCapacity: DEFAULT_CAPACITY,
            maxSize: MAX_SIZE);
    }

    public GameObject Pop()
    {
        return _pool.Get();
    }

    public void Push(GameObject go)
    {
        _pool.Release(go);
    }

    /// <summary>When discarding the pool, destroy the objects it holds too.</summary>
    public void Clear()
    {
        _pool.Clear();
    }

    private GameObject Create()
    {
        GameObject go = Object.Instantiate(_prefab, _root);
        // The name is touched once, here. It is not used as a dictionary key.
        go.name = _prefab.name;
        return go;
    }

    private void OnGet(GameObject go)
    {
        go.SetActive(true);
        if (go.TryGetComponent(out PooledObject pooled))
        {
            pooled.OnSpawned();
        }
    }

    private void OnRelease(GameObject go)
    {
        // Call before deactivating. After SetActive(false) the coroutines are already gone.
        if (go.TryGetComponent(out PooledObject pooled))
        {
            pooled.OnDespawned();
        }
        go.transform.SetParent(_root, worldPositionStays: false);
        go.SetActive(false);
    }

    private void DestroyElement(GameObject go)
    {
        Object.Destroy(go);
    }
}
```

### The Fixed PoolManager

Switch the key to the prefab reference, and add **one more dictionary recording
the instances currently out.** That single addition blocks both the double
release and the name collision.

```csharp
using System.Collections.Generic;
using UnityEngine;

public sealed class PoolManager : MonoBehaviour
{
    private const string ROOT_NAME = "@PoolRoot";

    public static PoolManager Instance { get; private set; }

    // The key is a prefab reference, not a string. name is never called.
    private readonly Dictionary<GameObject, Pool> _pools = new();

    // Instances currently out. Double releases are blocked here.
    private readonly Dictionary<GameObject, Pool> _activeInstances = new();

    private Transform _root;

    private void Awake()
    {
        if (Instance != null)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);

        // Docs: DontDestroyOnLoad only works on root GameObjects,
        //       and all of the Transform's children are preserved with it.
        _root = new GameObject(ROOT_NAME).transform;
        DontDestroyOnLoad(_root.gameObject);
    }

    public GameObject Pop(GameObject prefab)
    {
        if (prefab == null)
        {
            Debug.LogError("A null prefab came into Pop.");
            return null;
        }

        if (!_pools.TryGetValue(prefab, out Pool pool))
        {
            pool = new Pool(prefab, _root);
            _pools.Add(prefab, pool);
        }

        GameObject go = pool.Pop();
        _activeInstances[go] = pool;
        return go;
    }

    public bool Push(GameObject go)
    {
        if (go == null)
        {
            return false;
        }

        // No record of taking it out means it's already back, or this pool never made it.
        // Don't lean on the pool's collectionCheck. The docs call it Editor-only.
        if (!_activeInstances.TryGetValue(go, out Pool pool))
        {
            Debug.LogWarning($"{go.name} was not handed out by this pool, or is already back.");
            return false;
        }

        _activeInstances.Remove(go);
        pool.Push(go);
        return true;
    }

    /// <summary>Empties the pool entirely. The objects it held are destroyed.</summary>
    public void Clear()
    {
        foreach (Pool pool in _pools.Values)
        {
            pool.Clear();
        }

        _pools.Clear();
        _activeInstances.Clear();
    }
}
```

Logging on every path where `Push` returns `false` matters. The original code's
quiet `return false` was **the route to an object staying in the scene
forever.**

### Where Not to Use It

**Objects you create once.** There's no reason to pool a player, a boss, or a
UI panel that exists once per scene. A pool spreads out creation and destruction
cost, and something created once has no cost to spread.

**Objects with a lot of state.** The more items there are to undo, the smaller
pooling's benefit and the higher the chance of a bug. If `OnDespawned` has
grown to thirty lines, plain `Instantiate` and `Destroy` may be cheaper and
safer. Measuring comes first.

**Off the main thread.** The manual pins this down.

> Like many other core Unity APIs, the `UnityEngine.Pool` APIs are **not
> thread-safe, and can only be called safely from the main thread.**

**A very large number of prefab types.** One pool is created per prefab and each
can hold up to `maxSize`. With hundreds of types, that many inactive objects
pile up in memory. A policy for per-type `maxSize` values, or for clearing
unused pools with `Clear()`, has to come with it.

## Wrapping Up

The clipping's code does show the right **way to use** `ObjectPool<T>`. Four
constructor callbacks, `GameObject.Destroy` wired to `actionOnDestroy`, stripping
`(Clone)` — the intent is clear throughout.

What's empty is `OnGet` and `OnRelease`. In the exact spot where the manual
writes that resetting state on release is important and lists six things, there
is one `SetActive` line. And that one line **doesn't pause a coroutine, it ends
it** — the docs' word is "stops." Re-enabling doesn't bring it back.

The other three are design. Nothing at the call site prevents a double release,
and the pool's own check has the docs and the source disagreeing. The dictionary
key is `GameObject.name`, so every take and every return pulls a string out of
native, and prefabs that share a name share a pool. The pool outlives the scene
while its objects die with it.

The third and fourth are easy to fix. **Switch the key to the prefab reference,
record the instances currently out in a dictionary, and put a dedicated root
under `DontDestroyOnLoad`.** The first is not easy to fix, which is why the
manual wrote it out as a list.

---

### References

- [Pooling and reusing objects — Unity Manual](https://docs.unity3d.com/6000.4/Documentation/Manual/performance-reusable-code.html)
- [ObjectPool\<T0\> — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Pool.ObjectPool_1.html)
- [ObjectPool\<T0\> constructor — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Pool.ObjectPool_1-ctor.html)
- [GameObject.SetActive — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/GameObject.SetActive.html)
- [Object.DontDestroyOnLoad — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Object.DontDestroyOnLoad.html)
- [GameObject.TryGetComponent — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/GameObject.TryGetComponent.html)
- [UnityCsReference — Unity-Technologies/UnityCsReference](https://github.com/Unity-Technologies/UnityCsReference)

The starting point for this post was [usingsystem — \[Unity\]\[개념,방법\] 오브젝트 풀링(ObjectPool) 이란?](https://usingsystem.tistory.com/49)
(2022-08-25). I followed its `Pool` and `PoolManager` implementation line by
line, checking `ObjectPool<T>`'s contract and the state-reset items against the
current manual, scripting reference and public source.
