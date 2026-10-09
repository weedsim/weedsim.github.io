---
pubDatetime: 2026-10-09T21:00:00+09:00
title: "Resolution and Aspect Ratio Hold the Quality, Not Color Format"
lang: en
translationKey: video-player-raw-image
featured: false
draft: false
tags:
  - Unity
  - C#
  - UI
  - UGUI
  - Video
  - Rendering
description: "I was planning cutscenes as video playback when I clipped a post on putting video in the UI. The procedure is right, but it blames Color Format for the quality and never once says how to know the video ended. What the docs list as the knobs are resolution and Aspect Ratio, and there's a mode that skips the Render Texture entirely."
---

**I planned the cutscenes as video playback** instead of staging them live,
and while looking for how that works I clipped a post on putting a video into
the UI. The procedure is short and clear — make a `RawImage`, make a
`Video Player`, make a `Render Texture`, and point both at the same render
texture. The video player draws into the render texture and the `RawImage`
draws the render texture. It's a 2022 post and it still works as written.

Settings notes are attached at the end, and one sentence in them names a cause.

> The colorFormat that's set by default gives really bad quality.

Just before it there's this one too.

> It may be from the size changing, but mostly Color Format is the problem.

**The odds are written backwards.** I couldn't find what the default Color
Format of a `Render Texture` is in the manual, nor any statement that it's bad
for quality. The "problem that comes from the size changing", on the other
hand, **has a setting of its own with six values.** It's `Aspect Ratio`.

And one layer down, **there's a mode that skips the render texture
entirely.** Take that road and size, format and Aspect Ratio never come up.

Read it as a cutscene plan and there's one more gap. **It never once says how
to know the video ended.** A cutscene's purpose isn't to play, it's to end and
hand control back. That event is in the docs.

I verified seven things. **`Render Mode` has an `API Only` value and you can
use `VideoPlayer.texture` directly**, **the knobs for quality and ratio are
`Aspect Ratio` and the source resolution**, **format support isn't something
you look up, it's something you ask at runtime**, **the first-frame problem has
`Wait For First Frame` and `Prepare()`**, **the end and the failure have
`loopPointReached` and `errorReceived`**, **the audio output mode is never
mentioned once**, and **a URL source bypasses asset management.**

This blog has two sound posts.
[Unmuting Puts a dB Value Where a Linear One Belongs](/en/posts/unity-audiomixer-volume/)
and [It Recommends Snapshots, and Its Code Takes Them Away](/en/posts/audiomixer-groups-snapshots/).
The audio section here meshes with those two — video sound can **bypass
Unity's audio processing entirely with one setting.** I'm not deferring to
another post, though. The explanation and the example code you need are all
here again.

Checked on **2026-10-09**, against Unity **6.6**.

## Table of contents

## The reason for going through a Render Texture is to write no code

The original explains why a render texture is needed like this.

> Since the video player can't present itself in the UI, you project the video
> onto a render texture and then draw that render texture in the UI.

As a description of the structure, that's correct. But **"can't present
itself" doesn't mean there's only one option.** `Render Mode` has a
description and five values.

> Choose how the video will render.

| Value | What the docs say |
| --- | --- |
| Camera Far Plane | "Render the video on the Camera's far plane." |
| Camera Near Plane | "Render the video on the Camera's near plane." |
| Render Texture | "Render the video into a Render Texture" |
| Material Override | "Render the video into a selected Texture property of a GameObject" |
| API Only | "Render the video into the VideoPlayer.texture Scripting API property." |

That last value is this post's starting point. `API Only` creates no render
texture asset and **hands you the texture the player already has.** Here's
what that texture's page says.

> Internal texture in which video content is placed. (Read Only)

What a `RawImage` takes is a `Texture`. So joining the two takes one line —
`rawImage.texture = player.texture`. No render texture asset, no size setting,
no Color Format. This same trick of plugging a texture into a `RawImage` shows
up in
[IsConnected Is Looking at Connecting](/en/posts/unity-webrtc-video-streaming/)
too. There the source is the network rather than a file.

So why does the original use a render texture? **Because it writes no code at
all.** In `Render Texture` mode you drop an asset into `Target Texture` in the
Inspector and you're done.

> Define the Render Texture where the Video Player component renders its
> images.

