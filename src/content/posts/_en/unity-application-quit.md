---
pubDatetime: 2026-09-30T18:00:00+09:00
title: "On Android, escape Is the Back Button"
lang: en
translationKey: unity-application-quit
featured: false
draft: false
tags:
  - Unity
  - C#
  - Mobile
  - Editor
description: "The advice to split with #if UNITY_EDITOR because play mode doesn't stop is correct. But ship this script to Android and the back button becomes a quit button — and the docs don't recommend this function on Android in the first place."
---

I clipped this while looking for **how to quit a built game** and **how to stop
play mode in the Editor** during development. Two questions, and this post
answers both at once — use `Application.Quit()`, and since play mode doesn't
stop in the Editor, split it with `#if UNITY_EDITOR`. That's the whole 2019
post. It's short.

> It quits normally in a built application, but in the Unity editor play mode
> doesn't stop. So you have to write the editor and the program run separately.

**A fair observation, and the solution offered is correct.** But the key the
example picked to quit with is `escape`. On Android, **that one word is a
different thing.** And the current documentation says **not to use
`Application.Quit` on Android** at all.

## Table of Contents

## The Editor Split Is Correct

Start with what's right. The clipping's second snippet:

```csharp
public void ExitGame()
    {
#if UNITY_EDITOR
        UnityEditor.EditorApplication.isPlaying = false;
#else
        Application.Quit(); // 어플리케이션 종료
#endif
    }
```

The current docs confirm the premise.

> **The `Application.Quit` call is ignored in the Editor.**

So turning `EditorApplication.isPlaying` off directly is the right response.

And it **did one easy-to-miss thing correctly.** It doesn't put `using
UnityEditor;` at the top of the file — it writes the full name,
`UnityEditor.EditorApplication`. The `UnityEditor` namespace isn't included in
player builds, so a `using` at the top **breaks the build** even when the code
itself is hidden behind `#if`. Calling by full name inside the preprocessor
block avoids that.

I covered that distinction in [the attributes post](/posts/unity-attributes/)
too. What `#if UNITY_EDITOR` hides is **code**; the `using` sits outside it.

## On Android, `escape` Is the Back Button

The first snippet:

```csharp
public class ExampleClass : MonoBehaviour {
    void Update() {
        if (Input.GetKey("escape"))
            Application.Quit();

    }
}
```

On PC it does what you'd expect. Ship it to an Android build and the story
changes. Unity's docs describe **how to read the back button** like this:

> **By default this property is set to false, which means you're responsible for
> responding to Back button.**

And the way to respond is the problem.

> When false, developers can respond to the Back button by calling
> **`Input.GetKey` with `KeyCode.Escape`.**

**Android's back button arrives as `KeyCode.Escape`.** So with that script in
place, **the game quits every time the user presses back to close a menu.**
Behavior nobody asked for, attached by default.

The answer the docs actually point to for Android is setting that same property
to `true`.

> Setting it to true **minimizes the application on Android** and suspends the
> application on UWP.

Not quit — **minimize.** The same state as pressing the home button.

## The Docs Don't Recommend This Function on Android

Collecting the platform notes from `Application.Quit`'s documentation:

> **Android** — it's not recommended to create your own way of shutting down
> with `Application.Quit` **to prevent inconsistent user experience.** Use
> `Activity.moveTaskToBack` instead.

> **iOS** — Calling the `Application.Quit` method in the iOS Player **might
> appear to the user that the application has crashed.** In most cases the
> termination of application should be left at the user's discretion.

> **Web** — On the Web platform, `Application.Quit` stops the Web Player but
> **doesn't affect the web page front end.**

As a table:

| Platform | `Application.Quit()` |
|---|---|
| Windows / macOS / Linux | Quits as intended |
| Editor | **Ignored** |
| Android | **Not recommended.** Minimizing (`moveTaskToBack`) is the docs' answer |
| iOS | **May look like a crash.** Leave termination to the user |
| Web | Stops the player, leaves the page alone |

Which means **the only platform where a "quit script" fully makes sense is the
desktop.** There's a reason "Quit Game" menus are rare on mobile.

For reference, the doc the clipping links is the **Unity 5.3 Korean API page.**
Its link preview already carries the iOS note, but the body of the post never
mentions it.

On desktop you can also pass an exit code.

> **exitCode** — An optional exit code to return when the player application
> terminates on Windows, Mac and Linux. Defaults to 0.

## So How Do You Quit on Mobile — Homework

The docs stop at "not recommended" and hand off the alternative in one line. So
what do you call when you genuinely need to quit? **iOS already has an answer;
Android is still open.**

### iOS — Apple Says There Is No API

What Unity's iOS note links to is Apple's technical Q&A. The answer is
unambiguous.

