---
pubDatetime: 2026-10-13T15:40:00+09:00
title: "What You Can Stop Is Only 'the Currently Set Clip'"
lang: en
translationKey: audiosource-play-oneshot
featured: false
draft: false
tags:
  - Unity
  - C#
  - Sound
  - Optimization
description: "Clipped while looking for how to play a video's separately extracted audio just once, then pulled back out while working on in-game dialogue and SFX output for the TTS project. It lays out the difference between Play() and PlayOneShot() in two paragraphs."
---

At first I was **playing audio extracted separately from a video.** While
looking for how to play that just once, I clipped a post that lays out the
difference between `AudioSource.Play()` and `AudioSource.PlayOneShot()` in two
paragraphs. Later I **pulled this post back out while working on in-game
dialogue and SFX output for the TTS project.** It's from 2024, and it carries
the two API references over almost verbatim. Its account of the difference is
correct — `Play()` cuts off the sound already playing and starts over, and
`PlayOneShot()` doesn't cut it off, it stacks.

Nothing in it is wrong. But **the consequence that difference brings along is
missing.** Because the sound that stacks isn't the clip you designated. Here's
how `Stop()`'s docs describe what it stops.

> The AudioSource.stop function stops the currently set Audio clip from
> playing.

**"The currently set clip."** So what happens to a clip handed over as an
argument? That's where this starts.

