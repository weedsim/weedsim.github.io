---
pubDatetime: 2026-10-12T19:30:00+09:00
title: "What Holds the Scroll Position Is the Write Order, Not the Settings"
lang: en
translationKey: scrollrect-reset-timing
featured: false
draft: false
tags:
  - Unity
  - C#
  - UI
  - UGUI
  - Scroll
  - Animator
description: "Clipped while working through the annoyances of a Scroll View: a record of a popup's scroll view opening at the bottom every time. The author traced it to the parent's open animation but wrote that he wasn't sure what the interaction was. The docs don't write the within-frame order down either. What they do give is a way to find out and a way to defer."
---

**While working through the annoyances a Scroll View threw at me** one by one,
I went looking for more material and clipped a short error record. It's a TIL
that ends in four parts — symptom, attempts, cause, fix — and it's from 2023.
A popup's scroll view goes to the bottom every time it opens, and resetting it
with `verticalNormalizedPosition = 1` doesn't hold. The author traced the cause
to **a popup-open animation sitting on the parent**. That's where the record
ends, and the line right after it is where this post starts.

> I'm not sure exactly what interaction it had with that animation, but

**This post tries to fill in that "not sure" from the docs.** To put the
conclusion first: the docs don't write the within-frame order down **in prose**
either. What they do write down is two things — a way to find out, and a way to
defer so you don't have to know.

This blog has two uGUI posts.
[What Decides Which Way Content Grows Is the Pivot, Not the Anchor](/en/posts/ugui-scroll-view-content/)
and [Control Child Size Changes Who Gets Asked for the Size](/en/posts/ugui-layout-group/).
Those two covered **what decides the size**. This one takes the same
`ScrollRect` and looks only at **when you write the value**. Where they
overlap, I don't defer by link — I carry as much as is needed here again.

I verified six things. **When the canvas calculates is written down by name in
the docs**, **the within-frame order lives only in a diagram and the prose
points at Profiler markers instead**, **the docs say you can't rely on the
order of the same event function across different GameObjects**, **the order
between scripts is settable but the order against the animation system isn't
what that setting covers**, **there are two ways to receive the moment a clip
ends**, and **a `ScrollRect` carries a state that moves on its own regardless
of what you assign.**

Checked on **2026-10-12**, against Unity **6.6** and uGUI **2.7.0**.

## Table of contents

## A bug that goes away under a breakpoint is a clue

The line in the record with the most information isn't the cause or the fix.
It's the last line of the attempts.

> In particular, when I put a breakpoint on the line that resets the scroll
> view position, scrollRect.verticalNormalizedPosition = 1, and went slowly,
> the initial position setting sometimes worked correctly.

**Settings don't react to breakpoints.** If the Pivot is wrong it's wrong when
you stop and look, and if the Content size is wrong it's wrong when you go
slowly. What goes away when you pause and comes back when you don't isn't the
value — it's **the order the value is written in.** So the attempts before it,

> I tried changing the pivot, copying another scroll view's settings as-is,
> and this and that, but the same thing kept happening.

were looking at the wrong axis from the start. No amount of changing things on
the settings axis moves a problem on the order axis.

This symptom has three causes that look identical. All three present as
"opened it, it's at the bottom".

| Cause | What's out of step | What the docs give you |
| --- | --- | --- |
| The layout hasn't settled | the size that is the ratio's denominator isn't decided | `Canvas.ForceUpdateCanvases` |
| Something writes later | other code or a clip overwrites after you assign | Profiler markers · execution order setting |
| A moving state is left over | the assignment landed but velocity remains | `ScrollRect.StopMovement` |

What the record ran into is the second, and the third may have been layered on
top. The first is the territory of the two earlier posts, so this one only
touches its timing.

## When the canvas calculates is written down

The description of `Canvas.ForceUpdateCanvases` simply writes down half of
this problem.

> Force all canvases to update their content.

