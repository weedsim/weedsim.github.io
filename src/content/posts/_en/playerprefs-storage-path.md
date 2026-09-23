---
pubDatetime: 2026-09-23T20:00:00+09:00
title: "PlayerPrefs' Path Is Assembled from Company Name and Product Name"
lang: en
translationKey: playerprefs-storage-path
featured: false
draft: false
tags:
  - Unity
  - C#
  - Data
  - Windows
description: "A short post listing the storage paths — but the real point is that the path is assembled from two Player Settings fields. Change either one and PlayerPrefs can no longer read what you saved."
---

I clipped this after wiring up settings persistence and wanting to see **where
the values actually land and in what shape.** It's a 2022 post on where
`PlayerPrefs` goes in the Windows registry — three paths and how to open
`regedit`, nothing more — and it answers "so where is it?" immediately.

But **the fact that the path contains `[company name]` and `[product name]` is
the post's real content.** It means the storage location is assembled from two
project settings, which brings a consequence: what happens when you change
them. The clipping gives the paths and stops there.

And the registry screenshot it includes shows **key names that look mangled**,
with no explanation of why.

## Table of Contents

## The Clipping's Paths vs Today's Docs

Here are the paths as the clipping gives them.

```
Editor:     HKEY_CURRENT_USER\Software\Unity\UnityEditor\[company name]\
Editor:     HKEY_CURRENT_USER\Software\[company name]\[project name]
Mac OS:     ~/Library/Preferences/unity.[company name].[product name].plist
```

Side by side with the current Scripting Reference:

