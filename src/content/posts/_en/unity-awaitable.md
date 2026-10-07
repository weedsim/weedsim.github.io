---
pubDatetime: 2026-10-07T16:00:00+09:00
title: "await Awaitable Has No Value to Assign"
lang: en
translationKey: unity-awaitable
featured: false
draft: false
tags:
  - Unity
  - C#
  - Multithreading
  - Optimization
description: "A 2025 introduction to Awaitable. The constraints it points out still hold, but the two lines demonstrating them don't compile. And two of the features it wishes for are documented members."
---

I clipped this **after bolting `async`/`await` on because I wanted asynchrony
however I could get it**, then finding out Unity has a recommended form of its
own. I'd written and been running the code with `Task` first, and `Awaitable` was
sitting in that spot. It's a 2025 post that introduces the type briefly.

The differences that matter when coming over from `Task` I covered once already.
In [the post on Unity's code optimization doc](/posts/unity-code-optimization/) I
pulled the three places `Awaitable` differs from `Task` — **pooling, no reuse,
synchronous continuation** — straight from the docs' own sentences. This clipping
shows the **using** side on top of that: constraints, background switching,
cancellation, and a comparison with coroutines, in four sections.

**Its points are mostly accurate.** The complaint that `WhenAll` and `WhenAny`
are missing in particular still holds, and I confirmed that below against the
current member list.

What snags is **the example demonstrating the constraint.**

```csharp
var awaitable = await Awaitable.EndOfFrameAsync();
await awaitable;
await awaitable;        // 안됨
```

The post says of this code, "although it doesn't produce a compile error or a
crash." **The first line doesn't compile.**

## Table of contents

## `await Awaitable` Has No Value to Assign

The reason is that Unity split the type in two — one without a result and one
with.

| Type | Result of `await` |
| --- | --- |
| `Awaitable` | None |
| `Awaitable<T>` | `T` |

What `Awaitable.EndOfFrameAsync()` returns is the **non-generic `Awaitable`**. So
`await Awaitable.EndOfFrameAsync()` produces no value. Assign that to a `var` and
the compiler stops you.

> Cannot assign 'expression' to an implicitly-typed variable.

**CS0815.** `var` has to take its type from the right-hand side, and there's no
type to take.

The intended code is the one without the `await`.

```csharp
// Hold the Awaitable instance in a variable — don't attach await.
Awaitable awaitable = Awaitable.EndOfFrameAsync();

await awaitable;
await awaitable;        // this is the line that "doesn't work"
```

**Written this way, the situation the post meant actually happens.** It awaits one
instance twice, and that's the behavior the docs forbid — the sentence quoted in
[the earlier post](/posts/unity-code-optimization/), that awaiting a single
`Awaitable` instance more than once is never safe.

The corrected code matters because **it changes the diagnosis.** Written as the
original has it, compilation stops, so there's no chance to observe the runtime
behavior at all. The symptom the post describes — "the second await returns
immediately" — only appears in the form with the `await` removed.

### `GetAwaiter` Isn't Something You "Can't" Do — It's Undocumented

The second constraint in the same section.

> awaitable의 GetAwaiter()를 하면 안됨
>
> (Don't call GetAwaiter() on an awaitable.)

And in the body:

> GetAwaiter를 직접 호출할 수 없기 때문에 직접 WhenAll에 해당하는 확장 메서드를
> 만들기도 곤란한 문제점이 있다
>
> (Because you can't call GetAwaiter directly, there's the problem that writing
> your own extension method equivalent to WhenAll is awkward too.)

**"Can't" and "shouldn't" are mixed together here.** The post's own example calls
that method, so calling it works. It also has to exist for `await` to function at
all.

Look at the current docs' member list and the situation shows. What's listed on
`Awaitable` is the property `IsCompleted`, the method `Cancel`, and seven static
methods. **`GetAwaiter` isn't in the list.** So it's public but not a documented
surface.

Which makes the precise statement this: **it can be called, and the result isn't
guaranteed.** The reason is exactly what the post guessed at — "I can't confirm
precisely, but presumably a similar cause" — and it's written down in one line.

> instances of the `Awaitable` class are **pooled** and therefore not safe to
> `await` multiple times in the same method.

**Pooling.** A finished instance goes back to the pool and another call takes it
out again. The reference I was holding no longer points at my operation, so
neither a second `await` nor `GetAwaiter().OnCompleted()` has any ground left.
Not a guess but a documented design.

## `WhenAll` and `WhenAny` Are Still Absent in 6.2

The post's complaint:

> 대표적인 예를 들면 복잡한 비동기 작업을 처리할 때 자주 사용하게 되는
> WhenAll, WhenAny가 지원되지 않는 것이 있는데
>
> (A prime example is that WhenAll and WhenAny, used often when handling complex
> async work, aren't supported.)

**Still true.** The current docs list seven static methods.

| Static method | What it does |
| --- | --- |
| `NextFrameAsync` | Resumes on the next frame |
| `EndOfFrameAsync` | Resumes at end of frame |
| `FixedUpdateAsync` | Resumes at `FixedUpdate` timing |
| `WaitForSecondsAsync` | Resumes after the given seconds |
| `MainThreadAsync` | Returns to the main thread |
| `BackgroundThreadAsync` | Moves to a ThreadPool background thread |
| `FromAsyncOperation` | Creates an `Awaitable` from an existing `AsyncOperation` |

**Not one combinator.** And **the lists in all four versions — 2023.1, 6.2, 6.3
and 6.4 — are the same.** No static member has been added since it was
introduced. Open the `Awaitable.WhenAll` page directly and it's a **404** as well.
The complaint the post wrote in 2025 holds unchanged.

**But the docs write down an answer to this gap separately.** The manual's
[Awaitable code example reference](https://docs.unity3d.com/6000.3/Documentation/Manual/async-awaitable-examples.html)
carries one extension class.

```csharp
using System.Threading.Tasks;
using UnityEngine;

public static class AwaitableExtensions
{
    public static async Task AsTask(this Awaitable a)
    {
        await a;
    }

    public static async Task<T> AsTask<T>(this Awaitable<T> a)
    {
        return await a;
    }
}
```

**It's the path for wrapping an `Awaitable` as a `Task`.** With that,
`Task.WhenAll` and `Task.WhenAny` can be used directly.

```csharp
await Task.WhenAll(LoadStageAsync().AsTask(),
                   LoadAudioAsync().AsTask());

Task finished = await Task.WhenAny(TimeoutAsync().AsTask(),
                                   LoadStageAsync().AsTask());
```

**This is the only documented route that solves `WhenAny` too.** The post closes
on "you have to build it using UniTask or classic coroutines," but a way to cross
to the `Task` side without an external library is in the official examples. The
cost is clear — the moment you wrap in a `Task`, you **give up `Awaitable`'s
pooling and synchronous continuation at that point.**

The post saying "the current features are nearly all of what's in the simple
example code above" is nearly right too. But three things are missing from that
example code, and two of them fill the gaps the post wishes about.

## Three Members in the Docs and Not in the Post

`IsCompleted`, `Cancel` and `FromAsyncOperation`.

### There Are Three Cancellation Models

The post's cancellation section covers only `destroyCancellationToken`. That's
the pass-a-token-to-the-method approach, and the explanation is accurate. But
`Awaitable` has an instance method of its own.

> **Cancel** — Cancels the awaitable. If the awaitable is being awaited, the
> awaiter receives a `System.OperationCanceledException`.

And the docs pin down how the two relate.

> some methods returning an `Awaitable` also accept a CancellationToken. **Both
> cancelation models are equivalent.**

**The two models are equivalent.** Where a token can't be handed over up front —
when an already-started operation has to be cut from outside — hold the instance
and call `Cancel()`. The exception the receiving side gets is the same
`OperationCanceledException`, so the `catch` code doesn't change.

And there's a third, **the spot that bites most often in the editor.** The
manual's continuation section states:

> Unity **doesn't automatically stop** code running in the background when you
> exit Play mode. To cancel a background operation on exiting Play mode, use
> `Application.exitCancellationToken`.

That token's own description gives its scope.

> Cancellation token raised on **exiting Play mode (Editor)** or on **quitting
> the application** (Read Only).

**It covers both stopping Play in the editor and a built app quitting.**

The post's `destroyCancellationToken` is the token that cuts **when that object is
destroyed**, and stopping Play is a different event. Work not attached to a scene
object — exactly the **"work not tied to a GameObject"** the post lists as
`Awaitable`'s advantage — **keeps running after you stop the editor** without this
token. The same shape as the advantage-is-responsibility point elsewhere in this
post.

| Token / method | The event it cuts on |
| --- | --- |
| `destroyCancellationToken` | When that `MonoBehaviour` is destroyed |
| `Application.exitCancellationToken` | On exiting Play mode, or when the app quits |
| `Awaitable.Cancel()` | When I call it |

```csharp
private Awaitable _running;

private async Awaitable StartLongWaitAsync()
{
    _running = Awaitable.WaitForSecondsAsync(10f);

    try
    {
        await _running;
        Debug.Log("completed normally");
    }
    catch (OperationCanceledException)
    {
        // Cut by a token or by Cancel(), you land here either way.
        Debug.Log("cancelled");
    }
    finally
    {
        _running = null;
    }
}

public void AbortNow()
{
    // Cut an already-started operation from outside.
    _running?.Cancel();
}
```

`_running?.Cancel()` uses `?.` because an `Awaitable` isn't a Unity object. The
caution in [the post on Fake Null](/posts/unity-fake-null/) applies only to
`UnityEngine.Object`.

### There's a Path Over from `AsyncOperation`

`FromAsyncOperation`'s declaration:

```csharp
public static Awaitable FromAsyncOperation(AsyncOperation op,
                                           CancellationToken cancellationToken);
```

> Creates an Awaitable from an existing AsyncOperation object.

**It wraps an existing `AsyncOperation` as an `Awaitable`.** But to get the order
right, an `AsyncOperation` **is awaitable without being wrapped.** Its own docs
say so.

> **Await its completion with the `await` key word** as part of Unity's
> Awaitable support.

The manual's code example is that shape too.

```csharp
public async Awaitable LoadResourcesAsync()
{
    var operation = Resources.LoadAsync("my-texture");
    await operation;                      // not wrapped
    var texture = operation.asset as Texture2D;
}
```

**So why does `FromAsyncOperation` exist?** Look at the declaration again and the
second parameter is a `CancellationToken`. Awaiting directly leaves nowhere to
slot a token in. **This is the form for when cancellation is needed.**

```csharp
// Wrap it when you need a token
await Awaitable.FromAsyncOperation(Resources.LoadAsync("my-texture"), _destroyToken);
```

`SceneManager.LoadSceneAsync`, `Resources.LoadAsync` and Unity APIs returning an
`AsyncOperation` come in through either form.

This meshes with another of the post's sections. In the background-thread section
it warns:

> Addressables등의 유니티 메서드는 거의 전부 메인 스레드에서 실행하지 않으면
> 오류가 발생하기 때문에 리소스 로딩 등의 목적으로 사용할 때는 주의하여야 한다
>
> (Unity methods like Addressables almost all error out unless run on the main
> thread, so take care when using this for things like resource loading.)

A correct warning. And **the member for that spot is in the same class.** Not
pushing resource loading onto a background thread, but starting the
`AsyncOperation` on the main thread and awaiting it. The loading handles seen in
[the post on Addressables](/posts/unity-addressables/) can be awaited the same
way.

`IsCompleted` is a property for polling. It's for checking completion without
`await`, and there was no occasion for it in the post's scope, which is likely why
it's absent.

## Some Things Can't Be Used Once You've Crossed to the Background

The post's parallel-processing example.

```csharp
await Awaitable.BackgroundThreadAsync();
Debug.Log("작업 스레드로 이동");
Thread.Sleep(5000);

await Awaitable.MainThreadAsync();
Debug.Log("메인 스레드로 복귀");
```

Working code, and the explanation is right. The property of
`BackgroundThreadAsync` the docs state:

> Resumes execution on a ThreadPool background thread. **Completes immediately
> when called from a background thread.**

But a constraint the post doesn't mention is attached **to the other methods.**
From `NextFrameAsync`:

> This method **can only be called from the main thread** and always completes
> on main thread.

`WaitForSecondsAsync` is the same — callable only from the main thread, and it
completes there. Read the two sections together and **a combination you mustn't
make** shows up.

| Where | What you can use | What you can't |
| --- | --- | --- |
| Main thread | All seven | — |
| Background thread | `MainThreadAsync`, `BackgroundThreadAsync` | `NextFrameAsync`, `EndOfFrameAsync`, `FixedUpdateAsync`, `WaitForSecondsAsync` |

**The four tied to frames and time are main-thread only.** Calling
`WaitForSecondsAsync` to "rest a second" after crossing to the background is
stepping over the constraint, and `Thread.Sleep` is right there — which is
exactly what the post's example does. **The example is correct and the reason
isn't written down.**

The general rule is in the manual as a pair too.

> If the method is called from the main thread, it resumes on the main thread.
> Otherwise it resumes on a .NET `ThreadPool` thread.

**It comes back to where it was called**, with `MainThreadAsync` and
`BackgroundThreadAsync` as the exceptions. So the same section adds one cost.

> It's most efficient to call `await Awaitable.MainThreadAsync()` from the main
> thread and `await Awaitable.BackgroundThreadAsync()` from a background thread
> because in each case the code **resumes immediately** on completion.

Conversely, coming back from a background thread to the main one **can't resume
until the next frame update.** The `MainThreadAsync()` in the post's example is
that case, and a frame is the cost. After heavy work a frame doesn't matter, but
a structure that hops threads often accumulates it.

There's a warning about threads themselves as well.

> While Unity doesn't prevent execution of multithreaded code in these contexts,
> **crashes and other unpredictable errors are likely** if you do use multiple
> threads.

The "ThreadPool background thread" part is worth reading too. The
`Thread.Sleep(5000)` the post does **occupies one of that pool's threads for five
seconds.** Within the range the post calls appropriate — "heavy work taking
seconds, like external I/O" — that's fine, but running several of the same pattern
at once starves the pool.

## `destroyCancellationToken` Comes With a Caching Condition

The post's cancellation example is accurate. Pass the token, `catch`
`OperationCanceledException`, and the lines below don't run when cancelled — all
correct.

There's one more line in the docs.

> You must **cache** the `destroyCancellationToken` **before** you destroy the
> MonoBehaviour object.

**Cache it before destruction.** It's a `MonoBehaviour` member, so trying to read
it after destruction makes that access itself a problem. The post's example is
fine, since a method called from `Awake` reads it once at the start.

What snags is **reading it after an `await`.**

```csharp
// Risky — read again after the await. It could have been destroyed in between.
private async Awaitable LoopRiskyAsync()
{
    while (true)
    {
        await Awaitable.WaitForSecondsAsync(1f, destroyCancellationToken);
    }
}

// Safe — cache it once at the start.
private async Awaitable LoopSafeAsync()
{
    CancellationToken token = destroyCancellationToken;

    while (true)
    {
        await Awaitable.WaitForSecondsAsync(1f, token);
    }
}
```

The top one re-reads the property every iteration. Once the token is cancelled the
`await` throws and exits, so it usually isn't a problem, but **following the side
the docs ask for is cheap.** One local variable.

There's one more thing to add to the post's example.

```csharp
public void Awake()
{
    AwaitLongtime();
}
```

**It calls without taking the return.** A deliberate fire-and-forget and a common
shape, but this means an exception not caught inside that method is **seen by
nobody.** The post's example has `try`/`catch` inside, so cancellation is caught.
Covering other exceptions means sizing the `catch` accordingly, and marking the
discard with `_ =` at the call site tells a reader it's intentional.

```csharp
private void Awake()
{
    // State that the return is being discarded.
    _ = AwaitLongtimeAsync();
}
```

## The Coroutine Comparison Holds

The post's last section gives four cases where `Awaitable` beats a coroutine. All
four stand.

| The post's claim | Verified |
| --- | --- |
| Work not tied to a GameObject | Correct. A coroutine starts from a `MonoBehaviour` and rides its lifetime |
| Taking a return value and chaining further | Correct. A coroutine is an `IEnumerator` with nowhere to return a value |
| Wanting explicit cancellation | Correct. There are two models, `CancellationToken` and `Cancel()` |
| Compatibility with other async methods | Correct. `Awaitable` follows C#'s awaitable pattern |

The first row deserves one more layer. The post writes that "a coroutine needs at
least one active GameObject somewhere in the scene," but **the active condition
isn't only a question of the starting moment.**

The docs sentence confirmed in
[the post on object pooling](/posts/unity-object-pooling/) is that spot —
`SetActive(false)` **stops all coroutines** attached to that object. A coroutine
on an object returned to the pool ends there, and taking it back out doesn't
resume it. `Awaitable` doesn't ride that rule. It keeps going regardless of
deactivation, and if you want it stopped, **you have to stop it.**

**The advantage and the responsibility come out of the same sentence.** Not being
tied to a GameObject also means it won't stop by itself when the GameObject goes
away. Which is what makes the `destroyCancellationToken` the post covers a
default rather than an option.

Code on this blog that actually uses `Awaitable` is in
[the post on the Sentis workflow](/posts/sentis-workflow/). It awaits inference
results with `async Awaitable`, leaning on the property that the continuation
resumes in the same frame.

## Where and Why You'd Use It

### Port a Coroutine's `yield` Straight Over

The mapping is nearly one to one per wait type.

| Coroutine | `Awaitable` |
| --- | --- |
| `yield return null` | `await Awaitable.NextFrameAsync()` |
| `yield return new WaitForEndOfFrame()` | `await Awaitable.EndOfFrameAsync()` |
| `yield return new WaitForFixedUpdate()` | `await Awaitable.FixedUpdateAsync()` |
| `yield return new WaitForSeconds(1f)` | `await Awaitable.WaitForSecondsAsync(1f)` |
| `yield return asyncOperation` | `await operation` (`FromAsyncOperation` if you need a token) |
| `yield return new WaitUntil(cond)` | Build it — see below |
| `yield break` | `return` |
| `StopCoroutine` | Token cancellation or `Cancel()` |

What stands out is that nothing corresponds to `WaitForSecondsRealtime`. If you
need a wait that ignores the time scale, that one you build yourself.

For `WaitUntil`, the manual writes down the pattern.

```csharp
public static async Awaitable AwaitableUntil(Func<bool> condition,
    CancellationToken cancellationToken)
{
    while (!condition())
    {
        cancellationToken.ThrowIfCancellationRequested();
        await Awaitable.NextFrameAsync();
    }
}
```

**It checks the condition every frame**, the same structure as a coroutine's
`WaitUntil`. What differs is that there's a place for a token.

There's a line about mixing the two as well.

> You can safely `yield return` an `Awaitable` from a traditional iterator-based
> coroutine, but **you can't `yield return` an `Awaitable<T0>`**.

**Inside a coroutine, an `Awaitable` can be awaited and an `Awaitable<T>`
can't.** It snags where the two mix during an incremental migration.

The ported shape looks like this — a trap that rearms after a set time.

```csharp
using System;
using System.Threading;
using UnityEngine;

public class TrapRearm : MonoBehaviour
{
    private const float DEFAULT_COOLDOWN = 3f;

    [Header("Cooldown")]
    [SerializeField, Range(0.1f, 30f), Tooltip("Time from firing to rearming")]
    private float _cooldown = DEFAULT_COOLDOWN;

    [SerializeField, Tooltip("Rearmed state")]
    private bool _isArmed = true;

    // Cached before destruction. The docs require it.
    private CancellationToken _destroyToken;

    private void Awake()
    {
        _destroyToken = destroyCancellationToken;
    }

    public void Trigger()
    {
        if (!_isArmed)
        {
            return;
        }

        _isArmed = false;

        // State that the return is being discarded.
        _ = RearmAsync();
    }

    private async Awaitable RearmAsync()
    {
        try
        {
            await Awaitable.WaitForSecondsAsync(_cooldown, _destroyToken);

            _isArmed = true;
            Debug.Log("rearmed", this);
        }
        catch (OperationCanceledException)
        {
            // Cancelled because the object was destroyed. Nothing to roll back.
        }
    }
}
```

Written as a coroutine it needs `StartCoroutine`, and **if the object is
deactivated the cooldown stops and it never rearms.** For a trap taken out of a
pool that's a bug outright. `Awaitable` flows regardless of deactivation, so the
symptom doesn't exist.

### When There's No `WhenAll`

Even without a combinator, **the shape of "start together and wait for all" can be
built.** A C# `async` method runs synchronously up to its first `await`, so simply
calling it starts it then and there.

```csharp
private async Awaitable LoadAllAsync()
{
    // No await. All three start the moment they're called.
    Awaitable a = LoadStageAsync();
    Awaitable b = LoadAudioAsync();
    Awaitable c = WarmUpShadersAsync();

    // Wait one at a time. Each instance is awaited 'once', so the rule holds.
    await a;
    await b;
    await c;

    Debug.Log("all three done");
}
```

**Each instance is awaited exactly once.** A form that doesn't hit the no-reuse
rule from earlier. The slowest one sets the total time, so the result matches
`WhenAll` too.

One thing does differ from `WhenAll`. **If `a` throws, you exit right there, and
`b` and `c` keep running with nobody awaiting them.** `Task.WhenAll` gathers the
exceptions and returns them after everything finishes; this form doesn't. If
failures have to be handled as a set, catching inside each method and taking the
result back as something like `Awaitable<bool>` is better.

There's no building a `WhenAny` equivalent this way. You'd need to know which
finished first, and `await` fixes the order. For that, cross over with **the
docs' `AsTask()`** seen earlier.

```csharp
private async Awaitable LoadWithTimeoutAsync()
{
    Task load = LoadStageAsync().AsTask();
    Task timeout = Awaitable.WaitForSecondsAsync(10f).AsTask();

    Task finished = await Task.WhenAny(load, timeout);

    if (finished == timeout)
    {
        Debug.LogWarning("loading passed 10 seconds");
    }
}
```

Wrapping in a `Task` gives up pooling and synchronous continuation, so **use it
where something runs rarely, like loading, not in code that runs every frame.**
Code using `Task` and tokens is in
[the post on TcpListener](/posts/tcplistener-accepttcpclient/).

### Where Not to Use It

- **`var x = await Awaitable...`.** The result of the `await` has no type. To hold
  the instance, drop the `await` and write `Awaitable x = ...`.
- **Awaiting the same `Awaitable` instance twice.** It's a pooled object, so the
  second wait's target may not be your operation.
- **Holding it in a field and awaiting from several places.** Same reason. It
  snags especially on patterns carried over from `Task`.
- **Calling frame or time waits from a background thread.** Those four are
  main-thread only. There, it's `Thread.Sleep` or `Task.Delay`.
- **Touching Unity APIs from the background.** The post's warning is right.
  Resource loading starts on the main thread and is awaited with
  `FromAsyncOperation`.
- **Re-reading `destroyCancellationToken` after an `await`.** The docs require
  caching before destruction. Take it into a local.
- **Expecting it to stop by itself along with the GameObject's lifetime.** That's
  a coroutine's property and `Awaitable` doesn't have it. Pass a token.
- **Expecting it to end when you stop Play mode.** The docs say it doesn't stop
  automatically. For work not tied to a scene, pass
  `Application.exitCancellationToken`.
- **Going through `FromAsyncOperation` just to await an `AsyncOperation`.** It
  awaits as-is. That method is for when you need a token.

## Wrapping Up

- **`await Awaitable` produces no value.** The non-generic `Awaitable` has no
  result, so `var awaitable = await Awaitable.EndOfFrameAsync();` stops at CS0815.
  The situation the post wanted to show only arises with the `await` removed.
- **`GetAwaiter` isn't something you "can't" do — it's undocumented.** The post's
  example calls it. It can be called and the result isn't guaranteed, and the
  reason is the **pooling** the docs state.
- **`WhenAll` and `WhenAny` are still absent.** Seven current static methods, and
  the 2023.1, 6.2, 6.3 and 6.4 lists are all the same. The `Awaitable.WhenAll`
  page is a 404.
- **But the docs write down the path over to `Task`.** Wrap with the manual
  example's `AsTask()` extension and `Task.WhenAll` / `Task.WhenAny` work. The
  cost is **giving up pooling and synchronous continuation** at that point.
- **Three members are missing from the post.** `Cancel` is a cancellation model
  the docs call **equivalent** to the token, `FromAsyncOperation` is the form that
  slots a token into an `AsyncOperation`, and `IsCompleted` is for polling.
- **An `AsyncOperation` awaits without being wrapped.** So `FromAsyncOperation`
  exists not to "make it awaitable" but **to slot a token in**.
- **There are three cancellation paths.** Destruction
  (`destroyCancellationToken`), Play mode exit or app quit
  (`Application.exitCancellationToken`), and manual (`Cancel()`). **Stopping Play
  doesn't stop background code** is the docs' warning, and it's the one absent
  from the post.
- **The four frame and time waits are main-thread only.** The docs say "can only
  be called from the main thread." They can't be used after crossing to the
  background, and that's why the post's example uses `Thread.Sleep`.
- **Coming back from background to main costs a frame.** The docs say the
  opposite direction resumes immediately. Hopping threads often accumulates it.
- **`destroyCancellationToken` must be cached before destruction.** A docs
  requirement, met by avoiding the re-read-after-`await` shape.
- **The four coroutine comparisons all hold.** To add: unlike `SetActive(false)`
  stopping coroutines, `Awaitable` keeps flowing. **The advantage of not being
  tied to a GameObject is exactly the responsibility of having to stop it
  yourself.**
- **Inside a coroutine an `Awaitable` can be `yield return`ed and an
  `Awaitable<T>` can't.** It snags mid-migration.

---

### References

- [Awaitable — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Awaitable.html) ·
  [Awaitable (2023.1)](https://docs.unity3d.com/2023.1/Documentation/ScriptReference/Awaitable.html)
- [Awaitable.Cancel](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Awaitable.Cancel.html) ·
  [Awaitable.FromAsyncOperation](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Awaitable.FromAsyncOperation.html)
- [Awaitable.NextFrameAsync](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Awaitable.NextFrameAsync.html) ·
  [Awaitable.WaitForSecondsAsync](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Awaitable.WaitForSecondsAsync.html) ·
  [Awaitable.BackgroundThreadAsync](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Awaitable.BackgroundThreadAsync.html)
- [Introduction to Awaitable — Unity Manual](https://docs.unity3d.com/6000.3/Documentation/Manual/async-awaitable-introduction.html) ·
  [Completion and continuation](https://docs.unity3d.com/6000.3/Documentation/Manual/async-awaitable-continuations.html) ·
  [Code example reference](https://docs.unity3d.com/6000.3/Documentation/Manual/async-awaitable-examples.html)
- [MonoBehaviour.destroyCancellationToken — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/MonoBehaviour-destroyCancellationToken.html) ·
  [Application.exitCancellationToken](https://docs.unity3d.com/6000.3/Documentation/ScriptReference/Application-exitCancellationToken.html)
- [AsyncOperation — Unity Scripting Reference](https://docs.unity3d.com/6000.3/Documentation/ScriptReference/AsyncOperation.html)
- [Compiler error CS0815 — C# reference](https://learn.microsoft.com/en-us/dotnet/csharp/misc/cs0815)

The starting point for this post was
[leffe. — 유니티 6 Awaitable 소개](https://tearsinrain.tistory.com/21)
(2025-03-20). The three ways `Awaitable` differs from `Task` were covered first in
[the post on Unity's code optimization doc](/posts/unity-code-optimization/); this
one cross-checked the **using** side. The static member list was identical across
**four versions — 2023.1, 6.2, 6.3 and 6.4** — and the `Awaitable.WhenAll` page
was a 404. `AsTask()`, `Application.exitCancellationToken` and the `yield return`
restriction were confirmed in the manual's three Awaitable sections. The check
date is 2026-10-07.
