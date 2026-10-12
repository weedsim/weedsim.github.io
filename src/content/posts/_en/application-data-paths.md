---
pubDatetime: 2026-10-12T21:20:00+09:00
title: "What's in LocalLow Is persistentDataPath, Not dataPath"
lang: en
translationKey: application-data-paths
featured: false
draft: false
tags:
  - Unity
  - C#
  - Data
  - File System
description: "Clipped to pin down the exact path, since I'd been writing JSON saves to dataPath. It lays out where dynamically created files go. But the descriptions of dataPath and persistentDataPath are swapped. There are five path members, not three, and a relative path is relative to neither of them."
---

After checking the `PlayerPrefs` registry path earlier, I started **saving
anything bigger than a few settings as JSON files**. What I reached for early on
was `Application.dataPath`, and while looking to **pin down the exact path** I
clipped a post that lays out where dynamically created files and saved data
**end up**. It's from 2021, and the author's motivation is right at the top.

> While studying up on bundles, I looked into where dynamically created files
> and saved data actually go.

The question is exactly right. But **two of the answers are swapped.**
`Application.dataPath` has the `AppData\LocalLow` path attached to it, and
`Application.persistentDataPath` has the project's `Assets` folder. The current
docs say **precisely the opposite.**

This blog has one post on storage locations:
[PlayerPrefs' Path Is Assembled from Company Name and Product Name](/en/posts/playerprefs-storage-path/).
That one covered **the registry and the editor/build split**, so this one
touches the clipping's part 1 (`PlayerPrefs`) briefly and looks at **part 2's
`Application` path members**. Where they overlap, I don't defer by link — I
carry as much as is needed here again.

I verified six things. **The descriptions of `dataPath` and
`persistentDataPath` are swapped**, **there are five path members, not three**,
**"read only" is used in two senses**, **`dataPath` points at the APK rather
than a folder on Android**, **`persistentDataPath` has a GUID derived from the
Bundle Identifier in it**, and **a relative path isn't relative to
`persistentDataPath`.**

Checked on **2026-10-12**, against Unity **6.6**.

## Table of contents

## The PlayerPrefs path is the editor's, not the device's

The clipping's part 1 is a registry path. Its heading says "the PlayerPrefs
path saved on the device", yet the path has `UnityEditor` in it.

> \[Registry Editor\] -> \[HKEY\_CURRENT\_USER\] -> \[SOFTWARE\] ->
> \[Unity\] -> \[UnityEditor\] -> \[DefaultCompany\] ->\["ProductName"\]

The docs write these as two separate entries. Here's the built player's.

> Computer\HKEY_CURRENT_USER\Software\ExampleCompanyName\ExampleProductName in
> the Registry Editor.

And the in-editor Play mode one is listed separately.

> Computer\HKEY_CURRENT_USER\Software\Unity\UnityEditor\ExampleCompanyName\ExampleProductName
> key.

**The path the clipping gives is the second one — the editor's.** That doesn't
match its "saved on the device" heading. The symptom of a value you deleted in
the editor still being there in the build comes from here, and that story is
written up in
[PlayerPrefs' Path Is Assembled from Company Name and Product Name](/en/posts/playerprefs-storage-path/).
This post stops here and moves on to part 2.

One more note. Why you can't find the key name in the registry is in the docs
too.

> Note that Windows uses the key names from the application's PlayerPrefs as a
> hashed identifier.

## The two paths are written the wrong way round

Put the clipping's two lines next to the current docs and it looks like this.

| Member | The clipping | The current docs |
| --- | --- | --- |
| `dataPath` | `C:\Users\<user>\AppData\LocalLow\<company>` | "Unity Editor: <path to project folder>/Assets" |
| `persistentDataPath` | `<project folder>\Assets` | "%userprofile%\AppData\LocalLow\<companyname>\<productname>" |
| `streamingAssetsPath` | `<the project folder>` | "Create it in your project at **Assets/StreamingAssets**." |

**The two values are exactly transposed.** Here's `dataPath`'s description.

> Contains the path to the game data folder on the target device (Read Only).

And `persistentDataPath`.

> Contains the path to a persistent data directory (Read-only).

> This value is a directory path where you can store data that you want to
> retain between runs.

**"Retain between runs"** — the place for data you want to keep across runs.
That's where a dynamically created save file belongs, and the `Assets` folder
the clipping put there **doesn't exist in a build at all.**

Which brings out what actually happens when you write a JSON save to
`dataPath`. In the editor `dataPath` is `<path to project folder>/Assets`, so
**the file lands inside the project's source tree.** The write succeeds, you
can see it, and it reads back. **The trap is that nothing looks wrong in the
editor.** That file isn't user data, it's sitting in the project's asset
folder, it goes into version control, and the place `dataPath` points at in a
build isn't the same place — Windows/Linux players get
`<path to executablename_Data folder>`, Android gets the APK, and for iOS and
UWP the docs flatly say **read only**.

Here's the Windows entry.

> Windows Editor and Windows Player: Application.persistentDataPath usually
> points to %userprofile%\AppData\LocalLow\<companyname>\<productname>.

That's the path the clipping attached to `dataPath`. That it stops at the
company name is worth noting too — the docs' Windows entry includes **the
product name** as well. The form that ends at the company name is the UWP
entry.

> UWP Apps: Application.persistentDataPath points to
> C:\Users\<user>\AppData\LocalLow\<company name>.

## There are five path members, not three

The clipping lists three. The `Application` class has **five**.

| Member | What the docs say | In the clipping? |
| --- | --- | --- |
| `dataPath` | "Contains the path to the game data folder on the target device (Read Only)." | yes (described wrongly) |
| `persistentDataPath` | "Contains the path to a persistent data directory (Read-only)." | yes (described wrongly) |
| `streamingAssetsPath` | "The path to the StreamingAssets folder (Read Only)." | yes |
| `temporaryCachePath` | "Contains the path to a temporary data / cache directory (Read Only)." | **no** |
| `consoleLogPath` | "Returns the path to the console log file, or an empty string if the current platform does not support log files." | **no** |

`temporaryCachePath` comes with a caveat attached.

> This path is unique per Unity project, but it isn't unique for multiple
> concurrent instances of the same project.

> To obtain unique temporary paths, use FileUtil.GetUniqueTempPathInProject.

**Run several instances of the same project at once and they collide.** That
bites when you put a download cache or intermediate output there.

`consoleLogPath` is documented as returning **an empty string on platforms that
don't support it**. Use an empty string directly as a path and a file appears
somewhere you can't account for. This "empty string" pattern shows up once more
below.

## "Read only" is used in two senses

The clipping attaches **read only** to `dataPath` and `streamingAssetsPath`.
Look at the docs and that label points at two different things.

One is that **the C# property is read-only**. All five members carry
"(Read Only)" in their description. It means you can't assign to it.

The other is that **the folder is read-only**, and this one differs per
platform. Two entries in `dataPath`'s platform list carry that note.

> iOS player: <path to player app bundle>/<AppName.app>/Data (this folder is
> read only, use Application.persistentDataPath to save data).

> UWP Apps: The absolute path to the player data folder (this folder is read
> only, use Application.persistentDataPath to save data)

**The `Win/Linux player` entry has no such note.** So "`dataPath` is read only"
is a per-platform statement. `StreamingAssets`, on the other hand, is nailed
down by the manual for the whole runtime.

> At runtime the `StreamingAssets` location is read-only and you can't modify
> or write new files to it.

**The "read only" the clipping attached to `streamingAssetsPath` is correct.**
It's the one on `dataPath` that dropped the platform condition.

## dataPath points at different things per platform

`dataPath`'s platform list matters in full. The docs set it up like this.

> The value depends on which platform you are running on:

| Platform | What the docs give |
| --- | --- |
| Unity Editor | "<path to project folder>/Assets" |
| Mac player | "<path to player app bundle>/Contents" |
| iOS player | "<path to player app bundle>/<AppName.app>/Data" (read only) |
| Win/Linux player | "<path to executablename_Data folder>" |
| WebGL | "The absolute url to the player data file folder (without the actual data file name)" |
| Android | "Normally it points directly to the APK. If you are running a split binary build, it points to the OBB instead." |
| UWP Apps | "The absolute path to the player data folder" (read only) |

**The Android entry isn't a folder.** It points at the APK, or the OBB for a
split binary build. Code that appends a filename to a string pointing at a
compressed archive and calls `File.Open` ends right there.

The WebGL entry isn't a folder either — it's a **url**. And the Linux entry has
one more parenthetical — "(note that most Linux installations will be
case-sensitive!)".

There's a note about notation as well.

> Note that the string returned on a PC will use a forward slash as a folder
> separator.

**The string you get back on a PC uses forward slashes.** The
`C:\Users\…\AppData\LocalLow\…` the clipping writes is what Explorer shows you;
the string your code receives doesn't have that shape. Code that compares paths
as strings or splits on `\` comes apart here. `persistentDataPath` carries a
warning to the same effect.

> Note: The difference slashes indicate the different operating systems
> according to Path.DirectorySeparatorChar.

And for platforms not on the list, the docs tell you **not to guess.**

> For any unlisted platform, run the example script on the target platform to
> find the dataPath location in the debug log.

## persistentDataPath has the bundle identifier in it

`persistentDataPath` carries one story that's entirely absent from the clipping.

> When you build the Unity application, a GUID is generated that is based on
> the Bundle Identifier.

> This GUID is part of `persistentDataPath`.

> If you keep the same Bundle Identifier in future versions, the application
> keeps accessing the same location on every update.

**Change the Bundle Identifier and the path changes.** Which means the next
version can't see the old saves. Where that identifier comes from is readable
at runtime too.

> Returns the application identifier at runtime.

> On Apple platforms this is the 'bundleIdentifier' saved in the info.plist
> file.

> On Android it's the 'package' from the AndroidManifest.xml.

That's `Application.identifier`. This shape is the same as the `PlayerPrefs`
post from earlier. There, changing **the company name and product name** means
you can't read the stored values; here, changing **the Bundle Identifier**
means the same. **What's shared is that the storage location is assembled out
of strings from the project settings.**

Two of the platform entries are worth pulling out. First, mobile.

> When you publish on iOS and Android, `persistentDataPath` points to a public
> directory on the device.

> The files can only be erased by users directly and not by any app updates.

**An app update won't erase them.** Which means an update won't quietly clean up
a save whose format changed, and that migration code is yours to carry. The
actual Android path is
`/storage/emulated/<userid>/Android/data/<packagename>/files`, and pulling that
folder off a device and pushing it back with `adb` is written up in
[adb Notes: The Architecture and Commands of Android Debug Bridge](/en/posts/adb-android-debug-bridge/).

The other is **an empty string**.

> tvOS: `Application.persistentDataPath` is not supported and returns an empty
> string.

Pass an empty string to `Path.Combine` and you don't get an exception, you get
**a relative path**. Where that relative path goes is the next section.

## A relative path isn't relative to persistentDataPath

The clipping's opening question was where dynamically created files get saved.
The docs answer that question directly somewhere, and the answer isn't the
intuitive one.

> Some Unity APIs (for example, ScreenCapture.CaptureScreenshot) interpret
> relative paths as relative to the project directory on Windows Editor and
> other non-mobile platforms, not relative to `persistentDataPath`.

> Therefore, screenshots or other files saved with a relative path end up in
> the project folder, not in `AppData/LocalLow` on Windows.

**Save with a relative path and it goes to the project folder.** Not
`persistentDataPath`. The `ScreenCapture.CaptureScreenshot` page says the same
thing in more detail.

> **Mobile platforms (such as Android and iOS)**: `filename` is appended to the
> persistent data path.

> **Windows Editor, macOS Editor, and other non-mobile platforms**: `filename`
> is interpreted relative to the project directory

**The same call writes to a different folder depending on the platform.** On
mobile it's appended to the persistent data path; in the editor and on
non-mobile it's relative to the project folder. So the docs nail down the fix.

> To save files to the persistent data path, pass a full path:
> `System.IO.Path.Combine(Application.persistentDataPath, "filename.png")`.

**Pass a full path.** Not using a relative path is the only instrument here.

The same page has one more Android-only trap.

> The `CaptureScreenshot` returns immediately on Android.

> The screen capture continues in the background.

> The resulting screen shot is saved in the file system after a few seconds.

**The file isn't there right after the call.** That's the road where code that
captures and immediately reads it back to upload fails on Android only.

## streamingAssetsPath isn't a path on two platforms

The clipping writes `streamingAssetsPath` as "the project folder". The location
is more specific than that.

> The `StreamingAssets` folder must be in the root of the `Assets` folder at
> `Assets/StreamingAssets`.

> Any files in this directory are copied without modification into the Player
> output.

**It has to be directly under `Assets`, and files are copied unmodified.** And
in a build the location changes.

> In a built Player, the StreamingAssets location can differ from the project
> folder, so always use `Application.streamingAssetsPath`.

Up to here it's the same direction as the clipping. What diverges is next.

> On most platforms `Application.streamingAssetsPath` is a directory accessible
> using regular file system APIs.

> On Android and the Web platform, it's impossible to access the streaming
> asset files directly via file system APIs because these platforms return a
> URL.

> Use the UnityWebRequest class to access the content instead.

**On Android and the Web what comes back isn't a path, it's a URL.** The
scripting reference says the same with the condition spelled out.

> You cannot use synchronous filesystem APIs, such as the C#
> `System.IO.File` class, to access the `StreamingAssets` folder on the WebGL
> and Android platforms.

It names `System.IO.File`. So this is the road where **a `File.ReadAllBytes`
that ran fine in the editor fails only in an Android build**, and the
alternative is `UnityWebRequest`. How to judge the result of a `UnityWebRequest`
is written up in
[An Error Page Comes Back and result Still Isn't ConnectionError](/en/posts/google-translate-tts/).

There's one documented road for getting files into the build from outside the
folder, too.

> You can add streaming assets to the Player build without placing them in the
> `StreamingAssets` folder by using BuildPlayerProcessor.PrepareForBuild.

## Where and why you'd use it

### A working example

This doesn't guess at paths — it **prints them** — and it only ever saves with
a full path. It leaves in exactly the approach the docs describe when they say
"run the example script on the target platform to find the dataPath location in
the debug log".

```csharp file="Scripts/Util/SavePathProbe.cs"
using System;
using System.IO;
using UnityEngine;

public class SavePathProbe : MonoBehaviour
{
    [Header("Save")]
    [Tooltip("Name of the subfolder to create under persistentDataPath")]
    [SerializeField]
    private string _saveFolderName = "Saves";

    [Tooltip("Save file name, extension included")]
    [SerializeField]
    private string _saveFileName = "slot0.json";

    private void Start()
    {
        LogPaths();
    }

    // The values differ per platform. Don't guess — print them on the target
    // device.
    [ContextMenu("Log paths")]
    private void LogPaths()
    {
        Debug.Log($"dataPath            = {Application.dataPath}", this);
        Debug.Log($"persistentDataPath  = {Application.persistentDataPath}", this);
        Debug.Log($"streamingAssetsPath = {Application.streamingAssetsPath}", this);
        Debug.Log($"temporaryCachePath  = {Application.temporaryCachePath}", this);
        Debug.Log($"consoleLogPath      = {Application.consoleLogPath}", this);
        Debug.Log($"identifier          = {Application.identifier}", this);
    }

    // No relative paths. The docs say to pass a full path.
    public string GetSaveFilePath()
    {
        string root = Application.persistentDataPath;

        // On tvOS the docs say this is an empty string. Pass an empty string
        // to Combine and you get a relative path, not an exception.
        if (string.IsNullOrEmpty(root))
        {
            Debug.LogWarning("persistentDataPath is empty.", this);
            return string.Empty;
        }

        return Path.Combine(root, _saveFolderName, _saveFileName);
    }

    public bool TryWriteSave(string json)
    {
        string path = GetSaveFilePath();

        if (string.IsNullOrEmpty(path))
        {
            return false;
        }

        try
        {
            string directory = Path.GetDirectoryName(path);

            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }

            File.WriteAllText(path, json);
            return true;
        }
        catch (Exception exception)
        {
            // Even with the right path, permissions or disk space can fail it.
            Debug.LogError($"Save failed: {exception.Message}", this);
            return false;
        }
    }

    public bool TryReadSave(out string json)
    {
        json = string.Empty;
        string path = GetSaveFilePath();

        if (string.IsNullOrEmpty(path) || !File.Exists(path))
        {
            return false;
        }

        try
        {
            json = File.ReadAllText(path);
            return true;
        }
        catch (Exception exception)
        {
            Debug.LogError($"Save read failed: {exception.Message}", this);
            return false;
        }
    }
}
```

There's a reason for `Path.Combine`. The docs name
`Path.DirectorySeparatorChar` explicitly, and they say the string you get back
on a PC uses forward slashes. **Concatenate separators by hand and the shape
comes out wrong on some platform.**

Leaving `StreamingAssets` reading out of this class is deliberate too. The docs
say you can't read it with `System.IO.File` on Android and the Web and that you
have to use `UnityWebRequest`. **Put them in the same class and you get code
that half-works on a platform.**

The `try`/`catch` is there because the path and the outcome are different
problems. Assemble the path correctly and it can still **fail on permissions or
space**. Printing a path and confirming a write succeeded are two separate
things.

### How to choose

| Situation | What to use |
| --- | --- |
| Data to keep across runs | `persistentDataPath` ("retain between runs") |
| Shipped in the build, read only | `streamingAssetsPath` |
| Reading those files on Android/Web | `UnityWebRequest` (you get a URL, not a path) |
| A cache you can rebuild | `temporaryCachePath` |
| Several instances of one project at once | `temporaryCachePath` collides |
| A handful of settings | `PlayerPrefs` (registry · plist · IndexedDB) |
| Where the log file is | `consoleLogPath` (empty string if unsupported) |
| Assembling a save path | `Path.Combine` + a full path |
| A screenshot into the persistent path | `Path.Combine(Application.persistentDataPath, …)` |
| Reading a screenshot right after capture on Android | you have to wait ("after a few seconds") |
| A platform that isn't on the list | print it on the target device |
| Changing the Bundle Identifier | the path changes. Prepare a migration |

Here's the order to judge in.

- **Start by splitting writing from reading.** If you're writing, it's
  `persistentDataPath`. `dataPath` is either not a folder or read-only
  depending on the platform.
- **Print the path before you start.** The docs say exactly that for platforms
  not on the list. Trusting a path from a blog post is the method this clipping
  got wrong.
- **Don't use relative paths.** The same call writes to different folders on
  mobile and in the editor. Passing a full path is the fix the docs give.
- **The Bundle Identifier and the company/product names are part of the storage
  location.** If you ever need to change one, a migration comes with it.

### Where not to use it

- **Writing saves to `dataPath`.** The iOS and UWP entries say "this folder is
  read only, use Application.persistentDataPath to save data".
- **Keeping `dataPath` because it works in the editor.** The editor's
  `dataPath` is the project's `Assets`, so the write succeeds. That success
  isn't guaranteed in a build.
- **Assuming `dataPath` is a folder.** On Android it points at the APK, or the
  OBB for a split binary build.
- **Saving files with a relative path.** On non-mobile they go to the project
  folder, not `AppData/LocalLow`.
- **Concatenating separators as `\` by hand.** The docs say the string you get
  back on a PC uses forward slashes.
- **Reading `StreamingAssets` with `System.IO.File`.** On Android and WebGL you
  get a URL back. Use `UnityWebRequest`.
- **Passing an empty string straight to `Path.Combine`.** tvOS's
  `persistentDataPath` and an unsupported platform's `consoleLogPath` are empty
  strings.
- **Using `temporaryCachePath` as a per-instance working folder.** The docs say
  several concurrent instances of one project collide.
- **Changing the Bundle Identifier lightly.** The GUID is part of the path, so
  the old saves go out of reach.
- **Capturing a screenshot on Android and reading it immediately.** The call
  returns at once and the file appears a few seconds later.

## Summary

- **The clipping's two lines are transposed.** In the editor `dataPath` is
  "<path to project folder>/Assets", and `AppData\LocalLow` is
  `persistentDataPath`'s Windows value.
- `persistentDataPath` is defined as **"a directory path where you can store
  data that you want to retain between runs"**. That's where a save belongs.
- **There are five path members.** On top of the clipping's three there are
  `temporaryCachePath` and `consoleLogPath`. The first **collides across
  concurrent instances**, the second is **an empty string on unsupported
  platforms**.
- **"Read only" means two things.** All five properties are "(Read Only)", but
  the ones where **the folder** is documented as read-only are `dataPath`'s iOS
  and UWP entries and `StreamingAssets`. The `Win/Linux player` entry has no
  such note.
- On Android `dataPath` is **"Normally it points directly to the APK"**, or the
  OBB for a split binary build. Not a folder.
- **The string you get back on a PC uses forward slashes**, the docs say. Not
  the backslash notation Explorer shows you.
- `persistentDataPath` has **a GUID derived from the Bundle Identifier** in it.
  Change the identifier and the old saves go out of reach. Same structure as the
  company and product names being part of the `PlayerPrefs` path.
- On iOS and Android that folder is a public directory and **"can only be erased
  by users directly and not by any app updates"**. Migration is on you.
- **A relative path isn't relative to `persistentDataPath`.** On non-mobile it
  goes to the project folder. The fix is the one the docs write down — **pass a
  full path**.
- `streamingAssetsPath` **returns a URL on Android and the Web.** You can't use
  `System.IO.File`; you use `UnityWebRequest`.
- **Writing a JSON save to `dataPath` only looks fine in the editor**, because
  that location is the project's `Assets`. In a build the same property points
  at a `_Data` folder, an APK, or a read-only folder.
- **The clipping's `PlayerPrefs` path is the editor's.** The built player goes
  to `…\Software\[company]\[product]` separately.

---

### References

- [Application — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application.html)
- [Application.dataPath — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application-dataPath.html)
- [Application.persistentDataPath — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application-persistentDataPath.html)
- [Application.streamingAssetsPath — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application-streamingAssetsPath.html)
- [Application.temporaryCachePath — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application-temporaryCachePath.html)
- [Application.identifier — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Application-identifier.html)
- [PlayerPrefs — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/PlayerPrefs.html)
- [ScreenCapture.CaptureScreenshot — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/ScreenCapture.CaptureScreenshot.html)
- [Streaming Assets — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/StreamingAssets.html)

The starting point for this post was
[\[유니티\] 유니티 PlayerPrefs 저장경로/ Application.dataPath/](https://funfunhanblog.tistory.com/378)
(HJH0825, 2021-05-03), in Korean; the quotes from it are my translations. I
followed its list of paths as written and checked it against both the current
Unity 6.6 scripting reference and the manual, correcting the two transposed
entries by quoting the docs' own sentences. Checked on 2026-10-12.
