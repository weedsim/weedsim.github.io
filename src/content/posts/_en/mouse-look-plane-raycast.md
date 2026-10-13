---
pubDatetime: 2026-10-13T17:10:00+09:00
title: "What Decides the Point to Look At Is the Plane, Not the Ray"
lang: en
translationKey: mouse-look-plane-raycast
featured: false
draft: false
tags:
  - Unity
  - InputSystem
  - C#
  - Input
  - Camera
description: "Short code for facing the mouse, clipped while looking for how to do top-down controls. The method is right, but the plane sits at the origin and the height gets patched in separately. Put the plane at the object's position and that patch disappears."
---

**Looking for how to do top-down controls**, I clipped a short piece of code
that faces the mouse cursor, exactly like the example in it. It's from 2023 and
the single function is carefully commented. **The method is right** — it casts
a ray from screen coordinates and intersects it with a mathematical plane to
get world coordinates. It avoids the common mistake of guessing a `z` for
`ScreenToWorldPoint`, and it filters out the case where the intersection fails
with an `if`.

But the last line looks like this.

> transform.LookAt(new Vector3(_lookDir.x, transform.position.y, _lookDir.z));

**It gets the intersection point and then swaps the Y for its own.** Why that's
necessary isn't in the comments. The reason that patch is needed is written
across two functions' docs, and **changing one line of where the plane is made
removes the need for it entirely.** That's where this starts.

This blog has four input posts and all of them are on the Input System. The
closest one is
[Subscribing to InputAction Directly: The Lifetime of Delegate-Based Input](/en/posts/input-action-subscribe/).
This clipping uses **the legacy Input Manager's `Input` class**, which its API
docs now tell you not to use. That story is a section below too.

I verified six things. **The ray starts on the near plane and `z` is
ignored**, **the condition under which `LookAt` tilts is written in the docs**,
**`Plane.Raycast` returns false in two cases and `enter` differs between
them**, **`Input.mousePosition` is an API the docs tell you not to use in new
projects**, **the common wisdom about `Camera.main` doesn't match the current
docs**, and **`LookAt` turns instantly, with no interpolation in the docs.**

Checked on **2026-10-13**, against Unity **6.6** and Input System **1.20**.

## Table of contents

## The ray comes from the screen, the point comes from the plane

Start with what the first line's function returns.

> Returns a ray going from camera through a screen point.

> Resulting ray is in world space, starting on the near plane of the camera and
> going through position's (x,y) pixel coordinates on the screen.

**It starts on the near plane** and it's **in world space**. The parameter
description adds one more line.

> A 3D point, with the x and y coordinates containing a 2D screen space point
> in pixels.

> Unity ignores the z coordinate.

**The `z` is ignored.** The `Input.mousePosition` the clipping passes happens to
always have `z` of 0, so it causes no trouble. But the two sentences matter
together for a reason — **a ray alone doesn't determine a point in the world.**
A ray is a direction, and a point only appears once you cut that ray somewhere.
Cutting it is the plane's job.

> public bool Raycast(Ray ray, out float enter);

> This function sets `enter` to the distance along the ray, where it intersects
> the plane.

And there's a separate function for turning that distance into a point.

> Returns a point at `distance` units along the ray.

That's `Ray.GetPoint`. So the order is **screen coordinates → ray → distance
(to the plane) → point**, and **which plane you choose determines the final
point.** The clipping's comments describe this structure accurately. The next
section is about "which plane".

One thing worth noting about notation. The two pages write the edge of the
screen differently. `ScreenPointToRay`'s parameter description says this.

> The upper right pixel of the screen is (screen width in pixels - 1, screen
> height in pixels - 1).

`Input.mousePosition`'s side says this.

> The top-right of the screen or window is at (Screen.width, Screen.height).

**One pixel apart.** One says "the upper right pixel" and the other "the
top-right of the screen", which needn't point at the same thing, and I couldn't
find a place where the two statements are reconciled. One pixel rarely matters
in practice, but it's worth knowing for code that computes screen edges
directly.

