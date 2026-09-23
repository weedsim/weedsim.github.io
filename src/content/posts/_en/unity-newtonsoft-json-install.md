---
pubDatetime: 2026-09-23T14:00:00+09:00
title: "Installing Newtonsoft Json: The Version Field Is Meant to Be Empty"
lang: en
translationKey: unity-newtonsoft-json-install
featured: false
draft: false
tags:
  - Unity
  - C#
  - JSON
  - Serialization
  - Data
description: "Following an install guide for com.unity.nuget.newtonsoft-json, the version field stopped me. Typing 3.0.1 and then hitting Update is two steps you don't need — and 3.0.1 happens to predate the IL2CPP fixes."
---

I clipped this while working out **how to read a JSON file and actually use it
as data**. Following that question through to which tool does the
serialization and deserialization led to Newtonsoft Json (Json.NET), and that
meant installing it first.

The procedure itself is short. Open the Package Manager, click **Add package by
name**, enter `com.unity.nuget.newtonsoft-json` — follow that part as written.

What stopped me is what comes next. The post says to **type `3.0.1` in the
version field**, then, once installed, to **click Update to move to the latest
version**. Checking why those two steps exist, it turns out **neither is
needed**. And `3.0.1` happens to be exactly the number you don't want.

This post walks the install from the start and attaches **why each step looks
the way it does**. Choosing which serializer to hand the JSON to is its own
question, covered in [the JsonUtility post](/posts/unity-jsonutility/). Its
conclusion was "JsonUtility when I define the JSON's shape, Newtonsoft when
someone else does" — and **reading a file is usually the case where I didn't
define it.** This post is what comes after that.

## Table of Contents

## The Package Isn't in the List

Start with the name. What you install is
`com.unity.nuget.newtonsoft-json`, and the Unity docs introduce it like this:

> This is a Unity package for Newtonsoft Json and **corresponds to
> Newtonsoft.Json version 13.0.2.**

The latest per the docs is **3.2.2**. Just hold on to the fact that the package
version (3.2.2) and the Json.NET version inside it (13.0.2) are different
numbers.

But search the Package Manager list all you like and this package won't show
up. **That's why "Add package by name" is needed at all.** The applejag wiki —
the reference URL the original post links to — explains the situation: as of
March 2022, the package is either **already installed as a dependency of other
Unity packages, or hidden from the Package Manager window.** Unity intended to
make it publicly visible later.

Memorize only the procedure and you get stuck at "why doesn't search find it?"
**Not being in the list is normal.**

## The Version Field Is Meant to Be Empty

The original says to enter `3.0.1`. That number's source is the same applejag
wiki — the wiki used `3.0.1` as its example, and it got copied forward.

The Unity Manual describes the field this way:

> **Specifying the version is optional.** If you don't know which version to
> install, or **want to install the latest compatible version, enter only the
> package name.**

> The latest compatible version might not be the latest published package. **If
> there is a released package version and a newer pre-release or experimental
> version, Package Manager selects the released package version**, unless you
> explicitly input a value in the optional **Version** field.

So: **leave it empty and the latest release comes in.** There's no risk of a
pre-release sneaking in either. Which means "enter `3.0.1` → click Update" —
two steps — collapses into **"leave it blank"**, one step.

| | The original's procedure | What's actually needed |
|---|---|---|
| Name field | `com.unity.nuget.newtonsoft-json` | Same |
| Version field | Enter `3.0.1` | **Leave empty** |
| After install | Click Update to get the latest | Not needed |

## `3.0.1` Is a Bad Number to Land On

One extra step would just be a matter of taste. But `3.0.1` is a **version you
don't want to be stuck on.** The selling point the original names for this
package is IL2CPP build support — and that's precisely what got worked on
**after** `3.0.1`.

In changelog order:

| Version | Date | What changed |
|---|---|---|
| 2.0.0 | 2020-04-20 | AOT compatibility introduced **to allow for IL2CPP compilation platform targets** |
| 3.0.1 | 2022-02-21 | The version the original tells you to type |
| 3.1.0 | 2023-02-28 | **AOT and Editor DLLs updated to correspond to Newtonsoft.Json 13.0.2** |
| 3.2.0 | 2023-04-19 | **Public key token corrected** for assembly strong naming; support for Newtonsoft's timeout settings |
| 3.2.1 | 2023-04-27 | **Fixed the DLL when compiling with netstandard 2.0** |

