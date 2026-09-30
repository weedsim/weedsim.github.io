---
pubDatetime: 2026-09-30T18:30:00+09:00
title: "Unmuting Puts a dB Value Where a Linear One Belongs"
lang: en
translationKey: unity-audiomixer-volume
featured: false
draft: false
tags:
  - Unity
  - C#
  - Sound
  - Math
description: "The reason for using an AudioMixer and the explanation of the log conversion are both accurate. But the unmute code feeds a dB value into a linear slot, so instead of restoring the volume it writes NaN or -Infinity."
---

I clipped this while building a settings screen and looking for **something
other than controlling each `AudioSource` by hand.** It's a 2024 write-up of
building master/BGM/SFX sliders with an `AudioMixer` — starting from why you
shouldn't touch `AudioSource.volume` one at a time, through creating the mixer
and exposing parameters, to the log conversion.

**The problem statement is accurate.**

> Implementing it that way means you'd have to adjust **the Volume of every
> Audio Source in the game.** And master volume isn't adjusted together with
> the BGM and SFX levels — it has to be adjusted independently.

A fair diagnosis, and `AudioMixer` is the right answer to it. The advice to set
the slider's `Min Value` to 0.0001, and the reason given, are correct too.

What snags is the code. **Unmuting doesn't bring the volume back.** It reads in
dB when saving, and feeds that value into a linear slot when restoring.

## Table of Contents

## The Log Conversion Explanation Is Accurate

Start with what's right. The clipping gives the reason for the slider minimum:

> At this point, you have to **set the slider's Min Value to 0.0001.**

> The audio mixer is composed of **-80dB to 0dB**, so you do **log(value) \* 20.**

The formula is right. Amplitude converts to decibels as `dB = 20 × log₁₀(amplitude)`,
which maps like this:

| Slider value | `Mathf.Log10(v) * 20` |
|---|---|
| 1.0 | 0 dB |
| 0.5 | about -6.0 dB |
| 0.1 | -20 dB |
| 0.0001 | **-80 dB** |
| 0 | **-Infinity** |

**That last row is why `Min Value` can't be 0.** `Mathf.Log10(0)` is
`-Infinity`, and feeding that to the mixer leaves the valid range. 0.0001 lands
exactly on -80 dB, so the bottom of the slider meets the bottom of the mixer.
**Working that calculation out is this post's strongest part.**

One correction: **the causality is stated backwards.** It isn't "because the
range is -80 to 0, you do log × 20." **`20 × log₁₀` is the amplitude-to-dB
conversion**, and 0.0001–1 happens to land on -80–0 when you put it through.
Flip the order and the next section explains itself.

## 0 dB Is a Boundary, Not a Ceiling

The clipping puts the range at "-80dB to 0dB", but the mixer's actual range is
wider. From the AudioGroup Inspector page in Unity's manual:

> **Attenuation can be applied to –80dB (silence) and gain can be applied to
> +20dB.**

The example range in `AudioMixer.SetFloat`'s documentation matches.

> **-80f to 20f**

**The top is +20, not 0.** So what is 0 dB? **The boundary between attenuation
and gain.** Put amplitude 1.0 into `dB = 20 × log₁₀(amplitude)` and you get
exactly 0. So 0 dB is **the point where the signal passes through unchanged**;
below it you're reducing, above it you're boosting.

| dB | Amplitude factor | Meaning |
|---|---|---|
| +20 | 10x | Gain ceiling |
| 0 | 1x | **Unchanged (boundary)** |
| -6 | about 0.5x | Attenuation |
| -80 | 0.0001x | **Silence (floor)** |

One conclusion follows. **If you don't want amplification, capping at 0 dB is
correct.** In linear terms, the slider's maximum is 1.0.

**The clipping's setup already does that.** With a 0.0001–1 slider and a
`20 × log₁₀` conversion, the reachable range falls on -80–0. That isn't luck —
it's **the right default for a volume slider.** Let it go past 1 and a source
that's already loud can clip (the distortion you get when the waveform is cut
off).

**But that's a choice, not the mixer's limit.** When a source was recorded
quietly and "even at max it's too soft," the +20 dB of gain is still there. What
you need then isn't a wider slider — it's **a different conversion**: map the
slider's 0–1 linearly onto -80–+20, or keep 1.0 at 0 dB and map above it
separately. Either way, **you first decide where 0 dB sits.**

