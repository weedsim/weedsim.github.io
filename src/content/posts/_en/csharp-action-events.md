---
pubDatetime: 2026-10-06T20:00:00+09:00
title: "You Can't Remove an Anonymous Function — But Not Because It's Anonymous"
lang: en
translationKey: csharp-action-events
featured: false
draft: false
tags:
  - Unity
  - C#
  - Event
  - Design Pattern
description: "A 2022 post on registering events with Action. The behavior descriptions are accurate, but the comment 'anonymous functions can't be removed' hides the reason. What blocks removal isn't anonymity — it's not holding the same instance."
---

I clipped this **while looking into input event handling and wanting to see
`Action` itself in detail.** In
[the post on subscribing to InputAction directly](/posts/input-action-subscribe/)
I covered attaching and detaching methods on `started`, `performed` and
`canceled` — but **what those `+=` and `-=` actually do isn't something the input
docs explain.** That's `Action`, and delegates.

It's a 2022 post that walks `Action`'s basic behavior through examples. **The
descriptions are accurate.** Register it several times and it runs several times,
a method with parameters can't go in directly, wrapping it in a lambda lets it in,
and external scripts can register too — check them and they all hold. It even has
sections on the `event` keyword and on preventing duplicates, which is broad for
introductory material.

What snags is one comment.

```csharp
gameOverEvent -= gameOver; //빼는 것도 가능.
gameOverEvent -= () => gameOverMessage("Message 2"); // 익명 함수는 삭제 불가
```

**"Anonymous functions can't be removed."** The result is right. That line removes
nothing. But the reason isn't anonymity. And correcting the reason **hands you the
way to remove it.**

## Table of contents

## It Isn't Because It's Anonymous

`-=` goes to `Delegate.Remove`, and what that method matches on is written in the
docs.

> **Removes the last occurrence of the invocation list of a delegate** from the
> invocation list of another delegate.

> Returns `source` if `value` is `null` or if the invocation list of `value` is
> **not found** within the invocation list of `source`.

If it isn't found, you get the original back. That's why there's no error — exactly
as the clipping notes when it says removing an unregistered function raises
nothing.

So the question is what "found" means. From `Delegate.Equals`:

> Determines whether the specified object and the current delegate are of the
> same type and share the **same targets, methods, and invocation list**.

> If the two methods being compared are instance methods and are **the same
> method on the same object**, the methods are considered equal.

**"The same method on the same object."** The key word here is *method*. A lambda
expression compiles into **its own distinct method.** Write two identical-looking
lambdas in the source and you get two different methods.

```csharp
// Identical characters, compiled as two different methods.
gameOverEvent += () => gameOverMessage("Message 2");  // method A
gameOverEvent -= () => gameOverMessage("Message 2");  // looks for method B
```

**The side removing holds a different method from the side that added**, so it
isn't found in the list and, per the docs, the original comes back unchanged. It
isn't anonymity forbidding it — **the comparison simply never matches.**

Which is why the one registered by method name does get removed. `gameOver` is the
same method on `this`, so both sides point at the same thing.

### Store it in a variable and it removes

If the reason is "not the same instance," there's one fix. **Hold the instance.**

```csharp
using System;
using UnityEngine;

public class LambdaUnsubscribe : MonoBehaviour
{
    private const string MESSAGE = "Message 2";

    private Action _messageHandler;

    private void OnEnable()
    {
        // Keep the lambda in a field. This instance becomes the basis of comparison.
        _messageHandler = () => Debug.Log($"Game Over : {MESSAGE}", this);

        GameEvents.GameOver += _messageHandler;
    }

    private void OnDisable()
    {
        if (_messageHandler == null)
        {
            return;
        }

        // Same instance, so Delegate.Equals holds and it leaves the list.
        GameEvents.GameOver -= _messageHandler;
        _messageHandler = null;
    }
}
```

`_messageHandler` is used on both sides, so **the target and the method are the
same.** It removes. This is the base form for using a lambda and still
unsubscribing, and memorizing the clipping's comment as "anonymous functions can't
be removed" keeps you from looking for it.

Where you can't store it in a variable, there are two options. **Match the
lifetime so no removal is needed** (the `event` plus paired teardown below), or
**skip the lambda and pull it out as a method.** If you reached for the lambda
because you needed a parameter, the latter is usually cleaner.