> A canvas performs its layout and content generation calculations at the end
> of a frame, just before rendering, in order to ensure that it's based on all
> the latest changes that may have happened during that frame.

> This means that in the Start callback and the first Update callback, the
> layout and content under the canvas may not be up-to-date.

**`Start` and the first `Update` are named in the docs.** The canvas calculates
at the end of the frame, just before rendering. So the layout you read in the
`Start` or `OnEnable` of the very frame you opened the popup in is not current.

Layer onto that what kind of value `verticalNormalizedPosition` is, and the
result falls out.

> The vertical scroll position as a value between 0 and 1, with 0 being at the
> bottom.

**It's a ratio between 0 and 1, and 0 is the bottom.** Calling it a ratio means
there's a denominator somewhere else. If the Content's size isn't decided yet,
neither is the place `1` points at. The author changing Content settings and
changing the Pivot was groping along this axis, and the direction wasn't wrong.
It just wasn't **a matter of changing the size, it was a matter of writing
after the size is decided.**

The size side is written up in the Pivot post linked above. This one looks only
at timing.

## The order within a frame exists only as a diagram

So within one frame, which comes first, the script or the animation? The manual
has a page for exactly this. And **that order is in the page's diagram, not its
prose.** What the prose does spell out are the expansions of some of the
diagram's nodes — physics, animation, rendering, coroutine resumption points,
and the limitations. **There is nowhere a sentence states what comes before or
after `Update` and `LateUpdate`.** What the animation prose gives is also a
**list** of the functions that get called — `OnAnimatorMove`, `OnAnimatorIK`,
and the seven on `StateMachineBehaviour`.

So where does it say to look if you want the order?

> Other animation functions shown in the diagram are internal to the animation
> system and are provided for context. These functions have associated Profiler
> markers so you can use the Profiler to see when in the frame Unity calls
> them.

> Knowing when Unity calls these functions can help you understand exactly when
> the event functions you do call are executed.

**The docs' answer is "use the Profiler".** That's the official instrument for
the author's "not sure exactly what the interaction was". Don't guess — look at
the markers for when in the frame it gets called.

And the same page draws a line under relying on order at all.

> In general, you can't rely on the order in which the same event function is
> invoked for different GameObjects, except when the order is explicitly
> documented or settable.

> You can't specify the order in which an event function is called for
> different instances of the same MonoBehaviour script.

**"You can't rely on the order" is the docs' own sentence.** If the popup
script and the scroll view script sit on different GameObjects, there's no
guarantee about the order of their two `OnEnable` calls. The record's second
fix —

> Make the component that has the scroll view independent from the parent
> component that has the animation.

— inherits that absence of a guarantee on top of the "it looks off" price it
already names. Pull it off the parent and the animation's influence is cut, but
in exchange you're in a state where **you don't know which one turns on
first.**

## The order is settable, but only between scripts

That sentence about not relying on order came with an exception attached —
"except when the order is explicitly documented or settable". There's a
separate setting that the *settable* points at.

> all instances of a script with a lower execution order value are executed
> before any instances of a script with a higher execution order value,
> regardless of which GameObject they're attached to.

It's Script Execution Order in the project settings, and in code it's the
`[DefaultExecutionOrder]` attribute. **The lower value goes first, and it
doesn't matter which object it's attached to.** If you want to pin the order of
two scripts the way the record needs — the popup opens, then the scroll gets
reset — this setting is the official instrument.

What it doesn't apply to is spelled out. The docs put two items under "doesn't
affect".

> The order of functions marked with the [RuntimeInitializeOnLoadMethod]
> attribute.

> OnDisable and OnDestroy functions.

**It doesn't work on the teardown side.** Don't try to pin the order of cleanup
code that runs as the popup closes with this setting.

And for this post's problem there's **a more important limit**. What this
setting decides is **the order between scripts**. There's no statement on that
page about this value changing the order between a script and the animation
system, and I couldn't verify one. Since the record's cause was the animation,
**this setting alone doesn't finish the job.**

