---
pubDatetime: 2026-09-06T17:00:00+09:00
title: "Unity's JsonUtility: The Limits Come From the Serializer, Not From JSON"
lang: en
translationKey: unity-jsonutility
featured: false
draft: false
tags:
  - Unity
  - C#
  - JSON
  - Serialization
  - Data
description: "Rather than memorising JsonUtility's list of limitations, one rule predicts them: if it isn't visible in the Inspector, it isn't in the JSON. Plus the most dangerous item, which the manual never mentions — polymorphism."
---

Building a game in Unity, I needed to **read JSON data in**. So I went looking
for Unity's JSON serialization manual and clipped it — a single page covering
`JsonUtility.ToJson`, `FromJson` and `FromJsonOverwrite`, plus supported types
and performance.

What the page gives you is **a list of things that don't work**: no
`Dictionary`, no top-level arrays, fields only, no unstructured JSON. But a
list alone doesn't tell you *why* those particular things, so the moment you
hit a limitation that isn't on the list, you're stuck again.

There is, in fact, one sentence in the document that unlocks the rest. I've
reorganised around it, with the goal of **replacing the list with a single
predictive rule.** And to say it up front: **if reading data in is the goal,
JsonUtility is quite likely not the answer.** Why that is follows from the same
rule.

## Table of contents

## The basic usage

Three calls, and that's all.

```csharp
[Serializable]
public class SaveData
{
    public int level;
    public float timeElapsed;
    public string playerName;
}

// serialize
string json = JsonUtility.ToJson(myObject);
// {"level":1,"timeElapsed":47.5,"playerName":"Dr Charles Francis"}

// deserialize (new instance)
myObject = JsonUtility.FromJson<SaveData>(json);

// deserialize (overwrite an existing instance)
JsonUtility.FromJsonOverwrite(json, myObject);
```

The matching rule the document states is clear: **fields present in the JSON
but absent from the class are ignored, and fields present in the class but
absent from the JSON keep their existing value.**

Which is what makes `FromJsonOverwrite` useful as a "patch." Overwrite with
JSON containing only some fields and the rest stay as they were — a fit for
patterns like pulling only changed settings down from a server.

And there's one hard rule:

> When you deserialize JSON into a subclass of `MonoBehaviour` or
> `ScriptableObject`, you must use FromJsonOverwrite. FromJson is not supported
> and throws an exception.

Which makes sense: you can't `new` a `MonoBehaviour`, so `FromJson` has no way
to return a fresh instance.

## The limits come from Unity's serializer, not from JSON

Here's the crux. This one sentence in the document explains everything else.

> The object you pass in is fed to the standard Unity serializer for
> processing, so **the same rules and limitations apply as in the Inspector.**

`JsonUtility` is not its own JSON engine. It's **the same serializer Unity uses
to save scenes and prefabs, with JSON bolted on as an output format.** Which is
why the limitations have nothing to do with the properties of JSON. JSON itself
can express nested objects, heterogeneous arrays and null perfectly well. What
can't is Unity's serializer.

From which one rule falls out:

> **If it isn't visible in the Inspector, it isn't in the JSON.**

This rule beats the document's list because it predicts the cases the list
doesn't cover. If you can see the field in the Inspector it goes out as JSON;
if not, it doesn't. And checking is easy — just look at the Inspector.

## What actually bites

Pulling the relevant items from Unity's serialization rules documentation:

### Properties aren't serialized

> Unity doesn't serialize properties.

The first thing that catches anyone coming from Newtonsoft. Auto-properties
included.

```csharp
public int Level { get; set; }     // won't appear in the JSON
public int level;                  // will
[SerializeField] private int hp;   // will
```

`static`, `const` and `readonly` are excluded too. Make a save-data class
immutable with `readonly` and you get an empty object.

### Dictionary and nested containers don't work

> Unity doesn't support serialization of multilevel types (multidimensional
> arrays, jagged arrays, dictionaries, and nested container types).

Not just `Dictionary<,>` but **multidimensional arrays and nested containers as
a whole.** Things games use constantly land here.

```csharp
public int[,] grid;                  // no
public List<List<int>> rows;         // no
public Dictionary<string,int> stats; // no
```

This is where trying to store tilemap or grid data directly stops. The
workaround is **flattening to one dimension and storing the width separately**,
or keeping two parallel `List`s.

### Top-level arrays don't work

> Unity does not support passing other types directly to the API, such as
> primitive types or arrays.

You can't take JSON shaped as `[{...},{...}]` directly. Server APIs return
arrays at the top level all the time, and this is where that stops. The
workaround is a wrapper class.

```csharp
[Serializable]
public class Wrapper<T> { public T[] items; }

// if the server sends [{...},{...}], wrap it
string wrapped = "{\"items\":" + json + "}";
var list = JsonUtility.FromJson<Wrapper<Item>>(wrapped).items;
```

If splicing strings together by hand feels wrong, that's also a signal that
this isn't JsonUtility's job.

### null can't be represented

Not in the document, but common in practice. Unity's serializer can't store
null in a reference to a custom class. **Instead of null it puts an object with
empty fields.**

```csharp
public class Player { public Weapon weapon; }   // weapon = null

// ToJson output
{"weapon":{"name":"","damage":0}}
```