## Put the plane at the origin and you have to fix the height again

The clipping makes the plane like this.

> Plane _plane = new Plane(Vector3.up, Vector3.zero);

The constructor's description makes both arguments clear.

> Resulting plane has normal `inNormal` and goes through a point `inPoint`.

> `inNormal` must be a normalized vector.

**A plane whose normal is `Vector3.up` and which passes through
`Vector3.zero`** — that is, `y = 0`. The clipping's comment says so too. But
one assumption is mixed into that comment.

> the y=0 plane == the plane the objects in the scene are placed on

**That isn't a fact, it's an assumption.** It only holds while the character is
at `y = 0`. On a hill, with a pivot lifted by a capsule collider, or on a map
with floors, the intersection lands below the character.

So why does it tilt? The last of `LookAt`'s four description sentences is the
answer.

> Rotates the transform so the forward vector points at `worldPosition`.

> Then it rotates the transform to point its up direction vector in the
> direction hinted at by the `worldUp` vector.

> If you leave out the `worldUp` parameter, the function will use the world y
> axis.

> The up vector of the rotation will only match the `worldUp` vector if the
> forward direction is perpendicular to `worldUp`.

**Up matches `worldUp` only when forward is perpendicular to it.** With the
character at `y = 1` and the intersection at `y = 0`, forward tilts downward,
so the character leans forward. The clipping's last line is **the patch that
forces that condition to hold.** That's what the patch is.

But look at the constructor again and the point the plane passes through is
**mine to choose.** `new Plane(Vector3.up, transform.position)` puts the
intersection at the character's own height from the start. Forward becomes
perpendicular to `worldUp`, so **there's no reason to swap the Y back in.** One
line that builds a new vector disappears, and so does the question of "why only
the Y".

| | plane at the origin | plane at the object's position |
| --- | --- | --- |
| Height of the intersection | always `y = 0` | the same as the object |
| Y patch | needed | not needed |
| Character on a hill | intersection below its feet | the same plane as its feet |
| A map with floors | lands on the lower floor | the current floor |

## Raycast returns false in two different cases

The clipping's `if` is the right handling. But the docs split the false cases
in **two**, and the value left in `enter` differs between them.

> If the ray is parallel to the plane, function returns `false` and sets
> `enter` to zero.

> If the ray is pointing in the opposite direction than the plane, function
> returns `false` and sets `enter` to the distance along the ray (negative
> value).

**Zero when parallel, a negative distance when pointing away.** Both are false
so one `if` filters them, but **knowing which one tells you the cause.**

- **Parallel** is when the camera sits level with the plane. Hard to hit in
  top-down; it shows up when you drop the camera to ground height for effect.
- **Pointing away** really does happen in top-down. Aim the cursor above the
  horizon and the ray heads away from the `y = 0` plane.

When it's false the clipping's code **just skips the rotation.** That's the
safe choice, but the symptom reads as "the character doesn't turn when I move
the cursor to the top of the screen". It fails quietly, which makes the cause
hard to find. One log there ends it on the spot.

## mousePosition is an API the docs tell you not to use

The `Input.mousePosition` page's description opens like this.

> The current mouse position in pixel coordinates. (Read Only).

> Note: This API is part of the legacy Input Manager.

> The recommended best practice is that you don't use this API in new
> projects.

> For new projects, use the Input System package.

**The docs directly tell you not to use it in new projects.** That's also why
all four of this blog's input posts are on the Input System. Here are the names
on the replacement road.

> An input device representing a mouse.

> The mouse that was added or updated last or null if there is no mouse
> connected to the system.

`Mouse` and `Mouse.current`, and it's documented as **null when there's no
mouse**. The coordinates live on the base class.

> Base class for pointer-style devices moving on a 2D screen.

> The current pointer coordinates in window space.

That's `Pointer.position`, of type `Vector2Control`. So in one line,
`Mouse.current.position.ReadValue()` goes where `Input.mousePosition` was.
**A `Vector2` comes back, so it widens to `Vector3` when passed to
`ScreenPointToRay`** — and since `z` is ignored anyway, that's fine.

