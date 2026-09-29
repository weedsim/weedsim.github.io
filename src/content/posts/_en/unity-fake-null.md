---
pubDatetime: 2026-09-29T15:00:00+09:00
title: "Fake Null on Unassigned Fields Only Happens in the Editor"
lang: en
translationKey: unity-fake-null
featured: false
draft: false
tags:
  - Unity
  - C#
  - Memory
description: "The explanation of how fake null works is accurate. But the 'reduce the cost' list that follows it is almost entirely off — it calls something cheaper that runs the exact same function, and two of its snippets don't compile."
---

I clipped this after hearing, while building a game project and studying as I
went, that **there's such a thing as "fake null."** It's the kind of post that
comes up first when you search the term — a 2023 write-up of why fake null
happens on `UnityEngine.Object`. It starts from the mismatched lifetimes of the
native C++ object and its C# wrapper, then covers the `==` overload, the
`(object)` cast, and `ReferenceEquals`. **The explanation of the mechanism is
accurate.**

What snags is the "reducing the cost of the operation" list at the end. **Five
of its six items are off.** It calls something cheaper that runs the exact same
function, **two of the snippets don't compile**, and the final "mix them"
example rests on a premise that contradicts what the post itself explained
earlier.

There's also one word missing from the mechanism half — the **"in the editor
only"** that Unity's official blog attaches when it describes unassigned
fields.

## Table of Contents

## The Mechanism Is Described Correctly

Start with what's right. The clipping's summary:

> C++ manages memory with pointers and C# has garbage collection manage the
> freeing, and fake null arises from that difference.

Unity's official blog from 2014 says the same thing.

> The **lifetime of these c++ objects** like GameObject and everything else
> that derives from UnityEngine.Object **is explicitly managed** … Lifetime of
> c# objects gets managed the c# way, **with a garbage collector.**

> If you compare this object to null, **our custom == operator will return
> "true" in this case**, even though the actual c# variable is in reality not
> really null.

It's also right that casting to `(object)` sidesteps the overload. The source
makes the reason obvious: every `UnityEngine.Object` comparison funnels into one
method, `CompareBaseObjects`.

```csharp
public static bool operator==(Object x, Object y) { return CompareBaseObjects(x, y); }

public static bool operator!=(Object x, Object y) { return !CompareBaseObjects(x, y); }

static bool CompareBaseObjects(UnityEngine.Object lhs, UnityEngine.Object rhs)
{
    bool lhsNull = ((object)lhs) == null;
    bool rhsNull = ((object)rhs) == null;

    if (rhsNull && lhsNull) return true;

    if (rhsNull) return !IsNativeObjectAlive(lhs);
    if (lhsNull) return !IsNativeObjectAlive(rhs);

    return lhs.m_EntityId == rhs.m_EntityId;
}
```

`IsNativeObjectAlive` is the part that checks the native side, and that's **why
it costs more than you'd think.** The blog says as much.

> Comparing two UnityEngine.Objects to eachother or to null is **slower than
> you'd expect.**

## Fake Null on Unassigned Fields Is Editor-Only

The clipping writes:

> Fake null also applies when a field is **declared \[SerializeField\] and has
> never once been assigned in the Unity editor.**

True — but **one condition is missing.** Here's the blog's wording.

> When a MonoBehaviour has fields, **in the editor only**, we do not set those
> fields to 'real null', but to a **'fake null' object.**

**"In the editor only."** The reason is spelled out too.

> Our custom == operator **is able to check** if something is one of these fake
> null objects, and behaves accordingly.

> "looks like you are accessing a non initialised field in this MonoBehaviour
> over here, use the inspector to make the field point to something"

It's **a device for debugging messages.** So it doesn't go into a build.

Here's how that difference shows up in practice.

| State | `obj == null` | `ReferenceEquals(obj, null)` |
|---|---|---|
| Never assigned (Editor) | `true` | **`false`** (a fake null object is in there) |
| Never assigned (build) | `true` | **`true`** (real null) |
| Right after `Destroy` | `true` | `false` (the wrapper is alive) |
| A live object | `false` | `false` |

**Rows one and two differ.** A branch written with `ReferenceEquals` or an
`(object)` cast **behaves one way in the Editor and another in a build.** The
clipping does warn that "just because it's faster, casting everything to
System.Object is not advisable" — but it gives the reason as "a SerializeField's
null always comes in as fake null," leaving out the half that says **builds
don't work that way.**

## Going Through the "Reduce the Cost" List

Six items are listed. One at a time.

### 1. `if (gameObject)` Calls the Same Function as `== null`

The first item:

> 1\. Use the implicit conversion to bool
>
> `if (gameObject)`

**It doesn't reduce anything.** The source is one line.

```csharp
public static implicit operator bool(Object exists)
{
    return !CompareBaseObjects(exists, null);
}
```