Then you drop the same asset into the `RawImage`'s Texture field. No script.
It's clear why introductory material takes this road.

The price is clear too. **A fixed-size, fixed-format buffer gets wedged in the
middle.** If the source video is 1920×1080 and the render texture is the
default 256×256, resampling happens in between. That's the next section.

| | `Render Texture` mode | `API Only` mode |
| --- | --- | --- |
| Code | none | one line |
| Intermediate buffer | a render texture asset | none |
| What decides the size | what I type into the asset | the source resolution |
| Color Format | I choose it | never asked |
| Aspect Ratio | applies | never comes up |

## The quality knobs are Aspect Ratio and resolution

For the symptom the original pins on Color Format — quality dropping and the
ratio going wrong — the setting the docs list is `Aspect Ratio`.

> Set the aspect ratio of the images that fill the Camera Near Plane, Camera
> Far Plane, or Render Texture

**The render texture is in the list of things it applies to.** There are six
values; four preserve the ratio and one doesn't.

| Value | What the docs say | Ratio |
| --- | --- | --- |
| No Scaling | "Use no scaling. The video is centered on the destination rectangle." | — |
| Fit Vertically | "This option crops the left and right sides or leaves black areas on each side if necessary." | "The source aspect ratio is preserved." |
| Fit Horizontally | "This option crops the top and bottom regions or leaves black areas above and below if needed." | "The source aspect ratio is preserved." |
| Fit Inside | "Leaves black areas on the left and right or above and below as needed." | "The source aspect ratio is preserved." |
| Fit Outside | "Scale the source to fit the destination rectangle without leaving black areas on the left and right" | "The source aspect ratio is preserved." |
| Stretch | "Scale both horizontally or vertically to fit the destination rectangle." | **"The source aspect ratio isn't preserved."** |

Put a 16:9 video into a square 256×256 render texture and this setting decides
the result. `Stretch` squashes it, `Fit Inside` puts black bars above and
below, `Fit Outside` crops the sides. **A good share of what gets felt as "bad
quality" comes from here.**

The size side is simpler. You can read the source's resolution from code.

> The width of the images in the VideoClip, or URL, in pixels. (Read Only)

> The height of the images in the VideoClip, or URL, in pixels. (Read Only)

`VideoPlayer.width` and `height`. **Build the render texture from those values
after preparation finishes and the resampling disappears.** There's no reason
to type numbers into the Inspector by hand.

So what about Color Format? All the reference page says is this.

> Set the GraphicsFormat of the color buffer of the Render Texture.

**It doesn't say what the default is, or what the quality of that default is
like.** There's no mention of sRGB or Read/Write on that page either. So for
the original's "the default colorFormat gives really bad quality", **I found no
grounds in the docs to call it wrong, and none to call it right.** What I can
say is this — **what the docs list as the knobs are resolution and
`Aspect Ratio`, and Color Format isn't on that list.** Putting them in that
order is the right call.

## Format support isn't something you look up, it's something you ask

The original's last piece of advice is this.

> Look up which formats mobile supports before using them, and if you're not
> confident, just use the default even if you lose some quality.

The point that supported formats differ per platform is correct. But **it's
not "look it up and use it", you can ask at runtime.** That API exists.

> public static bool IsFormatSupported([GraphicsFormat] format,
> [GraphicsFormatUsage] usage);

> Verifies that the specified graphics format is supported for the specified
> usage.

> bool Returns true if the format is supported for the specific usage. Returns
> false otherwise.

It's `SystemInfo.IsFormatSupported`. You pass the format and the **usage**.
The reason it takes a usage is in the description.

> If a specific usage is not supported by a format, the operation will fail.

It means the same format can be samplable and still not work as a render
target. So the question to ask isn't "is this format supported" but "is this
format supported **for this usage**".

And going `API Only` makes the question itself disappear. There's no buffer I
create, so there's no format for me to choose.

## The first-frame problem has a setting of its own

The original describes `Play On Awake` like this, then offers an alternative.

> Play the video when the Scene launches.

That's the docs' description, and the original's is the same content. Then it
recommends clearing the checkbox and playing from a script.

> In that case you clear the checkbox when you want the video to play only on
> a click, through a script.

The use case is right. But there's a trap on that road, and the docs have a
setting for it.

> Wait for the first frame of the source video to be ready for display before
> playback starts.