## Unmuting Doesn't Bring the Volume Back

The code in question:

```csharp
public void SetAudioVolume(EAudioMixerType audioMixerType, float volume)
{
    // 오디오 믹서의 값은 -80 ~ 0까지이기 때문에 0.0001 ~ 1의 Log10 * 20을 한다.
    audioMixer.SetFloat(audioMixerType.ToString(), Mathf.Log10(volume) * 20);
}

public void SetAudioMute(EAudioMixerType audioMixerType)
{
    int type = (int)audioMixerType;
    if (!isMute[type]) // 뮤트
    {
        isMute[type] = true;
        audioMixer.GetFloat(audioMixerType.ToString(), out float curVolume);
        audioVolumes[type] = curVolume;
        SetAudioVolume(audioMixerType, 0.001f);
    }
    else
    {
        isMute[type] = false;
        SetAudioVolume(audioMixerType,  audioVolumes[type] );
    }
}
```

**Follow the units.**

- `SetAudioVolume`'s `volume` parameter is **linear (0.0001–1).** Inside, it
  converts to dB with `Log10 × 20`.
- What `GetFloat` returns is **already dB.** It's the mixer parameter's own
  value.
- And unmuting feeds **that dB value straight into `SetAudioVolume`'s linear
  slot.**

Splitting it into two cases:

| Volume before muting | Value stored | On unmute | Result |
|---|---|---|---|
| 0 dB (max) | `0` | `Mathf.Log10(0) * 20` | **`-Infinity`** |
| 0.5 (≈ -6 dB) | `-6.02` | `Mathf.Log10(-6.02) * 20` | **`NaN`** |

**Neither is a volume.** At full volume you get `-Infinity` and it stays silent;
at anything reduced you get the log of a negative number, so `NaN`.

Muting works and unmuting doesn't, so it reads as **"the mute button only goes
one way."** The cause isn't the mixer — it's **the unit changing twice inside
one function.**

There are two fixes.

- **Store the linear value.** Remember the `volume` you last passed and there's
  only one conversion. This is the simpler one.
- **Convert dB back to linear.** `Mathf.Pow(10f, dB / 20f)` is the inverse. Take
  this one if you want to keep using `GetFloat`.

## Mute Is -80 dB, Not -60 dB

Another line in the same function.

```csharp
SetAudioVolume(audioMixerType, 0.001f);
```

`Mathf.Log10(0.001) * 20` is **-60 dB**. But the slider's `Min Value` was set to
0.0001, which is **-80 dB**.

Silence is the -80 dB end. The manual sentence quoted above puts **"(silence)"
in parentheses next to –80dB.** Killing the sound in the mixer means writing
that value.

**So the mute button is louder than dragging the slider to the bottom.** A 20 dB
difference is 10x in amplitude. In a quiet scene you'll hear it. Changing one
value to `0.0001f` makes the two agree.

You might want to write `SetAudioVolume(type, 0f)`, but that doesn't work. As the
earlier table shows, `Log10(0)` is `-Infinity`. **Silence in the mixer is -80 dB,
not 0** — 0.0001 in linear terms. In a value that passes through a logarithm,
there is no "exactly zero."

## Call It Where the Docs Forbid and It Fails Silently

`AudioMixer.SetFloat`'s documentation carries three notes the code doesn't show.

> **Returns false if the exposed parameter was not found or snapshots are
> currently being edited.**

**There's a return value.** The clipping's code throws it away. So if the name in
Exposed Parameters and `EAudioMixerType.ToString()` differ by one character,
**nothing happens and no error appears.** Rename the enum and it breaks quietly.

> **Should not be called in `Awake()`, `OnEnable()`, or
> `RuntimeInitializeLoadType.AfterSceneLoad`**; use `Start()` instead.

**That timing restriction is in the docs.** The clipping's `AudioManager` only
assigns `Instance` in `Awake`, which is fine in itself — but **the code that
applies a saved volume at startup** usually goes in `Awake` or `OnEnable`. Call
it there and it fails, and the symptom is "the setting saved, but the volume is
back to default when I relaunch."

> Once you call this function, **mixer snapshots will no longer control the
> exposed parameter**, and you can only modify the parameter using
> `AudioMixer.SetFloat`.

