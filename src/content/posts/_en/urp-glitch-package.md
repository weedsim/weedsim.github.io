---
pubDatetime: 2026-09-14T16:00:00+09:00
title: "Three Forks Later, an Official Version Appeared"
lang: en
translationKey: urp-glitch-package
featured: false
draft: false
tags:
  - Unity
  - URP
  - Rendering
  - Shader
  - Glitch
  - Graphics
description: "I saved the README of a URP glitch effect package. Open that repository now and it carries a notice that the author has stopped updating it, pointing at keijiro's official URP version."
---

Looking for how to add a glitch effect to a game project as a piece of staging,
I saved the [README](https://github.com/saimarei/URPGlitch) of
`saimarei/URPGlitch`, a glitch effect package for URP. Three installation
methods plus the renderer feature and volume setup order — a document you can
follow straight through.

Open that repository today and **there's a notice at the top of the README.**

> I have moved on to using the **Godot engine** and will no longer be updating
> this repository.

It directs you to keijiro's **KinoGlitchURP** if problems come up. That sentence
wasn't there when I saved it. Checking it out, the entire lineage this package
stands on is in that state — and **an official version had appeared at the end
of it.**

## Table of contents

## A lineage of three forks

The README names its sources: based on mao-test-h's project, which was in turn
inspired by keijiro's KinoGlitch. Opening each one:

| Repository | Target | License | Current state |
| --- | --- | --- | --- |
| `keijiro/KinoGlitch` | legacy pipeline | MIT | the original |
| `mao-test-h/URPGlitch` | Unity 2021.3+ / URP 12.1.7 | MIT | **"not actively maintained"** |
| `saimarei/URPGlitch` | Unity 6000.0 | MIT | **"will no longer be updating"** |
| `keijiro/KinoGlitchURP` | Unity 6000.0+ / URP | **Unlicense** | official URP version |

**Both of the middle two state that maintenance has stopped.** mao-test-h's
README says:

> Please note that this project was implemented **for study purposes** and is
> not actively maintained.

That's why the forks chained. The original targeted the legacy pipeline,
somebody ported it to URP as a study, and this clipping's package reworked that
for Unity 6. **And in the meantime the original author shipped a URP version
himself.** That's where `saimarei/URPGlitch` now points.

## Where and why you'd use it

The package README covers installation and setup only. **When you'd reach for a
glitch effect** isn't in there, so here it is.

### When you'd use it

- **Damage and warning feedback.** Tear the screen for an instant when the
  player takes a hit. Keeping a faint one running constantly at low health is
  common too. It lands in the body faster than a UI element does.
- **Scene transitions and viewpoint changes.** Teleports, hacking, flashbacks —
  anything that reads as "the connection dropped and came back." More
  characterful than a fade.
- **Setting and tone.** Cyberpunk, horror, retro CRT. Here it isn't an event but
  **a constant, very faint layer** that builds atmosphere.

What these share is that **the intensity has to change over time.** It isn't an
effect you set once in the Inspector; mostly you shake it and let it settle from
code.

### Driving it from code

The following targets **KinoGlitchURP**, the official version. You grab the
controller component attached to the camera directly.

```csharp
using System.Collections;
using KinoGlitch;
using UnityEngine;

[RequireComponent(typeof(Camera))]
public class GlitchFeedback : MonoBehaviour
{
    private const float MIN_INTENSITY = 0f;

    [Header("Damage Flash")]
    [SerializeField, Range(0f, 1f), Tooltip("Peak intensity at the moment of the hit")]
    private float _peakIntensity = 0.6f;

    [SerializeField, Range(0.05f, 1f), Tooltip("Seconds taken to settle back down")]
    private float _falloffSeconds = 0.35f;

    private DigitalGlitchController _digital;
    private Coroutine _running;

    private void Awake()
    {
        if (!TryGetComponent(out _digital))
        {
            _digital = gameObject.AddComponent<DigitalGlitchController>();
        }

        _digital.Intensity = MIN_INTENSITY;
    }

    public void PlayDamageFlash()
    {
        if (_running != null)
        {
            StopCoroutine(_running);
        }

        _running = StartCoroutine(FlashRoutine());
    }

    private IEnumerator FlashRoutine()
    {
        _digital.Intensity = _peakIntensity;

        float elapsed = 0f;
        while (elapsed < _falloffSeconds)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / _falloffSeconds;
            _digital.Intensity = Mathf.Lerp(_peakIntensity, MIN_INTENSITY, t);
            yield return null;
        }

        _digital.Intensity = MIN_INTENSITY;
        _running = null;
    }
}
```

The analog side has five parameters, so the combination decides its character.
For a constant layer that grows at low health:

```csharp
// Take a health ratio (0-1); the lower it goes, the more the screen breaks up
public void ApplyHealthDistortion(float healthRatio)
{
    float severity = Mathf.Clamp01(1f - healthRatio);

    _analog.ScanLineJitter    = severity * 0.35f;  // scan lines slip
    _analog.VerticalJump      = severity * 0.10f;  // the image hops vertically
    _analog.HorizontalShake   = severity * 0.15f;  // horizontal judder
    _analog.ColorDrift        = severity * 0.30f;  // colors separate
    _analog.HorizontalRipple  = severity * 0.20f;  // horizontal rippling
}
```

Raising all five at the same rate is usually too much. **`ColorDrift` and
`ScanLineJitter` carry most of the "the screen is broken" impression**, while
`VerticalJump` gets tiring on the eyes at surprisingly small values. Giving each
axis its own ceiling, as above, works better.

### What to watch for on performance

The KinoGlitchURP README has this line:

> **Digital Glitch still runs at zero Intensity** because it must keep updating
> its internal frame history. Disable the component if you want to eliminate its
> cost entirely.

**Dropping intensity to zero leaves the cost.** It has to keep holding the
previous frame. So while the coroutine above ends at zero, if you won't be using
it for a while, turn the component off.

```csharp
// Nothing coming up for a while — switch the component off
_digital.enabled = false;
```

The analog side behaves differently. The README says "Analog Glitch **skips its
pass** when all properties are set to zero." All zero and the pass is skipped.
Just know that **zero means different things for the two of them.**

## Switching changes how you drive it

Moving to the official version isn't only a package swap. **The structure for
applying the effect is different.**

| | The clipping's package | KinoGlitchURP |
| --- | --- | --- |
| Control | Global Volume + volume override | **controller component on the camera** |
| Component names | Analog/Digital Glitch Volume | `AnalogGlitchController`, `DigitalGlitchController` |
| Default injection point | After Rendering Transparents (set manually) | **after post processing** (change via `Pass Event`) |
| Installation | Git URL | **scoped registry** |

The clipping's package rides URP's volume system. You make a Global Volume in
the scene and add an override to its profile, which suits per-area values and
blending.

The official one **attaches a component to the camera.** That's why the example
code above can grab it straight with `TryGetComponent`. Skipping the volume
makes it simpler to handle from code, but whatever you got from volume blending
you now build yourself.

**Less about which is better than about your existing code not carrying over.**
Anything that dug through a volume profile with `TryGet` has to be rewritten.

## The licenses diverge

Only the last row of that lineage table differs. The original `KinoGlitch` and
its forks are **MIT**; the official URP version `KinoGlitchURP` is
**Unlicense**.

The clipping's README states its license this way:

> This project is released under the same license as
> [keijiro/KinoGlitch](https://github.com/keijiro/KinoGlitch).

A description you have to go to the original to resolve — and checking, it is
MIT, which matches what GitHub labels the repository. **Nothing contradicts.**
But writing a license as "go look at that other repository" means you won't know
if that repository later changes it. Which is effectively what happened: the same
author's new repository shipped under a different one.

For a commercial project, **which one you use changes your attribution
obligations.** MIT requires shipping the copyright notice and license text;
Unlicense is close to public domain and carries no such duty.

## The installation methods differ too

The clipping's route is a Git URL. In Package Manager, **+ → Install package
from Git URL**, or edit `manifest.json` directly.

```json
{
  "dependencies": {
    "com.subbu.urp-glitch": "https://github.com/saimarei/URPGlitch.git",
    "com.unity.collab-proxy": "2.5.2"
  }
}
```

The official one uses a scoped registry.

> Install the KinoGlitch URP package (`jp.keijiro.kino-glitch.universal`) from
> the **'Keijiro' scoped registry** in Package Manager.

The difference shows up in practice. **A Git URL doesn't pin a version.** That
line points at the repository's default branch, so if the repository changes,
restoring packages later brings different code. If the repository disappears,
restoring fails outright. **Holding a repository that has declared maintenance
over via a Git URL is a risk in itself.**

You can pin with a tag (`.git#tag`), but the scoped registry is steadier for
version management.

## What's still in the clipping

**The step where you assign the shader by hand.** From the setup instructions:

> Set the **Shader** field by selecting an appropriate shader (click the eye
> icon to reveal hidden shaders).

You have to wire a shader into the renderer feature yourself, picking from
hidden shaders revealed by the eye icon. **That's a shape where shaders go
missing from builds**, because a shader no scene material references is a
stripping candidate. When it works in the editor and not in a build, this is the
first place to look.

**VR was reverted.** The repository's commit list contains
`Revert "made texture usage to be compatible with vr"`. An attempt at VR
compatibility existed and was rolled back. If you were planning to use it in XR,
that one line is your answer.

**Old versions live in Releases.** From the top of the README:

> If you are coming from the older URP Glitch video, you need to download the
> older `2021.3.8f1+` package from the **Releases** section.

On a pre-Unity-6 project you take it from Releases, not the Git URL. Pasting the
Git URL on sight is where the compile breaks come from.

## Wrapping up

- The README I saved now carries **"I have moved on to using the Godot engine
  and will no longer be updating this repository."**
- The lineage has four entries and **both middle ones declare maintenance over.**
  mao-test-h's is "for study purposes and is not actively maintained."
- At the end of it sits the **official URP version `KinoGlitchURP`** — Unity
  6000.0+, scoped registry `jp.keijiro.kino-glitch.universal`.
- A glitch is an effect whose **intensity is shaken over time**, so driving it
  from code is the norm. Damage feedback, scene transitions and constant
  atmosphere are the three main places.
- **Digital Glitch costs something even at zero intensity**, because it keeps
  updating frame history. Turn the component off to remove it entirely. Analog
  skips its pass when everything is zero.
- **Switching changes the control structure**: volume override → camera
  controller. Code that dug through volumes has to be rewritten.
- **The licenses diverge.** The forks are MIT, the official URP version is
  Unlicense. Different attribution duties.
- Git URL installs **don't pin a version.** Holding an abandoned repository by
  its default branch is a risk in itself.

Saving a repository README is worth doing — install commands and setup order in
one place. But **a README reflects the repository's present state**, and saving
it severs that relationship. In this case, in the interval, **the author closed
his door and the original author opened one.**

So what to check first in a package clipping is settled: not the install
command, but **the top of the README and the date of the last commit.** Either
one alone decides whether to read what's below it.

There's something wry about starting out to add one piece of staging and ending
at a choice of package. Then again, a glitch is **an effect whose intensity you
keep shaking to match events**, so you're in its API constantly — which makes
whether that API stays put an actual problem. It turned out to be the kind of
thing where **who is maintaining it** weighs as much as how it looks on screen.

## References

- [saimarei/URPGlitch](https://github.com/saimarei/URPGlitch)
- [keijiro/KinoGlitchURP](https://github.com/keijiro/KinoGlitchURP)
- [mao-test-h/URPGlitch](https://github.com/mao-test-h/URPGlitch)
- [keijiro/KinoGlitch](https://github.com/keijiro/KinoGlitch)
