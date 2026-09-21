---
pubDatetime: 2026-09-21T20:00:00+09:00
title: "[MenuItem] Belongs in an Editor Folder, and a MonoBehaviour Can't Go There"
lang: en
translationKey: unity-attributes
featured: false
draft: false
tags:
  - Unity
  - C#
  - Serialization
  - Editor
description: "I checked a 2021 round-up of eighteen attributes against the current docs. Most of it holds, but one example asks for two incompatible things, one is something the docs tell you not to use, and one guards less than it looks like it does."
---

A 2021 post that sorts attributes into five groups, from `[SerializeField]`
through `[CreateAssetMenu]` — **eighteen of them**, each with an example.

The convention I write to requires `[Header]`, `[Tooltip]`, and `[Range]`. That
amounts to **explain what a variable is for and pin down its range**, so they go
on nearly every script — and yet I'd never checked **how far each one actually
goes.** So I compared.

Most of it holds. Three places caught me: one example **asks for two
incompatible things**, one is something **the docs flatly tell you not to use**,
and one **guards a narrower range than it looks like it does.**

## Table of contents

## The list of eighteen mostly holds

What checked out first. The original's descriptions don't contradict the current
docs.

| Attribute | The original's claim | Verdict |
|---|---|---|
| `[SerializeField]` | Exposes private/protected in the Inspector | Holds |
| `[System.Serializable]` | Unfolds a class/struct in the Inspector | Holds |
| `[Header]` · `[Space]` · `[Tooltip]` | Inspector grouping and description | Holds |
| `[Range(min, max)]` | Restricts a range via a slider | **Conditional** |
| `[Multiline]` vs `[TextArea]` | Fixed lines vs elastic + scroll | Holds |
| `[RequireComponent]` | Added together on attach | Holds |
| `[DisallowMultipleComponent]` | Prevents duplicate attachment | Holds |
| `[CreateAssetMenu]` | `ScriptableObject` only | Holds |
| `[ExecuteInEditMode]` | Runs outside Play mode | **Not recommended** |

One of the original's own observations is especially sharp. Describing
`[Range]`, it records an experiment finding that **a value set from code outside
the range stays as written** — which is the third section below.

## Only the `[MenuItem]` example has nowhere to go

The fourth group includes `[UnityEditor.MenuItem]`, with this example:

```csharp
public class SomeClass : MonoBehaviour
{
    public string _string;

    [UnityEditor.MenuItem("TestEditor/MenuItemTest")]
    static void MenuItemTest()
    {
        Debug.Log("MenuItemTest");
    }
}
```

In the Editor this works: a menu item appears and logs when clicked. The problem
is **where this class is supposed to live.**

`MenuItem` is a class in the **`UnityEditor` namespace**. And Unity's manual
describes where editor scripts go and what they are:

> **`Editor` folder** — Reserved for Editor scripts, which add functionality to
> the Unity Editor at authoring time but **aren't available in Player builds at
> runtime.**

But the very next sentence bites:

> **MonoBehaviour scripts in an `Editor` folder can't be attached to GameObjects
> as components.**

**Two requirements collide.**

| Requirement | Consequence |
|---|---|
| It uses `UnityEditor` → put it in `Editor` | Then it can't be attached as a MonoBehaviour |
| It's a MonoBehaviour → put it in a normal folder | Then `UnityEditor` follows into the Player build |

The editor assembly isn't available in Player builds, so a class like this in a
normal folder **has nothing to resolve its reference against at build time.**
It's the classic shape of code that runs fine in the Editor and stops at the
build.

There are two fixes. One is **cutting it out with the preprocessor.**

```csharp
public class SomeClass : MonoBehaviour
{
    [SerializeField]
    private string _label;

#if UNITY_EDITOR
    [UnityEditor.MenuItem("TestEditor/MenuItemTest")]
    private static void MenuItemTest()
    {
        Debug.Log("MenuItemTest");
    }
#endif
}
```