| | The clipping | Current docs |
|---|---|---|
| Windows Editor | `…\Unity\UnityEditor\[company name]\` | `…\Unity\UnityEditor\ExampleCompanyName\`**`ExampleProductName`** |
| Windows Standalone | `…\Software\[company name]\`**`[project name]`** | `…\Software\ExampleCompanyName\`**`ExampleProductName`** |
| macOS Editor | (not distinguished) | `~/Library/Preferences/com.ExampleCompanyName.ExampleProductName.plist` |
| macOS Standalone | `unity.[company name].[product name].plist` | `~/Library/Preferences/ExampleBundleIdentifier.plist` |

Four differences.

- **Both lines start with "Editor:".** The second one is the standalone path.
  A plain typo — and a fatal one for someone who came only for the path.
- **The last segment of the standalone path is written `[project name]`.** What
  the docs point to is **Product Name**. Those are different values — more on
  that below.
- **The editor path stops at `[company name]\`.** The docs continue down to
  `[product name]`.
- **macOS has different editor and standalone paths**, and the clipping gives
  one. The `unity.[company].[product].plist` form isn't in the current docs at
  all.

It's telling that Windows gets an editor/build split and macOS doesn't. **Both
are split.**

The rest of the platforms the docs cover:

```
Linux:       ~/.config/unity3d/ExampleCompanyName/ExampleProductName
Android:     /data/data/pkg-name/shared_prefs/pkg-name.v2.playerprefs.xml
iOS:         NSUserDefaults standardUserDefaults API
Windows UWP: %userprofile%\AppData\Local\Packages\[ProductPackageId]\LocalState\playerprefs.dat
WebGL:       the browser's IndexedDB (up to 1MB)
```

## The Path Is Assembled from Two Settings Fields

`[company name]` and `[product name]` are **the top two fields in Player
Settings**. Their own descriptions say this post's point for it.

> **Company Name** — Enter the name of your company. **Unity uses this to
> locate the preferences file.**

> **Product Name** — Enter the name that appears on the menu bar when your
> application is running. **Unity also uses this to locate the preferences
> file.**

They read like display-name fields, yet the docs state that **both are used to
locate the store.** In other words, **those two fields are the storage path.**

One conclusion follows. **Change either one and PlayerPrefs can no longer read
what you saved before.** The data isn't deleted — it's still sitting at the old
path. `PlayerPrefs.GetInt` just looks somewhere else now. **The symptom reads
as "my saves are gone."**

`Product Name` is the dangerous one, because it's the name on the menu bar and
the window title — **the field you want to fix right before shipping.** Fix it
then and every setting accumulated during testing disappears from view.

This is also **why the clipping writing `[project name]` matters.** The project
folder name and the Product Name may start out identical, but nothing requires
them to stay that way. Go hunting through the registry by folder name and you
won't find it.

## Why You Can't Find Your Key Name in the Registry

The clipping's screenshot shows value names with an odd suffix. The form the
docs give as an example:

```
DeckBase_h3232628825
```

Save with `PlayerPrefs.SetInt("DeckBase", 3)` and the name in the registry
isn't `DeckBase`, it's **`DeckBase_h` plus a number.** The docs give the
reason.

> Windows hashes key names **to allow case-sensitive key names, prevent naming
> conflicts, and ensure PlayerPrefs API usage.**

Three practical consequences.

- **Searching the registry by key name finds nothing.** `DeckBase` returns 0
  hits; you have to search for `DeckBase_h`.
- **`SetInt("Score", …)` and `SetInt("score", …)` are different keys.**
  Different hashes, so case matters. Scatter key names as string literals and
  one typo quietly creates a new key.
- **Injecting a value by hand-editing the registry is hard.** You'd have to
  produce the hash yourself. That's what "ensure PlayerPrefs API usage" means.

The first two have an immediate answer: **collect key names as constants.**

```csharp
public static class PrefKeys
{
    public const string MASTER_VOLUME = "Audio.MasterVolume";
    public const string LANGUAGE = "Locale.Language";
    public const string LAST_STAGE = "Progress.LastStage";
}
```

## The Editor and the Build Are Separate Stores

The two Windows paths differing means **values saved in the Editor and values
saved in a build never mix.**

| | Stored at |
|---|---|
| Editor play mode | `…\Software\Unity\UnityEditor\[company]\[product]` |
| Running a build | `…\Software\[company]\[product]` |

Two places this bites.

- **`DeleteAll` in the Editor leaves the build untouched.** That's the answer
  to "I cleared it, why is it still there?" And vice versa.
- **To test the first-run path you have to clear the Editor's keys.** Wiping
  the build's registry entries does nothing for Editor play mode.

macOS has the same structure: the editor uses
`com.[company].[product].plist`, standalone uses a bundle-identifier plist.

## When Does the Write Happen

There's another reason the path can be empty when you go look. **It may not be
written yet.** From the `PlayerPrefs.Save` docs:

> Unity **saves preferences automatically during `OnApplicationQuit()`.** On
> the Universal Windows Platform, Unity writes preferences during application
> suspend.

So opening `regedit` without stopping Editor play mode may not show the value
you just `SetInt`'d. That's expected.

To write explicitly you call `Save()`, but the docs attach a condition.

> **Since writing the PlayerPrefs can cause hiccups, it is recommended to not
> call this function during gameplay.**

That fixes where the call belongs: **at boundaries — closing a settings screen,
finishing a stage.** Not every frame, and not on every value change.

## Where and Why You'd Use It

`PlayerPrefs` is for **small values you can afford to lose.** The docs' first
sentence draws the boundary.

> PlayerPrefs is a class that stores Player preferences between game sessions.
> It can store **string, float and integer values** into the user's platform
> registry.

Three types is itself the hint. It wasn't built to hold structure.

### A Thin Wrapper for Settings

```csharp
using UnityEngine;

/// <summary>
/// Collects PlayerPrefs access in one place so key strings don't scatter.
/// </summary>
public static class GameSettings
{
    private const string MASTER_VOLUME = "Audio.MasterVolume";
    private const string LANGUAGE = "Locale.Language";

    private const float DEFAULT_VOLUME = 0.8f;
    private const string DEFAULT_LANGUAGE = "ko";

    public static float MasterVolume
    {
        // Omit the default argument and you get 0. That's where "no sound" bugs come from.
        get => PlayerPrefs.GetFloat(MASTER_VOLUME, DEFAULT_VOLUME);
        set => PlayerPrefs.SetFloat(MASTER_VOLUME, Mathf.Clamp01(value));
    }

    public static string Language
    {
        get => PlayerPrefs.GetString(LANGUAGE, DEFAULT_LANGUAGE);
        set => PlayerPrefs.SetString(LANGUAGE, value);
    }