The back end setting is worth noting too.

> In the Other Settings section, set Active Input Handling to select a back
> end:

> Input Manager (Old): Builds have the ENABLE_LEGACY_INPUT_MANAGER=1 C#
> #define.

> Input System Package (New): Builds have the ENABLE_INPUT_SYSTEM=1 C#
> #define.

> Both: Builds have both of the C# #define.

**Each setting has a different `#define`, and you pick one of three.** What
answering the question at install time does is written down as well.

> Select Yes to enable the Input System back ends and disable the Input
> Manager back ends.

**Turn on the new back end and the legacy one is disabled.** Exactly what
happens to a `UnityEngine.Input` call in that state **isn't written on that
page, and I couldn't verify it.** What I verified stops at "the legacy back end
is disabled" and "the `#define` differs per setting". The widely repeated "it
throws an exception" doesn't get written here.

## The common wisdom about Camera.main doesn't match the current docs

The clipping reads `Camera.main` on every call. The common advice about that is
"it runs `FindGameObjectWithTag`, so cache it", but **the current docs say
something else.**

> The first enabled Camera component that is tagged "MainCamera" (Read Only).

> If there is no enabled Camera component with the "MainCamera" tag, this
> property is null.

> Internally, Unity caches all GameObjects with the "MainCamera" tag.

> When you access this property, Unity returns the first valid result from its
> cache.

> Accessing this property has a small CPU overhead, comparable to calling
> GameObject.GetComponent.

> Where CPU performance is important, consider caching this property.

**Unity caches it internally**, it says. The cost is "comparable to calling
GameObject.GetComponent", which is why the advice isn't "never use it per
frame" but **"consider caching this property" where performance matters.**
Reading it in a rotation function every frame does call for caching, but
**explaining the reason as `FindGameObjectWithTag` doesn't match the current
docs.**

The more urgent sentence is the second. **It's null when nothing is tagged.**
The clipping's `Camera.main.ScreenPointToRay(...)` is a
`NullReferenceException` in that case, and it shows up right after making a new
scene that lost its camera tag. That's also why that page's reference line is
"Additional resources: Tags". What the Inspector's `Tag` field actually does is
written up in
[What Decides Draw Order Is Three Things, Not Two](/en/posts/sorting-layer-order/).

## LookAt turns instantly

There's no interpolation in the docs. `LookAt`'s description is "Rotates the
transform so the forward vector points at `worldPosition`.", and **it's done
that frame.** That's where the feel of a top-down shooter character snapping to
the cursor comes from.

To give it a turn speed, build a target rotation and interpolate instead of
using `LookAt`. That shape is already in the example of
[What FreezePositionY Freezes Is World Y](/en/posts/rigidbody-constraints/) as
the `Quaternion.LookRotation` + `Quaternion.RotateTowards` pair. This post
doesn't explain that side again; **it only leaves it in the example below as an
option.**

Worth noting is that `LookAt` has a second argument too.

> public void LookAt(Vector3 worldPosition, Vector3 worldUp = Vector3.up);

> Vector specifying the upward direction.

Its default is `Vector3.up`, and the "only when forward is perpendicular"
condition from the earlier section hangs on this argument. **Put the plane at
the object's position and that condition is satisfied on its own, so you never
touch this argument.**

## There's a separate road that uses colliders instead of a plane

There's one more road to the same "world coordinate the mouse points at". It
hits a **collider** rather than a plane. You pass the same `Ray`, but the
function receiving it is different.

> public static bool Raycast(Ray ray, out RaycastHit hitInfo,
> float maxDistance = Mathf.Infinity, int layerMask = DefaultRaycastLayers,
> QueryTriggerInteraction queryTriggerInteraction =
> QueryTriggerInteraction.UseGlobal);

> bool Returns true when the ray intersects any collider, otherwise false.

> If true is returned, `hitInfo` will contain more information about where the
> closest collider was hit.

And the point comes out directly, without going through a distance.

> The impact point in world space where the ray hit the collider.

