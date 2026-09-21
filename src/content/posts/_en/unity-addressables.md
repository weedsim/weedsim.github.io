---
pubDatetime: 2026-09-21T18:00:00+09:00
title: "Release First and Completed Gets an Invalidated Handle"
lang: en
translationKey: unity-addressables
featured: false
draft: false
tags:
  - Unity
  - Addressables
  - C#
  - Memory
description: "I checked a 2023 write-up of Addressables against the current docs. The example's release ordering is wrong, and the duplicate-key problem the author spent hours on is one line in the manual. Lining it up with Unreal's soft references — where I started — makes that release problem clearer."
---

Studying Unreal Engine, I came across its ability to **load assets at runtime**,
went looking for Unity's equivalent, and landed on this 2023 post. It's a
**hands-on write-up** of Addressables, so it's dense: registration, loading and
releasing, a comparison with Resources, and a bug the author hit along the way.

It opens by scoping itself — "personal study notes," "written against Unity
2021.3.15f1." That makes it worth checking: **what still holds today and what
has moved.**

Three things came up. One where the docs state the case more strongly than the
original, one where the answer to the problem the author struggled with is a
single line in the manual, and one in the example code itself. At the end I
**lined it up against Unreal**, where I started — and that made the first problem
sharper.

## Table of contents

## The example's `Release` comes too early

The original's loading example, verbatim:

```csharp
void Start()
{
    // Change the mouse cursor texture
    AsyncOperationHandle handle = Addressables.LoadAssetAsync<Texture2D>("Cursor_Mining");
    // Register what to run on completion as a callback
    handle.Completed += (op) =>
    {
        Cursor.SetCursor(handle.Result as Texture2D, Vector2.zero, CursorMode.Auto);
        Debug.Log("Complete");
    };
    // Release
    Addressables.Release(handle);
}
```

All three lines run **in the same frame**, in order: start the load, register the
callback, **release**. `LoadAssetAsync` is asynchronous, so the load hasn't
finished at that point. And `Release` has already fired.

The docs describe what `Release` does:

> Releasing an operation handle decrements the reference count of any assets
> loaded by the operation and **invalidates the operation handle object itself**.

The second half is the problem. The lambda **captures** `handle` and reads
`handle.Result` later — by which time `handle` has been invalidated. Unrolled:

| When | What happens |
|---|---|
| Inside `Start()` | Load starts → callback registered → **`Release` runs** |
| A few frames later | Load completes → `Completed` fires → **`Result` read on an invalidated handle** |

Even if a value came back, what follows is worse. Once the reference count hits
zero the texture is unloaded — and the cursor is pointing at it.

The original says, in the very next paragraph, that **"if you want to release it
later when you need to, it's good to store the return value in an
`AsyncOperationHandle` variable."** The intent was right; **only the line's
position in the example is off.** But copy just the code and the intent doesn't
come with it.

`Release` belongs where **you're done with the asset.** For something like a
cursor texture that's used for as long as the scene lives, that's `OnDestroy`.

One more thing. The example takes a non-generic `AsyncOperationHandle` and casts
with `Result as Texture2D`, where the docs prefer the generic form.

> Most `Addressables` methods that start an operation return a generic
> `AsyncOperationHandle<T>` struct, allowing **type safety** for the
> `AsyncOperationHandle.Completed` event and for the `AsyncOperationHandle.Result`
> object.

> A runtime exception happens if you try to cast a non-generic handle to a
> generic handle of **a wrong type**.

Take it as `AsyncOperationHandle<Texture2D>` and `Result` is already a
`Texture2D`, no cast needed.

## "Async only" was already wrong in 2021

Listing the drawbacks, the original writes:

> First, it only supports asynchronous loading, so loading synchronously
> requires additional code.

**There is a dedicated synchronous API**:
`AsyncOperationHandle.WaitForCompletion()`. The docs:

> You can wait for an operation to finish **without yielding, waiting for an
> event, or using `async await`** by calling an operation's `WaitForCompletion`
> method.