It's `Wait For First Frame`. Without it, the first frame may not be ready at
the moment playback starts, so the render texture can show **its previous
contents or a blank screen**. And you can do the preparing ahead of time.

> Prepares the playback engine so that it's ready for playback.

> Returns whether the VideoPlayer has successfully prepared the content to be
> played.

> The VideoPlayer invokes this event when the video is ready for playback.

That's `Prepare()`, `isPrepared` and `prepareCompleted`. If you want playback
to start the instant the click lands, **calling `Prepare()` while you wait for
the click** is the means the docs give you.

Going `API Only` makes this less of a choice and more of a requirement. Plug
in a `VideoPlayer.texture` from before preparation finishes and there's
nothing in it to receive. **Plugging it in from `prepareCompleted` is the safe
order.**

And if you're going to pick `API Only`, there's a line in `Stop()` you have to
know.

> Stops the playback and sets the current time to 0.

> This also destroys all internal resources such as textures or buffered
> content.

**`Stop()` destroys the texture.** The very texture you plugged into
`RawImage.texture`. So to play again after `Stop()`, you have to go through
`Prepare()` and **plug the texture back in.** In a UI that stops and restarts
repeatedly, this one line is the cause of "nothing shows up from the second
play on". Make restarting always follow the same path — `Stop()` →
`Prepare()` → reassign in `prepareCompleted` → `Play()`.

For reference, `Play On Awake` defaults to on. A comment in the scripting
reference's example says so.

## For a cutscene the important half is the end and the failure

The settings notes the original attaches at the end are all about **starting
playback**. For a cutscene the end matters more. The moment the video ends you
have to hand control back or bring up the next scene, and if you never get
that signal the player sits looking at a frozen screen.

The scripting reference's events table has six entries.

| Event | What the docs say |
| --- | --- |
| prepareCompleted | "The VideoPlayer invokes this event when the video is ready for playback." |
| started | "The VideoPlayer emits this event when the video starts to play." |
| frameReady | "The VideoPlayer invokes this event when a new frame is ready to be displayed." |
| loopPointReached | "The VideoPlayer emits this event when the video reaches the end of its playback." |
| seekCompleted | "Invoke after a seek operation completes." |
| errorReceived | "The VideoPlayer uses this callback to report various types of errors." |

A cutscene uses the fourth and the sixth.

### The end

`loopPointReached`'s description is four sentences. Look at the first three.

> The VideoPlayer emits this event when the video reaches the end of its
> playback.

> If you set the VideoPlayer.isLooping property to true, this event makes the
> video play again.

> Otherwise the VideoPlayer stops.

**The same event means different things depending on `isLooping`.** On, it's a
"rewinding" signal; off, it's an "ended" signal. For a cutscene you have to
turn `Loop` off for this event to mean the end. The fourth sentence points at
that field.

> You can also set the Loop property in the Inspector window of the VideoPlayer
> component.

The field's own description says the same thing.

> Clear it to stop playing the video when it reaches the end.

The handler's shape is exactly as the example writes it.

> void OnLoopPointReached(VideoPlayer vp)

The argument coming in is described as "The instance of the VideoPlayer that
invokes the event." **Which player ended is what arrives.** If several
cutscenes share one handler, that argument is how you tell them apart.

Now put "Otherwise the VideoPlayer stops." next to the `Stop()` docs from the
previous section and something catches. `Stop()` was "This also destroys all
internal resources such as textures or buffered content." **Whether stopping
by reaching the end is the same thing as calling `Stop()` is something the
docs don't say.** Stitch the two sentences together and you get "the last
frame may not stay on screen" — but that's **my inference, and I didn't verify
it.** What I verified is one thing — the fact that it ended arrives through
`loopPointReached`, and **deciding what the screen holds afterwards inside that
event is what keeps you off the inference.** Fade-out or next-scene load, it
starts there.

### The failure

Knowing the end isn't enough. There's the case where **it doesn't end**. The
docs list five things `errorReceived` reports.

> The types of errors the VideoPlayer reports include:

- "HTTP connection problems."
- "Issues finding the file."
- "Unsupported file types."
- "Permission issues."
- "Runtime issues."

The second one meshes directly with the URL source section further down. Pick
a road that "bypasses asset management" and failing to find the file really
does happen. The event's description reads like this.