That's `RaycastHit.point`. `Plane.Raycast` returned a distance you had to turn
into a point with `GetPoint`; on this road **the point of impact is the
result.**

The two aren't substitutes for each other. Their premises differ.

| | `Plane.Raycast` (this post) | `Physics.Raycast` |
| --- | --- | --- |
| What it needs | one plane (normal + a point) | **colliders** in the scene |
| How you get the point | distance → `Ray.GetPoint` | `RaycastHit.point` |
| When it's false | parallel, or pointing away | nothing was hit |
| What decides the height | I do, with the plane | the terrain that was hit |
| Filtering | none | `layerMask` · trigger setting |
| Cost | one plane and arithmetic | a physics query |

**If you have to follow the terrain's actual height, the collider road is
right.** On stairs or a slope, the height of the point the cursor indicates
comes out as-is. Conversely, **if you want to fix the plane the character turns
on, this post's method** is right — the rotation stays horizontal however bumpy
the terrain is.

The collider road carries two more premises. One is filtering.

> A Layer mask that is used to selectively filter which colliders are
> considered when casting a ray.

Its default is `DefaultRaycastLayers`, and what that default leaves out and
takes in is written up in this blog's
[OverlapSphere Doesn't Ignore the Ignore Raycast Layer](/en/posts/physics-overlapsphere/).
The other is the starting point.

> Raycasts will not detect Colliders for which the Raycast origin is inside the
> Collider.

**If the ray's origin is inside a collider, that collider isn't detected.** As
the earlier section showed, `ScreenPointToRay`'s ray **starts on the camera's
near plane**, so in a setup where the camera sits inside some collider, that
collider gets passed over. The plane method has no such condition.

Getting world coordinates from colliders is its own subject, so this post stops
at the comparison. There's one more clipping on the same topic, so **that road
belongs to that post.**

## Where and why you'd use it

### A working example

The clipping's structure is kept and three places changed — **the plane goes at
the object's position**, **`Camera.main` is cached**, and **input is read from
the Input System.** The third follows the docs telling you not to use the
legacy API.

```csharp file="Scripts/Player/MouseLook.cs"
using UnityEngine;
using UnityEngine.InputSystem;

public class MouseLook : MonoBehaviour
{
    [Header("Rotation")]
    [Tooltip("0 turns instantly. Larger turns that many degrees per second")]
    [Min(0f)]
    [SerializeField]
    private float _turnSpeed;

    [Header("Diagnostics")]
    [Tooltip("Logs frames where the ray missed the plane")]
    [SerializeField]
    private bool _logMisses;

    private Camera _camera;

    private void Awake()
    {
        // The docs say "consider caching this property". And it's null when
        // nothing is tagged, so that gets checked once here.
        _camera = Camera.main;

        if (_camera == null)
        {
            Debug.LogError("There is no camera tagged MainCamera.", this);
        }
    }

    private void Update()
    {
        Rotate();
    }

    private void Rotate()
    {
        if (_camera == null)
        {
            return;
        }

        // Read from the Input System instead of the legacy
        // Input.mousePosition. The docs say current is null with no mouse.
        Mouse mouse = Mouse.current;

        if (mouse == null)
        {
            return;
        }

        Vector2 screenPoint = mouse.position.ReadValue();
        Ray cameraRay = _camera.ScreenPointToRay(screenPoint);

        // Put the plane at 'my position' rather than the origin. Then the
        // intersection lands at the same height from the start and there's no
        // need to swap the Y back in.
        Plane groundPlane = new Plane(Vector3.up, transform.position);

        if (!groundPlane.Raycast(cameraRay, out float rayLength))
        {
            // enter is 0 when parallel and a negative distance when pointing
            // away. Both land here. Skip it quietly and you get "it doesn't
            // turn when I point upward".
            if (_logMisses)
            {
                Debug.Log($"The ray missed the plane. enter = {rayLength}",
                    this);
            }

            return;
        }

        Vector3 lookPoint = cameraRay.GetPoint(rayLength);
        Vector3 direction = lookPoint - transform.position;

        // The direction nears zero when the cursor overlaps your own feet.
        // Cut it here so LookRotation never receives zero.
        if (direction.sqrMagnitude < 0.0001f)
        {
            return;
        }

        if (_turnSpeed <= 0f)
        {
            // Instant. No Y patch, because the plane is at the same height.
            transform.LookAt(lookPoint);
            return;
        }

        Quaternion target = Quaternion.LookRotation(direction, Vector3.up);
        transform.rotation = Quaternion.RotateTowards(
            transform.rotation, target, _turnSpeed * Time.deltaTime);
    }
}
```

There's a reason `_camera` doesn't use `?.`. It's a `UnityEngine.Object`, and a
reference left empty in the Inspector can end up in a state that **looks like
null but isn't C#'s null**. So it uses `== null` / `!= null` comparisons.
`Mouse` is a plain C# object, but it's written the same way for consistency.

Declaring `out float rayLength` inside the `if` is deliberate. The clipping
declares the variable up front, but **the `enter` value matters in the false
case too**, so putting the declaration at the call site makes it usable in the
log right away.

Leave `_turnSpeed` at `0` and it takes the `LookAt` road; a positive value
takes the interpolation road. **They're in one function because the two feel
different.** Which one is right is the game's call.

### How to choose

| Situation | What to use |
| --- | --- |
| A world direction from screen coordinates | `Camera.ScreenPointToRay` (starts at the near plane) |
| Cutting the ray into a point | `Plane.Raycast` + `Ray.GetPoint` |
| A point at the character's own height | `new Plane(Vector3.up, transform.position)` |
| The ground is fixed at `y = 0` | `new Plane(Vector3.up, Vector3.zero)` |
| Making a plane from three points | `Plane(a, b, c)` (clockwise seen from above) |
| Facing instantly | `transform.LookAt` |
| Giving it a turn speed | `Quaternion.LookRotation` + `RotateTowards` |
| Mouse coordinates (new) | `Mouse.current.position.ReadValue()` |
| Mouse coordinates (legacy) | `Input.mousePosition` — the docs advise against it |
| A camera reference | cache `Camera.main` once + a null check |
| Telling the two miss causes apart | whether `enter` is 0 or negative |
| Following the terrain's real height | `Physics.Raycast` + `RaycastHit.point` |
| Fixing the rotation plane horizontal | `Plane.Raycast` (this post's method) |
| Hitting only certain layers | `Physics.Raycast`'s `layerMask` |

Here's the order to judge in.

- **Decide where the plane goes first.** That sets the intersection's height,
  and the height sets `LookAt`'s tilt. The patch code is a consequence of
  choosing the plane.
- **Don't leave the false branch empty.** Skip it quietly and you get "it
  doesn't turn when I point upward", with a cause that's hard to find.
- **Take the camera once.** The docs' advice is "consider caching", and it's
  `null` when nothing is tagged.
- **Read input with the new package.** The docs say not to use the legacy API
  in new projects.
- **Plane or collider splits on "who decides the height".** Plane if you want
  the rotation horizontal, collider if it has to follow the terrain.

### Where not to use it

- **Assuming the `y = 0` plane is "the scene's floor".** It only holds while
  the character is at that height. The point the plane passes through is a
  constructor argument.
- **Swapping only the intersection's Y.** It works, but it's a patch for a
  misplaced plane. Move the plane and that line disappears.
- **Treating `Plane.Raycast`'s false as one case.** `enter` is 0 when parallel
  and a negative distance when pointing away.
- **Leaving no log in the false case.** The symptom reads as "it sometimes
  doesn't turn".
- **Explaining `Camera.main` as running `FindGameObjectWithTag`.** The current
  docs say it uses an internal cache and costs about as much as
  `GetComponent`.
- **Using `Camera.main` without a null check.** It's `null` when nothing is
  tagged.
- **Using `Input.mousePosition` in a new project.** The docs wrote "The
  recommended best practice is that you don't use this API in new projects".
- **Using `Mouse.current` without a null check.** It's documented as `null`
  when there's no mouse.
- **Reading meaning into the `z` you pass to `ScreenPointToRay`.** "Unity
  ignores the z coordinate".
- **Expecting interpolation from `LookAt`.** It's done that frame. For a speed,
  build a target rotation and interpolate.
- **Treating the plane method and the collider method as the same thing.** The
  former needs only a plane, the latter needs colliders. What decides the
  height differs too.
- **Switching to `Physics.Raycast` without thinking about the origin.** The
  docs wrote "Raycasts will not detect Colliders for which the Raycast origin
  is inside the Collider", and this ray starts on the camera's near plane.

## Summary

- The clipping's method is **right.** The order is screen coordinates → ray →
  distance to the plane → point, the ray is **"starting on the near plane of
  the camera"**, and the `z` is ignored.
- So **what decides the final point is the plane, not the ray.** As the
  constructor says, "goes through a point `inPoint`" — the point the plane
  passes through is mine to choose.
- The clipping's Y patch is **an attempt to satisfy `LookAt`'s condition** —
  "The up vector of the rotation will only match the `worldUp` vector if the
  forward direction is perpendicular to `worldUp`."
- **Put the plane at `transform.position` and that patch disappears.** The
  intersection lands at the same height from the start.
- The clipping's comment that "the y=0 plane == the plane the objects in the
  scene are placed on" is **an assumption, not a fact.** It breaks on hills,
  floors and lifted pivots.
- `Plane.Raycast`'s false comes in **two**. `enter` is **0** when parallel and
  **a negative distance** when pointing away. In top-down the latter really
  happens, when the cursor points above the horizon.
- **`Input.mousePosition` is an API the docs mark as discouraged** — "This API
  is part of the legacy Input Manager." / "don't use this API in new projects".
  The replacement is `Mouse.current.position` (`Vector2Control`, "window
  space"), and `Mouse.current` is **null when there's no mouse**.
- The back end is picked in `Active Input Handling` and each setting has a
  different `#define`. Turning on the new one **disables the legacy back end.**
  What a `UnityEngine.Input` call does in that state isn't on that page, so I
  couldn't verify it.
- **`Camera.main` uses an internal cache**, the current docs say. The cost is
  "comparable to calling GameObject.GetComponent" and the advice is "consider
  caching". The more urgent part is that it's **`null` when nothing is
  tagged.**
- **`LookAt` turns instantly.** No interpolation in the docs. For a turn speed,
  build a target rotation and interpolate.
- There's a **separate road that gets the same coordinate from colliders.**
  `Physics.Raycast` "Returns true when the ray intersects any collider" and the
  point comes straight out as `RaycastHit.point`. It's **the road where the
  terrain decides the height**, so it belongs in different places than this
  post's method. The condition that an origin inside a collider isn't detected
  only exists on that road.

---

### References

- [Camera.main — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera-main.html)
- [Camera.ScreenPointToRay — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Camera.ScreenPointToRay.html)
- [Plane constructor — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Plane-ctor.html)
- [Plane.Raycast — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Plane.Raycast.html)
- [Ray.GetPoint — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Ray.GetPoint.html)
- [Transform.LookAt — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Transform.LookAt.html)
- [Physics.Raycast — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Physics.Raycast.html)
- [RaycastHit.point — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/RaycastHit-point.html)
- [Input.mousePosition — Unity 6.6 Scripting Reference](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Input-mousePosition.html)
- [Mouse — Input System API 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Mouse.html)
- [Pointer — Input System API 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/api/UnityEngine.InputSystem.Pointer.html)
- [Installation — Input System 1.20](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/manual/Installation.html)

The starting point for this post was
[\[유니티/C#\] 마우스 위치로 바라보기](https://jinsso.tistory.com/15)
(진서박, 2023-07-12), in Korean; the quotes from it are my translations. I
followed its structure for getting world coordinates from a ray and a plane as
written, and checked each item against the current Unity 6.6 scripting
reference and the Input System 1.20 docs. The plane's position, the false
branch and the input API sides, which aren't in the original, came from the same
docs. Checked on 2026-10-13.
