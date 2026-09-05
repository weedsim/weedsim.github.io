---
pubDatetime: 2026-09-05T17:00:00+09:00
title: "Subscribing to InputAction Directly: The Lifetime of Delegate-Based Input"
lang: en
translationKey: input-action-subscribe
featured: false
draft: false
tags:
  - Unity
  - Input System
  - Input
  - C#
description: "Handling input by subscribing to InputAction in code instead of using PlayerInput's Behavior. Why subscribe and unsubscribe belong in a pair, who actually enables the action, and what looking actions up by string costs you."
---

I'd clipped a [post](https://22joon.tistory.com/27) on subscribing to
`InputAction` directly in code while using the Input System. It pastes in the
actual code from a practice project, which gets the idea across faster than the
documentation does.

Writing up the [PlayerInput component](/en/posts/unity-playerinput/) earlier, I
covered how the inspector's `Behavior` value changes the method signature you
have to write. This post uses none of those four. **`PlayerInput` stays purely
for the action asset and device management, and handling is done with C# events
directly.** It's a common combination in practice, which makes it worth its own
write-up.

## Table of contents

## What this approach is

Two lines are the core of it.

```csharp
public PlayerInput input;
private InputAction _normalMoveAction;

private void Awake()
{
    this._normalMoveAction = this.input.actions["Move"];
}
```

Pull an `InputAction` by name out of the `InputActionAsset` that `PlayerInput`
holds, and cache it in a field. From there you attach to that action directly,
without going through `PlayerInput`.

```csharp
private void OnEnable()
{
    this._normalMoveAction.performed += this.OnMove;
    this._normalMoveAction.canceled += this.StopMove;
}

private void OnDisable()
{
    this._normalMoveAction.performed -= this.OnMove;
    this._normalMoveAction.canceled -= this.StopMove;
}
```

Set `Behavior` to `Invoke C# Events` and every action arrives through the
single `onActionTriggered`, leaving you to dispatch inside it. This approach
lets you **attach per action.** Nor is it string matching on method names the
way `Send Messages` is. It does use a string once, when pulling the action out —
more on that below.

## Subscribe and unsubscribe as a pair

The line the original adds after the code is the most important part of it.

> 결국 InputAction또한 Delegate 기반이니, Scene 전환 등의 이유로 오브젝트가
> 파괴될 때, Delegate 등록을 반드시 해제하게 만드는 것이 좋다.
>
> (An InputAction is delegate-based too, so when an object is destroyed — on a
> scene change, say — you should make sure the delegate registration is
> removed.)

Correct, and the code does exactly that. To expand on why it matters:

**An `InputAction` outlives the object.** The action asset doesn't belong to a
scene, so changing scenes destroys `PlayerController` while the action object
itself remains. If that action's delegate still holds a method from a destroyed
object, the next input throws `MissingReferenceException` — or worse, the
destroyed object stays reachable and never gets collected.

**Choosing the `OnEnable`/`OnDisable` pair is deliberate too.**

- An `Awake`/`OnDestroy` pair keeps the subscription alive while the object is
  disabled. That's where "I disabled the player to open a UI and input kept
  coming through" comes from.
- `OnEnable`/`OnDisable` keeps the active state and the subscription state in
  lockstep. Object pooling that toggles objects on and off just works.

Caching in `Awake` and subscribing in `OnEnable` is a natural split, since
`Awake` runs once and `OnEnable` runs every time the object is switched on.

## Who enables the action?

This is where people get stuck moving to this approach. **An `InputAction` is
disabled by default.** From the documentation:

> For actions defined elsewhere, such as in an Action Asset not assigned as
> project-wide, or defined your own code, they begin in a disabled state, and
> you must enable them before they will respond to input.

The reason the original's code works without an `Enable()` call is that
**`PlayerInput` enables the action map for it.** Remove the `PlayerInput`
component and the same code goes quiet. The subscription is still perfectly
attached; the action is off, so no callback fires.

Holding the action asset yourself, without `PlayerInput`, you enable it like
this:

```csharp
_normalMoveAction.Enable();      // a single action
// or
_gameplayActionMap.Enable();     // the whole map
```

There's one exception. **An asset assigned as project-wide actions is enabled
by default.**

> If you have an Action Asset assigned as project-wide, the actions it contain
> are enabled by default and ready to use.

So responsibility for "is the action enabled" sits with one of three things:
`PlayerInput`, the project-wide actions setting, or your own code. **When input
doesn't respond, checking this before the subscription is faster.**

## When started / performed / canceled fire

The original mentions being tripped up by Interactions and links a forum
thread. Pinning this down also explains why the code above uses only
`performed` and `canceled`.

An action has three callbacks.

```csharp
action.started   += ctx => { };  // Action was started
action.performed += ctx => { };  // Action was performed
action.canceled  += ctx => { };  // Action was canceled
```

When each fires depends on the **Action Type**.

- **Value** — continuously monitors the bound controls and fires a callback
  **whenever the value changes.** On enabling it performs an initial state
  check, so a control already actuated triggers a callback then too.
- **Button** — like Value but binds only to `ButtonControl`. And it **doesn't
  perform the initial state check**, to avoid firing because a button was
  already held.
- **Pass Through** — bypasses conflict resolution and fires for any change on
  any bound control.

