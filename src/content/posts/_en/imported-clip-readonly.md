---
pubDatetime: 2026-10-08T20:00:00+09:00
title: "What's Read-Only Isn't the Clip, It's the Animation Window's View"
lang: en
translationKey: imported-clip-readonly
featured: false
draft: false
tags:
  - Unity
  - Animator
  - Animation
  - Editor
  - C#
description: "I clipped this while looking for a way to modify an Asset Store animation that showed up as ReadOnly. The post says duplicate it. But what's read-only is one window, not the clip, and a good deal of what counts as modifying needs no duplicate."
---

I wanted to modify an animation I'd downloaded from the Asset Store, and it
came up `ReadOnly`. Looking for a way around it I clipped this post. It's
short — about three sentences of body text — and it says that clips embedded in
an FBX are read-only, so copy one with `Ctrl+D` and use the copy. Three
screenshots show that.

The procedure works. And **if you're going to edit keyframes directly, it is
the right method.** But not everything that counts as "modifying" is keyframe
editing, and a good deal of it needs no duplicate at all. Looking at what the
read-only state actually blocks is what separates the two.

The manual's sentence scopes it narrowly.

> When viewing imported Animation keyframes, the Animation window provides a
> read-only view of the animation data.

The subject is **the Animation window.** It doesn't say the clip asset is
locked; it says the view that window shows is read-only. And Unity has three
separate documentation pages on **attaching data to imported clips** — events,
curves and masks. All three open the same way.

> You can attach animation events to imported animation clips in the Animation
> tab.

Five things checked out. **The read-only statement is about the Animation
window's view, and what it covers is keyframes and curves**, **clip range,
looping and root motion are changed in the import settings with no
duplicate**, **events, curves and masks are also attached in the import
settings**, **the copy procedure the docs write down is `Ctrl+C`/`Ctrl+V`, not
`Ctrl+D`**, and **a duplicate is a separate asset with no link to the
original, so it becomes a snapshot once the Asset Store package updates.**

