---
pubDatetime: 2026-10-08T17:10:00+09:00
title: "What Sits Between started and performed Is the Press Threshold"
lang: en
translationKey: input-action-phases
featured: false
draft: false
tags:
  - Unity
  - Input System
  - Input
  - C#
description: "The author of an Input System walkthrough left a question unanswered: why do started and performed behave identically? The answer isn't a frame, it's two thresholds — and the page that documents them contradicts itself in the same entry."
---

Continuing from the earlier Input System posts, I'd **clipped this one while
reading further around the same topic.** It's a 2023 community walkthrough:
create the Input Action asset, pull a wrapper out with **Generate C# Class**,
wrap that in a `GameInput` class and have the player subscribe to it, all
followed along in screenshots. The procedure itself still holds up.

Partway through, though, the author writes this and moves on. My translation
from the Korean:

> I don't think there's any difference between Start and Perform. Both act
> like GetKeyDown and I don't know what the difference is.

Two commenters join in. One answers that "a keyboard key only has press and
release, so performed and started are the same thing," and another says they'd
hit the same wall the day before. Their line, translated:

> With no interaction set at all, Canceled is not GetKeyUp.

Three people stuck at the same spot, and none of them found which line of the
documentation explains it.

That line exists. And the answer is **two thresholds, not a frame.** What
separates a Button action's `started` from its `performed` is the **press
threshold**; what decides `canceled` is the **release threshold**. Both why
they look identical on a keyboard key and why they don't on a gamepad trigger
come out of that.

Four things checked out. **The press threshold is what separates started from
performed**, **`canceled` comes from the release threshold rather than from
zero**, **the `InputActionPhase` page says both that `Started` is used and
that it isn't**, and **attaching a Press interaction removes `canceled`
entirely**.

