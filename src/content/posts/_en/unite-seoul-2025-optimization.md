---
pubDatetime: 2026-10-06T14:30:00+09:00
title: "Unload(false) Doesn't Unload the Instances"
lang: en
translationKey: unite-seoul-2025-optimization
featured: false
draft: false
tags:
  - Unity
  - C#
  - Optimization
  - Memory
  - Rendering
description: "Notes from the Unite Seoul 2025 optimization session. I cross-checked some twenty items against the docs one by one. Most hold up; five don't. The most dangerous is AssetBundle.Unload, whose two parameter cases are swapped."
---

I clipped this **while looking into what came out of the 2025 Unity
conference.** They're **notes taken while watching** the optimization session at
Unite Seoul 2025.

This clipping has a different form from everything covered so far. It isn't
official documentation or a blog post — it's **a memo written down while
listening to a talk.** So it has to be read differently. Each sentence isn't a
finished explanation but **an item on a "go check this" list.** Some twenty of
them, from shader variants to overdraw.

So that's how I read it. I cross-checked the items against the docs one by one.
**Most of them hold.** For a memo taken live the accuracy is high, and it even
links three official Unity blog posts.

Five snagged. One of them has **the direction reversed**, so following it as
written produces the opposite result.

> AssetBundle.Unload(false); 로 에셋 번들을 내리면 **관련된 인스턴스가 같이
> 내려가기 때문에** Custom AssetBundle Provider 를 만들어서 제어하는 것도
> 가능하다.
>
> (Unloading an AssetBundle with AssetBundle.Unload(false) **also brings down the
> related instances**, so making a Custom AssetBundle Provider to control it is
> also possible.)

It says passing `false` brings the instances down with it. The docs say the
opposite.

## Table of contents

## `Unload(false)` Doesn't Unload the Instances

`AssetBundle.Unload(bool unloadAllLoadedObjects)` splits behavior on one
parameter. The docs write out both cases.

> **false** — tracking data structures and any memory buffers holding content of
> the AssetBundle are freed, but any instances of objects loaded from the bundle
> **remain intact**.

> **true** — all objects that were loaded from the bundle are **destroyed**. If
> any GameObjects in a Scene reference the destroyed assets, these references
> become missing.

**`false` keeps the instances and `true` destroys them.** The notes attached the
destroying behavior to the `false` side. It reads like the two cases were
swapped.

Getting this parameter backwards produces symptoms in two directions.

| Intent | Argument used | What actually happens |
| --- | --- | --- |
| To free memory | `Unload(false)` | Only compressed buffers go; **loaded objects stay** |
| To keep references | `Unload(true)` | Assets the Scene referenced **break as Missing** |

The first becomes "I unloaded the bundle and memory didn't drop," the second
becomes "the material turned pink." **Both send you hunting for the cause in the
wrong place**, which makes them expensive.

The docs also note what's common to both cases.

> no more objects can be loaded from from the bundle unless it is reloaded.

