---
pubDatetime: 2026-09-22T15:00:00+09:00
title: "Play Time Is a TimeSpan, Not a DateTime"
lang: en
translationKey: datetime-formatting
featured: false
draft: false
tags:
  - Unity
  - C#
  - .NET
  - Data
description: "I clipped a current-time utility while trying to put a time-attack run timer on screen, but the type I needed wasn't that one. The type for elapsed time, the clock to read, and the format string rules are all different."
---

I was building a time-attack game. Looking for **how to put play time on the
UI**, I clipped a 2019 post about handling the current time. Its goal is one
line:

> Goal — write a utility for displaying the current time

It climbs in three steps: `DateTime.Now.ToString()`, format specifiers, Unix
time conversion. The structure is clean.

Reopening it, **what I was looking for and what I clipped are different
things.** This post answers "what time is it now," and a time-attack game needs
"**how much time has passed**." Those start from different types.

## Table of contents

## A point in time and a duration are different types

`DateTime` is a **point** — a single spot on the calendar, like 15:47 on
22 September 2026. What a time attack measures isn't a point but a **length**:
3 minutes 24.71 seconds.

.NET has a separate type for lengths: `TimeSpan`. Handling a length with
`DateTime` means fixing a reference point and subtracting — and the result of
that subtraction is a `TimeSpan` anyway.

```csharp
DateTime start = DateTime.Now;
// ...
TimeSpan elapsed = DateTime.Now - start;   // the subtraction yields a TimeSpan
```

So **working in `TimeSpan` from the start is the right shape.** And there's one
rule that catches you the moment you move over.

### The format string rules are different

Bring your `DateTime` habits to `timeSpan.ToString("mm:ss")` and it won't do what
you meant. The docs explain why:

> The custom `TimeSpan` format specifiers **don't include placeholder separator
> symbols**, such as the symbols that separate days from hours, hours from
> minutes, or seconds from fractional seconds. Instead, these symbols must be
> included in the custom format string **as string literals.**

So colons and periods have to be **escaped explicitly.** The docs' example:

```csharp
output = "Time of Travel: " + duration.ToString(@"dd\.hh\:mm\:ss");
// 01.12:24:02
```

Single quotes work too:

```csharp
fmt = "mm':'ss' minutes'";
// 32:45 minutes
```

There's one more rule. **A specifier used alone needs a `%` in front.** That
applies to `"d"`, `"h"`, `"m"`, `"s"`, `"f"`, and `"F"`; without it they're read
as standard format strings.

Which makes a time-attack timer's format look like this:

```csharp
@"mm\:ss\.ff"      // 03:24.71
@"h\:mm\:ss"       // 1:03:24  (if a run can pass an hour)
```

## Which clock to read

With the type settled, the next question is **what measures the time.** Unity's
`Time` class offers three candidates, and the difference between them decides
**how pausing behaves.**

| Property | What the docs say | Affected by `timeScale` |
|---|---|---|
| `Time.time` | The time at the **beginning of the current frame** in seconds since the start of the application | **Yes** |
| `Time.unscaledTime` | The **timeScale-independent** time for this frame | No |
| `Time.realtimeSinceStartup` | The **real time** in seconds since the game started | No |

And `Time.timeScale` is "**the rate at which in-game time passes relative to real
time.**"

**For a time attack, `Time.time` is usually right.** If pausing is implemented as
`Time.timeScale = 0`, the timer should stop with it. A run shouldn't keep
counting while a menu is open.

Conversely, anything that **has to keep running while paused** wants
`unscaledTime` — UI animation, a "resuming in 3 seconds" countdown.

`realtimeSinceStartup` is different again. Being real time independent of frames,
**it keeps running through things like loading, when frames aren't updating.**
Good for profiling, more than a game record needs.

One thing worth noting: `Time.time` is the time at **"the beginning of the
current frame."** Read it several times within one frame and you get the same
value. For a timer that's an advantage — display and judgement in the same frame
can't disagree.

