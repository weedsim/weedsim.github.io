---
pubDatetime: 2026-10-05T17:45:00+09:00
title: "Create an asmdef and Assembly-CSharp Goes Dark"
lang: en
translationKey: assembly-definition-files
featured: false
draft: false
tags:
  - Unity
  - C#
  - Assembly
  - Compilation
  - Editor
  - Optimization
description: "I clipped the assembly definition files doc and it's the 2017.4 edition. Its account of one-directional dependency is right, but it never says the reverse direction is forbidden. That's the actual reason behind the 'all scripts or none' recommendation."
---

I clipped this **while watching scripts compile, wanting to understand Unity's
compilation process itself.** You save a script, a spinner turns in the bottom
right of the editor, and a moment later you can hit play again. What gets
compiled, in what unit, isn't visible in between.

Follow the docs and that unit has a name: the **assembly**. And in the default
state there's essentially only one of them, so the current docs state the
consequence in one line.

> Every time you change one script, Unity has to recompile all the other
> scripts, increasing overall compilation time for iterative code changes.

The clipping is Unity's official manual page on the remedy — **assembly
definition files** (`.asmdef`). The problem is the edition. The URL in `source`
reads `docs.unity3d.com/kr/2017.4/`. **It's the 2017.4 Korean manual, and the
field count has gone from 4 to 11 since.**

But something missing snags before the edition does. The clipping explains the
dependency like this:

> 미리 정의된 어셈블리는 **항상** 모든 어셈블리 정의 파일의 어셈블리에
> 종속됩니다.
>
> (The predefined assemblies **always** depend on all the assembly definition
> file assemblies.)

True. `Assembly-CSharp` can see the assemblies I create. But **there's no
mention that the reverse doesn't work.** The current docs keep a list of
references Unity doesn't allow, and its first line is this:

> References from custom assemblies created with an Assembly Definition to the
> predefined assemblies.

**A reference from an asmdef assembly to `Assembly-CSharp` is forbidden.** The
moment you move one script into an asmdef folder, that script can no longer see
the other scripts still sitting in `Assembly-CSharp`. Compilation doesn't get
slower — it **doesn't happen.**

## Table of contents

## Dependency Runs One Way, and the Reverse Is Forbidden

The sentence where the current docs state the default behavior is nearly
identical to the clipping's. One word differs.

> **By default,** the predefined assemblies reference all other assemblies,
> including those created with Assembly Definitions (1) and precompiled
> assemblies added to the project as plugins (2).

The clipping's **"always"** is **"by default"** in the current docs. What made
that difference is a switch called `Auto Referenced`, which comes up later.

What matters is that this reference is **one-directional.** The four predefined
assemblies reference my assemblies, and my assemblies can't reference those
four. The reason is in the next prohibited item on the same page.

> Cyclical references, which is when two assemblies reference each other.

Since a predefined assembly references **all** of my assemblies, my assembly
referencing `Assembly-CSharp` would be exactly that cycle. So one side is
forbidden. It isn't a choice; it falls out of the structure.

How that shows up in practice is the important part. The moment you drop an
`.asmdef` in a folder a boundary appears, and **that boundary can't see outward
from the inside.**

```text
Assets/
  Core/
    Game.Core.asmdef        ← the boundary appears here
    Health.cs               ← can't see types in Assembly-CSharp
  GameManager.cs            ← Assembly-CSharp. It can see Health
```

Using `Health` from `GameManager.cs` works. Using `GameManager` from
`Health.cs` doesn't. It means **dependencies have to be pushed inward** for an
assembly split to be possible at all, and that turns into a design question.

## "All or None" Has a Different Reason Than the One Written Down

The clipping carries a recommendation.

> 프로젝트의 모든 스크립트에 어셈블리 정의 파일을 사용하거나, 또는 어셈블리
> 정의 파일을 전혀 사용하지 않는 것이 좋습니다. 이렇게 하지 않으면 … 어셈블리
> 정의 파일을 사용하는 이점이 반감됩니다.
>
> (It's best to use assembly definition files for all the scripts in the
> project, or not use them at all. Otherwise … the benefit of using assembly
> definition files is **halved.**)

The 2017.4 English edition says the same thing.

> It is highly recommended that you use assembly definition files for all the
> scripts in the Project, or not at all.