> The VideoPlayer uses this callback to report various types of errors.

The use the docs recommend is written down too.

> This is useful if you want to log errors and debug so that it's easier to
> diagnose issues.

The handler takes two arguments.

> void OnErrorReceived(VideoPlayer vp, string message)

The second one is described as "The error message (string) the VideoPlayer
reports." The subscription line is on the page verbatim as well.

> videoPlayer.errorReceived += OnErrorReceived;

There's one thing **the docs don't say** here. Whether playback continues
after an error, and whether `loopPointReached` still arrives, isn't on that
page. I didn't verify it. So **don't hang a cutscene's end on
`loopPointReached` alone.** If it stops on an error and that event never
comes, the code that moves on never runs. **Two exits that converge on the
same place** is the safe shape.

### When playback drifts behind the clock

Beyond the end and the failure there's one more. The playback position drifting
away from the game clock. There's a setting of its own.

> When you enable this option, and the Video Player component detects drift
> between the playback position and the game clock,

> the Video Player skips ahead.

> When you disable this option, the Video Player doesn't correct for drift and
> systematically plays all frames.

It's `Skip On Drop`. Enabled, it **throws frames away to keep the clock**;
disabled, it **plays every frame and gives up the clock.** A cutscene with
recorded dialogue or next-scene timing riding on it wants the former; a video
where every frame has to be seen wants the latter.

But before assigning this value from a script there's another field to look at.

> Whether frame-skipping to maintain synchronization can be controlled. (Read
> Only)

It's `canSetSkipOnDrop`. **It reads as meaning that whether you can change the
setting at all depends on the situation** — what it depends on isn't written
down, and I didn't verify it. So the code looks at this field first. There's a
field of the same shape on the playback speed side.

> Whether you can change the playback speed. (Read Only)

That's `canSetPlaybackSpeed`. If you're adding a cheat or a debug feature that
runs cutscenes fast, ask in the same order on that side too.

## Audio is never mentioned once

The original explains `Play On Awake`, `Loop` and `Source`, then moves on. If
the video has sound, the field you hit right after those is missing.

> Define how the source's audio tracks are output.

It's `Audio Output Mode`, and the component reference lists three values.

| Value | What the docs say |
| --- | --- |
| None | "Audio isn't played." |
| Audio Source | "Audio samples are sent to selected audio sources, enabling Unity's audio processing to be applied." |
| Direct | "Audio samples are sent directly to the audio output hardware, bypassing Unity's audio processing." |

**`Direct` bypasses Unity's audio processing.** That one line has large
consequences. In a project that routes BGM and SFX volume through an
`AudioMixer`, video sound going out `Direct` **doesn't pass through that
mixer.** That's where the symptom of a settings-screen volume slider not
affecting the video comes from.

The scripting reference's `VideoAudioOutputMode` has **four**. On top of the
three above there's `APIOnly`, described as "Send the embedded audio to the
associated AudioSampleProvider." It's not in the Inspector, so it's a
code-only road.

Pick `Audio Source` and it takes the mixer road, exactly as "enabling Unity's
audio processing to be applied" says. That's the side you want if you're
putting subtitles and volume control on a cutscene. The unit `AudioMixer`
volume is handled in, and the trap in it, is written up in
[Unmuting Puts a dB Value Where a Linear One Belongs](/en/posts/unity-audiomixer-volume/).

## A URL source bypasses asset management

The original's `Source` description is this.

> If you choose URL, you write the address where the video lives, and it
> searches that location and fetches the video.

Correct. The docs say there are two roads too.

> The Video Player can play video sources from video clips or URLs.

> Reference your file as a URL to play files that aren't bundled with your
> application.

But the warning attached to that choice isn't in the original.

> As the URL option bypasses asset management, you must manually ensure that
> Unity is able to locate the source video.

**It bypasses asset management, so making the file findable is my job.** If you
want the video in the build and read by URL, there's a designated place.

> You can set the URL to use files placed in Unity's StreamingAssets folder

That's `StreamingAssets`, and you get the path from
`Application.streamingAssetsPath`. The per-platform constraints are written
down as well.

> On native build platforms, you can set the URL to any file path

> the URL must point to a web URL because playback from the local file system