It's **the very same function `==` calls — `CompareBaseObjects(x, y)` — with
`null` passed in and the result negated.** The native check happens all the
same.

You can use it because it reads well. **Not to make it cheaper.**

### 2. `gameObject = null` Doesn't Compile

The second item's code:

```csharp
Destroy(gameObject);
        gameObject = null;
```

`MonoBehaviour`'s `gameObject` is a **read-only property** inherited from
`Component`. The source has no setter.

```csharp
public extern GameObject gameObject
{
    [FreeFunction("GetGameObject", HasExplicitThis = true)]
    get;
}
```

Assigning to it is a compile error. The same problem shows up once more at the
end of the list.

```csharp
gameObject = gameObject ? gameObject : gameObject2;
```

**The intent is right.** Clearing *a field you own* to `null` after `Destroy`
does make it genuinely null afterwards, which makes the check cheaper and the
meaning clearer. That target just can't be `gameObject`. It has to be a field
like `_target` that you declared.

As an aside, that ternary isn't `?.` (null propagation) — it's the **conditional
operator**, and the condition position triggers the implicit `bool` conversion,
so **it does perform the Unity check properly.** It's grouped under "cheap
options" but it's a different animal.

### 3. `??` and `?.` Aren't a Shortcut — They're a Different Check

Here's how the clipping introduces `??`:

```csharp
Destroy(go1);

go1 ?? go2; // if go1 is null return go2, otherwise return go1 as is
```

**The comment doesn't match the behavior.** After `Destroy(go1)`, `go1` is
**not really null.** So `??` returns **the destroyed `go1`**, not `go2`. The
blog nails this exact point.

> It behaves **inconsistently with the ?? operator**, which also does a null
> check, but that one does a **pure c# null check**, and **cannot be bypassed
> to call our custom null check.**

The clipping's explanation — "it isn't an overloaded operator, so it doesn't
report fake null" — is technically correct. The problem is that it appears **as
an advantage in a "reduce the cost" list.** You end up working with a destroyed
object.

The Unity analyzers Microsoft ships flag these patterns as **Correctness**
diagnostics.

| Rule | Description |
|---|---|
| `UNT0007` | Null coalescing on Unity objects (`??`) |
| `UNT0008` | Null propagation on Unity objects (`?.`) |
| `UNT0023` | Coalescing assignment on Unity objects (`??=`) |
| `UNT0029` | Pattern matching with null on Unity objects |

**Correctness, not performance.** I covered Unity putting `ReferenceEquals` at
the top of its forbidden list in
[the code optimization post](/posts/unity-code-optimization/) — same reason.

### 4. The "Mix Them" Example Has Its Premise Inverted

The last item:

```csharp
if(ReferenceEquals(gameObject, null) && gameObject == false)
        {
        }
```

With this explanation attached:

> if it's in a Destroyed state, **ReferenceEquals gives true**, and the
> gameObject implicitly converted to bool comes out True

**That's wrong.** In a destroyed state, `ReferenceEquals(obj, null)` is
**`false`**. The C# wrapper is still alive — which is the definition of fake
null the clipping itself gave earlier in the same post. The premise flipped
mid-article.

The logic collapses too. Following `CompareBaseObjects` shows it immediately:

- `ReferenceEquals(obj, null)` is `true` → it's genuinely null.
- Then in `CompareBaseObjects(obj, null)`, both `lhsNull` and `rhsNull` are
  true, so it **returns `true` immediately.**
- Therefore `(bool)obj` is `!true` = `false`.

So **whenever the first condition holds, the second always holds.** The second
check in that `&&` filters nothing. The expression is identical to
`ReferenceEquals(gameObject, null)` on its own.

## What It Got Right: One-Sided Null Is the Expensive Case

The list is off, but the sentence right before it is accurate.

> The most expensive operation is **when only one side is null.**

The branches in `CompareBaseObjects` are the evidence.

- Both null → `return true`. **No** native check.
- One side null → `IsNativeObjectAlive(...)`. Native check **yes**.
- Both objects → compare `m_EntityId`. **No** native check.

**Only the one-sided-null branch touches the native side** — and `obj == null`,
the comparison we write most, is exactly that branch. The clipping states this
without a source, and the source backs it up.

The other claim alongside it — "`if(go == null)` is more expensive than
`GetComponent`" — **I couldn't verify.** What the Unity blog says stops at
"slower than you'd expect"; I found no statement comparing it to
`GetComponent`. I won't assert it either way.

## Where and Why You'd Use It

Knowing about fake null actually simplifies the rule. **On a
`UnityEngine.Object`, use `== null` and nothing else.**

### `== null` Is the Whole Rule