`UNITY_EDITOR` is the symbol from the manual's platform-dependent compilation
example, and wrapping it this way means the block isn't compiled at all for a
Player build. The other is **splitting the editor code into its own class** in an
`Editor` folder or an editor assembly — the manual offers an assembly definition
asset as the alternative to an `Editor` folder. Splitting assemblies also comes
up in the compilation section of
[Unity's code optimization docs](/en/posts/unity-code-optimization/).

### `[ContextMenu]` isn't in the same family

The original places `[MenuItem]` and `[ContextMenu]` side by side. They look
alike in use, but **they belong to different assemblies.**

| | `[MenuItem]` | `[ContextMenu]` |
|---|---|---|
| Namespace | **`UnityEditor`** | **`UnityEngine`** |
| Method | "**Only static functions** can use the `MenuItem` attribute" | "The function has to be **non-static**" |
| Where it appears | The main menu bar | A component's right-click menu |
| On a MonoBehaviour | **Needs a guard** | Just works |

That `ContextMenu` lives in `UnityEngine` is the point. **For an editor action
scoped to one component, `[ContextMenu]` is the right tool**, and it needs no
guard. The exactly-opposite static requirement is worth remembering alongside it.

## `[Range]` only guards the Inspector

This is what the original found by experiment:

> When modifying from code, if the initial value entered is outside the range it
> gets corrected into range during initialization, but changes after that apply
> as written.

The docs show why. The description opens with:

> Attribute used to make a float or int variable in a script be **restricted to
> a specific range**.

Which reads as though the value will always stay within it. The next sentence
says what actually happens:

> When this attribute is used, the float or int will be shown as **a slider in
> the Inspector** instead of the default number field.

**The only mechanism the docs describe is an Inspector slider.** Nothing about
constraining values assigned from code at runtime. The original's experiment
matches: the initial value, which went through the Inspector and serialization,
lands in range, but a later `_range = 8;` is simply 8.

So `[Range]` is **a guardrail for whoever uses the Inspector**, not **an
invariant on the code.** If the code side needs the guarantee too, guard it
separately.

```csharp
[Header("Speed")]
[SerializeField, Range(1f, 20f), Tooltip("Movement speed in m/s")]
private float _moveSpeed = 5f;

public void SetSpeed(float value)
{
    // Values arriving from outside the Inspector get clamped here.
    _moveSpeed = Mathf.Clamp(value, MIN_SPEED, MAX_SPEED);
}
```

`Mathf.Clamp` has traps of its own, covered in
[swap the arguments and only one throws](/en/posts/mathf-clamp/).

## The docs tell you not to use `[ExecuteInEditMode]`

The original introduces it plainly — "the update code is called even when not in
Play mode." The behavior description is right. But the current Scripting
Reference carries an extra sentence:

> This attribute is **not recommended** because it is not compatible with editing
> in prefab editing mode. **The recommended alternative is `ExecuteAlways`.**

And `ExecuteAlways` reads:

> Causes a MonoBehaviour-derived class to execute in **Edit mode and prefab
> editing mode** in addition to at runtime.

Prefab editing mode is the difference. Enter Play mode with a component marked
`ExecuteInEditMode` open in prefab mode, and Unity **exits prefab editing mode to
prevent accidental modification to the prefab.** `ExecuteAlways` doesn't do that.

The original is from August 2021, so introducing it that way was natural then.
But for **new code today, it's `ExecuteAlways`.**

## Hiding versus not serializing

The original sets `[NonSerialized]` and `[HideInInspector]` next to each other
and describes the difference as: a value set in the Inspector before applying the
attribute survives with `HideInInspector` but not with `NonSerialized`. **The
observation is accurate.** Pulling the reason up a level makes it more useful.

The `HideInInspector` docs state it directly:

> Flags a variable to not appear in the Inspector. By default, a serialized
> variable automatically appears in the Inspector, even if the variable is
> private. A variable with this attribute **can be serialized and not display in
> the Inspector.**

So the two attributes **switch off different things.**

| | Serialized | Shown in Inspector |
|---|---|---|
| (plain public field) | Yes | Yes |
| `[HideInInspector]` | **Yes** | No |
| `[NonSerialized]` | **No** | No |
| `[SerializeField] private` | Yes | Yes |

`HideInInspector` **turns off display only.** The value still gets saved into the
scene or prefab, which is why an earlier setting survives. `NonSerialized`
**turns off the saving**, so it returns to the default on every play.

The dividing line in practice: something that **must not be edited in the
Inspector but whose value has to persist** (a reference computed and cached at
runtime, say) is `[SerializeField] [HideInInspector]`; something with **no reason
to be saved at all** is `[NonSerialized]`.

That the serialization rules are what decide Inspector visibility is a theme I
went through once before with the same serializer, in
[the JsonUtility post](/en/posts/unity-jsonutility/).

## Where and why you'd use this

Attributes are tools for lowering **the cost of sharing an Inspector with
designers and artists.** It's a collaboration problem, not a code one.

### The minimum set the convention asks for

The combination my convention requires, gathered into one component:

```csharp
using UnityEngine;

/// <summary>
/// A movement component with its Inspector-facing settings in one place.
/// </summary>
[RequireComponent(typeof(CharacterController))]
[DisallowMultipleComponent]
[AddComponentMenu("Player/Player Mover")]
public class PlayerMover : MonoBehaviour
{
    private const float MIN_SPEED = 0.5f;
    private const float MAX_SPEED = 20f;

    [Header("Movement")]
    [SerializeField, Range(MIN_SPEED, MAX_SPEED), Tooltip("Movement speed in m/s")]
    private float _moveSpeed = 5f;

    [SerializeField, Range(0f, 720f), Tooltip("Turn speed in degrees per second")]
    private float _turnSpeed = 360f;

    [Space]
    [Header("Debug")]
    [SerializeField, Tooltip("Draws the movement vector as a gizmo when checked")]
    private bool _drawGizmos;

    // Saved, but not editable from the Inspector.
    [SerializeField, HideInInspector]
    private Vector3 _lastMoveDirection;

    // Runtime state with no reason to be saved.
    [System.NonSerialized]
    public bool IsSprinting;

    private CharacterController _controller;

    private void Awake()
    {
        _controller = GetComponent<CharacterController>();
    }

    [ContextMenu("Reset Speeds")]
    private void ResetSpeeds()
    {
        _moveSpeed = 5f;
        _turnSpeed = 360f;
    }
}
```

A few intentions:

- **Three class attributes write down the contract.** `RequireComponent` states
  the dependency, `DisallowMultipleComponent` forbids duplicates, and
  `AddComponentMenu` places it in the menu — all visible in the Inspector.
- **`[Range]`'s bounds are pulled into `const`s.** Attribute arguments must be
  compile-time constants anyway, and this makes the code-side `Mathf.Clamp` use
  **the same numbers.** It also satisfies the convention's no-magic-numbers rule.
- **`[ContextMenu]`, not `[MenuItem]`.** This action belongs to one component,
  and being in `UnityEngine` it needs no guard. The non-static requirement fits
  here too.
- **`HideInInspector` and `NonSerialized` are used for what they actually do**,
  per the table above.

### Keeping editor-only code somewhere safe

For a project-wide tool, `[MenuItem]` is right — just **not in the same file as
a MonoBehaviour.**

```csharp
// Assets/Editor/LevelTools.cs  ← an Editor folder
using UnityEditor;
using UnityEngine;

public static class LevelTools
{
    [MenuItem("Tools/Snap Selection To Ground")]
    private static void SnapSelectionToGround()
    {
        Debug.Log($"{Selection.gameObjects.Length} selected");
    }
}
```

It's **a plain static class**, not a `MonoBehaviour`, so the "can't be attached
as a component" restriction doesn't apply, and living in an `Editor` folder keeps
it out of Player builds. The collision from the earlier section never arises.

### Where not to use it

- **A bare `[UnityEditor.MenuItem]` inside a MonoBehaviour.** Where this post
  started. Guard it or split the class.
- **Trusting `[Range]` as a runtime invariant.** Values arriving from outside the
  Inspector need their own guard.
- **`[ExecuteInEditMode]` in new code.** The docs recommend `ExecuteAlways`.
- **Reaching for `[HideInInspector]` to stop something being saved.** That's
  `[NonSerialized]`.

## Summary

- **Most of the eighteen hold exactly as described in 2021.** The
  Inspector-decoration group needs no corrections.
- **`[MenuItem]` is `UnityEditor`; `[ContextMenu]` is `UnityEngine`.** They look
  like siblings, but one can't go into a Player build and the other can. Their
  static-method requirements are opposites too.
- **Putting `[MenuItem]` on a MonoBehaviour collides with itself.** A
  MonoBehaviour in an `Editor` folder can't be attached, and a `UnityEditor`
  reference in a normal folder doesn't resolve in a Player build. Wrap it in
  `#if UNITY_EDITOR` or split the class.
- **What the docs guarantee for `[Range]` is an Inspector slider.** Values
  assigned from code go in as written. The original's experiment was right.
- **The docs mark `[ExecuteInEditMode]` as not recommended**, for
  incompatibility with prefab editing mode. The alternative is `ExecuteAlways`.
- **`[HideInInspector]` turns off display and keeps serialization.** To turn off
  saving, that's `[NonSerialized]`.

Attributes are one line each, so **what they switch on** is easy to memorize
while **what they don't switch off** stays invisible. All three findings here had
that shape — a range that didn't guard as far as it seemed, a namespace that came
along when it shouldn't have, and a recommendation that had changed without my
noticing.

---

### References

- [RangeAttribute — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/RangeAttribute.html)
- [MenuItem](https://docs.unity3d.com/ScriptReference/MenuItem.html)
- [ContextMenu](https://docs.unity3d.com/ScriptReference/ContextMenu.html)
- [ExecuteInEditMode](https://docs.unity3d.com/ScriptReference/ExecuteInEditMode.html)
- [ExecuteAlways](https://docs.unity3d.com/ScriptReference/ExecuteAlways.html)
- [HideInInspector](https://docs.unity3d.com/ScriptReference/HideInInspector.html)
- [Special folder names — Unity Manual](https://docs.unity3d.com/Manual/SpecialFolders.html)
- [Platform dependent compilation](https://docs.unity3d.com/Manual/PlatformDependentCompilation.html)

The source this post started from is [자가라o — \[Unity\] Attribute 애트리뷰트](https://zagara.tistory.com/16)
(2021-08-13). I followed its structure and checked each item against the current
Scripting Reference and manual.
