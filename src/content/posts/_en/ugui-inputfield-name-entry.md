---
pubDatetime: 2026-09-28T18:00:00+09:00
title: "Why Enter Does Nothing in an InputField: The Condition Reads a Cache"
lang: en
translationKey: ugui-inputfield-name-entry
featured: false
draft: false
tags:
  - Unity
  - C#
  - UI
  - UGUI
  - Input
description: "Code written so a name can be entered by keyboard or by mouse — except the keyboard path does nothing until the mouse button has been clicked once. The condition reads a string cached in Awake, not the input field."
---

I clipped this while adding **login** to a game project — building the UI that
takes a nickname and a password. I was also looking for the **output** side, how
to lay a ranking board on screen, and this post happens to join the two: it
takes a name and saves it, and its sequel builds a ranking out of that value.

It's a 2021 post on taking a player name with UGUI's `InputField`. It walks
through the input field's structure, then adds a background image and a confirm
button to build an actual name-entry window. The author states why the code
exists:

> At that point the player types the name on the keyboard and then has to move
> their hand back to the mouse..! I didn't want that, so **I wrote a script
> where both pressing the button on the keyboard and clicking the input button
> with the mouse would work.**

Clear goal. But **the keyboard path in that code does nothing until the mouse
button has been clicked once.** Code written to avoid reaching for the mouse
requires reaching for the mouse exactly once to unlock.

## Table of Contents

## The Input Field's Structure Is Described Correctly

Start with what's right. The clipping explains why the input field is so simple:

> because it really doesn't include any functionality beyond displaying the
> entered value

A fair observation. Creating an `InputField` object gives you two children,
**Placeholder** and **Text**, and the manual says the same thing the clipping
does.

> **Placeholder** — An **optional** "empty" Graphic to show that the Input
> Field is empty of text.

> **Text** — drag the object to the Input Field's *Text* property to enable
> editing. The *Text* property of the Text control itself will change as the
> user types.

**"Optional"** is the documentation's own word for Placeholder. Which makes the
clipping's next piece of advice correct too.

> It isn't a required element, so deleting it won't cause any disaster. To
> avoid a possible reference error, clear the Placeholder value on the parent
> InputField object's input field component so it becomes None.

Pointing out that you should also clear the component's reference is a good
catch.

One addition: in current Unity this component's menu path is
`UI (Canvas)/Legacy/Input Field`. **It sits under Legacy in the component
menu.** For a new project, TextMeshPro's `TMP_InputField` is the default
choice. The clipping does note "you can also choose depending on whether you
use TMP", but the weight of that choice has shifted since.

## Enter Never Works, Not Once

The clipping's code:

```csharp
using UnityEngine;
using UnityEngine.UI;

public class ResultNameInput : MonoBehaviour
{
    public InputField playerNameInput;
    private string playerName = null;

    private void Awake()
    {
        playerName = playerNameInput.GetComponent<InputField>().text;
    }

    private void Update()
    {
        //키보드
        if (playerName.Length > 0 && Input.GetKeyDown(KeyCode.Return))
        {
            InputName();
        }
    }

    //마우스
    public void InputName()
    {
        playerName = playerNameInput.text;
        PlayerPrefs.SetString("CurrentPlayerName", playerName);
        GameManager.instance.ScoreSet(GameManager.instance.score, playerName);
    }
}
```

Just follow **where `playerName` changes**. Two places.

- `Awake()` — the input field is still empty, so it gets `""`.
- `InputName()` — the only place an actual typed value lands.

**Typing does not change `playerName`.** Typing changes the input field's
`text`; `playerName` is a **cache** that copied that value once, at `Awake`.

And the condition in `Update` reads that cache.

| Step | `InputField.text` | `playerName` | Pressing Enter |
|---|---|---|---|
| Start | `""` | `""` | Condition false — nothing |
| Type "HY" | `"HY"` | `""` | **Condition false — nothing** |
| Click confirm with mouse | `"HY"` | `"HY"` | — (the button runs it directly) |
| From then on | `"HY…"` | `"HY"` | Condition true — it works |

**Row three has to happen before row two opens.** The keyboard path only comes
alive **after the mouse has clicked the button once.** The very action the
author set out to remove is a precondition.

Here's how the author read that condition:

> it decides "ah, they've finished entering" based on one or more characters of
> what is presumably a name, plus an Enter press. If nothing has been entered
> it doesn't run.

**"If nothing has been entered it doesn't run" is a correct outcome.** The
reason is different, though. The intent is "did they type at least one
character?", while what's actually tested is **"has `InputName` ever run?"**

## Two Ways to Fix It

### Read the Current Value Instead of the Cache

The minimal fix is one line. Have the condition look at **the input field
itself**, not the cache.

```csharp
private void Update()
{
    if (_playerNameInput.text.Length > 0 && Input.GetKeyDown(KeyCode.Return))
    {
        Submit();
    }
}
```

