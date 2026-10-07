---
pubDatetime: 2026-10-07T17:40:00+09:00
title: "It Recommends Snapshots, and Its Code Takes Them Away"
lang: en
translationKey: audiomixer-groups-snapshots
featured: false
draft: false
tags:
  - Unity
  - C#
  - Sound
  - UI
description: "A 2023 write-up of the Audio Mixer setup procedure. It lists snapshots as a reason to use the mixer, and the code right after permanently takes those three parameters out of snapshot control. The docs say so in one line."
---

I clipped this **while continuing to look into AudioMixer after writing
[the earlier post](/posts/unity-audiomixer-volume/).** That post covered the log
conversion, the dB range and the `SetFloat` / `GetFloat` contracts — but **how to
compose the mixer** wasn't part of it.

This 2023 post is that side. It walks **the procedure for building a mixer in the
editor** screen by screen — adding groups, `Expose`, setting the Audio Source's
`Output`, wiring the sliders. If the earlier post was about **units of value**,
this one is about **procedure and structure.** I'll note where they overlap and
move on, because there's a separate set of snags.

The clipping gives three reasons to use a mixer. The third:

> **동적 오디오 변경:** **스냅샷**과 노출된 매개변수를 사용하여 다양한 Audio Mix
> 설정 간에 부드러운 전환을 생성하고 …
>
> (Dynamic audio changes: using **snapshots** and exposed parameters you can
> create smooth transitions between different Audio Mix settings …)

And the code four sections later:

```csharp
m_AudioMixer.SetFloat("Master", Mathf.Log10(volume) * 20);
```

There's a line in the first paragraph of the `SetFloat` docs.

> Once you call this function, **mixer snapshots will no longer control the
> exposed parameter**, and you can only modify the parameter using
> AudioMixer.SetFloat.

**It recommends snapshots, then hands you code that takes those three parameters
out of them.**

## Table of contents

## It Recommends Snapshots, and Its Code Takes Them Away

The order matters. The docs' sentence isn't conditional — it's **"Once you call
this function."** Call it once and that parameter doesn't come back.

So following the clipping's setup as-is gives this:

| Moment | What holds Master / BGM / SFX volume |
| --- | --- |
| Right after the scene starts | The mixer's snapshots |
| After the slider moves once | **`SetFloat` only** |

**Moving a slider one notch ends the snapshot feature for those three values.**
If you'd built a duck-the-BGM-on-combat-entry effect as a snapshot, it stops
working once the player has opened and closed the settings window. No error, no
log.

`ClearFloat` on the same class is the route back. But **its page writes only one
line.**

> Resets an exposed parameter to **its initial value**.

That snapshot control returns **isn't on that page.** The grounds are next door,
in the `GetFloat` sentence quoted in the earlier post.

> `SetFloat`이 호출되지 않았거나 **`ClearFloat`이 쓰인 경우**, 현재 스냅샷 또는
> 전환 중인 값을 반영한다.
>
> (If `SetFloat` hasn't been called, or **`ClearFloat` has been used**, it
> reflects the current snapshot or the transitioning value.)

If a value read after `ClearFloat` reflects "the current snapshot or the
transitioning value," then control has gone back to the snapshot — **a conclusion
that follows from joining two sentences**, not something either page states
directly. Which is why I'd recommend **splitting the parameters** over a design
that leans on reverting.

**Using both means drawing a boundary.** Three ways:

| Approach | Parameters snapshots touch | Parameters sliders touch |
| --- | --- | --- |
| Don't mix | — | Master / BGM / SFX |
| Split the parameters | A dedicated combat-ducking parameter | Master / BGM / SFX |
| Hand over | Only during the effect | Only otherwise (returned via `ClearFloat`) |

The safest is **the second.** Expose the user-facing volume parameters and the
effect parameters under different names from the start and there's no place for
`SetFloat` to collide with a snapshot. The snapshot transition itself is
`AudioMixerSnapshot.TransitionTo`.

> Performs an interpolated transition towards this snapshot over the time
> interval specified.

That's the function behind the clipping's "smooth transitions," and `timeToReach`
is that time. **The feature the post introduces and the code the post gives are
fighting over the same parameters** — that's the point of this section.

## Master and BGM Both Apply

The clipping's group layout:

> \[+\] 버튼을 눌러서 그룹을 추가해 주면 됩니다. 이때 **Master 자식으로 그룹이
> 분류되며** BGM그룹, SFX그룹으로 나누어 줍니다.
>
> (Press the \[+\] button to add groups. They are **classified as children of
> Master**, and you split them into a BGM group and an SFX group.)