## The end isn't something you check for, it's something you receive

The record's third fix points the right way.

> Check the animation's end time and run UIHelper.ResetScrollRect();

But "check the end time" is the spot where the docs hand you an event. There
are two instruments.

First, put it in the clip itself.

> Use an Animation Event to call a function at a specific point in time.

That's an Animation Event. Drop a marker at the end of the clip and call a
function there. One constraint is written down.

> Note that Animation Events only support methods with a single parameter.

**You can only pick a method with a single parameter.** A reset function won't
need an argument, so this doesn't get in the way. Sometimes a clip that came in
as an asset can't be touched in the Animation window, but that's the window's
problem and the import settings have a place of their own —
[What's Read-Only Isn't the Clip, It's the Animation Window's View](/en/posts/imported-clip-readonly/)
has that written up.

Second, receive it from the state machine.

> Invoked on the last update frame when a state machine evaluates this state.

> Implement this message to react to a state ending.

> OnStateExit is invoked when a transition to a state has completed or has been
> interrupted.

That's `StateMachineBehaviour.OnStateExit`. The description literally says to
implement it to react to a state ending. There are two traps. One is the Note
the docs attach.

> Note: OnStateExit may be invoked multiple times on the same state if that
> state is synchronized on multiple layers.

**It can be invoked several times.** So the reset you call from here **must
give the same result when called several times.** A function that assigns the
position to a specific value satisfies that on its own.

The other trap is on the side the docs don't write about. "Invoked on the last
update frame" — **it's invoked on the last update frame.** Which comes first on
that frame, the animation writing its values or `OnStateExit` being invoked,
that page doesn't say, and I couldn't verify it. Stitch the two sentences
together and you get "it can be overwritten again by that last frame's
animation output", but **that's my inference.** So the example below doesn't
lean on `OnStateExit`; it defers one more frame as its default.

If you do have to poll for the end, don't write a number — read it off the
state.

> Returns an AnimatorStateInfo with the information on the current state.

> The integer part is the number of times the State has looped.

> The fractional part is a percentage (0-1) that represents the progress of the
> current loop.

Get the state with `Animator.GetCurrentAnimatorStateInfo(layerIndex)` and look
at `normalizedTime`. **The integer part is the loop count and the fractional
part is the progress, so a clip that runs once is done when it reaches 1.**
That beats typing the clip's length into the Inspector — swap the clip and the
number is wrong while this value isn't.

## There's also a way to defer to the end of the frame

Instead of finding out the order, there's a road that makes it so **you don't
have to know**. The execution order page writes down where coroutines resume.

> Suspended coroutines can resume at different points in the execution sequence
> depending on the yield instruction used.

> For example, coroutines that use WaitForEndOfFrame resume at the end of the
> frame, while those that use WaitForFixedUpdate resume at the end of the fixed
> update step.

**`WaitForEndOfFrame` resumes at the end of the frame.** That's later than
writing from `Update`, and it lets you stand "later" without working out the
order. That said, whether it's **exactly the same point** as where the canvas
calculates — "at the end of a frame, just before rendering" — is something that
page doesn't say. What I verified stops at both being toward the end of the
frame.

There's a corner here that isn't guaranteed either.

> The exact order of execution between resuming coroutines and asynchronous
> tasks is not guaranteed.

The order between resuming coroutines and async tasks isn't guaranteed. If
you're doing the reset on the `async` side, read that sentence first.

## A ScrollRect moves regardless of what you assign

There's one verb in the record's cause sentence.

> The popup opened, the initial position was properly set by
> scrollRect.verticalNormalizedPosition = 1, and then the animation ran and
> the scroll view bounced.

**"Bounced."** And bouncing is a setting that ships inside `ScrollRect`.

> Unrestricted, Elastic or Clamped.

> Use Elastic or Clamped to force the content to remain within the bounds of
> the Scroll Rect.

