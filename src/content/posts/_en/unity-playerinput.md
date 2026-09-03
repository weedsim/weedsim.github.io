---
pubDatetime: 2026-09-03T18:30:00+09:00
title: "Unity's PlayerInput: One Behavior Setting Rewrites Your Code"
lang: en
translationKey: unity-playerinput
featured: false
draft: false
tags:
  - Unity
  - Input System
  - Input
  - C#
description: "PlayerInput's API reference is a list of properties, which is not what you need when you first attach it. Why the four Behavior options demand different code, why callbacks fire more than once, and whether a single-player project needs this component at all."
---

Wiring Input System into a game project, I added a `PlayerInput` component to
the player object. I did it because that's what the material I was reading said
to do — and having done it, **what exactly this component does for me, such
that I need it**, was if anything less clear. Looking into that, I ended up
clipping the
[API reference](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.12/api/UnityEngine.InputSystem.PlayerInput.html).

Opening it again: an 80 KB document whose class description is exactly one
line.

> Represents a separate player in the game complete with a set of actions
> exclusive to the player and a set of paired device.

The rest is a list of properties and methods, followed by an endless run of
members inherited from `MonoBehaviour`. **It tells you what exists, not how to
use it.** Fair enough for a reference document — but the places you actually
get stuck when first attaching this component aren't on that list.

So I rewrote it against the manual. The short answer to the question I started
with — why do I need this? — turned out to be **"sometimes you don't."**
Everything here is against **Input System 1.16.0** (2025-11-10), the current
release; what changed since the clipping's 1.12.0 is collected at the end.

## Table of contents

## PlayerInput does two jobs

The manual sums the component up in two lines.

> Configuring how Actions map to methods or callbacks in the script that
> controls your player

> Handling local multiplayer scenarios such as player lobbies, device
> filtering, and screen-splitting

People often use it for the first one only, but **the second is closer to why
this component exists.** If all you need is to hook actions up to methods, you
don't have to go through this component at all — more on that below.

## The four Behaviors change your code

The `Behavior` dropdown in the inspector looks like it just picks a
notification style, but **the value you pick changes the method signature you
have to write.** This is where people get stuck most often.

| Behavior | How it's delivered | Method you write |
| --- | --- | --- |
| Send Messages | `GameObject.SendMessage` | `void OnMove(InputValue value)` |
| Broadcast Messages | `GameObject.BroadcastMessage` | `void OnMove(InputValue value)` |
| Invoke Unity Events | `UnityEvent` wired in the inspector | `void OnMove(InputAction.CallbackContext context)` |
| Invoke C# Events | C# events on `PlayerInput` | subscribe to `onActionTriggered` etc. |

The manual's wording:

> **Send Messages**: Uses `GameObject.SendMessage` on the GameObject that the
> PlayerInput component belongs to

> **Broadcast Messages**: Uses `GameObject.BroadcastMessage` on the GameObject
> that the PlayerInput component belongs to. This broadcasts the message down
> the GameObject hierarchy

> **Invoke CSharp Events**: Similar to `Invoke Unity Events`, except that the
> events are plain C# events available on the `PlayerInput` API.

For actions that carry no value you can take no argument at all.

```csharp
public void OnJump() { }
public void OnMove(InputValue value) { }
```

`Invoke Unity Events` and `Invoke C# Events` take a different argument type.

```csharp
public void OnFire(InputAction.CallbackContext context) { }
```

### Where this actually bites

**Send Messages finds methods by string name.** An action named `Move` calls
`OnMove`. Which means none of the following are caught **at compile time**:

- You renamed the action from `Move` to `Movement` and left `OnMove` in the script
- You typed `OnMOve`
- The script isn't on the same GameObject as `PlayerInput`

All three fail silently, with no error. A large share of "input doesn't work
and there's nothing in the console" is this. `Broadcast Messages` walks down
the hierarchy so it dodges the script-placement problem, but the naming problem
is unchanged.

`Invoke Unity Events` avoids name typos because you wire it in the inspector —
but **the wiring is saved in the scene**. Keep several prefab variants around
or rework a scene and the connection drops, and that too fails silently.

`Invoke C# Events` has neither problem because you subscribe in code. In
exchange there's no per-action event; everything arrives through the single
`onActionTriggered`, so you write the dispatch yourself.

## One press, several callbacks

This one always catches you when using the `CallbackContext` side
(`Invoke Unity Events`, `Invoke C# Events`). Actions move through phases.

> Disabled, Waiting, Started, Performed, and Canceled

> The Started, Performed, and Canceled phases each have a callback associated
> with them.

So pressing and releasing a button can fire **three callbacks**. That's why
hanging an `Instantiate` off a fire action gets you several bullets from one
press.

The fix is to filter on the phase yourself.

```csharp
public void OnFire(InputAction.CallbackContext context)
{
    if (!context.performed) return;
    Fire();
}
```

If you want to handle press and release separately, look at `context.started`
and `context.canceled`. For a continuously changing action like movement, read
it with `context.ReadValue<Vector2>()` — and if you need the value every frame,
store it from the callback and use it in `Update` instead.

The `Send Messages` side only receives an `InputValue`, so it runs into this
less. In exchange you can't tell which phase you're in, which makes it a poor
fit for actions that need different handling per phase. **That's the practical
criterion for choosing a Behavior.**

## The properties you actually touch