A correct description. And the manual states what that structure produces.

> **All sounds route into the Master group.** The Master group contains
> categories for music, menu sounds, and all application sounds.

> With the exception of sends and returns, the Audio Mixer contains groups that
> accept any number of input signals, mix those signals, and produce **exactly
> one output**.

Where attenuation applies is written down too.

> The **Attenuation** (volume setting) is done here for an AudioGroup. The
> Attenuation can be applied anywhere in the effect stack.

**Join the three sentences and the conclusion falls out.** The signal that the
BGM group's attenuation was applied to enters Master, and Master's attenuation is
applied **once more.** Every group has attenuation and exactly one output, so a
signal crossing the chain passes through two attenuations in sequence.

dB is a logarithmic unit, so **the product reads as a sum.**

| Master | BGM | Attenuation BGM actually gets | Amplitude |
| --- | --- | --- | --- |
| 0 dB | 0 dB | 0 dB | ×1 |
| −6 dB | 0 dB | −6 dB | about ×0.5 |
| 0 dB | −6 dB | −6 dB | about ×0.5 |
| −6 dB | −6 dB | **−12 dB** | about ×0.25 |
| −40 dB | −40 dB | **−80 dB** | silent |

**The last row is where this bites.** Both sliders are pulled down to about the
middle and nothing is audible. Each is "half" and the sum is the floor.

The docs don't write "attenuation accumulates" as a sentence. The conclusion
above **comes out of the routing description**, which is why I laid the grounds
out as three quotes.

### Three Sliders That Don't Know About Each Other

The clipping's three handlers are independent.

```csharp
public void SetMasterVolume(float volume)
{
    m_AudioMixer.SetFloat("Master", Mathf.Log10(volume) * 20);
}

public void SetMusicVolume(float volume)
{
    m_AudioMixer.SetFloat("BGM", Mathf.Log10(volume) * 20);
}
```

Each writes only its own parameter. Structurally correct code, and **the mixer
does the summing.** The problem is the expectation on the UI side. A user reads
three sliders as **three independent values**, while what they hear is the **sum**
of Master and the rest.

Using Master as an "overall multiplier" means the UI has to show that property.
Two shapes used in practice:

- **Pin Master at 0 dB and don't expose it.** Give the user BGM and SFX only. The
  place where summing happens disappears.
- **Keep Master's range narrow.** −20 to 0 dB, for instance. Dropping it to the
  bottom won't drag the other sliders down to silence.

Both amount to "don't let the Master slider go down to 0.0001."

## `Min Value` 0.001 Puts the Floor at −60 dB

The last instruction about the slider setup:

> 슬라이드 세팅까지 다했으면 마지막으로 슬라이더 **MinValue을 0.001**로
> 해줍니다.
>
> (Once the slider setup is done, finally set the slider's **MinValue to
> 0.001**.)

The judgment that `Min Value` mustn't be 0 is right. `Mathf.Log10(0)` is
`-Infinity`. But **the number is off by one digit.**

| `Min Value` | `Mathf.Log10(v) * 20` | In the mixer |
| --- | --- | --- |
| 0.001 | **−60 dB** | faintly audible |
| 0.0001 | **−80 dB** | silent (the floor) |

[The earlier post](/posts/unity-audiomixer-volume/) dealt with the same number.
There the problem was **a mute button putting 0.001 in**; here it's **the slider's
floor being 0.001.** The symptom inverts — that one was "mute is louder than the
bottom of the slider," this one is **"dragging the slider all the way down doesn't
turn it off."**

A 20 dB difference is ten times in amplitude. In a quiet scene it's audible. A
user who wants BGM fully off drags the slider to the bottom and the music is still
there.

Set it to `0.0001` and the floor lines up with the mixer's floor. The clipping's
conversion formula stays as-is — **this is one digit to fix.**

## Assigning `slider.value` in Code Steps Into the Forbidden Window

The clipping's wiring:

```csharp
private void Awake()
{
    m_MusicMasterSlider.onValueChanged.AddListener(SetMasterVolume);
    m_MusicBGMSlider.onValueChanged.AddListener(SetMusicVolume);
    m_MusicSFXSlider.onValueChanged.AddListener(SetSFXVolume);
}
```

Doing `AddListener` in `Awake` isn't itself a problem. What snags is **the code
usually added next** — the line that restores the saved volume to the slider.

```csharp
// The natural-looking next line
m_MusicBGMSlider.value = PlayerPrefs.GetFloat("BGM", 1f);
```