Once you do that, the `playerName` field has no reason to exist for the test.
**Keeping the state in two places was the cause**, so delete the field and read
`.text` when you need it.

One documented nuance is worth knowing here.

> **text** — Input field's current text value. **This is not necessarily the
> same as what is visible on screen.**

Set `contentType` to `Password` and the screen shows `*` while `text` is the
real string. It's an API that reads the *value*, not what is *shown*.

If you're building a password field, that distinction matters. **`Password`
hides the screen only**; the value sits in memory as plain text. It's a display
setting, not a security setting.

### `onEndEdit` Instead of `Update`

Rather than checking a key every frame, you can let the input field tell you.
From the manual:

> **On End Edit** — A UnityEvent that is invoked when the user finishes editing
> the text content **either by submitting or by clicking somewhere that removes
> the focus.**

Wire a method to `On End Edit` in the Inspector, or attach it in code.

```csharp
private void OnEnable()
{
    _playerNameInput.onEndEdit.AddListener(OnEndEdit);
}

private void OnDisable()
{
    _playerNameInput.onEndEdit.RemoveListener(OnEndEdit);
}

private void OnEndEdit(string value)
{
    // The confirmed string arrives as the argument. No cache to consult.
    if (value.Length == 0) { return; }
    Submit();
}
```

But exactly as quoted, **this event also fires when focus is lost.** Clicking
elsewhere submits too, so if the goal is "submit only on Enter", this alone
isn't it. The API reference also lists `onSubmit`, but **its description is
worded identically** to `onEndEdit`, so I won't claim a difference the docs
don't draw.

That's why this post's example **keeps the Enter check in `Update` and reads
the value straight from `.text`.** Within what the documentation confirms,
that's the closest thing to the original's intent.

## `Input.GetKeyDown` Throws Under the Input System

The original uses `Input.GetKeyDown(KeyCode.Return)`. Depending on project
settings, that becomes a **runtime exception.** The message, as filed on
Unity's Issue Tracker:

```
InvalidOperationException: You are trying to read Input using the
UnityEngine.Input class, but you have switched active Input handling to
Input System package in Player Settings.
```

If **Active Input Handling** in Player Settings is `Input System Package
(New)`, the old `Input` class throws this. To use both, set it to `Both`.

On a project that has moved to the Input System, the key check belongs there
too.

```csharp
using UnityEngine.InputSystem;

if (Keyboard.current != null && Keyboard.current.enterKey.wasPressedThisFrame)
{
    Submit();
}
```

And whether you stay on the old `Input` or not, **watching only
`KeyCode.Return` misses the numpad Enter.** They are separate values.

> **Return** — Return key.

> **KeypadEnter** — Numeric keypad Enter.

## Where and Why You'd Use It

A name-entry window is a UI whose whole job is **deciding when "they're
done."** To keep both the keyboard and the mouse open, that decision has to
live in one place.

### One Name-Entry Window

```csharp
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// Takes a name in an input field and confirms it. Supports both Enter and the confirm button.
/// </summary>
public class NameEntryPanel : MonoBehaviour
{
    private const int NAME_LIMIT = 12;
    private const string DEFAULT_NAME = "NONAME";

    [Header("References")]
    [SerializeField, Tooltip("The input field that takes the name")]
    private InputField _playerNameInput;

    [SerializeField, Tooltip("Confirm button. Disabled while the field is empty.")]
    private Button _confirmButton;

    private void Awake()
    {
        // Don't cache text in Awake. At that point the value is always empty.
        _playerNameInput.characterLimit = NAME_LIMIT;
    }

    private void OnEnable()
    {
        _playerNameInput.onValueChanged.AddListener(OnValueChanged);
        OnValueChanged(_playerNameInput.text);

        // Let the player type the moment the window opens.
        _playerNameInput.ActivateInputField();
    }

    private void OnDisable()
    {
        _playerNameInput.onValueChanged.RemoveListener(OnValueChanged);
    }

    private void Update()
    {
        if (!IsSubmitPressed()) { return; }

        // Read the input field's current value, not a cache.
        if (_playerNameInput.text.Length == 0) { return; }

        Submit();
    }

    /// <summary>Hook this up to the confirm button's OnClick.</summary>
    public void Submit()
    {
        string typed = _playerNameInput.text.Trim();
        string playerName = typed.Length > 0 ? typed : DEFAULT_NAME;

        PlayerPrefs.SetString("CurrentPlayerName", playerName);
        // Write explicitly if a scene change is about to happen.
        PlayerPrefs.Save();

        // Leave what follows (ranking, scene transition) to the caller.
    }

    private void OnValueChanged(string value)
    {
        // Lock the button while empty. The state becomes visible, which makes debugging easy.
        if (_confirmButton != null)
        {
            _confirmButton.interactable = value.Trim().Length > 0;
        }
    }

    private static bool IsSubmitPressed()
    {
        // The numpad Enter is a separate KeyCode.
        return Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter);
    }
}
```

