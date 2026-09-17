---
pubDatetime: 2026-09-17T14:00:00+09:00
title: "There Are Two Clamps: Swap the Arguments and Only One Throws"
lang: en
translationKey: mathf-clamp
featured: false
draft: false
tags:
  - Unity
  - C#
  - Math
  - Camera
description: "Mathf.Clamp takes four lines to explain. The trouble is everything outside those four lines: what happens when you swap the bounds, when NaN arrives, and when you clamp an angle."
---

Hunting for a built-in function to limit a camera's angle, I landed on
`Mathf.Clamp` and clipped a nicely written explanation of it. Not the official
docs — a personal blog post.

Reading it back, **the content is correct.** It's a function you can explain in
four lines.

And yet it turned out to be **the wrong function for exactly the thing I wanted
it for.** Nothing's wrong with `Mathf.Clamp` itself; it breaks the moment you
feed it an angle read back off a `transform`. Explaining why means first looking
at **what this function guarantees and what it doesn't.**

Three edges turned up: swapping the arguments, `NaN` arriving, and clamping an
angle.

## Table of contents

## The four-line explanation is correct

Here's what the original says:

> If value is less than min it returns min, if greater than max it returns max,
> and if it's between min and max it's returned unchanged.

Open Unity's C# reference source and that sentence matches the code exactly.

```csharp
public static float Clamp(float value, float min, float max)
    => value < min ? min : value > max ? max : value;
```

Two ternaries. The blog's sentence is that expression transcribed into prose,
and **there's nothing wrong with it.** The official docs say the same thing.

> Clamps the given value between the given minimum float and maximum float
> values. Returns the given value if it is within the minimum and maximum range.

There are two overloads, plus one sibling:

```csharp
public static int Clamp(int value, int min, int max)
    => value < min ? min : value > max ? max : value;

public static float Clamp01(float value)
    => value < 0F ? 0F : value > 1F ? 1F : value;
```

`Clamp01` is the version with 0 and 1 hardcoded. Where **0–1 is a settled
range** — ratios, alpha values — it states the intent more clearly.

That's everything the four lines cover.

## Swap the arguments — Unity and .NET diverge

What happens if you pass `min` and `max` the wrong way round? Three arguments,
two of them the same type: **this is an API whose order is easy to get wrong.**

Unity's docs have one line on it:

> Returns an **undefined value** if the minimum value is greater than the
> maximum value.

.NET has a function with the same name, `System.Math.Clamp`. Its docs read
differently.

> `ArgumentException` — max is less than min.

| | `Mathf.Clamp` (Unity) | `Math.Clamp` (.NET) |
|---|---|---|
| Normal range | Same | Same |
| `min > max` | **Undefined value** | **`ArgumentException`** |
| `NaN` | Not mentioned in the docs | **Documented: returns `NaN`** |

**Same name, same meaning, different contract.** .NET blows up immediately on
bad arguments and tells you; Unity quietly hands something back.

What that "undefined value" actually is can be traced from the implementation
above. Take `min = 10`, `max = 5`, reversed.

| `value` | `value < min ?` | `value > max ?` | Result |
|---|---|---|---|
| 3 | true | — | **10** |
| 7 | true | — | **10** |
| 12 | false | true | **5** |

**A small input yields the large bound, a large input the small one.** Inverted.
And no input yields `value` itself.

**Don't rely on this, though.** Once the docs say "undefined," this is current
implementation, not contract. The point is a different one: **nothing tells you
you got it backwards.** The values just come out strange, and it takes a while to
trace that back to a `Clamp` call.

Where the bounds arrive as variables rather than constants, one line of defense
is cheap.

```csharp
// When you're computing the bounds themselves
float lower = Mathf.Min(a, b);
float upper = Mathf.Max(a, b);
float result = Mathf.Clamp(value, lower, upper);
```

## NaN doesn't get clamped

The second gap. Look at the implementation again — it's two comparisons.

```csharp
value < min ? min : value > max ? max : value
```

`NaN` **never makes a comparison true.** `NaN < min` is false and `NaN > max` is
false, so both ternaries fall through and **the trailing `value` comes straight
out.**

Feeding various values into `Mathf.Clamp(x, 0f, 1f)`:

| Input | Result |
|---|---|
| `-5` | `0` |
| `0.5` | `0.5` |
| `5` | `1` |
| `float.PositiveInfinity` | `1` |
| `float.NaN` | **`NaN`** |

**Infinity gets clamped; `NaN` passes through.** Infinity because comparisons
hold for it, `NaN` because they don't.

This matters because **it's easy to mistake `Clamp` for sanitizing.** A value you
waved through thinking "it's bounded to 0–1 anyway, it's fine" arrives as `NaN`,
flows into a position or a color, and the object vanishes or the screen goes
black — a long way from where it was created.