The reference lists more than twenty properties; only a handful come up in
practice. Grouped by purpose:

**Switching action maps** — used to turn gameplay input off while a UI is open.

- `actions` — the `InputActionAsset` this player uses
- `defaultActionMap` / `currentActionMap`
- `SwitchCurrentActionMap(string)`

The common bug here is **forgetting to switch back**. Open an inventory,
switch to the `UI` map, fail to return to `Player` on close, and the character
never moves again. Keeping the open and close code as one pair is the safe
habit.

**Control schemes** — keyboard/gamepad switching.

- `defaultControlScheme` / `currentControlScheme`
- `neverAutoSwitchControlSchemes`
- `onControlsChanged` — hook this to swap the key-prompt icons in your UI

**Turning input on and off** — for cutscenes and death sequences.

- `ActivateInput()` / `DeactivateInput()`
- `inputIsActive`

**Multiplayer and split screen**

- `playerIndex`, `splitScreenIndex`, `camera`, `devices`, `user`
- `all`, `GetPlayerByIndex(int)`, `FindFirstPairedToDevice(InputDevice)`

**UI hookup**

- `uiInputModule` — the `InputSystemUIInputModule` reference

## Local multiplayer is the real point

Use `PlayerInput` on its own and you're using half of it. Its counterpart is
`PlayerInputManager`, described in the manual as:

> automatically manages the creation and lifetime of `PlayerInput` instances
> as players join and leave the game

Assign a player prefab — which must have one `PlayerInput` somewhere in its
hierarchy — and it instantiates one per player as they join. There are three
join behaviours.

- **Join Players When Button Is Pressed** — a button press on a device not
  paired to any player joins that player.
- **Join Players When Join Action Is Triggered** — joins only when a specific
  action you define is triggered, rather than on any button.
- **Join Players Manually** — no automatic joining; you call `JoinPlayer`
  yourself.

Split screen is handled here too. Enable it and the screen is divided
automatically among active players, which requires cameras on the player
prefab — that's what `PlayerInput`'s `camera` and `splitScreenIndex` are for.
Headcount is capped with `Limit Number of Players` and `Max Player Count`.

**Device pairing, join and leave handling, split screen** — set against writing
those three yourself, attaching a component is clearly cheaper. If you're
building local multiplayer, `PlayerInput` is the right call.

## Do you need it for single player?

This is the answer to the question I started with. If you're not doing local
multiplayer, the calculation changes. The workflow the Input System manual
recommends is not `PlayerInput`.

> Unless you have specific project requirements that require more than one
> Action Asset, the recommended workflow is to use a single Action Asset
> assigned as the project-wide actions.

Assign an asset as the project-wide actions and you reach it through the API
without carrying a reference around.

```csharp
InputSystem.actions.FindAction("Move");
```

Of what `PlayerInput` was doing for you, the only part a single-player project
actually needs is "hook actions up to methods" — and you can get that by
subscribing to the action's `performed` directly. So the criteria come out as:

- **You need local multiplayer, split screen, or per-device pairing** →
  `PlayerInput` + `PlayerInputManager`
- **There's only one player** → project-wide actions and direct subscription.
  Using `PlayerInput` is fine, but there's little reason to take on the
  fragility of `SendMessage` name matching or inspector wiring
- **Several objects need to receive input** → `Broadcast Messages` looks
  convenient, but a deliberate event bus is easier to trace

## From 1.12 to now

The clipping is against **1.12.0**; the current release is **1.16.0**
(2025-11-10). `PlayerInput`'s API hasn't changed much — the related work is
mostly bug fixes.

- Fixed the component switching away from the default action map when
  `defaultActionMap` was set to `None`
- Fixed the `defaultActionMap` dropdown so it defaults to the first action map
  instead of staying empty
- Several `InputActionReference` fixes (cached actions not being updated,
  broken references not being reflected in the inspector after an asset was
  deleted, and so on)

So code written against 1.12 is unlikely to break on 1.16. That said, those
first two are exactly the "I clearly set this in the inspector and it behaves
differently" class of symptom — if you hit that on an older version, the
version is worth checking first.

## Summary

- `PlayerInput` does action-to-method wiring and local multiplayer handling.
  The latter is what the component is really for.
- **The `Behavior` value decides the method signature you write.**
  Send/Broadcast take `InputValue`; Unity Events and C# Events take
  `InputAction.CallbackContext`.
- `Send Messages` is name-based reflection, so typos, renames and script
  placement all fail silently. `Invoke Unity Events` fails just as silently
  when the scene-saved wiring drops.
- Actions have callbacks on `Started`, `Performed` and `Canceled`. With
  `CallbackContext` you need `context.performed` to run once.
- If you switch action maps, write the code that switches back as a pair.
- For single player, project-wide actions plus direct subscription is the
  workflow the manual recommends.
- Current release is 1.16.0. Nothing in `PlayerInput`'s API broke since 1.12.

## References

- [The Player Input component — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/PlayerInput.html)
- [The Player Input Manager component — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/PlayerInputManager.html)
- [Responding to actions — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/RespondingToActions.html)
- [Project-wide actions — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/manual/ProjectWideActions.html)
- [Input System changelog — Unity](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.16/changelog/CHANGELOG.html)
- Original: [Class PlayerInput — Input System 1.12.0](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.12/api/UnityEngine.InputSystem.PlayerInput.html)