`Slider` has one method set apart.

> **SetValueWithoutNotify** — Set the value of the slider **without invoking
> onValueChanged callback.**

**That this method exists means assigning `value` does call the callback.** So the
line above calls `SetMusicVolume`, and inside it `SetFloat` is called. **Inside
`Awake`.**

That's the place the `SetFloat` docs forbid.

> `MonoBehaviour.Awake`, `MonoBehaviour.OnEnable`,
> `RuntimeInitializeLoadType.AfterSceneLoad`

> Instead, invoke this method in `MonoBehaviour.Start` or any event function
> Unity calls afterwards

And the docs put the outcome this way — **"can result in unexpected
behavior."**

The symptom is easy to pin. **The setting saves, and the volume is back to
default when you restart the game.** `SetFloat` fails quietly and nobody looks at
the return value. The earlier post flagged code that discards that return value;
**on this path that return value is the only clue.**

There are two fixes.

| Fix | Effect |
| --- | --- |
| Move initialization to `Start` | Leaves the forbidden window |
| Use `SetValueWithoutNotify` | The callback doesn't run, so `SetFloat` isn't called |

**Using both is right.** In `Start`, set the slider with `SetValueWithoutNotify`
and call `SetFloat` on the mixer separately, once. Trying to do both through the
callback tangles the order.

The missing `RemoveListener` to pair with `AddListener` is worth noting too. If
the settings panel lives as long as the scene it won't bite in practice, but with
a panel that toggles on and off, registrations accumulate. Why registration and
teardown go in pairs is in
[the post on registering events with Action](/posts/csharp-action-events/).
`UnityEvent` has the same property, and the comparison with wiring it in the
Inspector is in [the post on InputField](/posts/ugui-inputfield-name-entry/).

## The Performance Claim Isn't Backed by the Docs

The second reason to use a mixer:

> **효율적인 리소스 관리:** 유사한 Audio Source를 Audio 그룹으로 그룹화하여
> 볼륨을 제어하고 효과를 적용하고 전체적으로 조정할 수 있습니다. **Audio
> Source개별적으로 처리하는 성능 오버헤드를 줄입니다.**
>
> (Efficient resource management: grouping similar Audio Sources into an Audio
> group lets you control volume, apply effects and adjust them as a whole. **It
> reduces the performance overhead of processing Audio Sources individually.**)

The first sentence is right. Grouping to adjust as a whole is what a mixer is for.
**I couldn't find grounds for the second sentence in the docs.**

The mixer overview page has no sentence about CPU or `AudioSource` processing
cost. If anything, the Audio Profiler docs put **mixing itself on the cost side.**

> **DSP CPU** — the amount of CPU your project uses by **mixing**, audio
> effects, and decompression of non-streamed sounds …

**Mixing is written down as an item that uses DSP CPU.** Adding a group adds a
node for the signal to pass through; it doesn't reduce the number of
`AudioSource`s making sound.

Restated accurately: **applying an effect once on a group is cheaper than applying
it per source.** Reverb on ten sources runs ten times; on the group it runs once.
That's the saving grouping gives, and **it's a different statement from the
processing of the sources themselves going down.**

| Claim | Holds? |
| --- | --- |
| Groups let you adjust volume and effects at once | Correct |
| An effect on a group is cheaper than one per source | Holds. But it isn't the sentence the clipping wrote |
| `AudioSource` per-source processing overhead goes down | **No grounds in the docs** |