Measuring by subtracting two `DateTime.Now` values fits none of the three.
**It reads the device clock**, so a player changing the clock changes the record,
and a single automatic time sync can jolt it. Not a value you can hang a
time-attack record on.

## Where `DateTime` does belong — recording the run

That doesn't make `DateTime` useless. **"When was this record set"** is a point
in time, and that's `DateTime`'s job. It's also where the original's content
becomes relevant.

Taking the original's code as written, though, three things catch.

**First, the format string blocks reading it back.**

```csharp
return DateTime.Now.ToString(("yyyy-MM-dd HH:mm:ss tt"));
```

`HH` is already 24-hour, and `tt` (the AM/PM designator) is bolted on. On screen
you get `2026-09-22 15:47:21 PM`. And the docs put it more strongly:

> When you parse a string that includes an AM/PM designator, use the "h" or "hh"
> hour specifier (12-hour clock) instead of "H" or "HH" (24-hour clock). **The
> 24-hour clock specifier is incompatible with the AM/PM designator in a parsing
> operation, and throws a `FormatException`.**

Save the record, read it back, and it throws.

**Second, it follows the culture.**

> The `ToString(String)` method returns the string representation of a date and
> time value in a specific format that uses the formatting conventions of **the
> current culture**.

`tt` is "오후" on a Korean device and "PM" on an English one. The no-argument
`ToString()` changes separators and ordering too. Correct for display, **a bug
for storage.**

**Third, there's a dedicated API for the epoch conversion.** The original
subtracts by hand:

```csharp
TimeSpan time = (DateTime.UtcNow - new DateTime(1970,1,1));
```

(Incidentally, this function and the one below it don't compile — they use
**undeclared identifiers**. `t` and `expiredTime` should be `time` and
`milliSecond`.)

.NET already has it:

> `public long ToUnixTimeMilliseconds();`
> Returns **the number of milliseconds that have elapsed since
> 1970-01-01T00:00:00.000Z**. This method **first converts the current instance
> to UTC** before returning the number of milliseconds in its Unix time.

The return being a **`long`** rather than a `double` keeps precision, and
`DateTimeOffset` carries the offset inside the type, so the original's `Kind`
confusion — subtracting an `Unspecified` from `UtcNow` in one function while
spelling out `DateTimeKind.Utc` in the next — doesn't arise.

## Where and why you'd use this

To summarize, a time attack needs three things: **measure with `Time.time`, hold
it as a `TimeSpan`, store it as a `long`.**

### The run timer

```csharp
using System;
using TMPro;
using UnityEngine;

/// <summary>
/// Times a single run and shows it on the UI.
/// </summary>
public class RunTimer : MonoBehaviour
{
    // TimeSpan formats need their separators escaped explicitly.
    private const string TIME_FORMAT = @"mm\:ss\.ff";

    [Header("UI")]
    [SerializeField, Tooltip("The text showing elapsed time")]
    private TMP_Text _label;

    private float _startTime;
    private float _finishedElapsed;
    private bool _isRunning;
    private int _lastShownHundredths = -1;

    /// <summary>Elapsed time; holds the final result once stopped.</summary>
    public TimeSpan Elapsed => TimeSpan.FromSeconds(
        _isRunning ? Time.time - _startTime : _finishedElapsed);

    public event Action<TimeSpan> OnFinished;

    public void Begin()
    {
        // Pausing with timeScale = 0 stops this clock too.
        _startTime = Time.time;
        _isRunning = true;
    }

    public void Finish()
    {
        if (!_isRunning)
        {
            return;
        }

        _finishedElapsed = Time.time - _startTime;
        _isRunning = false;
        OnFinished?.Invoke(Elapsed);
    }

    private void Update()
    {
        if (!_isRunning)
        {
            return;
        }

        TimeSpan elapsed = Elapsed;

        // Rebuild the string only when the displayed value changes.
        int hundredths = (int)(elapsed.TotalSeconds * 100.0);
        if (hundredths == _lastShownHundredths)
        {
            return;
        }

        _lastShownHundredths = hundredths;
        _label.text = elapsed.ToString(TIME_FORMAT);
    }
}
```

A few intentions:

- **It uses `Time.time`.** Pausing with `timeScale = 0` stops the timer. If it
  should keep running while paused, switch to `Time.unscaledTime` — **that one
  line is the design decision.**
- **`Elapsed` returns a `TimeSpan`.** Hand out a raw `float` and every consumer
  has to decide again whether it's seconds or milliseconds.
- **The format constant has `@` and backslashes**, per the rule above. Drop them
  and `mm` and `ss` get read as something else.
- **`ToString` runs only when the shown value changes.** Note that at hundredths
  precision it changes 100 times a second, so at 60fps that's still nearly every
  frame. **Displaying whole seconds** is where this guard removes most of the
  allocation. The cost of building strings every frame is covered in
  [the code optimization post](/en/posts/unity-code-optimization/).
- **The `?.` in `OnFinished?.Invoke` is fine.** That's a plain C# event.

### Accumulating `deltaTime` instead

The code above **subtracts** — remember the start time, take the difference from
now. The other approach **accumulates** `Time.deltaTime` every frame.

```csharp
_elapsedSeconds += Time.deltaTime;
```

Per the docs, `Time.deltaTime` is "**the interval in seconds from the last frame
to the current one**," and like `Time.time` it's affected by `timeScale`. So at
**`timeScale = 0`, `deltaTime` is 0** and the accumulation stops. Both approaches
stop the timer on pause.

The difference shows up **everywhere else.**

| | Accumulate (`+= deltaTime`) | Subtract (`Time.time - start`) |
|---|---|---|
| Pause via `timeScale = 0` | Stops | Stops |
| Slow motion (`timeScale = 0.5`) | Accrues at half speed | Runs at half speed |
| **Pause that doesn't use `timeScale`** | **A flag can stop it** | Can't be stopped |
| Pause and resume mid-run | Just works | The start time has to be re-based |
| Floating-point error | **Accumulates** | A difference of two values, so none |

The third row is what accumulation buys you. If pause is implemented as a state
change or by blocking input rather than through `timeScale`, `Time.time` keeps
running and the subtraction approach won't stop. Accumulation just stops adding.

```csharp
using System;
using TMPro;
using UnityEngine;

/// <summary>
/// Times a run by accumulating deltaTime, so it can stop regardless of how pause is implemented.
/// </summary>
public class AccumulatingRunTimer : MonoBehaviour
{
    private const string TIME_FORMAT = @"mm\:ss\.ff";

    [Header("UI")]
    [SerializeField, Tooltip("The text showing elapsed time")]
    private TMP_Text _label;

    // A double rather than a float: this is added to every frame, so error accumulates.
    private double _elapsedSeconds;
    private bool _isRunning;
    private int _lastShownHundredths = -1;

    public TimeSpan Elapsed => TimeSpan.FromSeconds(_elapsedSeconds);

    public event Action<TimeSpan> OnFinished;

    public void Begin()
    {
        _elapsedSeconds = 0.0;
        _isRunning = true;
    }

    /// <summary>Stops only the timer, without touching timeScale.</summary>
    public void SetPaused(bool paused)
    {
        _isRunning = !paused;
    }

    public void Finish()
    {
        if (!_isRunning)
        {
            return;
        }

        _isRunning = false;
        OnFinished?.Invoke(Elapsed);
    }

    private void Update()
    {
        if (!_isRunning)
        {
            return;
        }

        // deltaTime is affected by timeScale — in slow motion it accrues that much slower.
        _elapsedSeconds += Time.deltaTime;

        int hundredths = (int)(_elapsedSeconds * 100.0);
        if (hundredths == _lastShownHundredths)
        {
            return;
        }

        _lastShownHundredths = hundredths;
        _label.text = Elapsed.ToString(TIME_FORMAT);
    }
}
```

The accumulator being a **`double` is deliberate.** As a `float`, ten minutes at
60fps means more than thirty thousand additions, and rounding error builds up
across them. For a time attack comparing records to the hundredth of a second,
that's an awkward size to ignore. Switching to `double` costs essentially
nothing, so just use `double`.