## `-=` Removes Only the Last One

The docs' first sentence has "last occurrence" in it. Which one goes, when there
are several, is written down too.

> If the invocation list of `value` occurs **more than once** in the invocation
> list of `source`, **the last occurrence is removed.**

**One at a time.** The clipping's example shows that result — `gameOver` is
registered three times, removed once, and runs twice. The post states it exactly:
"registered 3 times, removed once, so it ran twice."

But read alongside that fact, the final section's recipe comes with a condition.

> Action은 중복된 함수도 등록할 수 있다. 따라서 등록 전에 한 번 빼고 등록하면
> **간단히 중복을 방지**할 수 있다.
>
> (Action can register duplicate functions. So removing once before registering
> **simply prevents duplicates**.)

```csharp
gameOverEvent -= gameOver;
gameOverEvent += gameOver;
```

**This pattern doesn't "make the count 1" — it "keeps the count."** `-=` takes one
away and `+=` adds one, so the sum is unchanged.

| Prior state | After `-=` | After `+=` |
| --- | --- | --- |
| 0 | 0 (not found returns the original) | **1** |
| 1 | 0 | **1** |
| 3 | 2 | **3** |

At 0 and 1 it does what you meant. At three it stays three. In other words,
duplicates stay out **only if every registration goes through this pattern.** If
even one path registers with a bare `+=`, this code won't clean that duplicate up.

If you truly have to guarantee one, you need to track registration separately.

```csharp
using System;

public static class GameEvents
{
    private static Action _gameOver;

    public static event Action GameOver
    {
        add
        {
            // Already present, so don't add. The count never exceeds one.
            if (_gameOver != null && Array.IndexOf(_gameOver.GetInvocationList(), value) >= 0)
            {
                return;
            }

            _gameOver += value;
        }
        remove
        {
            _gameOver -= value;
        }
    }

    public static void RaiseGameOver()
    {
        _gameOver?.Invoke();
    }
}
```

Writing the `add`/`remove` accessors yourself lets you slip a check into the
registration. Take the list with `GetInvocationList()` and see whether the same
delegate is in it. **But registration becomes O(n).** Past a few dozen subscribers
the bare `+=` is right, and duplicates are better prevented by discipline on the
calling side.

## The "Void Only" Rule Loosens With a Lambda

A rule the clipping gives its own section to.

> Action에는 return 타입이 없는(void) 함수만 등록 가능하다.
>
> (Only functions with no return type (void) can be registered on an Action.)

For putting a method name in directly, that's right. The `Action` docs say so too.

> The encapsulated method must correspond to the method signature defined by
> this delegate. This means the encapsulated method must have **no parameters
> and no return value.**

But the same paragraph adds one more line in parentheses.

> (In C#, the method must return `void`. … **It can also be a method that
> returns a value that is ignored.**)

**A method that returns a value it ignores also counts.** The C# standard's
anonymous function conversion rule states that condition precisely.

> If the body of `F` is an expression, and either `D` has a void return type …
> then … the body of `F` is a valid expression … that would be permitted as a
> ***statement_expression***.

A method invocation is a statement expression regardless of its return type. So
inside an expression-bodied lambda, **a method with a return value does go into an
`Action`.**

```csharp
private bool TrySpendCoins(int amount)
{
    return true;
}

private void Start()
{
    // Putting the name in directly doesn't compile. The return type doesn't match.
    // GameEvents.GameOver += TrySpendCoins;

    // Wrapped in a lambda it compiles. The bool is quietly thrown away.
    GameEvents.GameOver += () => TrySpendCoins(10);
}
```

The clipping introduces the lambda **to pass a parameter.** That same statement
**also lets the return check be skipped.** `TrySpendCoins` can hand back `false`
and nobody looks.

It's the classic accident of plugging a success/failure method into an event. If
there's a value to get back, it's `Func<T>` rather than `Action`, and if an event
can't give you the result, **the design of using that method as a handler is what
needs rethinking.** The `Action` docs mark that fork too.

> To reference a method that has no parameters and returns a value, use the
> generic `Func<TResult>` delegate instead.

## With Nothing Registered, the Call Throws

The clipping's invocation site.

```csharp
void OnMouseDown()
{
    gameOverEvent();
    stringEvent("Action<string>!!");
}
```