The common sources of `NaN` are indeterminate forms like **`0f / 0f`** and
**`Mathf.Sqrt` of a negative number**. If that kind of math sits upstream, what
you need is a check, not a clamp.

```csharp
if (float.IsNaN(value))
{
    value = fallback;
}
```

Worth noting: the .NET docs **state explicitly** that `NaN` in gives `NaN` out.
Same behavior, documented on only one side. Reading Unity's docs alone, there's
no way to learn it.

## Where and why you'd use this

`Clamp` shows up in two kinds of place: **keeping a value in range** and
**bounding movement**. The second is where it usually goes wrong.

### Keeping a value in range

Health is the most common example, and it shows where `Clamp` and `Clamp01` each
belong.

```csharp
using System;
using UnityEngine;

/// <summary>
/// Keeps health between zero and the maximum, and exposes a ratio for UI.
/// </summary>
public class Health : MonoBehaviour
{
    [Header("Health")]
    [SerializeField, Range(1f, 1000f), Tooltip("Maximum health")]
    private float _maxHealth = 100f;

    private float _current;

    /// <summary>A 0–1 value you can hand straight to a health bar's fillAmount.</summary>
    public float Normalized => _maxHealth > 0f
        ? Mathf.Clamp01(_current / _maxHealth)
        : 0f;

    public event Action<float> OnHealthChanged;

    private void Awake()
    {
        _current = _maxHealth;
    }

    public void Apply(float delta)
    {
        // Healing and damage share one method, so the bounds live in one place.
        _current = Mathf.Clamp(_current + delta, 0f, _maxHealth);
        OnHealthChanged?.Invoke(Normalized);
    }
}
```

A few intentions:

- **The bounds are enforced in exactly one place.** Separate damage and heal
  methods means two clamps, and eventually only one of them gets fixed.
- **`Clamp01` in `Normalized` is there because of the division.** `_current` is
  already clamped, but float division can still produce `1.0000001`.
- **`_maxHealth > 0f` is checked first.** At zero it becomes `0f / 0f`, and as
  the previous section showed, **that `NaN` sails straight through `Clamp01`.**
- **The `?.` in `OnHealthChanged?.Invoke` is fine.** That's a plain C# event, not
  a Unity object.

### Bound the cause, not the result

Here's the mistake I see often — limiting movement by **clamping the position**
every frame.

```csharp
// Common, but it has a problem
private void Update()
{
    transform.position += _velocity * Time.deltaTime;

    Vector3 p = transform.position;
    p.x = Mathf.Clamp(p.x, MIN_X, MAX_X);
    transform.position = p;
}
```

It works. But at the boundary **the velocity is still alive.** It keeps
accumulating while you're pinned against the wall, so input in the opposite
direction has to burn through the stored value first and **doesn't release
immediately.** For a physics object, the constraints covered in
[What FreezePositionY Freezes Is World Y](/en/posts/rigidbody-constraints/) are
often the better fit anyway.

Bounding the cause avoids this.

```csharp
// Bound the input, not the result
private void Update()
{
    float next = transform.position.x + _velocity.x * Time.deltaTime;
    float clamped = Mathf.Clamp(next, MIN_X, MAX_X);

    if (!Mathf.Approximately(next, clamped))
    {
        _velocity.x = 0f;   // we hit the boundary, so kill the velocity
    }

    Vector3 p = transform.position;
    p.x = clamped;
    transform.position = p;
}
```

**The fact that the clamp changed the value is itself information.** Rather than
discarding it, use it as the "we hit the boundary" signal.

### Where not to use it

- **As a substitute for sanitizing.** As above, `NaN` goes through.
- **On angles.** That's the next section.
- **Where bounds arrive as variables and the order isn't validated.** If
  `min > max`, nothing tells you.

## Why you can't clamp an angle

Nearly every project has code limiting the camera's pitch. And **the most
intuitive form of it doesn't work.**

```csharp
// Don't do this
float pitch = transform.eulerAngles.x;
pitch = Mathf.Clamp(pitch, -30f, 60f);
transform.eulerAngles = new Vector3(pitch, _yaw, 0f);
```

`Clamp` isn't at fault. The problem is **what `eulerAngles` returns.** The docs
are clear:

> Angles are expressed **modulo 360 degrees**. For instance, specifying 1, 361,
> or -17999 results in the same angle.

> Because there is more than one way to represent any given rotation using Euler
> angles, **the values you read back out may be quite different from the values
> you assigned.**

So a camera tilted 30 degrees upward (-30) reads back not as -30 but as **330**.
And `Mathf.Clamp(330f, -30f, 60f)` dutifully returns **60**. The camera snaps
downward in one frame.

There's a second warning too:

> Do not set one of the `eulerAngles` axis separately (eg. `eulerAngles.x = 10;`)
> since this will lead to drift and undesired rotations. When setting them to a
> new value **set them all at once**.

