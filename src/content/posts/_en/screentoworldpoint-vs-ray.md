---
pubDatetime: 2026-10-14T21:10:00+09:00
title: "Some Functions Read z as a Distance and Others Throw It Away"
lang: en
translationKey: screentoworldpoint-vs-ray
featured: false
draft: false
tags:
  - Unity
  - InputSystem
  - C#
  - Camera
  - Input
description: "Code I clipped while trying to hide the cursor at the center of the screen in an FPS and raycast from that point to find where a shot lands. The original calls z a 'fix that puts the axis in camera terms'; the docs call it 'the distance of the resulting plane from the camera'. It's not a fix, it's a choice — and locking the cursor removes the need to read the value at all."
---

**I clipped this while building an FPS.** I needed to hide the cursor, pin it to
the center of the screen, and raycast from that point to find where a bullet
lands. Searching for "how to get a world coordinate from a screen point"
brought me to this post.

The conclusion first: **that purpose didn't need this function.** The moment you
lock the cursor to the center, the coordinate you'd read becomes fixed, and I
confirm that against the docs below. Still, `Input.mousePosition` and
`ScreenToWorldPoint` end up getting used elsewhere — dragging, placing, 2D
controls — so this post digs into that function to the bottom.

What I clipped is eight lines that get the world coordinate of a mouse click.
It's from 2018, and short as it is, it does everything needed — read the screen
coordinate, fill in `z`, convert to world space. **It works.** There's even a
video attached, and it tracks correctly under both perspective and orthographic.

But the **explanation** of the middle line doesn't match the docs.

> But the coordinate you get this way has a problem with its z axis, so you have
> to change the z axis into the camera's terms.

There's **nothing wrong with the `z` axis.** The docs state both what that value
is to begin with and what happens when you put something in it. The `z` of
`Input.mousePosition` is **always 0**, and the `z` of
`Camera.ScreenToWorldPoint` is **how far the resulting plane sits from the
camera**. So that line isn't a fix for something broken — it's **the one place
where you pick the plane the point lands on**.

And the value the original picked is `farClipPlane`, which by the docs is the
**edge of the view volume**. The doc example for a sibling function uses
`nearClipPlane` in that same slot.

Digging in, something else came out: the `Camera` functions that take a screen
coordinate **treat z in two different ways**. `ScreenToWorldPoint` and
`ViewportToWorldPoint` **read z as a distance**; `ScreenPointToRay` and
`ViewportPointToRay` **throw it away.** The docs say "ignores the z coordinate"
and "position.z is ignored" respectively. The argument types are identical, so
code alone won't tell them apart — and **this exact split is what separates the
FPS road from the cursor road**.

## Table of contents

## mousePosition's z isn't a "problem", it's always 0

The docs state why `Input.mousePosition` is a `Vector3` at all.

> Input.mousePosition is a Vector3 for compatibility with functions that have
> Vector3 arguments.
>
> The z component of the Vector3 is always 0.
>
> — [Input.mousePosition](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Input-mousePosition.html)

**It's a shape for compatibility.** It isn't a 3D position whose z went wrong —
the z slot was empty from the start and its value is 0. The same page also pins
down the range of screen coordinates.

> The bottom-left of the screen or window is at (0, 0).
>
> The top-right of the screen or window is at (Screen.width, Screen.height).

Look at the receiving end and it's immediately clear why that 0 is unusable.
Here's the parameter description for `Camera.ScreenToWorldPoint`.

> A 2D screen space point in pixels, plus a z coordinate for the distance from
> the camera in world units.
>
> — [Camera.ScreenToWorldPoint](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ScreenToWorldPoint.html)

`z` is **a distance from the camera, in world units**. And the same page fixes
the interval that distance has to fall in.

> To make sure the world space point is part of the camera's view volume, the z
> coordinate you provide must be between the camera's nearClipPlane and
> farClipPlane.

`nearClipPlane` sits in front of the camera, so **0 is outside that interval.**
Pass `mousePosition` through unchanged and you get a point between the camera
and the near plane. The docs don't say that "fails" — they say it just **isn't
part of the view volume**. The math runs, and the result lands where you can't
see it.

| Value | What the docs say | So |
|---|---|---|
| `Input.mousePosition.x`, `.y` | pixels, bottom-left `(0, 0)` | use as is |
| `Input.mousePosition.z` | "always 0" | unusable if the callee reads it as a distance |
| `z` of `ScreenToWorldPoint` | "the distance from the camera in world units" | you have to decide and supply it |
| allowed interval for that `z` | "between the camera's nearClipPlane and farClipPlane" | 0 is outside |

So the original's `pos.z = Camera.main.farClipPlane;` is **a line you must not
drop**. It's just that what the line does isn't a "fix".

## What z decides isn't a distance, it's a plane

The Returns text of `ScreenToWorldPoint` carries one word more than "distance".

> The world space point created by converting the screen space point at the
> provided distance z from the camera plane.
>
> — [Camera.ScreenToWorldPoint](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ScreenToWorldPoint.html)

**"from the camera plane"** — z away from the camera's plane. The sibling
function `ViewportToWorldPoint` spells this out even more plainly.

> Note that ViewportToWorldPoint transforms an x-y screen position into a
> x-y-z position in 3D space.
>
> Provide the function with a vector where the x-y components of the vector are
> the screen coordinates and the z component is the distance of the resulting
> plane from the camera.
>
> — [Camera.ViewportToWorldPoint](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ViewportToWorldPoint.html)

**"the distance of the resulting plane from the camera"** — what z picks isn't
a single point but **a single plane**. A point on the screen is a line running
out from the camera, and z decides where to cut that line.