This blog has two animation posts already.
[CrossFade's 0.3f](/en/posts/animator-crossfade/) and
[With IK Pass off, all six IK functions are silent](/en/posts/animator-members/)
both covered the **`Animator` component**. This post is about the other side —
**where the clip that component plays actually lives, and who rebuilds it.** It
doesn't hand anything off, though. Every explanation and code sample it needs
is reproduced here in full.

Checked on **2026-10-08** against Unity **6.6**.

## Table of contents

## What read-only blocks is keyframe editing

The line right after the one quoted above scopes what you cannot do.

> You cannot edit this data, but you can edit a copy of the Animation data

"This data" here is the previous sentence's **imported Animation keyframes.**
So what read-only blocks is **editing the bones' keyframes and curves directly
in the Animation window**, and nothing beyond that.

Why it's blocked makes sense once you look at it. That clip is a sub-asset
inside the `.fbx`, and the `.fbx` is something the importer **regenerates**
from the source file. Edit keyframes in the window and save, and the next
reimport would wipe them. So Unity locks the window and gives you a separate
place that **survives reimport** instead. That place is the import settings.

Two screens, two different jobs.

| Screen | How you open it | On an imported clip |
| --- | --- | --- |
| Animation window | Window > Animation > Animation | **Cannot** edit keyframes or curves (the view is read-only) |
| Import settings, Animation tab | Select the `.fbx` in the Project window → Inspector | Change range, looping, root motion; **attach** events, curves, masks |

## What changes in the import settings without a duplicate

There's a reference page for the Animation tab, and its title is just
"Animation tab". About the settings that appear when you select one clip, it
says this.

> These settings define import options for the selected Animation Clip.

**Import options.** That is, you're not editing the clip, you're editing **how
the clip gets built** — which is why it survives reimport. Here are the
entries you actually reach for.

| Entry | What the docs say |
| --- | --- |
| Start | "Start frame of the clip." |
| End | "End frame of the clip." |
| Loop Time | "Play the animation clip through and restart when the end is reached." |
| Loop Pose | "Loop the motion seamlessly." |
| Cycle Offset | "Offset to the cycle of a looping animation, if it starts at a different time." |
| Root Transform Rotation | "Bake root rotation into the movement of the bones. Disable to store as root motion." |
| Root Transform Position (Y) | "Bake vertical root motion into the movement of the bones. Disable to store as root motion." |
| Root Transform Position (XZ) | "Bake horizontal root motion into the movement of the bones. Disable to store as root motion." |

Everything you actually trip over with Asset Store animations is in that list.
Cutting a motion that arrived as one long clip into several **with Start/End**.
Turning on **Loop Time** because the walk doesn't repeat. Turning off
**Bake Into Pose for Root Transform Position (XZ)** because the character moves
on the spot — all modifications that need no duplicate.

That last one is especially easy to misread. The symptom "the animation doesn't
move forward" invites suspicion of the keyframes, when as the docs put it, the
question is whether root motion was **baked into** the movement of the bones.
Disable it and it's stored as root motion instead.

## Events, curves and masks attach in the same tab

Besides changing how the clip is built, **adding data to it** also goes through
the import settings. There are three dedicated pages and all three open the
same way.

The events page is headed "Add events to animation clips." and its procedure
reads:

> To add an event to an imported animation, expand the Events section to
> reveal the events timeline

> Position the playback head at the point where you want to add an event,
> then click Add Event.

> in the Function property, fill in the name of the function to call when the
> event is reached.

The same page sums up what events do.

> Events allow you to add additional data to an imported clip which determines
> when certain actions should occur

**"add additional data to an imported clip"** — written as data going onto an
imported clip. A sentence that couldn't hold if the whole clip were locked.

The curves page is headed "Use curves to control the timing of animation
clips" and opens with this.

> You can attach animation curves to imported animation clips in the Animation
> tab.

You add one by expanding the Curves section at the bottom of the Animation tab
and clicking the plus icon, and you edit it like this.

> Double-clicking an animation curve brings up the standard Unity curve editor

Name a curve the same as an Animator Controller parameter and the curve drives
that parameter.

> that parameter takes its value from the value of the curve at each point in
> the timeline

The mask page is headed "Mask animation clips" and here is what it does.

> Masking allows you to discard some of the animation data within a clip

> To apply a mask to an imported animation clip, expand the Mask heading to
> reveal the Mask options.

This is the place to use the upper body of an Asset Store motion and throw the
legs away. Mask definitions get reused.

> This allows you to re-use a single mask definition for many clips.

**None of the three pages assumes a duplicate.** All three are written against
imported clips.

## A copy is needed when you edit keyframes

There are still cases where you have to edit the keyframes themselves —
catching the one frame where a hand goes through a wall, or moving a foot.
Then you need a copy. But the procedure the manual writes down isn't the
clipping's `Ctrl+D`.

> To create a copy of Animation data from a read only FBX file, follow these
> steps:

> In the Project window, select the FBX file with the animation data that you
> want to copy.

> In the Animation window, select the properties to limit the amount of
> animation data being displayed.

> Select the keyframes that you want to copy.

> Press Ctrl+C (macOS: Cmd+C) to copy the selected keyframes.

> Create a new empty Animation Clip for the GameObject where you want to paste
> the copied keyframes.

> Press Ctrl-V (macOS: Cmd+V) to paste the copied keyframes.

**Picking keyframes and pasting them into a new empty clip.** A different job
from duplicating the clip asset wholesale. The first brings only the properties
you selected; the second lifts the whole clip out.

That doesn't make the clipping's `Ctrl+D` wrong. The screenshots show the
result and it does work. **I just couldn't find where the docs write that
method down.**

And the documented procedure comes with a condition. This one is the kind that
fails quietly.

> For best results, the GameObject where you are pasting should have the same
> hierarchy and properties

> as the animation data you are copying.

It also says what happens when the hierarchy differs.

> If the GameObject does not have the same properties, the animation data is
> copied,

> but the properties are drawn in yellow.

> Hovering over the name of the property displays the message `The GameObject
> or Component are missing`.

**The copy goes through and the properties are drawn in yellow.** Not an
error. Paste an Asset Store motion onto your own character's rig with one bone
name different and you'll see that yellow, and those properties will move
nothing.

## With an Asset Store animation, the duplicate becomes a snapshot

The cost of duplicating is worth spelling out. Assets bought from the Asset
Store **get package updates.**

The docs' sentence about `.meta` files explains the relationship.

> The metadata file which Unity creates during the import process, stored next
> to the original asset file,

> contains the asset’s import settings, and contains a GUID

> a GUID which allows Unity to connect the original asset file with the
> artifact in the asset database

Import settings sit in the `.meta` next to the source file, and a GUID ties
the source to the import result. About reimporting, it says this.

> using the import settings and project settings saved in your project

And here is the one-line scripting reference for events put into import
settings.

> AnimationEvents that will be added during the import process.

From here a conclusion can be drawn **by joining two sentences.** The import
settings sit next to the FBX and reimport uses them, so **when a package
update replaces the FBX, the modifications made in the import settings stay
where they are.** A duplicate pulled out with `Ctrl+D`, by contrast, is a
separate asset with no link to the `.fbx`, and stays **a snapshot of the
moment you copied it** even after the package updates.

That is **a conclusion stitched from two sentences**, though. I couldn't find
a document stating "import settings survive a package update" in one sentence.
I'll keep that line clear. Worth confirming once, the first time you update a
package.

In practice it splits like this.

- If the modification can be finished in the import settings, **finish it
  there.** It survives updates.
- If you have to edit keyframes, you need a copy — and **from that moment the
  updates are yours to track by hand.** Better to write down which copy came
  from which version.

## The two docs disagree about parameters

If you're going as far as events, you need to know the handler's shape, and
two pages disagree about it.

**First, the count.** The Animation window side of the manual puts it this
way.

> Note that Animation Events only support methods with a single parameter.

The `AnimationEvent` scripting reference puts it this way.

> Animation events support functions that take zero or one parameter.

**"single parameter" and "zero or one" are different claims.** What's at stake
is whether a parameterless handler is allowed, and it is. The manual's side is
written too narrowly.

**Second, the type list.** The imported-clips page names four.

> There are four different parameter types: Float, Int, String or Object

The Animation window page adds `AnimationEvent` itself to that list. To pass
several values at once you take that object, and the class's properties are
shaped accordingly.

| Property | Description |
| --- | --- |
| `functionName` | "The name of the function that will be called." |
| `floatParameter` | "Float parameter that is stored in the event and will be sent to the function." |
| `intParameter` | "Int parameter that is stored in the event and will be sent to the function." |
| `stringParameter` | "String parameter that is stored in the event and will be sent to the function." |
| `objectReferenceParameter` | "Object reference parameter that is stored in the event and will be sent to the function." |
| `time` | "The time at which the event will be fired off." |
| `messageOptions` | "Function call options." |
| `isFiredByAnimator` | "Returns true if this Animation event has been fired by an Animator component." |

**I did not verify whether the import settings' Events UI offers the
`AnimationEvent` parameter type.** That the two pages list different sets is
as far as the documentation takes me.

How the call happens is in the class description.

> AnimationEvent lets you call a script function similar to SendMessage as
> part of playing back an animation.

**Similar to `SendMessage`.** It's looked up by name, so a typo in the function
name won't be caught by the compiler. The condition on the receiving side is
on the events page.

> Make sure that any GameObject which uses this animation in its animator has
> a corresponding script attached

## Where and why you'd use it

### A working example

The modifications you make in the import settings are inspector work, so
there's no code for them. Code is needed in two places — receiving the events,
and applying the same settings across many FBX files at once.

The receiving side is just a `MonoBehaviour` method. It has to live on **the
same GameObject** as the `Animator` playing the animation.

```csharp file="Scripts/Character/FootstepReceiver.cs"
using UnityEngine;

public class FootstepReceiver : MonoBehaviour
{
    private const float DefaultVolume = 1f;

    [Header("Footsteps")]
    [Tooltip("Can also be passed as the Object parameter in import settings")]
    [SerializeField]
    private AudioClip _defaultFootstep;

    [SerializeField]
    private AudioSource _audioSource;

    private void Awake()
    {
        if (_audioSource == null && !TryGetComponent(out _audioSource))
        {
            Debug.LogError("There is no AudioSource.", this);
        }
    }

    // Parameterless handler — the "zero or one" the reference describes.
    public void OnFootstep()
    {
        PlayFootstep(_defaultFootstep, DefaultVolume);
    }

    // Float parameter. Lets import settings vary the volume per step.
    public void OnFootstepWithVolume(float volume)
    {
        PlayFootstep(_defaultFootstep, volume);
    }

    // Object parameter, for passing left/right foot clips separately.
    public void OnFootstepWithClip(Object clip)
    {
        PlayFootstep(clip as AudioClip, DefaultVolume);
    }

    // AnimationEvent parameter, to take several values at once.
    // I did not verify that the import settings UI offers this type.
    public void OnFootstepDetailed(AnimationEvent animationEvent)
    {
        PlayFootstep(animationEvent.objectReferenceParameter as AudioClip,
                     animationEvent.floatParameter);
    }

    private void PlayFootstep(AudioClip clip, float volume)
    {
        if (clip == null || _audioSource == null)
        {
            return;
        }

        _audioSource.PlayOneShot(clip, volume);
    }
}
```

There's a reason `_audioSource` and `clip` don't use `?.`. Both are
`UnityEngine.Object`, and a reference left empty in the inspector can end up
in a state that **looks like null without being C#'s null.** So the comparison
is `== null`. For a plain C# object `?.` is right.

When an Asset Store package brings in dozens of FBX files, you can drive the
importer from code instead of repeating the same settings by hand.

```csharp file="Assets/Editor/ClipImportStamper.cs"
using UnityEditor;
using UnityEngine;

// Put this in an Editor folder. It compiles only into the editor assembly.
public static class ClipImportStamper
{
    private const string FunctionName = "OnFootstep";

    [MenuItem("Assets/Stamp Clip Import Settings", true)]
    private static bool ValidateStamp()
    {
        return Selection.activeObject != null
               && AssetImporter.GetAtPath(
                      AssetDatabase.GetAssetPath(Selection.activeObject))
                  is ModelImporter;
    }

    [MenuItem("Assets/Stamp Clip Import Settings")]
    private static void Stamp()
    {
        string path = AssetDatabase.GetAssetPath(Selection.activeObject);

        if (AssetImporter.GetAtPath(path) is not ModelImporter importer)
        {
            return;
        }

        ModelImporterClipAnimation[] clips = importer.clipAnimations;

        // If clipAnimations is empty, take defaultClipAnimations instead.
        if (clips.Length == 0)
        {
            clips = importer.defaultClipAnimations;
        }

        for (int i = 0; i < clips.Length; i++)
        {
            // Settings on the "how the clip is built" side.
            // lockRootPositionXZ is the inspector's
            // Root Transform Position (XZ) > Bake Into Pose.
            clips[i].loopTime = true;
            clips[i].lockRootPositionXZ = false;

            // Settings on the "data attached to the clip" side.
            clips[i].events = new[]
            {
                new AnimationEvent { time = 0.25f, functionName = FunctionName },
                new AnimationEvent { time = 0.75f, functionName = FunctionName },
            };
        }

        importer.clipAnimations = clips;

        // Write the import settings to the .meta and reimport.
        importer.SaveAndReimport();

        Debug.Log($"Stamped settings onto {clips.Length} clips: {path}");
    }
}
```

What that last line actually does is in the reference.

> Save asset importer settings if asset importer is dirty.

And the reimport follows from "Under the hood this calls
`AssetDatabase.ImportAsset`". That's the point where the previous section's
"added during the import process" actually happens.

### How to choose

From the modification you want to the place you do it.

| Modification | Where | Duplicate needed? |
| --- | --- | --- |
| Cut a long motion into several clips | Import settings > Clips, Start/End | No |
| Make it repeat | Import settings > Loop Time / Loop Pose | No |
| Make an in-place walk move forward | Clear Bake Into Pose on Root Transform Position (XZ) | No |
| Use the upper body and discard the legs | Import settings > Mask | No |
| Call a function at a given moment | Import settings > Events | No |
| Drive an Animator parameter along the motion | Import settings > Curves | No |
| Edit the bones' keyframe values directly | `Ctrl+C`/`Ctrl+V` keyframes into a new empty clip | **Yes** |
| Lift the whole clip out to edit freely | `Ctrl+D` in the Project window | **Yes** |

The order to decide in:

- **Open the import settings tab first.** More of that table says "No" than
  you'd expect. Most of what goes wrong with Asset Store motions is range,
  looping or root motion.
- **If it can't be done there, make a copy.** And from then on that copy is
  **yours to maintain.** It does not follow package updates.
- **Don't call the copy "unlocking ReadOnly".** It isn't unlocking anything,
  it's creating a separate asset.

### Where not to use it

- **Duplicating a clip to change range, looping or root motion.** The import
  settings do that, and duplicating only costs you the link to package
  updates.
- **Duplicating a clip to add events.** There's a dedicated page for that.
- **Suspecting the keyframes first when "the animation doesn't move
  forward".** Check Bake Into Pose on Root Transform Position (XZ) first.
- **Pasting keyframes onto a rig with a different hierarchy and moving on.**
  The copy goes through and the properties are drawn in yellow. Not an error.
- **Renaming the function in code without updating the import settings.** It's
  `SendMessage`-style, so the compiler won't catch it.
- **A handler that takes two parameters.** The reference says "zero or one."
  If you need several values, take an `AnimationEvent`.

## Summary

- **What's read-only isn't the clip, it's the Animation window's view.** The
  subject of the sentence is "the Animation window," and what can't be edited
  is **keyframes and curves**.
- How the clip gets built is changed in the **import settings' Animation
  tab**. The reference calls those settings **"import options"**, which is why
  they survive reimport. Start/End, Loop Time and Root Transform's Bake Into
  Pose all live here.
- **Events, curves and masks also attach to imported clips.** There are three
  dedicated pages and none of them assumes a duplicate.
- A copy is needed to **edit the bones' keyframes directly**. And the
  procedure the docs write down is **`Ctrl+C`/`Ctrl+V`** of keyframes into a
  new empty clip, not `Ctrl+D`.
- That procedure has a condition. When the hierarchy differs, **the copy goes
  through and the properties are drawn in yellow.** It isn't an error, so it's
  easy to miss.
- **A duplicate is a separate asset with no link to the `.fbx`.** When the
  Asset Store package updates, the duplicate stays a snapshot of the moment it
  was made. (That the import settings survive the update is a conclusion
  stitched from two sentences; I found no document saying it in one.)
- The two docs disagree about the handler's parameter count. The manual says
  "only ... a single parameter," the reference says **"zero or one."** The
  latter is correct.

---

### References

- [Animation from external sources — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/AnimationsImport.html)
- [Animation tab — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AnimationClip.html)
- [Animation Events on Imported Clips — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/AnimationEventsOnImportedClips.html)
- [Use curves to control the timing of animation clips — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/AnimationCurvesOnImportedClips.html)
- [Mask animation clips — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/AnimationMaskOnImportedClips.html)
- [Animation Events (Animation window) — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/script-AnimationWindowEvent.html)
- [Contents of the Asset Database — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/asset-database-contents.html)
- [AnimationEvent — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AnimationEvent.html)
- [ModelImporterClipAnimation — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/ModelImporterClipAnimation.html)
- [AssetImporter.SaveAndReimport — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AssetImporter.SaveAndReimport.html)

The starting point for this post was
[\[유니티\] ReadOnly 해제](https://sungjun0531.tistory.com/69)
(김조성준, 2024-01-22), in Korean. The body is three sentences long, so what I
quote from it is close to all of it. I followed its procedure as written and
checked its premise and the alternatives against both the current Unity 6.6
manual and the scripting reference. Checked on 2026-10-08.
