---
pubDatetime: 2026-10-14T22:00:00+09:00
title: "The Three Steps the Video Teaches Are the Three Reasons This Asset Was Replaced"
lang: en
translationKey: unitychan-toon-shader
featured: false
draft: false
tags:
  - Unity
  - Shader
  - Graphics
  - Rendering
  - URP
  - Optimization
description: "A 2022 video, clipped while using the Unity-chan model as the example to put a toon shader on and looking for how to do it. Open the repository now and it says the package is provided without any maintenance or release plan, and the successor package's docs list three reasons for the replacement — install method, pipeline, license. Those three line up with the video's chapter numbers."
---

**I was using the Unity-chan model as the example to try a toon shader on.**
There's no better character for seeing how cel shading comes out, and while
looking for how to apply a toon shader to that model I clipped this video. It
went up in March 2022, a Unity Japan introduction that walks the flow of cartoon
rendering a character with **Unity-chan Toon Shader V2** (UTS2) across five
chapters. The description lists the chapters verbatim.

> 01 00:00 Installing
>
> 02 01:00 What the toon shader looks like
>
> 03 02:00 Applying it
>
> 04 07:17 Déformé style
>
> 05 09:33 Optimization and license
>
> — [카툰렌더링으로 캐릭터를 예쁘게 꾸미자🥰UnityChanToonShader V2 — 골드메탈](https://www.youtube.com/watch?v=qoYrqHV-prk)

Open that asset's repository now and the README's first paragraph says it has
**been succeeded by another package**. And the successor package's docs write
**three reasons why**. Each of the three lands on chapter 01, 03 and 05 above —
the install method, the pipeline, and the license.

**The video isn't wrong.** It teaches the 2022 UTS2 accurately as of 2022. It's
that those three chapters **can't be followed the same way now.** This is a
record of checking which chapter is blocked, and why, against primary sources.

## Table of contents

## The repository says of itself that there's no release plan

The 📦 asset link in the video description still opens. It's just that the
branch it opens is `release/legacy/2.0`, and the README starts like this.

> We appreciate your interest in Unity-Chan Toon Shader 2.0.
>
> It's important to note that this package has been succeeded by Unity Toon
> Shader, and is provided as is, without any maintenance or release plan.
>
> Therefore, we are unable to monitor bug reports, accept feature requests, or
> review pull requests for this package.
>
> — [UnityChanToonShaderVer2_Project](https://github.com/unity3d-jp/UnityChanToonShaderVer2_Project)

**No bug reports watched, no feature requests accepted, no pull requests
reviewed**, written out. The repository isn't archived, so the link doesn't die
and it stays readable and writable — which is why **it looks like a perfectly
healthy asset from the outside.** The README suggests forking as the
alternative.

The support range is written out in numbers in the README too.

> Unity 2019.4.31f1 through Unity 2020.3.34f1, Unity 2021.3.3f1, and Unity
> 2022.1.1f1 have been tested.
>
> — [UnityChanToonShaderVer2_Project](https://github.com/unity3d-jp/UnityChanToonShaderVer2_Project)

**The newest version tested is 2022.1.1f1.** Just past March 2022, when the
video went up. And the README pins the rendering environment in one line —
**"This package uses a forward rendering environment."**

## The three reasons for the replacement overlap the video's three chapters

The successor is **Unity Toon Shader** (package name `com.unity.toonshader`).
Its overview page, writing about the relationship to UTS2, **lists three reasons
for the replacement.**

> Unity Toon Shader is the successor to Unity-chan Toon Shader ver 2.0 (UTS2)
>
> UTS2 was designed solely for the Built-in Render Pipeline
>
> could not be installed through the Package Manager window
>
> had a different license from other Unity software
>
> — [Unity Toon Shader overview — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/index.html)

Line the three items up with the video's chapters and it comes out like this.

| Video chapter | Reason the successor's docs give | What's different now |
|---|---|---|
| 01 Installing | "could not be installed through the Package Manager window" | just enter the name in Package Manager |
| 02 What it looks like | — | not cited as a reason |
| 03 Applying it | "designed solely for the Built-in Render Pipeline" | all three pipelines |
| 04 Déformé style | — | not cited as a reason |
| 05 Optimization and license | "had a different license from other Unity software" | changed to the Unity Companion License |

**02 and 04 aren't in the reasons.** What the shader looks like and what styles
it can produce have nothing to do with the replacement, and that part of the
video is still useful. What's blocked is the three of **bringing the asset in,
which pipeline you put it on, and under what terms you use it.**

How the successor solved those three is written by its own docs.

> The Unity Toon Shader (UTS3) is a set of toon shaders designed to meet the
> needs of creators
>
> compatible with all render pipelines: the Built-in Render Pipeline, the
> Universal Render Pipeline (URP), the High Definition Render Pipeline (HDRP)
>
> Feature availability varies between pipelines and between 3D/2D projects.
>
> — [Unity Toon Shader overview — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/index.html)

Don't skip the last line. **"compatible with all render pipelines" and "Feature
availability varies" sit on the same page together.** The shader going on is a
different matter from every feature working.

## Chapter 01 Installing — now it's one line in Package Manager

The video's first chapter is the procedure of downloading from GitHub and
dropping it into the project. The successor's installation doc erases that
procedure and cuts it to four steps.

> Make sure Git is installed on your system.
>
> Click the + button, then select Add package by name.
>
> Enter com.unity.toonshader
>
> You can also specify a particular version, for example:
> com.unity.toonshader@0.9.4-preview
>
> — [Installation — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/installation.html)

**Enter `com.unity.toonshader` into `Add package by name`.** You can also pin a
version with `@`. And there's one prerequisite — **Git has to be installed on
your system.** That adding a package by name needs Git is a condition this doc
states directly.

There's one more sentence on the same page.

> The Unity Toon Shader is a preview/experimental package.
>
> — [Installation — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/installation.html)

**It's still preview.** The newest changelog entry is `0.13.4-preview`, dated
**2026-02-18**. So **it is maintained, and it isn't 1.0.** That what replaced a
2022 asset is still 0.x in 2026 isn't a story that ends with "just use the new
one" for someone trying to follow the video.

| | UTS2 (the video's subject) | Unity Toon Shader (successor) |
|---|---|---|
| how you bring it in | download from the repo, drop into the project | Package Manager → `Add package by name` |
| prerequisite | — | Git installed |
| newest label | `UTS2/Legacy(Built-in) v2.0.9` | `0.13.4-preview` (2026-02-18) |
| status | "without any maintenance or release plan" | "preview/experimental package" |
| Unity tested | 2019.4.31f1 – 2022.1.1f1 | minimum requirement 6.0 (raised in 0.13.0) |

That last row is written out in the changelog — the entry for
`0.13.0-preview` (2025-12-04) is **"package: raise minimum Unity version
requirement to 6.0"**. That picking a package version is tied to picking an
Editor version has the same shape as what I ran into with Shader Graph in
[What Puts It in the Inspector Isn't Exposed, It's Show In Inspector](/en/posts/shadergraph-exposed/).

## Chapter 03 Applying it — both the dropdown name and the pipelines changed

The video's third chapter is the part where you make a material and pick the
toon shader to apply it. The name that appears in that dropdown is different in
the successor package.

> In the Inspector, you choose Toon > Toon or Toon > Toon (Tessellation) from
> the Shader drop-down.
>
> — [Getting Started with Unity Toon Shader — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/GettingStarted.html)

**`Toon > Toon` and `Toon > Toon (Tessellation)`**, two of them. The same page
says these two shaders work on the Built-in Render Pipeline, URP and HDRP. That
the dropdown's name is decided by a string inside the shader file, and that the
string builds the submenu, is something I took apart in detail for lilToon in
[The Lite Version Doesn't Show Up in the Shader List](/en/posts/liltoon-setup/).
What matters here is that **searching the current list by the item name visible
on an old video's screen won't match.**

If you already have materials made with UTS2, you don't have to remake them.
There's a dedicated converter.

> The Unity Toon Shader Converter handles not only the Unity Toon Shader
> materials, but also Unity-chan Toon Shader and Univeral Toon Shader
> materials.
>
> Window -> Rendering -> Unity Toon Shader Converter
>
> Please make sure to back up the project since this converting process is
> irreversible.
>
> — [Material Converter — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/MaterialConverter.html)

**Back up, because it can't be undone** — the doc says that first. And there's
one more condition attached.

> Unity-Chan Toon Shader materials saved with older than 2.0.6 have to be
> re-saved using 2.0.7 or newer.
>
> — [Material Converter — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/MaterialConverter.html)

**Materials older than 2.0.6 have to be re-saved with 2.0.7 or newer first.**
So the conversion road is sometimes two stages: `old UTS2 → latest UTS2 →
UTS3`. If the video is from March 2022 and you were on the UTS2 version of that
moment, this condition is the thing to check first.

(The same page spells `Universal` as **`Univeral`**. A typo in the current docs.)

## "Was Built-in only" and the repository's release list

The first of the replacement reasons quoted above was **"UTS2 was designed
solely for the Built-in Render Pipeline"**. Yet the UTS2 repository's release
list has a separate Universal line.

| Release title | Line |
|---|---|
| `UTS/Universal 2.5.1` | Universal |
| `UTS2/Legacy(Built-in) v2.0.9` | Legacy (Built-in) |
| `UTS/Universal 2.5.0` | Universal |
| `UTS/Legacy(Built-in) 2.0.8` | Legacy (Built-in) |

**It looks like a contradiction, but it isn't.** The converter doc lists three
sources it handles, and those three are `Unity Toon Shader`, `Unity-chan Toon
Shader` and `Universal Toon Shader`. So **that repository shipped two shader
lines under different names, and the successor's docs count them as two
different shaders.** What "UTS2" points at is the `Legacy(Built-in)` side, and
the Universal side has its own separate name, `Universal Toon Shader`.

**That much is what the docs say.** How much code the two lines share, and which
URP versions the Universal line matches, **the docs don't say.** The line of
what can be confirmed from release titles and the converter's source list ends
here. What a pipeline is, and what state Built-in is in, is written up in
[A Render Pipeline Is an Asset, and Built-In Is What's Left When the Field Is Empty](/en/posts/render-pipelines-overview/).

## Chapter 05 License — the page it rests on is gone

The video's last chapter is "Optimization and license". The license side is the
most awkward right now. UTS2's README states the terms like this.

> Unity-Chan Toon Shader 2.0 is provided under the Unity-Chan License 2.0
> terms.
>
> — [UnityChanToonShaderVer2_Project](https://github.com/unity3d-jp/UnityChanToonShaderVer2_Project)

It's the **Unity-Chan License 2.0**, and for those terms it links to the
Unity-chan guideline page. I clicked that link.

| URL | Result |
|---|---|
| `unity-chan.com/contents/guideline_en/` (the README's link) | **302 → `unity3d.jp/unity-chan`** |
| `unity-chan.com/download/index.php` (the video's model link) | **302 → `unity3d.jp/unity-chan`** |

Both URLs go to the same place. And that destination isn't a Unity-chan page —
it's a Japanese Unity page, and **it states no license name, no version, and no
terms.** The menu's "ダウンロード" goes to `unity.com/ja/download`, i.e. where
you get the Editor.

**So it comes to this. The asset is written as "provided under the Unity-Chan
License 2.0 terms", and the text of those terms is no longer at the address the
repository points to.** This is a 302 and not a 404, so even someone who clicks
the link can pass it off as "something moved, I guess".

The successor package is under a different license.

> Unity Companion License for Unity-dependent projects
>
> — [License — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/license/LICENSE.html)

The successor's repository splits it out — **the source code under the Unity
Companion License, the Unity-chan assets under the Unity-Chan License.** The
third replacement reason, "had a different license from other Unity software",
points at this change.

**I'm not a lawyer, and this post isn't legal advice.** What I confirmed here is
only three things — the license name the README states, the fact that the
address holding those terms now redirects elsewhere, and the fact that the
successor package uses a different license name. **If you plan to use it, you
have to obtain the terms yourself and read them.** License terms aren't
something to judge from a summary.

The optimization side is simpler. **I found no sentence about performance in the
UTS2 README.** There's only the one line that the rendering environment is
forward. Whatever the video's optimization content was, there's no current
primary source to back it, so this post doesn't write that part.

## The video's other two links each rotted differently

Of the three links in the description, only the asset link is alive. The other
two are in different states from each other.

| Link | State |
|---|---|
| 📦 asset (GitHub) | opens; `release/legacy/2.0` with the "no maintenance" notice |
| 🚀 Unity-chan model (`unity-chan.com`) | **302 → `unity3d.jp/unity-chan`**, no model |
| ⛰️ background (Asset Store) | **deprecated from the store** |

The third one the Asset Store states directly.

> This asset has been deprecated from the Unity Asset Store.
>
> — [Shader Calibration Scene — Unity Asset Store](https://assetstore.unity.com/packages/templates/tutorials/shader-calibration-scene-25422)

The same page adds that it **is no longer available for purchase and will no
longer be supported by the publisher**, while existing owners can keep using it
and still see it under My Assets. So **someone watching the video for the first
time today can't get the background asset.**

The point is that the three links rotted in three different ways. One is
**alive but carrying a notice**, one **lost its content to a redirect**, and one
**stopped being distributed.** None of them is a 404, so a link checker reports
all three as "fine".

**The starting point for this post is that second row.** I picked the Unity-chan
model as the example to put a toon shader on, and the address I got that model
from now goes to a page with no model. If you already have the files you can keep
using them, but **the address for checking under what terms they were provided
went away with it** — the same place the previous section landed on, the address
UTS2's README points at for its license terms.

## Where and why you'd use it

A toon shader is for drawing characters with cel shading. What this post
confirmed is **which implementation to pick and what state that implementation
is in.** If the project already has UTS2 materials there's a converter road, and
if you're starting fresh the successor is one line in Package Manager. The
parameters of lilToon, the other option in that same slot, are written up
separately in
[lilToon Parameters: A Reference Cross-Checked Against the Official Docs](/en/posts/liltoon-parameters/).

### A working example

The part of this topic that carries into code is **counting which shaders the
materials in the current scene are using**. You need to know how many targets
there are before running the converter, and to check that none are left after.

```csharp file="Scripts/Rendering/ShaderUsageAudit.cs"
using System.Collections.Generic;
using System.Text;
using UnityEngine;

public class ShaderUsageAudit : MonoBehaviour
{
    [Header("Prefixes to look for")]
    [Tooltip("A shader name starting with any of these counts as 'old'")]
    [SerializeField]
    private string[] _legacyPrefixes =
    {
        "UnityChanToonShader",
        "Toon/Legacy",
    };

    [Header("Behavior")]
    [Tooltip("On also counts Renderers on inactive objects")]
    [SerializeField]
    private bool _includeInactive = true;

    [Tooltip("On logs the count for every shader name")]
    [SerializeField]
    private bool _logEveryShader;

    private void Start()
    {
        Audit();
    }

    [ContextMenu("Count now")]
    private void Audit()
    {
        // The docs say "If you don't specify this parameter, this function
        // doesn't include inactive objects in the results". Be explicit
        // instead of leaning on the default. The sortMode overloads are
        // obsolete.
        Renderer[] renderers = _includeInactive
            ? FindObjectsByType<Renderer>(FindObjectsInactive.Include)
            : FindObjectsByType<Renderer>(FindObjectsInactive.Exclude);

        Dictionary<string, int> counts = new Dictionary<string, int>();
        int legacyCount = 0;

        foreach (Renderer renderer in renderers)
        {
            // This only counts, so read sharedMaterials. Reading material
            // creates an instance, and modifying sharedMaterial also changes
            // settings stored in the project, the docs say. Neither is needed.
            Material[] materials = renderer.sharedMaterials;

            foreach (Material material in materials)
            {
                if (material == null) { continue; }

                Shader shader = material.shader;
                if (shader == null) { continue; }

                // This name is the string you see in a material's shader
                // dropdown.
                string shaderName = shader.name;

                counts.TryGetValue(shaderName, out int previous);
                counts[shaderName] = previous + 1;

                if (IsLegacy(shaderName))
                {
                    legacyCount++;
                    Debug.Log($"old shader: {shaderName} — {renderer.name}",
                        renderer);
                }
            }
        }

        Report(counts, renderers.Length, legacyCount);
    }

    private bool IsLegacy(string shaderName)
    {
        foreach (string prefix in _legacyPrefixes)
        {
            if (string.IsNullOrEmpty(prefix)) { continue; }

            if (shaderName.StartsWith(prefix)) { return true; }
        }

        return false;
    }

    private void Report(
        Dictionary<string, int> counts, int rendererCount, int legacyCount)
    {
        StringBuilder builder = new StringBuilder();
        builder.AppendLine(
            $"{rendererCount} Renderers, {legacyCount} old-shader materials");

        if (_logEveryShader)
        {
            foreach (KeyValuePair<string, int> pair in counts)
            {
                builder.AppendLine($"  {pair.Value,4}  {pair.Key}");
            }
        }

        Debug.Log(builder.ToString(), this);
    }
}
```

Two things worth pointing out.

**One — `Shader.Find` isn't used.** There's an API for finding a shader by name
and the reason for not using it is in the docs.

> Note that a shader might be not included into the player build if nothing
> references it.
>
> In that case, Shader.Find will work only in the Editor, and will result in
> the pink error shader in a build.
>
> Because of that, it is advisable to use shader references instead of finding
> them by name.
>
> — [Shader.Find](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Shader.Find.html)

**It works in the Editor only and turns pink in a build.** Conversely, what this
example does is **read** the shader a material already holds, so it doesn't have
that problem. The same page also states what `name` is — **"name is the name you
can see in the shader popup of any material"**. So `shader.name` can be compared
directly against the dropdown item visible in the video.

**Two — whether to include inactive objects isn't left to the default.** The docs
state the default behavior.

> Whether to include components attached to inactive GameObjects.
>
> If you don't specify this parameter, this function doesn't include inactive
> objects in the results.
>
> — [Object.FindObjectsByType](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Object.FindObjectsByType.html)

When counting conversion targets, **missing inactive objects makes the number
wrong.** And two more things on that same page catch you. The overloads taking
`sortMode` are marked **obsolete**, and the docs give the reason that **the
previous sort order can't be maintained because `InstanceID` will be replaced by
`EntityId`**. The other is that **assets are not returned** — a material sitting
in the project folder and not placed in a scene won't be counted this way. The
docs point to `Resources.FindObjectsOfTypeAll` for that case.

### How to choose

| Situation | What to pick | The sentence behind it |
|---|---|---|
| starting fresh | Unity Toon Shader (`com.unity.toonshader`) | "compatible with all render pipelines" |
| how to bring it in | Package Manager → `Add package by name` | "Enter com.unity.toonshader" |
| already have UTS2 materials | `Window > Rendering > Unity Toon Shader Converter` | "handles ... Unity-chan Toon Shader" |
| before converting | back up the project | "this converting process is irreversible" |
| materials older than 2.0.6 | re-save with 2.0.7+ first | "have to be re-saved using 2.0.7 or newer" |
| must stay on Built-in | fork UTS2 | the README suggests forking |
| counting material shaders in code | `material.shader.name` | "the name you can see in the shader popup" |
| counting assets not in a scene | `Resources.FindObjectsOfTypeAll` | `FindObjectsByType` doesn't return assets |

Here's the order I'd decide in.

1. **Look at the Editor version first.** The successor raised its minimum
   requirement to Unity 6.0 in `0.13.0`. Below that you have to pin a lower
   package version.
2. **Decide whether you can accept preview.** The installation doc calls it a
   "preview/experimental package" itself.
3. **Check the per-pipeline feature differences.** "compatible with all render
   pipelines" and "Feature availability varies" are on the same page.
4. **Obtain the license text.** The terms are not at the address the README
   points to. Don't judge from a summary; find and read the text.

### Where not to use it

- **Following the 2022 video's install procedure as is.** The successor goes in
  through Package Manager.
- **Searching the current list by the dropdown item name on the video's
  screen.** The successor's are `Toon > Toon` and `Toon > Toon (Tessellation)`.
- **Running the converter without a backup.** The doc says
  **"irreversible"**.
- **Converting materials older than 2.0.6 directly.** They have to be re-saved
  with 2.0.7 or newer first.
- **Reading only "compatible with all render pipelines" and assuming every
  feature works.** The same page spells out the differences.
- **Filing a bug against UTS2.** The README says it isn't watched.
- **Judging the license terms from a blog summary.** The text isn't at the
  address the repository points to.
- **Following the video's model and background links today.** One redirects, one
  is deprecated from the store.
- **Using `Shader.Find` in a build.** Without a reference it turns pink, the
  docs say.
- **Counting every material in the project with `FindObjectsByType`.** Assets
  are not returned.

## Summary

- The UTS2 repository opens, but on branch `release/legacy/2.0`, and the README
  says **"provided as is, without any maintenance or release plan"**. Bug
  reports, feature requests and PRs aren't watched.
- The tested Unity range is **2019.4.31f1 – 2022.1.1f1**, and the rendering
  environment is **forward**.
- The successor's docs list three reasons for the replacement — **it couldn't be
  installed through Package Manager, it was Built-in only, and its license was
  different.** Those three land on the video's chapters 01, 03 and 05. 02 and 04
  aren't in the reasons.
- The successor is `com.unity.toonshader`, added via `Add package by name`.
  **Git installed is a prerequisite**, and the installation doc calls it a
  **"preview/experimental package"** itself. The newest is
  **`0.13.4-preview` (2026-02-18)**.
- `0.13.0` (2025-12-04) **raised the minimum Unity requirement to 6.0.**
- The dropdown items are **`Toon > Toon`** and **`Toon > Toon
  (Tessellation)`**, working on Built-in, URP and HDRP. Though the same page
  says **"Feature availability varies"**.
- There's a material converter — **`Window > Rendering > Unity Toon Shader
  Converter`**. It's **"irreversible"**, so back up, and **materials older than
  2.0.6 need re-saving with 2.0.7+**.
- "Built-in only" and the repository's `UTS/Universal` releases **aren't a
  contradiction.** The converter doc lists three sources, and `Universal Toon
  Shader` among them is a separate name. How much code the two lines share
  **the docs don't say.**
- For the license the README says **Unity-Chan License 2.0**, but the
  `unity-chan.com` address pointing at those terms **302s to another page** that
  doesn't carry them. The successor is under the **Unity Companion License for
  Unity-dependent projects**. **Obtain the text yourself and read it.**
- The video's three links rotted **in three different ways** — a repository with
  a notice, a redirect, a store deprecation. None of them is a 404.
- In code, count by reading `material.shader.name`. `Shader.Find` turns **pink
  in a build** without a reference, and `FindObjectsByType` **excludes inactive
  objects by default** and **doesn't return assets.**

---

### References

- [UnityChanToonShaderVer2_Project — GitHub](https://github.com/unity3d-jp/UnityChanToonShaderVer2_Project)
- [Releases — UnityChanToonShaderVer2_Project](https://github.com/unity3d-jp/UnityChanToonShaderVer2_Project/releases)
- [Unity Toon Shader overview — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/index.html)
- [Installation — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/installation.html)
- [Getting Started with Unity Toon Shader — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/GettingStarted.html)
- [Material Converter — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/manual/MaterialConverter.html)
- [Changelog — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/changelog/CHANGELOG.html)
- [License — `com.unity.toonshader@0.13`](https://docs.unity3d.com/Packages/com.unity.toonshader@0.13/license/LICENSE.html)
- [com.unity.toonshader — GitHub](https://github.com/Unity-Technologies/com.unity.toonshader)
- [Shader Calibration Scene — Unity Asset Store](https://assetstore.unity.com/packages/templates/tutorials/shader-calibration-scene-25422)
- [Shader.Find — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Shader.Find.html)
- [Object.FindObjectsByType — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Object.FindObjectsByType.html)
- [Renderer.sharedMaterial — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Renderer-sharedMaterial.html)

The clipping is 골드메탈's YouTube video
[카툰렌더링으로 캐릭터를 예쁘게 꾸미자🥰UnityChanToonShader V2 \[유니티 에셋 A11\]](https://www.youtube.com/watch?v=qoYrqHV-prk)
(2022-03-01), in Korean; the chapter titles above are my translations. What was
clipped is only the description and the chapter list, so I quote nothing from
the video itself and instead **used its three links and five chapters as
coordinates** for checking primary sources. The video teaches the 2022 UTS2
accurately. That the repository has since gained a notice, that a successor
package exists, and that the three links each rotted differently is what this
post confirmed.