Worth knowing on a project that does audio staging with snapshots. A parameter
you've called `SetFloat` on once **leaves the snapshots' hands.**

The `GetFloat` documentation, for completeness:

> **Returns false if the exposed parameter specified doesn't exist.**

> If `SetFloat` hasn't been called or `ClearFloat` was used, it reflects **the
> current snapshot or transition value.**

## Where and Why You'd Use It

Use an `AudioMixer` when you need **volume applied once per group.** As the
clipping diagnoses, walking every `AudioSource` doesn't hold up as the count
grows, and it can't express the "applied on top of the other adjustments"
structure that master volume needs.

### The Fixed AudioManager

Change units in exactly one place, check the return value, and avoid the spot
the docs forbid.

```csharp
using UnityEngine;
using UnityEngine.Audio;

public enum AudioChannel
{
    Master,
    BGM,
    SFX,
}

/// <summary>
/// Handles the AudioMixer's exposed parameters as linear volumes (0.0001-1).
/// The dB conversion happens only inside this class.
/// </summary>
public class AudioManager : MonoBehaviour
{
    /// <summary>The mixer floor. Mathf.Log10(MIN_VOLUME) * 20 == -80dB.</summary>
    private const float MIN_VOLUME = 0.0001f;
    private const float MAX_VOLUME = 1f;

    [Header("Mixer")]
    [SerializeField, Tooltip("The mixer exposing Master / BGM / SFX parameters")]
    private AudioMixer _audioMixer;

    // Kept as linear values. Storing dB means converting twice on the way back.
    private readonly float[] _volumes = { MAX_VOLUME, MAX_VOLUME, MAX_VOLUME };
    private readonly bool[] _muted = new bool[3];

    private void Start()
    {
        // Docs: don't call SetFloat in Awake / OnEnable. Apply in Start.
        for (int i = 0; i < _volumes.Length; i++)
        {
            Apply((AudioChannel)i);
        }
    }

    /// <summary>Hook to a slider's OnValueChanged. volume is 0.0001-1.</summary>
    public void SetVolume(AudioChannel channel, float volume)
    {
        _volumes[(int)channel] = Mathf.Clamp(volume, MIN_VOLUME, MAX_VOLUME);
        _muted[(int)channel] = false;

        Apply(channel);
    }

    /// <summary>Mute toggle. Hook to a button's OnClick.</summary>
    public void ToggleMute(AudioChannel channel)
    {
        _muted[(int)channel] = !_muted[(int)channel];

        Apply(channel);
    }

    public float GetVolume(AudioChannel channel) => _volumes[(int)channel];

    public bool IsMuted(AudioChannel channel) => _muted[(int)channel];

    private void Apply(AudioChannel channel)
    {
        int index = (int)channel;

        // Mute is the floor value. Same -80dB as the bottom of the slider.
        float linear = _muted[index] ? MIN_VOLUME : _volumes[index];

        // The unit conversion is this one line. dB = 20 * log10(amplitude).
        float decibel = Mathf.Log10(linear) * 20f;

        // Docs: false if the parameter isn't found or snapshots are being edited. Don't discard it.
        if (!_audioMixer.SetFloat(channel.ToString(), decibel))
        {
            Debug.LogError(
                $"The '{channel}' parameter isn't exposed on the mixer. " +
                "Match the name in Exposed Parameters to the enum name.");
        }
    }
}
```

What changed:

- **Storage is linear.** Nothing reads dB via `GetFloat` to keep around, so no
  inverse conversion is needed. Unmuting becomes simply reapplying the last
  value.
- **Mute uses `MIN_VOLUME`.** The same -80 dB as the bottom of the slider.
- **`SetFloat`'s return value is checked.** A name mismatch shows up in the
  console.
- **Applied in `Start`.** The docs forbid `Awake` and `OnEnable`.
- **There's only one conversion.** Removing the place where units mix is the
  point of this rewrite.

### Where the Saved Volume Gets Applied

Settings usually have to survive a relaunch. Where to save them is covered in
[the PlayerPrefs post](/posts/playerprefs-storage-path/), whose example happened
to be `Audio.MasterVolume`. If that post was about **where it's stored**, the
split here is **what to store.**

**The value you store has to be linear (0–1).** Store dB and every read has to
establish which unit it's in — which is exactly the confusion this post's bug
came out of.