To actually see audio cost, read DSP CPU and Streaming CPU in the Profiler's Audio
module. Going through the optimization doc is in
[the post on Unity's code optimization doc](/posts/unity-code-optimization/).

## Items That Checked Out

The procedure description is almost entirely right.

| The clipping's claim | Verified |
| --- | --- |
| Create via `[Create] - [Audio Mixer]`; only Master exists at first | Correct |
| Groups added with `[+]` become children of Master | Correct. The manual: "All sounds route into the Master group" |
| Right-click Attenuation's Volume and `Expose` it | Correct |
| Rename the Exposed Parameters before using them | Correct. That name is `SetFloat`'s first argument |
| Set the group on the Audio Source's `Output` | Correct |
| The slider's `Min Value` mustn't be 0 | Correct. `Log10(0)` is `-Infinity` |

**Calling out the step of renaming the exposed parameter is good.** The default
name isn't human-readable, and that string becomes `SetFloat`'s key verbatim. As
the earlier post showed, one character off and `SetFloat` returns `false` and
nothing happens.

> Returns false if the exposed parameter was not found or snapshots are
> currently being edited.

**That two failures are mixed into that return value is worth reading too.** Name
not found, and **snapshots currently being edited.** The latter can bite when you
play with the mixer window left open in the editor.

## Where and Why You'd Use It

### One settings panel

The shape with all four points applied. Saving goes to `PlayerPrefs`,
initialization to `Start`, and the slider is set without notifying.

```csharp
using UnityEngine;
using UnityEngine.Audio;
using UnityEngine.UI;

public class AudioSettingsPanel : MonoBehaviour
{
    private const float MIN_LINEAR = 0.0001f;   // -80 dB, the mixer's floor
    private const float MAX_LINEAR = 1f;        //   0 dB
    private const float DEFAULT_LINEAR = 1f;

    private const string KEY_BGM = "volume.bgm";
    private const string KEY_SFX = "volume.sfx";

    [Header("Mixer")]
    [SerializeField, Tooltip("The mixer holding the exposed parameters")]
    private AudioMixer _mixer;

    [Header("Sliders")]
    [SerializeField, Tooltip("BGM slider. Min Value is 0.0001")]
    private Slider _bgmSlider;

    [SerializeField, Tooltip("SFX slider. Min Value is 0.0001")]
    private Slider _sfxSlider;

    // Start, not Awake. SetFloat is forbidden in Awake.
    private void Start()
    {
        float bgm = PlayerPrefs.GetFloat(KEY_BGM, DEFAULT_LINEAR);
        float sfx = PlayerPrefs.GetFloat(KEY_SFX, DEFAULT_LINEAR);

        // Set the sliders without notifying. A callback would call SetFloat twice.
        _bgmSlider.SetValueWithoutNotify(Mathf.Clamp(bgm, MIN_LINEAR, MAX_LINEAR));
        _sfxSlider.SetValueWithoutNotify(Mathf.Clamp(sfx, MIN_LINEAR, MAX_LINEAR));

        // Apply to the mixer separately, once.
        Apply("BGM", bgm);
        Apply("SFX", sfx);

        _bgmSlider.onValueChanged.AddListener(OnBgmChanged);
        _sfxSlider.onValueChanged.AddListener(OnSfxChanged);
    }

    private void OnDestroy()
    {
        // Unregister as many as were registered.
        if (_bgmSlider != null)
        {
            _bgmSlider.onValueChanged.RemoveListener(OnBgmChanged);
        }

        if (_sfxSlider != null)
        {
            _sfxSlider.onValueChanged.RemoveListener(OnSfxChanged);
        }
    }

    private void OnBgmChanged(float linear)
    {
        Apply("BGM", linear);
        PlayerPrefs.SetFloat(KEY_BGM, linear);
    }

    private void OnSfxChanged(float linear)
    {
        Apply("SFX", linear);
        PlayerPrefs.SetFloat(KEY_SFX, linear);
    }

    private void Apply(string parameterName, float linear)
    {
        float clamped = Mathf.Clamp(linear, MIN_LINEAR, MAX_LINEAR);
        float decibels = Mathf.Log10(clamped) * 20f;

        // Check the return. A wrong name shows up only here.
        if (!_mixer.SetFloat(parameterName, decibels))
        {
            Debug.LogWarning($"exposed parameter '{parameterName}' not found", this);
        }
    }
}
```

**There's no Master slider.** Because of the summing above, Master stays at 0 dB
in the mixer and isn't exposed. What the user adjusts is BGM and SFX.

`Mathf.Clamp` runs again inside `Apply` because a saved value may fall outside the
slider's range — if you change the slider's `Min Value` later, or a value saved by
another build comes in. Where `PlayerPrefs` keeps values is in
[the post on its storage path](/posts/playerprefs-storage-path/).

### Using it alongside snapshots

Expose a separate parameter for the effect. It doesn't collide with user volume.

```csharp
using UnityEngine;
using UnityEngine.Audio;

public class CombatAudioMood : MonoBehaviour
{
    private const float TRANSITION_SECONDS = 0.5f;

    [Header("Snapshots")]
    [SerializeField, Tooltip("Normal snapshot")]
    private AudioMixerSnapshot _normal;

    [SerializeField, Tooltip("In-combat snapshot. Ducks the BGM")]
    private AudioMixerSnapshot _combat;

    public void EnterCombat()
    {
        // Don't touch the user volume parameters. Snapshots move separate ones.
        if (_combat == null)
        {
            return;
        }

        _combat.TransitionTo(TRANSITION_SECONDS);
    }

    public void ExitCombat()
    {
        if (_normal == null)
        {
            return;
        }

        _normal.TransitionTo(TRANSITION_SECONDS);
    }
}
```

**Separating the parameters snapshots move from the ones sliders move, from the
start**, is this code's premise. Aim both at the same parameter and the snapshot
lets go the moment `SetFloat` is called once.

### Where Not to Use It

- **Calling `SetFloat` on a parameter meant for snapshots.** Once is enough.
  Rather than leaning on `ClearFloat`, split the parameters.
- **Setting the slider's `Min Value` to 0.001.** The floor is −60 dB. Silence is
  0.0001, that is −80 dB.
- **Setting the slider's `Min Value` to 0.** `Log10(0)` is `-Infinity`.
- **Assigning the saved value to the slider in `Awake`.** The callback runs and
  `SetFloat` gets called in the forbidden window. Move it to `Start` and use
  `SetValueWithoutNotify`.
- **Opening Master to the bottom as a user slider.** It sums with the child
  group's attenuation, producing a range where both are mid and the result is
  silent.
- **Discarding `SetFloat`'s return value.** Both a name typo and snapshots being
  edited come back as a quiet failure.
- **Reading grouping as reducing `AudioSource` processing cost.** No grounds in
  the docs. What's saved is the **effects** you'd otherwise apply per source.

## Wrapping Up

- **The code the post gives blocks the feature the post recommends.** The
  `SetFloat` docs say that once you call the function, snapshots no longer control
  the exposed parameter. Moving a slider one notch takes the three parameters out
  of snapshots.
- **`ClearFloat` is the route back but the docs don't go that far.** Its page
  stops at "resets to its initial value"; the snapshot return is a conclusion
  joined with the `GetFloat` docs. So exposing user volume and effect parameters
  **under different names from the start** is better.
- **Master's and the child group's attenuations apply in sequence.** Join "All
  sounds route into the Master group" with "every group has attenuation and
  exactly one output" and that's the result. −40 dB over −40 dB is −80 dB, which
  is silence.
- **So it's safer not to open Master as a user slider.** Pin it at 0 dB and give
  only BGM and SFX.
- **`Min Value` 0.001 is −60 dB.** One digit puts the slider's floor short of
  silence. 0.0001 is −80 dB.
- **Assigning `slider.value` calls `onValueChanged`.** That
  `SetValueWithoutNotify` exists separately is the evidence. Assign in `Awake` and
  `SetFloat` gets called in the window the docs forbid.
- **The performance claim isn't backed by the docs.** The mixer overview has no
  CPU sentence, and the Audio Profiler docs list **mixing as a DSP CPU item.**
  What's saved is the effects you'd apply per source.
- **The procedure description is almost entirely right.** Calling out the renaming
  of exposed parameters is particularly good. That string is `SetFloat`'s key.

---

### References

- [Introduction to the Audio Mixer — Unity Manual](https://docs.unity3d.com/Manual/AudioMixerOverview.html) ·
  [AudioGroup Inspector](https://docs.unity3d.com/Manual/AudioMixerInspectors.html)
- [AudioMixer.SetFloat — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Audio.AudioMixer.SetFloat.html) ·
  [AudioMixer.GetFloat](https://docs.unity3d.com/ScriptReference/Audio.AudioMixer.GetFloat.html) ·
  [AudioMixer.ClearFloat](https://docs.unity3d.com/ScriptReference/Audio.AudioMixer.ClearFloat.html)
- [AudioMixerSnapshot.TransitionTo — Unity Scripting Reference](https://docs.unity3d.com/6000.2/Documentation/ScriptReference/Audio.AudioMixerSnapshot.TransitionTo.html)
- [Slider — UGUI API reference](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/api/UnityEngine.UI.Slider.html)
- [Audio Profiler module — Unity Manual](https://docs.unity3d.com/Manual/ProfilerAudio.html)
- [Mathf.Log10 — Unity Scripting Reference](https://docs.unity3d.com/ScriptReference/Mathf.Log10.html)

The starting point for this post was
[VR하는소년 — 유니티 Audio Mixer 사용방법](https://wlsdn629.tistory.com/entry/unity-audio-mixer-guide)
(2023-06-14). Units of value and the `SetFloat` / `GetFloat` contracts were
covered in [the earlier post](/posts/unity-audiomixer-volume/); this one
cross-checked **procedure and group structure** against both the current manual
and the Scripting Reference. The check date is 2026-10-07.