```csharp
opHandle = Addressables.LoadAssetAsync<GameObject>(address);
opHandle.WaitForCompletion(); // Returns when operation is complete

if (opHandle.Status == AsyncOperationStatus.Succeeded)
{
    Instantiate(opHandle.Result, transform);
}
```

The timing matters. It landed in **1.17.4-preview (2021-01-27)**, with the
changelog reading "Added WaitForCompletion() on AsyncOperationHandles. This
allows async operation to be executed synchronously."

The original was written in **July 2023** against **Unity 2021.3.15f1** — more
than two years after. Easy to miss in personal study notes, but **if that one
line carries you to "Addressables can't load synchronously, so use Resources,"**
the conclusion changes.

It isn't free, though. The docs attach several warnings.

| Caution | What the docs say |
|---|---|
| Frame hitches | "Avoid calling `WaitForCompletion` on operations that can take **a significant amount of time**, such as those that must download data" |
| Cascading waits | All active asset load operations complete when called, so unexpected stalls are possible |
| Deadlock | Calling it during `Awake` while a scene loads blocks the main thread and prevents other operations from completing. Loading successive scenes this way **can deadlock the editor or player** |
| Platform | "**WebGL doesn't support `WaitForCompletion`**" |

So it's not "synchronous loading isn't available" but **"it is available, it's
expensive, and WebGL doesn't have it."** Different basis for a decision.

## The duplicate-key problem is one line in the manual

The most valuable part of the original is the author's own bug report.

> Because I registered some weapons' images and audio under the same name, those
> weapons' sfx failed to load. No exception was raised either (…) and I spent a
> long time tracking down the cause.

It ends with **"if you don't plan to load them together, it's best to register
keys for single loads so they don't collide."** The right conclusion, and the
current docs spell the behavior out.

> **if the key resolves to more than one asset, only the first asset found is
> loaded.**

> if you call this method with a label applied to several assets, Addressables
> returns **whichever one of those assets it finds first**.

Which means "no exception is raised" isn't a bug but **designed behavior.**
Because a key can be a label and not just an address, matching several assets is
a normal situation, and one of them gets picked.

So the rule becomes:

- **`LoadAssetAsync<T>` means "give me one."** If the key matches several, it
  silently gives you the first.
- **To get several, that's `LoadAssetsAsync`.** That's why the docs separate
  singular from plural.
- A missing key throws, so it's caught fast — but **a key matching several is
  quiet.**

The symptom the author chased — the load finishes yet part of the array is
`null` — is exactly what this behavior produces.

## The Resources comparison holds, and the docs say it harder

The original's case against Resources has two branches. Both hold, and Unity's
manual is if anything more categorical.

**First, unused assets still ship.**

> Assets in `Resources` folders are **always included in the Player build, even
> if they're not referenced by anything.**

Exactly the original's "put 10GB in and use 1GB, all 10GB ships." The manual adds
one more:

> If you have a lot of assets in the `Resources` folder, then **building and
> starting your application can take a long time.**

**Startup time, not just build size** — a cost that doesn't show up in the
original's build-size screenshot, so it's worth noting. The manual directly
suggests content directories, AssetBundles, or the **Addressables package** for
content-heavy applications.

**Second, keys instead of paths.**

The original's phrasing is accurate — move a registered object and the path
updates automatically, so "you don't need to modify the loading code even if you
move the object." That still holds.