Represent "no equipment" as null and after a save/load round trip you have
**a weapon equipped whose name is an empty string.** Every null-check branch
misfires. If you need to express "none," a separate flag or sentinel value is
safer.

### Polymorphism breaks silently

**The most dangerous item, and it isn't in the document.** From Unity's
serialization rules:

> Unity only serializes the fields that belong to the parent class. When Unity
> deserializes the class instance, it instantiates the parent class instead of
> the derived class.

Say the inventory looks like this:

```csharp
[Serializable] public class Item { public string name; }
[Serializable] public class Weapon : Item { public int damage; }

public class Inventory { public List<Item> items; }
```

Save with a `Weapon` in it and **`damage` disappears**; load it back and you get
**an `Item`, not a `Weapon`.** No exception, no warning. It only surfaces as a
`null` at the cast site or as missing data.

Inventories, skill lists, quest conditions — **collections of a base class
holding derived types** are everywhere in games. Which is why this single item
is often what makes people give up on JsonUtility.

## The escape hatch the document omits: `[SerializeReference]`

Both of the above have an answer. The serialization rules documentation names
it.

- null — "Using `[SerializeReference]` allows null values."
- polymorphism — "Using `[SerializeReference]` supports polymorphism
  correctly."

```csharp
[SerializeReference] public List<Item> items;   // a Weapon comes back a Weapon
```

The attribute never appears in the JSON manual. You only find it by reading the
two pages together. It is reference-based, though, which changes the output
shape and the cost — so apply it to the fields that need it rather than
everywhere.

## When is that performance claim from?

The document's performance section opens with:

> Benchmark tests indicate that JsonUtility is significantly faster than
> popular .NET JSON solutions, even though this class provides fewer features
> in some cases.

**That sentence has no date, no named comparison, and no method.** The clipping
is the 2018.4 documentation, and the same sentence is still in the Unity 6
documentation — so the claim has stood unverified for at least eight years.
Given how much the ".NET JSON solutions" it was measured against have changed
since, **this isn't a sentence to choose on.**

The GC notes in the same section, by contrast, are specific and still useful.

- `ToJson()` — allocates only for the returned string
- `FromJson()` — allocates only for the returned object and its sub-objects
- `FromJsonOverwrite()` — allocates only for the fields actually written.
  **If every field being overwritten is a value type, there's no GC
  allocation.**

That last one is actionable. For data refreshed every frame, reusing an object
via `FromJsonOverwrite` beats creating a new one with `FromJson` on GC
pressure. The document also states these APIs may be called from a background
thread.

## So when do you use what?

- **JsonUtility** — when you define the class, you write it, and you read it.
  Save files, settings, intermediate data for editor tools. No dependency and
  low GC.
- **Newtonsoft Json.NET** — distributed by Unity as an official package
  (`com.unity.nuget.newtonsoft-json`, Newtonsoft.Json 13.0.2). Dictionaries,
  polymorphism, null, top-level arrays and unstructured traversal all work.
  **If you have to take JSON someone else defined, this is effectively it.**
- **System.Text.Json** — the .NET standard option. In Unity it arrives via
  NuGetForUnity, and you need to check whether its reflection path holds up
  under IL2CPP. I wrote up the traps in that combination separately in
  [the Unity Gemini client post](/en/posts/unity-gemini-client/).

The criterion compresses to one line: **if you define the shape of the JSON,
JsonUtility; if someone else does, Newtonsoft.**

Which is what the opening was about. **"Reading it in" usually means you didn't
define the shape.** Server response or external data file, the top level may be
an array, keys may be dynamic, values may be null, and the field set may vary
by type. Every limitation above lands exactly there.

Reading back a save file you wrote yourself is the opposite case — you defined
the shape, and JsonUtility fits well. **Even for "reading," the question is
where it came from.**

## Summary

- `JsonUtility` isn't its own JSON engine — it's **Unity's serializer with JSON
  as an output format.** That's why its limits have nothing to do with JSON.
- One rule predicts them: **if it isn't visible in the Inspector, it isn't in
  the JSON.**
- Properties aren't serialized. Neither are `static`, `const` or `readonly`.
- Not just `Dictionary` but **multidimensional arrays and nested containers as
  a whole**. Grid data has to be flattened.
- Top-level arrays need a wrapper class.
- **null can't be represented.** A custom class reference becomes an empty
  object instead, so null checks misfire.
- **Polymorphism breaks silently.** Derived types in a base-class collection
  lose their derived fields and come back as base instances, with no exception
  or warning.
- The answer to both is `[SerializeReference]` — which **the JSON manual never
  mentions.**
- The performance claim has no date, target or method, and has been unchanged
  for eight years. The GC notes are specific, though, and
  `FromJsonOverwrite` allocates nothing when overwriting only value types.
- **If you define the JSON's shape, JsonUtility; if someone else does,
  Newtonsoft.**

## References

- [JSON Serialization — Unity](https://docs.unity3d.com/6000.3/Documentation/Manual/json-serialization.html)
- [Script serialization rules — Unity](https://docs.unity3d.com/6000.3/Documentation/Manual/script-serialization-rules.html)
- [Newtonsoft Json Unity Package](https://docs.unity3d.com/Packages/com.unity.nuget.newtonsoft-json@3.2/manual/index.html)
- Original (Korean): [JSON 직렬화 (2018.4)](https://docs.unity3d.com/kr/2018.4/Manual/JSONSerialization.html)