(The `from from` is a typo on the docs' side.) Either way, **loading anything new
from that bundle is over.** `false` isn't "a gentle unload" — it closes the load
path and reclaims only the compressed data.

The Unity blog post the notes link on this item is about saving memory with
Addressables, and the `PersistentManager.Remapper` and `SerializedFile` it
covers appear in the notes too. That those two regions grow with bundle count,
and the conclusion that **"you have to load the minimum necessary bundles,"** are
both right. Same spot as the load-granularity discussion in
[the post on Addressables](/posts/unity-addressables/).

## Two Places Where 0 Doesn't Mean Disabled

There are two places in the notes where the number `0` is read as "off." The docs
write both of them with a different meaning.

### Shader chunk count

The Dynamic Shader Loading item.

> 기본값은 청크갯수가 0으로 설정(**비활성화**)되어 있다.
>
> 청크 갯수를 늘리고 청크 사이즈는 작은 값부터 시작해서 테스트 해보길 권장한다.
>
> (The default has chunk count set to 0 (**disabled**). Recommended to increase
> the chunk count and test chunk size starting from small values.)

Here's what the docs say.

> Use **Default chunk count** to limit how many decompressed chunks Unity keeps
> in memory. The default is `0`, which means **there's no limit**.

The scripting API side is even more direct.

> The default value is `0`, which means Unity **loads and decompresses all the
> chunks** into memory.

**0 isn't disabled, it's no limit.** And what's disabled isn't the "feature"
either. Chunking is running; only **the cap on how many are held in memory** is
unset.

So "increase the chunk count" inverts as advice too. Raising it from 0 is
**newly imposing** a cap, and growing the number loosens it. To reduce memory you
have to try **small values first** — the advice the notes give for chunk size
applies to the count as well.

A `0` that looks like "off" but actually means no limit has come up before. In
[the post on Docker resource limits](/posts/docker-resource-limits/),
`--memory-swap=0` didn't disable swap but was **treated as unset** — the same
shape. **In a cap, 0 usually means "none," and "none" isn't "zero" but
"unlimited."**

### Per-layer shadow cull distances

The culling item lists two APIs by name only.

> - Camera.layerCullDistances,
> - Light.layerShadowCullDistances,

Both are real APIs and the purpose is right. But the docs attach three conditions
to `Light.layerShadowCullDistances`.

| Condition | Docs |
| --- | --- |
| Light type | "Directional lights only." |
| Array length | A float array of **exactly 32 values** |
| Meaning of 0 | **Keeps the current behavior** for that layer (it isn't off) |

Here too, 0 isn't "off." To disable it entirely you assign `null` — the docs say
that is equivalent to an array of 32 zeros. So **0 means "don't touch this
layer."**

The rule for using both together is written down as well. When the same layer has
values in both, the effective shadow culling distance is **the smaller of the
two.** If you shrank only the camera side and shadows didn't shrink, this is
where to look.

## Update When Offscreen Is Off by Default

The skinning item.

> Skinned Mesh Renderer > UpdateWhenOffscreen 이 **기본으로 켜져있는데**,
> 비활성화 하면 안보일때 메쉬를 업데이트 하지 않는다.
>
> (Skinned Mesh Renderer > UpdateWhenOffscreen is **on by default**; disabling it
> means the mesh isn't updated when not visible.)

The manual's Inspector reference says the reverse.

> **Update When Offscreen** — Enable this option to calculate the bounding
> volume at every frame, even when the mesh is not visible by any Camera.

> The property is **disabled by default, for performance reasons.**

**It's off by default, and the reason is performance.** It's already an optimized
default, so there's nothing to go turn off.

Then when do you **turn it on**? The docs' `Bounds` description answers. Unity
pre-calculates the bounds at mesh import, and enabling this option **recalculates
them every frame and overwrites that value.** It's the box to check when bones
move far enough to leave the pre-calculated bounds and **a mesh that should be
visible disappears.**

So it isn't a performance item but **an accuracy item**, and the default already
stands on the performance side. The notes' conclusion ("disabling it means it
isn't updated") is correct as a behavior description, but it **lists something
with nothing to do as something to do.**

### Bone count is something the docs put at import

The preceding sentence of the same item.

> Quality Settings > Skin weight or SkinnedMeshRenderer > Quality 에서 최대
> 영향을 주는 본 갯수를 제한 해서 성능을 올릴 수 있다.
>
> (You can improve performance by capping the maximum number of influencing bones
> in Quality Settings > Skin weight or SkinnedMeshRenderer > Quality.)

The paths and the effect are right. The options match the docs too.

| Setting | Meaning |
| --- | --- |
| Auto | Uses the global limit in Quality Settings > Skin Weights |
| 1 Bone / 2 Bones / 4 Bones | Runtime cap on bones per vertex |

What's missing is the recommendation the docs attach right below it.

> for performance reasons, it's better to set the number of bones that affect a
> vertex **on import**, rather than using a runtime cap.

**The import setting comes before the runtime cap.** A runtime cap trims data
that already arrived, every frame; the import setting reduces the data itself.
And one more thing — if you need **more than four** bone influences per vertex,
the component can't specify it and you have to leave it on `Auto`.

## Variants Aren't Powers of Two but a Product of Sets

The first line of the shader variant item.

> 쉐이더에 키워드가 추가될 때 마다 **2의 지수형태로** 증가한다.
>
> 키워드가 켜진 쉐이더, 안켜진 쉐이더를 각각 경우의 수로 빌드를 해야되니
> 배리언트가 증가하는 것
>
> (Every time a keyword is added to a shader it grows **as a power of two.**
> Variants increase because the keyword-on and keyword-off shaders each have to
> be built as separate cases.)

The second sentence states the condition for the first. For a keyword that's
**on/off, two ways**, powers of two is right. The general rule the docs state is
broader.

> The number of shader variants that Unity compiles for a shader program is the
> **product of the keyword sets**; that is to say, Unity compiles one variant
> for every combination that includes one element from each set.

**A product of sets.** Put three mutually exclusive keywords in one set and that
set becomes ×3 (or ×4 counting the implicit "none"), which departs from powers of
two. That's why the number on an Asset Store shader comes out larger than
expected — the spot where the notes say "shaders bought from the Asset Store need
particular care."

To see the order of magnitude you have to count by sets.

| Keyword composition | Variant count |
| --- | --- |
| 10 toggles | 2¹⁰ = **1,024** |
| 8 sets of 3 | 3⁸ = **6,561** |
| 4 toggles + 2 sets of 4 | 2⁴ × 4² = **256** |

The notes' point that `multi_compile` is the main cause is right too. In
[the post on custom shaders](/posts/unity-custom-shaders/) I looked at the one
sentence that splits it from `shader_feature` — `shader_feature` compiles only the
combinations **the build's materials actually use** and strips the rest, while
`multi_compile` compiles regardless. **If it isn't an option you change from code
at runtime, `shader_feature`** should be the default.

## What Bounds the FixedUpdate Count Isn't the TimeStep

The notes' diagnosis is accurate.

> 기본적으로 FixedTimeUpdate는 이전 프레임에서 렉이 발생했을때 현재 프레임에서
> 보상하기 위해 여러번 발생하게 된다.
>
> (By default FixedUpdate fires multiple times in the current frame to compensate
> for a lag spike in the previous frame.)

There are two prescriptions, and both go the long way around.

> 따라서 TimeStep을 Update와 동일하게 맞춰주거나, (기본값은 FixedTimeStep이
> 0.02라서 50프레임 기준이다) 스크립트로 수동호출하는 방식을 고려할 수 있다.
>
> (So you can consider matching the TimeStep to Update — the default
> FixedTimeStep is 0.02, i.e. 50 fps — or calling it manually from script.)

That 0.02 s is 50 Hz is right. But **matching a fixed timestep "to be the same
as" a variable `Update` doesn't hold.** `Update`'s interval varies per frame while
`FixedUpdate`'s is fixed. Raising the value only makes physics steps less
frequent.

There's a separate setting that bounds the count directly:
`Time.maximumDeltaTime`.

> The maximum value of Time.deltaTime in any given frame. This is a time in
> seconds that limits the increase of Time.time between two frames.

> **Bounds the maximum number of times** Unity executes
> MonoBehaviour.FixedUpdate in a frame to `Time.maximumDeltaTime /
> Time.fixedDeltaTime`.

**The cap on `FixedUpdate` calls in one frame is the ratio of those two.** In
project settings it's **Project Settings > Time > Maximum Allowed Timestep**, and
the docs describe that box as the interval that "caps the worst case scenario when
frame rate is low."

There's a constraint too.

> maximumDeltaTime cannot be set lower than Time.fixedDeltaTime.

**You can't go below `fixedDeltaTime`.** So the minimum of that ratio is 1, and
"one `FixedUpdate` per frame" is the floor you can reach.

Lining up the three values:

| Setting | Inspector | Changing it changes |
| --- | --- | --- |
| `Time.fixedDeltaTime` | Fixed Timestep | The **interval** between physics steps |
| `Time.maximumDeltaTime` | Maximum Allowed Timestep | The **cap on calls** in one frame |
| `Physics.simulationMode` | Physics > Simulation Mode | **Who does the calling** |

`FixedTimeStep` and `Simulation Mode`, which the notes list as things to check,
are the first and third rows — and **the middle row is missing.** The middle row
is what directly stops physics from piling into one frame after a hitch.

## The Docs Say Not to Use Legacy Animation

The animator item carries this advice.

> 애니메이터자체로도 부하가 있기 때문에 작은 클립 (애니메이션 커브가 400 이하)만
> 재생할 꺼라면 애니메이터 보다는 **레거시Animation 컴포넌트를 사용하는게
> 성능적으로 이득**이다.
>
> (Since the Animator itself has overhead, if you'll only play small clips (under
> 400 animation curves), **using the legacy Animation component is a performance
> win** over the Animator.)

The performance figure is the speaker's measurement and I can't verify it. The
400-curve threshold isn't a number in the docs either. But **what the docs say
about that component can be checked.**

> This is the **Legacy Animation** component, which was used on GameObjects for
> animation purposes prior to the introduction of the Mecanim Animation system.

> This component is retained in Unity for **backwards compatibility**. For new
> projects, **use the Animator component**.

**The docs say not to use it in new projects.** The talk's advice and the docs'
guidance point in opposite directions.

Both may be right. On performance alone the talk is; on maintenance and support
the docs are. So the conclusion for this item isn't **"which one is correct" but
"choose knowing what you give up."** Read only the notes and you choose without
knowing the second half.

The item's other sentences don't conflict with the docs. That the Animator runs on
the job system, that certain events force it onto the main thread, that you can
group it with Playables and drive `Animator.Update` yourself — all real paths. The
transition handling from [the post on CrossFade](/posts/animator-crossfade/) sits
inside that Animator-side cost.

## Items That Checked Out

Far more items didn't snag. Here are the ones I verified, with the docs' wording.

| The notes' claim | Verified |
| --- | --- |
| Raycast's default distance is infinite | Correct. `maxDistance` defaults to `Mathf.Infinity` |
| Reduce targets with a layer mask | Correct. But the default isn't everything — it's `DefaultRaycastLayers` |
| `Object.InstantiateAsync` allows async handling | Correct. "the last stage involving integration and awake calls is executed on the main thread" |
| `GarbageCollector.GCMode` can disable GC | Correct. "Continuous allocations after disabling the garbage collector will result in a continuous increase in memory usage" |
| Watch out for members returning copies, like `Object.name` | Correct |
| Separate dynamic and static elements in UI | Correct |
| Optimize overdraw with meshes whose transparent area is removed | Correct |

Three rows are worth one more layer.

**The layer mask's default** isn't "everything." It's `DefaultRaycastLayers`,
which excludes the built-in `Ignore Raycast` layer. The advice to narrow it is
right, but the starting point already isn't the full set. Concrete usage is in
[the post on OverlapSphere](/posts/physics-overlapsphere/).

**`Object.name`** is a spot this blog has already dug into. In
[the post on object pooling](/posts/unity-object-pooling/) I confirmed that
`GameObject.name` is a `[FreeFunction]` extern call, so **each access builds a
fresh managed string from the native one** — and the official docs don't record
that as an allocation. It's the property the notes bundle as "members returning
copies."

**Disabling the GC** has three modes, not two. The notes mention only `Disabled`,
while `Manual` exists separately — it stops automatic invocations but keeps manual
collection. The docs' recommendation is specific too: use it only for long-lived
allocations, and restore it before loading new content so memory can be reclaimed
manually. That's **more a conditional use case** than the notes' "hard to
recommend."

The IL2CPP stripping item has a line to add as well. The notes say "many studios
raised this option, had code they actually use get deleted, and tend not to use
it" — but on IL2CPP **you can't turn it off.**

| Level | Docs |
| --- | --- |
| Disabled | "Unity doesn't remove any code." **Mono only**, and Mono's default |
| Minimal | Searches only `UnityEngine` and the .NET class libraries. **IL2CPP's default** |
| Low | Adds user assemblies, but only if none of their types are referenced in scenes |
| Medium | Partially searches all assemblies, applying rules that strip more patterns |
| High | Extensively searches all assemblies. "prioritizes size reduction more than code stability" |

**IL2CPP's floor is `Minimal`.** So the real state behind "tend not to use it"
isn't off but sitting at the default, and the `Medium` the notes recommend is two
steps up. Specifying what to preserve with `link.xml` was covered in
[the post on installing Newtonsoft Json](/posts/unity-newtonsoft-json-install/).

The UGUI item's `Canvas.cullTransparentMesh` has a slightly different name. It's
actually `CanvasRenderer.cullTransparentMesh` — and the notes do write "the canvas
renderer has" in the body — described as:

> Indicates whether geometry emitted by this renderer can be ignored when the
> vertex color alpha is close to zero for every vertex of the mesh.

The per-version default change **isn't stated in the docs.** The advice to check
it on a migrated project holds, but I couldn't find grounds for it in the
documentation.

## Where and Why You'd Use It

### Print your project's actual values

The usefulness of these notes is in making you check **your project's current
value** for each item. The ones that come out as numbers can be printed in one go.

```csharp
using UnityEngine;

public class OptimizationSettingsReport : MonoBehaviour
{
    private const int FIXED_UPDATE_WARN = 4;

    [Header("Report")]
    [SerializeField, Tooltip("Log the settings at scene start")]
    private bool _reportOnStart = true;

    private void Start()
    {
        if (!_reportOnStart)
        {
            return;
        }

        ReportTime();
        ReportSkinning();
    }

    private static void ReportTime()
    {
        float fixedStep = Time.fixedDeltaTime;
        float maxStep = Time.maximumDeltaTime;

        // The bound the docs state: maximumDeltaTime / fixedDeltaTime
        int maxCalls = Mathf.FloorToInt(maxStep / fixedStep);

        Debug.Log($"fixedDeltaTime {fixedStep:F4}s ({1f / fixedStep:F0}Hz)");
        Debug.Log($"maximumDeltaTime {maxStep:F4}s");
        Debug.Log($"FixedUpdate cap per frame: {maxCalls}");

        if (maxCalls >= FIXED_UPDATE_WARN)
        {
            Debug.LogWarning($"after a hitch, physics can pile up to {maxCalls} times in one frame");
        }
    }

    private static void ReportSkinning()
    {
        // Global bone cap. A component set to Auto uses this value.
        Debug.Log($"QualitySettings.skinWeights {QualitySettings.skinWeights}");

        SkinnedMeshRenderer[] renderers =
            FindObjectsByType<SkinnedMeshRenderer>(FindObjectsSortMode.None);

        int offscreenUpdating = 0;

        foreach (SkinnedMeshRenderer renderer in renderers)
        {
            // The default is false. If it's true, someone turned it on.
            if (renderer.updateWhenOffscreen)
            {
                offscreenUpdating++;
                Debug.Log($"updateWhenOffscreen on {renderer.name}", renderer);
            }
        }

        Debug.Log($"{offscreenUpdating} of {renderers.Length} SkinnedMeshRenderers update offscreen");
    }
}
```

**The direction you count `updateWhenOffscreen` matters.** The default is off, so
the ones that are on are the exception, and an exception should have a reason.
Believe the notes' "on by default" and you go around turning them all off, when
the actual job is **finding whoever turned them on.**

`FindObjectsByType` is the Unity 6 name. The older `FindObjectsOfType` is no
longer recommended.

### Funnel bundle unloading through one place

Known backwards, `Unload`'s parameter produces symptoms somewhere else entirely.
Rather than scattering the calls, wrapping them in functions whose names carry the
intent at least **leaves which side you meant in the code.**

```csharp
using System.Collections.Generic;
using UnityEngine;

public class BundleRegistry : MonoBehaviour
{
    [Header("Logging")]
    [SerializeField, Tooltip("Log when unloading")]
    private bool _verbose = true;

    private readonly Dictionary<string, AssetBundle> _bundles =
        new Dictionary<string, AssetBundle>();

    public void Register(string key, AssetBundle bundle)
    {
        if (bundle == null || string.IsNullOrEmpty(key))
        {
            return;
        }

        _bundles[key] = bundle;
    }

    /// Reclaims only the compressed data. Already-loaded objects stay alive.
    /// Loading anything new from this bundle ends with this call.
    public void ReleaseCompressedData(string key)
    {
        if (!_bundles.TryGetValue(key, out AssetBundle bundle) || bundle == null)
        {
            return;
        }

        if (_verbose)
        {
            Debug.Log($"[bundle] {key} — compressed data freed, instances kept");
        }

        bundle.Unload(false);
        _bundles.Remove(key);
    }

    /// Destroys the objects loaded from this bundle too.
    /// If the Scene references those assets, the references break.
    public void DestroyLoadedObjects(string key)
    {
        if (!_bundles.TryGetValue(key, out AssetBundle bundle) || bundle == null)
        {
            return;
        }

        if (_verbose)
        {
            Debug.LogWarning($"[bundle] {key} — destroying loaded objects too");
        }

        bundle.Unload(true);
        _bundles.Remove(key);
    }
}
```

**The function name stands in for the argument.** With `Unload(false)` sitting
raw in the code, a reader has to recall which side it is every time, while
`ReleaseCompressedData` and `DestroyLoadedObjects` say the outcome in their names.
An API whose behavior inverts on one argument is safer wrapped like this.

### Where Not to Use It

- **Treating `Unload(false)` as "the safe unload."** The load path closes either
  way. Memory not dropping is because the instances stayed.
- **Raising chunk count from 0 to reduce memory.** 0 is already unlimited. To
  reduce it, put in a small value.
- **Going around turning `updateWhenOffscreen` off.** It's off by default. If it's
  on, someone may have enabled it for a bounds problem, so look at the reason
  first.
- **Putting 0 into `Light.layerShadowCullDistances` to disable it.** 0 keeps the
  current behavior. To disable, use `null`, and the array must be exactly 32.
- **Counting variants by toggle count alone.** With mutually exclusive keyword
  sets it leaves powers of two behind.
- **Raising `Fixed Timestep` to stop the post-hitch physics pile-up.** The cap on
  calls is on the `Maximum Allowed Timestep` side.
- **Quoting the notes' figures as-is.** 400 curves, 20% stripping — those are the
  speaker's measurements and aren't in the docs. Measure them in your own project.

## Wrapping Up

- **`AssetBundle.Unload(false)` keeps the instances.** The destroying side is
  `true`. The notes swapped the two cases, and backwards it makes "memory didn't
  drop" and "references broke" look like two unrelated causes.
- **Shader chunk count 0 isn't disabled, it's unlimited.** The docs say "there's
  no limit" and the API says "loads and decompresses all the chunks." To reduce
  it, put in a small value.
- **`Light.layerShadowCullDistances`' 0 isn't an off value either.** It keeps the
  current behavior; `null` disables. Directional only, array fixed at 32.
- **`Update When Offscreen` is off by default.** The docs say "disabled by
  default, for performance reasons." It's a bounds-accuracy item, not a
  performance item.
- **Bone count belongs at import rather than a runtime cap.** The docs recommend
  it that way.
- **Variants are a product of keyword sets, not powers of two.** The two coincide
  when everything is a toggle. That's why the number grows on Asset Store shaders.
- **The cap on `FixedUpdate` calls is `Maximum Allowed Timestep`.** A fixed
  timestep can't be matched to a variable `Update`.
- **The docs say not to use legacy `Animation` in new projects.** The talk's
  performance advice and the docs' guidance split, so it's an item to choose
  knowing what you give up.
- **The rest largely holds.** For a memo taken live the accuracy is high, and the
  five that snagged came mostly from **the meaning of the number 0 and from
  default values.**

---

### References

- [AssetBundle.Unload — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/AssetBundle.Unload.html)
- [Control how much memory shaders use — Unity Manual](https://docs.unity3d.com/6000.0/Documentation/Manual/shader-memory.html) ·
  [PlayerSettings.SetDefaultShaderChunkCount](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/PlayerSettings.SetDefaultShaderChunkCount.html)
- [Skinned Mesh Renderer component — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/class-SkinnedMeshRenderer.html) ·
  [SkinnedMeshRenderer.updateWhenOffscreen](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/SkinnedMeshRenderer-updateWhenOffscreen.html)
- [Light.layerShadowCullDistances — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Light-layerShadowCullDistances.html)
- [Shader variants — Unity Manual](https://docs.unity3d.com/Manual/shader-variants.html)
- [Time.maximumDeltaTime — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Time-maximumDeltaTime.html) ·
  [Time settings — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/class-TimeManager.html)
- [Legacy Animation component — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/class-Animation.html)
- [Object.InstantiateAsync — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Object.InstantiateAsync.html) ·
  [GarbageCollector.GCMode](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Scripting.GarbageCollector.GCMode.html)
- [Configure managed code stripping — Unity Manual](https://docs.unity3d.com/6000.2/Documentation/Manual/managed-code-stripping-configure.html)
- [Physics.Raycast — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Physics.Raycast.html) ·
  [CanvasRenderer.cullTransparentMesh](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/CanvasRenderer-cullTransparentMesh.html)

The starting point for this post was
[맨텀 — \[영상 필기\]\[Unite Seoul 2025\] Unity 프로젝트 개발 시 반드시 체크해야 할 최적화 관련 기능 공유](https://mentum.tistory.com/968)
(2025-05-13). I cross-checked each item in the notes against the current Unity
docs, and left out the items whose figures are the speaker's own measurements.
UGUI overdraw and vertex cost are in
[the post on the Outline component](/posts/ugui-outline-component/), and layout
system cost in [the post on layout groups](/posts/ugui-layout-group/).