A Move action built from WASD as a Vector2 composite is usually **Value**. So
`performed` arrives every time the value changes while keys are held, and
`canceled` arrives once everything is released and the value returns to its
default. **The original's structure — take the direction in `performed`, reset
to zero in `canceled` — matches that property exactly.**

It's also why `canceled` is confusing. It doesn't mean "released" the way a
button would; it means **"the action returned to its default state"**, and what
that amounts to depends on the Action Type.

## The cost of finding actions by string

```csharp
this._normalMoveAction = this.input.actions["Move"];
```

Simple and it works, but that line has **no compile-time verification.** Rename
the action from `Move` to `Movement`, or make a typo, and it compiles fine and
blows up at runtime. In the earlier PlayerInput post I noted that
`Send Messages` looks methods up by name and fails silently; this is the same
shape of problem.

The Input System has an answer for it. Tick **Generate C# Class** in the action
asset's inspector and it produces a wrapper class. The documentation's wording:

> allow you to refer to your actions in a type-safe manner from code. This
> means you can avoid looking up your actions by string.

It's used like this:

```csharp
private MyPlayerControls _controls;

private void Awake()
{
    _controls = new MyPlayerControls();
}

private void OnEnable()
{
    _controls.gameplay.Enable();
    _controls.gameplay.SetCallbacks(this);   // all of them via an interface
}
```

Action names become properties, so renaming one produces a compile error. And
`Enable()` is called explicitly here, which makes the "who enables it" problem
from the previous section disappear as well. **Past a handful of actions, this
is the way to go.**

## If you need the value every frame, you may not need a subscription

The original's code stores the value from the callback into `moveVec` and uses
it in `MovePlayer()` from `Update`. For a value needed every frame, like
movement, that's the right pattern.

For that purpose, though, there's a shorter route. The documentation offers
polling as the alternative to callbacks.

```csharp
private void Update()
{
    Vector2 moveValue = _normalMoveAction.ReadValue<Vector2>();
    // ...
}
```

This removes the `performed`/`canceled` subscribe-and-unsubscribe entirely, and
the return-to-zero handles itself. Conversely, actions that need to respond **at
a moment** — jump, fire — can miss a frame if polled, so callbacks are right
there.

Which splits as:

- **Continuous values** (movement, look) → `ReadValue` in `Update`
- **Momentary events** (jump, fire, interact) → subscribe to
  `started`/`performed`

The original's approach — take it in a callback, store it, use it in `Update` —
is valid too. When you want to catch a value changing several times within one
frame, it's actually the better one.

## What stands out in the example code

Because the original pastes in real project code, there are a couple more
things to see.

**The order of the singleton check.** `Awake` runs like this:

```csharp
private void Awake()
{
    this._normalMoveAction = this.input.actions["Move"];
    Init();
    if (Inst != null && Inst != this)
    {
        Destroy(gameObject);
        return;
    }
    Inst = this;
}
```

The duplicate instance caches the action and runs `Init()` before being
destroyed. `Destroy` is processed at the end of the frame, so `OnEnable` runs
in between and the subscription gets attached. It's unsubscribed by `OnDisable`
on destruction, so it balances out — but **putting the duplicate check first
means that path never exists.**

**This line in `MovePlayer()`** doesn't compile as written.

```csharp
this.sprite.transform.position += moveSpeedMultiplier * Time.deltaTime;
```

It adds a `float` to a `Vector3`, and the `moveVec` and `moveSpeed` the
callback set up go unused. Something appears to have been lost in
transcription; the code block also ends without the class's closing brace. **Read
it for the structure, don't copy it verbatim.**

## From 1.0 to now

The official documentation the original links is for Input System **1.0.2**.
The current release is **1.16.0**, and one change in between affects this
approach.

**Project-wide actions** now exist. Assign one asset as project-wide and you
reach it through the API without carrying a reference, already enabled.

```csharp
InputSystem.actions.FindAction("Move");
```

So writing this code today, there are three options:

- **`PlayerInput.actions["Move"]`** — the original's approach. Still the one if
  you need local multiplayer or device pairing.
- **Generated C# class** — when there are many actions and type safety matters.
- **Project-wide actions** — the default workflow for a single-player project.

## Summary

- Instead of `PlayerInput`'s `Behavior`, pull an `InputAction` out with
  `actions["name"]` and subscribe with C# events. Attaching per action is the
  advantage.
- **Subscribe and unsubscribe as a pair** is the heart of this approach,
  because the action outlives the object. `OnEnable`/`OnDisable` keeps the
  active state and the subscription in lockstep.
- **Actions are disabled by default.** The original's code runs without
  `Enable()` because `PlayerInput` enables it; remove the component and it goes
  quiet. Project-wide actions are the exception.
- **Action Type** determines when `started`/`performed`/`canceled` arrive. Value
  does an initial state check, Button doesn't. Move being Value is why
  `performed` + `canceled` is the right pairing.
- `actions["Move"]` has no compile-time verification. **Generate C# Class**
  gives you type safety, and makes `Enable()` explicit as a bonus.
- Continuous values want `ReadValue` in `Update`; momentary events want
  callbacks. Depending on the purpose you may not need a subscription at all.

## References

- [Responding to actions — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/RespondingToActions.html)
- [Actions — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/Actions.html)
- [Input Action Assets — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/ActionAssets.html)
- [Project-wide actions — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/ProjectWideActions.html)
- Original (Korean): [Input System](https://22joon.tistory.com/27)