This blog has four posts on sound, and this is the fifth. The territory splits
like this —
[Unmuting Puts a dB Value Where a Linear One Belongs](/en/posts/unity-audiomixer-volume/)
and [It Recommends Snapshots, and Its Code Takes Them Away](/en/posts/audiomixer-groups-snapshots/)
cover **handling volume in the mixer**,
[An Error Page Comes Back and result Still Isn't ConnectionError](/en/posts/google-translate-tts/)
covers **building a clip at runtime**, and
[Resolution and Aspect Ratio Hold the Quality, Not Color Format](/en/posts/video-player-raw-image/)
covers **where a video's sound gets sent**. This one looks at **starting and
stopping playback on an `AudioSource`**. Where they overlap, I don't defer by
link — I carry as much as is needed here again.

I verified seven things. **The docs put the two functions in different groups
and give a third option**, **assigning to `clip` alone stops the sound already
playing**, **`Stop`'s docs don't mention `PlayOneShot`**, **and yet `isPlaying`
is true for one-shots**, **`PlayOneShot`'s second argument carries warnings**,
**independent playback has a ceiling called culling**, and **the cost of the
three functions sits in loading the clip, not in the call.**

Checked on **2026-10-13**, against Unity **6.6**.

## Table of contents

## The docs put the two in different groups

The last line of the `PlayOneShot` page points at another page.

> For more information on how this method differs from AudioSource.Play, see
> AudioSource.

That `AudioSource` class page has three lines side by side.

> To play, pause, and stop a single audio clip, use Play, Pause and Stop.

> To play multiple sounds on one AudioSource, use PlayOneShot.

> To play a clip at a static position in 3D space, use PlayClipAtPoint.

**`Play`, `Pause` and `Stop` are one group, and that group's subject is "a
single audio clip".** `PlayOneShot` sits outside that group, described as
"multiple sounds". The sentence the clipping carried over holds outside it too.

> AudioSource.PlayOneShot does not cancel clips that are already being played
> by AudioSource.PlayOneShot and AudioSource.Play.

**Not cutting them off also means there's no means to cut them off.** Invert
the clipping's "they play independently" and you get that sentence.

And there's a third option the clipping doesn't have.

> public static void PlayClipAtPoint(AudioClip clip, Vector3 position,
> float volume = 1.0F);

> Plays an AudioClip at a given position in world space.

> This function creates an audio source but automatically disposes of it once
> the clip has finished playing.

**It's `static`, and it makes an audio source per call that cleans itself up
when the clip ends.** It's the spot for when the object making the sound gets
destroyed first — an enemy exploding, an item disappearing. The price is one
source created per call.

| Function | What it plays | The use the docs give |
| --- | --- | --- |
| `Play` | `AudioSource.clip` | "a single audio clip" |
| `PlayOneShot` | the clip passed as an argument | "multiple sounds on one AudioSource" |
| `PlayClipAtPoint` | the clip passed as an argument | "at a static position in 3D space" |

## What Play plays is "the currently set clip"

The `clip` property's description is four sentences, and the second and third
matter.

> The default AudioClip to play.

> AudioSource clip determines the audio clip that should play next.

> When you assign a new audio clip to clip, the old clip it replaces (if any)
> stops and is replaced by the new one.

> However, the new clip doesn't automatically play so you need to use
> AudioSource.Play (or similar) to play it.

**Assigning alone stops the sound already playing, and assigning alone doesn't
start a new one.** Stopping and starting are attached to two different actions.
Which is why the clipping's example looks like this.

> audioSource.Clip = clip;
> audioSource.Play();

(The capital `Clip` in the original is a typo. The property name is `clip`.)
And the `Play` side attaches one condition.

> If AudioSource.clip is set to the same clip that is playing then the clip
> will sound like it is re-started.

**"The same clip"** is when it sounds re-started. The clipping writes "call
Play again and the clip sounds like it restarted" without that condition, but
if you changed `clip` in between, what you hear isn't a restart — it's **a
different sound**. The same page writes down the premise too.

> AudioSource will assume any Play call will have a new audio clip to play.

## What Stop stops is "the currently set clip" too

`Stop`'s description is three sentences.

> Stops playing the clip.

> The AudioSource.stop function stops the currently set Audio clip from
> playing.

> The Audio clip plays from the beginning the next time you play it.

**"The currently set Audio clip"** — the clip the `clip` property from the last
section points at. A clip handed to `PlayOneShot` as an argument was never
assigned to `clip`.

The functions that page points to for reference are only two.

> Additional resources: Play, Pause functions.

**No `PlayOneShot`.** And the `isVirtual` property counts two kinds by name.

> True if all sounds played by the AudioSource, such as main sound started by
> Play() or playOnAwake, and one-shots are culled by the audio system.

It writes **"main sound started by Play() or playOnAwake"** and **"one-shots"**
separately. The docs see two kinds of sound inside one `AudioSource`.

That's as far as the verified sentences go. Stitch them and you get "`Stop()`
doesn't stop a one-shot", but **I couldn't find a place where that is written
as one sentence.** That's my inference. What I verified is this — **`Stop` is
documented as stopping "the currently set Audio clip", a one-shot isn't that
clip, and `PlayOneShot` isn't in `Stop`'s reference list.** For a sound that
must be stoppable, **putting it on `clip` and playing it with `Play`** is the
path the docs guarantee.

## And yet isPlaying is true for one-shots

Here's one that goes against expectation. If you can't stop it, you'd think you
can't know its state either. `isPlaying` doesn't work that way.

> Returns whether the AudioSource is currently playing an AudioResource(Read
> Only).

> AudioSource.isPlaying returns true if the AudioSource is playing any
> AudioResource, such as AudioClip or AudioRandomContainer.

> This includes if you use PlayOneShot() or if you play a video or timeline
> track through the AudioSource.

**One-shots are explicitly included.** So the split is exactly this — **you can
know whether sound is playing, and you can't choose what to stop.** Try to
decide "has the SFX finished" with `isPlaying` and it keeps returning true
while some other one-shot is still ringing.

Three more notes are attached.

> Note: AudioSource.isPlaying returns false when AudioSource.Pause() is
> called.

> Note: If you use AudioSource.Play() back again, it returns true.

> Note: If you use AudioSource.PlayDelayed to play your clip,
> AudioSource.isPlaying returns true during the delay.

**It's false while paused, and true while a delayed play is still waiting.**
Read `isPlaying` as "playing" and both go against intuition. The first has the
sound stopped yet reads false; the second has no sound yet and reads true.

## PlayOneShot has a second argument

The clipping's examples only use the `PlayOneShot(clip)` form. The declaration
has two arguments.

> public void PlayOneShot(AudioClip clip, float volumeScale = 1.0F);

> Plays an AudioClip, and scales the AudioSource volume by volumeScale.

**It's a scale multiplied into the `AudioSource`'s volume.** It's the field for
using the same footstep at different strengths, and two warnings are attached.

> The scale of the volume. Unity automatically clamps negative scales to zero.

> Note: Scales larger than one might cause clipping.

**Negatives are clamped to zero, and going above one might clip.** So this
argument is safer used as **a handle for turning down**, not for turning up.

That the value is a **linear scale** is worth noting too. Volume in the mixer
switches units to dB, and what happens when a linear value goes in that slot is
written up in
[Unmuting Puts a dB Value Where a Linear One Belongs](/en/posts/unity-audiomixer-volume/).
**`volumeScale` and the mixer's value are not the same unit.**

## Independent playback has a ceiling too

The clipping's "call it several times and each plays independently" has an end.
`isVirtual`'s second sentence writes that end.

> A sound is culled when its resulting volume is lower than the volumes of the
> N loudest voices, where N is the number of maximum audible sounds specified
> in the audio Project Settings or via AudioConfiguration.

**Miss the N loudest by volume and the sound gets culled.** N is a project
setting. So you can't stack one-shots forever — **stack them and the quiet ones
go first.** It drops out silently rather than failing, so the symptom shows up
as "some footsteps don't get heard sometimes".

The `volumeScale` from the last section gains meaning here again. **A sound you
scaled down becomes a culling candidate sooner.** Play an important sound
quietly and it gets buried.

## The cost of the three functions sits before the call

I said that ceiling has a number, so let's see where the number lives. The
audio project settings have two fields.

> Set the number of real voices that can play at the same time. At every frame,
> the loudest voice is picked.

> Set the number of virtual voices that the audio system manages.

`Max Real Voices` and `Max Virtual Voices`. **"At every frame, the loudest
voice is picked"** — picking the loudest every frame is how the culling from
the last section actually happens. The virtual side carries guidance and a
warning.

> This value should always be larger than the number of voices played by the
> game.

> If not, Unity displays warnings in the console.

**It has to be larger than the number of voices the game plays, or Unity puts
warnings in the console.** In a project that leans on `PlayOneShot`, that
warning tells you first. There's one setting for cutting the cost of culled
sources, too.

> Enable to dynamically turn off effects and spatializers on AudioSources that
> are culled in order to save CPU.

That's `Virtualize Effect`. **It turns off effects and spatializers on culled
sources.**

That's the cost of "how many at once", and **the larger cost is in loading the
clip.** One field in the audio clip import settings names this post's two
functions **explicitly**.

> Enable this setting to preload the audio data when the audio clip asset
> loads.

> If you call AudioSource.Play or AudioSource.PlayOneShot while this setting is
> disabled, Unity loads the clip dynamically which can cause playback delays on
> larger files.

> To prevent this, explicitly call AudioClip.LoadAudioData before playback to
> load the data into memory and AudioClip.UnloadAudioData to unload it when
> it's no longer needed.

That's `Preload Audio Data`. **With it off, the clip gets loaded at the very
moment you call `Play` or `PlayOneShot`, and playback is delayed on larger
files.** And the docs name the remedy down to the function. There's a clue
about the default as well.

> Because this is a per-platform setting, the default value depends on your
> target platform's audio configuration.

**It's a per-platform setting and the default depends on the platform.** That's
the road where something fine in the editor stutters only in one build.

The function named as the remedy carries further conditions.

> Loads the asset data of an AudioClip into memory, so it will immediately be
> ready to play.

> It's recommended that you use AudioClip.LoadAudioData in methods like Start()
> of MonoBehaviour.

> It loads the AudioClip synchronously, unless AudioClip.loadInBackground is
> set to true.

> If you call it on an audio clip that is already loaded, it does nothing and
> returns true.

> It doesn't reload clips that have AudioClip.preloadAudioData set to true.

**That it loads synchronously by default** is the important part. Which is why
the docs recommend somewhere like `Start()` — call it mid-combat and that frame
stalls. It does nothing on an already-loaded clip, so **you don't have to worry
about calling it twice.**

What happens to a play request during an async load is written down too.

> Enable this setting to load the audio clip in the background, which prevents
> stalls on the main thread.

> Unity defers play requests on AudioClips that are still loading in the
> background until the clip loads fully.

> You can use the AudioClip.loadState property to query the load state.

**The play request is deferred, not dropped.** So calling `Play` during an
async load doesn't give you silence, it gives you **a late sound**. The
property that reads that state is `AudioClip.loadState`, and it returns
`AudioDataLoadState`.

Last is `PlayClipAtPoint`. Read the sentence from earlier through the lens of
cost and it says this.

> This function creates an audio source but automatically disposes of it once
> the clip has finished playing.

**It makes an audio source per call.** Convenient, at the price of a creation
and a destruction for every call. Make the per-frame sound of shell casings
with this and that much piles up. Somewhere like that, **keeping a few sources
around and cycling them** is better.

| Function | Where the cost appears | The remedy the docs give |
| --- | --- | --- |
| `Play` | loading at call time if `Preload Audio Data` is off | `LoadAudioData` somewhere like `Start()` |
| `PlayOneShot` | the voices that stack up (only the loudest survive each frame) | `Max Real`/`Virtual Voices` · `Virtualize Effect` |
| `PlayClipAtPoint` | an audio source created and destroyed per call | none in the docs. Cycle sources instead |

That last cell is **a spot where the docs write down no remedy.** Cycling
sources is my own judgement; the `PlayClipAtPoint` page carries no such advice.

The rest of the loading fields — `Load Type`, `Compression Format`, `Quality` —
are settings a runtime-built clip doesn't have at all, so they're written up in
the TTS post linked above. To pin one number down, `Streaming` carries this
clue.

> Streaming clips have an overhead of approximately 200KB, even without loaded
> audio data.

## Spacing belongs to the dedicated functions, not a coroutine

The clipping's two examples make the spacing with
`yield return new WaitForSeconds(...)`. It works, but the docs give you two
functions for that spot. First, `Play`'s parameter description.

> Deprecated. Delay in number of samples, assuming a 44100Hz sample rate
> (meaning that Play(44100) will delay the playing by exactly 1 sec).

> The delay parameter is deprecated, please use the newer
> AudioSource.PlayDelayed function instead which specifies the delay in
> seconds.

**`Play(delay)` is deprecated.** The replacement is this.

> public void PlayDelayed(float delay);

> Plays the clip with a delay specified in seconds.

And there's a separate case for when you need accuracy.

> Note: The AudioSource.PlayScheduled API will give you more accurate control
> over when the audio clip is played.

> Plays the clip at a specific time on the absolute time-line that
> AudioSettings.dspTime reads from.

> This is the preferred way to stitch AudioClips in music players because it is
> independent of the frame rate and gives the audio system enough time to
> prepare the playback of the sound to fetch it from media where the opening
> and buffering takes a lot of time (streams) without causing sudden CPU
> spikes.

**Independent of the frame rate** is the core of it. `WaitForSeconds` is tied
to frames, which doesn't suit stitching music. The parameter description even
writes down the lead time.

> Absolute start time in seconds on the AudioSettings.dspTime timeline.

> Schedule a time slightly in the future (~100-200ms) so the audio system can
> prepare playback.

What happens when you pass a past time is written down as well.

> If `time` is less than the current AudioSettings.dspTime, playback starts as
> soon as possible (typically immediately), not at that past instant.

> Any audio that would have played while `time` was in the past is not
> reproduced.

**Not an exception but immediate playback, and the elapsed stretch isn't
reproduced.**

## Where and why you'd use it

### A working example

This carries the docs' grouping straight into the structure. **A sound that
must be stoppable and a sound that may overlap go on different
`AudioSource`s.**

```csharp file="Scripts/Audio/SfxPlayer.cs"
using UnityEngine;

public class SfxPlayer : MonoBehaviour
{
    [Header("Sources")]
    [Tooltip("Sounds to stop and rewind. Put on clip and start with Play")]
    [SerializeField]
    private AudioSource _controlled;

    [Tooltip("Short SFX that may overlap. Only PlayOneShot is used")]
    [SerializeField]
    private AudioSource _oneShots;

    [Header("Volume scale")]
    [Tooltip("The docs say going above one might cause clipping")]
    [Range(0f, 1f)]
    [SerializeField]
    private float _oneShotScale = 1f;

    // Sounds that may overlap. The price of not being stoppable is that they
    // never cut each other off.
    public void PlayOverlapping(AudioClip clip)
    {
        if (_oneShots == null || clip == null)
        {
            return;
        }

        _oneShots.PlayOneShot(clip, _oneShotScale);
    }

    // Sounds that must be stoppable. It has to be on clip for Stop to point
    // at it.
    public void PlayStoppable(AudioClip clip)
    {
        if (_controlled == null || clip == null)
        {
            return;
        }

        // The assignment alone stops the previous clip. But the new clip
        // doesn't play on its own, so Play is called separately.
        _controlled.clip = clip;
        _controlled.Play();
    }

    public void StopStoppable()
    {
        if (_controlled == null)
        {
            return;
        }

        // What this Stop stops is 'the currently set clip'. The one-shots
        // above are not its subject.
        _controlled.Stop();
    }

    // When you need spacing that isn't tied to frames. The docs recommend a
    // 100-200ms lead.
    public void PlayStoppableAfter(AudioClip clip, double leadSeconds)
    {
        if (_controlled == null || clip == null)
        {
            return;
        }

        _controlled.clip = clip;
        _controlled.PlayScheduled(AudioSettings.dspTime + leadSeconds);
    }

    // When the object making the sound is about to be destroyed. This makes
    // one source per call.
    public static void PlayDetached(AudioClip clip, Vector3 position,
        float volume = 1f)
    {
        if (clip == null)
        {
            return;
        }

        AudioSource.PlayClipAtPoint(clip, position, volume);
    }

    // Loads ahead so Play doesn't load at call time. Synchronous unless
    // loadInBackground is on, which is why it sits in Start().
    private void Start()
    {
        PreloadAll();
    }

    private void PreloadAll()
    {
        // Fill this with the clips this object will play. Calling it on an
        // already-loaded clip does nothing and returns true.
        if (_controlled != null && _controlled.clip != null)
        {
            _controlled.clip.LoadAudioData();
        }
    }

    // isPlaying is true for one-shots too. It is not the answer to "has the
    // SFX finished".
    [ContextMenu("Log playback state")]
    private void LogState()
    {
        if (_controlled != null)
        {
            Debug.Log($"controlled.isPlaying = {_controlled.isPlaying}", this);

            if (_controlled.clip != null)
            {
                Debug.Log($"clip.loadState = {_controlled.clip.loadState}",
                    this);
            }
        }

        if (_oneShots != null)
        {
            Debug.Log($"oneShots.isPlaying = {_oneShots.isPlaying} "
                + $"(one-shots included), isVirtual = {_oneShots.isVirtual}",
                this);
        }
    }
}
```

There's a reason `_controlled`, `_oneShots` and `clip` don't use `?.`. They are
all `UnityEngine.Object`, and a reference left empty in the Inspector can end up
in a state that **looks like null but isn't C#'s null**. So they use `== null` /
`!= null` comparisons. For a plain C# object, `?.` is correct.

**Splitting the sources is the whole of this code.** Merge them into one and
you can't see from the code what a `Stop()` call stops. Carry the docs' grouping
of `Play`, `Pause` and `Stop` as the trio for "a single audio clip" into the
structure, and that ambiguity disappears.

Clamping `_oneShotScale` with `[Range(0f, 1f)]` is deliberate too. The docs say
going above one might clip, so **making it impossible to exceed in the
Inspector** is better. But `[Range]` only blocks the Inspector, not a code
assignment — that story is written up in
[\[MenuItem\] Belongs in an Editor Folder, and a MonoBehaviour Can't Go There](/en/posts/unity-attributes/).

`LoadAudioData` sits in `Start()` for the reason the docs give: it's a
synchronous load unless `loadInBackground` is on.

### How to choose

| Situation | What to use |
| --- | --- |
| A sound to stop or rewind | assign `clip` + `Play` (`Stop` points at it) |
| A short SFX that may stack | `PlayOneShot` |
| The same SFX at different strengths | `PlayOneShot(clip, volumeScale)` |
| The object making the sound is about to vanish | `PlayClipAtPoint` (makes a source, cleans it up) |
| A delay in seconds | `PlayDelayed` (`Play(delay)` is deprecated) |
| Stitching music | `PlayScheduled` + `AudioSettings.dspTime` |
| Accuracy independent of frames | `PlayScheduled` (100-200ms lead) |
| You only need to know whether sound is playing | `isPlaying` (one-shots included) |
| Whether one specific SFX has finished | `isPlaying` can't tell you |
| Sounds getting buried | `isVirtual` and the max audible count in project settings |
| Routing volume through the mixer | `AudioMixer`, not `volumeScale` (different units) |
| A large clip stutters on first play | `Preload Audio Data`, or `LoadAudioData` |
| Loading ahead of time | `LoadAudioData` somewhere like `Start()` (it's synchronous) |
| Not blocking the main thread | `Load In Background` (play requests get deferred) |
| Reading the load state | `AudioClip.loadState` |
| A warning that voices are short | make `Max Virtual Voices` larger than the voices played |
| CPU of culled sources | `Virtualize Effect` |
| You call `PlayClipAtPoint` often | keep sources around and cycle them (no remedy in the docs) |

Here's the order to judge in.

- **Start by asking whether you'll ever stop it.** If you will, it's `clip` +
  `Play`. `PlayOneShot` has no documented path to stopping.
- **Then whether it may overlap.** If overlapping is natural, like footsteps or
  hits, it's `PlayOneShot`, and that means **accepting the price of giving up
  stopping.**
- **Split the sources.** Mix the two kinds on one source and what `Stop()`
  targets stops being visible in the code.
- **If you need spacing, look at the dedicated functions.** `WaitForSeconds` is
  tied to frames, and the docs give you `PlayDelayed` and `PlayScheduled`.
- **For cost, look before the call, not at it.** Stutter comes from loading and
  burial from the voice count. Neither is fixed by editing the calling code.

### Where not to use it

- **Trying to stop a `PlayOneShot` sound with `Stop()`.** `Stop`'s docs name its
  subject as "the currently set Audio clip", and `PlayOneShot` isn't in its
  reference list.
- **Deciding a specific SFX has ended with `isPlaying`.** The docs wrote "This
  includes if you use PlayOneShot()". It stays true while another one-shot
  rings.
- **Reading `isPlaying` as "sound is audible".** It's false while `Pause`d and
  true while `PlayDelayed` is still waiting.
- **Giving `volumeScale` a value above one.** The docs wrote "Scales larger than
  one might cause clipping". Negatives are clamped to zero.
- **Treating `volumeScale` and the mixer's value as the same unit.** The former
  is a linear scale.
- **Stacking one-shots without limit.** Pushed outside the N loudest, they get
  culled. The quiet ones go first.
- **Using `Play(delay)`.** It's deprecated, and its unit is samples at a
  44100Hz reference. `PlayDelayed` is in seconds.
- **Passing a past time to `PlayScheduled`.** Not an exception but immediate
  playback, and the elapsed stretch isn't reproduced.
- **Assigning to `clip` and expecting sound.** The docs wrote "the new clip
  doesn't automatically play". The assignment stops, `Play` starts.
- **Playing a large clip without `Preload Audio Data`.** The docs name `Play`
  and `PlayOneShot` explicitly and say it "can cause playback delays on larger
  files". The default differs per platform.
- **Calling `LoadAudioData` mid-combat.** Without `loadInBackground` it's a
  **synchronous load**. The docs recommend somewhere like `Start()`.
- **Reading silence during an async load as a failure.** The docs wrote "defers
  play requests". It isn't dropped, it's late.
- **Ignoring the `Max Virtual Voices` warning.** The docs say it must exceed the
  voices played, or warnings appear in the console.
- **Calling `PlayClipAtPoint` at per-frame rates.** It makes an audio source per
  call. The docs give no remedy for this spot.

## Summary

- The clipping's account of the difference is **right.** `Play` cuts off and
  restarts, and `PlayOneShot` "does not cancel clips that are already being
  played".
- What was missing is that difference's consequence. The docs **group `Play`,
  `Pause` and `Stop` as the trio for "a single audio clip"** and put
  `PlayOneShot` outside it as "multiple sounds". The third option
  **`PlayClipAtPoint`** is on the same lines.
- **Assigning to `clip` alone stops the previous clip.** But "the new clip
  doesn't automatically play". Stopping and starting are different actions.
- `Play`'s "sounds like it is re-started" carries a **condition** — "If
  AudioSource.clip is set to the same clip that is playing".
- **What `Stop` stops is "the currently set Audio clip"**, `PlayOneShot` isn't
  in its reference list, and `isVirtual` counts "main sound" and "one-shots"
  separately. Stitch the three and you get "`Stop` doesn't stop a one-shot",
  but **I found no single sentence saying that.**
- **And yet `isPlaying` is true for one-shots** — "This includes if you use
  PlayOneShot()". You can know whether sound is playing and can't choose what
  to stop. It's false while paused and true while `PlayDelayed` waits.
- **`PlayOneShot`'s second argument is a volume scale**, negatives clamp to
  zero, and above one might clip. Safer as a handle for turning down.
- **Independent playback has a ceiling.** Sounds outside the N loudest get
  culled, and N is a project setting. An important sound played quietly gets
  buried first.
- Spacing belongs to **`PlayDelayed` (seconds) and `PlayScheduled` (`dspTime`,
  frame-rate independent, 100-200ms lead)**, not `WaitForSeconds`.
  `Play(delay)` is deprecated.
- **The cost of the three functions sits before the call.** With
  `Preload Audio Data` off, the docs **name `Play` and `PlayOneShot`
  explicitly** to warn about "playback delays on larger files", and give
  `LoadAudioData` and `UnloadAudioData` as the remedy. That function is a
  **synchronous load by default**, so they recommend somewhere like `Start()`.
- Turn on `Load In Background` and **play requests get deferred** — not
  dropped. The state reads through `AudioClip.loadState`.
- On the voice side, **`Max Real Voices` is "At every frame, the loudest voice
  is picked"**, and a `Max Virtual Voices` below the voices played produces
  **console warnings**. `Virtualize Effect` turns off effects on culled
  sources.
- **`PlayClipAtPoint` makes an audio source per call.** Convenient, with a
  creation and destruction piling up per call. The docs give no remedy here, so
  recommending that you cycle sources is my own judgement.

---

### References

- [AudioSource — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.html)
- [AudioSource.Play — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.Play.html)
- [AudioSource.PlayOneShot — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.PlayOneShot.html)
- [AudioSource.PlayClipAtPoint — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.PlayClipAtPoint.html)
- [AudioSource.PlayDelayed — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.PlayDelayed.html)
- [AudioSource.PlayScheduled — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.PlayScheduled.html)
- [AudioSource.Stop — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource.Stop.html)
- [AudioSource.clip — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource-clip.html)
- [AudioSource.isPlaying — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource-isPlaying.html)
- [AudioSource.isVirtual — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioSource-isVirtual.html)
- [AudioClip.LoadAudioData — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioClip.LoadAudioData.html)
- [AudioClip.loadState — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/AudioClip-loadState.html)
- [Audio Clip Import Settings reference — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AudioClip.html)
- [Audio settings reference — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/class-AudioManager.html)

The starting point for this post was
[유니티(Unity) 오디오 소스(AudioSource) 플레이 함수 Play()와 PlayOneShot() 차이](https://learnandcreate.tistory.com/2641)
(디지털콘텐츠크리에이터, 2024-10-15), in Korean. I followed its account of the
difference between the two functions as written and checked each item against
the current Unity 6.6 scripting reference. The `Stop`, `isPlaying`, `isVirtual`
and scheduled-playback sides, which aren't in the original, came from the same
reference, and the loading and voice-budget sides from the manual. Checked on
2026-10-13.