Managing what ends up in a build connects to the managed-memory material in
[Unity's code optimization docs](/en/posts/unity-code-optimization/).

## How Unreal does it

Since Unreal is where this search started, let me line them up.

Unreal splits references into **hard and soft.** The docs define them:

> a **hard reference** where object A refers to object B and **causes object B to
> be loaded when object A is loaded**

> a **soft reference** where object A refers to object B via an indirect
> mechanism such as **the string form of the path** to the object

Same shape as Unity's Resources problem. A hard reference **comes along when its
owner loads**, and assets in a Resources folder **ship whether referenced or
not.** Both have the same fix — **make the reference an indirect string.**
Unreal has `TSoftObjectPtr`; Addressables has keys.

The description of `TSoftObjectPtr` is familiar too: it stores the property **as
a string**, `IsPending()` checks whether it's loaded, and you **"manually load
the asset when you want to use it."**

Loading goes through `FStreamableManager`. The docs' own example:

```cpp
Streamable.RequestAsyncLoad(ItemsToStream,
  FStreamableDelegate::CreateUObject(this,
    &UGameCheatManager::GrantItemsDeferred));
```

Start an async load, hand over a completion delegate. Same shape as
`LoadAssetAsync` + `Completed`. Mapped out:

| | Unreal | Addressables |
|---|---|---|
| Indirect reference | `TSoftObjectPtr` / `FSoftObjectPath` | A key (address) string |
| Async load | `FStreamableManager::RequestAsyncLoad` | `Addressables.LoadAssetAsync<T>` |
| Completion | `FStreamableDelegate` | `AsyncOperationHandle.Completed` |
| What keeps it alive | A hard reference (+ GC) | **The handle's reference count** |

That last row is where they diverge, and it's what sharpens the bug from the
first section. From Unreal's docs:

> `StreamableManager` keeps hard references to any assets it loads **until the
> delegate is called**, so you can safely know that none of the objects you
> wanted to asynchronously load will be garbage collected before the delegate is
> called. **It releases those references after the delegate is called**, so you
> need to hard reference them somewhere else if you want to ensure they will stay
> around.

Both engines make **keeping the asset alive past the callback your job** — but
they let go at opposite moments.

- **Unreal lets go automatically once the callback finishes.** So it disappears
  if you **forget to hold on.**
- **Addressables holds until you call `Release`.** So it breaks if you **let go
  too early.**

The first section's example is precisely the latter. That's why "let's jot down
a release call while we're here," which is harmless instinct from the Unreal
side, isn't. In Addressables, `Release` doesn't mean tidying up — **it means the
end of the asset's lifetime.**

## Where and why you'd use this

To summarize: **loading is easy, releasing is hard.** The reference count is
yours to balance, and the docs are blunt about it.

> Unity **doesn't load or release the referenced asset automatically.** You must
> load and release the asset using the `Addressables` API.

### Loading and releasing in one component

Tying the handle's lifetime to the component's makes it harder to forget.

```csharp
using System;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

/// <summary>
/// Loads the cursor texture through Addressables and releases it with the component.
/// </summary>
public class CursorLoader : MonoBehaviour
{
    [Header("Addressables")]
    [SerializeField, Tooltip("The registered key. A single load, so it must not collide")]
    private string _cursorKey = "Cursor_Mining";

    // Generic handle: Result is already a Texture2D, so no cast.
    private AsyncOperationHandle<Texture2D> _handle;
    private bool _hasHandle;

    public event Action<Texture2D> OnCursorReady;

    private void Start()
    {
        _handle = Addressables.LoadAssetAsync<Texture2D>(_cursorKey);
        _hasHandle = true;
        _handle.Completed += HandleCompleted;
    }

    private void OnDestroy()
    {
        // This is where the release belongs — not right after starting the load.
        if (_hasHandle)
        {
            Addressables.Release(_handle);
            _hasHandle = false;
        }
    }

    private void HandleCompleted(AsyncOperationHandle<Texture2D> op)
    {
        if (op.Status != AsyncOperationStatus.Succeeded)
        {
            Debug.LogWarning(
                $"[{nameof(CursorLoader)}] Failed to load '{_cursorKey}'. " +
                "Check that the key exists.", this);
            return;
        }

        Cursor.SetCursor(op.Result, Vector2.zero, CursorMode.Auto);
        OnCursorReady?.Invoke(op.Result);
    }
}
```

A few intentions:

- **The release lives in `OnDestroy`.** The cursor texture is used as long as
  this component does, so the lifetime is tied to the component.
- **The handle is generic.** The callback parameter is
  `AsyncOperationHandle<Texture2D>` too, so `op.Result` is directly a `Texture2D`.
- **`Status` is checked first in the callback.** A missing key throws, but let a
  failure path through and `Result` isn't guaranteed to be anything. The docs
  also say **it's best practice to release the handle even when an operation is
  unsuccessful.**
- **`?.` appears only on `OnCursorReady`.** That's a plain C# event. `_handle` is
  a struct and `Addressables` is a static class, so the question doesn't arise.

### When you need a synchronous load

The shape that respects the warnings above. Keep it to **small, local assets.**

```csharp
AsyncOperationHandle<GameObject> handle = Addressables.LoadAssetAsync<GameObject>(key);
handle.WaitForCompletion();

if (handle.Status == AsyncOperationStatus.Succeeded)
{
    Instantiate(handle.Result, transform);
}
```

**If WebGL is among your targets, don't take this path** — the docs say it isn't
supported. Nor for content that has to be downloaded remotely.

### Where not to use it

- **Loading in `Start` and releasing in the same `Start`.** That's where this
  post began.
- **`LoadAssetAsync<T>` with a key that might collide.** It quietly gives you the
  first. If several is correct, that's `LoadAssetsAsync`.
- **`WaitForCompletion` in `Awake` during scene loading.** The docs warn about
  deadlock directly.
- **Adopting it unconditionally on a small project.** The original's closing
  judgment is sound — with few spare assets, there isn't much to gain.

## Summary

- **`Release` invalidates the handle.** Call it right after starting a load and
  the later `Completed` reads an invalidated handle. Release means **done using
  it.**
- **Prefer `AsyncOperationHandle<T>` over the non-generic form.** The docs
  recommend it for type safety, and a wrong-type cast is a runtime exception.
- **Synchronous loading has existed since 2021.** `WaitForCompletion` landed in
  1.17.4-preview. The cost is frame hitches, cascading waits, deadlock risk — and
  **WebGL doesn't support it.**
- **A key matching several assets loads only the first.** Documented, designed
  behavior, and quiet because nothing throws. Use `LoadAssetsAsync` for several.
- **The case against Resources holds.** The manual is more categorical
  (**"always included even if not referenced"**) and adds **startup time** on top
  of build size.
- **Loading and releasing are entirely your job.** The docs state that Unity
  won't do it for you.
- **Unreal lets go at the opposite moment.** Its `StreamableManager` releases its
  references after the delegate fires, so things vanish if you **don't hold on**;
  Addressables holds until you release, so things break if you **let go early.**

The original labels itself study notes and kept the bug it hit, which gave me
plenty to check against. I saw the same shape earlier in
[the CrossFade post](/en/posts/animator-crossfade/), and the pattern repeats:
**old technical posts usually need rechecking not because they were wrong, but
because the conditions moved underneath them.**

---

### References

- [Load assets — Addressables 3.1](https://docs.unity3d.com/Packages/com.unity.addressables@3.1/manual/load-assets.html)
- [Asynchronous operation handles](https://docs.unity3d.com/Packages/com.unity.addressables@3.1/manual/AddressableAssetsAsyncOperationHandle.html)
- [Synchronous loading — WaitForCompletion](https://docs.unity3d.com/Packages/com.unity.addressables@3.1/manual/SynchronousAddressables.html)
- [Addressables 1.17 changelog](https://docs.unity3d.com/Packages/com.unity.addressables@1.17/changelog/CHANGELOG.html)
- [Loading Resources at Runtime — Unity Manual](https://docs.unity3d.com/Manual/LoadingResourcesatRuntime.html)
- [Special folder names](https://docs.unity3d.com/Manual/SpecialFolders.html)
- [Asynchronous Asset Loading — Unreal Engine docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/asynchronous-asset-loading-in-unreal-engine)
- [Referencing Assets — Unreal Engine docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/referencing-assets-in-unreal-engine)

The source this post started from is [sam0308 — \[Unity\] Addressable 기능](https://sam0308.tistory.com/71)
(2023-07-27, against Unity 2021.3.15f1). The original is from the Addressables
1.x era; quotations and behavior were re-checked against the current **3.1**
docs.