> Elastic mode bounces the content when it reaches the edge of the Scroll Rect.

That's `Movement Type`, and `Elastic` bounces at the edge. On top of it, the
sliding that happens after you let go is a separate setting.

> When Inertia is set the content will continue to move when the pointer is
> released after a drag.

> When Inertia is not set the content will only move when dragged.

**"Continue to move"** — it keeps moving after the input is over. That movement
is held as state, and it has a name in the API.

> The current velocity of the content.

> Sets the velocity to zero on both axes so the content stops moving.

`velocity` and `StopMovement()`. **Assign only the position while the velocity
isn't zero and that velocity keeps being applied from the next frame on.**
Given that the record's symptom was "the assignment lands but it goes back
down", this side looks the same from the outside.

So a reset isn't one line of position assignment, it's **two**. Kill the
velocity, then write the position. The criteria for choosing `Movement Type`
and `Inertia` themselves are written up in
[What Decides Which Way Content Grows Is the Pivot, Not the Anchor](/en/posts/ugui-scroll-view-content/).

One thing to be clear about, though. **From this record alone there's no way to
know what that animation had keyed.** The clip's contents aren't in the
clipping. So "which value of the `ScrollRect` the animation overwrote" is
unverifiable territory, and that's the exact spot the author said he wasn't
sure about. What can be verified stops at the instruments above being in the
docs.

If you want to see who moved it, there's a callback.

> Callback executed when the position of the child changes. Provides the
> normalized position as a Vector2.

That's `onValueChanged`. Log it from right after the reset and **whether the
position changes again after your assignment** becomes visible. It's the one
line that separates guessing from measuring.

## Where and why you'd use it

### A working example

This is a popup base class. It's the "structure that takes the animation on the
base window and makes a function to run when it ends", which the record's third
fix describes, built from the instruments the docs give.

```csharp file="Scripts/UI/PopupWindow.cs"
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Animator))]
public class PopupWindow : MonoBehaviour
{
    [Header("References")]
    [Tooltip("The scroll view to return to its initial position on open")]
    [SerializeField]
    private ScrollRect _scrollRect;

    [Tooltip("The ScrollRect's Content. Used to settle the layout first")]
    [SerializeField]
    private RectTransform _content;

    [Header("Initial position")]
    [Tooltip("1 is the top, 0 is the bottom")]
    [Range(0f, 1f)]
    [SerializeField]
    private float _initialVerticalPosition = 1f;

    [Tooltip("The layer the open animation lives on")]
    [SerializeField]
    private int _openLayerIndex;

    private Animator _animator;

    private void Awake()
    {
        if (!TryGetComponent(out _animator))
        {
            Debug.LogError("There is no Animator.", this);
        }
    }

    private void OnEnable()
    {
        // Don't just assign the position here and call it done. The canvas
        // calculates at the end of the frame, and the open animation keeps
        // writing values after that.
        StartCoroutine(ResetAfterOpenAnimation());

        if (_scrollRect != null)
        {
            _scrollRect.onValueChanged.AddListener(HandleScrollChanged);
        }
    }

    private void OnDisable()
    {
        // Coroutines stop along with being disabled. Remove the listener by
        // hand.
        if (_scrollRect != null)
        {
            _scrollRect.onValueChanged.RemoveListener(HandleScrollChanged);
        }
    }

    private IEnumerator ResetAfterOpenAnimation()
    {
        // Give the state a frame to change. On the frame it was enabled, the
        // state info can still be the previous state.
        yield return null;

        if (_animator != null)
        {
            // Don't write the clip length as a number. The integer part is the
            // loop count and the fractional part is the progress, so a clip
            // that runs once ends at 1.
            while (_animator.GetCurrentAnimatorStateInfo(_openLayerIndex)
                       .normalizedTime < 1f)
            {
                yield return null;
            }
        }

        // Defer to the end of the frame. Past this point there's no code left
        // that writes values this frame.
        yield return new WaitForEndOfFrame();

        ResetScrollPosition();
    }

    // Public so an Animation Event can call it directly. Calling it several
    // times gives the same result.
    public void ResetScrollPosition()
    {
        if (_scrollRect == null)
        {
            return;
        }

        // Settle the size that will be the ratio's denominator first.
        if (_content != null)
        {
            LayoutRebuilder.ForceRebuildLayoutImmediate(_content);
        }

        Canvas.ForceUpdateCanvases();

        // With velocity left over, the position you assigned gets pushed again
        // from the next frame on.
        _scrollRect.StopMovement();
        _scrollRect.verticalNormalizedPosition = _initialVerticalPosition;
    }

    // Left in to see whether anything else moves it after the reset.
    private void HandleScrollChanged(Vector2 normalizedPosition)
    {
        Debug.Log($"scroll position {normalizedPosition.y:F3}", this);
    }
}
```

