---
pubDatetime: 2026-09-03T17:30:00+09:00
title: "Taking Apart Cinemachine's Follow Camera: Binding Mode Isn't a Rotation Mode"
lang: en
translationKey: cinemachine-follow-camera
featured: false
draft: false
tags:
  - Unity
  - Cinemachine
  - Camera
description: "The Follow Camera used for racing and runner chase cameras, written up against Cinemachine 3. What Binding Mode actually decides, and two widely repeated misreadings — mouse input and Target Offset — corrected against the official docs."
---

I'm building a runner game. Looking for material on wiring the camera up with
Cinemachine, I ended up clipping
[this post](https://gus6615.tistory.com/114). It covers exactly the viewpoint I
wanted — the racing or Temple Run style camera that **chases a target without
taking any mouse input**.

The procedure is short: make a virtual camera, attach a target, adjust one
offset. But checking the Binding Mode explanation that follows against the
official documentation, the framing is off. **It reads Binding Mode as "how the
camera rotates," and that isn't what it is.** Carrying that misconception
around means cycling through modes without finding the shot you want, so I
rewrote around that point.

Everything here is against the **Cinemachine 3.1** documentation.

## Table of contents

## What the Follow Camera is made of

The menu path:

> GameObject > Cinemachine > Targeted Cameras > Follow Camera

That produces one `CinemachineCamera` with two behaviours attached.

- **Cinemachine Follow** — Position Control
- **Cinemachine Rotation Composer** — Rotation Control

The structure is already visible there. A Cinemachine 3 camera **separates the
module that decides position from the module that decides rotation**, and this
preset is just one pairing of the two. That's what the original calls the
"control modules."

You only need to assign `Tracking Target`. The official wording:

> The CinemachineCamera automatically positions the Unity camera relative to
> this GameObject at all times, and rotates the camera to look at the
> GameObject.

The original's setup is likewise two things: drop the character's camera root
object into `Tracking Target`, and set `Cinemachine Follow`'s `Follow Offset`
Z to `-3`. The default offset is `(0, 0, -10)`, placing the camera 10 metres
behind the target; this pulls it in to 3.

And one caution the original adds still holds. **If you have a virtual camera
from earlier, turn it off.** Cinemachine picks one camera by priority among
the active ones, so leaving the old one on can mean the new one never takes
over.

## Binding Mode isn't a rotation mode

The original introduces Binding Mode as "the mode for how it tracks," then
describes each option in terms of rotation and mouse input. That's where it
goes off.

The official definition is one sentence.

> The binding mode defines the coordinate space Unity uses to interpret the
> camera offset from the target and to apply the damping.

So what Binding Mode decides is **which coordinate space `Follow Offset` is
interpreted in**. Whether the camera "rotates" is a consequence of that choice,
not something the mode specifies directly.

Seen that way, the six modes line up on a single axis: **how much of the
target's rotation you take.**

| Binding Mode | Space the offset is read in | Official definition |
| --- | --- | --- |
| Lock To Target | The target's full local frame | "When the target rotates, the camera rotates with it to maintain the offset and to maintain the same view of the target." |
| Lock To Target No Roll | Target local, roll removed | "Makes the CinemachineCamera use the local frame of the Follow target, with roll set to 0." |
| Lock To Target With World Up | Target local, yaw only | "This binding mode ignores all target rotations except yaw." |
| Lock To Target On Assign | A snapshot of the target frame at assignment | "This offset remains constant in world space." |
| World Space | World coordinates | "The camera will not change position when the target rotates." |
| Lazy Follow | Camera local | "This mode emulates the action a human camera operator would take when instructed to follow a target." |

Top to bottom, less and less of the target's rotation is reflected.
`Lock To Target` rolls the camera when the target rolls; `World Space` keeps
the camera's position put no matter how the target spins.

The original describes `Lock To Target On Assign` as "moves toward the target
but doesn't rotate." More precisely, it **takes one snapshot of the target's
orientation at assignment or activation and pins that offset in world space.**
It doesn't ignore rotation — it uses it exactly once.

`Lazy Follow` is likewise described as "a delayed response is added," but it
isn't simply a delay. It's a distinct mode that interprets the offset and
damping in **camera-local space**, which is why the camera keeps its distance
and height while following regardless of which way the target faces. Hence the
description about emulating a human camera operator.

### No Binding Mode rotates on mouse input

For `Lock To Target With World Up`, `Lock To Target No Roll` and
`Lock To Target`, the original states that the camera "rotates via mouse
input." **That doesn't hold.** Whatever the Binding Mode,
`Cinemachine Follow` does not read input.

Cinemachine handles input at an entirely different layer. The official
wording:

> Cinemachine cameras don't directly process user input. Instead, they expose
> axes that are meant to be *driven*, either by script, animation, or by user
> input.

To turn the camera with a mouse you use a component that **exposes input
axes** — `Cinemachine Orbital Follow`, `Cinemachine Pan Tilt` and the like —
and attach a `Cinemachine Input Axis Controller` to drive them. The Follow +
Rotation Composer pairing has no such axes.

Which means the original's condition 3 — **"is unaffected by mouse input"** —
isn't achieved by picking the right Binding Mode. It's satisfied from the start
because **this preset has no input path at all**. The flip side being that if
you later want mouse control, you have to change components, not settings.

### Which mode for a runner or a racer

Sorted by purpose:

- **Runner (Temple Run style)** — if the character turns at corners,
  `Lock To Target With World Up`, which follows the target's yaw, is close to
  the default choice. If instead the lateral movement is lane-changing
  translation rather than rotation, `World Space` (camera doesn't turn when the
  target does) or `Lazy Follow` (holds distance and height) is cleaner. **Follow
  yaw when you only have lane movement** and the screen sways every time the
  character tilts slightly, which is nauseating.
- **Racing** — the camera should turn with the car through corners, so
  `Lock To Target With World Up` is the starting point here too. Use
  `Lock To Target`, which also follows roll, and the screen flips with the car
  when it tips or rolls over.
- **Violently rotating targets** — look at `Rotation Damping` before changing
  modes. The camera whipping around when the target snaps is better solved with
  damping than with a different mode.

For a runner, the Rotation Composer side matters too. With the character pinned
dead centre you can't see what's ahead, so a common combination is lowering
`Screen Position` to open up the view along the direction of travel, and using
`Dead Zone` so the camera doesn't react to every lane change.

## What the Rotation Composer does

The original's summary — Follow doesn't handle the camera's own rotation, so
you need Rotation Composer alongside it — is right. The official description:

> This CinemachineCamera Rotation Control behaviour rotates the camera to face
> the Look At target. It also applies offsets, damping, and composition rules.

The main properties, in the docs' own terms:

- **Screen Position** — where on screen the target sits. "The camera adjusts to
  position the tracked object here."
- **Dead Zone** — "The camera will not adjust when the target is within this
  range of the Screen Position."
- **Hard Limits** — "The camera will not allow the target to be outside of the
  hard limits." However fast the target moves, it can't leave this box.
- **Damping** — "How responsively the camera frames the target in horizontal
  and vertical directions."
- **Lookahead Time** — estimates the target's future position from its motion
  and leads it. `Lookahead Smoothing` damps jittery predictions at the cost of
  lag, and `Lookahead Ignore Y` drops Y-axis movement from the prediction.
- **Center On Activate** — "Rotates the camera to put the target at the center
  of the dead zone when the camera becomes live."

### Target Offset doesn't move the camera

The original explains Rotation Composer's `Target Offset` as "relative X, Y, Z
distance from the target / adjusts the camera position relative to the
target's position." **It isn't a value that adjusts camera position.** The
official definition:

> Offset from the center of the Look At target, in target-local space.

Rotation Composer is a rotation control module, so this value moves **the point
the camera looks at**, in the target's local space. It's what you use to aim at
the character's head rather than their feet. Moving the camera's position is
`Follow Offset`, over on `Cinemachine Follow`.

The names are similar enough to mix up, so: **`Follow Offset` is where the
camera stands, `Target Offset` is where it looks.**

## There are two Dampings with the same name

Both modules have a `Damping`, which is its own source of confusion. They do
different jobs.

- **Follow's Position Damping** — "How responsively the camera tries to
  maintain the offset in the x, y, and z axes." How quickly the camera gets to
  its assigned spot.
- **Follow's Rotation Damping** — "How responsively the camera tracks the
  target's pitch, yaw, and roll." How quickly it follows the target's rotation.
  Taking the Binding Mode definition at face value — that it sets the
  coordinate space the offset is read in — **this value only means anything in
  the modes where the offset frame is tied to the target's rotation.** In
  `World Space` there is no frame to rotate.
- **Rotation Composer's Damping** — how quickly the target is brought to the
  intended composition on screen. The responsiveness of the gaze, not the
  position.

That's what decides which one to touch when the camera feels sluggish. **Slow
to keep up, look at Follow; slow to centre, look at Composer.**

## When reading Cinemachine 2 material

Search this topic and a lot of Cinemachine 2-era writing comes back mixed in.
The component names changed wholesale, so it doesn't even line up on names. The
mapping from the 3.1 docs:

| Cinemachine 2 | Cinemachine 3 |
| --- | --- |
| CinemachineVirtualCamera | CinemachineCamera |
| CinemachineTransposer | CinemachineFollow |
| CinemachineComposer | CinemachineRotationComposer |
| CinemachineFramingTransposer | CinemachinePositionComposer |
| CinemachineOrbitalTransposer | CinemachineOrbitalFollow |
| CinemachinePOV | CinemachinePanTilt |

The namespace also moved from `Cinemachine` to `Unity.Cinemachine`. And the
structure itself changed: from 3 onwards the pipeline components sit **directly
on the camera GameObject** rather than on a hidden child. The hidden child you
see in version 2 screenshots doesn't exist in 3.

The original is from December 2024 and already uses Cinemachine 3 names, so
that part can be followed as written.

## Summary

- The Follow Camera preset = `CinemachineCamera` + `Cinemachine Follow`
  (position) + `Cinemachine Rotation Composer` (rotation). Splitting position
  and rotation into separate modules is the Cinemachine 3 structure.
- **Binding Mode is not a rotation mode — it sets the coordinate space
  `Follow Offset` is interpreted in.** Read as a spectrum of how much target
  rotation you take, the six modes fall into a single order.
- **No Binding Mode rotates on mouse input.** Cinemachine cameras don't process
  input directly; they expose axes. Mouse control needs a component like
  `Orbital Follow` or `Pan Tilt` plus a
  `Cinemachine Input Axis Controller`.
- Rotation Composer's **`Target Offset` moves where the camera looks.** Where
  it stands is Follow's `Follow Offset`.
- `Damping` exists on both modules. Following speed is Follow, framing speed is
  Composer.
- Cinemachine 2 material differs from the component names up. Read it knowing
  `Transposer` → `Follow` and `Composer` → `Rotation Composer`.

## References

- [Cinemachine Follow component — Unity](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/CinemachineFollow.html)
- [Binding Modes — Unity](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.0/manual/CinemachineBindingModes.html)
- [Cinemachine Rotation Composer — Unity](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/CinemachineRotationComposer.html)
- [Cinemachine Input Axis Controller — Unity](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/CinemachineInputAxisController.html)
- [Follow and frame a character — Unity](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/setup-follow-camera.html)
- [What's new in Cinemachine 3 — Unity](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/whats-new.html)
- Original post (Korean): [\[Cinemachine\] 타겟 기반 시점 구현](https://gus6615.tistory.com/114)