```csharp
using UnityEngine;

public class AudioSettingsLoader : MonoBehaviour
{
    private const string MASTER_KEY = "Audio.Master";
    private const float DEFAULT_VOLUME = 0.8f;

    [SerializeField] private AudioManager _audioManager;

    private void Start()
    {
        // Start, not Awake. SetFloat fails in Awake.
        // Omit the default argument and you get 0, which becomes -Infinity.
        float master = PlayerPrefs.GetFloat(MASTER_KEY, DEFAULT_VOLUME);

        _audioManager.SetVolume(AudioChannel.Master, master);
    }

    /// <summary>Call at a boundary, such as closing the settings screen.</summary>
    public void Save()
    {
        PlayerPrefs.SetFloat(MASTER_KEY, _audioManager.GetVolume(AudioChannel.Master));
        PlayerPrefs.Save();
    }
}
```

**Omit `PlayerPrefs.GetFloat`'s default argument and you get 0.** Then
`Mathf.Log10(0)` gives `-Infinity`, and the symptom is "no sound on first
launch." The `Clamp` guards against it, but passing the default states the
intent.

### Where Not to Use It

- **Feeding a dB read from `GetFloat` into a linear slot.** That's this post's
  subject. You get `NaN` or `-Infinity`.
- **Using `0f` as the mute value.** `Log10(0)` is `-Infinity`. The floor is
  0.0001.
- **Letting mute and the slider bottom differ.** 0.001 and 0.0001 are 20 dB
  apart.
- **Calling `SetFloat` in `Awake` or `OnEnable`.** The docs forbid it.
- **Discarding `SetFloat`'s return value.** A name mismatch does nothing,
  silently.
- **Walking every `AudioSource.volume`.** The clipping's diagnosis is right.
- **Calling `SetFloat` on a parameter you also stage with snapshots.** One call
  and the snapshots let go of it.

## Wrapping Up

- **The problem statement and the log conversion are accurate.** It even nails
  why `Min Value` should be 0.0001 (`Log10(0)` is `-Infinity`).
- But **the causality is stated backwards.** `20 × log₁₀` is the amplitude-to-dB
  conversion; 0.0001–1 landing on -80–0 is the consequence.
- **0 dB is a boundary, not a ceiling.** In the manual's words, **"attenuation
  can be applied to –80dB (silence) and gain can be applied to +20dB"**, and
  0 dB is amplitude 1x — unchanged. **If you don't want amplification, capping
  at 0 dB (slider 1.0) is correct**, and the clipping already does that.
- **Unmuting feeds a dB value into a linear slot.** At full volume that's
  `-Infinity`; at anything reduced it's **`NaN`**. The volume never comes back.
- **The mute value is -60 dB.** Silence is the **-80 dB** the manual marks in
  parentheses, and that's also where the slider bottoms out. 20 dB is 10x in
  amplitude. `0.0001f` makes them agree.
- **`SetFloat` can return `false`** — parameter not found, or snapshots being
  edited. The code discards it.
- **The docs say not to call it in `Awake` or `OnEnable`.** The code that
  applies a saved volume at startup runs into this.
- **One `SetFloat` call and snapshots stop controlling that parameter.**

Bugs where units mix survive a long time because nothing throws. This code is no
different — **muting works fine**, so half of it looks correct. Where the value
turns into `NaN` isn't visible until you log it, and **collecting the conversion
into one place means that place never exists.**

---

### References

- [AudioMixer.SetFloat — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Audio.AudioMixer.SetFloat.html)
- [AudioMixer.GetFloat — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Audio.AudioMixer.GetFloat.html)
- [AudioMixer overview — Unity Manual](https://docs.unity3d.com/Manual/AudioMixerOverview.html)
- [AudioGroup Inspector — Unity Manual](https://docs.unity3d.com/Manual/AudioMixerInspectors.html)
- [Mathf.Log10 — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Mathf.Log10.html)

The starting point for this post was [Deff_a — \[Unity/C#\] AudioMixer를 이용한 볼륨 조절](https://deff-dev.tistory.com/147)
(2024-06-26). I followed its mixer setup steps and log-conversion explanation as
written, then checked the sample code's flow of units and the contracts of
`SetFloat` and `GetFloat` against the current Scripting Reference. Quotes from
it are my translations; the Korean comment in the sample is the author's.