There's a reason `_scrollRect`, `_content` and `_animator` don't use `?.`. They
are all `UnityEngine.Object`, and a reference left empty in the Inspector can
end up in a state that **looks like null but isn't C#'s null**. So they use
`== null` / `!= null` comparisons. For a plain C# object, `?.` is correct.

Making `ResetScrollPosition()` `public` is the core of this structure. **The
coroutine road and the Animation Event road call the same function.** If you
can touch the clip, a marker at its end is the shortest path; if you can't, the
coroutine fills the same spot. Calling it from `OnStateExit` is fine too —
because it writes the same value however many times it runs.

The log in `HandleScrollChanged` is **for diagnosis, not for shipping.** If it
prints once more right after the reset, something is still writing, and that's
when you go look at the Profiler markers. Once you've found the cause, delete
the listener along with it.

### How to choose

| Situation | What to use |
| --- | --- |
| Top of the list on open | `StopMovement()` → `verticalNormalizedPosition = 1` |
| The size has to settle first | `LayoutRebuilder.ForceRebuildLayoutImmediate` |
| Layout is off in `Start` and the first `Update` | `Canvas.ForceUpdateCanvases` |
| After the open animation finishes | an Animation Event at the clip's end |
| You can't touch the clip | poll `normalizedTime >= 1`, or `OnStateExit` |
| You don't know what writes later | `WaitForEndOfFrame` to defer to the frame's end |
| Pin the order of two scripts | Script Execution Order · `[DefaultExecutionOrder]` |
| Pin the teardown order | that setting won't do it (`OnDisable`/`OnDestroy` excluded) |
| You want the position within the frame | the Profiler's animation markers |
| See whether it moves again after a reset | an `onValueChanged` log |

Here's the order to judge in.

- **Measure first.** Hang a log on `onValueChanged` and see whether the
  position changes again after the assignment. If it doesn't, it's not an order
  problem, it's a size problem.
- **If it does change, defer.** `WaitForEndOfFrame` is the cheapest. You get to
  stand "last" without working out the order.
- **If it still changes, it's the clip.** Move it to after the open animation
  ends. An Animation Event at the clip's end is the most precise.
- **Kill the velocity separately.** Whichever of the three roads you take, call
  `StopMovement()` along with it. Assigning the position doesn't touch the
  velocity.

### Where not to use it

- **Assigning the scroll position in `Start` or the first `Update` and calling
  it done.** The docs name those two spots and say "may not be up-to-date".
- **Typing the clip length into the Inspector as a number.** Swap the clip and
  only the number is wrong. `normalizedTime` isn't.
- **Doing something that must run once inside `OnStateExit`.** The docs wrote
  "may be invoked multiple times". Keep only idempotent work like a reset there.
- **Using Script Execution Order to pin the order against the animation.** What
  that setting decides is the order between scripts. I found no statement that
  it sets the order against the animation system.
- **Relying on that setting for the order of `OnDisable`/`OnDestroy`.** The
  docs put those two under "doesn't affect".