A few intentions worth noting.

- **No caching of `text` in `Awake`.** The value there is empty, and that cache
  was this post's bug.
- **`characterLimit` set in code.** In the manual's words, "the maximum number
  of characters that can be entered into the input field." A name box has no
  reason to grow without bound.
- **A default name for empty input.** The author left this as homework — "there
  would probably need to be more code deciding what to call the player when
  Length is 0" — and this is where it goes. `Trim()` catches the
  whitespace-only case too.
- **`onValueChanged` locks the button.** The reason it can't be pressed is
  visible on screen.
- **`ActivateInputField()` takes focus.** In the docs' words, "function to
  activate the InputField to begin processing Events." Being able to type the
  moment the window appears skips the mouse entirely — one step closer to the
  author's original goal.
- **An explicit `PlayerPrefs.Save()`.** Writes otherwise happen at
  `OnApplicationQuit`, so call it once at a boundary such as a scene change or
  closing this window. Where it saves and when is covered in
  [the PlayerPrefs post](/posts/playerprefs-storage-path/).

### What I Changed from the Original

- **The condition reads `.text` instead of the cache.** That's this post's
  subject.
- **Removed the `playerName` field.** The input field already holds the value;
  keeping a second copy lets the two drift apart. Don't keep state twice.
- **Dropped `playerNameInput.GetComponent<InputField>()`.** `playerNameInput`
  *is* an `InputField`. That call looks up itself.
- **`public` fields became `[SerializeField] private`.** Still visible in the
  Inspector, no longer assignable from outside.
- **Watches the numpad Enter too.**
- **Handles empty and whitespace-only input.**
- **Calls `PlayerPrefs.Save()`.**
- **Removed the `GameManager.instance` calls.** An input window that also does
  ranking math and scene transitions can't be reused. It confirms a value and
  leaves the rest to the caller.

### Where Not to Use It

- **Caching `text` in `Awake`.** The value there is empty.
- **Keeping the same value in both a field and the component.** The moment you
  lose track of which one the condition reads, you get this post's bug.
- **`Input.GetKeyDown` on an Input System project.** It throws.
- **Watching only `KeyCode.Return`.** The numpad Enter is missed.
- **Building "submit on Enter" out of `onEndEdit` alone.** It also fires on
  focus loss.
- **Reaching for this component on a new project.** It's under Legacy in the
  component menu.
- **Putting a password in `PlayerPrefs`.** Setting `contentType` to `Password`
  doesn't change how it's stored. The `PlayerPrefs` docs say it outright.

> Unity stores PlayerPrefs in a local registry, **without encryption. Don't use
> PlayerPrefs data to store sensitive data.**

## Wrapping Up

- **The original's keyboard path only opens after the mouse button has been
  clicked once**, because the condition in `Update` reads a string cached in
  `Awake` rather than the input field.
- What's actually tested is not "did they type at least one character?" but
  **"has `InputName` ever run?"**
- **The minimal fix is reading `.text` in the condition**; the real fix is
  **deleting the cache field.**
- **`text` can differ from what's on screen.** The docs say so directly.
- **`onEndEdit` fires on focus loss as well as submit**, in the manual's own
  words. `onSubmit` carries an identical description in the API reference, so I
  didn't claim a distinction.
- **Placeholder is optional.** You can delete it — clear the component's
  reference too if you do.
- **`Input.GetKeyDown` throws when Active Input Handling is the Input System.**
  Use `Both` to keep both.
- **`KeyCode.Return` and `KeyCode.KeypadEnter` are separate.**
- **This component sits under Legacy in the component menu.**
- **`contentType = Password` only hides the screen.** `text` is plain, and that
  value must not go into `PlayerPrefs`.

The original's motivation was right. **"I don't want to move my hand from the
keyboard to the mouse" really is the most annoying thing about a name-entry
window**, and opening both paths was the correct design. What went wrong wasn't
the design — it was one line deciding *where the value is read from*.

---

### References

- [InputField — Unity UI package API](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/api/UnityEngine.UI.InputField.html)
- [Input Field — Unity UI package manual](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/script-InputField.html)
- [KeyCode — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/KeyCode.html)
- [PlayerPrefs.Save — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/PlayerPrefs.Save.html)
- [Unity Issue Tracker — InvalidOperationException when using UnityEngine.Input](https://issuetracker.unity.com/issues/13441/error-invalidoperationexception-you-are-trying-to-read-input-using-the-unityengineinput-class-but-you-have-switched-active-input-handling-to-input-system-package-in-player-settings-is-present-when-usi)

The starting point for this post was [김시루시루르 — \[Unity UGUI\] InputField 인풋 필드 + α (플레이어 이름 입력)](https://drybone-developer.tistory.com/94)
(2021-12-06). I followed its explanation of the input field's structure and its
sample code as written, traced the code's execution order, and checked each
API's behavior against the current documentation. Quotes from it are my
translations; the Korean comments in the sample are the author's.