The limit of this function shows up in the same sentence. **The only planes you
can pick are the ones parallel to the camera.** If you want a point on a plane
**whose orientation you chose** — a floor, say — this function won't do it.
That road exists separately, and I covered it in an earlier post:
[What Decides the Point to Look At Is the Plane, Not the Ray](/en/posts/mouse-look-plane-raycast/)
builds a `Plane` directly and cuts it with `Raycast`.

So the thing that decides a plane's orientation differs per function. With
`ScreenToWorldPoint` and `ViewportToWorldPoint`, the **camera** sets the
orientation and I only pick the distance. With `Plane.Raycast`, the `Plane` I
built sets the orientation too; with `Physics.Raycast`, the colliders placed in
the scene decide; with `RectTransformUtility`, that `RectTransform` decides.
What this post covers is **the first two, where the camera holds the orientation.**

## farClipPlane is the edge of the view volume, and the doc example uses nearClipPlane

The value the original put in `z` is `farClipPlane`. Here's that property's doc.

> The distance of the far clipping plane from the Camera, in world units.
>
> The far clipping plane is furthest point of the Camera's view frustum.
>
> The Camera cannot see geometry that is further this distance.
>
> — [Camera.farClipPlane](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-farClipPlane.html)

And `ScreenToWorldPoint` said z has to be **"between"** near and far. Put
`farClipPlane` in and you're at the **end** of that interval. The docs don't say
"don't use far" — it's just the boundary of an interval the docs describe as
"between", and the distance beyond which the camera **cannot see**. An object
placed there is flush against the side that gets clipped. (That much is what the
docs say; **which side floating-point error drops it on is something the docs
don't address.**)

The interesting part is **the value the doc example for the sibling function
picks**. The example on the `ViewportToWorldPoint` page passes
`(1, 1, nearClipPlane)` to get the world coordinate of the screen's top-right
corner — **near** in the same slot.

| Value put in z | Where the result lands | Usefulness |
|---|---|---|
| `0` (= `mousePosition.z`) | between the camera and the near plane | outside the view volume |
| `nearClipPlane` | start of the visible interval | what the doc example uses |
| a distance I chose (e.g. `10f`) | the plane at that distance | what game logic wants |
| `farClipPlane` | end of the visible interval | visible in a demo, but the boundary |
| larger than `farClipPlane` | outside the view volume | not visible |

**This is also why the demo looks fine.** Anywhere along the line through a
screen point, at any distance, **it overlaps the cursor as seen from the
camera.** An object on the far plane tracks the cursor exactly. But that
object's world position sits at the camera's `farClipPlane` distance. Correct as
a demo, and **hard for that distance to mean anything as game logic.**

## z does different work under perspective and orthographic

The original closes like this.

> Run it and whether the camera is set to perspective or orthographic, you
> always get a usable position value.

**That's true.** It's just that `z` isn't doing the same work in the two cases.
The docs describe the **shapes** of the two view volumes differently.

> The word frustum refers to a solid shape that looks like a pyramid with the
> top cut off parallel to the base.
>
> Both perspective and orthographic cameras have a limit on how far they can
> "see" from their current position.
>
> the viewing volume of an orthographic camera is defined by a rectangular box
> extending between the two clipping planes.
>
> — [Understanding the view frustum](https://docs.unity3d.com/6000.6/Documentation/Manual/UnderstandingFrustum.html)

Perspective is **a truncated pyramid**, orthographic is **a box**. And
`Camera.orthographic` states what sets each shape.

> Is the camera orthographic (true) or perspective (false)?
>
> When ortho is true, camera's viewing volume is defined by orthographicSize.
>
> When orthographic is false, camera's viewing volume is defined by fieldOfView.
>
> — [Camera.orthographic](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-orthographic.html)

Here's what follows from those two shapes — **from here on this is inference
from the shapes, not a sentence in the docs.** A box has the same cross-section
at near and at far, so changing `z` under orthographic **moves depth only and
leaves x and y alone.** A truncated pyramid's cross-section grows with distance,
so changing `z` under perspective **spreads x and y along with it.** That's why,
with `farClipPlane` as the original has it, perspective sends the object very far
away to very widely spread coordinates, while orthographic only pushes the depth
out.

And orthographic carries one **cost** the docs record.

> NOTE: Deferred rendering is not supported when using Orthographic projection.
>
> If the camera's projection mode is set to Orthographic, the camera will always
> use Forward rendering.
>
> — [Camera.orthographic](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-orthographic.html)

**An orthographic camera is always Forward.** That's the part missing when the
original says "it works on both", and how the camera factors into 2D draw order
is something I covered separately in
[What Decides Draw Order Is Three Things, Not Two](/en/posts/sorting-layer-order/).

| Projection | View volume shape | What sets it | Changing z | Rendering path |
|---|---|---|---|---|
| Perspective | truncated pyramid (frustum) | `fieldOfView` | depth plus x and y | unrestricted |
| Orthographic | box (rectangular box) | `orthographicSize` | depth only | always Forward |

## Put the same Vector3 into ScreenPointToRay and z gets thrown away

`Camera` has one more function that takes a screen coordinate, and **the
argument type is identical.** Its attitude toward `z` is the opposite.

> A 3D point, with the x and y coordinates containing a 2D screen space point in
> pixels.
>
> Unity ignores the z coordinate.
>
> — [Camera.ScreenPointToRay](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ScreenPointToRay.html)

**"Unity ignores the z coordinate."** Build the same `Vector3` and in one place
it's the value that picks a plane; in the other it's **ignored.** Copy the
`pos.z = ...` line over into a `ScreenPointToRay` call and it does nothing.

In exchange for discarding it, where the ray starts is fixed.

> Resulting ray is in world space, starting on the near plane of the camera and
> going through position's (x,y) pixel coordinates on the screen.

**It starts on the near plane.** That's why it doesn't need z — picking the
distance has moved over to `Raycast`. How to build a plane yourself and cut it
on that road is in the post linked above.

| Function | z of the argument | Start point | What decides the distance |
|---|---|---|---|
| `Camera.ScreenToWorldPoint` | distance from the camera | — | the z I passed |
| `Camera.ViewportToWorldPoint` | distance to the resulting plane | — | the z I passed |
| `Camera.ScreenPointToRay` | "Unity ignores the z coordinate" | near plane | the `Raycast` intersection |

## Lock the cursor to the center and mousePosition becomes unnecessary

In an FPS the crosshair is stuck to the center of the screen and the cursor
isn't visible. The doc for the property that creates that state **also settles
which coordinate you'd read.**

> Determines whether the hardware pointer is locked to the center of the view,
> constrained to the window, or not constrained at all.
>
> A locked cursor is positioned in the center of the view and cannot be moved.
>
> The cursor is invisible in this state, regardless of the value of
> Cursor.visible.
>
> — [Cursor.lockState](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Cursor-lockState.html)

Two sentences each remove one job. **"cannot be moved"** — there's no reason to
read a value that doesn't move, every frame. **"invisible ... regardless of the
value of Cursor.visible"** — no need for a separate `Cursor.visible = false` to
hide it. `Locked` alone hides it. The enum's own text is shorter.

> Locked: Locks the cursor to the center of the Game view.
>
> Confined: Confine cursor to the game window.
>
> None: Cursor behavior is unmodified.
>
> — [CursorLockMode](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/CursorLockMode.html)

So how do you write "center of the screen" as a coordinate? `Screen.width / 2`
is one road, but there's another that isn't tied to resolution.

> Returns a ray going from camera through a viewport point.
>
> Resulting ray is in world space, starting on the near plane of the camera and
> going through position's (x,y) coordinates on the viewport (position.z is
> ignored).
>
> Viewport coordinates are normalized and relative to the camera.
>
> The bottom-left of the camera is (0,0); the top-right is (1,1).
>
> — [Camera.ViewportPointToRay](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ViewportPointToRay.html)

**The coordinates are normalized, so the center is a fixed `(0.5f, 0.5f)`.** It
stays that way when the resolution changes and when the window resizes. And
this one is **`position.z is ignored`** too — the same attitude as
`ScreenPointToRay`; only the `ScreenToWorldPoint` family reads z.

The docs also record three cautions about locking the cursor at all.

> Note: Locking the cursor prevents the user from interacting with UI elements.
>
> The recommended best practice is to only lock or confine the cursor because of
> a user's action, such as pressing a button.
>
> The cursor state can be changed by the operating system or the Editor.
>
> In the Editor, the cursor loses focus in Game mode when you press Escape or
> when you switch an application.
>
> — [Cursor.lockState](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Cursor-lockState.html)

**You can't use it alongside UI**, **don't lock without a user action**, and
**the OS or the Editor can change the state.** The third bites most often in
practice — press Escape in the Editor or alt-tab away and the lock comes off.
So code that sets the lock once and forgets is wrong; you have to re-check the
state when focus returns. (The same page notes `Confined` is **"only supported
on Windows and Linux standalone builds"**.)

| Aiming style | Where the coordinate comes from | Resolution-dependent | Cursor |
|---|---|---|---|
| aim that follows the cursor (RTS, top-down) | `Pointer.position` | pixels | visible |
| fixed at screen center (FPS) | the `(0.5f, 0.5f)` constant | no | `Locked` → hidden |
| screen center in pixels | `Screen.width / 2` etc. | yes | — |
| a separate crosshair UI | that `RectTransform` | layout | visible |

## On the way back, z comes out carrying the distance

Look at the function going the other way and you can see this design was cut as
one set.

> Transforms position from world space into screen space.
>
> Screen space is defined in pixels.
>
> The z coordinate is the distance from the camera in world units.
>
> If position is outside the Camera's viewing volume, Unity returns a screen
> position that's off-screen.
>
> — [Camera.WorldToScreenPoint](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.WorldToScreenPoint.html)

**Coming out, z carries the distance too.** Which means handing
`WorldToScreenPoint`'s result straight back to `ScreenToWorldPoint` round-trips
— the right distance is already sitting in the z slot. `mousePosition`, by
contrast, is a `Vector3` with that z slot empty, so it only brings back half of
the round trip.

The last sentence is worth noting as well. Feed in a position you can't see and
you get **an off-screen coordinate, not an exception**. It's the same attitude
as `ScreenToWorldPoint` producing a value for a z outside the view volume.

| Direction | Function | Role of z | Out of range |
|---|---|---|---|
| screen → world | `ScreenToWorldPoint` | the distance I pass in | a point outside the view volume |
| world → screen | `WorldToScreenPoint` | the distance I get back | "a screen position that's off-screen" |

## GetMouseButton isn't "click", it's "held down"

The original's title says "mouse click coordinates" and the code uses
`Input.GetMouseButton(0)`. Those two aren't the same thing.

> Returns whether the given mouse button is held down.
>
> The return is true when the mouse button is pressed down, and false when
> released.
>
> — [Input.GetMouseButton](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Input.GetMouseButton.html)

**It's true every frame while held.** If you want it once on the press, there's
a different function.

> Returns true during the frame the user pressed the given mouse button.
>
> It will not return true until the user has released the mouse button and
> pressed it again.
>
> Call this function from the MonoBehaviour.Update function, since the state
> gets reset each frame.
>
> — [Input.GetMouseButtonDown](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Input.GetMouseButtonDown.html)

In the original's video the object **keeps following** the cursor, so
`GetMouseButton` is the right choice for that demo. It isn't wrong — it's just
that **the title's "click" and what the code does are different things.**
Without that distinction you copy `GetMouseButton` straight into code meant to
record "where I clicked".

And those two pages plus `Input.mousePosition` all carry **the same sentence**.

> Note: This API is part of the legacy Input Manager.
>
> The recommended best practice is that you don't use this API in new projects.
>
> For new projects, use the Input System package.

All three things the original's code uses are APIs with that sentence attached.
Here are the Input System counterparts.

> The current pointer coordinates in window space.
>
> — [Pointer.position](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Pointer.html)

> Whether the pointer is pressed down.
>
> For mice (Mouse), it means that the left button is pressed.
>
> — [Pointer.press](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Pointer.html)

> Whether the press started this frame.
>
> — [ButtonControl.wasPressedThisFrame](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Controls.ButtonControl.html)

The `isPressed` side comes with a note that the verdict rests on a threshold.

> A button is considered pressed if its value is equal to or greater than its
> button press threshold.
>
> — [ButtonControl.isPressed](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Controls.ButtonControl.html)

Where that threshold splits `started` from `performed` is something I wrote up
in [What Sits Between started and performed Is the Press Threshold](/en/posts/input-action-phases/).
`wasPressedThisFrame` and `wasReleasedThisFrame` have **a caveat about the very
first call** recorded separately in the docs, so if you're somewhere input must
not be missed, read that paragraph directly.

One more thing catches you while switching over. What `Pointer.position` hands
back is a **`Vector2`**. Put it straight into `ScreenToWorldPoint` and the
implicit conversion makes **z become 0** — the same trap under a new name. z
has to be filled in by hand.

| What you were using | What the docs say | The Input System side |
|---|---|---|
| `Input.mousePosition` | "z component ... is always 0" | `Pointer.position` (`Vector2`) |
| `Input.GetMouseButton(0)` | "held down" | `Mouse.leftButton.isPressed` / `Pointer.press` |
| `Input.GetMouseButtonDown(0)` | "during the frame the user pressed" | `Mouse.leftButton.wasPressedThisFrame` |

## Over UI there's a road that uses the RectTransform's plane

"Picking a plane" comes back a third time. When you want the world coordinate of
a point pressed over UI, there's a dedicated utility.

> Transform a screen space point to a position in world space that is on the
> plane of the given RectTransform.
>
> — [RectTransformUtility.ScreenPointToWorldPointInRectangle](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/RectTransformUtility.ScreenPointToWorldPointInRectangle.html)

**The plane that `RectTransform` sits on** is the reference. Not a plane
parallel to the camera, and not a `Plane` I built. The meaning of the return
value matters especially.

> Returns true if the plane of the RectTransform is hit, regardless of whether
> the point is inside the rectangle.

**It's true even outside the rectangle.** It only checks whether the plane was
hit. Use it as "was the button pressed" and you're wrong. The camera argument
has conditions too.

> The cam parameter should be the camera associated with the screen point.
>
> For a RectTransform in a Canvas set to Screen Space - Overlay mode, the cam
> parameter should be null.

Under `Screen Space - Overlay` you **have to pass `null`.** This is a place
where passing `Camera.main` out of habit is wrong. Inside an event handler the
docs also tell you where to get it.

> the correct camera can be obtained by using PointerEventData.enterEventCamera
> (for hover functionality) or PointerEventData.pressEventCamera (for click
> functionality).

How coordinates grow inside a Canvas is something I covered in
[What Decides Which Way Content Grows Is the Pivot, Not the Anchor](/en/posts/ugui-scroll-view-content/).

## Move to hitscan and three default values trip you up

Firing a ray from the crosshair is one line of `ViewportPointToRay`. The default
values hide on the side that checks what the ray hit. Read the declaration as
written and they show.

> public static bool Raycast(Ray ray,
> out RaycastHit hitInfo,
> float maxDistance = Mathf.Infinity,
> int layerMask = DefaultRaycastLayers,
> QueryTriggerInteraction queryTriggerInteraction = QueryTriggerInteraction.UseGlobal);
>
> — [Physics.Raycast](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Physics.Raycast.html)

**All three slots carry a default, and omitting all three is the costliest
choice.**

`maxDistance` defaults to `Mathf.Infinity`. The docs describe that argument only
as **"The max distance the ray should check for collisions."** There is **no**
sentence about performance on this page — it's just that firing an
infinite-range ray for a gun that has a range isn't what you meant. Supply the
range and anything beyond it is never a candidate in the first place.

`layerMask` defaults to `DefaultRaycastLayers`, and **this page doesn't explain
which layers that includes.** Read the name and assume "the default layers" and
you're wrong. What that name actually filters and doesn't is something I
confirmed separately in
[OverlapSphere Doesn't Ignore the Ignore Raycast Layer](/en/posts/physics-overlapsphere/).
If the things that **must not be hit** — the player's own body, invisible walls,
decals — pass through unmasked, the impact point appears right at the muzzle.

`queryTriggerInteraction` defaults to following a global setting.

> Specifies whether queries (raycasts, spherecasts, overlap tests, etc.) hit
> Triggers by default.
>
> This can be overridden on a per-query level by specifying the
> QueryTriggerInteraction parameter.
>
> — [Physics.queriesHitTriggers](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Physics-queriesHitTriggers.html)

**One global setting changes the behavior of every query.** The docs don't state
a default, so you have to check it in your own project, and for bullet
resolution at least it's safer to be explicit per query. A bullet shouldn't hit
a trigger volume — a sound zone, an event trigger.

And there's one more condition tied to **where the ray starts.**

> Raycasts will not detect Colliders for which the Raycast origin is inside the
> Collider.
>
> — [Physics.Raycast](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Physics.Raycast.html)

The ray `ViewportPointToRay` hands back **starts on the near plane.** If a
first-person camera sits inside the character's collider, that collider isn't
detected at all — sometimes the problem of hitting your own body simply never
arises because of this condition, and conversely **a wall going undetected when
you stand flush against it** is the same condition. It isn't the mask blocking
it but the geometry, so if you're relying on the mask it breaks when positions
change.

Finally, **which function you fire from.** There's a line in the same page's
Notes.

> In all these examples FixedUpdate is used rather than Update.
>
> Refer to Order of execution for event functions to understand the difference
> between Update and FixedUpdate,
>
> — [Physics.Raycast](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Physics.Raycast.html)

The docs **state outright** that their examples use `FixedUpdate` rather than
`Update`. Input arrives on the `Update` cadence and physics runs on the
`FixedUpdate` cadence. If you want to fire on the same frame the shot input
arrives, you fire from `Update` — and then you need to know that collider
positions at that moment are the ones from the previous physics step. The docs
don't say which is right; they **say to know the difference and choose.**

| Argument / place | Default | If omitted | In hitscan |
|---|---|---|---|
| `maxDistance` | `Mathf.Infinity` | infinite range | supply the gun's range |
| `layerMask` | `DefaultRaycastLayers` | docs don't state its contents | be explicit |
| `queryTriggerInteraction` | `UseGlobal` | dragged along by a global setting | be explicit per query |
| the ray's origin | near plane | a collider you're inside goes undetected | know the condition |
| call site | — | — | know the `Update`/`FixedUpdate` difference and choose |

## The client shouldn't be the one deciding where the shot landed

Everything up to here is true **inside a single device.** Go multiplayer and the
same code means something different, because the party computing "it hit here"
from a ray out of the crosshair is the client. Mirror's docs address this point
directly.

> Mirror is server authoritative by default.
>
> As rule of thumb, never trust the client!
>
> — [Cheats & Anticheats — Mirror](https://mirror-networking.gitbook.io/docs/security/cheating)

And they write it **using aiming as the example.**

> an Aim Bot can pretend to move the cursor onto another player more quickly
>
> since the server trusts the client with moving the cursor, it opens up for
> cheating with no easy solution
>
> — [Cheats & Anticheats — Mirror](https://mirror-networking.gitbook.io/docs/security/cheating)

It says **"no easy solution"**. Let's not overstate it — however you use the
coordinate-conversion code in this post, aimbots don't get blocked. What the
docs are saying is that **how much you hand to the client** is a choice, and
that choice sets the risk that remains.

In practice the line gets drawn like this. If what the client sends is **"the
target I hit and the damage"**, you're trusting that value; if it's **"the
direction I was looking and when"**, the server can recompute. Pick the latter
and this post's ray calculation runs a second time on the server — which brings
a constraint: a camera-dependent function like `ViewportPointToRay` can't be
used as is for server-side resolution. The server doesn't have that client's
camera, so what crosses the wire isn't a screen coordinate but **a direction
vector in world space.**

Nor does the server simply take what's sent and use it.

> we need to validate any input
>
> — [Cheats & Anticheats — Mirror](https://mirror-networking.gitbook.io/docs/security/cheating)

Even a direction vector leaves things to validate — whether it's normalized,
whether the range exceeds the gun's range, whether the interval between shots
exceeds the fire rate. Which side runs on the server is settled by attributes,
and that doesn't by itself mean safe.

> Command: Call this from a client to run this function on the server.
>
> Server: Only a server can call the method (throws a warning when called on a
> client).
>
> — [Attributes — Mirror](https://mirror-networking.gitbook.io/docs/manual/guides/attributes)

With `[Command]`, **it runs on the server but the client fills the arguments.**
There's a separate post that pins down that distinction —
[Mirror's Commands and RPCs: Running on the Server Doesn't Mean It's Safe](/en/posts/mirror-remote-actions/).

| What the client sends | What the server does | Risk that remains |
|---|---|---|
| "I hit target A for 30 damage" | applies it as is | can claim any target and any number |
| "I fired in this direction" (world) | fires the ray again | manipulation of the aim itself (aimbot) |
| "I fired from this screen point" | can't recompute | the server doesn't have that camera |
| shot timestamp and interval | checks against the fire rate | clock manipulation — judge by server time |

## Where and why you'd use it

`ScreenToWorldPoint` is for when you want a screen point placed **a set
distance in front of the camera**. A marker that follows the cursor, a 2D object
dragged around, an effect positioned against a screen corner — cases where the
plane's orientation being the camera's is fine. If you need a point on **a
surface with a fixed orientation** like a floor or a wall, this isn't the
function; and if the crosshair is **pinned to the screen center** as in an FPS,
there's no coordinate to read at all.

### A working example

Both roads are in one script. Turn `_aimAtScreenCenter` on and it locks the
cursor and uses **the point a ray from the viewport center hits on a collider**
(FPS hitscan). Turn it off and it **stamps the cursor position onto a plane at a
given depth** (the original's road). `z` isn't `farClipPlane` but a distance set
in the Inspector, clamped back into the near–far interval at runtime.

```csharp file="Scripts/Input/ScreenPointAimer.cs"
using UnityEngine;
using UnityEngine.InputSystem;

public class ScreenPointAimer : MonoBehaviour
{
    private const float MinDepth = 0.01f;
    private const float ViewportCenter = 0.5f;

    [Header("Target")]
    [Tooltip("The marker moved to the point that was hit")]
    [SerializeField]
    private Transform _marker;

    [Header("Aiming")]
    [Tooltip("On locks the cursor and fires from the viewport center")]
    [SerializeField]
    private bool _aimAtScreenCenter;

    [Header("Plane mode — when using the cursor position")]
    [Tooltip("World units in front of the camera. Clamped to near~far at runtime")]
    [Min(MinDepth)]
    [SerializeField]
    private float _depth = 10f;

    [Tooltip("On follows while held. Off moves only on the frame of the press")]
    [SerializeField]
    private bool _followWhileHeld;

    [Header("Hitscan mode — when aiming at the center")]
    [Tooltip("The gun's range. Don't leave the Mathf.Infinity default in place")]
    [Min(MinDepth)]
    [SerializeField]
    private float _range = 100f;

    [Tooltip("Only the layers that should be hit, not DefaultRaycastLayers")]
    [SerializeField]
    private LayerMask _hittableLayers = ~0;

    [Header("Diagnostics")]
    [Tooltip("Logs the world point that was stamped")]
    [SerializeField]
    private bool _logPlacement;

    private Camera _camera;

    private void Awake()
    {
        // Don't use ?. on a UnityEngine.Object. The comparison operators handle
        // the case where a destroyed object doesn't look null.
        _camera = Camera.main;
        if (_camera == null)
        {
            Debug.LogError("There is no active camera tagged MainCamera.", this);
        }

        if (_marker == null)
        {
            Debug.LogError("_marker is empty.", this);
        }
    }

    private void OnEnable()
    {
        ApplyCursorState();
    }

    private void OnApplicationFocus(bool hasFocus)
    {
        // The docs say "The cursor state can be changed by the operating system
        // or the Editor". Re-apply it when focus comes back.
        if (hasFocus) { ApplyCursorState(); }
    }

    private void ApplyCursorState()
    {
        // Locked hides the cursor regardless of the Cursor.visible value.
        Cursor.lockState = _aimAtScreenCenter
            ? CursorLockMode.Locked
            : CursorLockMode.None;
    }

    private void Update()
    {
        if (_camera == null || _marker == null) { return; }

        if (_aimAtScreenCenter)
        {
            UpdateCenterAim();
            return;
        }

        UpdateCursorPlacement();
    }

    private void UpdateCenterAim()
    {
        Mouse mouse = Mouse.current;
        if (mouse == null || !mouse.leftButton.wasPressedThisFrame) { return; }

        // Viewport coordinates are normalized, so the center is (0.5, 0.5)
        // whatever the resolution. The third component is the slot the docs
        // mark as ignored.
        Ray aimRay = _camera.ViewportPointToRay(
            new Vector3(ViewportCenter, ViewportCenter, 0f));

        // maxDistance, layerMask and trigger handling are all explicit.
        bool hit = Physics.Raycast(
            aimRay,
            out RaycastHit hitInfo,
            _range,
            _hittableLayers,
            QueryTriggerInteraction.Ignore);

        if (!hit)
        {
            // If a miss still needs an impact point, use the end of the range.
            Place(aimRay.GetPoint(_range), "end of range");
            return;
        }

        Place(hitInfo.point, hitInfo.collider.name);
    }

    private void UpdateCursorPlacement()
    {
        Mouse mouse = Mouse.current;
        if (mouse == null) { return; }

        bool pressed = _followWhileHeld
            ? mouse.leftButton.isPressed
            : mouse.leftButton.wasPressedThisFrame;
        if (!pressed) { return; }

        // position is a Vector2. Put it straight into a Vector3 and z becomes
        // 0, and 0 is in front of nearClipPlane, outside the view volume.
        Vector2 screenPoint = mouse.position.ReadValue();

        // [Min] is Inspector-only. It can't stop a value assigned from code,
        // so clamp again at runtime.
        float depth = Mathf.Clamp(
            _depth, _camera.nearClipPlane, _camera.farClipPlane);

        Vector3 screenPointWithDepth =
            new Vector3(screenPoint.x, screenPoint.y, depth);

        Place(_camera.ScreenToWorldPoint(screenPointWithDepth), $"depth {depth}");
    }

    private void Place(Vector3 worldPoint, string reason)
    {
        _marker.position = worldPoint;

        if (_logPlacement)
        {
            Debug.Log($"{reason} → world = {worldPoint}", this);
        }
    }
}
```

One thing about where `Mathf.Clamp` is used. `[Min]` only blocks the value **in
the Inspector**. Another script assigning a negative to `_depth` gets it through,
so the real guard has to be on the runtime side. How `Clamp` changes with the
order of its arguments is something I wrote up in
[There Are Two Clamps: Swap the Arguments and Only One Throws](/en/posts/mathf-clamp/)
— here `nearClipPlane < farClipPlane` is guaranteed, so there's no ordering
problem.

The reason `Camera.main` is read once in `Awake` is the cost the docs record.

> Accessing this property has a small CPU overhead, comparable to calling
> GameObject.GetComponent.
>
> Where CPU performance is important, consider caching this property.
>
> — [Camera.main](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-main.html)

The original code reads `Camera.main` **twice** inside `Update`. How the common
wisdom about this property differs from the current docs is something I pinned
down separately in
[What Decides the Point to Look At Is the Plane, Not the Ray](/en/posts/mouse-look-plane-raycast/).

### How to choose

| What you want | What to use | Why |
|---|---|---|
| stamp onto the plane d in front of the camera | `ScreenToWorldPoint(new Vector3(x, y, d))` | z picks that plane |
| the same in normalized (0–1) coordinates | `ViewportToWorldPoint` | bottom-left `(0,0)`, top-right `(1,1)` |
| a point on a fixed-orientation plane like a floor | `ScreenPointToRay` + `Plane.Raycast` | I set the plane's orientation |
| the point an actual collider was hit at | `ScreenPointToRay` + `Physics.Raycast` | `RaycastHit.point` |
| a point on a UI (`RectTransform`) plane | `ScreenPointToWorldPointInRectangle` | that `RectTransform`'s plane |
| where a world point appears on screen | `WorldToScreenPoint` | the returned z is the distance from the camera |
| the crosshair is **pinned to the center** (FPS) | `ViewportPointToRay((0.5f, 0.5f, 0f))` | a constant independent of resolution |
| hiding the cursor for that | `Cursor.lockState = CursorLockMode.Locked` | hides regardless of `Cursor.visible` |
| once on the **moment** of the press | `wasPressedThisFrame` | "the press started this frame" |
| every frame **while** held | `isPressed` / `Pointer.press` | "currently pressed" |
| thousands of rays at once | `RaycastCommand` | batched execution in a job |

Here's the order I'd decide in.

1. **Do I have to set the plane's orientation?** Then it isn't
   `ScreenToWorldPoint`. Go to `Plane.Raycast` or `Physics.Raycast`.
2. **Is a plane parallel to the camera enough?** Then put **a meaningful
   distance** in z. `farClipPlane` is not a meaningful distance.
3. **Expose that distance in the Inspector and clamp it at runtime.** A z
   outside near–far quietly produces an invisible result.
4. **Is the crosshair pinned to the screen center?** Then don't read a
   coordinate — use `(0.5f, 0.5f)`. Lock the cursor with `Locked`.
5. **Read input through the Input System.** All three APIs carry the docs'
   sentence about not using them in new projects.
6. **If it's multiplayer, settle who decides first.** Make what the client
   sends a **world direction** rather than a coordinate and the server can
   recompute.

### Roads to take further

The order in which to go a step further from code that already runs. For the
three below I've kept **what the docs say is supported** separate from **design
choices**.

**One — turn polling into callbacks.** The example checks the button every frame
in `Update`. Use an Input System action and it's called only on the frame of the
press, and one button splits into `started`, `performed` and `canceled`. Where
that boundary gets decided is something I wrote up in
[What Sits Between started and performed Is the Press Threshold](/en/posts/input-action-phases/).

**Two — when the rays multiply, run them as a batch.** When dozens to thousands
of rays go out in one frame — buckshot, penetration, AI vision — there's a
dedicated struct.

> Struct used to set up a raycast command to be performed asynchronously during
> a job.
>
> When you use this struct to schedule a batch of raycasts, they will be
> performed asynchronously and in parallel
>
> Since the results are written asynchronously the results buffer cannot be
> accessed until the job has been completed.
>
> — [RaycastCommand](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/RaycastCommand.html)

The constraint that comes with it is that **you can't read the results in the
same frame**. It's overkill for a single hitscan shot from one gun, and it pays
off when there are many checks that **can afford to be a frame late**. The docs
also fix the rule for reading the results buffer — **"The results for a command
at index N in the command buffer are stored at index N * maxHits in the results
buffer."** and **"the loop should stop when the first invalid result is
found."** And the profiler says **"Only BatchQuery.ExecuteRaycastJob is
logged"**, so don't plan on counting queries from the profiler.

**Three — move the resolution to the server.** The line-drawing covered above.
The client sends only a world direction and a shot timestamp, and the server
runs `Physics.Raycast` again. The camera-dependent `ViewportPointToRay` stays
**on the client side only** at this stage.

### Where not to use it

- **Passing `Input.mousePosition` through unchanged.** z is 0, and 0 is in
  front of `nearClipPlane`. Outside the interval the docs require.
- **Treating `farClipPlane` as a default.** In a demo it overlaps the cursor,
  but the object sits at the distance beyond which the camera can't see.
- **Filling in z for `ScreenPointToRay`.** "Unity ignores the z
  coordinate."
- **Getting a point on a floor or a wall.** Only planes parallel to the camera
  can be picked.
- **Using `ScreenPointToWorldPointInRectangle` to decide whether a button was
  pressed.** It returns true even outside the rectangle.
- **Passing `Camera.main` for a `Screen Space - Overlay` Canvas.** The docs say
  to pass `null`.
- **Leaving a camera orthographic while expecting Deferred.** The docs say it
  isn't supported, and it always becomes Forward.
- **`Input.GetMouseButton` / `Input.mousePosition` in a new project.** Three
  pages carry the same sentence recommending against them.
- **Reading a cursor coordinate when the crosshair is pinned to the center.**
  The docs say a locked cursor **"cannot be moved"**. The value is fixed.
- **Showing UI while the cursor is locked.** The docs say **"Locking the cursor
  prevents the user from interacting with UI elements."**
- **Setting the lock once and forgetting.** The OS and the Editor change the
  state. You have to re-check when focus returns.
- **Using `Cursor.visible = false` together with `Locked`.** Under `Locked` it's
  hidden regardless of the `Cursor.visible` value.
- **Omitting `maxDistance` and `layerMask` in hitscan.** The defaults are
  infinite range and a mask whose contents aren't stated.
- **Applying a client-computed "target hit and damage" as is on the server.**
  Mirror's docs put it as **"never trust the client!"**.
- **Sending a screen coordinate to the server.** The server doesn't have that
  client's camera, so it can't recompute.
- **Reading a `RaycastCommand` result in the same frame.** The docs say the
  buffer can't be read before the job completes.

## Summary

- `Input.mousePosition`'s z isn't broken, it's **"always 0"**. The docs state
  compatibility as the reason it's a `Vector3`.
- `ScreenToWorldPoint`'s z is **"the distance from the camera in world
  units"**, and must be **between** near and far. 0 is outside that.
- What that z picks isn't a distance but **a plane** — `ViewportToWorldPoint`
  writes "the distance of the resulting plane from the camera".
  And that plane can **only be parallel to the camera**.
- `farClipPlane` is the **edge** of the interval. The doc example uses
  `nearClipPlane` in the same slot.
- Perspective is **a truncated pyramid**, orthographic is **a box**. So when z
  changes, the former spreads x and y too while the latter only changes depth.
  Orthographic renders **always Forward**.
- Put the same `Vector3` into `ScreenPointToRay` and **"Unity ignores the z
  coordinate."** The ray starts on the near plane.
- Going back, `WorldToScreenPoint` returns **the distance carried in z**.
  Out of range it's an off-screen coordinate, not an exception.
- `GetMouseButton` is **"held down"** and `GetMouseButtonDown` is **"during
  the frame the user pressed"**. The latter is what matches "click".
- A point on a UI plane is `ScreenPointToWorldPointInRectangle`, and it returns
  **true even outside the rectangle**. Under `Screen Space - Overlay` you pass
  `null` for the camera.
- **Lock the cursor with `Locked` and there's no coordinate to read.** The docs
  say **"positioned in the center of the view and cannot be moved"** and
  **"invisible ... regardless of the value of Cursor.visible"**.
  Write the center as `ViewportPointToRay((0.5f, 0.5f, 0f))`, where z is
  **"ignored"** as well.
- Lock **only on a user action**, and re-check on focus return on the premise
  that **the OS and the Editor can change it**. It can't be used with UI.
- Move to hitscan and `Physics.Raycast`'s **three defaults** become the problem
  — `Mathf.Infinity` range, a `DefaultRaycastLayers` whose contents aren't
  stated, trigger handling that follows a global setting. Be explicit on all three.
- The ray's origin is the near plane, and **"Raycasts will not detect Colliders
  for which the Raycast origin is inside the Collider."** You have to separate
  what the mask blocks from what the geometry doesn't catch.
- The docs **state outright** that their examples use `FixedUpdate`. It means
  knowing the input cadence differs from the physics cadence, and choosing.
- In multiplayer it's **"never trust the client!"**. Make what the client sends
  a **world direction** rather than a screen coordinate and the server can
  recompute. Mirror's docs call the aimbot itself **"no easy solution"**.
- When rays get very numerous, batch them with `RaycastCommand` — but accept the
  constraint that **the results can't be read in the same frame**.

---

### References

- [Camera.ScreenToWorldPoint — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ScreenToWorldPoint.html)
- [Camera.ViewportToWorldPoint — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ViewportToWorldPoint.html)
- [Camera.WorldToScreenPoint — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.WorldToScreenPoint.html)
- [Camera.ScreenPointToRay — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ScreenPointToRay.html)
- [Camera.farClipPlane — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-farClipPlane.html)
- [Camera.nearClipPlane — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-nearClipPlane.html)
- [Camera.orthographic — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-orthographic.html)
- [Camera.main — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-main.html)
- [Understanding the view frustum — Unity Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/UnderstandingFrustum.html)
- [Camera component — Unity Manual](https://docs.unity3d.com/6000.6/Documentation/Manual/class-Camera.html)
- [Input.mousePosition — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Input-mousePosition.html)
- [Input.GetMouseButton — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Input.GetMouseButton.html)
- [Input.GetMouseButtonDown — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Input.GetMouseButtonDown.html)
- [RectTransformUtility.ScreenPointToWorldPointInRectangle — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/RectTransformUtility.ScreenPointToWorldPointInRectangle.html)
- [Cursor.lockState — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Cursor-lockState.html)
- [CursorLockMode — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/CursorLockMode.html)
- [Camera.ViewportPointToRay — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ViewportPointToRay.html)
- [Physics.Raycast — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Physics.Raycast.html)
- [Physics.queriesHitTriggers — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Physics-queriesHitTriggers.html)
- [RaycastCommand — Unity Scripting API](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/RaycastCommand.html)
- [Cheats & Anticheats — Mirror docs](https://mirror-networking.gitbook.io/docs/security/cheating)
- [Attributes — Mirror docs](https://mirror-networking.gitbook.io/docs/manual/guides/attributes)
- [Pointer — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Pointer.html)
- [ButtonControl — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Controls.ButtonControl.html)

The clipping is a Naver blog post by 라마 탄 참새,
[지랄하는 프로그래머 #06 \[Unity3D/유니티 3D\] 마우스 클릭 좌표값 얻어오기](https://m.blog.naver.com/bsheep91/221320005889)
(2018-07-16), in Korean; the quotes from it are my translations. It's code that
does the whole job in eight lines, and it doesn't make the common mistake of
passing z through empty. This post confirms the code is right and then checks
the **explanation** of its middle line against the current docs. The docs don't
call that slot a fix — they call it **the distance that picks the resulting
plane**.

What I was looking for — finding the impact point from a center-pinned crosshair
in an FPS — ended up not using this function at all. Lock the cursor and the
coordinate becomes a constant, and the road that takes a constant is the
`ViewportPointToRay` side. **Finding out it wasn't the answer I was after is
itself part of the result.**