    /// <summary>Call only at boundaries, like closing the settings screen.</summary>
    public static void Commit()
    {
        PlayerPrefs.Save();
    }
}
```

**The second argument to `Get*` is the default.** Omit it and numbers come back
as 0, strings as empty. For something like volume, where 0 is a valid value,
"never saved" and "saved as 0" become indistinguishable — so always pass the
default. When you truly need to tell them apart, use `PlayerPrefs.HasKey`.

### Key Names You Can Migrate. Company and Product Names You Can't

Migrating a key name works inside the app, because it happens within the same
store.

```csharp
private const string PREFS_VERSION = "Prefs.Version";
private const int CURRENT_VERSION = 2;

private static void MigrateIfNeeded()
{
    int saved = PlayerPrefs.GetInt(PREFS_VERSION, 1);
    if (saved >= CURRENT_VERSION) { return; }

    // v1: "volume" → v2: "Audio.MasterVolume"
    if (PlayerPrefs.HasKey("volume"))
    {
        PlayerPrefs.SetFloat("Audio.MasterVolume", PlayerPrefs.GetFloat("volume"));
        PlayerPrefs.DeleteKey("volume");
    }

    PlayerPrefs.SetInt(PREFS_VERSION, CURRENT_VERSION);
    PlayerPrefs.Save();
}
```

**Changing Company Name or Product Name, on the other hand, can't be handled
this way.** The `PlayerPrefs` API only ever sees the path the *current*
settings point at. Data at the old path won't even show up through `HasKey`. To
reach it you'd read the registry or the plist directly — platform-specific
code.

So **the answer is to reorder things.** Settle Company Name and Product Name
**before you add persistence.** Think of them as the storage path rather than
display names and the priority sorts itself out.

### Where Not to Use It

- **Sensitive data.** The docs warn directly — "Unity stores PlayerPrefs in a
  local registry, **without encryption. Don't use PlayerPrefs data to store
  sensitive data.**"
- **Values that hurt when cheated.** No encryption means anyone can open it and
  edit it. Currency and stats don't belong here.
- **Structured data.** Three types, that's it. For save data, serialize to JSON
  and write a file. Which serializer to use is covered in
  [the JsonUtility post](/posts/unity-jsonutility/).
- **Large data.** WebGL caps at **1MB**.
- **Frequent `Save()` during gameplay.** The docs warn about hiccups.
- **Treating a name that might change as a path.** See the section above.

## Wrapping Up

- **The storage path is assembled from `[company name]` and `[product name]`.**
  The Player Settings docs say both are **"used to locate the preferences
  file."**
- **Change either and PlayerPrefs can't read the old data.** Nothing was
  deleted; the API just looks elsewhere, and the symptom reads as "my saves are
  gone."
- The last segment of the clipping's standalone path is **Product Name**, not
  `[project name]`. Hunting by folder name won't find it.
- The clipping labels both lines "Editor:", but **the second is standalone.**
- **macOS splits editor and standalone too.** Editor uses
  `com.[company].[product].plist`, standalone a bundle-identifier plist.
- **Windows hashes key names** (`DeckBase_h3232628825`). They don't turn up in
  a registry search by name, case matters, and hand-injection is hard.
- **The Editor and the build are separate stores.** `DeleteAll` on one leaves
  the other alone.
- **Writes happen automatically at `OnApplicationQuit`.** Call `Save()` only at
  boundaries — the docs advise against calling it during gameplay.
- **There is no encryption.** The docs say outright not to put sensitive data
  there.

It's a shame for a post about paths to give the paths and stop. **If a path has
two variables in it, what happens when you change those variables matters as
much as the path itself.**

---

### References

- [PlayerPrefs — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/PlayerPrefs.html)
- [PlayerPrefs.Save — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/PlayerPrefs.Save.html)
- [Player Settings — Unity Manual](https://docs.unity3d.com/Manual/class-PlayerSettings.html)

The starting point for this post was [원소랑 — \[Unity\] PlayerPref 레지스트리 저장 경로](https://m.blog.naver.com/sorang226/222765279318)
(2022-06-08). I followed its list of paths and checked it against the current
Scripting Reference, then traced where the two values in the path come from in
the Player Settings documentation. Quotes from the clipping are my translations.