The second one is **WebGL**. Local file system playback doesn't work, so it has
to be a web URL. That's the road where something that ran fine with `file://`
in the editor fails only in a WebGL build.

There's a line on the clip side too. Because video files are large, it says
they can be handled as "addressable assets" or in an AssetBundle. Drop several
cutscenes into the build wholesale and the package grows by that much.

## Where and why you'd use it

### A working example

This is the `API Only` shape, plugged into a `RawImage`. Compared with the
original's structure, the render texture asset goes away and one script
appears.

```csharp file="Scripts/UI/VideoScreen.cs"
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;
using UnityEngine.Video;

[RequireComponent(typeof(VideoPlayer))]
public class VideoScreen : MonoBehaviour
{
    [Header("References")]
    [Tooltip("The RawImage that draws the video")]
    [SerializeField]
    private RawImage _screen;

    [Tooltip("Used only when Audio Output Mode is Audio Source")]
    [SerializeField]
    private AudioSource _audioSource;

    [Header("Playback")]
    [Tooltip("On, plays the moment preparation finishes")]
    [SerializeField]
    private bool _playWhenReady = true;

    [Header("When the cutscene is over")]
    [Tooltip("Called once, whether it played to the end or stopped on an error")]
    [SerializeField]
    private UnityEvent _onFinished;

    private VideoPlayer _player;
    private bool _finished;

    private void Awake()
    {
        if (!TryGetComponent(out _player))
        {
            Debug.LogError("There is no VideoPlayer.", this);
            return;
        }

        // No render texture asset. Take the player's texture directly.
        _player.renderMode = VideoRenderMode.APIOnly;

        // Wait for the first frame before playback starts. Keeps a blank
        // screen from flashing.
        _player.waitForFirstFrame = true;

        // A cutscene runs once. With isLooping on, loopPointReached signals
        // "going round again" rather than "ended".
        _player.isLooping = false;

        // Throw frames away to keep up with the game clock. But ask whether
        // the value can be changed first — canSetSkipOnDrop is read only.
        if (_player.canSetSkipOnDrop)
        {
            _player.skipOnDrop = true;
        }

        // Direct output doesn't pass through the AudioMixer. Leave it in
        // AudioSource mode if you're using a mixer.
        if (_audioSource != null)
        {
            _player.audioOutputMode = VideoAudioOutputMode.AudioSource;
            _player.SetTargetAudioSource(0, _audioSource);
        }

        _player.playOnAwake = false;
        _player.prepareCompleted += HandlePrepareCompleted;
        _player.loopPointReached += HandleLoopPointReached;
        _player.errorReceived += HandleErrorReceived;
    }

    private void OnDestroy()
    {
        if (_player != null)
        {
            _player.prepareCompleted -= HandlePrepareCompleted;
            _player.loopPointReached -= HandleLoopPointReached;
            _player.errorReceived -= HandleErrorReceived;
        }
    }

    private void OnEnable()
    {
        // Prepare ahead while waiting for the click.
        if (_player != null && !_player.isPrepared)
        {
            _player.Prepare();
        }
    }

    // Plug in texture after preparation finishes. Before that there is
    // nothing in it to receive.
    private void HandlePrepareCompleted(VideoPlayer source)
    {
        if (_screen != null)
        {
            _screen.texture = source.texture;
        }

        Debug.Log($"source {source.width}x{source.height}, " +
                  $"{source.length:F1}s, {source.frameCount} frames", this);

        if (_playWhenReady)
        {
            source.Play();
        }
    }

    // The exit for having played to the end.
    private void HandleLoopPointReached(VideoPlayer source)
    {
        Finish("played to the end");
    }

    // The exit for having failed. Without this road the game stalls in the
    // cutscene.
    private void HandleErrorReceived(VideoPlayer source, string message)
    {
        Debug.LogError($"VideoPlayer error: {message}", this);
        Finish("error");
    }

    // Both exits converge here. Hand off exactly once.
    private void Finish(string reason)
    {
        if (_finished)
        {
            return;
        }

        _finished = true;
        Debug.Log($"cutscene over ({reason})", this);
        _onFinished?.Invoke();
    }

    // Called from a button. Stop() destroys the texture, so prepare again and
    // take the road that reassigns it to the RawImage in prepareCompleted.
    public void PlayFromStart()
    {
        if (_player == null)
        {
            return;
        }

        _finished = false;
        _player.Stop();
        _player.Prepare();
    }
}
```