Stay on `3.0.1` and you lose those bottom three rows. That's **the AOT DLL used
for IL2CPP builds being an older Json.NET, an incorrect assembly strong name,
and the netstandard 2.0 compile problem still present** — all at once. That's
presumably why the post insists you hit Update right after installing, but
leaving the version field empty never enters that window in the first place.

## Check Whether It's Already There

This package is **often dragged in by something else.** So checking comes
first. The file to check is `Packages/packages-lock.json`. The Unity Manual:

> This file contains **the results of the Package Manager's dependency
> resolution for a project.**

It records **indirect dependencies too**, not just what you added yourself. So
open it and search by name.

```bash
# from the project root
grep -n "com.unity.nuget.newtonsoft-json" Packages/packages-lock.json
```

If it's already in there, you don't need to install anything. Only add it via
Add package by name when it isn't.

And there are two things that **must not sit alongside it**.

- **`jillejr.newtonsoft.json-for-unity`** — applejag's port, used before the
  official package existed. The wiki states flatly that **"the two packages
  cannot coexist."** Remove it first. The converters package
  `jillejr.newtonsoft.json-for-unity.converters` can stay, since Unity doesn't
  ship an equivalent.
- **A `Newtonsoft.Json.dll` under `Assets`** — Asset Store packages sometimes
  bundle the DLL for their own use. Then the same types exist in two
  assemblies.

## On IL2CPP, the Real Trap Is Stripping

Even with the package version right, there's one more place IL2CPP catches you.
Newtonsoft reads JSON and **constructs types and fills members through
reflection.** Meanwhile, the linker strips code it believes is unused at build
time.

The Unity Manual describes exactly this combination:

> Annotations are especially useful when **your code references other code
> through reflection, because the Unity linker can't always detect uses of
> reflection.**

The `[Preserve]` attribute docs say the same thing:

> `PreserveAttribute` **prevents byte code stripping from removing a class,
> method, field, or property.**

> This can happen for instance if you **use reflection to call a method, or
> instantiate an object of a certain class.**

When deserialization that worked fine in the Editor **comes back with empty
fields or throws only in an IL2CPP build**, suspect this. The symptom looks
like "the install went wrong," but it has nothing to do with the install.

There are two ways to stop it. Per type, attach `[Preserve]`.

```csharp
using UnityEngine.Scripting;

[Preserve]
public class SaveData
{
    public string PlayerName;
    public int Level;
}
```

Per assembly, add a `link.xml`. In the manual's words:

> You can include **a .xml file named `link.xml`** in your project to
> **preserve a list of specific assemblies or parts of assemblies.**

```xml
<!-- Assets/link.xml -->
<linker>
  <!-- The assembly holding the data types Newtonsoft fills via reflection -->
  <assembly fullname="Assembly-CSharp" preserve="all"/>
</linker>
```

`preserve="all"` keeps that whole assembly. Convenient, but it grows the build,
so blocking only the types that actually got stripped with `[Preserve]` comes
first.

## Where and Why You'd Use It

With the install done, the places JsonUtility used to block are now open.
Confirming that **the things that used to block now work** doubles as
verification that the install took.

### What JsonUtility Couldn't Do

```csharp
using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;

public class NewtonsoftSmokeTest : MonoBehaviour
{
    private void Start()
    {
        // 1) Dictionary — JsonUtility can't represent it at all.
        var scores = new Dictionary<string, int> { ["ko"] = 10, ["en"] = 7 };
        string dictJson = JsonConvert.SerializeObject(scores);
        Debug.Log(dictJson);                                  // {"ko":10,"en":7}

        // 2) Top-level array — works directly, no wrapper class.
        int[] ids = JsonConvert.DeserializeObject<int[]>("[1,2,3]");
        Debug.Log(ids.Length);                                // 3

        // 3) null — stays null instead of turning into an empty object.
        var item = JsonConvert.DeserializeObject<Item>("{\"Name\":null}");
        Debug.Log(item.Name == null);                         // True

        // 4) Properties — serialized even though they aren't fields.
        string propJson = JsonConvert.SerializeObject(new Item { Name = "sword" });
        Debug.Log(propJson);                                  // {"Name":"sword"}
    }

    [Serializable]
    private class Item
    {
        public string Name { get; set; }
    }
}
```

Why each of those four blocks in `JsonUtility` is laid out in
[the JsonUtility post](/posts/unity-jsonutility/). In short, they all fall out
of one line: **if it isn't visible in the Inspector, it isn't in the JSON.**

### Polymorphism Works, With a Condition