It runs inside the example, because `Start` in the same script registers its own
methods. **With no registrations at all, both lines are a
`NullReferenceException`.** A delegate field defaults to `null`, and there's no
such thing as an empty invocation list.

And there's a path where registrations existed and then went away. The last
sentence of `Delegate.Remove` again:

> Returns a **null reference** if the invocation list of `value` is equal to the
> invocation list of `source`

**Remove the last one and it's `null` again.** A delegate down to zero isn't "an
empty state," it's `null`. So a call after all subscribers have left falls into
the same exception.

The invocation form Microsoft's docs recommend in the `event` reference is exactly
this.

> ```csharp
> // Raise the event in a thread-safe manner using the ?. operator.
> SampleEvent?.Invoke(this, new SampleEventArgs("Hello"));
> ```

`?.Invoke()`. The comment states the reason too — it also covers a subscriber
leaving between the null check and the call.

One thing is worth separating here. **This blog has said not to use `?.`.** In
[the post on Fake Null](/posts/unity-fake-null/) we saw that a Unity object keeps
its managed reference after being destroyed, so `?.` doesn't filter that state out.

| Target | `?.` |
| --- | --- |
| `MonoBehaviour`, `GameObject`, any `UnityEngine.Object` | **Don't.** It passes `?.` even when destroyed |
| `Action`, `event`, ordinary C# objects | **Do.** It's the form Microsoft's docs recommend |

**The rule depends on the type.** A delegate is an ordinary C# object that doesn't
ride Unity's fake-null rule, so there's no reason to hand-write `== null`.

## `event` Blocks More Than Invocation

The clipping's `event` section is accurate.

> 하지만 event 키워드를 추가하면 외부에서 접근이 불가능하다. … 아래와 같이
> 등록은 가능하지만 실행은 오직 ActionCube에서만 가능하다.
>
> (But adding the event keyword makes it inaccessible from outside. … Registering
> is possible as below, but invoking is only possible from ActionCube.)

The C# docs draw the same line.

> Events are multicast delegates that you can **only invoke from within the
> class** (or derived classes) or struct where you declare them (the publisher
> class).

> Event users can **add or remove** their event handlers on an event.

From outside, `+=` and `-=` are all there is. But **what gets blocked isn't just
invocation.** Counting what outside code could do when it was a `public Action`:

| From outside | `public Action` | `public event Action` |
| --- | --- | --- |
| `+=` register | Yes | Yes |
| `-=` unregister | Yes | Yes |
| Invoke | **Yes** | No |
| Assign `= null` | **Yes** | No |
| Overwrite with another delegate | **Yes** | No |

**The fourth row is the quiet one.** One line of `ac.gameOverEvent = null;` and
every registered subscriber is gone. Code that never invokes but only assigns kills
the event with no error and no log. The compile error the clipping shows is about
invocation; adding `event` blocks this assignment along with it.

So a public delegate should almost always carry `event`. The only reason not to is
**when you need to clear it all with `= null`** — and that's usually a sign the
design is wrong.

## A Subscription Needs a Teardown

The clipping's second script.

```csharp
public class ActionSphere : MonoBehaviour
{
    public ActionCube ac;

    void Start()
    {
        ac.gameOverEvent += gameOverSphere;
    }
}
```

**Registration with no teardown.** Fine as an example, but a direction is hidden in
it. The moment you register, **the cube references the sphere.** Not the other way
around.

So when the sphere is destroyed, that entry stays in the cube's invocation list. An
entry holds onto its target object, so **the managed object isn't reclaimed** and
the next call runs a method on a destroyed component. Touch the Unity side in there
and it throws — same root as the fake null above.

In [the post on subscribing to InputAction directly](/posts/input-action-subscribe/)
I covered why registration and teardown go in pairs. There it was **subscribing to
one's own action**; here it's **putting my method into someone else's delegate.**
The latter is riskier, because the lifetime isn't in my hands.

The place to pair them is `OnEnable` / `OnDisable`.

```csharp
using UnityEngine;

public class ActionSphere : MonoBehaviour
{
    [Header("Publisher")]
    [SerializeField, Tooltip("The cube that owns the event")]
    private ActionCube _cube;

    private void OnEnable()
    {
        // A Unity object, so check with == null rather than ?.
        if (_cube == null)
        {
            return;
        }

        _cube.GameOver += OnGameOver;
    }

    private void OnDisable()
    {
        if (_cube == null)
        {
            return;
        }

        // As many teardowns as there were registrations.
        _cube.GameOver -= OnGameOver;
    }

    private void OnGameOver()
    {
        Debug.Log("GameOverSphere!!", this);
    }
}
```