**Which one is right comes down to how pause is implemented.** If `timeScale`
freezes the whole game, subtraction is simpler and carries no error. If the timer
needs separate control, or pause has nothing to do with `timeScale`, accumulation
is the one.

### Storing a record

A record is two things: **a length and a point in time.** Both are easiest stored
as integers.

```csharp
[Serializable]
public class RunRecord
{
    public long elapsedMilliseconds;   // the record — a length
    public long achievedAt;            // when it was set — Unix milliseconds
}

// Save
var record = new RunRecord
{
    elapsedMilliseconds = (long)timer.Elapsed.TotalMilliseconds,
    achievedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
};

// Display
TimeSpan best = TimeSpan.FromMilliseconds(record.elapsedMilliseconds);
DateTimeOffset when = DateTimeOffset.FromUnixTimeMilliseconds(record.achievedAt);
string line = $"{best.ToString(TIME_FORMAT)}  ({when.ToLocalTime():yyyy-MM-dd})";
```

**Not storing strings is the point.** Neither culture nor format gets a say, and
a `long` goes into Unity's list of serializable field types as a plain integer
(`DateTime` isn't on that list). That the serializer decides your storage format
is something I covered in [the JsonUtility post](/en/posts/unity-jsonutility/).

### Where not to use it

- **Timing a run by subtracting `DateTime.Now`.** The device clock is
  player-editable and jolts on automatic sync.
- **Writing separators plainly in a `TimeSpan` format.** It's `@"mm\:ss"`, not
  `"mm:ss"`.
- **Holding elapsed time in a `DateTime`.** Past 24 hours it rolls into a date.
  A length is a `TimeSpan`.
- **Pairing `HH` with `tt`.** The output is redundant and it won't parse.

## Summary

- **A point is a `DateTime`; a length is a `TimeSpan`.** A time attack measures
  lengths — and subtracting two `DateTime`s gives a `TimeSpan` anyway.
- **`TimeSpan` formats need separators as literals.** In the docs' words, they
  "don't include placeholder separator symbols." Write `@"mm\:ss\.ff"`. A lone
  specifier needs a `%`.
- **`Time.time` is affected by `timeScale`; `unscaledTime` and
  `realtimeSinceStartup` aren't.** Which one you pick *is* the answer to "does
  pausing stop the timer."
- **Accumulating `deltaTime` also stops under `timeScale`.** But handling a pause
  that doesn't use `timeScale` takes the accumulation approach — and there the
  accumulator should be a `double`, not a `float`.
- **Don't time a record off the device clock.** `DateTime.Now` reads a value the
  player can change.
- **`DateTime` is for "when it was set."** Even there, `HH`+`tt` blocks parsing
  and `ToString` follows the culture.
- **Store two integers.** The length as milliseconds in a `long`, the moment via
  `DateTimeOffset.ToUnixTimeMilliseconds()`.

Sometimes what you're looking for and what you clip don't line up. Search for
"showing time on the UI" and current-time utilities come up first — but **a time
attack needed a stopwatch, not a clock.** The type only settled once I changed
the question from "what time is it" to "how much has passed."

---

### References

- [Custom TimeSpan format strings — .NET docs](https://learn.microsoft.com/en-us/dotnet/standard/base-types/custom-timespan-format-strings)
- [Custom date and time format strings](https://learn.microsoft.com/en-us/dotnet/standard/base-types/custom-date-and-time-format-strings)
- [DateTime.ToString](https://learn.microsoft.com/en-us/dotnet/api/system.datetime.tostring)
- [DateTimeOffset.ToUnixTimeMilliseconds](https://learn.microsoft.com/en-us/dotnet/api/system.datetimeoffset.tounixtimemilliseconds)
- [Time — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Time.html)
- [Serialization rules — Unity Manual](https://docs.unity3d.com/Manual/script-serialization-rules.html)

The source this post started from is [김잉장 — \[Unity\] Displaying the current time with DateTime](https://icat2048.tistory.com/445)
(2019-11-19). The original is about the current time; the elapsed-time side was
checked separately against the .NET and Unity documentation.