The polymorphism that **broke silently** under JsonUtility works here. You have
to turn on an option, though, and that option carries a warning.

```csharp
private static readonly JsonSerializerSettings PolymorphicSettings = new()
{
    // Writes type info into a $type field. Without it, you only get the base class back.
    TypeNameHandling = TypeNameHandling.Auto,
};

string json = JsonConvert.SerializeObject(items, PolymorphicSettings);
var restored = JsonConvert.DeserializeObject<List<Weapon>>(json, PolymorphicSettings);
```

From the Newtonsoft docs:

> **`TypeNameHandling` should be used with caution when your application
> deserializes JSON from an external source.** Incoming types should be
> **validated with a custom `SerializationBinder`** when deserializing with a
> value other than `None`.

It means the serializer constructs whatever type `$type` names, so **don't turn
it on for JSON someone else hands you**, like a server response. Data whose
origin is you — your own save file — is the safe use.

### Pinning the Version in the Project

Installing through the Package Manager writes the result into
`Packages/manifest.json`. To make the whole team use one version, editing that
file directly is the sure way.

```json
{
  "dependencies": {
    "com.unity.nuget.newtonsoft-json": "3.2.2"
  }
}
```

But this has to mean **"pin to current latest," not "pin to something old"** —
for exactly the reason in the table above.

### Where Not to Use It

- **Typing a stale number in the version field.** Empty gets you the latest
  release.
- **Installing without checking.** It may already be in `packages-lock.json`.
- **Keeping `jillejr.newtonsoft.json-for-unity` around.** They don't coexist.
- **Turning on `TypeNameHandling` for JSON someone else gives you.** Binder
  validation comes first.
- **Reaching for it on a save file whose shape you define.** JsonUtility does
  that job with no dependency.

## Wrapping Up

- The package is `com.unity.nuget.newtonsoft-json`; latest per the docs is
  **3.2.2**, and what's inside is **Newtonsoft.Json 13.0.2**.
- **It not showing up in the Package Manager list is normal.** That's what Add
  package by name is for.
- **Leave the version field empty.** The manual says entering only the package
  name gets the latest compatible version, and pre-releases don't sneak in.
- **Avoid `3.0.1`.** After it came the AOT/Editor DLL update (3.1.0), the
  strong name fix (3.2.0), and the netstandard 2.0 compile fix (3.2.1).
- **Check `Packages/packages-lock.json` before installing.** Indirect
  dependencies are recorded there, so that's where you see if it's already in.
- **It cannot coexist with `jillejr.newtonsoft.json-for-unity`.** The converters
  package can stay.
- **Empty fields on IL2CPP means suspect stripping.** The linker can't always
  detect reflection. Block it with `[Preserve]` or `link.xml`.
- **`TypeNameHandling` only for data you originated.** External JSON needs
  binder validation.

The install guide is short because installing really is short. But the shorter
the procedure, **the more a single number gets copied forward and sticks
around.** `3.0.1` was an example value in a 2022 document; today, typing it
skips three IL2CPP-related fixes.

---

### References

- [Newtonsoft Json Unity Package — Unity docs](https://docs.unity3d.com/Packages/com.unity.nuget.newtonsoft-json@3.2/manual/index.html)
- [Newtonsoft Json package changelog](https://docs.unity3d.com/Packages/com.unity.nuget.newtonsoft-json@3.2/changelog/CHANGELOG.html)
- [Install a package by name — Unity Manual](https://docs.unity3d.com/Manual/upm-ui-quick.html)
- [Lock files — Unity Manual](https://docs.unity3d.com/Manual/upm-conflicts-auto.html)
- [Preserving code using annotations — Unity Manual](https://docs.unity3d.com/6000.3/Documentation/Manual/managed-code-stripping-preserving.html)
- [PreserveAttribute — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Scripting.PreserveAttribute.html)
- [TypeNameHandling — Newtonsoft.Json docs](https://www.newtonsoft.com/json/help/html/T_Newtonsoft_Json_TypeNameHandling.htm)
- [Install official via UPM — applejag wiki](https://github.com/applejag/Newtonsoft.Json-for-Unity/wiki/Install-official-via-UPM)

The starting point for this post was [달시_Dalsi — \[Unity\] Newtonsoft Json 설치 방법](https://data-pandora.tistory.com/entry/Unity-newtonsoft-json-%EC%84%A4%EC%B9%98-%EB%B0%A9%EB%B2%95)
(2025-02-23). I followed its install steps as written and checked the version
field, and where its number came from, against Unity's docs and changelog.