There's a reason this uses `OnEnable`/`OnDisable` and not `Start`/`OnDestroy`. The
docs pin down how many times `Start` runs.

> Start is called **exactly once in the lifetime of the script** and always
> after MonoBehaviour.Awake.

`OnEnable` is different.

> When **activating the GameObject** (or one of its inactive parent GameObjects)
> at runtime, if the script component is already enabled.

**`Start` is once per lifetime; `OnEnable` is every activation.** An object pool
deactivates rather than destroys, so registering in `Start` and tearing down only
in `OnDestroy` means **the subscription stays alive while the object sits in the
pool.** A delegate invocation doesn't look at `activeInHierarchy` or `enabled`. So
the handler of an enemy resting in the pool runs anyway.
[The post on object pooling](/posts/unity-object-pooling/) had the same shape —
**"deactivating isn't destroying."**

## Where and Why You'd Use It

### One global event hub

The clipping's approach of **wiring another object through the Inspector** has two
problems. Break the reference and it silently does nothing, and once the scene
grows you can't trace who references whom. Gathering publishers in one place
removes both.

```csharp
using System;

/// Game-wide events. Only this class raises them.
public static class GameEvents
{
    // event blocks outside invocation and assignment.
    public static event Action GameOver;
    public static event Action<string> GameOverMessage;
    public static event Action<int> ScoreChanged;

    public static void RaiseGameOver()
    {
        // Null when there are no subscribers. Call it with ?.Invoke().
        GameOver?.Invoke();
    }

    public static void RaiseGameOverMessage(string message)
    {
        GameOverMessage?.Invoke(message);
    }

    public static void RaiseScoreChanged(int score)
    {
        ScoreChanged?.Invoke(score);
    }
}
```

`static event` carries one trap. **The list isn't cleared when you change scenes.**
Miss a teardown and the subscription follows into the next scene, where the method
of a destroyed object gets called. So anyone using a global hub has to hold the
`OnEnable`/`OnDisable` pairing more strictly.

The subscribing side looks like this. It's the clipping's cube-and-sphere example
moved into the same shape.

```csharp
using UnityEngine;

[RequireComponent(typeof(Collider))]
public class ActionCube : MonoBehaviour
{
    private const int GAME_OVER_SCORE = 100;

    [Header("Message")]
    [SerializeField, Tooltip("Message to send on click")]
    private string _message = "Action<string>!!";

    private void OnEnable()
    {
        GameEvents.GameOver += OnGameOver;
        GameEvents.GameOverMessage += OnGameOverMessage;
    }

    private void OnDisable()
    {
        GameEvents.GameOver -= OnGameOver;
        GameEvents.GameOverMessage -= OnGameOverMessage;
    }

    // OnMouseDown needs a Collider. RequireComponent ties that down.
    private void OnMouseDown()
    {
        GameEvents.RaiseGameOver();
        GameEvents.RaiseGameOverMessage(_message);
        GameEvents.RaiseScoreChanged(GAME_OVER_SCORE);
    }

    private void OnGameOver()
    {
        Debug.Log("Cube Game Over", this);
    }

    // No lambda wrapper. With a matching Action<string>, the method goes in by name.
    private void OnGameOverMessage(string message)
    {
        Debug.Log($"Game Over : {message}", this);
    }
}
```

Where the clipping wrote `stringEvent += (str) => gameOverMessage(str);`, this uses
the method name. **When the parameter count and types match, the lambda isn't
needed**, and dropping the lambda makes teardown just work. The problem the first
section pointed at disappears here.

### What I changed from the original

| Original | Changed to | Why |
| --- | --- | --- |
| `public Action gameOverEvent;` | `public static event Action GameOver;` | Blocks outside invocation and `= null` assignment |
| `void gameOver()` | `private void OnGameOver()` | Convention. PascalCase methods, explicit access modifier |
| `gameOverEvent();` | `GameOver?.Invoke();` | It's `null` when there are no subscribers |
| `stringEvent += (str) => gameOverMessage(str);` | `GameOverMessage += OnGameOverMessage;` | The signature matches, so the lambda is unnecessary and teardown becomes possible |
| Registering only in `Start` | `OnEnable` / `OnDisable` pair | Prevents duplicates and leaks under pooling and scene changes |
| `public ActionCube ac;` | `[SerializeField] private ActionCube _cube;` | Convention. A serialized field instead of a public one |

