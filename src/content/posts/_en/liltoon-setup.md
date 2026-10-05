---
pubDatetime: 2026-10-05T17:10:00+09:00
title: "The Lite Version Doesn't Show Up in the Shader List"
lang: en
translationKey: liltoon-setup
featured: false
draft: false
tags:
  - Shader
  - Graphics
  - Unity
  - lilToon
  - VRChat
  - Optimization
description: "The introduction page of lilToon's official docs. It recommends converting a material rather than assigning the Lite version directly, and gives 'more intuitive' as the reason. The actual reason is that the shader's name starts with Hidden/, so it never appears in the material dropdown at all."
---

I clipped this **while applying a toon shader.** Earlier I
[cross-checked lilToon's parameters entry by entry](/posts/liltoon-parameters/),
and handling them took me all the way down to
[what a shader even is](/posts/what-is-a-shader/). This time the page came up
**while looking into the application procedure itself in detail** — lilToon's
official **「はじめに」(Introduction)**, the entrance that packs installation
through the shader variation list into one page.

The parameters post looked at **Inspector entries**; this one looks at **what you
choose before you ever reach that Inspector.** Which install route, which shader,
which Unity version it runs on. Being stuck on one unknown parameter costs less
than **choosing wrong at this entrance and finding out much later.**

One thing snags. On the last row of the shader variation table, the docs
recommend this.

> Lite版から直接マテリアルを設定せず、通常版で作成したものを変換するとより直感的にマテリアル設定が可能です。
>
> (Rather than setting up a material directly from the Lite version, converting
> one created with the normal version makes material setup more intuitive.)

The reason given is **"more intuitive."** It reads like a matter of taste. Yet
the shader name on that same row of that same table is `Hidden/lilToonLite`. **A
shader whose name begins with that never comes up in the shader dropdown of the
Material Inspector at all.** Conversion is recommended not because it's more
intuitive, but because it's effectively the only route.

## Table of contents

## The Three Install Routes Don't Give the Same Result

STEP 1 lists three install methods and says to take **"any one of them"**
(どれか一つ).

| Route | Where it comes from | Updating |
| --- | --- | --- |
| `.unitypackage` | Download the zip from BOOTH → drag into the Project window | Manual. Fetch the new version and import again |
| VPM (VCC / ALCOM) | Register the `vpm.json` repository → install from the package list | Pick from the versions in the package list |
| UPM Git URL | Enter the Git URL in Package Manager | Package Manager's Update |

These do not come out the same. Where the three diverge is **after** installation.

A `.unitypackage` only unpacks files into the project. No version information is
left in the project, so updating becomes "fetch a new zip and import it again."
Which means **it overwrites files that are already there.**

The docs themselves warn about that problem in another section — the one on
distributing works made with lilToon.

> シェーダー本体と制作物を1つのunitypackageにまとめる方法は、ユーザーがインポート時に古いバージョンで上書きしてしまう問題が発生する可能性があるため非推奨です
>
> (Bundling the shader itself and your work into a single unitypackage is not
> recommended, because users may **overwrite with an older version** when they
> import.)

**The route STEP 1 said to pick freely becomes the reason for a "not
recommended" in the distribution section.** The two sections aren't
contradictory. When I install it myself I know which version I have; once it's
baked into a distribution I don't know the recipient's. But **"any one of them"
hides that difference.**

Unity's docs attach their own conditions to the UPM Git URL route.

> Install the Git client (minimum version 2.14.0) on your computer.

On Windows you also have to add the Git executable path to the `PATH`
environment variable. And two cautions come with it.

> there's no guarantee about the package quality, stability, validity, or even
> whether the version stated in its `package.json` file respects Semantic
> Versioning rules.

> If the Git repository uses Git LFS, the imported package might contain pointer
> files instead of the actual content.

**Unlike the registry route, version rules aren't guaranteed.** That a repository
using Git LFS may deliver pointer files instead of actual content is another trap
the registry doesn't have. In
[the post on installing Newtonsoft Json](/posts/unity-newtonsoft-json-install/) I
looked at why you leave Package Manager's version field blank; the Git URL route
is the one where that version field doesn't exist at all.

For a VRChat avatar the choice is effectively settled. It's the one the docs
recommend in the distribution section — **tell users to install via VCC** — and
the VPM route is the only one that records the shader's version in the project
manifest.

## A Shader's Name Decides the Material Dropdown

The last table in the docs lists six shader variations. Written out exactly:

| Name | Purpose (per the docs) |
| --- | --- |
| `lilToon` | The main shader. Use this for general purposes |
| `_lil/[Optional] lilToonOverlay` | A transparent shader for layering over a material. Unneeded passes are stripped, so it's cheaper than layering a normal transparent shader |
| `_lil/[Optional] lilToonOutlineOnly` | Outline only. On a hard-edged model, assigning this to a separate mesh with smooth normals draws a cleaner outline |
| `_lil/[Optional] lilToonFurOnly` | Draws only the hair part of fur. Recommended for layering over a normal shader, or combining cutout fur with transparent fur |
| `_lil/lilToonMulti` | The version that uses shader keywords. Build size grows easily when a large number of materials is used |
| `Hidden/lilToonLite` | Greatly lightened while keeping some of the normal version's look |

**These names aren't descriptions, they're addresses.** Unity's docs say so
explicitly. The `Shader.Find` page describes the name it takes like this:

> the name you can see in the shader popup of any material, for example
> 'Standard', 'Unlit/Texture', 'Legacy Shaders/Diffuse' etc.

So the string you write in `Shader "..."` **is the path shown in a material's
shader popup.** Slashes become submenus.

### Starting with `Hidden/` Means It's Not in the List

The docs don't explain what the `Hidden/` prefix does. **Neither does Unity's
manual.** The `ShaderLab` page covering shader name syntax stops at the level of
"Defines a Shader object with a given name."

The behavior is in the editor source. `ShaderDropdownDataBuilder.EnumerateShaders`
in `MaterialEditor.cs`, which builds the list for the Material Inspector's shader
dropdown, does this as its first filter.

```csharp
var shaders = ShaderUtil.GetAllShaderInfo();
foreach (var shader in shaders)
{
    var shaderName = shader.name;
    if (shaderName.StartsWith("Deprecated") || shaderName.StartsWith("Hidden"))
        continue;
    // ...
}
```

It's `continue`. **Not folded into a submenu — dropped from the enumeration
itself.** So `Hidden/lilToonLite` isn't in the dropdown no matter how hard you
dig.

There's a detail. The string being compared is **`"Hidden"`**, not `"Hidden/"`.
No slash. A shader named `HiddenThing` disappears along with it. And no
`StringComparison` is given, so it's a culture-dependent comparison — the same
spot as the Turkish `I` problem, though `Hidden` has no capital I, so it won't
bite in practice.

Line that up and the recommendation reads differently. **"Don't set up a material
directly from the Lite version" is less a recommendation than a statement of
fact.** You can't pick it from the dropdown. Instead lilToon puts a **conversion
feature** on its
[optimization page](https://lilxyzw.github.io/lilToon/ja_JP/other/optimization.html)
— buttons that convert to the Lite version, the Multi version, or MToon (for
VRM). That button is the route around `Hidden/`.

### `_lil/` Is a Submenu, Not a Prefix

Four entries in that table start with `_lil/`. The docs put it this way:

> "\_lil"内にあるシェーダーは特殊なものなので、基本的には通常の"lilToon"を選択してください
>
> (The shaders **inside** `_lil` are special ones, so in general please select
> the normal `lilToon`.)

**"Inside `_lil`"** is the precise phrasing. The prefix carries no special
meaning; the part before the slash becomes a menu folder name. `_lil` as a name
is just a convention of prefixing an underscore so it sorts ahead of the
alphabet.

The same `EnumerateShaders` splits the list by presence of a slash on the next
lines.

```csharp
if (shaderName.StartsWith("Legacy Shaders/")) { legacy.Add(shaderName); continue; }

if (!shaderName.Contains("/")) { unnested.Add(shaderName); continue; }

normal.Add(shader.name);
```

Names **without** a slash are collected separately into `unnested`. The two lists
are then each sorted and emitted in `normal` → `unnested` order. So `lilToon`
isn't inside a submenu — it's a **top-level item** — while the four `_lil/...`
entries go into the `_lil` submenu.

The docs' "in general select the normal `lilToon`" therefore means **"don't go
into the submenu; pick the one at the top level."**

### Being in the List Doesn't Mean You Can Use It

The remaining branches of `EnumerateShaders` are worth reading too. Compile
failure and lack of support are classified separately.

```csharp
if (shader.hasErrors) { failed.Add(shaderName); continue; }
if (!shader.supported) { notSupported.Add(shaderName); continue; }
```

`notSupported` and `failed` aren't removed from the list — they're **shown under
their own classification.** That connects to lilToon's shader model table.

| Variation | Shader model |
| --- | --- |
| Normal | SM4.0 · ES3.0 |
| Lite | SM3.0 · ES2.0 |
| Fur | SM4.0 · ES3.1+AEP · ES3.2 |
| Tessellation | SM5.0 · ES3.1+AEP · ES3.2 |

Tessellation requires SM5.0. On a build target that doesn't meet that, it **does
appear in the dropdown, marked unsupported.** Seeing a name in the list and that
name working are different stories.

## What Point in Time the Support List Points At

The 「対応状況」(support status) section comes in four groups. The render
pipeline list among them reads:

> - ビルトインレンダーパイプライン
> - ライトウェイトレンダーパイプライン
> - ユニバーサルレンダーパイプライン
> - ハイデフィニションレンダーパイプライン

The second line is the **Lightweight Render Pipeline**, i.e. LWRP. The third is
URP. **Both are listed.** Yet Unity's official migration guide opens with a
single sentence.

> The Universal Render Pipeline (URP) replaces the Lightweight Render Pipeline
> (LWRP) in Unity 2019.3.

**URP replaced LWRP in 2019.3.** As
[the post on render pipelines](/posts/render-pipelines-overview/) showed, a
pipeline is specified as an asset, and the LWRP asset doesn't exist from that
version on. And the Unity version list on the same page reads `2022.3`,
`2023.1～2023.3`. **Because the lowest version claimed as supported is 2022.3,
there isn't a single project in that range that could be using LWRP.** Two lists
on the same page negate each other.

This isn't plain neglect. lilToon's developer documentation
([shader structure](https://lilxyzw.github.io/lilToon/ja_JP/dev/shader_structure.html))
shows how pipeline support is implemented.

> パイプライン対応（Built-in/LWRP/URP/HDRP）もスクリプトで`lil_pipeline.hlsl`を書き換えることで実装されています
>
> (Pipeline support (Built-in/LWRP/URP/HDRP) is also implemented by **rewriting**
> `lil_pipeline.hlsl` from a script.)

**`LWRP` survives on the internal macro side.** That line in the support list
looks like the shader source's branch names carried straight over. It's a spot
where a name left in code leaked out into the documentation's support list.

The version list has a snag of its own: `2023.3`. Unity never shipped that
version number.

> Unity 6 represents the beginning of the next generation of the Unity Engine
> and is the new official version name for what was previously referred to as
> Unity 2023 LTS.

**The stream that was going to be 2023 LTS came out under the name Unity 6.**
2023.1 and 2023.2 did ship as tech stream releases, but 2023.3 doesn't exist as
a final release number. The last line of the support list is pointing at a beta
number.

So what was actually verified? The same section's "verified environment" answers.

> Unity 2022.3.22f1(ビルトインRP / URP 14.0.8 / HDRP 14.0.8)

Where that number came from is immediately clear from VRChat's docs.

> The current Unity version used by VRChat is 2022.3.22f1

> It is safe to remain on VRChat's supported version of the Unity editor
> (`2022.3.22f1`). Upgrading your version will result in content not loading
> once uploaded to VRChat

**`2022.3.22f1` is exactly the version VRChat requires.** Identical down to the
patch. lilToon's support list is pinned **to VRChat's editor version**, not to
Unity's current releases. For an avatar shader that's a sensible choice, and for
someone reading the docs it means **the answer to "does it work on Unity 6?" is
not in that list.**

## What Multi Pays for Its Keywords

The row in the variation table with the shortest description and the largest
implication is `_lil/lilToonMulti`.

> シェーダーキーワードを利用するバージョンです。マテリアルを大量に使用する場合などにビルドサイズが大きくなりやすいため注意が必要です。
>
> (This is the version that uses shader keywords. Care is needed because build
> size grows easily when **a large number of materials** is used.)

Why keywords connect material count to build size is exactly the rule seen in
[the custom shaders post](/posts/unity-custom-shaders/). Variants grow as the
**product** of the keyword sets, and Unity's docs state the consequence like
this:

> A large number of variants can result in increased build times, file sizes,
> runtime memory usage, and loading times.

What's newly interesting here is the other side: **the normal version doesn't use
keywords at all.** That sentence from the developer docs above gives the
mechanism — pipeline branching is produced by **rewriting the HLSL file from a
script.** Feature toggling works the same way. lilToon's
[shader settings](https://lilxyzw.github.io/lilToon/ja_JP/other/settings.html)
page explains that the setting is **common to all materials** and that turning a
feature off there **removes it from the shader.**

Put the two side by side and the trade shows.

| | Normal | `lilToonMulti` |
| --- | --- | --- |
| Feature toggling | Shader settings (global, removed from source) | Per-material shader keywords |
| Different feature combos per material | No — the setting is global | Yes |
| Variants as materials grow | Doesn't grow | Grows per combination |
| Build size | As much as the features turned on | As much as the keyword combos used |

**The normal version gave up flexibility to fix its variant count; Multi did the
opposite.** The docs' "care is needed when a large number of materials is used"
points at the Multi side of that trade.

One thing here needs correcting. As the reason Multi reuses Unity's standard
keywords (`_NORMALMAP`, `_EMISSION`, `_METALLICGLOSSMAP` and so on), the
developer docs cite **avoiding keyword exhaustion.** There was a period when that
was a real constraint. Unity's 2020.3 manual put it this way:

> There is a limit of 384 global shader keywords, and Unity uses around 60 of
> them internally (therefore lowering the available number). Each individual
> shader has a limit of 64 local keywords.

But the same page in the **2022.3** manual — the version lilToon says it supports
— carries different numbers.

> Unity can use up to 4,294,967,294 global shader keywords. Individual shaders
> and compute shaders can use up to 65,534 local shader keywords.

**From 384 to 4.29 billion.** Within the supported version range, the global
keyword count is no longer a scarce resource. The remaining constraint is a
different line.

> If a shader uses more than 128 keywords in total, it incurs a small runtime
> performance penalty; therefore, it is best to keep the number of keywords low.

So what you're weighing when choosing Multi today is **not exhaustion but the
128 line and the variant count.** And having many materials isn't itself a cost —
[the post on what a shader is](/posts/what-is-a-shader/) had the SRP Batcher docs
nail that down. What splits batches isn't material count but **shader variants.**
That's precisely why Multi's cost scales with material count. It isn't expensive
because materials grew; it's expensive because **the keyword combination differs
per material.**

## Writing the Terminology Table Again

The introduction page opens with a 「登場する用語」(terms you'll encounter) table
— eight rows for someone handling 3DCG for the first time. That table is also
where Korean secondary material breaks down most often. The translation I
received read like this:

| In the clipping | Japanese original | What it should be |
| --- | --- | --- |
| 재료 — "raw material" | マテリアル | **Material** (머티리얼) |
| 질감 — "texture" as a tactile quality | テクスチャ | **Texture** (텍스처) |
| 일반 지도 — "ordinary map" | ノーマルマップ | **Normal map** (노멀 맵) |
| 매트 캡 — split into two words | マットキャップ | **MatCap** (매트캡) |
| 모피 / 털털 — "fur coat" | ファー | **Fur** (퍼) |
| 북 셰이더 — "book shader" | 本シェーダー | **"this shader"** (본 셰이더) |

`マテリアル` became **raw material** by way of the other sense of the English
word *material*. `ノーマルマップ` was decomposed into normal (ordinary) + map and
came out as **ordinary map**. The hardest to recognize is the last row. The
license section's `本シェーダー` means **"this shader,"** but `本` was read as
*book*, producing a **book shader**.

[The parameters post](/posts/liltoon-parameters/) covered **「the rim light's
monetary fine」** — `細さ` (thinness) → *fine* → a monetary fine, two hops. The
same kind of accident happens in the terminology table.

This translation has an accident of a different class too. A sentence like this
sits in the middle of STEP 2:

> The Committee recommends that the State party take all necessary measures to
> ensure that all children are provided with adequate and appropriate health
> services, including adequate food, clothing, shelter, medical and health care.

This is shader documentation. STEP 2 in the original has no corresponding
sentence — something close to a child-rights committee recommendation was
**generated where nothing stood.** That's a different layer of problem from
mistranslation. **A mistranslation carries the original across wrongly; this is
something that was never in the original arriving anyway.** Wrong terminology can
be recovered by cross-checking, but with this you have to see the original to know
it exists at all.

Written out with correct terms, the table becomes this:

| Term | Description (per the original) |
| --- | --- |
| Material | Data that decides how something looks |
| Texture | An image. Used for many things, such as deciding something's color |
| UV | Data that decides where a texture is applied |
| Mask | A texture used to specify which part gets processed |
| Normal map | A texture that makes a surface look as if it has bumps |
| MatCap | A texture with light reflection drawn into it |
| Rim light | A light where light wraps around as if backlit, brightening only the outline |
| Stencil | A mask expression performed on screen |

The relation between material and texture draws the same line as the Unity
definition in [the post on what a shader is](/posts/what-is-a-shader/) — a
material is **"an asset that defines how a surface should be rendered"** and holds
a shader reference inside it. The introduction page's "data that decides how
something looks" is that definition compressed into one line.

The texture assignment table is worth rewriting too. A row like the
translation's **「ordinary map setting → ordinary map → ordinary map」** can't be
found in the Inspector.

| Texture type | Inspector path |
| --- | --- |
| Main texture | Base Color Setting → Main Color → Texture |
| Normal map | Normal Map Setting → Normal Map → Normal Map |
| Outline mask | Outline Setting → Outline → Mask & Width |
| Shadow mask | Shadow Setting → Shadow → Mask & Strength |
| MatCap | MatCap Setting → MatCap → MatCap |
| MatCap mask | MatCap Setting → MatCap → Mask |
| Rim light mask | Rim Light Setting → Rim Light → Color / Mask |
| Emission (mask) | Emission Setting → Emission Texture → Color |

## Where and Why You'd Use It

### Checking Which Variation a Material Uses

Once an avatar has more than ten materials, checking which is the normal version
and which is a converted Lite one by hand in the Inspector gets tedious. The
shader name *is* the classification, so you can sweep it in code.

```csharp
using System;
using UnityEngine;

public class ShaderVariantReport : MonoBehaviour
{
    private const string HIDDEN_PREFIX = "Hidden/";
    private const string SUBMENU_PREFIX = "_lil/";
    private const string LILTOON_NAME = "lilToon";

    [Header("Targets")]
    [SerializeField, Tooltip("Renderers to inspect. Leave empty to gather all children")]
    private Renderer[] _targets;

    private void Start()
    {
        if (_targets == null || _targets.Length == 0)
        {
            // Include inactive objects.
            _targets = GetComponentsInChildren<Renderer>(true);
        }

        foreach (Renderer target in _targets)
        {
            // Read sharedMaterials. Reading materials clones every one of them.
            foreach (Material material in target.sharedMaterials)
            {
                if (material == null)
                {
                    continue;
                }

                string shaderName = material.shader.name;
                Debug.Log($"{target.name} / {material.name} → {shaderName} [{Classify(shaderName)}]", target);
            }
        }
    }

    private static string Classify(string shaderName)
    {
        // State StringComparison explicitly. Unity's editor source omits it.
        if (shaderName.StartsWith(HIDDEN_PREFIX, StringComparison.Ordinal))
        {
            return "not in the dropdown";
        }

        if (shaderName.StartsWith(SUBMENU_PREFIX, StringComparison.Ordinal))
        {
            return "_lil submenu";
        }

        if (shaderName == LILTOON_NAME)
        {
            return "normal version";
        }

        return "not lilToon";
    }
}
```

Why the `material == null` comparison isn't `?.` is in
[the post on Fake Null](/posts/unity-fake-null/). A Unity object keeps its managed
reference after being destroyed, and `?.` doesn't filter that state out.

The `sharedMaterials` choice is deliberate too. Reading `materials` clones every
one of the renderer's materials. **Code that only reads ending up multiplying
materials** is the trap seen with `Renderer.material` in the earlier post; here
reading is all that's needed, so it looks at the shared ones.

### Switching to Lite by Quality Level

Since the Lite version isn't in the dropdown, a runtime switch takes the shape of
**swapping in a material converted ahead of time in the editor.** Not swapping
the shader out — the normal and Lite versions have different property sets.

```csharp
using UnityEngine;

[RequireComponent(typeof(Renderer))]
public class QualityMaterialSwap : MonoBehaviour
{
    private const int DEFAULT_LITE_THRESHOLD = 2;

    [Header("Materials")]
    [SerializeField, Tooltip("Material authored with the normal version")]
    private Material _normalMaterial;

    [SerializeField, Tooltip("Material converted to Lite in the editor")]
    private Material _liteMaterial;

    [Header("Switch")]
    [SerializeField, Range(0, 5), Tooltip("Use Lite at or below this quality level")]
    private int _liteThreshold = DEFAULT_LITE_THRESHOLD;

    private void Awake()
    {
        if (!TryGetComponent(out Renderer targetRenderer))
        {
            return;
        }

        bool useLite = QualitySettings.GetQualityLevel() <= _liteThreshold;
        Material selected = useLite ? _liteMaterial : _normalMaterial;

        if (selected == null)
        {
            return;
        }

        // Cloning happens when you 'read' material. Here the asset is assigned as is.
        targetRenderer.sharedMaterial = selected;
    }
}
```

**Holding both materials as Inspector references is the point.** There's a route
that finds them by name, but that one trips in the build. From the `Shader.Find`
docs:

> A shader might be not included into the player build if nothing references it.
> In that case, Shader.Find will work only in the Editor, and will result in the
> pink error shader in a build.

**It works in the editor and turns pink in the build.** The first of the three
remedies the docs offer is "reference it from materials used in your scene," and
the `[SerializeField]` material references above create exactly that condition.
The other two are adding it to **Always Included Shaders** under
`ProjectSettings/Graphics`, and putting the shader or material in a `Resources`
folder.

### Where Not to Use It

- **Swapping only the shader at runtime.** The normal and Lite versions have
  different property sets. Assigning `material.shader = liteShader` drops the
  non-overlapping values to defaults. Swap at the material level.
- **Referencing a `Hidden/` shader only through `Shader.Find`.** That's the pink
  case above. Keep an Inspector reference or Always Included Shaders alongside it.
- **Consolidating onto Multi to reduce material count.** The direction is
  backwards. Multi is the **worse** choice when materials are many, and having
  many materials is not itself a cost as long as the shader is the same.
- **Installing via `.unitypackage` and expecting to track versions.** No version
  is recorded in the project. For VRChat work, use the VPM route.
- **Reading `2023.3` in the support list as "works on Unity 6."** That number is
  the beta number of the stream that was renamed Unity 6. The one verified
  environment is `2022.3.22f1`.

## Wrapping Up

- **`Hidden/` doesn't hide, it drops from the enumeration.** `EnumerateShaders`
  hits `continue` on `StartsWith("Hidden")`. That's why `Hidden/lilToonLite`
  isn't in the dropdown, and it's the **real reason the docs recommend
  conversion.** The reason the docs write down is "intuitive."
- **`_lil/` is a menu path, not a prefix.** Names with and without a slash are
  gathered separately, so `lilToon` sits at the top level while the four special
  ones go into the submenu.
- **Two lines of the support list negate each other.** URP replaced LWRP in
  2019.3, and the lowest version that same page supports is 2022.3. The LWRP line
  looks like an internal macro name that leaked out.
- **`2023.3` is a number that never shipped.** Unity 2023 LTS came out under the
  name Unity 6. The actually verified environment is `2022.3.22f1`, and that is
  **exactly the version VRChat requires.**
- **Normal and Multi trade flexibility against variants.** The normal version
  removes features from source via global shader settings; Multi uses per-material
  keywords. The docs' build size warning is the latter's cost.
- **Keyword exhaustion is no longer a constraint on 2022.3.** The 384 of the
  2020.3 docs became 4.29 billion. The lines left are **128** per shader and the
  variant count.
- **The three install routes don't give the same result.** "Any one of them" hides
  that difference, while the docs themselves warn about it in the distribution
  section over the overwrite problem.

---

### References

- [はじめに — lilToon official docs (Japanese)](https://lilxyzw.github.io/lilToon/ja_JP/first.html)
- [シェーダー設定](https://lilxyzw.github.io/lilToon/ja_JP/other/settings.html) ·
  [最適化](https://lilxyzw.github.io/lilToon/ja_JP/other/optimization.html) ·
  [シェーダーの構造](https://lilxyzw.github.io/lilToon/ja_JP/dev/shader_structure.html)
- [MaterialEditor.cs — UnityCsReference (`ShaderDropdownDataBuilder.EnumerateShaders`)](https://github.com/Unity-Technologies/UnityCsReference/blob/master/Editor/Mono/Inspector/MaterialEditor.cs)
- [Shader.Find — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Shader.Find.html)
- [Shader keywords — Unity 2022.3 Manual](https://docs.unity3d.com/2022.3/Documentation/Manual/shader-keywords.html) ·
  [Shader keywords — Unity 2020.3 Manual (the 384 era)](https://docs.unity3d.com/2020.3/Documentation/Manual/shader-keywords.html)
- [Shader variants — Unity Manual](https://docs.unity3d.com/Manual/shader-variants.html)
- [Upgrading from LWRP to URP — URP docs](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@15.0/manual/upgrade-lwrp-to-urp.html)
- [Install a UPM package from a Git URL — Unity Manual](https://docs.unity3d.com/Manual/upm-ui-giturl.html)
- [Unity 6 is here: See what's new — Unity blog](https://unity.com/blog/unity-6-features-announcement)
- [Current Unity Version — VRChat Creator Docs](https://creators.vrchat.com/sdk/upgrade/current-unity-version/)
- [lilxyzw/lilToon — GitHub (MIT)](https://github.com/lilxyzw/lilToon)

The starting point for this post was a Korean-language scrape of the
[はじめに](https://lilxyzw.github.io/lilToon/ja_JP/first.html) page of lilToon's
official docs. I re-checked the terminology and install steps against the Japanese
original, and confirmed how shader names are handled in the dropdown from Unity's
editor source.