There's a reason `_screen`, `_audioSource` and `_player` don't use `?.`. They
are all `UnityEngine.Object`, and a reference left empty in the Inspector can
end up in a state that **looks like null but isn't C#'s null**. So they use
`== null` / `!= null` comparisons. For a plain C# object, `?.` is correct. That
is why `_onFinished` is the only one with `?.` — `UnityEvent` isn't a
`UnityEngine.Object`.

The `Debug.Log` line printing the source resolution is there on purpose. **If
you're going to use a render texture, that number is the size you have to
make.** The difference between leaving 256×256 alone and matching it to this
number is the resampling from the earlier section.

The reason `_onFinished` is a `UnityEvent` is clear enough too. **What happens
after the end differs per cutscene** — load the next scene, re-enable input,
run a fade; you wire it in the Inspector. What matters is that the place is
**one** place. Let the end and the failure go to different places and the next
step goes missing only in the cutscenes that failed.

### How to choose

| Situation | What to use |
| --- | --- |
| One video in the UI, no code | `Render Texture` mode + `RawImage` |
| Video in the UI, without losing quality | `API Only` + `RawImage.texture` |
| A skip button or subtitles over the cutscene | `RawImage` inside the Canvas (`API Only`) |
| Just the cutscene, nothing layered on it | `Camera Near Plane` + `Alpha` |
| Cutscene as a backdrop you play in front of | `Camera Far Plane` |
| Move on when the cutscene ends | both `loopPointReached` and `errorReceived` |
| The cutscene runs once | `Loop` off (on, the end signal is a rewind signal) |
| Playback drifts behind the game clock | `Skip On Drop` (check `canSetSkipOnDrop` first) |
| Play on a 3D object's surface | `Material Override` |
| Route the sound through a mixer | `Audio Output Mode` = `Audio Source` |
| Just send the sound out | `Direct` (doesn't pass through the mixer) |
| Put the video in the build | `Video Clip` or `StreamingAssets` + URL |
| Video outside the build | URL (finding the file is on me) |
| WebGL | web URL only (no local file system playback) |

Which road you put a cutscene on comes down to **what you're going to layer on
top of it**. The camera plane descriptions are all written against Scene
objects — in front ("the video plays in front of the objects in your Scene") or
behind ("the video plays in the background of the Scene"). **Whether a Canvas's
UI is in front of or behind that plane isn't on that page, and I didn't verify
it.** Bring it in as a `RawImage`, on the other hand, and the video becomes one
element of the Canvas hierarchy, so a skip button and subtitles just stack as
sibling elements. **If something has to overlap, bringing it inside the Canvas
means never having to work out that ordering.** And `Alpha` is camera-plane
only — "This property is available only when Render Mode is Camera Far Plane or
Camera Near Plane."

Here's how to judge whether to use a render texture.

- **If you plan to write no script at all**, a render texture is the only
  road. In that case, **match the size to the source resolution and set
  `Aspect Ratio` explicitly.** Leave both at their defaults and quality and
  ratio go wrong at the same time.
- **If you can write one line of script**, `API Only` is simpler. No
  intermediate buffer, and size, format and ratio never come up.
- **Either way, using `prepareCompleted` is safer.** With `API Only`
  especially, `texture` is empty before preparation.
- **For a cutscene, always take the end.** Both `loopPointReached` and
  `errorReceived`. Hang it on one and a failure never moves you on.

### Where not to use it

- **Suspecting Color Format first for a quality problem.** What the docs list
  as the knobs are resolution and `Aspect Ratio`. I found no statement that
  the default Color Format is bad.
- **Leaving the render texture at 256×256 and putting a 1080p video in it.**
  The source resolution is readable from `VideoPlayer.width`/`height`.
- **Trying to settle mobile format support by searching.** Pass the format and
  the usage to `SystemInfo.IsFormatSupported` and ask.
- **Leaving `Direct` as-is in a project that routes volume through an
  `AudioMixer`.** The docs wrote "bypassing Unity's audio processing". The
  slider stops working for the video only.
- **Plugging `VideoPlayer.texture` into a `RawImage` before preparation.**
  There's nothing in it to receive. Wait for `prepareCompleted`.
- **Not plugging the texture back in after `Stop()`.** The docs wrote "This
  also destroys all internal resources such as textures". The screen looks
  empty from the second play on.
- **Hanging a cutscene's end on `loopPointReached` alone.** Whether that event
  still arrives after stopping on an error isn't written down. Gather
  `errorReceived` into the same place.
- **Leaving `Loop` on for a cutscene.** Then `loopPointReached` signals "going
  round again", not "ended". The docs wrote "this event makes the video play
  again."
- **Assigning `skipOnDrop` straight away.** `canSetSkipOnDrop` sits there
  separately as "(Read Only)". Ask whether it can be changed first.
- **Using a URL source without checking the file's location per platform.** It
  "bypasses asset management", and WebGL can't play from the local file system.

## Summary

- `Render Mode` has **five** values, and one of them, `API Only`, is "Render
  the video into the VideoPlayer.texture Scripting API property." Plug that
  texture straight into a `RawImage` and **you need no render texture asset.**
- The reason the original uses a render texture is **that it writes no code at
  all**. The price is the fixed-size, fixed-format buffer wedged in the middle.
- The knobs for quality and ratio are **`Aspect Ratio`** (six values, four
  preserve the ratio, `Stretch` is "The source aspect ratio isn't preserved.")
  and the **source resolution** (`VideoPlayer.width`/`height`).
- **I found no statement in the docs that the default Color Format is bad.** I
  won't call it right or wrong. But that field isn't on the list of knobs the
  docs wrote down.
- Format support is asked with **`SystemInfo.IsFormatSupported(format,
  usage)`**. Why the usage has to go with it is in "If a specific usage is not
  supported by a format, the operation will fail."
- The first-frame problem has **`Wait For First Frame`**, and for preparing
  ahead there's **`Prepare()`, `isPrepared` and `prepareCompleted`**. With
  `API Only` it's close to mandatory.
- **`Audio Output Mode` isn't in the original.** `Direct` is "bypassing
  Unity's audio processing", so it doesn't pass through the `AudioMixer`. Use
  `Audio Source` if you want the mixer. The Inspector has three values; the
  enum has four, including `APIOnly`.
- **`Stop()` "destroys all internal resources such as textures"**. The texture
  you plugged into a `RawImage` under `API Only` disappears at that moment.
  Reassign it through `Prepare()` when you play again.
- The fact a cutscene **ended arrives through `loopPointReached`**. What it
  means splits on `isLooping` — off, it's "Otherwise the VideoPlayer stops.";
  on, it's "this event makes the video play again."
- **`errorReceived` reports five things**, one of which is "Issues finding the
  file." Hang the end on `loopPointReached` alone and the next step never comes
  in a cutscene that failed. Whether that event arrives after an error isn't in
  the docs.
- **`Skip On Drop` throws frames away to keep the clock.** Look at
  `canSetSkipOnDrop` before assigning it from a script.
- **A URL source "bypasses asset management"**. To put it in the build use
  `StreamingAssets`; WebGL takes web URLs only.

---

### References

- [Video Player component reference — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/class-VideoPlayer.html)
- [Use video sources — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/video-sources-reference.html)
- [Render Texture asset reference — Unity 6.6 Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/class-RenderTexture.html)
- [VideoPlayer — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Video.VideoPlayer.html)
- [VideoRenderMode — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Video.VideoRenderMode.html)
- [VideoAudioOutputMode — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Video.VideoAudioOutputMode.html)
- [VideoPlayer.Stop — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Video.VideoPlayer.Stop.html)
- [VideoPlayer.loopPointReached — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Video.VideoPlayer-loopPointReached.html)
- [VideoPlayer.errorReceived — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Video.VideoPlayer-errorReceived.html)
- [SystemInfo.IsFormatSupported — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/SystemInfo.IsFormatSupported.html)

The starting point for this post was
[\[유니티\] 비디오플레이어로 UI에서 동영상 재생하기](https://coding-of-today.tistory.com/174)
(TODAYCODE, 2022-01-06), in Korean; the quotes from it are my translations. I
followed its procedure and settings notes as written and checked each item
against both the current Unity 6.6 manual and the scripting reference. The end
and failure side, which isn't in the original, came from the scripting
reference's events table. Checked on 2026-10-09.