**The reason given is that the benefit is halved.** That's a performance
argument. Split only halfway and `Assembly-CSharp` recompiles every time, so
the savings shrink — which is true.

But read it together with the prohibition from the previous section and **there
is a second reason, and it's the stronger one.** Split halfway and it isn't that
the effect shrinks; the code on the split side **cannot reference the code on
the unsplit side at all.** Not a slowdown, a compile error.

One thing to add here. **I couldn't find that recommendation in the current
docs.** Neither the
[organizing hub page](https://docs.unity3d.com/6000.2/Documentation/Manual/ScriptCompilationAssemblyDefinitionFiles.html)
nor the
[introduction to assemblies page](https://docs.unity3d.com/6000.2/Documentation/Manual/assembly-definitions-intro.html)
carries anything amounting to "all or nothing." They talk about modularity
instead.

> By defining assemblies, you can organize your code to promote modularity and
> reusability.

The recommendation's disappearance looks like a change of direction in itself.
In 2017 it was "split everything if you want the benefit"; now it's "draw
boundaries deliberately." **And in between, a tool that makes incremental
migration possible was added** — the `.asmref` seen further down.

## "You Can't Set Defines" Is Now Wrong

The clipping has a section titled "assembly definition files are not build
system files." The first part still holds.

> The assembly definition files are not assembly build files. They do not
> support conditional build rules typically found in build systems.

The trouble is the sentence attached after it.

> 그렇기 때문에 어셈블리 파일은 전처리 명령(define)의 설정도 지원하지
> 않습니다. **항상 정적이기 때문입니다.**
>
> (For that reason, assembly files also don't support setting preprocessor
> directives (defines). **Because they are always static.**)

**Neither half is true now.** Current asmdefs have two fields that deal with
defines, and one of them is named for defining symbols by version.

`defineConstraints` is the **reading** side. From the Inspector reference:

> Define constraints specify the scripting symbols that must be defined in your
> project for Unity to compile or reference an assembly. All the listed symbols
> must be defined for the assembly to compile.

**All** the listed symbols must be defined for the assembly to compile. It's an
AND. For what it's worth, a negated form is documented on the plugin side of
define constraints.

> You can use the '!' character to specify that a plug-in should be included
> only when a certain #define directive is **not** set in the currently defined
> define directives.

`versionDefines` is the **writing** side. The file format reference lists its
three fields.

> Contains an object for each version define. This object has three fields:
> `name`:string – The name of the resource. `expression`:string – The
> expression defining the version or range of versions of the resource.
> `define`:string – The symbol to define.

**The last field is "the symbol to define."** It looks at the version of a
package or module and defines a preprocessor symbol. Exactly the thing the
clipping said couldn't be done because things are always static.

Version expressions use mathematical interval notation.

| Expression | Evaluates to |
| --- | --- |
| `[1.3,3.4.1]` | `1.3.0 <= x <= 3.4.1` |
| `(1.3.0,3.4)` | `1.3.0 < x < 3.4.0` |
| `[2.4.5]` | `x = 2.4.5` |

Square brackets are inclusive, parentheses exclusive. The docs note the
constraint too — **no spaces and no wildcard characters are allowed.**

Used to branch input handling on a package version, it comes out like this:

```json
{
    "name": "Game.Input",
    "references": ["Unity.InputSystem"],
    "versionDefines": [
        {
            "name": "com.unity.inputsystem",
            "expression": "[1.14.0,2.0.0)",
            "define": "GAME_INPUTSYSTEM_1_14_OR_NEWER"
        }
    ]
}
```

Then the code splits on it.

```csharp
#if GAME_INPUTSYSTEM_1_14_OR_NEWER
    // the path that only exists from 1.14 up
#else
    // fallback for older versions
#endif
```

Splitting platforms with `#if` came up in
[the post on Application.Quit](/posts/unity-application-quit/). There the
symbols were ones **Unity defines for you** — `UNITY_EDITOR`, `UNITY_ANDROID` —
and here they're symbols **I create by writing a condition.** Different origin.
The post on Input System's generated class is
[here](/posts/input-generated-class/) — the generated output changes with the
package version, so there's a real place to use this field.

## The Field Count Went from 4 to 11

The clipping's file format table has four rows.

| Field | Type |
| --- | --- |
| `name` | string |
| `references` (optional) | string array |
| `includePlatforms` (optional) | string array |
| `excludePlatforms` (optional) | string array |

The current reference has eleven. In alphabetical order: `allowUnsafeCode`,
`autoReferenced`, `defineConstraints`, `excludePlatforms`, `includePlatforms`,
`name`, `noEngineReferences`, `overrideReferences`, `precompiledReferences`,
`references`, `versionDefines`. `name` is still the only required one.

Among the seven that were added, these are worth knowing by character.

| Field | What it does |
| --- | --- |
| `autoReferenced` | Whether the predefined assemblies auto-reference this assembly. `true` by default |
| `noEngineReferences` | When on, no references to `UnityEngine` / `UnityEditor` are added |
| `allowUnsafeCode` | Passes `/unsafe` to the compiler when you use the C# `unsafe` keyword |
| `overrideReferences` | A declaration that you'll specify the **precompiled** assemblies this depends on |
| `precompiledReferences` | The file names of those DLLs. Extension included, no path |
| `defineConstraints` | All these symbols must be defined for this to compile |
| `versionDefines` | Defines symbols based on package and module versions |

`autoReferenced`'s description has one extra line, and it's an easy place to get
confused.

> Specify whether this assembly is automatically referenced by Unity's
> predefined assemblies. When disabled, Unity does not automatically reference
> the assembly during compilation. **This has no effect on whether Unity
> includes the assembly in the build.**

**Cutting the reference and dropping it from the build are different things.**
Turn `autoReferenced` off and those types stop being visible from
`Assembly-CSharp`, but the assembly itself still goes into the build. It isn't a
switch for trimming size.

The official example for `precompiledReferences` contains a familiar name.

```json
{
    "name": "BeeAssembly",
    "references": ["Unity.CollabProxy.Editor", "AssemblyB"],
    "includePlatforms": ["Android", "LinuxStandalone64", "WebGL"],
    "excludePlatforms": [],
    "overrideReferences": true,
    "precompiledReferences": ["Newtonsoft.Json.dll", "nunit.framework.dll"],
    "autoReferenced": false,
    "defineConstraints": ["UNITY_2019", "UNITY_INCLUDE_TESTS"]
}
```

`Newtonsoft.Json.dll`. In
[the post on installing Newtonsoft Json](/posts/unity-newtonsoft-json-install/)
I looked at the case where the same type lands in two assemblies and collides;
`overrideReferences` and `precompiledReferences` are the means of **pinning that
collision at the assembly level.** Which DLL gets referenced is nailed down by
name.

### Referencing by GUID Instead of Name

The clipping's example writes references as assembly names.

```json
{
    "name": "MyLibrary",
    "references": [ "Utility" ],
    "includePlatforms": ["Android", "iOS"]
}
```

The current docs' second example looks different.

```json
{
    "name": "BeeAssembly",
    "references": ["GUID:17b36165d09634a48bf5a0e4bb27f4bd"],
    "excludePlatforms": ["iOS", "macOSStandalone", "tvOS"],
    "allowUnsafeCode": false,
    "overrideReferences": true
}
```

The Inspector's `Use GUIDs` switch decides this.

> This setting controls how Unity serializes references to other Assembly
> Definition assets. When you enable this property, Unity saves the reference as
> the asset's GUID, instead of the Assembly Definition name.

The gain is clear.

> allows you to change the filename of the referenced Assembly Definition asset
> without updating references in other Assembly Definitions to reflect the new
> name.

**Rename and references survive.** A condition comes with it, though. The GUID
lives in the `.meta` file, so deleting a `.meta` or moving files outside the
editor changes the GUID and breaks the reference. Why every `.meta` file belongs
in version control came up in
[the post on untracking Git LFS](/posts/git-lfs-untrack/). There the argument was
not to put them in LFS because there are so many of them; **that the identity of
a reference lives inside them** is the more fundamental reason.

### Root Namespace Exists Only in the Inspector

The current Inspector has a `Root Namespace` field.

> The default namespace for scripts in this assembly definition. If you use
> either Rider or Visual Studio as your code editor, they automatically add this
> namespace to any new scripts you create in this assembly definition.

Yet **`rootNamespace` isn't among the file format reference's eleven fields.**
It's in the Inspector reference and absent from the file format reference. One of
the two looks less updated than the other. When hand-editing an asmdef, setting
it once through the Inspector and checking the saved JSON is the safer route.

For the record, the clipping's example JSON is broken one more layer down. It
uses smart quotes (`“ ”` instead of `"`) and the brackets are escaped, so copied
as-is it **won't parse as JSON.** That's an accident of the scrape rather than a
problem with the docs, but it snags if you want to paste straight from the
clipping.

## Procedures That Changed Between 2017.4 and Now

The steps you follow by hand changed too. The clipping's menu path reads:

> 어셈블리 정의 파일은 **Assets** > **Create** > **Assembly Definition** 을
> 선택하여 생성할 수 있는 에셋 파일입니다.
>
> (An assembly definition file is an asset file you can create by selecting
> **Assets** > **Create** > **Assembly Definition**.)

The current path is **Assets > Create > Scripting > Assembly Definition**. A
`Scripting` step got inserted in the middle. And the same menu has one more item
that didn't exist in 2017.4 — **Assembly Definition Reference** (`.asmref`).

| | `.asmdef` | `.asmref` |
| --- | --- | --- |
| What it does | Defines a new assembly | Puts this folder's scripts into an **existing** assembly |
| Inspector | Name, references, platforms, constraints, … | A single target assembly definition |
| Where it fits | Drawing a new boundary | Pulling a distant folder inside an existing boundary |

So the nesting rule's wording changed as well. The clipping says each script is
added to the assembly definition file with the shortest path distance. The
current version reads:

> The new assembly includes all scripts in the same folder as the Assembly
> Definition plus those in any subfolders that don't have their own Assembly
> Definition **or Reference** file.

Meaning an `.asmref` cuts the boundary too. Same outcome, but there are now two
things that can cut it.

### Editor Folders End Up in a Runtime Assembly

The clipping only notes that asmdef takes precedence over special folders. The
current docs spell out the consequence.

> Unity normally compiles any scripts in folders named `Editor` into the
> predefined `Assembly-CSharp-Editor` assembly no matter where those scripts are
> located.

> if you create an Assembly Definition asset in a folder that has an `Editor`
> folder underneath it, Unity no longer puts those Editor scripts into the
> predefined Editor assembly. Instead, they go into the new assembly created by
> your Assembly Definition.

**Code you parked in an `Editor` folder goes into a runtime assembly.** If it
uses `UnityEditor` in there, the player build has nowhere to resolve the
reference. It's **the same shape** as the conflict from putting `[MenuItem]` on a
MonoBehaviour in [the post on attributes](/posts/unity-attributes/). That post
noted the manual offers assembly definition assets as the alternative to `Editor`
folders; the alternative brings this trap along with it.

The fix is to give editor code **its own asmdef with platforms restricted to
Editor.** Looking at the predefined assembly rules alongside it shows why.

| Phase | Assembly | Scripts that go in |
| --- | --- | --- |
| 1 | `Assembly-CSharp-firstpass` | Runtime scripts in folders called `Plugins` |
| 2 | `Assembly-CSharp-Editor-firstpass` | Editor scripts in `Editor` folders inside top-level `Plugins` |
| 3 | `Assembly-CSharp` | Everything else not inside an `Editor` folder |
| 4 | `Assembly-CSharp-Editor` | Everything remaining that is inside an `Editor` folder |

> The basic rule is that a script can reference anything compiled in its own
> compilation phase or an earlier one, but can't reference anything compiled in
> a later phase.

**These four phases are switched off wholesale once you use asmdefs.** Ordering
problems the phases solved for you have to be solved directly in the reference
graph, and the editor/runtime split is one of them.

## The Figure 3 Caption Counts the Same Thing Twice

Edition aside, the Korean edition has an error of its own. Here's the clipping's
description of Figure 3:

> **그림 3** 의 다이어그램은 미리 정의된 어셈블리, 어셈블리 정의 파일 어셈블리,
> **미리 정의된 어셈블리**의 상호 종속성을 도해로 설명합니다.
>
> (The diagram in **Figure 3** illustrates the interdependencies of predefined
> assemblies, assembly definition file assemblies and **predefined
> assemblies**.)

It lists three items, and the first and third say the same thing. The 2017.4
English edition settles it.

> The diagram in **Figure 3** illustrates the dependencies between predefined
> assemblies, assembly definition files assemblies and **precompiled
> assemblies**.

The third is `precompiled assemblies` — the DLLs you add as plugins.
`precompiled` was carried over as `predefined`, and **one of the three kinds
vanished from the list.**

The grounds for calling it an error rather than a translation choice are in the
paragraph immediately before, in the same section, where the term is rendered
correctly.

> 모든 스크립트가 Unity 에디터의 액티브 빌드 타겟과 호환되는 모든 **미리
> 컴파일된 어셈블리(플러그인/.dll)** 에 종속되는 것과 유사합니다.
>
> (Similar to how all scripts depend on all **precompiled assemblies
> (plugins/.dll)** compatible with the Unity editor's active build target.)

**The same word was carried over two different ways within one section.** And
the item that vanished is what `precompiledReferences` above points at, so the
gap isn't a small one. Distinguishing the three kinds:

| Kind | Example | How my asmdef references it |
| --- | --- | --- |
| Predefined assembly | `Assembly-CSharp` | Forbidden |
| Assembly definition assembly | my own `Game.Core` | `references` |
| Precompiled assembly | `Newtonsoft.Json.dll` | `overrideReferences` + `precompiledReferences` |

Errors in the Korean manual have come up before.
[The GPU instancing doc](/posts/gpu-instancing-shader/) was missing a letter from
a macro name. When reading the Korean manual, **opening the English edition the
moment a name snags** is the faster route.

## Where and Why You'd Use It

### Make Dependencies Point Inward Only

Because of the prohibition, splitting assemblies becomes **the work of sorting
out dependency direction.** The inside (asmdef) can't see the outside
(`Assembly-CSharp`), so anything the outside is needed for gets inverted through
an interface.

Code that goes inside the boundary. It references no type from outside.

```csharp
// inside Assets/Core/Game.Core.asmdef
using System;
using UnityEngine;

namespace Game.Core
{
    public interface IDamageable
    {
        void TakeDamage(int amount);
    }

    [DisallowMultipleComponent]
    public class Health : MonoBehaviour, IDamageable
    {
        private const int DEFAULT_MAX = 100;

        [Header("Health")]
        [SerializeField, Range(1, 999), Tooltip("Maximum health")]
        private int _maxHealth = DEFAULT_MAX;

        private int _current;

        // The outer assembly subscribes. The inside doesn't know who listens.
        public event Action<int, int> HealthChanged;
        public event Action Died;

        public int Current => _current;

        private void Awake()
        {
            _current = _maxHealth;
        }

        public void TakeDamage(int amount)
        {
            if (amount <= 0 || _current <= 0)
            {
                return;
            }

            _current = Mathf.Max(_current - amount, 0);
            HealthChanged?.Invoke(_current, _maxHealth);

            if (_current == 0)
            {
                Died?.Invoke();
            }
        }
    }
}
```

The glue code left outside. This side **can** reference the inside.

```csharp
// Assets/GameplayGlue.cs — Assembly-CSharp
using Game.Core;
using UnityEngine;

public class GameplayGlue : MonoBehaviour
{
    private const string PLAYER_TAG = "Player";

    [Header("Wiring")]
    [SerializeField, Tooltip("The health to watch")]
    private Health _playerHealth;

    private void Awake()
    {
        if (_playerHealth == null && !TryGetComponent(out _playerHealth))
        {
            return;
        }

        _playerHealth.Died += OnPlayerDied;
    }

    private void OnDestroy()
    {
        if (_playerHealth == null)
        {
            return;
        }

        // Always unsubscribe. The event outlives the component.
        _playerHealth.Died -= OnPlayerDied;
    }

    private void OnTriggerEnter(Collider other)
    {
        // Use CompareTag instead of a string comparison.
        if (!other.CompareTag(PLAYER_TAG))
        {
            return;
        }

        if (other.TryGetComponent(out IDamageable damageable))
        {
            damageable.TakeDamage(10);
        }
    }

    private void OnPlayerDied()
    {
        Debug.Log("player died", this);
    }
}
```

**`event` and interfaces are the tools that invert direction.** `Health` doesn't
know who subscribes to it, so it has no need to reference outward. Depending on
an abstraction to swap the concrete type is the same shape seen in
[the post on the factory pattern](/posts/factory-pattern/), except the motive
here isn't design taste — **the compiler is blocking it.**

Why `_playerHealth == null` isn't written as `?.` is in
[the post on Fake Null](/posts/unity-fake-null/). A Unity object keeps its managed
reference after being destroyed, and `?.` doesn't filter that state out.

### Decide Where to Cut

Where to draw a boundary is decided by reference direction. An order that
actually works:

1. **Start with code that references nothing.** Math utilities, pure data types,
   extension methods. They don't look outward, so they can't hit the
   prohibition.
2. Group the layer **that references only those utilities** next.
3. Glue code that has to know specific objects in the scene **stays in
   `Assembly-CSharp`.** It's also the code you change most often.
4. Editor code goes into **its own asmdef with platforms set to Editor.**

Use `.asmref` only when you want to merge a distant folder into an existing
assembly. Being able to adjust a boundary without moving folders is the slack
that didn't exist in 2017.4.

### Where Not to Use It

- **Moving a few scripts into an asmdef as a trial.** The moved side can't
  reference what's left. Move code with no references first.
- **Turning `autoReferenced` off to reduce size.** The docs say it plainly — it
  has no effect on build inclusion.
- **Relying on `Editor` folders to separate editor code.** If a parent folder has
  an asmdef, that folder name loses its meaning.
- **Keeping references by name and then renaming files.** With `Use GUIDs` on, a
  rename doesn't break references.
- **Using `defineConstraints` to branch by platform.** Platforms are
  `includePlatforms` / `excludePlatforms`' job, and the docs say not to use the
  two together in one file.
- **Reading the 2017.4 doc and concluding asmdefs can't create defines.**
  `versionDefines` does exactly that.

## Wrapping Up

- **Dependency runs one way and the reverse is forbidden.** Predefined
  assemblies reference mine; mine can't reference the predefined ones. Because
  they reference all of them, the reverse direction is itself a cycle.
- **That's the actual reason behind "all or none."** The reason the clipping
  gives is that the benefit is halved; split halfway and it isn't that the effect
  shrinks — it won't compile.
- **I couldn't find that recommendation in the current docs.** They talk about
  modularity and reusability instead, and `.asmref` was added for incremental
  migration.
- **"You can't set defines" is wrong.** `defineConstraints` reads symbols and
  `versionDefines` **defines** them from package versions. The clipping's stated
  grounds — "because they are always static" — goes with it.
- **The field count went from 4 to 11.** Among them `autoReferenced` only cuts
  the reference and has no effect on build inclusion. Turning on `Use GUIDs`
  keeps references through a rename, and that value lives in the `.meta` file.
- **`Root Namespace` is only in the Inspector reference.** `rootNamespace` is not
  among the file format reference's eleven fields.
- **A `Scripting` step got inserted into the menu path and `.asmref` appeared.**
  The nesting rule now reads "subfolders that don't have their own Assembly
  Definition or Reference file."
- **Placing an asmdef switches off the four special-folder phases.** `Editor`
  folder code goes into a runtime assembly, so editor code gets its own asmdef
  with platforms restricted.

---

### References

- [Organizing scripts into assemblies — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/ScriptCompilationAssemblyDefinitionFiles.html) ·
  [Introduction to assemblies in Unity](https://docs.unity3d.com/6000.2/Documentation/Manual/assembly-definitions-intro.html)
- [Referencing assemblies — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/assembly-definitions-referencing.html)
- [Creating assembly assets — Unity Manual](https://docs.unity3d.com/6000.0/Documentation/Manual/assembly-definitions-creating.html)
- [Assembly Definition properties reference — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/class-AssemblyDefinitionImporter.html)
- [Assembly Definition file format reference — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/assembly-definition-file-format.html)
- [Conditionally including assemblies — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/assembly-definition-includes.html)
- [Predefined assemblies reference — Unity Manual](https://docs.unity3d.com/6000.1/Documentation/Manual/script-compile-order-folders.html)
- [PluginImporter.DefineConstraints — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/PluginImporter.DefineConstraints.html)
- [CompilationPipeline — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Compilation.CompilationPipeline.html)
- [Script compilation and assembly definition files — Unity 2017.4 Manual (the clipping's edition)](https://docs.unity3d.com/2017.4/Documentation/Manual/ScriptCompilationAssemblyDefinitionFiles.html)

The starting point for this post was
[스크립트 컴파일 및 어셈블리 정의 파일](https://docs.unity3d.com/kr/2017.4/Manual/ScriptCompilationAssemblyDefinitionFiles.html)
(the Unity 2017.4 Korean manual). I re-checked its explanations and field table
against the current Unity 6 docs, and verified the translation against the 2017.4
English edition.