```csharp
using UnityEngine;

public class TargetTracker : MonoBehaviour
{
    [Header("Target")]
    [SerializeField, Tooltip("The target to follow")]
    private Transform _target;

    private void Update()
    {
        // The standard Unity check. Destroyed and unassigned both land here.
        if (_target == null)
        {
            return;
        }

        transform.LookAt(_target);
    }

    /// <summary>Destroys the target and clears our own reference.</summary>
    public void DestroyTarget()
    {
        if (_target == null)
        {
            return;
        }

        Destroy(_target.gameObject);

        // A field we declared can be cleared. From here on it's genuinely null.
        _target = null;
    }
}
```

`_target = null` is what the clipping's second item was reaching for. It has to
be **a field of ours, not `gameObject`**, to compile. And clearing it this way
makes every later check a real null check — so the "cost reduction" it wanted
falls out naturally.

The places you'd reach for `??` or `?.` look like this instead.

```csharp
// Wrong: a destroyed _target comes back
// Transform current = _target ?? _fallback;

// Right: goes through the Unity check
Transform current = _target != null ? _target : _fallback;

// Wrong: touches a destroyed object
// _target?.gameObject.SetActive(false);

// Right
if (_target != null) { _target.gameObject.SetActive(false); }
```

The one exception is **plain C# objects.** On a class that doesn't derive from
`UnityEngine.Object`, `?.` and `??` are fine. Writing that distinction down
makes it settle arguments in code review.

```csharp
private PlayerInputSystem _input;      // plain C# object → ?. is fine
private Transform _target;             // UnityEngine.Object → ?. forbidden

private void OnDestroy()
{
    _input?.Dispose();                 // this one is correct
    // _target?.gameObject ...         // this one must not be used
}
```

### Where Not to Use It

- **Checking Unity objects with `ReferenceEquals` or an `(object)` cast.** It
  misses destroyed objects, and **unassigned fields give different results in
  the Editor and in a build.**
- **`??`, `??=`, `?.`, `is null` patterns.** The analyzers flag these as
  correctness problems.
- **Using `if (obj)` as a cost saving.** It calls the same function as
  `== null`.
- **Assigning to `gameObject` or `transform`.** They're read-only properties.
- **Calling `== null` repeatedly every frame.** If you want to reduce it, don't
  remove the check — **reduce how often it runs, or clear the field to `null`**
  so it becomes a real null.

## Wrapping Up

- **The mechanism is described correctly.** It comes from the native C++ object
  and the C# wrapper having different lifetimes, and the `==` overload papers
  over the gap.
- **Fake null on unassigned fields is "in the editor only."** The blog says so
  in those words. In a build they're genuinely null.
- Which means **branches built on `ReferenceEquals` or `(object)` diverge
  between Editor and build.**
- **`if (gameObject)` doesn't reduce cost.** The source is
  `!CompareBaseObjects(exists, null)` — the same function `==` calls.
- **`gameObject = null` doesn't compile.** `Component.gameObject` has only a
  getter. To clear something, it has to be a field you declared.
- **`??` returns the destroyed object as is.** In the blog's words, it
  **"cannot be bypassed to call our custom null check."** `UNT0007`, `UNT0008`,
  `UNT0023` and `UNT0029` flag it under **correctness**.
- **The "mix them" example has its premise inverted.** In a destroyed state
  `ReferenceEquals` is `false`, and as a result its second condition filters
  nothing.
- **"One-sided null is the most expensive" is correct.** That's the only branch
  in `CompareBaseObjects` where the native check happens.
- **"More expensive than `GetComponent`" I couldn't verify.** The blog stops at
  "slower than you'd expect."

The half explaining fake null and the half talking about optimization **read
like two different articles.** The first explains that `==` checks the native
side for you; the second lists ways to skip that check as benefits. **Skipping
it is genuinely faster — and the reason it's faster is the reason it's wrong.**

---

### References

- [Custom == operator, should we keep it? — Unity blog](https://unity.com/blog/engine-platform/custom-operator-should-we-keep-it)
- [UnityEngineObject.bindings.cs — UnityCsReference](https://github.com/Unity-Technologies/UnityCsReference/blob/master/Runtime/Export/Scripting/UnityEngineObject.bindings.cs)
- [Component.bindings.cs — UnityCsReference](https://github.com/Unity-Technologies/UnityCsReference/blob/master/Runtime/Export/Scripting/Component.bindings.cs)
- [Microsoft.Unity.Analyzers diagnostics index](https://github.com/microsoft/Microsoft.Unity.Analyzers/blob/main/doc/index.md)

The starting point for this post was [usingsystem — \[Unity\] 유니티 오브젝트 Fake Null과 Null 처리](https://usingsystem.tistory.com/347)
(2023-07-13). I followed its explanation of the mechanism as written, then
checked each item in the optimization list that follows against Unity's official
blog and the UnityCsReference source. Quotes from it are my translations.