> **There is no API provided for gracefully terminating an iOS application.**

> **Do not call the `exit` function.** Applications calling `exit` will appear
> to the user to have **crashed**, rather than performing a graceful termination
> and animating back to the Home screen.

> **Data may not be saved**, because `-applicationWillTerminate:` and similar
> `UIApplicationDelegate` methods will not be invoked if you call `exit`.

Unity's "might appear to the user that the application has crashed" comes
straight from here. So on iOS the task isn't finding a way to quit — it's
**not building a quit button.** If saving is the goal, put it at the pause
point, not the quit point.

### Android — I Haven't Checked Yet

Android is different. `Activity.moveTaskToBack`, the alternative the docs
offer, is **minimizing**, not quitting, and after "not recommended" no real
termination path is given.

Here's what needs checking. **The list below is not yet verified against
primary sources**, and I plan to dig into it and write a separate post.

- How grabbing the current Activity through `AndroidJavaObject` and calling
  `finish()` actually behaves
- How `System.exit` / `Process.killProcess` interact with the Unity player's
  lifecycle
- What `Application.Quit` actually calls internally on Android
- Whether Google Play has policy or UX guidance about an app terminating itself

**I won't fill this in by guessing.** What's confirmed by documentation right
now is "not recommended" and "minimize instead."

## `GetKey` Is True the Whole Time It's Held

Another problem in the first snippet. `Input.GetKey` is **true every frame
while the key is held**, so written this way in `Update`, `Application.Quit()`
gets called dozens of times a second.

Quitting only needs to happen once, so nothing visible goes wrong. But **the
moment you attach a confirmation dialog**, it opens every frame.
`Input.GetKeyDown`, which fires once on the press, is the right one.

Using a `KeyCode` instead of a string is also better — a typo becomes a compile
error.

```csharp
// original
if (Input.GetKey("escape"))

// once on press, and typos won't compile
if (Input.GetKeyDown(KeyCode.Escape))
```

One more. **The old `Input` class throws depending on project settings.** If
Active Input Handling in Player Settings is `Input System Package (New)`, this
line blows up at runtime.

```
InvalidOperationException: You are trying to read Input using the
UnityEngine.Input class, but you have switched active Input handling to
Input System package in Player Settings.
```

Use `Both` to keep both, and on a project that has moved to the Input System,
move the key check there too. I covered this in
[the InputField post](/posts/ugui-inputfield-name-entry/) as well.

## To Block or Clean Up Before Quitting

To attach "are you sure?" or to save right before quitting, there's a separate
event.

> Unity raises this event when the Player application **wants to quit.**

`Application.wantsToQuit` is the point at which **cancelling is still
possible.** In the docs' words, returning `false` means **"the quit process
cancels."**

It comes with platform caveats too.

> **The return value has no effect on iOS or iPadOS.** `Application.wantsToQuit`
> can't prevent termination in iOS or iPadOS.

> **This event is not always raised on Android platforms** because device
> activity is no longer visible when an application is paused.

> The return value of this event **is ignored when exiting Play mode in the
> Editor.**

For Android and Meta Quest the docs recommend `OnApplicationFocus` or
`OnApplicationPause` instead. Which means **"save right before quitting" isn't
a design that holds on mobile** at all. On mobile, the save point is pause, not
quit.

## Where and Why You'd Use It

A quit button is **a desktop-build feature**, and on mobile it has to become
something else. Collect that branching in one place and the UI side just calls
one method.

### One Quit, Branched by Platform

```csharp
using UnityEngine;

/// <summary>
/// Hook this to the single quit button. All platform differences are absorbed here.
/// </summary>
public class QuitController : MonoBehaviour
{
    [Header("Input")]
    [SerializeField, Tooltip("Whether to accept quitting from the keyboard too")]
    private bool _acceptEscapeKey = true;

    private void Update()
    {
        if (!_acceptEscapeKey)
        {
            return;
        }

        // On Android, Escape is the back button. That case is handled below.
#if UNITY_ANDROID && !UNITY_EDITOR
        return;
#else
        // Once on press, not every frame it's held.
        if (Input.GetKeyDown(KeyCode.Escape))
        {
            RequestQuit();
        }
#endif
    }

    /// <summary>Hook this to the quit button's OnClick.</summary>
    public void RequestQuit()
    {
#if UNITY_EDITOR
        // Quit is ignored in the Editor, so stop play mode directly.
        // A `using` at the top of the file breaks the player build. Use the full name.
        UnityEditor.EditorApplication.isPlaying = false;

#elif UNITY_ANDROID
        // Docs: creating your own shutdown with Application.Quit is not recommended.
        // Let the back button minimize the app instead.
        Input.backButtonLeavesApp = true;

#elif UNITY_IOS
        // Docs: may appear to the user as a crash. Leave termination to the user.
        Debug.Log("Don't surface a quit button on iOS.");

#elif UNITY_WEBGL
        // Docs: stops the player but doesn't affect the web page.
        Debug.Log("On WebGL, give a different exit path than a quit button.");

#else
        Application.Quit();
#endif
    }
}
```