This blog already has three Input System posts.
[The PlayerInput component's Behavior](/en/posts/unity-playerinput/) covered
which Behavior demands which code,
[Subscribing to InputAction directly](/en/posts/input-action-subscribe/)
covered the lifetime of subscribe and unsubscribe, and
[Generate C# Class](/en/posts/input-generated-class/) covered the generated
class's `SetCallbacks`. This post is one layer underneath them — **the phase
machine that decides when the three callbacks fire, and the numbers that drive
it.** It doesn't hand anything off, though. Every explanation and every code
sample it needs is reproduced here in full.

Checked on **2026-10-08** against Input System **1.20**.

## Table of contents

## The three callbacks are phases, not an order

Terminology first. `started`, `performed` and `canceled` are not "the callback
that comes first / the callback that comes later." They are callbacks attached
to the **phases** an action passes through.

```csharp
action.started   += ctx => { };
action.performed += ctx => { };
action.canceled  += ctx => { };
```

The phases are the `InputActionPhase` enum. The scripting reference describes
each value. This is `Waiting`.

> The action is enabled and waiting for input on its associated controls.

And the same page goes on:

> This is the phase that an action goes back to once it has been Performed or
> Canceled.

So the phases are not a straight line, they're a **loop.** Out of `Waiting`,
through `Started`, into `Performed` or `Canceled`, and back to `Waiting`. One
press and release goes around that loop once.

Which phases you get is decided by the **Action Type**. The behavior when no
interaction is attached is what the docs call the "default interaction," and
it now has a page of its own.

> Different Action types have different default Interactions.

Here are the three types in that page's own wording.

| Action Type | `started` | `performed` | `canceled` |
| --- | --- | --- | --- |
| Value | "Control(s) changed value away from the default value." | "Control(s) changed value." | "Control(s) are no longer actuated." |
| Button | "Button started being pressed but has not necessarily crossed the press threshold yet." | "Button was pressed to at least the button press threshold." | "Button was released." |
| Pass Through | "not used" | "Control changed value." | "Action is disabled." |

Read the first cell of the Button row again. `started` is documented as **"the
button started being pressed, which does not necessarily mean the press
threshold was crossed."** The answer the author was looking for sits inside
that one cell.

## The press threshold separates a Button's started from its performed

For a Button action the two callbacks split like this.

- `started` — when the control **moves away from its default value**
- `performed` — when the control **reaches the press threshold**

That is exactly what the docs put in the `performed` cell.

> Button was pressed to at least the button press threshold.

The threshold comes from the settings.

> The default value of the button press threshold is defined in the input
> settings.

> However, an individual control can override this value.

The settings default is in the scripting reference, on `InputSettings`, as
`defaultButtonPressPoint`.

> The default value threshold for when a button is considered pressed.

> The default value is 0.5.

**0.5.** Which explains what the author observed. A keyboard key is either
pressed or it isn't, and its value goes from 0 to 1 **in one step.** "Moved
away from its default value" and "crossed 0.5" happen **inside the same input
event.** That's why `started` and `performed` land on the same frame.

The commenter who said "a keyboard key only has press and release" had the
right instinct. The reason is more precisely **"there is no intermediate step
that passes through 0.5 on the way from 0 to 1"** than it is "a keyboard has
two states." The difference shows up on an analog control.

Pull a gamepad trigger slowly and the value climbs 0 → 0.1 → 0.3 → 0.5 → 0.8.
Now you get

- `started` at 0.1
- `performed` the moment it crosses 0.5

— **the two callbacks on different frames.** Same code, same action, and the
timing splits by device. That's the path by which code tested only on a
keyboard, and concluded "the two are identical," comes apart on a pad.

A Value action is different again. The scripting reference nails it down in
the `Started` entry.

> For Value actions, Started will immediately be followed by Performed.

Value doesn't wait for a threshold. `started` and `performed` arrive together
the moment the control leaves its default value. And Pass Through doesn't use
`Started` at all.

> PassThrough does not use the Started phase and instead goes straight to
> Performed.

The original's Walk action was a Button, so the press-threshold explanation is
the one that applies to it.

## canceled comes from the release threshold, not from zero

The second commenter's claim was that, with no interaction set, `canceled`
isn't `GetKeyUp`. As a conclusion, correct. The reason the docs give is
elsewhere, though. The Button row's `canceled` cell is short.

> Button was released.

But the definition of that "released" follows right after.

> If the button was pressed above the press threshold, the button has now
> fallen to or below the release threshold.

There is **a second threshold**: `InputSettings.buttonReleaseThreshold`.

> The percentage of defaultButtonPressPoint at which a button that was pressed
> is considered released again.

> This is a percentage rather than a fixed value.

The word that matters is **percentage**. This is not an absolute value, it's a
proportion of the press threshold. With a press threshold of 0.5 and a release
threshold of some ratio r, the button counts as released when it falls to
**`0.5 × r`, not to 0.** Ease off an analog trigger slightly, without letting
go, and `canceled` can fire.

The default for that ratio is **not stated on the `InputSettings` page.** I'm
not going to guess the number. Read it off the Input System package settings
in Project Settings if you need it.

One more API stands on the same two thresholds — the one the original used
when it wrote that Press "has no event of its own, just an `IsPressed()`
function." Here is the scripting reference on it.

> Check whether the current actuation of the action has crossed the press
> threshold

> has not yet fallen back below the release threshold

`IsPressed()` asks **"has it crossed the press threshold and not yet fallen
back below the release threshold?"** The two numbers that separate `performed`
from `canceled` *are* this function's definition. The same page adds:

> The same press threshold rules apply to APIs such as

The list that follows names `WasPressedThisFrame()` and
`WasReleasedThisFrame()`. The whole polling surface sits on the same rules.

For reference, the `triggered` property is in the same family.

> Equivalent to WasPerformedThisFrame().

And `WasCompletedThisFrame()` looks at the phase transition directly.

> Check whether phase transitioned from Performed to any other phase value at
> least once in the current frame.

## The same page says started is used, and that it isn't

Here the documentation tangles. The `Started` entry of `InputActionPhase`
contains this sentence.

> This phase will only be invoked if there are interactions on the respective
> control binding.

That says the `Started` phase is **never invoked** without interactions. The
next line makes the same claim.

> Without any interactions, an action will go straight from Waiting into
> Performed and back into Waiting

If that were true, the original's author should have seen the function
registered on `started` never fire once. Instead the author saw **both**
`started` and `performed` fire, and wrote that there seemed to be no
difference.

Read further down the same page and it says the opposite.

> By default, an action is started as soon as a control moves away from its
> default value.

And for Button actions it adds:

> which, however, does not yet have to mean that the button press threshold
> has been reached

**The same entry on the same page disagrees with itself.** The top says "no
`Started` without interactions"; the bottom says "by default an action is
started as soon as a control moves away from its default value."

The manual settles it. The Button row on the default-interaction page does
**not** leave the `started` cell empty. It states a trigger condition, and
that condition is "moved away from the default value." The Value row does the
same, and the only type that genuinely skips `started` is Pass Through, marked
"not used." This is also the side that matches what the author observed.

So **the later sentence is right and the two earlier ones are wrong.** It's no
surprise three people got stuck in the same place: open the scripting
reference looking for the answer, and the first thing you meet is "started
isn't invoked without interactions."

The manual's prose isn't entirely clean either. The interactions introduction
page puts it this way.

> a button action's default interaction is to immediately perform the action
> when the button is pressed.

"Immediately" is true on a keyboard and loose on an analog trigger. The next
sentence on the same page also carries a typo.

> An action with no explicit interaction applied behaves according the default
> interaction for its action type.

There's a missing `to` after `according`. As of 2026-10-08 it's still in the
1.20 docs.

## Attaching a Press interaction removes canceled

"started and performed are confusing, so let's attach an interaction and make
it explicit" — go that way and there's a trap.

Interactions can go on a binding or on the action as a whole.

> Applying Interactions directly to an Action is equivalent to applying them
> to all bindings for the Action.

If you've done both, the order is fixed.

> This means that the Input System applies the binding's Interactions first,
> and then the Action's Interactions.

The problem is the **Press interaction's defaults.** The built-in interactions
page lists two parameters.

| Parameter | Type | Default |
| --- | --- | --- |
| `pressPoint` | `float` | `InputSettings.defaultButtonPressPoint` |
| `behavior` | `PressBehavior` | `PressOnly` |

And the trigger conditions per `behavior` value:

| behavior | `started` | `performed` | `canceled` |
| --- | --- | --- | --- |
| `PressOnly` (default) | "Control magnitude crosses pressPoint" | "Control magnitude crosses pressPoint" | "not used" |
| `ReleaseOnly` | "Control magnitude crosses pressPoint" | "Control magnitude goes back below pressPoint" | "not used" |
| `PressAndRelease` | "Control magnitude crosses pressPoint" | "Control magnitude crosses pressPoint" or "Control magnitude goes back below pressPoint" | "not used" |

All three rows have `canceled` as **"not used."** Add a Press interaction
without knowing that, and the "on release" logic you'd been handling in
`canceled` **dies quietly.** No compile error, no warning. The subscription is
still there; the delegate just never fires again.

And under `PressOnly`, `started` and `performed` have **literally the same
trigger condition.** Even the gap the threshold had opened between them closes
to zero. The attempt to make things explicit ends up gluing the two callbacks
together.

One more sentence from the original gets corrected here. It described Press
this way, in my translation:

> This one has no event of its own — there's an IsPressed() function ready for
> it, so you just return it from GameInput.

"No event of its own" is wrong. **`ReleaseOnly` is that event.** Its
`performed` comes from "Control magnitude goes back below pressPoint," so if
you want the release moment as an event, that's the one. `PressAndRelease`
raises `performed` on both press and release — but then two events arrive
through one `performed`, so if you have to tell them apart you need
`IsPressed()` or the value alongside it.

The Hold interaction is in the same table, and putting it next to Press shows
why the phase is called `Canceled` at all. This is Hold's `performed`.

> Control magnitude held above pressPoint for >= duration.

And its `canceled`:

> Control magnitude goes back below pressPoint before duration (that is, the
> button was not held long enough)

It means **"it did not succeed."** The default for `duration` is
`InputSettings.defaultHoldTime`, and the reference gives the number.

> The default hold time is 0.4 seconds.

`canceled` reading as "released" on a Button is a special case limited to the
default interaction. The reason the phase is named `Canceled` lives on the
Hold side.

## You may not need NormalizeVector2 on top

Setting up the move action, the original explains Processors like this. My
translation:

> We only need the direction, so if you set normalized the value comes out
> already normalized and you don't have to do it in the script.

Two things to point at.

First, **there is no processor named `normalized`.** The built-in processor
list has two with similar names, and their operand types differ.

| Display name | Operand | What it does |
| --- | --- | --- |
| `Normalize` | `float` | "Normalizes input values in the range [`min`..`max`] to unsigned normalized form [0..1] if `min` is >= `zero`," |
| `NormalizeVector2` | `Vector2` | "Normalizes input vectors to be of unit length (1). This is the same as calling `Vector2.normalized`." |

`Normalize` takes `min`, `max` and `zero` parameters and is a **range
remapping**; the one that makes a vector unit length is `NormalizeVector2`.
Try to put `Normalize` on a Vector2 action and it won't even be in the list.

Second, in the original's setup **that processor may not be needed at all.**
The original bound "up down left right," which is the 2D Vector composite, and
that composite has a `mode` field.

> Determines how X and Y of the resulting `Vector2` are formed from input
> values.

Here is the comment the scripting reference's code sample attaches to
`mode = 0`:

> DigitalNormalized composite (the default)

And what that mode does:

> will return a normalized direction vector

**The default mode already normalizes.** Putting `NormalizeVector2` on a
WASD composite takes a vector that is already length 1 and makes it length 1
again. Not a wrong setting, just one that does nothing.

There is a case where the processor earns its place: an analog control bound
**directly, without going through a composite**, such as a gamepad stick. A
stick emits vectors of arbitrary length inside a circular range, so there
`NormalizeVector2` really does clamp the length to 1. If you've bound both a
WASD composite and a stick to the same action, only the stick side comes
through at a length other than 1 — which makes **putting
`NormalizeVector2` at the action level to even the two out** a meaningful
choice.

## Don't carry the context outside the callback

One symptom from the comments is left. Translated:

> It isn't true only at the moment of release — while it stays released it
> keeps coming back true.

The original author replied that "it's event-shaped, so you'll only get the
moment of release," and that reply is right. Why the difference exists,
though, is written in the `CallbackContext` reference.

> You should not use or keep this struct outside of the callback.

And the `phase` property's description is decisive.

> Current phase of the action. Equivalent to accessing phase on action.

`context.phase` is **not a snapshot taken at callback time.** It reads the
action's `phase` straight through. The `started`, `performed` and `canceled`
properties are each described only as "whether the action has just been
started / performed / canceled" — the docs promise nothing about their values
after the callback has returned. Which is why the line about not keeping the
struct outside the callback is there.

Let me draw the line clearly here. **Exactly what code produced that symptom
cannot be established from the documentation.** There's no code in the
comment. Two things can be said from the docs: reading `ctx.canceled` inside
the callback means "it was just canceled," and storing the `context` to read
later is **a usage the docs tell you not to do.** A value that reads as
"always true" comes easily out of the latter.

The safe shapes split in two.

- **Momentary events** — handle them in the callback. A function registered
  on `canceled` fires once, at release.
- **Continuous state** — ask the action directly in `Update`, with
  `IsPressed()` or `ReadValue`. Don't carry the `context` around.

## Where and why you'd use it

### A working example

Same structure as the original. A wrapper pulled out by **Generate C# Class**
is wrapped by `GameInput`, and the player subscribes only to `GameInput`'s
events.

The generated class's name **comes from the action asset's filename.** The
original left its asset named `PlayerInput`, which is **character for
character** the name of the component the Input System ships,
`UnityEngine.InputSystem.PlayerInput`. I didn't check here whether that breaks
compilation, so I won't claim it does. There is a reason the docs' examples
name assets things like `MyPlayerControls`, though, and the example below is
written as if the asset were named `PlayerControls`.

The collecting side first.

```csharp file="Scripts/Input/GameInput.cs"
using System;
using UnityEngine;
using UnityEngine.InputSystem;

public class GameInput : MonoBehaviour
{
    public event Action OnWalkStarted;
    public event Action OnWalkPerformed;
    public event Action OnWalkCanceled;

    private PlayerControls _controls;

    public Vector2 MoveDirection =>
        _controls.Player.Move.ReadValue<Vector2>();

    // Continuous state: ask the action. The press/release thresholds decide.
    public bool IsWalkPressed => _controls.Player.Walk.IsPressed();

    private void Awake()
    {
        _controls = new PlayerControls();
    }

    private void OnEnable()
    {
        _controls.Player.Enable();

        _controls.Player.Walk.started   += HandleWalkStarted;
        _controls.Player.Walk.performed += HandleWalkPerformed;
        _controls.Player.Walk.canceled  += HandleWalkCanceled;
    }

    private void OnDisable()
    {
        _controls.Player.Walk.started   -= HandleWalkStarted;
        _controls.Player.Walk.performed -= HandleWalkPerformed;
        _controls.Player.Walk.canceled  -= HandleWalkCanceled;

        _controls.Player.Disable();
    }

    private void OnDestroy()
    {
        _controls.Dispose();
    }

    // ctx is used only inside this method. It is never stored in a field.
    private void HandleWalkStarted(InputAction.CallbackContext ctx)
    {
        OnWalkStarted?.Invoke();
    }

    private void HandleWalkPerformed(InputAction.CallbackContext ctx)
    {
        OnWalkPerformed?.Invoke();
    }

    private void HandleWalkCanceled(InputAction.CallbackContext ctx)
    {
        OnWalkCanceled?.Invoke();
    }
}
```

The receiving side.

```csharp file="Scripts/Player/PlayerMover.cs"
using UnityEngine;

public class PlayerMover : MonoBehaviour
{
    private const float WalkSpeedMultiplier = 0.4f;

    [Header("References")]
    [SerializeField]
    private GameInput _gameInput;

    [Header("Movement")]
    [Tooltip("Distance travelled per second")]
    [SerializeField]
    private float _moveSpeed = 5f;

    private bool _isWalking;

    private void OnEnable()
    {
        if (_gameInput == null)
        {
            Debug.LogError($"{nameof(_gameInput)} is empty.", this);
            return;
        }

        _gameInput.OnWalkStarted   += HandleWalkStarted;
        _gameInput.OnWalkCanceled  += HandleWalkCanceled;
    }

    private void OnDisable()
    {
        if (_gameInput == null)
        {
            return;
        }

        _gameInput.OnWalkStarted   -= HandleWalkStarted;
        _gameInput.OnWalkCanceled  -= HandleWalkCanceled;
    }

    private void Update()
    {
        Vector2 direction = _gameInput.MoveDirection;
        float speed = _isWalking ? _moveSpeed * WalkSpeedMultiplier : _moveSpeed;

        Vector3 delta = new Vector3(direction.x, 0f, direction.y)
                        * (speed * Time.deltaTime);

        transform.Translate(delta, Space.World);
    }

    private void HandleWalkStarted()
    {
        _isWalking = true;
    }

    private void HandleWalkCanceled()
    {
        _isWalking = false;
    }
}
```

There's a reason `_gameInput` doesn't use `?.`. `GameInput` is a
`MonoBehaviour`, therefore a `UnityEngine.Object`, and a field left unassigned
in the inspector can end up in a state that **looks like null without being
C#'s null.** So the comparison is `== null`. On plain C# objects `?.` is the
right tool, and `OnWalkStarted?.Invoke()` inside `GameInput` above is that
case.

Note that only `started` and `canceled` are subscribed to. If you'll only ever
use a keyboard, switching to `performed` gives the same result. **But if a pad
trigger might get bound to the walk key, the two become different code.** Use
`started` if you want the walking state to begin the instant the press starts,
`performed` if it should begin only once the press has been judged real.

### How to choose

By event:

| What you want | What to use |
| --- | --- |
| The instant a press begins (before the threshold) | `started` |
| The instant the press is judged real | `performed` |
| The instant of release (Button, default interaction) | `canceled` |
| The release moment, stated as an interaction | Press interaction with `ReleaseOnly`, on `performed` |
| Is it pressed right now | `IsPressed()` |
| Was it performed this frame | `WasPerformedThisFrame()` or `triggered` |
| A value needed every frame (movement, etc.) | `ReadValue<Vector2>()` in `Update` |
| Press and hold | Hold interaction. Success is `performed`, giving up early is `canceled` |

Action Type splits like this.

- **Button** — input that needs threshold judgement. Jump, fire, a walk
  toggle. `started` and `performed` separate on analog controls.
- **Value** — input whose value keeps changing. Movement, aiming. `performed`
  follows `started` immediately, and comes again on every value change.
- **Pass Through** — when you want raw value changes with the middle
  processing skipped. No `started`.

### Where not to use it

- **Code that assumes `started` and `performed` are the same.** True only on a
  keyboard. It breaks the moment a pad binding is added.
- **Comments and variable names that equate `canceled` with `GetKeyUp`.**
  `canceled` means "returned to the default state," and on Hold it means "it
  failed." Name it `OnKeyUp` and the code becomes unreadable the day someone
  attaches a Hold.
- **Adding a Press interaction to an action with logic on `canceled`.** All
  three behaviors have `canceled` as "not used."
- **Storing a `CallbackContext` in a field.** The docs tell you not to. If you
  need continuous state, ask the action.
- **Docs that list `NormalizeVector2` on a 2D Vector composite as a required
  setting.** The default mode already normalizes.

## Summary

- `started`, `performed` and `canceled` are **callbacks attached to phases**,
  not a callback ordering. The phases form a loop out of `Waiting` and back
  into `Waiting`.
- On a Button action `started` comes when the control **leaves its default
  value** and `performed` when it **reaches the press threshold**. The default
  threshold is **0.5**.
- A keyboard key goes from 0 to 1 in one step, so the two land on the same
  frame. **On an analog trigger they separate.** That's what the author's "no
  difference" actually was.
- `canceled` is measured against the **release threshold**, not zero, and that
  is a **proportion** of the press threshold. The default proportion is not
  stated in the docs.
- `IsPressed()` is a function defined by those two thresholds.
  `WasPressedThisFrame()` and `WasReleasedThisFrame()` sit on the same rules.
- The `InputActionPhase` page **disagrees with itself inside one entry.** The
  earlier "no `Started` without interactions" sentence is wrong; the manual's
  default-interaction table is right.
- **All three Press behaviors have `canceled` as "not used."** Attach one to
  be explicit and your release handling dies quietly. For the release moment
  as an event, use `ReleaseOnly`'s `performed`.
- The 2D Vector composite's default mode is **DigitalNormalized** and already
  normalizes. `NormalizeVector2` earns its place on analog bindings that skip
  the composite, like a stick. `Normalize` is for `float` and is a different
  processor entirely.
- A `CallbackContext` **does not leave its callback.** `phase` is not a
  snapshot; it reads the action's current phase.

---

### References

- [Default interactions — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/manual/default-interactions.html)
- [Built-in interactions — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/manual/built-in-interactions.html)
- [Introduction to interactions — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/manual/introduction-interactions.html)
- [Apply interactions to actions — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/manual/apply-interactions-actions.html)
- [InputActionPhase — Input System API 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.InputActionPhase.html)
- [InputAction — Input System API 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.InputAction.html)
- [InputAction.CallbackContext — Input System API 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.InputAction.CallbackContext.html)
- [InputSettings — Input System API 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.InputSettings.html)
- [Built-in processors — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/manual/built-in-processors.html)
- [Vector2Composite — Input System API 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Composites.Vector2Composite.html)

The starting point for this post was
[유니티 new inputsystem 관하여](https://gall.dcinside.com/mgallery/board/view/?id=game_dev&no=124088),
posted to the Indie Game Development minor gallery (ㅇㅇ, 2023-04-16). I
followed its setup steps as written — the quotes from the post and its
comments are my translations from the Korean — and checked the three questions
it left open against both the current Input System 1.20 manual and the
scripting reference. Checked on 2026-10-08.