The example that writes `gameOverEvent += gameOver;` three times is **deliberate,
to show the behavior**, so it isn't something to fix. If the same shape showed up
in production code, it's likely the result of registrations accumulating through
pooling or scene changes.

### Where Not to Use It

- **Memorizing "anonymous functions can't be removed."** Store it in a variable and
  it removes. What blocks it is not holding the same instance.
- **Using one `-=` to clean duplicates.** Only the last one goes. Every
  registration has to take the same path for the count to stay at 1.
- **Wrapping a value-returning method in a lambda for an event.** It compiles and
  the value is discarded. If you need the result it's `Func<T>`, or it isn't an
  event's place.
- **Calling an `Action` without `?.`.** With no subscribers, or after they all
  leave, it's `null`.
- **Hand-writing `== null` for a delegate.** It isn't a Unity object, so `?.` works
  properly. Conversely, don't use `?.` on Unity objects.
- **Exposing a `public Action` as-is.** One `= null` wipes everything. Add `event`.
- **Registering in `Start` and tearing down only in `OnDestroy`.** Pooling
  deactivates rather than destroys. `OnEnable`/`OnDisable` is the pair.

## Wrapping Up

- **It isn't anonymity that blocks removal.** `Delegate.Equals` looks at "the same
  method on the same object," and two separately written lambdas compile into
  different methods. **Store it in a variable and it removes.**
- **`-=` removes only the last one.** The docs say "the last occurrence is
  removed." So "remove then re-add" doesn't eliminate duplicates — it **keeps the
  count.** It only does what you meant at 0 and 1.
- **"Void only" is the rule for putting a name in directly.** The C# standard
  allows an expression-bodied lambda under the statement-expression condition, so
  wrapped in a lambda a value-returning method goes in and the value is discarded.
- **With no subscribers it's `null`.** Removing the last one makes it `null` again,
  and the invocation form Microsoft's docs recommend is `?.Invoke()`.
- **The `?.` rule depends on the type.** Don't on Unity objects; do on delegates.
  The two rules point opposite ways.
- **`event` blocks more than invocation.** It blocks `= null` assignment too, and
  that's the path that breaks more quietly.
- **Registering makes the publisher reference the subscriber.** The direction is
  reversed, so a missed teardown leaves a destroyed object in the invocation list.
  The pair is `OnEnable`/`OnDisable`.

---

### References

- [Action delegate — .NET API reference](https://learn.microsoft.com/en-us/dotnet/api/system.action)
- [Delegate.Remove — .NET API reference](https://learn.microsoft.com/en-us/dotnet/api/system.delegate.remove) ·
  [Delegate.Equals](https://learn.microsoft.com/en-us/dotnet/api/system.delegate.equals)
- [The event keyword — C# reference](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/event)
- [Lambda expressions — C# reference](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/lambda-expressions)
- [Anonymous function conversions — C# standard §10.7.1](https://github.com/dotnet/csharpstandard/blob/draft-v8/standard/conversions.md)
- [Delegate.GetInvocationList — .NET API reference](https://learn.microsoft.com/en-us/dotnet/api/system.delegate.getinvocationlist)
- [MonoBehaviour.Start — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/MonoBehaviour.Start.html) ·
  [MonoBehaviour.OnEnable](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/MonoBehaviour.OnEnable.html) ·
  [MonoBehaviour.OnMouseDown](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/MonoBehaviour.OnMouseDown.html)

The starting point for this post was
[피로물든딸기 — 유니티 - Action으로 이벤트 등록하기](https://bloodstrawberry.tistory.com/890)
(2022-07-29). I cross-checked the example's behavior descriptions against the .NET
API reference and the C# standard, and rewrote the places where the reason behind
removal, duplication and null handling was obscured. Subscription lifetime on the
input side is in
[the post on subscribing to InputAction](/posts/input-action-subscribe/), and
callback registration on the generated class is in
[the post on Generate C# Class](/posts/input-generated-class/). Crossing assembly
boundaries with events is in
[the post on assembly definition files](/posts/assembly-definition-files/).