- **Assigning only the position and leaving out `StopMovement()`.** `velocity`
  is separate state, and if it's left over the content moves again from the next
  frame.
- **Relying on the `OnEnable` order of two different objects.** The docs wrote
  "you can't rely on the order".
- **Shipping the diagnostic log as-is.** `onValueChanged` fires every time the
  position changes. One drag floods the log.

## Summary

- The most valuable line in the record isn't the cause, it's **the attempt
  noting that going slowly under a debugger sometimes worked.** Settings don't
  react to breakpoints. A symptom that goes away when you pause is an order
  problem.
- The canvas calculates **"at the end of a frame, just before rendering"**, and
  the docs **name `Start` and the first `Update`** when saying the layout may
  not be up to date. `Canvas.ForceUpdateCanvases` is what pulls it forward.
- `verticalNormalizedPosition` is **"a value between 0 and 1, with 0 being at
  the bottom"**. It's a ratio, so the size that is its denominator has to be
  decided first.
- The within-frame order lives **in the manual's diagram, not its prose**. What
  the prose points at is **the Profiler markers** — "use the Profiler to see
  when in the frame Unity calls them."
- There's a line drawn under relying on order at all: **"you can't rely on the
  order in which the same event function is invoked for different
  GameObjects"**.
- The order between scripts is set with Script Execution Order and
  `[DefaultExecutionOrder]` — the lower value goes first. But it **doesn't work
  on `OnDisable`/`OnDestroy`**, and there's no statement that it sets the order
  against the animation system.
- The moment a clip ends is received through an **Animation Event** ("call a
  function at a specific point in time", single parameter at most) or
  **`OnStateExit`** ("react to a state ending"). The latter **"may be invoked
  multiple times"**.
- If you have to poll, look at
  `GetCurrentAnimatorStateInfo(layer).normalizedTime`. **The integer part is the
  loop count, the fractional part is the progress.**
- To make the order irrelevant, there's **`WaitForEndOfFrame`**. The docs say it
  "resume at the end of the frame". Only, the order between coroutines and async
  tasks isn't guaranteed.
- A `ScrollRect` holds **`velocity`** as state and `Elastic` bounces at the
  edge. Assigning the position doesn't touch the velocity, so **call
  `StopMovement()` along with it.**
- What the animation actually overwrote **can't be verified from this record
  alone.** The clip's contents aren't in the clipping. In place of guessing,
  an `onValueChanged` log and the Profiler markers fill that spot.

---

### References

- [Event function execution order — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/execution-order.html)
- [Script execution order — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/script-execution-order.html)
- [Animation Events — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/script-AnimationWindowEvent.html)
- [Canvas.ForceUpdateCanvases — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Canvas.ForceUpdateCanvases.html)
- [StateMachineBehaviour.OnStateExit — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/StateMachineBehaviour.OnStateExit.html)
- [Animator.GetCurrentAnimatorStateInfo — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Animator.GetCurrentAnimatorStateInfo.html)
- [AnimatorStateInfo.normalizedTime — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AnimatorStateInfo-normalizedTime.html)
- [Scroll Rect — uGUI 2.7 manual](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/manual/script-ScrollRect.html)
- [ScrollRect — uGUI 2.7 API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.ScrollRect.html)
- [LayoutRebuilder — uGUI 2.7 API](https://docs.unity3d.com/Packages/com.unity.ugui@2.7/api/UnityEngine.UI.LayoutRebuilder.html)

The starting point for this post was
[유니티 스크롤뷰 초기 설정 에러 기록](https://jjing-log.tistory.com/98)
(jjiing, 2023-04-24), in Korean; the quotes from it are my translations. I
followed its symptom, cause and three fixes as written, and checked the part it
called "not sure exactly" against both the current Unity 6.6 manual and
scripting reference and the uGUI 2.7.0 docs. Checked on 2026-10-12.