Each `#elif` branch carries a comment saying **which documented sentence it
exists for.** The point is that nobody later asks "why is this like this?"

The iOS and WebGL branches only logging may look odd, but **that is what the
docs recommend.** On those platforms, taking the quit button out of the UI is
the right move.

### To Attach a Confirmation Dialog

"Are you sure you want to quit?" attaches through `wantsToQuit`. The advantage
is that it catches **both** the path from your button and a quit the OS
initiated.

```csharp
using UnityEngine;

public class QuitConfirmation : MonoBehaviour
{
    private bool _confirmed;

    private void OnEnable()
    {
        Application.wantsToQuit += OnWantsToQuit;
    }

    private void OnDisable()
    {
        Application.wantsToQuit -= OnWantsToQuit;
    }

    private bool OnWantsToQuit()
    {
        if (_confirmed)
        {
            return true;
        }

        ShowDialog();

        // Returning false cancels the quit process.
        return false;
    }

    /// <summary>When "Yes" is pressed in the dialog.</summary>
    public void Confirm()
    {
        _confirmed = true;
        Application.Quit();
    }

    private void ShowDialog()
    {
        // Bring up the confirmation UI.
    }
}
```

**Don't use this design on mobile.** The docs say the event isn't always raised
on Android, and on iOS the return value is ignored outright. Mobile saving
belongs in `OnApplicationPause`.

### Where Not to Use It

- **Binding `KeyCode.Escape` to quit on Android.** It's the back button.
- **Leaving a "Quit Game" button on mobile.** Android says not recommended, iOS
  looks like a crash.
- **Putting `using UnityEditor;` at the top of the file.** The player build
  breaks even with the code behind `#if`.
- **Taking quit input with `GetKey`.** True the whole time it's held. A dialog
  exposes it.
- **Putting mobile save logic in `wantsToQuit`.** It doesn't always arrive.
  `OnApplicationPause` is the place.
- **Using the old `Input` on an Input System project.** It throws.

## Wrapping Up

- **The Editor split is correct.** The docs say **"the `Application.Quit` call
  is ignored in the Editor"**, and turning off `EditorApplication.isPlaying` is
  the right response.
- **Calling `UnityEditor` by full name is also correct.** A `using` at the top
  breaks the player build even behind `#if`.
- **On Android, `KeyCode.Escape` is the back button.** The docs point at that
  key as the way to handle back. Shipped as is, **back becomes quit.**
- **The documented Android answer is `Input.backButtonLeavesApp = true`** —
  **minimize**, not quit.
- **The docs don't recommend `Application.Quit` on Android**, and say it **"might
  appear to the user that the application has crashed"** on iOS. On Web it
  doesn't affect the page.
- So **the desktop is the only place a "quit script" fully holds.**
- **`GetKeyDown`, not `GetKey`.** And a `KeyCode` beats a string.
- **To block or clean up, `Application.wantsToQuit`** — but the return value is
  ignored on iOS and the event isn't always raised on Android. Mobile belongs in
  `OnApplicationPause`.
- **Apple nailed iOS down**: "there is no API provided for gracefully
  terminating an iOS application," and `exit` looks like a crash. **Android's
  real termination path I haven't checked yet** — that's a separate post to dig
  into.

Short post, short ending — which is fine. But the key this one picked for its
example happened to be `escape`, and **that key names a different thing on
different platforms.** One line that meant "quit" on the desktop means "back" on
Android. That single word shows that quitting itself carries a different meaning
platform to platform.

---

### References

- [Application.Quit — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Application.Quit.html)
- [Application.wantsToQuit — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Application-wantsToQuit.html)
- [Input.backButtonLeavesApp — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Input-backButtonLeavesApp.html)
- [KeyCode — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/KeyCode.html)
- [QA1561: How do I programmatically quit my iOS application? — Apple](https://developer.apple.com/library/archive/qa/qa1561/_index.html)

The starting point for this post was [유알 — \[Unity3D\] 게임 종료 스크립트](https://m.blog.naver.com/os2dr/221536765981)
(2019-05-13). I followed its editor-split solution as written, then checked the
key its example picked and `Application.Quit`'s per-platform behavior against
the current Scripting Reference. Quotes from it are my translations; the Korean
comment in the sample is the author's.