So reading an angle off the `transform` and clamping it is wrong in **two
places**: the range of what you read, and touching a single axis.

The fix is **holding the angle yourself.**

```csharp
using UnityEngine;

/// <summary>
/// Turns the view from mouse input, keeping and clamping the pitch directly.
/// </summary>
public class LookController : MonoBehaviour
{
    private const float MIN_PITCH = -30f;
    private const float MAX_PITCH = 60f;

    [Header("Look")]
    [SerializeField, Range(0.1f, 10f), Tooltip("Mouse sensitivity in degrees per pixel")]
    private float _sensitivity = 2f;

    // The source of truth. Never read back from the transform.
    private float _pitch;
    private float _yaw;

    private void Awake()
    {
        // 0-360 is meaningful for yaw, so reading it is fine.
        _yaw = transform.eulerAngles.y;
        // Pitch needs a negative range, so it doesn't come from eulerAngles.
        _pitch = 0f;
    }

    public void Look(Vector2 delta)
    {
        _yaw += delta.x * _sensitivity;
        _pitch -= delta.y * _sensitivity;
        _pitch = Mathf.Clamp(_pitch, MIN_PITCH, MAX_PITCH);

        // Set all at once, per the warning about separate axes.
        transform.eulerAngles = new Vector3(_pitch, _yaw, 0f);
    }
}
```

**`_pitch` is the source of truth and the `transform` is only output.** Nothing
is read back, so modulo 360 never bites, and assigning a whole `Vector3` stays
clear of the separate-axis warning.

When you genuinely have to start from an existing angle, there's
`Mathf.DeltaAngle`.

> Calculates the **shortest difference** between two angles. The return value is
> between -180 (exclusive) and 180 (inclusive).

It reports the difference between 330 and 0 as **-30**, not 330. That's why plain
subtraction doesn't belong in angle code.

If the camera itself is handed to Cinemachine, the clamping usually lives in
component settings instead; that's covered in
[Taking Apart Cinemachine's Follow Camera](/en/posts/cinemachine-follow-camera/).

## The Clamp family — walls and seams

What happens at the boundary differs per function.

| Function | What the docs say | At the boundary |
|---|---|---|
| `Mathf.Clamp` | Clamps the value between min and max | **Stops** |
| `Mathf.Clamp01` | Between 0 and 1 | **Stops** |
| `Mathf.Repeat` | "Loops the value t, so that it is never larger than length and never smaller than 0" | **Wraps** |

Values whose boundary is a wall — health, a field-of-view limit — want `Clamp`.
Values whose boundary is a seam — headings, tile coordinates — want `Repeat`.
Angles causing trouble under `Clamp` comes down to angles being the second kind.

## Summary

- **The four-line explanation is correct.** The implementation is two ternaries,
  and the blog's description matches it exactly.
- **Unity and .NET diverge on `min > max`.** .NET's `Math.Clamp` throws
  `ArgumentException`; Unity's `Mathf.Clamp` quietly returns an **"undefined
  value."** If the bounds are variables, sorting them with
  `Mathf.Min`/`Mathf.Max` first is cheap.
- **`NaN` doesn't get clamped.** Every comparison is false, so it passes through.
  Infinity is caught; `NaN` isn't. `Clamp` is not sanitizing.
- **Bound the cause, not the result.** Clamping position every frame leaves the
  velocity alive. Better to use "the clamp changed the value" as a
  hit-the-boundary signal.
- **Don't read `transform.eulerAngles` and clamp it.** Modulo 360 turns -30 into
  330, and there's a warning against assigning single axes. **Hold the angle in a
  field and clamp that.**
- **Wall means `Clamp`, seam means `Repeat`.** Angles are seams.

The simpler the function, the shorter the docs — and short docs are bad at saying
**what they don't guarantee.** Here that was one line about an "undefined value,"
plus a `NaN` case that isn't mentioned at all.

---

### References

- [Mathf.Clamp — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Mathf.Clamp.html)
- [UnityCsReference — Mathf.cs](https://github.com/Unity-Technologies/UnityCsReference/blob/master/Runtime/Export/Math/Mathf.cs)
- [Math.Clamp — .NET API docs](https://learn.microsoft.com/en-us/dotnet/api/system.math.clamp)
- [Transform.eulerAngles](https://docs.unity3d.com/ScriptReference/Transform-eulerAngles.html)
- [Mathf.DeltaAngle](https://docs.unity3d.com/ScriptReference/Mathf.DeltaAngle.html)
- [Mathf.Repeat](https://docs.unity3d.com/ScriptReference/Mathf.Repeat.html)

The source this post started from is [코딩하는 돼징 — Unity - Mathf.Clamp](https://code-piggy.tistory.com/entry/MathfClamp)
(2023-09-15). Its explanation matched the current implementation; the edge cases
above were checked separately against the official reference and the C# reference
source.
